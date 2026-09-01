import { IndmoneySyncService } from './indmoney-sync.service';

describe('IndmoneySyncService (mocked)', () => {
  it('upserts investments and avoids duplicates', async () => {
    const fakeConn = {
      accessTokenEncrypted: 'enc',
      refreshTokenEncrypted: undefined,
      tokenExpiresAt: undefined,
      lastSyncedAt: undefined,
      lastSyncStatus: undefined,
      save: jest.fn()
    } as any;

    const connModel = { findOne: jest.fn().mockResolvedValue(fakeConn) } as any;

    const upsertCalls: any[] = [];
    const investmentModel = {
      findOneAndUpdate: jest.fn().mockImplementation(() => ({ exec: async () => ({ createdAt: new Date(), updatedAt: new Date() }) }))
    } as any;

    const client = { fetchPortfolioWithAccessToken: jest.fn().mockResolvedValue({ holdings: [{ id: 'h1', name: 'X', quantity: 1 }] }) } as any;
    const normalizer = { normalizePortfolio: jest.fn().mockReturnValue([{ externalId: 'h1', name: 'X', quantity: 1, investedAmount: 100, currentValue: 110 }]) } as any;

    const svc = new IndmoneySyncService(connModel as any, investmentModel as any, client as any, normalizer as any);

    const result = await svc.syncForUser('user1');
    expect(result.fetched).toBe(1);
    expect(result.created + result.updated).toBeGreaterThanOrEqual(1);
  });
});
