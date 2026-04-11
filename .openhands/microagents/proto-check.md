---
name: proto-check
agent: CodeActAgent
triggers:
- proto-check
---

# Proto-Check — QC Automated Checker

## Goal
Quality-check ALL prototype pages (entries in `constants/pageRegistry.ts` with qaCycles < 5). Auto-fix every issue found. No asking for permission — just fix it.

## Step 1: Load pages to check
```bash
cat constants/pageRegistry.ts
```
Process all pages where `qaCycles` < 5 (or missing). Skip pages where `qaCycles >= 5` (they await manual review).

## Step 2: For each page — check all 21 criteria

Read the page's `components/proto/states/[PageName]States.tsx` and check:

| # | Check | Auto-fix |
|---|-------|---------|
| 1 | All states listed in pageRegistry present in States.tsx | Add missing StateSection |
| 2 | All UI elements expected for this page type present | Add missing elements |
| 3 | Real images (picsum/unsplash) — NO gray placeholders | Replace with `picsum.photos/seed/{name}/{w}/{h}` |
| 4 | Interactive inputs (TextInput/checkbox/toggle use useState) | Add useState + handlers |
| 5 | Brand colors only — no hardcoded hex not from brand | Replace with brand tokens |
| 6 | **NO EMOJI** — ABSOLUTE BLOCKER (even one = score 0) | Delete ALL / replace with Feather icon |
| 7 | Responsive — no fixed px widths on containers | Replace with flex/percentage |
| 8 | pageRegistry entry has correct stateCount | Fix stateCount to match actual StateSection count |
| 9 | Nav variant correct for page type | Fix nav field |
| 10 | Working navigation — buttons/links go to /proto/states/[id] | Add onPress → `window.open('/proto/states/X', '_self')` |
| 11 | navFrom[] and navTo[] filled in pageRegistry | Fill from page navigation logic |
| 12 | Cross-screen consistency — data shown matches data collected | Add missing fields, remove ghost fields |
| 13 | Popup/modal states show FULL screen (not popup in isolation) | Add background content + overlay behind popup |
| 14 | PageShell in every StateSection (header + content + tabbar) | Wrap with ProtoHeader + ProtoTabBar |
| 15 | Min height 844px per StateSection | Add `style={{ minHeight: 844 }}` |
| 16 | No double header — ProtoLayout only has back button | Remove header elements outside StateSections |
| 17 | marginBottom: 80 in StateSection wrapper | Set marginBottom: 80 |
| 18 | Mobile vs desktop nav correct — no tab bar on desktop | Add `const isMobile = width < 768; {isMobile && <ProtoTabBar />}` |
| 19 | Brand page exists (group: 'Brand', id: 'brand') | Create BrandStates.tsx with color palette |
| 20 | Overview page exists (group: 'Overview', id: 'overview') | Create OverviewStates.tsx with project description |
| 21 | Components page exists (group: 'Brand', id: 'components') | Create ComponentsStates.tsx with UI components |

**SCORE = number of criteria passed (0–21)**
- Criterion #6 (no emoji): if ANY emoji found → SCORE = 0, loop continues until fixed

## Step 3: Fix all issues found
Fix everything you can. Then re-check. Repeat until SCORE >= 18/21 or 5 iterations.

## Step 4: Update pageRegistry.ts
```typescript
// For each checked page:
qaCycles: (currentValue + 1),
qaScore: SCORE,
// If qaCycles >= 5: page is ready for manual review
```

## Step 5: Commit and push
```bash
git add constants/pageRegistry.ts components/proto/states/
git commit -m "proto-check: QC pass cycle N — score S/21"
git push origin development
```

