# erxes Ecommerce + CMS — Mobile Agent Instructions

You build and deploy Expo (React Native) ecommerce mobile apps that are fully connected to erxes POS (products, cart, payment), erxes CMS (pages, blog, navigation), erxes Messenger (in-app chat/support), and push notifications.

Read these files as needed — do not skip them:

| File                                           | Read when                                                  |
| ---------------------------------------------- | ---------------------------------------------------------- |
| [`setup.md`](setup.md)                         | Start of every new build                                   |
| [`conventions.md`](conventions.md)             | Before writing any code — **read this FIRST; it is the source of truth**, then `agents/conventions.md` for global rules |
| [`connect-erxes.md`](../connect-erxes.md)         | Step 0.5 — connecting the app to the erxes gateway         |
| [`connect-messenger.md`](../connect-messenger.md) | Step 3.7 — embedding erxes Messenger (chat/support widget) |
| [`generate.md`](generate.md)                   | Step 4 — code generation                                   |
| [`frontend.md`](../frontend.md)                   | Step 4 — frontend build phases, token system, component architecture. NOTE: its PHASE 2.1 `src/features/` organization is OPTIONAL guidance — the shipped starter uses the FLAT layout (see below); follow the starter |

---

## Shared Module Integration

The ecommerce pipeline REUSES modules from the generic `agents/` folder. Do not duplicate — read the shared files at the correct step.

### Shared Files (read at the specified step)

| File                                | When to Read                     | Purpose                                                                                               |
| ----------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `agents/setup.md`                   | Step 0 (if starting fresh)       | Generic setup collection — ask template type, languages, tone, design strategy, etc.                  |
| `agents/connect-erxes.md`           | Step 0.5                         | Base erxes gateway connection — API URL, client-portal token, headers shared by every module          |
| `agents/ecommerce/pencil-design.md` | Step 3.5                         | Pencil design tool usage, direction previews, design tokens                                           |
| `agents/connect-messenger.md`       | Step 3.7 (after design approved) | erxes Messenger SDK embed — floating chat bubble, brand ID, in-app WebView/native bridge              |
| `agents/frontend.md`                | Step 4 (before code generation)  | Frontend build phases, token system, component architecture, zero-error build protocol — **its PHASE 2.1 `src/features/` organization is optional guidance; the shipped starter's FLAT layout is authoritative (see "Project structure" below)**   |
| `agents/conventions.md`             | Before writing ANY code          | Global code conventions — Expo Router / React Native patterns, NativeWind, TypeScript. **Read AFTER `agents/ecommerce/conventions.md`; on conflict the ecommerce file wins** |

### Ecommerce-Specific Files (always read these)

| File                                      | When to Read                       | Purpose                                                                                                                          |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `agents/ecommerce/setup.md`               | Step 0                             | Ecommerce-specific fields (delivery_types, allow_guest, pos_token)                                                               |
| `agents/ecommerce/conventions.md`         | Before writing ANY code            | Ecommerce-specific conventions — **source of truth** for auth tokens, web-safe secure storage, Apollo v4 headers, Jotai stores, payment flow. Read FIRST, then the generic file |
| `agents/ecommerce/generate.md`            | Step 4                             | Ecommerce code generation — table of contents, build checklist                                                                   |
| `agents/ecommerce/generate-setup.md`      | Step 4                             | Dependencies, NativeWind/Metro/Babel setup, utils, constants, env, app.config.ts                                                 |
| `agents/ecommerce/generate-types.md`      | Step 4                             | TypeScript interfaces                                                                                                            |
| `agents/ecommerce/generate-i18n.md`       | Step 4                             | i18n routing, `expo-localization`, messages JSON (mn/en)                                                                         |
| `agents/ecommerce/generate-core.md`       | Step 4                             | Apollo Client, Jotai stores, root layout / providers                                                                             |
| `agents/ecommerce/generate-graphql.md`    | Step 4                             | GraphQL file map — always CP\_\* query variants (do NOT recreate starter files)                                                  |
| `agents/ecommerce/generate-hooks.md`      | Step 4                             | Auth, order, payment, query hooks                                                                                                |
| `agents/ecommerce/generate-components.md` | Step 4                             | Layout + product components                                                                                                      |
| `agents/ecommerce/generate-pages.md`      | Step 4                             | Home tab, products, product detail (carousel + size/color), **login**, **register**, **profile**, **orders**, **wishlist**, cart |
| `agents/ecommerce/generate-checkout.md`   | Step 4                             | **checkout** + **verify** screens                                                                                                |
| `agents/ecommerce/generate-cms.md`        | Step 4 (`has_cms` true)            | Review system, CMS screens (about, blog)                                                                                         |
| `agents/ecommerce/notification.md`        | Step 4.6 (checkout implementation) | Push notification setup — Expo Notifications, Firebase (Android), APNs (iOS), order/status pushes                                |
| `agents/ecommerce/payment.md`             | Step 4.7 (checkout implementation) | Payment implementation details                                                                                                   |
| `agents/ecommerce/reference.md`           | Step 4 + Step 5                    | GraphQL queries/mutations map, env vars, payment flow checklist                                                                  |

