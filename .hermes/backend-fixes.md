# P2PTAX Backend Fixes - Priority Order

## CRITICAL SECURITY (Fix NOW)
1. routes/requests.ts:156 - POST /public auth bypass (userId from body) - ДОБАВИТЬ authMiddleware
2. routes/upload.ts:164 - Unauthenticated signed URL - ДОБАВИТЬ authMiddleware
3. routes/auth.ts:77 - No rate limit на OTP verify - ДОБАВИТЬ rate limiter
4. middleware/auth.ts:36-50 - Async ban check race condition - ИСПРАВИТЬ async/await
5. index.ts:29 - Open CORS origin:* - ОГРАНИЧИТЬ CORS
6. index.ts:30 - No JSON body limit - ДОБАВИТЬ limit: '1mb'
7. index.ts - No global error handler - ДОБАВИТЬ

## HIGH - Input Validation
8. UUID validation на всех route params
9. Type validation на request body
10. Length validation на текстовые поля

## HIGH - Security
11. HTTP security headers (helmet)
12. JWT algorithm specification
13. Rate limiting на все endpoints
14. Global 404 handler

## MEDIUM - Performance
15. N+1 queries (7 мест) - оптимизировать batch queries
16. Missing pagination (12 мест)
17. Missing Prisma indexes (20)

## MEDIUM - Data Integrity
18. Missing transactions (3 места)

## LOW - Code Quality
19. Inconsistent error responses (English everywhere)
20. Request logging (morgan)
21. Request ID middleware
