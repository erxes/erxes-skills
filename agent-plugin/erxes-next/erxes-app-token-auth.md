---
title: erxes Quick Login
description: Confidential OAuth login instructions for the erxes plugin
---

# erxes Quick Login

Use this when the plugin needs to authenticate before a GraphQL call.

## Check the saved session first

Always check the persisted session before starting a login:

```bash
ERXES_BASE_URL=<gateway-url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> node scripts/erxes-auth.mjs status
```

If `authenticated: true`, skip login entirely — the saved session is reused automatically.

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
3. Persists the session in the OpenClaw runtime state directory (dir 700 / file 600, outside the plugin source tree).
4. Prints only a safe status JSON to stdout — never tokens.

Do not walk the user through OAuth internals unless they explicitly ask. Do not print tokens in chat.

## Expiry facts

- Device code approval expires after 10 minutes.
- Confidential OAuth clients should return `expiresIn: 28800` seconds, about 8 hours.
- `ERXES_CLIENT_SECRET` is required; helpers send it as `client_secret` in the OAuth JSON body.
- OAuth login and refresh requests do not send `erxes-subdomain`; GraphQL calls still use the returned `subdomain` header.
- Refresh tokens rotate on every refresh. Replace the in-memory refresh token after each successful refresh.
- If `expiresIn` is lower than 28800, treat fast expiry as a backend/client configuration mismatch, not a hallucinated platform outage.

## Status payload

Login and status print a safe JSON like this (never tokens):

```json
{
  "authenticated": true,
  "baseUrl": "https://demo.next.erxes.io/gateway",
  "subdomain": "demo",
  "clientId": "my-confidential-client",
  "authDuration": "6m",
  "sessionCreatedAt": "2026-06-12T00:00:00.000Z",
  "sessionExpiresAt": "2026-12-09T00:00:00.000Z",
  "accessTokenExpiresAt": "2026-06-12T08:00:00.000Z",
  "canRefresh": true
}
```

Tokens stay inside the persisted session store; GraphQL calls go through `node scripts/erxes-auth.mjs graphql ...`, which attaches `Authorization: Bearer ...` and `erxes-subdomain` itself.

## Refresh command

```bash
ERXES_BASE_URL=<gateway-url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> bash scripts/refresh-token.sh
```

Refresh is normally automatic inside the `graphql` command. This manual form uses the saved rotating refresh token (no `ERXES_REFRESH_TOKEN` needed) and prints the safe status JSON.

## Session persistence

- Sessions persist across conversations and runtime restarts in the OpenClaw state directory.
- Persistence duration is configurable: `3m`, `6m` (default), or `1y` via `node scripts/erxes-auth.mjs set-duration <value>` or the `ERXES_AUTH_DURATION` env/config value.
- `node scripts/erxes-auth.mjs logout` deletes the saved session ("logout erxes" / "reset erxes auth").
- Changing base URL, client id, or client secret never reuses an old session.

## When to run login

- Only when `status` reports `authenticated: false`
- Again only if refresh fails, the session is older than the configured duration, or the OAuth client scopes changed and the user needs to approve the new scopes
- Do not rerun login just because the access token expired; the session manager refreshes silently
