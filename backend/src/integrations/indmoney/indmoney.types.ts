export interface ConnectionStatus {
  connected: boolean;
  status: 'connected' | 'expired' | 'revoked' | 'error' | 'disconnected';
  connectedAt?: string;
  lastSyncedAt?: string;
  lastSyncStatus?: string;
}

export interface NormalizedHolding {
  externalId: string;
  name: string;
  assetType?: string;
  symbol?: string;
  isin?: string;
  quantity?: number;
  averagePrice?: number;
  currentPrice?: number;
  investedAmount?: number;
  currentValue?: number;
  currency?: string;
}

export interface SyncResult {
  status: 'success' | 'partial' | 'failed';
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  syncedAt?: string;
}
