---
name: test
agent: CodeActAgent
triggers:
- test
- dotest
- qa
---

# Test — Automated UI QA via Browser + Vision Model

## Goal
Test ALL pages listed in `constants/pageRegistry.ts` on the staging URL.
For each page: screenshot every state, run visual QA, file bugs as GitHub Issues.

## Staging URL
```
https://p2ptax.smartlaunchhub.com
```

## Step 1: Read pages to test
```bash
cat constants/pageRegistry.ts
```
Extract all pages with their `route`, `testScenarios[]`, `stateCount`.

## Step 2: Install Playwright (if not installed)
```bash
pip install playwright -q && python3 -m playwright install chromium --with-deps
```

## Step 3: For each page — run test scenarios

### 3a. Screenshot every state on staging
```python
from playwright.sync_api import sync_playwright

STAGING = "https://p2ptax.smartlaunchhub.com"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})

    for route in routes:
        url = f"{STAGING}{route}"
        page.goto(url, wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1000)
        screenshot_path = f"/tmp/qa_{route.replace('/', '_')}.png"
        page.screenshot(path=screenshot_path, full_page=False)

    browser.close()
```

### 3b. Run visual QA on each screenshot
```bash
python3 scripts/qa-vision.py /tmp/qa_screenshot.png --json
```

The script returns JSON:
```json
{
  "verdict": "PASS" or "FAIL",
  "bugs_found": 2,
  "raw": "BUG: TEXT OVERFLOW — username truncated at 15 chars — top right corner\n..."
}
```

### 3c. Run testScenarios from pageRegistry
For each page that has `testScenarios[]`, execute each scenario step:
```python
for scenario in page_entry.testScenarios:
    for step in scenario.steps:
        # execute step via Playwright
        # screenshot after each step
        # run qa-vision on screenshot
```

## Step 4: File bugs as GitHub Issues

For EACH bug found, create a GitHub Issue:
```bash
gh issue create \
  --repo serter2069/p2ptax \
  --title "bug: [PageName] — [brief description]" \
  --body "**Page:** /route
**Scenario:** scenario name
**Bug:** exact description from vision model
**Steps to reproduce:**
1. Open staging URL
2. Navigate to page
3. Observe issue" \
  --label "bug,oh:ready"
```

**IMPORTANT:** Only file bugs that are CLEAR visual issues. Skip false positives.
One issue per bug. Do not duplicate existing open issues (check first with `gh issue list`).

## Step 5: Summary report

After testing all pages, output:
```
=== QA SUMMARY ===
Pages tested: N
Screenshots taken: N
Bugs found: N
Issues created: N (links)
VERDICT: PASS / FAIL
```

## RULES

1. **Screenshot EVERY state** — not just the first one. Scroll if needed.
2. **Mobile viewport only** — 390x844 (iPhone 14 Pro size)
3. **Wait for network idle** — pages with API calls need time to load
4. **Batch bugs** — test all pages first, then file all issues at once
5. **Check existing issues** before filing — don't duplicate
6. **Proto pages** — test both `/proto/states/[id]` AND real staging routes
