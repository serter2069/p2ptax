import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * Body for POST /api/responses — specialist responds to an open request.
 *
 * This is the core product action: a specialist sees a request in the feed
 * and "отвечает" to it. Under the hood it creates a Thread (participants =
 * client + specialist) and the first Message atomically. The operation is
 * idempotent on (requestId, specialistId) — calling twice returns the same
 * thread.
 */
export class CreateResponseDto {
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @IsString()
  @Length(10, 1000, {
    message: 'message должно быть от 10 до 1000 символов',
  })
  message!: string;
}
