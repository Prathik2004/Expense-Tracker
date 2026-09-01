import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IndmoneyAuthService } from './indmoney-auth.service';
import { IndmoneyClientService } from './indmoney-client.service';
import { IndmoneyNormalizerService } from './indmoney-normalizer.service';
import { IndmoneySyncService } from './indmoney-sync.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IndmoneyConnectionDocument } from '../../schemas/indmoney-connection.schema';
import { encrypt, decrypt } from '../../utils/encryption.util';

@Injectable()
export class IndmoneyService {
  private readonly logger = new Logger(IndmoneyService.name);

  constructor(
    private auth: IndmoneyAuthService,
    private client: IndmoneyClientService,
    private normalizer: IndmoneyNormalizerService,
    private syncService: IndmoneySyncService,
    @InjectModel('IndmoneyConnection') private connModel: Model<IndmoneyConnectionDocument>,
  ) {}

  async buildAuthorizeUrlForUser(userId: string) {
    const authUrl = process.env.INDMONEY_OAUTH_AUTHORIZE_URL;
    const clientId = process.env.INDMONEY_CLIENT_ID;
    const redirect = process.env.INDMONEY_REDIRECT_URI;
    const scopes = process.env.INDMONEY_SCOPES || 'read:portfolio';

    if (!authUrl || !clientId || !redirect) {
      throw new BadRequestException('INDMONEY OAuth not configured');
    }

    const { state, codeChallenge } = await this.auth.generateState(userId);

    const url = new URL(authUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirect);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return { url: url.toString(), state };
  }

  async handleCallback(code: string, state: string) {
    const validated = await this.auth.validateState(state);
    if (!validated) throw new BadRequestException('Invalid or expired state');

    const codeVerifier = (validated as any).codeVerifier;
    const userId = (validated as any).userId?.toString();

    const tokenResp = await this.client.exchangeCodeForToken(code, codeVerifier);

    // tokenResp shape depends on provider
    const accessToken = tokenResp.access_token;
    const refreshToken = tokenResp.refresh_token;
    const expiresIn = tokenResp.expires_in;

    const now = new Date();

    const payload: Partial<IndmoneyConnectionDocument> = {
      userId: new Types.ObjectId(userId),
      provider: 'indmoney',
      status: 'connected',
      accessTokenEncrypted: encrypt(accessToken),
      refreshTokenEncrypted: refreshToken ? encrypt(refreshToken) : undefined,
      tokenExpiresAt: expiresIn ? new Date(now.getTime() + Number(expiresIn) * 1000) : undefined,
      scopes: (process.env.INDMONEY_SCOPES || '').split(','),
      connectedAt: now,
    };

    await this.connModel.findOneAndUpdate({ userId: new Types.ObjectId(userId), provider: 'indmoney' }, payload, { upsert: true, new: true }).exec();

    await this.auth.clearState(state);
    return { success: true };
  }

  async getStatusForUser(userId: string) {
    const conn = await this.connModel.findOne({ userId: new Types.ObjectId(userId), provider: 'indmoney' }).lean().exec();
    if (!conn) return { connected: false, status: 'disconnected' };

    return {
      connected: conn.status === 'connected',
      status: conn.status,
      connectedAt: conn.connectedAt,
      lastSyncedAt: conn.lastSyncedAt,
      lastSyncStatus: conn.lastSyncStatus,
    };
  }

  async disconnectUser(userId: string) {
    const conn = await this.connModel.findOne({ userId: new Types.ObjectId(userId), provider: 'indmoney' }).exec();
    if (!conn) return { success: true };

    // attempt revocation if provider docs present — not implemented by default
    conn.accessTokenEncrypted = undefined as any;
    conn.refreshTokenEncrypted = undefined as any;
    conn.status = 'disconnected';
    await conn.save();

    return { success: true };
  }

  async manualSync(userId: string) {
    return this.syncService.syncForUser(userId);
  }
}
