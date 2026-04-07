import { IsString, IsOptional, MaxLength, IsIn, IsUrl } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['IMAGE', 'DOCUMENT'])
  attachmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentName?: string;
}
