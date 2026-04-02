import { IsString, IsEnum } from 'class-validator';
import { PromotionTier } from '@prisma/client';

export class PurchasePromotionDto {
  @IsString()
  city!: string;

  @IsEnum(PromotionTier)
  tier!: PromotionTier;
}
