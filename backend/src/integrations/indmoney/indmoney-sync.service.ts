import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IndmoneyConnectionDocument } from '../../schemas/indmoney-connection.schema';
import { InvestmentDocument } from '../../schemas/investment.schema';
import { IndmoneyClientService } from './indmoney-client.service';
import { IndmoneyNormalizerService } from './indmoney-normalizer.service';
import { decrypt, encrypt } from '../../utils/encryption.util';
import { SyncResult } from './indmoney.types';

@Injectable()
export class IndmoneySyncService {
  private readonly logger = new Logger(IndmoneySyncService.name);

  constructor(
    @InjectModel('IndmoneyConnection') private connModel: Model<IndmoneyConnectionDocument>,
    @InjectModel('Investment') private investmentModel: Model<InvestmentDocument>,
    private client: IndmoneyClientService,
    private normalizer: IndmoneyNormalizerService,
  ) {}

  async syncForUser(userId: string): Promise<SyncResult> {
    // Prevent concurrent syncs by setting a DB flag or using job queue — simplified here
    const conn = await this.connModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!conn || !conn.accessTokenEncrypted) throw new Error('INDMONEY_NOT_CONNECTED');

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
    const raw = await this.client.fetchPortfolioWithAccessToken(accessToken);
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
    await conn.save();

    return result;
  }
}
