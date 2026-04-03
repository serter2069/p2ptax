import { IsString, IsArray, IsOptional, IsInt, Min, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateSpecialistProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Ник может содержать только латинские буквы, цифры, дефис и подчёркивание' })
  @IsOptional()
  nick?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  experience?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cities?: string[];

  @IsArray()
  @IsString({ each: true })
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

  @IsString()
  @IsOptional()
  contacts?: string;
}
