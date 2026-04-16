import { IsArray, IsOptional, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * One work-area entry. `fnsId` may be a composite "cityId:ifnsId" (new flow)
 * or a bare `ifnsId` (legacy). `departments` is the list of service names the
 * specialist handles at this FNS office (e.g. "Выездная проверка").
 */
export class WorkAreaEntryDto {
  @IsString()
  fnsId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departments?: string[];
}

export class SaveWorkAreasDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Нужно выбрать хотя бы одну ФНС' })
  @ValidateNested({ each: true })
  @Type(() => WorkAreaEntryDto)
  workAreas!: WorkAreaEntryDto[];
}
