import { IsNumber, IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreatePortfolioEntryDto {
    @IsString()
    @IsNotEmpty()
    category: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsNotEmpty()
    date: string;
}
