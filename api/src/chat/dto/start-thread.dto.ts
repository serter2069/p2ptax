import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StartThreadDto {
  @IsString()
  @IsNotEmpty()
  otherUserId!: string;

  @IsString()
  @IsOptional()
  requestId?: string;
}
