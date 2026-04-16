import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * Body for POST /api/threads — direct-chat flow (W-1 migration).
 *
 * A specialist opens a thread on a request by sending the first message.
 * Creates Thread + Message atomically; UNIQUE (requestId, specialistId)
 * ensures idempotency — duplicate call returns the existing thread.
 */
export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @IsString()
  @Length(10, 1000, {
    message: 'firstMessage должно быть от 10 до 1000 символов',
  })
  firstMessage!: string;
}