### Routing from Generic Pipeline

When `template_type = "ecommerce"` is selected in `agents/setup.md`:

1. **Stop following `agents/setup.md`** after collecting generic fields
2. **Switch to `agents/ecommerce/AGENTS.md`** immediately
3. **Continue ecommerce-specific setup** (delivery_types, allow_guest, pos_token)
4. **Skip generic business analysis** — ecommerce has its own content flow
5. **Skip generic UX research** — runs only when `enable_ux_research` is set in `store.config.json` (decided at intake)
6. **Proceed to erxes connection (Step 0.5)**, then design (Step 3.5) after setup complete

### File Reading Order for Ecommerce

```
Step 0:   agents/setup.md (generic fields)
          |
          agents/ecommerce/setup.md (ecommerce-specific fields)
          |
Step 0.5: agents/connect-erxes.md (gateway URL, client-portal token, base headers)
          |
Step 0.75:[OPTIONAL] agents/ux-ui-researcher.md (only when enable_ux_research is set)
          |
Step 3.5: agents/ecommerce/pencil-design.md (design directions in Pencil)
          |
Step 3.7: agents/connect-messenger.md (embed erxes Messenger widget)
          |
Step 4:   agents/ecommerce/generate.md (ecommerce code generation)
          agents/ecommerce/generate-setup.md (deps, NativeWind/Metro/Babel, env)
          agents/ecommerce/generate-types.md
          agents/ecommerce/generate-i18n.md
          agents/ecommerce/generate-core.md
          agents/ecommerce/generate-graphql.md
          agents/ecommerce/generate-hooks.md
          agents/ecommerce/generate-components.md
          agents/ecommerce/generate-pages.md
          agents/ecommerce/generate-checkout.md
          agents/ecommerce/generate-cms.md (if has_cms)
          agents/ecommerce/notification.md (push notifications)
          agents/ecommerce/connect-erxes-tickets.md (feedback → tickets, if enable_feedback_tickets)
          agents/ecommerce/conventions.md (ecommerce conventions)
          agents/conventions.md (generic conventions)
          agents/frontend.md (frontend architecture)
          agents/animations.md (animation libraries — if motion level > 0)
          agents/ecommerce/reference.md (GraphQL reference)
          agents/ecommerce/payment.md (payment flow)
          |
Step 5:   agents/ecommerce/reference.md (CMS seeding, env vars)
          |
Step 6-7: agents/ecommerce/reference.md (verify + build/submit)
```

---

## Pipeline — New mobile storefront

### Step 0 — Setup

All intake questions were answered **before the pipeline started** and are already persisted in `store.config.json`, `.env`, and `.env.local` by the top-level pipeline's Step 0 (see `mobile/AGENTS.md`). This step is **validation-only — it must not ask the user anything**.

Validate, in order:

