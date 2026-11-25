import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateTripExpenseDto } from './create-trip-expense.dto';

export class CreateTripExpensesBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateTripExpenseDto)
  expenses: CreateTripExpenseDto[];
}
