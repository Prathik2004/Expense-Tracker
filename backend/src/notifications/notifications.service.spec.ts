import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const subscriptionModel = {
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    deleteOne: jest.fn(),
  };
  const preferenceModel = {
    findOneAndUpdate: jest.fn(),
  };
  const logModel = {
    create: jest.fn(),
    exists: jest.fn(),
  };
  const eventsGateway = { emitToUser: jest.fn() };
  const configService = { get: jest.fn((key: string) => key === 'VAPID_SUBJECT' ? undefined : undefined) };

  beforeEach(() => jest.clearAllMocks());

  it('logs a skipped notification when the master switch is disabled', async () => {
    const service = new NotificationsService(subscriptionModel as any, preferenceModel as any, logModel as any, configService as any, eventsGateway as any);
    jest.spyOn(service, 'getPreferences').mockResolvedValue({ enabled: false, types: {}, quietHours: {} } as any);
    logModel.create.mockResolvedValue({});

    await service.send('507f1f77bcf86cd799439011', { type: 'budgetAlerts', title: 'Budget', body: 'Alert', url: '/budgets' });

    expect(logModel.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'skipped' }));
    expect(subscriptionModel.find).not.toHaveBeenCalled();
  });
});
