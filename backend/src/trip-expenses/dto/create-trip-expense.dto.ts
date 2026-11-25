import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTripExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  account: string;

  @IsDateString()
  date: string;
}
