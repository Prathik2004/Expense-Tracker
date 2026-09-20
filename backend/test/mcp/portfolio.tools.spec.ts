import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioTools } from '../src/mcp/tools/portfolio.tools';
import { MCPService } from '../src/mcp/mcp.service';
import { getModelToken } from '@nestjs/mongoose';
import { PortfolioHolding } from '../src/schemas/portfolio-holding.schema';
import { PortfolioSnapshot } from '../src/schemas/portfolio-snapshot.schema';
import { Investment } from '../src/schemas/investment.schema';

describe('PortfolioTools', () => {
  let tools: PortfolioTools;
  let mcpService: jest.Mocked<MCPService>;
  let portfolioHoldingModel: jest.Mocked<any>;
  let portfolioSnapshotModel: jest.Mocked<any>;
  let investmentModel: jest.Mocked<any>;

  const mockUser = {
    userId: '507f1f77bcf86cd799439011',
    scopes: ['portfolio:read', 'mcp:full_read'],
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 10000 },
  };

  const mockHoldings = [
    { category: 'Indian Stocks', amount: 150000, source: 'excel', date: new Date() },
    { category: 'Mutual Funds', amount: 200000, source: 'excel', date: new Date() },
    { category: 'Gold', amount: 50000, source: 'manual', date: new Date() },
  ];

  const mockInvestments = [
    { name: 'RELIANCE', assetType: 'Indian Stocks', investedAmount: 100000, currentValue: 120000, quantity: 50, currency: 'INR' },
    { name: 'HDFC MF', assetType: 'Mutual Funds', investedAmount: 150000, currentValue: 180000, quantity: 1000, currency: 'INR' },
  ];

  beforeEach(async () => {
    mcpService = {
      registerTool: jest.fn(),
    } as any;

    portfolioHoldingModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockHoldings),
    } as any;

    portfolioSnapshotModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    } as any;

    investmentModel = {
      find: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockInvestments),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioTools,
        { provide: MCPService, useValue: mcpService },
        { provide: getModelToken(PortfolioHolding.name), useValue: portfolioHoldingModel },
        { provide: getModelToken(PortfolioSnapshot.name), useValue: portfolioSnapshotModel },
        { provide: getModelToken(Investment.name), useValue: investmentModel },
      ],
    }).compile();

    tools = module.get<PortfolioTools>(PortfolioTools);
  });

  it('should register all tools', () => {
    expect(mcpService.registerTool).toHaveBeenCalledTimes(4);
  });

  describe('getPortfolioSummary', () => {
    it('should return portfolio summary with correct calculations', async () => {
      const tool = mcpService.registerTool.mock.calls.find(c => c[0].name === 'get_portfolio_summary')[0];
      const result = await tool.handler({}, mockUser);

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.totalValue).toBe(550000); // 400000 holdings + 150000 investments
      expect(data.totalInvested).toBe(250000); // 100000 + 150000
      expect(data.gainLoss).toBe(300000); // 550000 - 250000
    });
  });

  describe('getHoldings', () => {
    it('should return unique holdings by category', async () => {
      const tool = mcpService.registerTool.mock.calls.find(c => c[0].name === 'get_holdings')[0];
      const result = await tool.handler({}, mockUser);

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.holdings).toHaveLength(3);
      expect(data.totalValue).toBe(400000);
    });
  });

  describe('getInvestments', () => {
    it('should return formatted investments with performance metrics', async () => {
      const tool = mcpService.registerTool.mock.calls.find(c => c[0].name === 'get_investments')[0];
      const result = await tool.handler({}, mockUser);

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.investments).toHaveLength(2);
      expect(data.investments[0].gainLoss).toBe(20000); // 120000 - 100000
      expect(data.summary.totalInvested).toBe(250000);
      expect(data.summary.totalValue).toBe(300000);
    });
  });

  describe('getPortfolioHistory', () => {
    it('should return paginated snapshots', async () => {
      const tool = mcpService.registerTool.mock.calls.find(c => c[0].name === 'get_portfolio_history')[0];
      const result = await tool.handler({ offset: 0, limit: 10 }, mockUser);

      expect(result.isError).toBeFalsy();
      const data = JSON.parse(result.content[0].text);
      expect(data.snapshots).toBeInstanceOf(Array);
      expect(data.pagination).toEqual({
        offset: 0,
        limit: 10,
        total: 0,
        hasMore: false,
      });
    });
  });
});