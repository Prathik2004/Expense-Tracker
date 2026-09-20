import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument } from './api-key.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  async createApiKey(userId: string, name: string, scopes: string[], rateLimit?: { requestsPerMinute: number; requestsPerDay: number }): Promise<{ apiKey: string; id: string }> {
    // Check if user exists? We might want to validate the userId, but for now we assume it's valid.

    // Generate a random API key
    const rawKey = `sk_${uuidv4()}_${uuidv4()}`; // Example format: sk_xxxx_xxxx

    // Hash the API key
    const saltOrRounds = 10;
    const hashedKey = await bcrypt.hash(rawKey, saltOrRounds);

    // Set default rate limit if not provided
    const finalRateLimit = rateLimit ?? {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
    };

    // Create the API key document
    const apiKey = new this.apiKeyModel({
      userId,
      key: hashedKey,
      name,
      scopes,
      rateLimit: finalRateLimit,
    });

    const saved = await apiKey.save();

    // Return the raw key (only time it's ever shown) and the id
    return {
      apiKey: rawKey,
      id: saved._id.toString(),
    };
  }

  async validateApiKey(rawKey: string): Promise<ApiKeyDocument | null> {
    // Find all non-revoked API keys (we'll have to check the hash)
    const apiKeys = await this.apiKeyModel.find({
      isRevoked: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).exec();

    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(rawKey, apiKey.key);
      if (isValid) {
        // Update last used at
        apiKey.lastUsedAt = new Date();
        await apiKey.save();
        return apiKey;
      }
    }

    return null;
  }

  async revokeApiKey(id: string): Promise<boolean> {
    const result = await this.apiKeyModel.updateOne({ _id: id }, { isRevoked: true });
    return result.modifiedCount > 0;
  }

  async getApiKeyById(id: string): Promise<ApiKeyDocument> {
    const apiKey = await this.apiKeyModel.findById(id);
    if (!apiKey) {
      throw new NotFoundException(`API key with id ${id} not found`);
    }
    return apiKey;
  }

  async listApiKeysForUser(userId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel.find({ userId, isRevoked: false }).exec();
  }
}
