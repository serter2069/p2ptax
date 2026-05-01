# Audit log

## 2026-04-30 — Major refactor session

- Brand: single `<Logo>` component as source of truth (commit 3c4afd3)
- Logo v2: crosshair-temple, multi-variant assets (a467518)
- Dead code purge: -1,636 LOC across 37 files (0fde1e7)
- Hooks: useCities, useServices, useAuthGuard, useOtpRequest, useHeartbeat
- Mobile chrome: HeaderHome mounted on (tabs) — was missing entirely (b76f015)
- Visual audit: scripts/visual-audit.mjs — 24 routes × 2 viewports
- Tooling: ESLint guard for raw TextInput, pre-commit warn on header changes (a474bb1)
- Architectural map: see `.audit/structure-audit.md`
