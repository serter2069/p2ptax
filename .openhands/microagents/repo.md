# P2PTax — Project Context

**Description:** Tax consultant marketplace. Clients find specialists, specialists get clients.
**Tech stack:** Expo + React Native + NativeWind (Tailwind) + TypeScript
**GitHub repo:** serter2069/p2ptax
**Staging:** https://p2ptax.smartlaunchhub.com (not yet deployed)
**Proto hub:** https://proto.smartlaunchhub.com/p2ptax/ (password: Sara@dura!)
**Development branch:** development

## Key files
- `constants/pageRegistry.ts` — SINGLE SOURCE OF TRUTH for all pages + QA state
- `constants/protoMeta.ts` — project description, roles, user scenarios
- `components/proto/states/` — one *States.tsx per page
- `app/proto/states/[page].tsx` — dynamic route that renders States.tsx
- `constants/brand.ts` or similar — brand colors and typography

## Commit & push
```bash
git add .
git commit -m "proto: description of changes"
git push origin development
```

## Proto pages status
Check `constants/pageRegistry.ts` for `qaCycles` field on each entry.
- `qaCycles` missing or 0–4 → needs more work
- `qaCycles >= 5` → ready for manual review, skip
