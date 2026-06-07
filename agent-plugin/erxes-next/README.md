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

Use the login helper:

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> bash scripts/login.sh
```

The helper opens the browser for approval and prints the session JSON to stdout. Do not commit tokens, `.env` files, raw session JSON, auth headers, cookies, or secrets.

If an access token expires during a task, refresh it with:

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> ERXES_REFRESH_TOKEN=<refresh-token> bash scripts/refresh-token.sh
```

## Plugin Files

- `plugin.json` - agent plugin manifest.
- `instructions.md` - main agent behavior and safety rules.
- `erxes-app-token-auth.md` - confidential OAuth reference.
- `erxes-graphql-api.md` - core erxes GraphQL operation reference.
- `block-api.md` - block plugin workflows and exact GraphQL operations.
- `operation-api.md` - operation plugin workflows and exact GraphQL operations.
- `scripts/login.sh` - browser login helper.
- `scripts/refresh-token.sh` - token refresh helper.

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
