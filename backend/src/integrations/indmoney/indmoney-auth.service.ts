import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IndmoneyState, IndmoneyStateDocument } from '../../schemas/indmoney-state.schema';

type PKCEPair = { codeVerifier: string; codeChallenge: string };

@Injectable()
export class IndmoneyAuthService {
  private readonly logger = new Logger(IndmoneyAuthService.name);

  constructor(@InjectModel(IndmoneyState.name) private stateModel: Model<IndmoneyStateDocument>) {}

  async generateState(userId: string) {
    const state = randomBytes(16).toString('hex');
    const codeVerifier = randomBytes(64).toString('hex');
    const codeChallenge = this.base64UrlEncode(createHash('sha256').update(codeVerifier).digest());

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.stateModel.create({ state, userId, codeVerifier, codeChallenge, expiresAt });

    return { state, codeVerifier, codeChallenge };
  }

  async validateState(state: string) {
    const entry = await this.stateModel.findOne({ state }).exec();
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt.getTime() < Date.now()) {
      await this.stateModel.deleteOne({ state }).exec();
      return null;
    }
    return entry;
  }

  async clearState(state: string) {
    await this.stateModel.deleteOne({ state }).exec();
  }

  private base64UrlEncode(buffer: Buffer) {
    return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
}
