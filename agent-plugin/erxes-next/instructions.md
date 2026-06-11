# erxes Clawhub Plugin Rules

This plugin is for OpenClaw/Clawhub agents operating erxes through the live GraphQL API. It is not a generic CRM integration.

## Hard Anti-Hallucination Rules

- Stay inside erxes. Do not switch to HubSpot, Salesforce, generic OAuth, generic CRM schemas, REST endpoints, or invented tables when an erxes lookup fails.
- Use only evidence from this plugin, the live erxes API response, or user-provided details. If none of those contain the answer, say what is missing and ask for it.
- Before any API work, make sure the task has `ERXES_BASE_URL`. If missing, ask for the gateway URL and stop.
- If a write action lacks required fields, ask for the missing fields before calling the mutation. Do not invent IDs, statuses, users, teams, projects, buildings, units, dates, prices, or permissions.
- If the user gives a name instead of an `_id`, search or list likely matches first, then ask which exact record to use.
- If a reference file does not contain the operation, do not fabricate a GraphQL operation. Try GraphQL introspection only if available; otherwise ask for the schema/operation name.
- Never claim a mutation succeeded unless the live API response confirms it.
- Never expose `accessToken`, `refreshToken`, raw session JSON, auth headers, API keys, cookies, or `.env` values.
- If authentication, permissions, scope, or session state is unclear, diagnose OAuth/session first. Do not continue with business mutations.

## Required First Step

Before any erxes work, check the persisted runtime session first. Do NOT ask the user to OAuth/login if a saved session already exists:

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> node scripts/erxes-auth.mjs status
```

- If `authenticated: true` → proceed directly with the user's request. Never ask the user to login again.
- If `authenticated: false` → run the login flow once (see Login below), then continue.
- Expired access tokens are refreshed silently by the session manager; that is never a reason to ask the user to OAuth.
- Only ask the user to OAuth again when: no saved session exists, refresh fails, the saved session is older than the configured persistence duration, the base URL / client id / client secret changed, or the user explicitly asks to logout/reset auth.

When this plugin is installed or used for a new conversation, collect these facts before doing erxes work:

- `ERXES_BASE_URL`: gateway URL, usually `https://<subdomain>.next.erxes.io/gateway` or `http://localhost:4000`.
- `ERXES_CLIENT_ID`: required confidential OAuth client id.
- `ERXES_CLIENT_SECRET`: required confidential OAuth client secret.
- Target workflow: core, block plugin, operation plugin, or unknown.
- Intended action: read/list/search/group/create/update/delete/convert/publish/unpublish.
- Exact target identifiers when the action is risky or writes data.

If the user only says "fix OAuth", "session expires", or "bot working bad", ask for:

- gateway URL
- client id used by OpenClaw
- whether the browser approval page succeeds
- the sanitized OAuth error text/status
- `expiresIn` from the login response, without tokens
- whether the failing call is GraphQL, plugin install, or Clawhub agent chat

## Login

Use `scripts/login.sh` for first-time authentication only — and only after `node scripts/erxes-auth.mjs status` reported `authenticated: false`.

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> bash scripts/login.sh
```

- `ERXES_BASE_URL` is required.
- `ERXES_CLIENT_ID` is required. Do not use a default client id.
- `ERXES_CLIENT_SECRET` is required. erxes uses confidential OAuth only and helpers send it as `client_secret` in the OAuth JSON body.
- OAuth endpoints must not send the `erxes-subdomain` header. Let the gateway infer the tenant from the host, then use the returned `subdomain` only for GraphQL calls.
- Accept the URL in whatever form the user gives and normalize it to `ERXES_BASE_URL=<url>`.
- Do not explain OAuth internals unless the user asks.
- Do not ask the user to copy tokens manually.
- Do not store tokens in project files.
- The script opens the browser, waits for approval, then persists the session in the OpenClaw runtime state directory (outside the plugin source tree, dir mode 700 / file mode 600) and prints only a safe status JSON. Tokens are never printed.
- After a successful login the session is reused automatically for every future erxes request — in this conversation and after runtime restarts — until it expires or the user logs out.
- Device codes expire after 10 minutes.
- Confidential OAuth clients should return `expiresIn: 28800` seconds, about 8 hours.
- Missing or wrong `ERXES_CLIENT_SECRET` produces `invalid_client`.
- If `expiresIn` is lower than 28800, treat it as a backend/client configuration mismatch and report it with the sanitized OAuth response.

Use [erxes-app-token-auth.md](./erxes-app-token-auth.md) only when you need the quick login reference.

## API calls

Make every erxes GraphQL call through the session manager. Never handle, read, or print raw tokens yourself.

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> \
node scripts/erxes-auth.mjs graphql \
  --query 'query Customers($page: Int) { customers(page: $page) { _id firstName } }' \
  --variables '{"page": 1}'
```

