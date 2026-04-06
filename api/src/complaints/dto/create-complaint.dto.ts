import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ComplaintReason } from '@prisma/client';

export class CreateComplaintDto {
  @IsString()
  targetUserId!: string;

  @IsEnum(ComplaintReason)
  reason!: ComplaintReason;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}