1. `store.config.json` exists and contains every required field: `name`, `template_type = "ecommerce"`, `language`, `defaultLanguage`, `languages`, `tone`, `sections`, `cms_sections`, `delivery_types`, `allow_guest`, `pos_token`, `design_strategy`, `ui_source`, `ui_source_ref`, `deploy_target`, plus `messenger_brand_id` when `enable_messenger` is true and the tickets ids when `enable_feedback_tickets` is true. (`direction_family` and `motion_level` are set by Step 3.5 inference — NOT required at intake.)
2. `.env` contains `GITHUB_TOKEN` (required for starter clone), `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`, `EXPO_PUBLIC_ERXES_API_URL`, `EXPO_PUBLIC_POS_TOKEN`.
3. If any field is missing or invalid → **stop with a hard error naming the field** and instruct re-running the top-level intake. Never prompt mid-run and never invent defaults.

Then execute:

- Update `.env` if any derived value is absent
- Create CMS with `tsx scripts/erxes-cms.ts` (skip when `erxes_cms_id` is already set)
- Save returned `_id` as `ERXES_CMS_ID` in config + env

### Step 0.5 — Connect to erxes

**Read `agents/connect-erxes.md`.**

Establish and verify the base gateway connection before any screen or query is generated:

- Confirm `EXPO_PUBLIC_ERXES_API_URL` reaches the GraphQL gateway
- Confirm the client-portal JWT (`EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`) resolves a valid `clientPortalId`
- Confirm `x-app-token` / `x-messenger-brand-id` headers required by downstream modules (Apollo client, Messenger, notifications) are captured now so `generate-core.md` and `connect-messenger.md` don't redefine them differently
- This step exists specifically so token/header names stay identical across `lib/apollo/client.ts`, `lib/constants.ts`, and `.env.local` — do not let later steps invent new variable names for the same value

### Step 1 — Read config

Read `store.config.json`. Derive:

- `slug` = name lowercased, spaces → hyphens
- `has_delivery` = `delivery_types` includes `"delivery"`
- `has_auth` = `allow_guest` is false
- `has_cms` = `cms_sections` is non-empty and not `["none"]`
- `has_blog` = `cms_sections` includes `"blog"`
- `has_contact` = `sections` includes `"contact"` or `cms_sections` includes `"contact"`
- `has_push` = `enable_push_notifications` is true (default true for ecommerce — order status updates need this)

**Section-to-screen rule:**

- The home tab should include the selected sections as landing sections
- Every selected section should also become a standalone screen/route unless the section is purely decorative
- Use the same section names and slugs consistently across home composition, CMS screens, and tab/drawer navigation

### Step 2 — Create CMS

**Skip this step if `has_cms` is false.**

```bash
tsx scripts/erxes-cms.ts
```

Calls `cpContentCreateCMS` with `{ name, description, languages, defaultLanguage, clientPortalId }` from `store.config.json`.

- `clientPortalId` comes from the `client_portal_id` field collected in setup
- This links the CMS to the correct client portal in erxes
  Saves returned `_id` into:
- `store.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`
- `output/<slug>/.env.local` as both `ERXES_CMS_ID` and `EXPO_PUBLIC_CMS_ID`

### Step 3 — Clone starter

```bash
tsx scripts/clone.ts "<store-name>"
```

Clones starter repo into `output/<slug>/`. Skips if already exists.

**CRITICAL:** Ecommerce mobile uses the Expo Router ecommerce starter, not the generic web starter.

- Generic mobile sites: `STARTER_REPO_URL=https://github.com/pages-web/erxes-mobile-starter`
- **Ecommerce mobile sites: `STARTER_REPO_URL=https://github.com/pages-web/erxes-mobile-ecommerce-starter`**

Before running `clone.ts`, ensure `.env` has the correct `STARTER_REPO_URL` for ecommerce mobile.

### Step 3.5 — Design Generation (fully unattended)

**This phase runs with ZERO human interaction.** A single design reference was
captured at intake (`ui_source` + `ui_source_ref`) and lives in
`store.config.json`. Step 3.5 infers the remaining design fields from that
reference before generation begins. Never re-ask anything here.

**Phase 0 — Design Inference (before generation starts):**

Analyze the provided reference and store config to populate every design field.
Write the inferred values into `store.config.json` before proceeding.

