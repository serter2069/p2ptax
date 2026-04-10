import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateQuickRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serviceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ifnsId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ifnsName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
