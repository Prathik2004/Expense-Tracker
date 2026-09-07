import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IndmoneyAuthService } from './indmoney-auth.service';
import { IndmoneyClientService } from './indmoney-client.service';
import { IndmoneyNormalizerService } from './indmoney-normalizer.service';
import { IndmoneySyncService } from './indmoney-sync.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IndmoneyConnectionDocument } from '../../schemas/indmoney-connection.schema';
import { encrypt, decrypt } from '../../utils/encryption.util';
import { ChildProcess, spawn } from 'child_process';
import { existsSync } from 'fs';

@Injectable()
export class IndmoneyService {
  private readonly logger = new Logger(IndmoneyService.name);
  private browserExportProcess?: ChildProcess;

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

    const missing = [
      !authUrl && 'INDMONEY_OAUTH_AUTHORIZE_URL',
      !clientId && 'INDMONEY_CLIENT_ID',
      !redirect && 'INDMONEY_REDIRECT_URI',
    ].filter(Boolean);

    if (missing.length > 0) {
      throw new BadRequestException(`INDMONEY OAuth not configured. Missing: ${missing.join(', ')}`);
    }

    const configuredAuthUrl = authUrl as string;
    const configuredClientId = clientId as string;
    const configuredRedirect = redirect as string;

    const { state, codeChallenge } = await this.auth.generateState(userId);

    const url = new URL(configuredAuthUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', configuredClientId);
    url.searchParams.set('redirect_uri', configuredRedirect);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return { url: url.toString(), state };
  }

  startLocalBrowserExport() {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Browser export is available only when the backend runs locally');
    }

    if (this.browserExportProcess && !this.browserExportProcess.killed) {
      return { started: false, message: 'The INDmoney browser export is already running' };
    }

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const backendDirectory = process.cwd();
    if (!existsSync(`${backendDirectory}/package.json`)) {
      throw new BadRequestException(`Could not start local browser exporter: backend package.json was not found in ${backendDirectory}`);
    }

    try {
      this.browserExportProcess = spawn(npmCommand, ['run', 'indmoney:browser-export'], {
        cwd: backendDirectory,
        stdio: ['inherit', 'pipe', 'pipe'],
        windowsHide: true,
        shell: process.platform === 'win32',
      });
    } catch (error: any) {
      throw new BadRequestException(`Could not start local browser exporter: ${error?.message || 'process launch failed'}`);
    }

    const browserProcess = this.browserExportProcess;
    browserProcess.stdout?.on('data', (chunk) => this.logger.log(`[INDmoney browser] ${chunk.toString().trim()}`));
    browserProcess.stderr?.on('data', (chunk) => this.logger.warn(`[INDmoney browser] ${chunk.toString().trim()}`));
    browserProcess.on('error', (error) => {
      this.logger.error(`INDmoney browser export could not start: ${error.message}`);
      this.browserExportProcess = undefined;
    });
    browserProcess.on('close', (code) => {
      this.logger.log(`INDmoney browser export exited with code ${code ?? 'unknown'}`);
      this.browserExportProcess = undefined;
    });

    return { started: true, message: 'INDmoney opened in a local browser. Log in manually and complete the export there.' };
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
      lastSyncError: conn.lastSyncError,
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

  async importBrowserExport(userId: string, payload: any) {
    return this.syncService.importBrowserExport(userId, payload);
  }
}
