import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