- The manager loads the saved session, adds `Authorization: Bearer ...` and `erxes-subdomain` headers itself, and prints only the GraphQL response JSON.
- If the access token is expired, the manager refreshes it silently with the saved rotating refresh token and persists the new tokens. Never ask the user to OAuth for an expired access token.
- Exit code 2 means OAuth login is genuinely required (no session, refresh failed, or session older than the configured duration). Only then run the login flow.
- Long queries can be passed with `--query-file <path>` or piped on stdin.
- Use [erxes-graphql-api.md](./erxes-graphql-api.md) only when you need query or mutation examples.
- Assume OpenClaw is operating as the erxes owner unless the live API proves otherwise.
- Do not stop a normal workflow just because the backend source defines permission names. Treat those as implementation detail, not a user-facing blocker.
- If GraphQL rejects a call because a scope or permission is missing, report the missing scope and ask the user to update the OAuth client. Do not rerun OAuth until the user confirms the client scopes changed.

On `Unauthorized`, `invalid_grant`, expired token, or a GraphQL auth error:

1. The session manager already refreshes once and retries automatically; a request that was rejected for auth never executed, so the retry is safe for reads and writes.
2. If the command exits with code 2, the refresh failed or the session expired — run the device login flow again.
3. If scopes were changed in erxes Settings > OAuth Clients, run the device login flow once to grant the new scopes.

## Auth Session Persistence

The plugin persists OAuth sessions at runtime so the user does not OAuth again for every request.

- `node scripts/erxes-auth.mjs status` — safe auth status: `authenticated`, base URL, subdomain, client id, session/access-token expiry dates, configured duration. Never tokens. Run this before asking the user to login.
- `node scripts/erxes-auth.mjs logout` — delete the saved session for the current base URL/client (`--all` clears every saved session). Run this when the user says "logout erxes", "reset erxes auth", or similar. The next erxes request will require OAuth again.
- `node scripts/erxes-auth.mjs set-duration <3m|6m|1y>` — set how long a saved session stays valid before re-login is required. Default is `6m`. Run this when the user asks to change the auth duration; `get-duration` shows the current value. The `ERXES_AUTH_DURATION` env/config value overrides the stored setting.
- Sessions are keyed by base URL + client id + client secret. Changing any of them never reuses an old session.
- Tell the user about logout/reset and the 3m/6m/1y duration choice if they ask how auth persistence works.

---

## Safe Action Rules

- Read, list, search, filter, group, and summarize can run directly.
- If the user asks to group results, fetch the matching list first and group the returned records in the response.
- For create or update, if the target record or required fields are unclear, summarize the planned change and ask only for the missing information.
- For delete, remove, deactivate, publish, unpublish, end, transfer, or convert actions, always identify the exact record and ask for explicit confirmation before sending the mutation.
- Never print `accessToken`, `refreshToken`, raw session JSON, or auth headers.
- Leave token handling to `scripts/erxes-auth.mjs`; the persisted session file lives outside the plugin/source tree and must never be read back into chat.
- Assume owner-mode access for discovered workflows. Only mention access problems if the live API actually rejects the request.

## Follow-Up Rules

