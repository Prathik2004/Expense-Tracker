import { IsBoolean, IsIn, IsObject, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationTypesDto {
  @IsOptional() @IsBoolean() budgetAlerts?: boolean;
  @IsOptional() @IsBoolean() goalReminders?: boolean;
  @IsOptional() @IsBoolean() recurringAdded?: boolean;
  @IsOptional() @IsBoolean() weeklySummary?: boolean;
  @IsOptional() @IsBoolean() monthlySummary?: boolean;
  @IsOptional() @IsBoolean() lendingReminders?: boolean;
  @IsOptional() @IsBoolean() securityAlerts?: boolean;
  @IsOptional() @IsBoolean() dailyReminder?: boolean;
}

class QuietHoursDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) start?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) end?: string;
}

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @ValidateNested() @Type(() => NotificationTypesDto) types?: NotificationTypesDto;
  @IsOptional() @ValidateNested() @Type(() => QuietHoursDto) quietHours?: QuietHoursDto;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) dailyReminderTime?: string;
  @IsOptional() @IsBoolean() hideAmounts?: boolean;
}
