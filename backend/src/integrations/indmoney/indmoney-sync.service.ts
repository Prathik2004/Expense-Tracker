import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IndmoneyConnectionDocument } from '../../schemas/indmoney-connection.schema';
import { InvestmentDocument } from '../../schemas/investment.schema';
import { IndmoneyClientService } from './indmoney-client.service';
import { IndmoneyNormalizerService } from './indmoney-normalizer.service';
import { decrypt, encrypt } from '../../utils/encryption.util';
import { SyncResult } from './indmoney.types';
import { PortfolioSnapshotDocument } from '../../schemas/portfolio-snapshot.schema';

@Injectable()
export class IndmoneySyncService {
  private readonly logger = new Logger(IndmoneySyncService.name);

  constructor(
    @InjectModel('IndmoneyConnection') private connModel: Model<IndmoneyConnectionDocument>,
    @InjectModel('Investment') private investmentModel: Model<InvestmentDocument>,
    @InjectModel('PortfolioSnapshot') private portfolioSnapshotModel: Model<PortfolioSnapshotDocument>,
    private client: IndmoneyClientService,
    private normalizer: IndmoneyNormalizerService,
  ) {}

  async syncForUser(userId: string): Promise<SyncResult> {
    // Prevent concurrent syncs by setting a DB flag or using job queue — simplified here
    const conn = await this.connModel.findOne({ userId: new Types.ObjectId(userId), provider: 'indmoney' }).exec();
    if (!conn || !conn.accessTokenEncrypted) throw new Error('INDMONEY_NOT_CONNECTED');
    if (conn.lastSyncStatus === 'running') throw new ConflictException('INDMONEY_SYNC_IN_PROGRESS');

    conn.lastSyncStatus = 'running';
    await conn.save();

    // Refresh token if close to expiry
    const now = new Date();
    if (conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() - now.getTime() < 60 * 1000) {
      // try refresh
      try {
        const refreshToken = conn.refreshTokenEncrypted ? decrypt(conn.refreshTokenEncrypted) : undefined;
        if (refreshToken) {
          const tokenResp = await this.client.refreshToken(refreshToken);
          if (tokenResp?.access_token) {
            conn.accessTokenEncrypted = encrypt(tokenResp.access_token) as any;
            if (tokenResp.refresh_token) conn.refreshTokenEncrypted = encrypt(tokenResp.refresh_token) as any;
            if (tokenResp.expires_in) conn.tokenExpiresAt = new Date(Date.now() + Number(tokenResp.expires_in) * 1000);
            await conn.save();
          }
        }
      } catch (err) {
        this.logger.warn('Token refresh failed, attempting to use existing token');
      }
    }

    const accessToken = decrypt(conn.accessTokenEncrypted!);
    let raw: any;
    try {
      raw = await this.client.fetchPortfolioWithAccessToken(accessToken);
    } catch (error: any) {
      conn.lastSyncStatus = 'failed';
      conn.lastSyncError = error?.message || 'INDmoney portfolio request failed';
      await conn.save();
      throw error;
    }
    const holdings = this.normalizer.normalizePortfolio(raw);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const h of holdings) {
      try {
        const res = await this.investmentModel.findOneAndUpdate(
          { userId: new Types.ObjectId(userId), source: 'indmoney', externalId: h.externalId },
          {
            $set: {
              name: h.name,
              assetType: h.assetType,
              symbol: h.symbol,
              isin: h.isin,
              quantity: h.quantity,
              averagePrice: h.averagePrice,
              currentPrice: h.currentPrice,
              investedAmount: h.investedAmount || 0,
              currentValue: h.currentValue || 0,
              currency: h.currency || 'INR',
              lastSyncedAt: new Date(),
            },
            $setOnInsert: {
              userId: new Types.ObjectId(userId),
              source: 'indmoney',
              externalId: h.externalId,
            },
          },
          { upsert: true, new: true }
        ).exec();

        const r: any = res;
        if (r?.createdAt && r?.updatedAt && r.createdAt.getTime() === r.updatedAt.getTime()) {
          created++;
        } else {
          updated++;
        }
      } catch (err: any) {
        // unique race condition or validation
        if (err?.code === 11000) {
          skipped++;
        } else {
          this.logger.error('Failed to upsert investment', err);
        }
      }
    }

