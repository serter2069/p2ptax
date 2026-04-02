import { IsString, IsArray, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateSpecialistProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @IsOptional()
  nick?: string;

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
  badges?: string[];

  @IsString()
  @IsOptional()
  contacts?: string;
}
