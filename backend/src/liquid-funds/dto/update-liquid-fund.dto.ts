import { PartialType } from '@nestjs/mapped-types';
import { CreateLiquidFundDto, LiquidFundTransactionType } from './create-liquid-fund.dto';
import { IsOptional, IsEnum, IsNumber, Min, IsMongoId, IsDateString, IsString } from 'class-validator';

export class UpdateLiquidFundDto extends PartialType(CreateLiquidFundDto) {
  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsString()
  fundName?: string;

  @IsOptional()
  @IsString()
  bucket?: string;

  @IsOptional()
  @IsEnum(LiquidFundTransactionType)
  transactionType?: LiquidFundTransactionType;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsMongoId()
  goalId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}