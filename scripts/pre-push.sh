#!/bin/bash
# Pre-push gate. Runs locally before `git push`. Blocks the push if
# anything would land broken on staging:
#
#   1. Frontend tsc --noEmit (root)
#   2. Backend  tsc --noEmit (api/)
#   3. Smoke that Metro answers 200 on localhost:19006 (means the
#      bundle compiles right now — no point pushing something that
#      will break the staging visible to the user)
#   4. Quick warning if there are unstaged changes that aren't being
#      pushed (so you don't push half a feature)
#
# Bypass with `git push --no-verify` if you absolutely know what you're doing.
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

red()    { printf "\033[0;31m%s\033[0m\n" "$*"; }
green()  { printf "\033[0;32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[0;33m%s\033[0m\n" "$*"; }

fail() { red "✗ pre-push: $*"; exit 1; }

echo "▶ pre-push: tsc (frontend)"
if ! npx --no-install tsc --noEmit 2>&1 | tail -50; then
  fail "frontend tsc errors — fix before pushing"
fi
green "✓ frontend tsc clean"

echo "▶ pre-push: tsc (api)"
(
  cd api
  if ! npx --no-install tsc --noEmit 2>&1 | tail -50; then
    fail "api tsc errors — fix before pushing"
  fi
)
green "✓ api tsc clean"

echo "▶ pre-push: Metro health on localhost:19006"
# Retry: Metro can be mid-rebundle right after a save (5-10s window).
# Three tries with 5s pause is enough to stop flapping while still
# blocking a real bundle break.
HTTP=000
for attempt in 1 2 3; do
  HTTP=$(curl -sS -o /tmp/.prepush-metro-body -w "%{http_code}" --max-time 20 http://localhost:19006/ || echo 000)
  [ "$HTTP" = "200" ] && break
  yellow "  attempt $attempt: HTTP $HTTP — retry in 5s"
  sleep 5
done
if [ "$HTTP" != "200" ]; then
  red "✗ Metro returned HTTP $HTTP after 3 tries"
  head -c 800 /tmp/.prepush-metro-body 2>/dev/null
  fail "Metro is not serving — fix the bundle or restart pm2 p2ptax-metro before pushing"
fi
green "✓ Metro 200"

DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ]; then
  yellow "⚠ pre-push: there are uncommitted changes (not blocking the push):"
  echo "$DIRTY" | sed 's/^/    /'
fi

green "✓ pre-push checks passed"
