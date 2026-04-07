import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RespondRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;
}
