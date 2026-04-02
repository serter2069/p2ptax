import { IsString, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { PromotionTier } from '@prisma/client';

export class UpdatePricesDto {
  // city=undefined means "global default for all cities"
  @IsOptional()
  @IsString()
  city?: string;

  @IsEnum(PromotionTier)
  tier!: PromotionTier;

  @IsNumber()
  @Min(0)
  price!: number;
}
