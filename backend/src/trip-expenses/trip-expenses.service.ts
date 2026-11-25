import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TripExpenseLog,
  TripExpenseLogDocument,
} from '../schemas/trip-expense-log.schema';
import { CreateTripExpenseDto } from './dto/create-trip-expense.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { MigrateLocalTripDto } from './dto/migrate-local-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

const LEGACY_MIGRATION_KEY_PREFIX = 'local-trip-expenses-v1:';

@Injectable()
export class TripExpensesService {
  constructor(
    @InjectModel(TripExpenseLog.name)
    private readonly tripModel: Model<TripExpenseLogDocument>,
  ) {}

  findAll(userId: string): Promise<TripExpenseLogDocument[]> {
    return this.tripModel
      .find({ userId: this.toObjectId(userId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  create(userId: string, dto: CreateTripDto): Promise<TripExpenseLogDocument> {
    return this.tripModel.create({
      userId: this.toObjectId(userId),
      name: dto.name.trim(),
      expenses: [],
    });
  }

  async migrateLocal(
    userId: string,
    dto: MigrateLocalTripDto,
  ): Promise<TripExpenseLogDocument> {
    const migrationKey = `${LEGACY_MIGRATION_KEY_PREFIX}${userId}`;
    const existing = await this.tripModel
      .findOne({ legacyMigrationKey: migrationKey })
      .exec();
    if (existing) return existing;

    try {
      return await this.tripModel.create({
        userId: this.toObjectId(userId),
        name: dto.name.trim(),
        expenses: dto.expenses.map((expense) => ({
          ...expense,
          date: new Date(expense.date),
        })),
        legacyMigrationKey: migrationKey,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const migrated = await this.tripModel
          .findOne({ legacyMigrationKey: migrationKey })
          .exec();
        if (migrated) return migrated;
      }
      throw error;
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTripDto,
  ): Promise<TripExpenseLogDocument> {
    const trip = await this.tripModel
      .findOneAndUpdate(
        { _id: this.toObjectId(id), userId: this.toObjectId(userId) },
        { $set: { name: dto.name?.trim() } },
        { new: true, runValidators: true, includeResultMetadata: false },
      )
      .exec();
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.tripModel
      .deleteOne({
        _id: this.toObjectId(id),
        userId: this.toObjectId(userId),
      })
      .exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('Trip not found');
  }

  async addExpenses(
    userId: string,
    tripId: string,
    expenses: CreateTripExpenseDto[],
  ): Promise<TripExpenseLogDocument> {
    const trip = await this.tripModel
      .findOneAndUpdate(
        { _id: this.toObjectId(tripId), userId: this.toObjectId(userId) },
        {
          $push: {
            expenses: {
              $each: expenses.map((expense) => ({
                ...expense,
                description: expense.description.trim(),
                account: expense.account.trim(),
                date: new Date(expense.date),
              })),
            },
          },
        },
        { new: true, runValidators: true, includeResultMetadata: false },
      )
      .exec();
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async removeExpense(
    userId: string,
    tripId: string,
    expenseId: string,
  ): Promise<void> {
    const result = await this.tripModel
      .updateOne(
        {
          _id: this.toObjectId(tripId),
          userId: this.toObjectId(userId),
          'expenses._id': this.toObjectId(expenseId),
        },
        { $pull: { expenses: { _id: this.toObjectId(expenseId) } } },
      )
      .exec();
    if (result.modifiedCount === 0)
      throw new NotFoundException('Trip expense not found');
  }

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid identifier');
    return new Types.ObjectId(id);
  }
}
