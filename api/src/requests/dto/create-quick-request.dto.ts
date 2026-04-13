import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateQuickRequestDto {
  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  @MinLength(10, { message: 'description must be at least 10 characters' })
  @MaxLength(500, { message: 'description must be at most 500 characters' })
  description!: string;

  @IsString({ message: 'serviceType must be a string' })
  @IsNotEmpty({ message: 'serviceType is required' })
  @MaxLength(100, { message: 'serviceType must be at most 100 characters' })
  serviceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ifnsId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ifnsName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
