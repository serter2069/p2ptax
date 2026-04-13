import { IsString, IsOptional, MaxLength, MinLength, IsIn, IsUrl, ValidateIf } from 'class-validator';

export class SendMessageDto {
  @ValidateIf((o) => !o.attachmentUrl)
  @IsString({ message: 'content must be a string' })
  @MinLength(1, { message: 'content cannot be empty' })
  @MaxLength(2000, { message: 'content must be at most 2000 characters' })
  content?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'attachmentUrl must be a valid URL' })
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['IMAGE', 'DOCUMENT'], { message: 'attachmentType must be IMAGE or DOCUMENT' })
  attachmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'attachmentName must be at most 255 characters' })
  attachmentName?: string;
}
