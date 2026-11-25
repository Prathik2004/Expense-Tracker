import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TripExpenseLogDocument = TripExpenseLog & Document;

@Schema({ _id: true })
export class TripExpenseItem {
  @Prop({ required: true, trim: true, maxlength: 200 })
  description: string;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true, trim: true, maxlength: 100 })
  account: string;

  @Prop({ required: true })
  date: Date;
}

export const TripExpenseItemSchema =
  SchemaFactory.createForClass(TripExpenseItem);

@Schema({ timestamps: true, collection: 'trip_expense_logs' })
export class TripExpenseLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ type: [TripExpenseItemSchema], default: [] })
  expenses: TripExpenseItem[];

  @Prop()
  legacyMigrationKey?: string;
}

export const TripExpenseLogSchema =
  SchemaFactory.createForClass(TripExpenseLog);

TripExpenseLogSchema.index(
  { legacyMigrationKey: 1 },
  {
    unique: true,
    partialFilterExpression: { legacyMigrationKey: { $type: 'string' } },
  },
);
