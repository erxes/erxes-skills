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
ERXES_BASE_URL=http://localhost:4000 ERXES_CLIENT_ID=my-client ERXES_CLIENT_SECRET=<client-secret> bash scripts/login.sh
```

## What the script does

1. Opens the browser approval page.
2. Waits until the user approves access.
3. Prints session JSON to stdout for the current task.

Do not walk the user through OAuth internals unless they explicitly ask. Do not print tokens in chat.

## Expiry facts

- Device code approval expires after 10 minutes.
- Confidential OAuth clients should return `expiresIn: 28800` seconds, about 8 hours.
- `ERXES_CLIENT_SECRET` is required; helpers send it as `client_secret` in the OAuth JSON body.
- OAuth login and refresh requests do not send `erxes-subdomain`; GraphQL calls still use the returned `subdomain` header.
- Refresh tokens rotate on every refresh. Replace the in-memory refresh token after each successful refresh.
- If `expiresIn` is lower than 28800, treat fast expiry as a backend/client configuration mismatch, not a hallucinated platform outage.

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
    "expiresIn": 28800
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
- Again only if the current session is unavailable, refresh fails, or the OAuth client scopes changed and the user needs to approve the new scopes
- Do not rerun login just because the access token expired; refresh once first
