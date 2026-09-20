import { IsString, IsNotEmpty, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class MCPRequestDto {
  @IsString()
  @IsNotEmpty()
  jsonrpc: '2.0';

  @IsNotEmpty()
  id: string | number;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  params?: Record<string, any>;
}