import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class PatchRequestDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description cannot be empty' })
  @MinLength(10, { message: 'description must be at least 10 characters' })
  @MaxLength(2000, { message: 'description must be at most 2000 characters' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'city must be a string' })
  @IsNotEmpty({ message: 'city cannot be empty' })
  @MaxLength(100, { message: 'city must be at most 100 characters' })
  city?: string;

  @IsOptional()
  @IsInt({ message: 'budget must be a number' })
  @Min(1, { message: 'budget must be greater than 0' })
  budget?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'category must be at most 100 characters' })
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serviceType?: string | null;
}
