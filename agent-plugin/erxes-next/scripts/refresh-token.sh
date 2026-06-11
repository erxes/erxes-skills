#!/bin/bash
# erxes OAuth refresh helper.
# Usage: ERXES_BASE_URL=... ERXES_CLIENT_ID=... ERXES_CLIENT_SECRET=... bash scripts/refresh-token.sh
#
# Loads the persisted session and refreshes the access token silently using
# the saved (rotating) refresh token. Prints only a safe status JSON — never
# tokens. ERXES_REFRESH_TOKEN is no longer needed; the refresh token is read
# from the persisted session store.
set -euo pipefail

exec node "$(dirname "$0")/erxes-auth.mjs" refresh "$@"
