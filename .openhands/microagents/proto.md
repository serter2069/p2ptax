---
name: proto
agent: CodeActAgent
triggers:
- proto
---

# Proto — Prototype Screen Creator

## Goal
Create or improve prototype screens for mobile app pages. Work on ALL pages with `qaCycles < 5` (or no `qaCycles`).

## Step 1: Read page registry
```bash
cat constants/pageRegistry.ts
```
Find entries where `qaCycles` is missing, 0, 1, 2, 3, or 4. These need work.

## Step 2: Read brand
```bash
# Look for brand file (one of these):
cat constants/brand.ts 2>/dev/null || cat constants/colors.ts 2>/dev/null || cat constants/theme.ts 2>/dev/null
# Also check brand HTML
ls components/proto/states/BrandStates.tsx 2>/dev/null && head -100 components/proto/states/BrandStates.tsx
```

## Step 3: Check proto infrastructure
Required files (create if missing):
```
app/proto/_layout.tsx
app/proto/index.tsx
app/proto/states/_layout.tsx
app/proto/states/[page].tsx
components/proto/ProtoLayout.tsx
components/proto/StateSection.tsx
components/proto/NavComponents.tsx
constants/pageRegistry.ts
```

**MANDATORY system pages** (create if missing):
- `brand` (Brand & Styles) — design tokens visualization
- `overview` (Proto Overview) — project overview, roles, scenarios
- `components` (UI Components) — interactive component showcase

## Step 4: Create/improve States.tsx for each page

File: `components/proto/states/[PageName]States.tsx`

**Structure for each state:**
```tsx
function DefaultState() {
  return (
    <StateSection title="DEFAULT">
      <View style={{ minHeight: 844, flex: 1 }}>
        <ProtoHeader variant="guest" />   {/* ALWAYS include header */}
        <View style={{ flex: 1 }}>
          {/* page content */}
        </View>
        {isMobile && <ProtoTabBar activeTab="home" />}  {/* ONLY on mobile */}
      </View>
    </StateSection>
  );
}
```

**Responsive navigation:**
```tsx
const { width } = useWindowDimensions();
const isMobile = width < 768;
// Mobile: header + bottom tab bar
// Desktop: header with nav items INSIDE, NO tab bar
```

## ABSOLUTE RULES — Violation = fail

1. **NO EMOJI** — zero tolerance. Not even ✓ ✗ 🔥 ✅ ❌ → Use text or Feather icons from `@expo/vector-icons`
2. **Real images only** — no gray placeholders ever
   - Avatars: `https://picsum.photos/seed/{name}/400/400`
   - Photos/banners: `https://picsum.photos/seed/{topic}/800/400`
   - Unsplash: `https://images.unsplash.com/photo-{ID}?w=800&q=80`
3. **Brand colors only** — no hardcoded hex values not from brand
4. **Interactive inputs** — TextInput, checkboxes, toggles, tabs: `useState` + `onChangeText`/`onPress`
5. **Mobile + desktop** — no fixed `width: 375` on containers, use `flex`/`%`/`Dimensions`
6. **Min height 844px** per StateSection — never shorter than a phone screen
7. **Popup states = full screen** — show background content + overlay `rgba(0,0,0,0.5)` + popup on top
8. **No desktop tab bar** — `{isMobile && <ProtoTabBar />}`
9. **marginBottom: 80** in StateSection wrapper (visual separation between states)
10. **No double header** — ProtoLayout only has back button, header is inside StateSection only

## Step 5: Add testScenarios to pageRegistry.ts

For each page you create/improve, add `testScenarios[]` if missing:

```typescript
testScenarios: [
  {
    name: "Guest views [page title]",
    steps: ["open [route]", "verify [key element] visible", "scroll down", "verify content loads"]
  },
  {
    name: "[Primary action on page]",
    steps: ["open [route]", "tap [button/element]", "verify [expected result]"]
  }
]
```

**Rules for scenarios:**
- 2-4 scenarios per page minimum
- Each step = one atomic action ("tap X", "type email", "scroll down", "verify Y visible")
- Cover: initial load, primary action, error state (if applicable)
- Auth pages: add "Wrong OTP" scenario
- List pages: add "Empty state" and "Scroll to bottom" scenarios

## Step 6: Update pageRegistry.ts
```typescript
// After improving a page:
qaCycles: (currentValue + 1),
qaScore: SCORE,  // how many of 10 criteria passed
```

## Step 7: Commit and push
```bash
git add constants/pageRegistry.ts components/proto/states/
git commit -m "proto: improve prototype pages — cycle N"
git push origin development
```

