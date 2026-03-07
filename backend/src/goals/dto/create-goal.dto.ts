import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateGoalDto {
    @IsString()
    title: string;

    @IsNumber()
    @Min(0)
    targetAmount: number;

    @IsDateString()
    deadline: Date;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    icon?: string;
}
