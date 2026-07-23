import { ConfigService } from '@nestjs/config';
import { GoogleSheetsSyncService } from './google-sheets-sync.service';

describe('GoogleSheetsSyncService', () => {
  const configService = {
    get: (key: string) => {
      if (key === 'GOOGLE_SHEET_ID') return 'sheet-id';
      return undefined;
    },
  } as unknown as ConfigService;

  it('maps a transaction into the expected sheet row', () => {
    const service = new GoogleSheetsSyncService({} as any, {} as any, configService);

    const transaction = {
      _id: '507f1f77bcf86cd799439011',
      date: new Date('2026-07-18T00:00:00.000Z'),
      type: 'expense',
      category: 'Food',
      description: 'Lunch',
      amount: 250,
      paymentMethod: 'UPI',
      userId: 'user-1',
    } as any;

    expect(service['composeTransactionRow'](transaction)).toEqual([
      '18-Jul-2026',
      'Jul-2026',
      '2026',
      'Expense',
      'Food',
      'Lunch',
      'UPI',
      250,
      '507f1f77bcf86cd799439011',
    ]);
  });

  it('disables the delta filter for scheduled cron syncs so daily runs still sync all transactions', () => {
    const service = new GoogleSheetsSyncService({} as any, {} as any, configService);
    const lastSyncTime = new Date('2026-07-18T01:00:00.000Z');

    expect(service['buildTransactionQuery'](lastSyncTime, 'cron')).toEqual({});
    expect(service['buildTransactionQuery'](lastSyncTime, 'manual')).toEqual({ updatedAt: { $gte: lastSyncTime } });
  });
});
