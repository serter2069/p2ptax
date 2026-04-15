import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ComplaintReason } from '@prisma/client';

export class CreateComplaintDto {
  @IsString()
  targetId!: string;

  @IsEnum(ComplaintReason)
  reason!: ComplaintReason;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;
}
