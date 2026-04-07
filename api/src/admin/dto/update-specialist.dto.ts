import { IsOptional, IsString, IsArray, MaxLength } from 'class-validator';

export class AdminUpdateSpecialistDto {
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) services?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) cities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) badges?: string[];
  @IsOptional() @IsString() @MaxLength(500) contacts?: string;
}
