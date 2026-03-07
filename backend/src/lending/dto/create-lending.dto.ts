import { IsNotEmpty, IsNumber, IsString, IsEnum, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateLendingDto {
    @IsString()
    @IsNotEmpty()
    personName: string;

    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsEnum(['salary', 'other'])
    @IsNotEmpty()
    source: string;
}
