import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  it('should separate main income, side income, and SIP contributions in the summary', async () => {
    const aggregate = jest.fn()
      .mockResolvedValueOnce([
        { _id: 'income', total: 60000 },
        { _id: 'expense', total: 22000 },
        { _id: 'investment', total: 12000 },
      ])
      .mockResolvedValueOnce([
        { _id: 'Salary', total: 50000 },
        { _id: 'Side Income', total: 10000 },
      ])
      .mockResolvedValueOnce([
        { _id: 'SIP', total: 5000 },
        { _id: 'Mutual Funds', total: 7000 },
      ])
      .mockResolvedValueOnce([
        { _id: 'Food', total: 12000 },
        { _id: 'Rent', total: 10000 },
      ]);

    const transactionModel = {
      aggregate,
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    } as any;

    const userModel = {
      findById: jest.fn().mockResolvedValue({ portfolioValue: 250000 }),
    } as any;

    const service = new TransactionsService(transactionModel, userModel, { emitToUser: jest.fn() } as any);

    const summary = await service.getSummary('64b2a6f4cbb7f7d7c1a2b3c4', 9, 2026);

    expect(summary.income).toBe(60000);
    expect(summary.mainIncome).toBe(50000);
    expect(summary.sideIncome).toBe(10000);
    expect(summary.investment).toBe(12000);
    expect(summary.sip).toBe(5000);
    expect(summary.balance).toBe(60000 - 22000 - 12000);
  });
});
