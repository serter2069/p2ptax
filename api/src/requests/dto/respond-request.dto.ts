import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RespondRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;
}
