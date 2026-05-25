#!/bin/bash
# erxes OAuth refresh-token helper
# Usage: ERXES_BASE_URL=https://example.next.erxes.io/gateway ERXES_CLIENT_ID=... ERXES_CLIENT_SECRET=... ERXES_REFRESH_TOKEN=... bash scripts/refresh-token.sh
set -euo pipefail

BASE="${ERXES_BASE_URL%/}"
CLIENT="${ERXES_CLIENT_ID:-}"
SECRET="${ERXES_CLIENT_SECRET:-}"
REFRESH="${ERXES_REFRESH_TOKEN:-}"

if [ -z "$BASE" ]; then
  echo "ERXES_BASE_URL is required" >&2
  exit 1
fi

if [ -z "$CLIENT" ]; then
  echo "ERXES_CLIENT_ID is required" >&2
  exit 1
fi

if [ -z "$SECRET" ]; then
  echo "ERXES_CLIENT_SECRET is required for erxes-next confidential login" >&2
  exit 1
fi

if [ -z "$REFRESH" ]; then
  echo "ERXES_REFRESH_TOKEN is required" >&2
  exit 1
fi

# Extract subdomain from a gateway URL like https://demo.next.erxes.io/gateway -> demo
SUB=$(echo "$BASE" | sed -E 's|https?://([^./]+).*|\1|')

AUTH_HEADERS=(-H "Content-Type: application/json" -H "erxes-subdomain: $SUB" -H "oauth_secret: $SECRET")

TOK=$(curl -sf -X POST "$BASE/oauth/token" \
  "${AUTH_HEADERS[@]}" \
  -d "{\"grant_type\":\"refresh_token\",\"refresh_token\":\"$REFRESH\",\"client_id\":\"$CLIENT\"}")

printf '{"subdomain":"%s","base_url":"%s","client_id":"%s","token":%s}\n' "$SUB" "$BASE" "$CLIENT" "$TOK"
