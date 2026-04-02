import { IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { PromotionTier } from '@prisma/client';

export class UpdatePricesDto {
  @IsString()
  city!: string;

  @IsEnum(PromotionTier)
  tier!: PromotionTier;

  @IsNumber()
  @Min(0)
  price!: number;
}
