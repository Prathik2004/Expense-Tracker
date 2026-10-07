import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min, IsMongoId } from 'class-validator';

export enum LiquidFundTransactionType {
  INVEST = 'INVEST',
  RETURN = 'RETURN',
  WITHDRAW = 'WITHDRAW',
}

export class CreateLiquidFundDto {
  @IsDateString()
  date: Date;

  @IsString()
  fundName: string;

  @IsString()
  bucket: string;

  @IsEnum(LiquidFundTransactionType)
  transactionType: LiquidFundTransactionType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsMongoId()
  goalId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}