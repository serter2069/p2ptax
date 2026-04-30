#!/usr/bin/env bash
# Pre-commit guard: warn if changes touch headers/layouts without recent visual audit.
set -e
TOUCHED=$(git diff --cached --name-only | grep -E "(Header|_layout|SidebarNav|brand/Logo)\.tsx$" || true)
if [ -n "$TOUCHED" ]; then
  echo "WARN: changes touch chrome files:"
  echo "$TOUCHED"
  echo ""
  echo "Run 'npm run audit:visual' and review .audit/screenshots/ before claiming done."
  echo "(Not blocking commit — informational only.)"
fi
exit 0
