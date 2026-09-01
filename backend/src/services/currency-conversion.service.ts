import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CurrencyConversionService {
  private readonly logger = new Logger(CurrencyConversionService.name);

  // Returns exchange rate from `from` to `to`. Uses exchangerate.host public API as fallback.
  async getRate(from: string, to: string): Promise<number> {
    from = from?.toUpperCase() || 'INR';
    to = to?.toUpperCase() || 'INR';
    if (from === to) return 1;

    // If an internal exchange-rate service exists, prefer that. Otherwise use exchangerate.host
    try {
      const api = process.env.EXCHANGE_RATE_API_URL || `https://api.exchangerate.host/latest?base=${from}&symbols=${to}`;
      const res = await fetch(api);
      if (!res.ok) throw new Error(`Rate fetch failed: ${res.status}`);
      const body = await res.json();
      const rate = body?.rates?.[to];
      if (!rate) throw new Error('Rate not found');
      return Number(rate);
    } catch (err) {
      this.logger.error('Currency rate lookup failed', err as any);
      // As a last resort, return 1 to avoid throwing; caller must handle mixed currencies
      return 1;
    }
  }
}
