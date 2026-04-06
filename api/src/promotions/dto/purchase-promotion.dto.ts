import { IsString, IsEnum, IsOptional, IsIn } from 'class-validator';
import { PromotionTier } from '@prisma/client';

export class PurchasePromotionDto {
  @IsString()
  city!: string;

  @IsEnum(PromotionTier)
  tier!: PromotionTier;

  // Promotion duration in months: 1 (default), 3 (-10%), 6 (-20%).
  // Optional for backward compatibility — omitting defaults to 1 month.
  @IsOptional()
  @IsIn([1, 3, 6])
  periodMonths?: 1 | 3 | 6 = 1;
}
