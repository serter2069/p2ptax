#!/bin/bash
set -e
cd /var/www/p2ptax
unset CI
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://p2ptax.smartlaunchhub.com}"
export BROWSER=none
exec /usr/bin/script -qfec "node_modules/.bin/expo start --web --port 19006" /dev/null
