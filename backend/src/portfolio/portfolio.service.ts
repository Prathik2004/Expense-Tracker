import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { User, UserDocument } from '../schemas/user.schema';
import { PortfolioHoldingDocument } from '../schemas/portfolio-holding.schema';
import { PortfolioSyncLogDocument } from '../schemas/portfolio-sync-log.schema';
import { CreatePortfolioEntryDto } from './dto/create-portfolio-entry.dto';

const TRACKED_CATEGORIES = [
    'Indian Stocks',
    'US Stocks',
    'Mutual Funds',
    'Gold',
    'Silver',
];

type SyncTrigger = 'manual' | 'cron';

type ParsedHolding = {
    category: string;
    amount: number;
};

@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);

    constructor(
        @InjectModel('PortfolioHolding') private portfolioHoldingModel: Model<PortfolioHoldingDocument>,
        @InjectModel('PortfolioSyncLog') private portfolioSyncLogModel: Model<PortfolioSyncLogDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) { }

    async createBulk(userId: string, dtos: CreatePortfolioEntryDto[]): Promise<any> {
        const holdings = dtos.map(dto => ({
            category: dto.category,
            amount: Number(dto.amount),
            description: dto.description || 'Manual portfolio entry',
            date: dto.date ? new Date(dto.date) : new Date(),
        }));

        return this.upsertHoldings(userId, holdings, 'manual');
    }

    async getPortfolio(userId: string): Promise<any> {
        const holdings = await this.getCurrentHoldings(userId);
        const totalTrackedValue = holdings.reduce((sum, item) => sum + item.amount, 0);
        const lastSync = await this.portfolioSyncLogModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean();

        return {
            totalInvested: totalTrackedValue,
            portfolioValue: totalTrackedValue,
            holdings,
            lastSync: lastSync ? {
                trigger: lastSync.trigger,
                status: lastSync.status,
                message: lastSync.message,
                completedAt: lastSync.completedAt,
                sourceFile: lastSync.sourceFile,
            } : null,
        };
    }

    async manualSync(userId: string): Promise<any> {
        return this.syncPortfolio(userId, 'manual');
    }

    async syncPortfolioForCron(): Promise<any> {
        const targetUser = await this.resolveCronTargetUser();

        if (!targetUser) {
            this.logger.warn('Portfolio cron sync skipped because no target user was configured');
            return {
                synced: false,
                skipped: true,
                message: 'Set PORTFOLIO_SYNC_EMAIL or PORTFOLIO_SYNC_USER_ID to enable cron sync.',
            };
        }

        return this.syncPortfolio(targetUser._id.toString(), 'cron');
    }

    async syncPortfolio(userId: string, trigger: SyncTrigger): Promise<any> {
        const syncLog = await this.portfolioSyncLogModel.create({
            userId: new Types.ObjectId(userId),
            trigger,
            status: 'running',
            startedAt: new Date(),
            categoriesUpdated: 0,
            totalValue: 0,
        });

        try {
            const sourceFile = this.getWorkbookPath();
            const parsedHoldings = this.parseWorkbook(sourceFile);

            if (parsedHoldings.length === 0) {
                throw new Error('No tracked asset values were found in the workbook');
            }

            const holdings = await this.upsertHoldings(userId, parsedHoldings, 'excel');
            const totalValue = holdings.reduce((sum, item) => sum + item.amount, 0);

            syncLog.status = 'success';
            syncLog.sourceFile = sourceFile;
            syncLog.completedAt = new Date();
            syncLog.categoriesUpdated = holdings.length;
            syncLog.totalValue = totalValue;
            syncLog.message = `Synced ${holdings.length} tracked assets from OneDrive`;
            await syncLog.save();

            return {
                synced: true,
                holdings,
                totalInvested: totalValue,
                totalValue,
                logId: syncLog._id,
                sourceFile,
            };
        } catch (error: any) {
            syncLog.status = 'failed';
            syncLog.completedAt = new Date();
            syncLog.errorMessage = error?.message || 'Failed to sync portfolio';
            syncLog.message = syncLog.errorMessage;
            await syncLog.save();

            this.logger.error(`Portfolio sync failed for user ${userId}: ${syncLog.errorMessage}`);
            throw error;
        }
    }

    private async resolveCronTargetUser(): Promise<UserDocument | null> {
        const configuredUserId = process.env.PORTFOLIO_SYNC_USER_ID;
        const configuredEmail = process.env.PORTFOLIO_SYNC_EMAIL;

        if (configuredUserId) {
            return this.userModel.findById(configuredUserId).exec();
        }

        if (configuredEmail) {
            return this.userModel.findOne({ email: configuredEmail }).exec();
        }

        const userCount = await this.userModel.countDocuments();
        if (userCount === 1) {
            return this.userModel.findOne().exec();
        }

        return null;
    }

    private getWorkbookPath(): string {
        const workbookPath = process.env.PORTFOLIO_EXCEL_PATH || process.env.ONEDRIVE_PORTFOLIO_EXCEL_PATH;

        if (!workbookPath) {
            throw new Error('Set PORTFOLIO_EXCEL_PATH to the OneDrive workbook path');
        }

        return workbookPath;
    }

    private parseWorkbook(filePath: string): ParsedHolding[] {
        const workbook = XLSX.readFile(filePath, { cellDates: true });
        const sheetName = workbook.SheetNames[5];

        if (!sheetName) {
            throw new Error('Expected portfolio data in sheet 6 of the workbook');
        }

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
        const headerRowIndex = rows.findIndex(row =>
            row.some(cell => this.normalizeCellValue(cell).toUpperCase() === 'INVESTED') &&
            row.some(cell => this.normalizeCellValue(cell).toUpperCase() === 'INVESTED AMOUNT')
        );

        if (headerRowIndex === -1) {
            throw new Error('Could not find INVESTED and INVESTED AMOUNT headers in sheet 6');
        }

        const headerRow = rows[headerRowIndex];
        const investedColumnIndex = headerRow.findIndex(cell => this.normalizeCellValue(cell).toUpperCase() === 'INVESTED');
        const amountColumnIndex = headerRow.findIndex(cell => this.normalizeCellValue(cell).toUpperCase() === 'INVESTED AMOUNT');

        if (investedColumnIndex === -1 || amountColumnIndex === -1) {
            throw new Error('Could not locate INVESTED and INVESTED AMOUNT columns in sheet 6');
        }

        const holdingsMap = new Map<string, number>();

        for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const rawCategory = this.normalizeCellValue(row[investedColumnIndex]);
            const rawAmount = this.normalizeCellValue(row[amountColumnIndex]);

            if (!rawCategory && !rawAmount) {
                continue;
            }

            const category = this.normalizeCategory(rawCategory);
            const amount = this.parseNumericValue(rawAmount);

            if (!category || amount === null) {
                continue;
            }

            holdingsMap.set(category, amount);
        }

        return TRACKED_CATEGORIES
            .map(category => ({
                category,
                amount: holdingsMap.get(category) || 0,
            }))
            .filter(item => item.amount > 0);
    }

    private normalizeCellValue(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        return String(value).trim();
    }

    private parseNumericValue(value: string): number | null {
        const sanitized = value.replace(/[^0-9.-]/g, '');
        if (!sanitized) {
            return null;
        }

        const parsed = Number(sanitized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private normalizeCategory(category: string): string | null {
        const normalized = category.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

        if (!normalized) {
            return null;
        }

        if (normalized.includes('ind') && normalized.includes('stock')) {
            return 'Indian Stocks';
        }

        if ((normalized.includes('us') || normalized.includes('usa') || normalized.includes('america')) && normalized.includes('stock')) {
            return 'US Stocks';
        }

        if (normalized.includes('mutual') || normalized.includes('fund')) {
            return 'Mutual Funds';
        }

        if (normalized.includes('gold')) {
            return 'Gold';
        }

        if (normalized.includes('silver')) {
            return 'Silver';
        }

        const matchingCategory = TRACKED_CATEGORIES.find(item => item.toLowerCase() === normalized);
        return matchingCategory || null;
    }

    private async upsertHoldings(userId: string, holdings: ParsedHolding[], source: 'manual' | 'excel'): Promise<any[]> {
        const now = new Date();

        await Promise.all(
            holdings.map(holding =>
                this.portfolioHoldingModel.findOneAndUpdate(
                    { userId: new Types.ObjectId(userId), category: holding.category },
                    {
                        $set: {
                            amount: holding.amount,
                            source,
                            description: source === 'excel' ? 'Synced from OneDrive workbook' : 'Manually logged portfolio value',
                            date: now,
                            syncedAt: source === 'excel' ? now : undefined,
                        },
                        $setOnInsert: {
                            userId: new Types.ObjectId(userId),
                            category: holding.category,
                        },
                    },
                    { upsert: true, new: true }
                ).exec()
            )
        );

        return this.getCurrentHoldings(userId);
    }

    private async getCurrentHoldings(userId: string): Promise<any[]> {
        const documents = await this.portfolioHoldingModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ updatedAt: -1 })
            .lean();

        const holdingsByCategory = new Map<string, { category: string; amount: number }>();

        for (const document of documents) {
            if (!holdingsByCategory.has(document.category)) {
                holdingsByCategory.set(document.category, {
                    category: document.category,
                    amount: Number(document.amount) || 0,
                });
            }
        }

        return Array.from(holdingsByCategory.values()).sort((left, right) => right.amount - left.amount);
    }
}
