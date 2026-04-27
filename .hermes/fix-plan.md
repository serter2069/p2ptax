# P2PTAX Audit & Fix Plan

## CRITICAL (4 issues) - Must fix first
1. [x] api/src/lib/jwt.ts - hardcoded JWT_SECRET fallback
2. [x] api/src/routes/messages.ts - hardcoded MinIO credentials
3. [x] api/src/routes/upload.ts - hardcoded MinIO credentials
4. [x] api/src/notifications/notification.queue.ts - Redis defaults without validation

## HIGH (1 issue)
5. [x] Duplicate MinIO client config in messages.ts and upload.ts - extract to shared lib/minio.ts

## MEDIUM (131 issues)
6. [x] 120x `as never` navigation type bypasses - create typed navigation helper
7. [x] 5x eslint-disable react-hooks/exhaustive-deps - fix deps arrays
8. [x] 6x environment variable defaults without validation - add config validation

## LOW (2 issues)
9. [x] 2 TODO comments - implement or document
10. [x] 3x `as any` style assertions - document or fix

## INFO
11. console.error throughout - acceptable for now, migrate to Sentry later
