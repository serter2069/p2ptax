import { IsString, IsArray, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateSpecialistProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  nick!: string;

  @IsArray()
  @IsString({ each: true })
  cities!: string[];

  @IsArray()
  @IsString({ each: true })
  services!: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  badges?: string[];

  @IsString()
  @IsOptional()
  contacts?: string;
}
