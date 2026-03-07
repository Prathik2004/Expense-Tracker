import { IsString, IsNumber, IsOptional, IsDateString, IsBoolean, Min, IsEnum } from 'class-validator';

export class CreateTransactionDto {
    @IsEnum(['income', 'expense', 'investment'])
    type: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    category: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    date?: Date;

    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @IsOptional()
    @IsNumber()
    recurringDay?: number;
}
