# erxes Agent Plugin

This Clawhub/OpenClaw agent plugin lets agents operate erxes through the live GraphQL API using confidential OAuth device-flow authentication.

The plugin is intentionally scoped to erxes. It should not fall back to generic CRM schemas, invented REST endpoints, or guessed GraphQL operations when an erxes lookup fails.

## What It Supports

- Core erxes workflows: contacts, products, tags, documents, brands, automations, organization structure, and team members.
- Block plugin workflows: projects, buildings, floor zonings, units, unit types, opportunities, statuses, payment plans, contracts, offers, invoices, documents, attachments, notes, and developer profile.
- Operation plugin workflows: projects, tasks, triage, teams, statuses, cycles, milestones, notes, activities, and templates.
- Safe read/list/search/group actions.
- Guarded write actions that require enough fields and confirmation for risky mutations.

## Required Configuration

The plugin requires these values when installed or used:

```txt
ERXES_BASE_URL=https://<subdomain>.next.erxes.io/gateway
ERXES_CLIENT_ID=<confidential-oauth-client-id>
ERXES_CLIENT_SECRET=<confidential-oauth-client-secret>
```

For local development, `ERXES_BASE_URL` can also point to a local gateway, for example:

```txt
ERXES_BASE_URL=http://localhost:4000
```

## Authentication

OAuth sessions are persisted at runtime, so the user OAuths once and later requests (including after runtime restarts) reuse the saved session automatically.

Check the saved session first:

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> node scripts/erxes-auth.mjs status
```

First-time login (only when `status` reports `authenticated: false`):

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> bash scripts/login.sh
```

The helper prints the browser approval URL, waits for approval, persists the session in the OpenClaw runtime state directory (`~/.openclaw/erxes-next-plugin` by default; directory mode 700, file mode 600, outside the git repo), and prints only a safe status JSON. Tokens and secrets are never printed, logged, or committed.

GraphQL calls go through the session manager, which attaches auth headers itself and refreshes expired access tokens silently with the saved rotating refresh token:

```bash
node scripts/erxes-auth.mjs graphql --query '<graphql>' --variables '<json>'
```

### Session persistence controls

- Duration before re-login is required: `3m`, `6m` (default), or `1y` — `node scripts/erxes-auth.mjs set-duration <value>` (or the `ERXES_AUTH_DURATION` env/config value, which takes precedence).
- `node scripts/erxes-auth.mjs logout [--all]` deletes saved session(s); the next erxes request requires OAuth again. Users can say "logout erxes" or "reset erxes auth".
- Sessions are keyed by base URL + client id + client secret; changing any of them requires a fresh login and never reuses an old session.
- Re-login is only needed when: no saved session exists, refresh fails, the session is older than the configured duration, the client config changed, or the user explicitly logs out.

## Testing

```bash
npm test
```

Runs the auth/session manager suite (persistence, silent refresh, duration expiry, logout, session separation, and no-secret-leak checks) with `node --test`.

## Plugin Files

- `plugin.json` - agent plugin manifest.
- `instructions.md` - main agent behavior and safety rules.
- `erxes-app-token-auth.md` - confidential OAuth reference.
- `erxes-graphql-api.md` - core erxes GraphQL operation reference.
- `block-api.md` - block plugin workflows and exact GraphQL operations.
- `operation-api.md` - operation plugin workflows and exact GraphQL operations.
- `lib/` - auth/session manager modules (store, auth, redaction).
- `scripts/erxes-auth.mjs` - persistent auth/session manager CLI (status, login, graphql, refresh, logout, set-duration).
- `scripts/login.sh` - browser login helper (persists the session; prints no tokens).
- `scripts/refresh-token.sh` - silent token refresh helper (uses the saved refresh token).
- `test/auth-session.test.mjs` - auth persistence test suite.

## Updating the Plugin on Clawhub

After editing plugin files:

1. Confirm the plugin docs and manifests are valid.

   ```bash
   node -e "for (const f of ['plugin.json','_meta.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
   ```

2. Review the changed files, then commit and push only the intended plugin updates.

   ```bash
   git status --short
   git add agent-plugin/erxes-next
   git commit -m "fix: update erxes plugin oauth login"
   git push origin main
   ```

3. In Clawhub, open the `erxes-plugin` plugin page.

4. Use the Clawhub update or publish action for the plugin slug:

   ```txt
   erxes-plugin
   ```

5. Verify the installed plugin version or updated contents in a fresh Clawhub agent chat.

6. Test a read-only GraphQL workflow first, then test any write workflow only with explicit confirmation and known record IDs.

## Safety Rules

- Never invent record IDs, statuses, users, teams, dates, prices, or permissions.
- Search first when the user provides a name instead of an `_id`.
- Ask for missing required fields before write mutations.
- Ask for explicit confirmation before delete, remove, deactivate, publish, unpublish, transfer, convert, or end actions.
- Never expose access tokens, refresh tokens, raw session JSON, auth headers, API keys, cookies, or `.env` values.