    const currentValue = holdings.reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
    const investedAmount = holdings.reduce((sum, holding) => sum + (Number(holding.investedAmount) || 0), 0);
    await this.portfolioSnapshotModel.create({
      userId: new Types.ObjectId(userId),
      capturedAt: new Date(),
      investedAmount,
      currentValue,
      source: 'indmoney',
      allocation: holdings.reduce((result, holding) => {
        const key = holding.assetType || 'Other';
        result[key] = (result[key] || 0) + (Number(holding.currentValue) || 0);
        return result;
      }, {} as Record<string, number>),
    });

    const result: SyncResult = {
      status: 'success',
      fetched: holdings.length,
      created,
      updated,
      skipped,
      failed: 0,
      syncedAt: new Date().toISOString(),
    };

    // update connection lastSyncedAt
    conn.lastSyncedAt = new Date();
    conn.lastSyncStatus = 'success';
    conn.lastSyncError = undefined;
    await conn.save();

    return result;
  }

  async importBrowserExport(userId: string, payload: any): Promise<SyncResult> {
    const rawHoldings = Array.isArray(payload?.holdings)
      ? payload.holdings
      : this.holdingsFromTables(payload?.tables).length > 0
        ? this.holdingsFromTables(payload?.tables)
        : this.holdingsFromVisibleText(payload?.visibleText);
    const holdings = this.normalizer.normalizePortfolio(rawHoldings);
    if (holdings.length === 0) throw new ConflictException('No holdings were detected in this browser export. Open the INDmoney holdings table before exporting.');

    const separateCategoryIds = new Set(['indmoney-gold', 'indmoney-silver', 'indmoney-liquid']);
    const presentSeparateIds = new Set(holdings.filter((holding) => separateCategoryIds.has(holding.externalId)).map((holding) => holding.externalId));
    const missingSeparateIds = Array.from(separateCategoryIds).filter((id) => !presentSeparateIds.has(id));
    if (missingSeparateIds.length > 0) {
      const previousSeparateCategories = await this.investmentModel.find({
        userId: new Types.ObjectId(userId),
        source: 'indmoney',
        externalId: { $in: missingSeparateIds },
      }).lean();
      for (const category of previousSeparateCategories) {
        holdings.push({
          externalId: category.externalId,
          name: category.name,
          assetType: category.assetType,
          currentValue: category.currentValue,
          investedAmount: category.investedAmount,
          currency: category.currency || 'INR',
        });
      }
    }

    const indstocks = holdings.find((holding) => holding.externalId === 'indmoney-indstocks');
    const separateValues = holdings
      .filter((holding) => separateCategoryIds.has(holding.externalId));
    const metalsValue = separateValues
      .filter((holding) => holding.externalId === 'indmoney-gold' || holding.externalId === 'indmoney-silver')
      .reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
    if (indstocks && metalsValue > 0) {
      indstocks.currentValue = Math.max(0, (Number(indstocks.currentValue) || 0) - metalsValue);
      indstocks.investedAmount = Math.max(0, (Number(indstocks.investedAmount) || 0) - metalsValue);
    }
    const mutualFunds = holdings.find((holding) => holding.externalId === 'indmoney-mutual-funds');
    const liquidFund = holdings.find((holding) => holding.externalId === 'indmoney-liquid');
    if (mutualFunds && liquidFund) {
      const liquidValue = Number(liquidFund.currentValue) || 0;
      mutualFunds.currentValue = Math.max(0, (Number(mutualFunds.currentValue) || 0) - liquidValue);
      mutualFunds.investedAmount = Math.max(0, (Number(mutualFunds.investedAmount) || 0) - (Number(liquidFund.investedAmount) || liquidValue));
    }

    let created = 0;
    let updated = 0;
    for (const holding of holdings) {
      const existing = await this.investmentModel.findOne({ userId: new Types.ObjectId(userId), source: 'indmoney', externalId: holding.externalId }).exec();
      const { externalId, ...holdingFields } = holding;
      await this.investmentModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), source: 'indmoney', externalId },
        { $set: { ...holdingFields, lastSyncedAt: new Date() }, $setOnInsert: { userId: new Types.ObjectId(userId), source: 'indmoney', externalId } },
        { upsert: true, new: true },
      ).exec();
      existing ? updated++ : created++;
    }

    const currentValue = holdings.reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
    const investedAmount = holdings.reduce((sum, holding) => sum + (Number(holding.investedAmount) || 0), 0);
    await this.portfolioSnapshotModel.create({ userId: new Types.ObjectId(userId), capturedAt: new Date(), investedAmount, currentValue, source: 'indmoney' });
    return { status: 'success', fetched: holdings.length, created, updated, skipped: 0, failed: 0, syncedAt: new Date().toISOString() };
  }

  private holdingsFromTables(tables: any): any[] {
    if (!Array.isArray(tables)) return [];
    return tables.flatMap((table: any) => {
      const headers = (table.headers || []).map((header: any) => String(header).toLowerCase());
      const column = (names: string[]) => headers.findIndex((header: string) => names.some(name => header.includes(name)));
      const nameIndex = column(['name', 'holding', 'security', 'scheme', 'stock']);
      const valueIndex = column(['current value', 'market value', 'value', 'present value']);
      const investedIndex = column(['invested amount', 'invested value', 'invested']);
      const quantityIndex = column(['quantity', 'units']);
      const symbolIndex = column(['symbol', 'ticker', 'isin']);
      return (table.rows || []).map((row: any[]) => ({
        name: nameIndex >= 0 ? row[nameIndex] : undefined,
        currentValue: valueIndex >= 0 ? row[valueIndex] : undefined,
        investedAmount: investedIndex >= 0 ? row[investedIndex] : undefined,
        quantity: quantityIndex >= 0 ? row[quantityIndex] : undefined,
        symbol: symbolIndex >= 0 ? row[symbolIndex] : undefined,
      })).filter((holding: any) => holding.name);
    });
  }

  private holdingsFromVisibleText(text: unknown): any[] {
    if (typeof text !== 'string') return [];
    const assetsSection = text.split('MY ASSETS')[1]?.split('Fixed Income')[0] || '';
    const assetPattern = /(INDstocks|US Stocks|Mutual Funds|NPS|EPF|Bonds|PPF|ESOPs\/RSUs)\s+\u20b9([\d,.]+)([KLM])?/g;
    const holdings: any[] = [];
    let match: RegExpExecArray | null;
    while ((match = assetPattern.exec(assetsSection)) !== null) {
      const multiplier = match[3] === 'L' ? 100000 : match[3] === 'M' ? 1000000 : match[3] === 'K' ? 1000 : 1;
      const value = Number(match[2].replace(/,/g, '')) * multiplier;
      if (Number.isFinite(value)) holdings.push({ externalId: `indmoney-${match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: match[1], assetType: match[1], currentValue: value, investedAmount: value, currency: 'INR' });
    }
    const networthSection = text.split('My Networth')[1] || '';
    const networthPattern = /(Silver|Gold|Liquid)\s+\u20b9([\d,.]+)([KLM])?/g;
    while ((match = networthPattern.exec(networthSection)) !== null) {
      const multiplier = match[3] === 'L' ? 100000 : match[3] === 'M' ? 1000000 : match[3] === 'K' ? 1000 : 1;
      const value = Number(match[2].replace(/,/g, '')) * multiplier;
      if (Number.isFinite(value)) holdings.push({ externalId: `indmoney-${match[1].toLowerCase()}`, name: match[1] === 'Liquid' ? 'Liquid Fund' : match[1], assetType: match[1] === 'Liquid' ? 'Liquid Fund' : match[1], currentValue: value, investedAmount: value, currency: 'INR' });
    }
    const indstocks = holdings.find((holding) => holding.externalId === 'indmoney-indstocks');
    const preciousMetalsValue = holdings
      .filter((holding) => holding.externalId === 'indmoney-gold' || holding.externalId === 'indmoney-silver')
      .reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
    if (indstocks && preciousMetalsValue > 0) {
      indstocks.currentValue = Math.max(0, (Number(indstocks.currentValue) || 0) - preciousMetalsValue);
      indstocks.investedAmount = Math.max(0, (Number(indstocks.investedAmount) || 0) - preciousMetalsValue);
    }
    return holdings;
  }
}