| Field | How inferred |
|---|---|
| `direction_family` | Match reference content (visuals, keywords, style) against the catalog in [`agents/ecommerce/pencil-design.md`](pencil-design.md) — pick the single best fit. |
| `motion_level` | Default `2` for ecommerce; raise to `3` if reference shows prominent animations, `4–5` if motion is the primary feature. |
| `product_category` | Derive from store `name` + `sections` + `cms_sections` (e.g. "tech store" from name, "products" section → electronics). |
| `price_point` | Infer from tone + reference style: polished/luxurious → `luxury`, casual/accessible → `mid-range`, utilitarian → `budget`. |
| `brand_personality` | Infer from tone + reference content keywords. |
| `required_sections` | Set equal to `sections` from `store.config.json` (already collected at intake). |

Once every field above is populated in `store.config.json`, generation begins.

**Gate:** Do not generate any design output until `store.config.json` contains
`direction_family` and `motion_level`. A missing value = stop with a hard error
naming the field — never a question to the user.

**Valid `design_strategy` values:** `from-scratch`, `brand-first` only.
(`copy-site` / `improve-site` / `beat-competitors` are rejected at intake —
mobile has no `site:audit` tooling.)

Read [`agents/ecommerce/pencil-design.md`](pencil-design.md) for its phase structure, direction-family catalog, token requirements, required components, and anti-patterns — then execute it in **UNATTENDED MODE**, which overrides its interactive checkpoints:

| pencil-design.md checkpoint | Unattended behavior |
| --------------------------- | ------------------- |
| "create 2–3 direction previews … get a user choice" | Generate **one** direction — the inferred `direction_family`, applied within the strategy rules. Export a single preview (`home-option-a.png`) as a record artifact. |
| "ask exactly: `do you wanna edit design before build frontend?`" | **SKIP.** No edit-review loop. |
| All "show the user / wait for approval / repeat until approved" steps | **SKIP.** Completion is decided solely by the artifact gate below. |
| Phase 0.75 `pnpm site:audit` | Not applicable — unreachable strategies are rejected at intake. |
| Motion-level proposal table | Skip presentation; apply the inferred `motion_level` (0–5) directly. |

**Execution by `ui_source`:**

