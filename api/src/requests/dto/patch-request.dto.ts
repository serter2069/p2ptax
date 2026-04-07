import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class PatchRequestDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
