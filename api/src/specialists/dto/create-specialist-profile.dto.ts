import { IsString, IsArray, IsOptional, IsInt, Min, MinLength, MaxLength, ArrayMinSize, ArrayMaxSize, Matches } from 'class-validator';

export class CreateSpecialistProfileDto {
  @IsString({ message: 'nick must be a string' })
  @MinLength(3, { message: 'nick must be at least 3 characters' })
  @MaxLength(30, { message: 'nick must be at most 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Ник может содержать только латинские буквы, цифры, дефис и подчёркивание' })
  nick!: string;

  @IsString({ message: 'displayName must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'displayName must be at most 100 characters' })
  displayName?: string;

  @IsString({ message: 'bio must be a string' })
  @IsOptional()
  @MinLength(10, { message: 'bio must be at least 10 characters' })
  @MaxLength(1000, { message: 'bio must be at most 1000 characters' })
  bio?: string;

  @IsString({ message: 'headline must be a string' })
  @IsOptional()
  @MaxLength(150, { message: 'headline must be at most 150 characters' })
  headline?: string;

  @IsOptional()
  fnsDepartmentsData?: Array<{ office: string; departments: string[] }>;

  @IsInt({ message: 'experience must be a number' })
  @Min(0, { message: 'experience must be at least 0' })
  @IsOptional()
  experience?: number;

  @IsArray({ message: 'cities must be an array' })
  @IsString({ each: true, message: 'each city must be a string' })
  @ArrayMinSize(1, { message: 'at least one city is required' })
  cities!: string[];

  @IsArray({ message: 'services must be an array' })
  @IsString({ each: true, message: 'each service must be a string' })
  @ArrayMinSize(1, { message: 'at least one service is required' })
  services!: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fnsOffices?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  badges?: string[];

  @IsString({ message: 'contacts must be a string' })
  @IsOptional()
  contacts?: string;
}
