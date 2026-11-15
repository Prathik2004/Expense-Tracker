import { IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SubscriptionKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class SubscribeDto {
  @IsUrl({ require_tld: false })
  endpoint: string;

  @ValidateNested()
  @Type(() => SubscriptionKeysDto)
  keys: SubscriptionKeysDto;

  @IsOptional()
  @IsString()
  deviceLabel?: string;
}
