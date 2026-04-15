import { IsString, IsNotEmpty, MaxLength, IsInt, Min, IsDateString, IsOptional } from 'class-validator';

export class RespondRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comment!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
