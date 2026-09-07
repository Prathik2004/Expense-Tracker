import { Injectable } from '@nestjs/common';
import { NormalizedHolding } from './indmoney.types';

@Injectable()
export class IndmoneyNormalizerService {
  // Transform provider-specific payload into NormalizedHolding[]
  normalizePortfolio(raw: any): NormalizedHolding[] {
    // This is intentionally generic — the real mapping depends on MCP response shape.
    if (!raw) return [];

    // If MCP returns an array under `holdings` try to map it.
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.holdings) ? raw.holdings : Array.isArray(raw.items) ? raw.items : [];

    return list.filter((h: any) => h && typeof h === 'object').map((h: any) => ({
      externalId: String(h.id || h.instrumentId || `${h.symbol || h.name}`),
      name: h.name || h.displayName || h.schemeName || h.symbol || 'Unnamed investment',
      assetType: h.type || h.assetType,
      symbol: h.symbol,
      isin: h.isin,
      quantity: this.toNumber(h.quantity),
      averagePrice: this.toNumber(h.avgPrice ?? h.averagePrice),
      currentPrice: this.toNumber(h.currentPrice ?? h.ltp),
      investedAmount: this.toNumber(h.investedAmount ?? h.investedValue),
      currentValue: this.toNumber(h.currentValue ?? h.marketValue ?? h.value),
      currency: h.currency || 'INR',
    }));
  }

  private toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
