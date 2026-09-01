import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { User, UserDocument } from '../schemas/user.schema';
import { PortfolioHoldingDocument } from '../schemas/portfolio-holding.schema';
import { PortfolioSyncLogDocument } from '../schemas/portfolio-sync-log.schema';
import { InvestmentDocument } from '../schemas/investment.schema';
import { IndmoneyConnectionDocument } from '../schemas/indmoney-connection.schema';
import { CurrencyConversionService } from '../services/currency-conversion.service';
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
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel('Investment') private investmentModel: Model<InvestmentDocument>,
        @InjectModel('IndmoneyConnection') private indConnModel: Model<IndmoneyConnectionDocument>,
        private currencyService: CurrencyConversionService,
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
        // Existing simple holdings
        const holdings = await this.getCurrentHoldings(userId);

        // Investments from external providers (e.g., INDmoney)
        const investments = await this.investmentModel.find({ userId: new Types.ObjectId(userId) }).lean();

        // Determine conversion rates for currencies present
        const currencies = Array.from(new Set(investments.map((i: any) => i.currency || 'INR')));
        const rates: Record<string, number> = {};
        for (const cur of currencies) {
            if (cur === 'INR') { rates[cur] = 1; continue; }
            rates[cur] = await this.currencyService.getRate(cur, 'INR');
        }

        let investedSum = 0;
        let currentValueSum = 0;

        const normalizedInvestments = investments.map((inv: any) => {
            const rate = rates[inv.currency || 'INR'] || 1;
            const invested = Number(inv.investedAmount || 0) * rate;
            const current = Number(inv.currentValue || 0) * rate;
            investedSum += invested;
            currentValueSum += current;
            return {
                ...inv,
                convertedCurrency: 'INR',
                convertedInvestedAmount: invested,
                convertedCurrentValue: current,
                exchangeRate: rate,
            };
        });

        const totalTrackedValue = holdings.reduce((sum, item) => sum + item.amount, 0) + currentValueSum;

        // Get INDmoney connection last sync if exists
        const indConn = await this.indConnModel.findOne({ userId: new Types.ObjectId(userId), provider: 'indmoney' }).lean();

        const lastSync = await this.portfolioSyncLogModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean();

        return {
            totalInvested: investedSum + holdings.reduce((s, h) => s + h.amount, 0),
            portfolioValue: totalTrackedValue,
            holdings,
            investments: normalizedInvestments,
            lastSync: lastSync ? {
                trigger: lastSync.trigger,
                status: lastSync.status,
                message: lastSync.message,
                completedAt: lastSync.completedAt,
                sourceFile: lastSync.sourceFile,
            } : null,
            indmoney: indConn ? {
                status: indConn.status,
                connectedAt: indConn.connectedAt,
                lastSyncedAt: indConn.lastSyncedAt,
                lastSyncStatus: indConn.lastSyncStatus,
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
            const workbookSource = await this.loadWorkbookSource();
            const parsedHoldings = this.parseWorkbook(workbookSource.buffer);

            if (parsedHoldings.length === 0) {
                throw new Error('No tracked asset values were found in the workbook');
            }

            const holdings = await this.upsertHoldings(userId, parsedHoldings, 'excel');
            const totalValue = holdings.reduce((sum, item) => sum + item.amount, 0);

            syncLog.status = 'success';
            syncLog.sourceFile = workbookSource.sourceLabel;
            syncLog.completedAt = new Date();
            syncLog.categoriesUpdated = holdings.length;
            syncLog.totalValue = totalValue;
            syncLog.message = `Synced ${holdings.length} tracked assets from Google Sheets`;
            await syncLog.save();

            return {
                synced: true,
                holdings,
                totalInvested: totalValue,
                totalValue,
                logId: syncLog._id,
                sourceFile: workbookSource.sourceLabel,
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

    private async loadWorkbookSource(): Promise<{
    buffer: Buffer;
    sourceLabel: string;
}> {
    const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;

    if (!sheetUrl) {
        throw new Error(
            'GOOGLE_SHEET_CSV_URL is not configured'
        );
    }

    const response = await fetch(sheetUrl);

    if (!response.ok) {
        throw new Error(
            `Failed to download Google Sheet: ${response.status} ${response.statusText}`
        );
    }

    const csvText = await response.text();

    return {
        buffer: Buffer.from(csvText, 'utf-8'),
        sourceLabel: sheetUrl,
    };
}

    private parseWorkbook(csvBuffer: Buffer): ParsedHolding[] {
    const csv = csvBuffer.toString('utf-8');

    const workbook = XLSX.read(csv, {
        type: 'string',
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new Error('No worksheet found');
    }

    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
    }) as unknown[][];

    const headerRowIndex = rows.findIndex(
        row =>
            row.some(
                cell =>
                    this.normalizeCellValue(cell).toUpperCase() ===
                    'INVESTED'
            ) &&
            row.some(
                cell =>
                    this.normalizeCellValue(cell).toUpperCase() ===
                    'INVESTED AMOUNT'
            )
    );

    if (headerRowIndex === -1) {
        throw new Error(
            'Could not find INVESTED and INVESTED AMOUNT headers'
        );
    }

    const headerRow = rows[headerRowIndex];

    const investedColumnIndex = headerRow.findIndex(
        cell =>
            this.normalizeCellValue(cell).toUpperCase() ===
            'INVESTED'
    );

    const amountColumnIndex = headerRow.findIndex(
        cell =>
            this.normalizeCellValue(cell).toUpperCase() ===
            'INVESTED AMOUNT'
    );

    const holdingsMap = new Map<string, number>();

    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row = rows[rowIndex] || [];

        const rawCategory = this.normalizeCellValue(
            row[investedColumnIndex]
        );

        const rawAmount = this.normalizeCellValue(
            row[amountColumnIndex]
        );

        const category =
            this.normalizeCategory(rawCategory);

        const amount =
            this.parseNumericValue(rawAmount);

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
