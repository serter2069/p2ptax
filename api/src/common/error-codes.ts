/**
 * Machine-readable error codes for the standardized API error contract.
 * Every API error response includes one of these as `error.code`.
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/** Default Russian messages per error code. */
export const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Ошибка валидации',
  [ErrorCode.UNAUTHORIZED]: 'Необходима авторизация',
  [ErrorCode.FORBIDDEN]: 'Доступ запрещён',
  [ErrorCode.NOT_FOUND]: 'Ресурс не найден',
  [ErrorCode.CONFLICT]: 'Конфликт данных',
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Нарушение бизнес-правила',
  [ErrorCode.RATE_LIMITED]: 'Слишком много запросов, попробуйте позже',
  [ErrorCode.INTERNAL_ERROR]: 'Внутренняя ошибка сервера',
};

/** Map HTTP status → ErrorCode. */
export function errorCodeFromStatus(status: number): ErrorCode {
  if (status === 400) return ErrorCode.VALIDATION_ERROR;
  if (status === 401) return ErrorCode.UNAUTHORIZED;
  if (status === 403) return ErrorCode.FORBIDDEN;
  if (status === 404) return ErrorCode.NOT_FOUND;
  if (status === 409) return ErrorCode.CONFLICT;
  if (status === 422) return ErrorCode.BUSINESS_RULE_VIOLATION;
  if (status === 429) return ErrorCode.RATE_LIMITED;
  return ErrorCode.INTERNAL_ERROR;
}
