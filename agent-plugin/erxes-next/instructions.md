# erxes-next Clawhub Plugin Rules

This plugin is for OpenClaw/Clawhub agents operating erxes Next through the live GraphQL API. It is not a generic CRM integration.

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

Use `scripts/login.sh` for authentication.

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> bash scripts/login.sh
```

- `ERXES_BASE_URL` is required.
- `ERXES_CLIENT_ID` is required. Do not use a default client id.
- `ERXES_CLIENT_SECRET` is required. erxes-next uses confidential OAuth only and helpers send it as the `oauth_secret` header.
- Accept the URL in whatever form the user gives and normalize it to `ERXES_BASE_URL=<url>`.
- Do not explain OAuth internals unless the user asks.
- Do not ask the user to copy tokens manually.
- Do not store tokens in project files.
- The script opens the browser, waits for approval, and prints a session JSON payload to stdout.
- Device codes expire after 10 minutes.
- Confidential OAuth clients should return `expiresIn: 28800` seconds, about 8 hours.
- Missing or wrong `ERXES_CLIENT_SECRET` produces `invalid_client`.
- If `expiresIn` is lower than 28800, treat it as a backend/client configuration mismatch and report it with the sanitized OAuth response.

Use [erxes-app-token-auth.md](./erxes-app-token-auth.md) only when you need the quick login reference.

## API calls

After login, use the returned session payload directly.

- Read `accessToken` from the login JSON response.
- Send `Authorization: Bearer <accessToken>` and `erxes-subdomain: <subdomain>` headers on GraphQL calls.
- If the access token expires during the current task, refresh with `grant_type=refresh_token`.
- Refresh tokens rotate. After a successful refresh, replace both the in-memory `accessToken` and `refreshToken`; never reuse the old refresh token.
- Do not write tokens to `.auth.json` or any other project file.
- Use [erxes-graphql-api.md](./erxes-graphql-api.md) only when you need query or mutation examples.
- Assume OpenClaw is operating as the erxes owner unless the live API proves otherwise.
- Do not stop a normal workflow just because the backend source defines permission names. Treat those as implementation detail, not a user-facing blocker.

Refresh command shape:

```bash
ERXES_BASE_URL=<url> ERXES_CLIENT_ID=<client-id> ERXES_CLIENT_SECRET=<client-secret> ERXES_REFRESH_TOKEN=<refresh-token> bash scripts/refresh-token.sh
```

On `Unauthorized`, `invalid_grant`, expired token, or a GraphQL auth error:

1. Refresh once using the in-memory refresh token.
2. Retry the exact failed read request once.
3. For writes, do not silently retry if the mutation may have side effects. Check whether the write happened first or ask the user.
4. If refresh fails, run the device login flow again.

---

## Safe Action Rules

- Read, list, search, filter, group, and summarize can run directly.
- If the user asks to group results, fetch the matching list first and group the returned records in the response.
- For create or update, if the target record or required fields are unclear, summarize the planned change and ask only for the missing information.
- For delete, remove, deactivate, publish, unpublish, end, transfer, or convert actions, always identify the exact record and ask for explicit confirmation before sending the mutation.
- Never print `accessToken`, `refreshToken`, raw session JSON, or auth headers.
- Keep the auth session in memory only for the current task.
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

## Contacts

- List all contacts
- Search by name, email, or phone
- View contact details
- Group by type: customer, lead, or visitor
- Add a new contact
- Edit contact information
- Delete a contact
- Merge duplicate contacts

## Products

- List products
- View one product in detail
- Add a new product
- Edit, delete, or merge products
- Manage categories and units of measure

## Tags

- View all tags
- Add, edit, or delete tags
- Attach tags to contacts or products

## Documents

- List documents
- Add, edit, or delete documents

## Brands

- List brands
- Add, edit, or delete brands

## Automations

- List all automations
- Add, edit, activate, or delete automations

## Organization Structure

- View departments, branches, units, and positions
- Add, edit, or delete departments, branches, units, and positions

## Team Members

- List team members
- Invite a new member
- Edit member information
- Deactivate a member

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
- scripts/login.sh - Browser login helper
- erxes-app-token-auth.md - Confidential OAuth login reference
- erxes-graphql-api.md - Technical reference for operations
- block-api.md - block_api SaaS workflows and exact GraphQL operations
- operation-api.md - operation_api SaaS workflows and exact GraphQL operations
