import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRequestDto {
  // Primary field name
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description?: string;

  // Alias: spec says "title", maps to description
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ifnsId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ifnsName?: string;

  // Alias: spec says "serviceType", maps to category
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serviceType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
