---
title: erxes Quick Login
description: Confidential OAuth login instructions for the erxes plugin
---

# erxes Quick Login

Use this when the plugin needs to authenticate before a GraphQL call.

## Required input

- `ERXES_BASE_URL`

## Required confidential OAuth input

- `ERXES_CLIENT_ID`
- `ERXES_CLIENT_SECRET`

## Login command

```bash
ERXES_BASE_URL=<gateway-url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> bash scripts/login.sh
```

Examples:

```bash
ERXES_BASE_URL=http://localhost:4000 ERXES_CLIENT_ID=my-client ERXES_CLIENT_SECRET=ocs_xxx bash scripts/login.sh
```

## What the script does

1. Opens the browser approval page.
2. Waits until the user approves access.
3. Prints session JSON to stdout for the current task.

Do not walk the user through OAuth internals unless they explicitly ask. Do not print tokens in chat.

## Expiry facts

- Device code approval expires after 10 minutes.
- Confidential OAuth clients should return `expiresIn` based on the selected access-token lifetime: `31536000` for 1 year, `15552000` for 6 months, or `7776000` for 3 months.
- `ERXES_CLIENT_SECRET` is required; helpers send it as `oauth_secret`.
- Refresh tokens rotate on every refresh. Replace the in-memory refresh token after each successful refresh.
- If `expiresIn` is not one of the expected confidential lifetime values, treat it as a backend/client configuration mismatch, not a hallucinated platform outage.

## Session payload

The script returns JSON like this:

```json
{
  "subdomain": "demo",
  "base_url": "https://demo.next.erxes.io/gateway",
  "client_id": "my-confidential-client",
  "token": {
    "tokenType": "Bearer",
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 31536000
  }
}
```

Use `token.accessToken` for `Authorization: Bearer ...` and `subdomain` for the `erxes-subdomain` header.
Keep this payload in memory for the current task and do not save it to project files.

## Refresh command

```bash
ERXES_BASE_URL=<gateway-url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> ERXES_REFRESH_TOKEN=<refresh-token> bash scripts/refresh-token.sh
```

Use this after an auth failure or before a long task when the token is close to expiry. The command returns the same session JSON shape as login.

## When to run it

- Before the first authenticated API call
- Again only if the current session is unavailable or refresh fails
- Do not rerun login just because the access token expired; refresh once first
