import { IsString, IsArray, IsOptional, IsInt, Min, MinLength, MaxLength } from 'class-validator';

export class CreateSpecialistProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  nick!: string;

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
  cities!: string[];

  @IsArray()
  @IsString({ each: true })
  services!: string[];

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
