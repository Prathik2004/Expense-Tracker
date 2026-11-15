import { Test, TestingModule } from '@nestjs/testing';
import { RecurringService } from './recurring.service';
import { getModelToken } from '@nestjs/mongoose';
import { Transaction } from '../schemas/transaction.schema';
import { NotificationsService } from '../notifications/notifications.service';

describe('RecurringService', () => {
  let service: RecurringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringService,
        { provide: getModelToken(Transaction.name), useValue: {} },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();

    service = module.get<RecurringService>(RecurringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
