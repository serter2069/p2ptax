import { IsObject, IsString, IsNotEmpty } from 'class-validator';

export class UpdateSettingsDto {
  @IsObject()
  settings!: Record<string, string>;
}
