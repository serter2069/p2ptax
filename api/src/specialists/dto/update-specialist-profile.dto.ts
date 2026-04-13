import { IsString, IsArray, IsOptional, IsInt, IsBoolean, Min, MinLength, MaxLength, ArrayMinSize, ArrayMaxSize, Matches, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

/** One FNS office with its selected service names */
export class FnsServiceEntryDto {
  @IsString()
  fnsId!: string;

  @IsArray()
  @IsString({ each: true })
  serviceNames!: string[];
}

export class UpdateSpecialistProfileDto {
  @IsString({ message: 'nick must be a string' })
  @IsOptional()
  @MinLength(3, { message: 'nick must be at least 3 characters' })
  @MaxLength(30, { message: 'nick must be at most 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Ник может содержать только латинские буквы, цифры, дефис и подчёркивание' })
  nick?: string;

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

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FnsServiceEntryDto)
  fnsServices?: FnsServiceEntryDto[];

  @IsInt({ message: 'experience must be a number' })
  @Min(0, { message: 'experience must be at least 0' })
  @IsOptional()
  experience?: number;

  @IsArray({ message: 'cities must be an array' })
  @IsString({ each: true, message: 'each city must be a string' })
  @IsOptional()
  cities?: string[];

  @IsArray({ message: 'services must be an array' })
  @IsString({ each: true, message: 'each service must be a string' })
  @IsOptional()
  services?: string[];

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

  @IsString({ message: 'phone must be a string' })
  @IsOptional()
  @MaxLength(30, { message: 'phone must be at most 30 characters' })
  phone?: string;

  @IsString({ message: 'telegram must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'telegram must be at most 100 characters' })
  telegram?: string;

  @IsString({ message: 'whatsapp must be a string' })
  @IsOptional()
  @MaxLength(30, { message: 'whatsapp must be at most 30 characters' })
  whatsapp?: string;

  @IsString({ message: 'officeAddress must be a string' })
  @IsOptional()
  @MaxLength(300, { message: 'officeAddress must be at most 300 characters' })
  officeAddress?: string;

  @IsString({ message: 'workingHours must be a string' })
  @IsOptional()
  @MaxLength(200, { message: 'workingHours must be at most 200 characters' })
  workingHours?: string;

  @IsBoolean({ message: 'isAvailable must be a boolean' })
  @IsOptional()
  isAvailable?: boolean;
}
