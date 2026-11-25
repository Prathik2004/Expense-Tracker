import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { TripExpenseLog } from '../schemas/trip-expense-log.schema';
import { CreateTripExpenseDto } from './dto/create-trip-expense.dto';
import { TripExpensesService } from './trip-expenses.service';

describe('TripExpensesService', () => {
  let service: TripExpensesService;
  let model: {
    find: jest.Mock;
    create: jest.Mock;
    findOneAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
    updateOne: jest.Mock;
  };

  beforeEach(async () => {
    model = {
      find: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripExpensesService,
        { provide: getModelToken(TripExpenseLog.name), useValue: model },
      ],
    }).compile();

    service = module.get<TripExpensesService>(TripExpensesService);
  });

  it('scopes trip reads to the authenticated user', async () => {
    const userId = new Types.ObjectId().toString();
    const rows = [{ _id: new Types.ObjectId() }];
    const exec = jest.fn().mockResolvedValue(rows);
    const sort = jest.fn().mockReturnValue({ exec });
    model.find.mockReturnValue({ sort });

    await expect(service.findAll(userId)).resolves.toBe(rows);
    expect(model.find).toHaveBeenCalledWith({
      userId: new Types.ObjectId(userId),
    });
  });

  it('stores bulk expenses against the requested user-owned trip', async () => {
    const userId = new Types.ObjectId().toString();
    const tripId = new Types.ObjectId().toString();
    const updatedTrip = { _id: tripId };
    const exec = jest.fn().mockResolvedValue(updatedTrip);
    model.findOneAndUpdate.mockReturnValue({ exec });
    const expenses: CreateTripExpenseDto[] = [
      {
        description: 'Bus',
        amount: 1000,
        account: 'Cash',
        date: '2026-11-25',
      },
    ];

    await expect(service.addExpenses(userId, tripId, expenses)).resolves.toBe(
      updatedTrip,
    );
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(tripId), userId: new Types.ObjectId(userId) },
      {
        $push: {
          expenses: {
            $each: [
              {
                description: 'Bus',
                amount: 1000,
                account: 'Cash',
                date: new Date('2026-11-25'),
              },
            ],
          },
        },
      },
      { new: true, runValidators: true, includeResultMetadata: false },
    );
  });

  it('rejects invalid trip identifiers before querying MongoDB', async () => {
    await expect(
      service.remove('not-an-object-id', 'also-invalid'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(model.deleteOne).not.toHaveBeenCalled();
  });
});
