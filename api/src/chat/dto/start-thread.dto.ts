import { IsString, IsNotEmpty } from 'class-validator';

export class StartThreadDto {
  @IsString()
  @IsNotEmpty()
  otherUserId!: string;
}
