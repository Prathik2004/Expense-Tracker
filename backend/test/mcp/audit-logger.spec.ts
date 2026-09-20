import { Test, TestingModule } from '@nestjs/testing';
import { AuditLoggerService } from '../src/mcp/security/audit-logger.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from '../src/mcp/schemas/audit-log.schema';

describe('AuditLoggerService', () => {
  let service: AuditLoggerService;
  let auditLogModel: Model<any>;

  const mockAuditLog = {
    save: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLoggerService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: {
            new: jest.fn().mockImplementation(() => mockAuditLog),
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([]),
            countDocuments: jest.fn().mockResolvedValue(0),
            aggregate: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLoggerService>(AuditLoggerService);
    auditLogModel = module.get<Model<any>>(getModelToken(AuditLog.name));
  });

  it('should log audit entry without sensitive data', async () => {
    const logInput = {
      apiKeyId: 'test-key-id',
      userId: 'test-user-id',
      endpoint: '/mcp/tools/call',
      method: 'POST',
      tool: 'get_portfolio_summary',
      statusCode: 200,
      parameters: {
        apiKey: 'secret-key',
        password: 'secret-password',
        normalParam: 'normal-value',
      },
      resultCount: 1,
      duration: 150,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    await service.log(logInput);

    expect(mockAuditLog.save).toHaveBeenCalledWith(expect.anything());
    const savedData = mockAuditLog.save.mock.calls[0][0];
    expect(savedData.apiKeyId).toBe(logInput.apiKeyId);
    expect(savedData.userId).toBe(logInput.userId);
    expect(savedData.parameters.apiKey).toBe('[REDACTED]');
    expect(savedData.parameters.password).toBe('[REDACTED]');
    expect(savedData.parameters.normalParam).toBe('normal-value');
  });

  it('should sanitize nested sensitive objects', async () => {
    const logInput = {
      apiKeyId: 'test-key-id',
      userId: 'test-user-id',
      endpoint: '/mcp/tools/call',
      method: 'POST',
      tool: 'get_transactions',
      statusCode: 200,
      parameters: {
        auth: {
          token: 'secret-token',
          credentials: {
            apiKey: 'nested-secret',
          },
        },
        normalData: 'ok',
      },
      resultCount: 1,
      duration: 100,
      ipAddress: '127.0.0.1',
    };

    await service.log(logInput);

    const savedData = mockAuditLog.save.mock.calls[0][0];
    expect(savedData.parameters.auth.token).toBe('[REDACTED]');
    expect(savedData.parameters.auth.credentials.apiKey).toBe('[REDACTED]');
    expect(savedData.parameters.normalData).toBe('ok');
  });

  it('should handle missing parameters gracefully', async () => {
    const logInput = {
      apiKeyId: 'test-key-id',
      userId: 'test-user-id',
      endpoint: '/mcp/tools/call',
      method: 'POST',
      tool: 'get_budgets',
      statusCode: 200,
      parameters: undefined,
      resultCount: 1,
      duration: 50,
      ipAddress: '127.0.0.1',
    };

    await expect(service.log(logInput)).resolves.not.toThrow();
  });
});