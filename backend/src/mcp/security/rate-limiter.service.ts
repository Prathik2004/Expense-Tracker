import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitRecord {
  apiKeyId: string;
  endpoint: string;
  timestamps: number[]; // Timestamps of requests in current window
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly records: Map<string, RateLimitRecord> = new Map();
  private readonly CLEANUP_INTERVAL = 60000; // Cleanup every minute

  constructor() {
    // Cleanup old records periodically (in-memory implementation)
    setInterval(() => this.cleanupExpiredRecords(), this.CLEANUP_INTERVAL);
  }

  async checkRateLimit(
    apiKeyId: string,
    endpoint: string,
    limits: { requestsPerMinute: number; requestsPerDay: number },
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `${apiKeyId}:${endpoint}`;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneDayAgo = now - 86400000;

    // Get or create record
    let record = this.records.get(key);
    if (!record) {
      record = { apiKeyId, endpoint, timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out old timestamps (older than 1 day)
    record.timestamps = record.timestamps.filter(ts => ts > oneDayAgo);

    // Check requests per minute
    const requestsInLastMinute = record.timestamps.filter(ts => ts > oneMinuteAgo).length;
    if (requestsInLastMinute >= limits.requestsPerMinute) {
      this.logger.warn(
        `Rate limit exceeded (per minute) for API key ${apiKeyId} on endpoint ${endpoint}`,
      );
      const retryAfter = Math.ceil((record.timestamps[record.timestamps.length - limits.requestsPerMinute] + 60000 - now) / 1000);
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check requests per day
    if (record.timestamps.length >= limits.requestsPerDay) {
      this.logger.warn(
        `Rate limit exceeded (per day) for API key ${apiKeyId} on endpoint ${endpoint}`,
      );
      const retryAfter = Math.ceil((record.timestamps[0] + 86400000 - now) / 1000);
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Daily rate limit exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Record this request
    record.timestamps.push(now);

    return { allowed: true };
  }

  private cleanupExpiredRecords() {
    const now = Date.now();
    const oneDayAgo = now - 86400000;

    for (const [key, record] of this.records.entries()) {
      // Filter out old timestamps
      record.timestamps = record.timestamps.filter(ts => ts > oneDayAgo);

      // Remove record if no timestamps left
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }

    this.logger.debug(`Cleaned up ${this.records.size} rate limit records`);
  }

  getRateLimitInfo(apiKeyId: string, endpoint: string): { used: number; limit: number } {
    const key = `${apiKeyId}:${endpoint}`;
    const record = this.records.get(key);

    if (!record) {
      return { used: 0, limit: 0 };
    }

    const oneMinuteAgo = Date.now() - 60000;
    const used = record.timestamps.filter(ts => ts > oneMinuteAgo).length;

    return { used, limit: 60 }; // Default limit per minute
  }
}