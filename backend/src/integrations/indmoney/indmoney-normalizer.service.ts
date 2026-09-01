import { Injectable } from '@nestjs/common';
import { NormalizedHolding } from './indmoney.types';

@Injectable()
export class IndmoneyNormalizerService {
  // Transform provider-specific payload into NormalizedHolding[]
  normalizePortfolio(raw: any): NormalizedHolding[] {
    // This is intentionally generic — the real mapping depends on MCP response shape.
    if (!raw) return [];

    // If MCP returns an array under `holdings` try to map it.
    const list = Array.isArray(raw.holdings) ? raw.holdings : raw.items || [];

    return list.map((h: any) => ({
      externalId: String(h.id || h.instrumentId || `${h.symbol || h.name}`),
      name: h.name || h.displayName || h.schemeName,
      assetType: h.type || h.assetType,
      symbol: h.symbol,
      isin: h.isin,
      quantity: h.quantity ? Number(h.quantity) : undefined,
      averagePrice: h.avgPrice ? Number(h.avgPrice) : undefined,
      currentPrice: h.currentPrice ? Number(h.currentPrice) : undefined,
      investedAmount: h.investedAmount ? Number(h.investedAmount) : undefined,
      currentValue: h.currentValue ? Number(h.currentValue) : undefined,
      currency: h.currency || 'INR',
    }));
  }
}