- `words` — creative brief = `ui_source_ref` (the user's description). The inferred design fields from Phase 0 provide additional context.
- `pencil` — open the `.pen` file at `ui_source_ref` via Pencil MCP tools as the base
- `figma` / `screenshot` — use `ui_source_ref` assets as the visual reference

Produce the full design package **directly, no intermediate selection round**:

```
output/<slug>/designs/design.pen        # full home design in the chosen direction_family
output/<slug>/designs/home-option-a.png # single preview export (record only)
output/<slug>/designs/design.png        # full-package export alongside design.pen
output/<slug>/design-tokens.json
output/<slug>/ui-libraries.json
output/<slug>/HANDOFF.md
```

`HANDOFF.md` must record the inferred decisions it applied: `direction_family`, `motion_level`, `design_strategy`, brand inputs, and the `ui_source` artifacts used — this replaces the human approval record.

For `pencil` / `figma` / `screenshot`: extract the dominant primary color → write to `store.config.json` as `color_hint` (unless one was provided at intake).

**Step 3.5 is complete only when every file above exists, is a real Pencil/rendered output (not a stub), and `HANDOFF.md` records the applied decisions.** Then continue immediately to Step 3.7 / Step 4 without pausing.

### Step 3.7 — Connect erxes Messenger

**Mandatory whenever `enable_messenger` is true in `store.config.json` (the default for ecommerce apps) — skip only when it is explicitly false.**

> **Pipeline mapping:** this integration runs EARLIER in the ecommerce pipeline than in the generic one (generic pipeline = optional Step 4.5 after code generation). Ecommerce places it before Step 4 because the messenger entry point must be written during code generation using the approved design tokens from Step 3.5. Same content and rules (`agents/connect-messenger.md`), different placement by design — do not "renumber" either file to match the other.

**Read `agents/connect-messenger.md`.**

If `enable_messenger` is true and `messenger_brand_id` is missing from `store.config.json`, STOP with a hard error naming the field — it was required at intake. Never prompt mid-run; once enabled, do not skip the step or ship without a messenger connection.

Embed the erxes Messenger widget (in-app chat/support) after the design is approved so the floating bubble/entry point matches the chosen design tokens:

- Register `messenger_brand_id` from `store.config.json`
- Generate the messenger bridge component (WebView-based or native SDK, per `connect-messenger.md`)
- Wire the messenger entry point (floating action button or tab icon) using the approved design tokens from Step 3.5
- Confirm the messenger connection reuses the same client-portal/app-token headers established in Step 0.5 — do not create a second auth path

### Step 4 — Generate code

**Hard Gate:** Do not enter Step 4 until Step 3.5 (and Step 3.7 when applicable) is fully complete.

Step 3.5 is complete only when (artifact checks — no user input involved):

- the full design package exists: `designs/design.pen`, `designs/design.png`, `designs/home-option-a.png`
- `design.pen` includes the full home tab with all `required_sections` from `store.config.json` in order
- `design-tokens.json` and `ui-libraries.json` exist
- `HANDOFF.md` records the inferred decisions (`direction_family`, `motion_level`, `design_strategy`, brand inputs, `ui_source` artifacts used)
- no edit-approval loop ran — unattended mode per Step 3.5

**CRITICAL: Read these files IN ORDER before writing code:**

1. `agents/ecommerce/generate.md` — table of contents, design agnosticism rules, build checklist
2. `agents/ecommerce/generate-setup.md` — dependencies, NativeWind v4 + Metro + Babel setup, utils, constants, env, app.config.ts
3. `agents/ecommerce/generate-types.md` — TypeScript interfaces
4. `agents/ecommerce/generate-i18n.md` — i18n routing, messages JSON
5. `agents/ecommerce/generate-core.md` — Apollo Client, Jotai stores, root layout
6. `agents/ecommerce/generate-graphql.md` — GraphQL file map, CP\_\* query variants (do NOT recreate starter files)
7. `agents/ecommerce/generate-hooks.md` — auth, order, payment, query hooks
8. `agents/ecommerce/generate-components.md` — layout + product components
9. `agents/ecommerce/generate-pages.md` — home, products, product detail, **login**, **register**, **profile**, **orders**, **wishlist**, cart
10. `agents/ecommerce/generate-checkout.md` — **checkout** + **verify** screens
11. `agents/ecommerce/generate-cms.md` — review system, CMS screens (about, blog) — read when `has_cms` is true
12. `agents/ecommerce/notification.md` — push notification setup — read when `has_push` is true
13. `agents/ecommerce/conventions.md` — ecommerce conventions (auth tokens, web-safe secure storage, Apollo v4 headers, Jotai stores, payment flow) — **SOURCE OF TRUTH, read before any other conventions file**
14. `agents/conventions.md` — global conventions (Expo Router / React Native patterns) — read AFTER the ecommerce file; where they overlap the ecommerce file wins
15. `agents/frontend.md` — frontend build phases, token system, animation rules. Its PHASE 2.1 `src/features/` organization is OPTIONAL guidance; the shipped starter's FLAT layout is authoritative
16. `agents/animations.md` — animation libraries (if motion level > 0)
17. `agents/ecommerce/reference.md` — GraphQL queries/mutations
18. `agents/ecommerce/payment.md` — payment flow implementation

**Do NOT skip generate-pages.md, generate-checkout.md, or notification.md.** These files define the auth, profile, orders, wishlist, checkout, verify, and push-notification flow. Skipping them produces a static app without the ecommerce flow or order-status alerts.

**Then write files in this order:**

1. Dependencies install (see `generate-setup.md` — includes `babel-preset-expo`, NativeWind, Metro config)
2. Types (`types/<domain>.types.ts` — auth, cms, order, payment — matching the starter layout)
3. Apollo client + provider (`lib/apollo/` — global, stays flat)
4. Jotai stores (`store/<name>.store.ts` — flat: auth.store, cart.store, order.store, payment.store, wishlist.store, locale)
5. GraphQL documents (`graphql/<domain>/queries|mutations/` — auth, cms, ecommerce) — CP\_\* query variants
6. Root layout (`app/_layout.tsx`) + Providers + `import "../global.css"`
7. Auth screens: `app/(auth)/login.tsx`, `register.tsx`, `forgot-password.tsx`
8. Ecommerce screens: `app/(tabs)/index.tsx` (home), `products/index.tsx`, `products/[id].tsx` (carousel + size/color selection), `cart.tsx`
9. Profile + account screens: `profile/index.tsx`, `orders/index.tsx`, `orders/[id].tsx`, `wishlist.tsx`
10. Checkout + payment: `checkout.tsx`, `verify.tsx`
11. CMS screens: `about.tsx`, `contact.tsx`, `blog/index.tsx`, `faq.tsx` — only sections listed in `cms_sections`
12. Messenger entry point (floating bubble / tab icon, from Step 3.7)
13. Push notification registration + listeners (from `notification.md`)
14. Tab/drawer navigation (from `cpMenus` via `EXPO_PUBLIC_CMS_ID`)
15. `.env.local`

**Project structure (authoritative — matches the shipped starter):**

```
output/<slug>/
├── app/                    # Expo Router routes — single source of truth for screens
├── components/             # ui/, layout/, payment/, products/
├── graphql/                # auth/, cms/, ecommerce/ — queries + mutations
├── hooks/                  # auth, order, payment, review, useProductFilters
├── store/                  # jotai atoms (auth.store, cart.store, …, locale)
├── types/                  # <domain>.types.ts
├── lib/                    # apollo/client.ts, i18n/, constants.ts, utils.ts
├── messages/               # mn.json, en.json
└── src/messenger/          # ONLY when Messenger is connected
```

`frontend.md` PHASE 2.1's `src/features/<feature>/` organization is optional guidance for very large apps; the starter ships flat and all ecommerce docs target the flat layout above.

### Step 4.8 — Connect erxes Feedback Tickets (unattended, flag-gated)

**Skip entirely when `enable_feedback_tickets` is false in `store.config.json`.** When true, this step runs automatically — it was decided at intake, so it is not a mid-run question.

Run only after Step 4 is complete. Read [`agents/ecommerce/connect-erxes-tickets.md`](agents/ecommerce/connect-erxes-tickets.md) in full and execute its pipeline, substituting the project's own values for every placeholder. Summary of what it produces:

1. **Env vars** — add `EXPO_PUBLIC_ERXES_TICKETS_CHANNEL_ID`, `_PIPELINE_ID`, `_STATUS_ID` (and `_STAGE_ID` if used) to `.env.local`. The ticket ids came from intake validation; if any are missing from config → STOP with a hard error naming the field (never prompt, never guess).
2. **Auth gating** — feedback submission reuses the project's existing auth/session hook and blocks submission entirely when no `CPUser` session exists (per `connect-erxes-tickets.md` §2). No anonymous submission path.
3. **Generate the committed application files** exactly as listed in its "Files Modified" section: the feedback form screen + submission hook + ticket-creation mutation under `app/`, `hooks/`, and `graphql/`.
4. **Behavioral rules** — apply its §7 rules verbatim: non-nullable ids, failed submissions show an error state (never crash/block navigation), never log tokens or PII.
5. **Verify** against its §6 checklist before moving to Step 4.9.

Step 4.8 output files MUST be included in the Step 4.9 expected-file list.

### Step 4.9 — Structural Audit & Cleanup

**Mandatory. Run this every time after Step 4, before Step 5 or Step 6 — even if you believe everything is correct.**

**Step 4.9 is complete only when:**

- an expected file list was written out explicitly, derived only from the
  "Then write files in this order" list and the file names given in
  `generate-setup.md`, `generate-types.md`, `generate-i18n.md`,
  `generate-core.md`, `generate-graphql.md`, `generate-hooks.md`,
  `generate-components.md`, `generate-pages.md`, `generate-checkout.md`,
  `generate-cms.md` (if `has_cms`), `notification.md` (if `has_push`)
- `find output/<slug> -type f | sort` (excluding `node_modules`) was run and
  diffed against that expected list
- every MISSING file was generated by re-reading its source doc section —
  never guessed
- every EXTRA file was resolved: leftover starter/boilerplate deleted,
  build artifacts deleted, or explicitly flagged with a one-line reason if
  kept
- `output/<slug>/dist`, `output/<slug>/web-build`, and `output/<slug>/.expo`
  do not exist anywhere in the tree
- confirm `output/<slug>/` is not nested inside a duplicate folder with the
  same name (`output/<slug>/<slug>/`) — flatten if found
- confirm the project matches the shipped starter FLAT layout:
  `app/`, `components/{ui,layout,payment,products}`, `graphql/{auth,cms,ecommerce}`,
  `hooks/`, `store/`, `types/`, `lib/{apollo,i18n}`, `messages/` at the root —
  with `src/` existing ONLY as `src/messenger/` when Messenger is connected.
  Any other content under `src/` is a structural conflict with `app/` and must
  be resolved (merge into `app/`, delete the rest) before continuing
- confirm none of `AGENTS.md`, `CLAUDE.md`, `.claude/`, or a duplicated
  `scripts/` directory exist inside `output/<slug>/` — delete any found
- confirm `lib/apollo/client.ts` is the only Apollo client definition in the
  project — if a second Apollo client exists anywhere outside `lib/apollo/`
  and `src/messenger/core/apollo/`, remove the duplicate and consolidate on
  `lib/apollo/client.ts`
- `babel.config.js` exists and its `presets` match exactly what
  `generate-setup.md` specifies
- `metro.config.js` exists, wraps `getDefaultConfig` with the NativeWind
  wrapper specified in `generate-setup.md`, and its `input`/`content` paths
  point to real files in this project — not copied example paths
- `tailwind.config.js` `content` globs were verified by grep to actually
  match where screens/components live in this project
- the global CSS file is imported exactly once, in `app/_layout.tsx`, and
  nowhere else
- every dependency named in `generate-setup.md` was checked line-by-line
  against `output/<slug>/package.json` — not assumed from memory of what
  was installed
- every route file expected from `generate-pages.md` and
  `generate-checkout.md` (login, register, forgot-password, home,
  products/index, products/[id], cart, profile/index, orders/index,
  orders/[id], wishlist, checkout, verify, and CMS screens if `has_cms`)
  was opened and confirmed to be non-empty with a real default export —
  not just confirmed to exist
- if `has_cms` or `has_blog` is false, the corresponding CMS screens were
  confirmed correctly omitted, not left as empty stubs
- a short summary was reported: expected file count, actual file count,
  files deleted, files generated to fill gaps, confirmation config files
  were checked line-by-line

**Rules while doing this:**

- Never run `npx expo export` (or any web export) "just to check" and leave
  the resulting `dist/` folder in the tree. If run for verification, delete
  `dist/` immediately after and note the deletion in the summary.
- Extra files fall into three buckets — decide explicitly for each one:
  1. leftover boilerplate from the starter/`create-expo-app` template
     (default `App.js`, unused example screens, default assets, stub
     README) → delete
  2. build artifacts that must never be committed (`dist/`, `.expo/`,
     `web-build/`, `*.log`, any auto-generated `index.html`) → delete
  3. genuinely necessary but not on the expected list → keep, but flag to
     the user with a one-line reason
- If any check in this step fails, fix it and re-run the full audit before
  moving on — do not proceed to Step 5/6 with any open discrepancy.

### Step 5 — Seed CMS content

Do not enter Step 5 (Seed CMS content) or Step 6 (Verify) until Step 4.9
(Structural Audit & Cleanup) has passed with zero discrepancies.

**Skip this step if `has_cms` is false.**

Seed content for every language in `store.config.json`. Use real translated text — no placeholders.

**Generate content JSON files first, then run scripts.**

#### 5a. Pages (`output/pages.json`)

For each section in `cms_sections` (except "none"), generate a page object per language:

```json
[
  {
    "slug": "about",
    "lang": "mn",
    "title": "Бидний тухай",
    "description": "<store-specific 1-2 sentence description>",
    "content": "<HTML with real info about the store — no lorem ipsum>",
    "status": "published",
    "meta": { "title": "Бидний тухай", "description": "...", "keywords": "..." }
  },
  {
    "slug": "about",
    "lang": "en",
    "title": "About Us",
    "description": "...",
    "content": "...",
    "status": "published",
    "meta": { "title": "About Us", "description": "...", "keywords": "..." }
  }
]
```

For `faq` pages, include sections with Q&A items relevant to the store type (delivery FAQ, return policy, etc.).

```bash
tsx scripts/erxes-pages.ts output/pages.json
```

#### 5b. Blog posts (`output/posts.json`) — only if `has_blog`

Generate 3 starter posts in each language. Use real topics relevant to the store category (e.g. "Top 5 gadgets this season" for a tech store):

```json
[
  {
    "lang": "mn",
    "title": "...",
    "slug": "first-post",
    "description": "...",
    "content": "<HTML — at least 3 paragraphs>",
    "status": "published",
    "publishedDate": "<today's ISO date>"
  }
]
```

**Default category:** entries without `categoryIds` are automatically attached to a shared `"Blog"` category — `erxes-posts.ts` looks it up via `cpCategories` (by slug `blog`, then by name) and creates it via `cpCmsCategoriesAdd` only on first run, so repeated runs never duplicate it. To override: pass explicit `"categoryIds"` per entry; to force uncategorized, pass `"categoryIds": []`.

```bash
tsx scripts/erxes-posts.ts output/posts.json
```

Output: `{ "post_ids": [...], "category_id": "<default category _id or null>" }`.

#### 5c. Navigation menu (`output/menu.json`)

Generate two menus — `Main Navigation` (tab bar / drawer) and `Footer` (about/contact/blog links surfaced in profile or more screen) — with links appropriate to the store's `cms_sections`:

```json
[
  {
    "name": "Main Navigation",
    "items": [
      { "name": "Нүүр", "link": "/", "order": 1 },
      { "name": "Бараа", "link": "/products", "order": 2 },
      { "name": "Блог", "link": "/blog", "order": 3 },
      { "name": "Бидний тухай", "link": "/about", "order": 4 }
    ]
  },
  {
    "name": "Footer",
    "items": [
      { "name": "Бидний тухай", "link": "/about", "order": 1 },
      { "name": "Холбоо барих", "link": "/contact", "order": 2 },
      { "name": "Нийтлэл", "link": "/blog", "order": 3 }
    ]
  }
]
```

Only include links for pages that exist in `cms_sections`.

```bash
tsx scripts/erxes-menu.ts output/menu.json
```

### Step 6 — Verify

```bash
cd output/<slug> && npx tsc --noEmit && npx eslint . && npx expo export
```

Fix all TypeScript and ESLint errors. `expo export` must succeed with 0 errors before deploying. Additionally confirm:

- [ ] NativeWind classNames render styled output (not plain text) on both iOS simulator and web
- [ ] Messenger bubble opens and connects
- [ ] Push notification permission prompt fires and a test push is received (if `has_push`)
- [ ] Product detail screen enforces size + color selection before add-to-cart
- [ ] Feedback form submits a ticket that appears in erxes Admin → Tickets, with the error state shown on failure (if `enable_feedback_tickets`) — per `connect-erxes-tickets.md` §6

### Step 7 — Build & Deploy

Read `deploy_target` from `store.config.json`.

**`eas`** (App Store / Google Play):

```bash
tsx scripts/eas-build.ts "<store-name>"
```

**`expo-web`** (web export via Expo):

```bash
tsx scripts/deploy-web.ts "<store-name>"
```

**`github`:**

```bash
tsx scripts/github-push.ts "<store-name>"
```

---

## Pipeline — Updating an existing mobile storefront

1. Read `store.config.json`
2. Read relevant files in `output/<slug>/`
3. Make only the targeted changes
4. Rebuild: `tsx scripts/eas-build.ts "<store-name>"` (or `deploy-web.ts` for web export)
