import { IsString, IsNumber, Min, Matches } from 'class-validator';

export class CreateBudgetDto {
    @IsString()
    category: string;

    @IsNumber()
    @Min(0)
    monthlyLimit: number;

    @IsString()
    @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
    month: string;
}
