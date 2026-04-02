import { IsInt, IsString, IsOptional, Min, Max, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MinLength(1)
  specialistNick!: string;

  @IsString()
  @MinLength(1)
  requestId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
