import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRequestDto {
  @IsNotEmpty({ message: 'title is required' })
  @IsString({ message: 'title must be a string' })
  @MinLength(3, { message: 'title must be at least 3 characters' })
  @MaxLength(100, { message: 'title must be at most 100 characters' })
  title!: string;

  @IsNotEmpty({ message: 'description is required' })
  @IsString({ message: 'description must be a string' })
  @MinLength(10, { message: 'description must be at least 10 characters' })
  @MaxLength(2000, { message: 'description must be at most 2000 characters' })
  description!: string;

  @IsNotEmpty({ message: 'city is required' })
  @IsString({ message: 'city must be a string' })
  @MaxLength(100, { message: 'city must be at most 100 characters' })
  city!: string;

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
  serviceType?: string;

  @IsOptional()
  @IsInt({ message: 'budget must be a number' })
  @Min(1, { message: 'budget must be greater than 0' })
  budget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