- If the user gives a name but not an `_id`, search first, show the likely matches, then ask which record should be used.
- If the workflow depends on team, project, status, milestone, cycle, building, zoning, or unit IDs, fetch the choices first instead of guessing.
- Ask only for fields that are still missing.
- Warn before risky mutations:
- `blockDeleteBuilding` fails if the building still has zonings.
- `blockDeleteBuildingZoning` fails if the zoning still has units.
- `blockUpdateUnit` can fail if the unit already has a signed contract.
- `blockOpptyConvertToContract` needs both a target unit and a payment plan.
- `operationConvertTriageToTask` may need a valid team-specific status type.

## Харилцагч

- Бүх харилцагчийн жагсаалт харах
- Нэр, имэйл, утсаар хайх
- Харилцагчийн дэлгэрэнгүй мэдээлэл харах
- Төрлөөр нь бүлэглэх (үйлчлүүлэгч / боломжит / зочин)
- Шинэ харилцагч нэмэх
- Харилцагчийн мэдээлэл засах
- Харилцагч устгах
- Давхардсан харилцагчийг нэгтгэх

## Бүтээгдэхүүн

- Бүтээгдэхүүний жагсаалт харах
- Нэг бүтээгдэхүүний дэлгэрэнгүй харах
- Шинэ бүтээгдэхүүн нэмэх
- Бүтээгдэхүүн засах, устгах, нэгтгэх
- Ангилал болон хэмжих нэгж удирдах

## Шошго

- Бүх шошго харах
- Шошго нэмэх, засах, устгах
- Харилцагч эсвэл бүтээгдэхүүнд шошго хавсаргах

## Баримт бичиг

- Баримт бичгийн жагсаалт харах
- Баримт бичиг нэмэх, засах, устгах

## Брэнд

- Брэндийн жагсаалт харах
- Брэнд нэмэх, засах, устгах

## Автоматжуулалт

- Бүх автоматжуулалтын жагсаалт харах
- Автоматжуулалт нэмэх, засах, идэвхжүүлэх, устгах

## Байгууллагын бүтэц

- Хэлтэс, салбар, нэгж, албан тушаалын бүтэц харах
- Хэлтэс, салбар, нэгж, тушаал нэмэх, засах, устгах

## Багийн гишүүд

- Гишүүдийн жагсаалт харах
- Шинэ гишүүн урих
- Гишүүний мэдээлэл засах
- Гишүүнийг идэвхгүй болгох

## Block Plugin

- Use [block-api.md](./block-api.md) when the user wants help with block-side SaaS workflows such as projects, buildings, floor zonings, units, unit types, opportunities, statuses, payment plans, contracts, offers, invoices, documents, attachments, notes, or the developer profile.
- Natural language examples:
- "Show me all blocks grouped by status"
- "Create a new block with these details"
- "Find all units in this building"
- "Move this opportunity to another status"
- "Create a payment plan for this project"
- Read and list actions can run directly.
- Create and update actions should summarize the planned write first when important fields are ambiguous.
- Delete, publish, unpublish, transfer, and convert actions must always ask for confirmation first.

## Operation Plugin

- Use [operation-api.md](./operation-api.md) when the user wants help with operation-side SaaS workflows such as projects, tasks, triage, teams, statuses, cycles, milestones, notes, activities, and templates.
- Natural language examples:
- "Show me active projects"
- "Find tasks with no assignee"
- "Create a triage item for this team"
- "Convert this triage item to a task"
- "Summarize milestone progress"
- Read and list actions can run directly.
- Create and update actions should summarize the planned write first when important fields are ambiguous.
- Delete, end-cycle, remove-member, and status-removal actions must always ask for confirmation first.

## Plugin Files
- scripts/erxes-auth.mjs — Persistent auth/session manager and GraphQL runner (status / login / graphql / refresh / logout / set-duration)
- scripts/login.sh — Browser login helper
- erxes-app-token-auth.md — Confidential OAuth login reference
- erxes-graphql-api.md — Үйлдлүүдийн техникийн лавлах
- block-api.md — block_api SaaS workflow болон exact GraphQL ops
- operation-api.md — operation_api SaaS workflow болон exact GraphQL ops
