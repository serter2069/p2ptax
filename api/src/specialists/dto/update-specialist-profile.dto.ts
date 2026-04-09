import { IsString, IsArray, IsOptional, IsInt, Min, MaxLength, ArrayMaxSize } from 'class-validator';

export class UpdateSpecialistProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  headline?: string;

  @IsOptional()
  fnsDepartmentsData?: Array<{ office: string; departments: string[] }>;

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
  @ArrayMaxSize(20)
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
