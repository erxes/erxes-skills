#!/bin/bash
# erxes OAuth Device Flow login.
# Usage: ERXES_BASE_URL=https://example.next.erxes.io/gateway ERXES_CLIENT_ID=... ERXES_CLIENT_SECRET=... bash scripts/login.sh
#
# Prints the browser approval URL, waits for approval, then PERSISTS the
# session in the OpenClaw runtime state directory (~/.openclaw/erxes-next-plugin
# by default, dir 700 / file 600). Prints only a safe status JSON — never
# tokens or secrets. Later erxes requests reuse the saved session automatically
# via scripts/erxes-auth.mjs.
set -euo pipefail

exec node "$(dirname "$0")/erxes-auth.mjs" login "$@"
