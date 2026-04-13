import { IsString, IsNotEmpty, MaxLength, IsInt, Min, IsDateString } from 'class-validator';

export class RespondRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comment!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsDateString()
  deadline!: string;
}
