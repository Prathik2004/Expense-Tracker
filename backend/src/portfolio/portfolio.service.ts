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
import { PortfolioSnapshotDocument } from '../schemas/portfolio-snapshot.schema';
import { CurrencyConversionService } from '../services/currency-conversion.service';
import { CreatePortfolioEntryDto } from './dto/create-portfolio-entry.dto';

const TRACKED_CATEGORIES = [
    'Indian Stocks',
    'US Stocks',
    'Mutual Funds',
    'Liquid Fund',
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
        @InjectModel('PortfolioSnapshot') private portfolioSnapshotModel: Model<PortfolioSnapshotDocument>,
        private currencyService: CurrencyConversionService,
    ) { }

    async createBulk(userId: string, dtos: CreatePortfolioEntryDto[]): Promise<any> {
        const holdings = dtos.map(dto => ({
            category: dto.category,
            amount: Number(dto.amount),
            description: dto.description || 'Manual portfolio entry',
            date: dto.date ? new Date(dto.date) : new Date(),
        }));

        const result = await this.upsertHoldings(userId, holdings, 'manual');
        await this.recordSnapshot(userId, result, 'manual');
        return result;
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

        const aggregateLiquidFund = normalizedInvestments.find((investment: any) => this.isAggregateInvestment(investment, 'Liquid Fund'));
        const aggregateMutualFunds = normalizedInvestments.find((investment: any) => this.isAggregateInvestment(investment, 'Mutual Funds'));
        const aggregateGold = normalizedInvestments.find((investment: any) => this.isAggregateInvestment(investment, 'Gold'));
        const aggregateSilver = normalizedInvestments.find((investment: any) => this.isAggregateInvestment(investment, 'Silver'));
        const aggregateIndianStocks = normalizedInvestments.find((investment: any) => this.isAggregateInvestment(investment, 'Indian Stocks'));
        if (aggregateLiquidFund && aggregateMutualFunds) {
            const liquidCurrentValue = Number(aggregateLiquidFund.convertedCurrentValue) || 0;
            const liquidInvestedAmount = Number(aggregateLiquidFund.convertedInvestedAmount) || liquidCurrentValue;
            aggregateMutualFunds.convertedCurrentValue = Math.max(0, Number(aggregateMutualFunds.convertedCurrentValue) - liquidCurrentValue);
            aggregateMutualFunds.convertedInvestedAmount = Math.max(0, Number(aggregateMutualFunds.convertedInvestedAmount) - liquidInvestedAmount);
            aggregateMutualFunds.currentValue = aggregateMutualFunds.convertedCurrentValue;
            aggregateMutualFunds.investedAmount = aggregateMutualFunds.convertedInvestedAmount;
        }
        if (aggregateIndianStocks && (aggregateGold || aggregateSilver)) {
            const metalInvestments = [aggregateGold, aggregateSilver].filter(Boolean) as any[];
            const metalsValue = metalInvestments.reduce((sum, investment) => sum + (Number(investment.convertedCurrentValue) || 0), 0);
            const metalsInvested = metalInvestments.reduce((sum, investment) => sum + (Number(investment.convertedInvestedAmount) || 0), 0);
            aggregateIndianStocks.convertedCurrentValue = Math.max(0, Number(aggregateIndianStocks.convertedCurrentValue) - metalsValue);
            aggregateIndianStocks.convertedInvestedAmount = Math.max(0, Number(aggregateIndianStocks.convertedInvestedAmount) - metalsInvested);
            aggregateIndianStocks.currentValue = aggregateIndianStocks.convertedCurrentValue;
            aggregateIndianStocks.investedAmount = aggregateIndianStocks.convertedInvestedAmount;
        }

        investedSum = normalizedInvestments.reduce((sum, investment: any) => sum + (Number(investment.convertedInvestedAmount) || 0), 0);
        currentValueSum = normalizedInvestments.reduce((sum, investment: any) => sum + (Number(investment.convertedCurrentValue) || 0), 0);

        const providerCategories = new Set(
            investments.map((investment: any) => this.getInvestmentCategory(investment)),
        );
        const includedManualHoldings = holdings.filter(
            (holding) => !providerCategories.has(this.normalizeInvestmentCategory(holding.category)),
        );
        const excludedManualHoldings = holdings.filter(
            (holding) => providerCategories.has(this.normalizeInvestmentCategory(holding.category)),
        );
        const manualValue = includedManualHoldings.reduce((sum, item) => sum + item.amount, 0);
        const manualInvested = manualValue;
        const totalCurrentValue = manualValue + currentValueSum;
        const totalInvested = manualInvested + investedSum;
        const gainLoss = totalCurrentValue - totalInvested;

        // Get INDmoney connection last sync if exists
        const indConn = await this.indConnModel.findOne({ userId: new Types.ObjectId(userId), provider: 'indmoney' }).lean();

        const lastSync = await this.portfolioSyncLogModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean();

        return {
            totalInvested,
            portfolioValue: totalCurrentValue,
            currentValue: totalCurrentValue,
            gainLoss,
            gainLossPercentage: totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0,
            breakdown: {
                manual: { investedAmount: manualInvested, currentValue: manualValue },
                indmoney: { investedAmount: investedSum, currentValue: currentValueSum },
            },
            holdings: [
                ...includedManualHoldings,
                ...normalizedInvestments.map((investment: any) => ({
                    category: this.getInvestmentCategory(investment),
                    amount: Number(investment.convertedCurrentValue || investment.currentValue || 0),
                    source: 'indmoney',
                    date: investment.lastSyncedAt,
                })),
            ],
            excludedManualHoldings,
            investments: normalizedInvestments,
            snapshots: await this.getSnapshots(userId),
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
            await this.recordSnapshot(userId, holdings, 'excel', syncLog._id.toString());

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

    async getSnapshots(userId: string, limit = 90): Promise<any[]> {
        return this.portfolioSnapshotModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ capturedAt: -1 })
            .limit(Math.min(Math.max(Number(limit) || 90, 1), 365))
            .lean();
    }

    async recordSnapshot(userId: string, holdings: any[], source: 'manual' | 'excel' | 'indmoney' | 'combined', syncId?: string) {
        const currentValue = holdings.reduce((sum, holding) => sum + (Number(holding.amount ?? holding.currentValue) || 0), 0);
        const allocation = holdings.reduce((result, holding) => {
            const key = holding.category || holding.assetType || 'Other';
            result[key] = (result[key] || 0) + (Number(holding.amount ?? holding.currentValue) || 0);
            return result;
        }, {} as Record<string, number>);

        return this.portfolioSnapshotModel.create({
            userId: new Types.ObjectId(userId),
            capturedAt: new Date(),
            investedAmount: currentValue,
            currentValue,
            source,
            syncId,
            allocation,
        });
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

        if (normalized.includes('liquid')) {
            return 'Liquid Fund';
        }

        if (normalized.includes('gold')) {
            return 'Gold';
        }

        if (normalized.includes('silver')) {
            return 'Silver';
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

        const holdingsByCategory = new Map<string, { category: string; amount: number; source?: string; date?: Date }>();

        for (const document of documents) {
            if (!holdingsByCategory.has(document.category)) {
                holdingsByCategory.set(document.category, {
                    category: document.category,
                    amount: Number(document.amount) || 0,
                    source: document.source,
                    date: document.date,
                });
            }
        }

        return Array.from(holdingsByCategory.values()).sort((left, right) => right.amount - left.amount);
    }

    private normalizeInvestmentCategory(value: string): string {
        const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        if (normalized.includes('silver')) return 'Silver';
        if (normalized.includes('gold')) return 'Gold';
        if (normalized.includes('liquid')) return 'Liquid Fund';
        if (normalized.includes('indstock') || normalized.includes('indian stock')) return 'Indian Stocks';
        if (normalized.includes('us stock') || normalized.includes('global equity')) return 'US Stocks';
        if (normalized.includes('mutual fund') || normalized.includes('fund')) return 'Mutual Funds';
        return value;
    }

    private getInvestmentCategory(investment: any): string {
        return this.normalizeInvestmentCategory([
            investment.assetType,
            investment.name,
            investment.symbol,
            investment.isin,
        ].filter(Boolean).join(' '));
    }

    private isAggregateInvestment(investment: any, category: string): boolean {
        const fields = [investment.externalId, investment.name, investment.assetType]
            .filter(Boolean)
            .map((value) => this.normalizeInvestmentCategory(String(value)));
        return fields.includes(category) ||
            (category === 'Indian Stocks' && fields.some((value) => value === 'INDstocks' || value === 'Indian Stocks'));
    }
}
