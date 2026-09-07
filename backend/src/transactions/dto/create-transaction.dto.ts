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
    @IsString()
    paymentMethod?: string;

    @IsOptional()
    @IsDateString()
    date?: Date;

    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @IsOptional()
    @IsNumber()
    recurringDay?: number;

    @IsOptional()
    @IsEnum(['buy', 'sell', 'dividend', 'fee', 'transfer', 'other'])
    investmentAction?: string;

    @IsOptional()
    @IsString()
    symbol?: string;

    @IsOptional()
    @IsString()
    isin?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    quantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    fees?: number;

    @IsOptional()
    @IsEnum(['manual', 'indmoney', 'csv', 'other'])
    source?: string;

    @IsOptional()
    @IsString()
    externalId?: string;
}
