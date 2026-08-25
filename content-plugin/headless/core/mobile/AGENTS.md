# erxes Ecommerce + CMS — Mobile Agent Instructions (Expo)

**During Step 0 intake, respond in plain conversational sentences. Never output structured question formats, option lists, radio buttons, select menus, chips, or progress indicators ("1 of 5 questions"). Ask one question at a time as a plain sentence. Wait for the reply. Then ask the next. AFTER Step 0 closes, no questions at all — the pipeline continues unattended to completion.**

You build and deploy **Expo (React Native)** mobile apps connected to erxes CMS.

Read the files below as you need them. They are split by concern — do not skip them.

| File                                                       | Read when                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`agents/conventions.md`](agents/conventions.md)           | Before writing any code — for ecommerce builds read `agents/ecommerce/conventions.md` FIRST (source of truth), then this file for global rules                                                                                                                                                                                                     |
| [`agents/setup.md`](agents/setup.md)                       | At the start of every new site build                                                                                                                                                                                        |
| [`agents/business-analyst.md`](agents/business-analyst.md) | During Step 0.5 — business analysis and BRD generation                                                                                                                                                                      |
| [`agents/ux-ui-researcher.md`](agents/ux-ui-researcher.md) | During Step 0.75 — UX/UI research generation                                                                                                                                                                                |
| [`agents/frontend.md`](agents/frontend.md)                 | During Step 4 — frontend implementation from approved design                                                                                                                                                                |
| [`agents/generate.md`](agents/generate.md)                 | During Step 4 — code generation                                                                                                                                                                                             |
| [`agents/connect-erxes.md`](agents/connect-erxes.md)       | After Step 4 — connect the generated frontend to erxes CMS                                                                                                                                                                  |
| [`agents/reference.md`](agents/reference.md)               | For mutations, env vars, checklist, file ownership                                                                                                                                                                          |
| [`agents/pencil-design.md`](agents/ecommerce/pencil-design.md)       | During Step 3.5 — full design handoff creation with Pencil                                                                                                                                                                  |
| [`connect-messenger.md`](agents/connect-messenger.md)             | Step 4.5 — connecting erxes Messenger (live chat) to the generated Expo app, or any time the user asks to "connect messenger", "add live chat", "connect erxes messenger", "add messenger SDK", or "set up erxes messenger" |
| [`notification.md`](agents/ecommerce/notification.md)                       | Step 4.6 — wiring up Firebase Cloud Messaging (push notifications), or any time the user asks to "add push notifications", "set up FCM", "connect firebase notifications", or "add notification.md"                         |
| [`connect-erxes-tickets.md`](agents/ecommerce/connect-erxes-tickets.md)     | Step 4.7 — connecting feedback screen to erxes Client Portal Tickets...                                                                                                                                                     |

---

## Hard Gate

The ONLY permitted human interaction in this entire pipeline is the **Step 0 intake conversation**. After Step 0 closes, the pipeline runs as ONE continuous unattended execution — no confirmations, approvals, choices, or questions at any later step.

Do not run any shell commands (including environment checks like `node -v` /
`npm -v`), explore the repo, clone/init the Expo project, or write any file
until Step 0 is complete.

Do not generate any design directions, visual concepts, or frontend ideas
until Step 0 is complete.

Do not enter Step 3.5 until the Step 0.5 / 0.75 artifacts exist for every flag
enabled at intake (see below). Those steps then run unattended — no user
approval loop.

Do not enter Step 4 frontend/code generation until Step 3.5 is fully complete
(artifact checks only — see the Step 3.5 gate below).

Enter Step 4.5 (Connect Messenger), 4.6 (Connect Push Notifications), and 4.7
(Connect Feedback Tickets) AUTOMATICALLY whenever their intake flags are set:
`enable_messenger`, `enable_push_notifications`, `enable_feedback_tickets`.
Every credential those steps consume must already be validated at intake. If a
flagged integration is missing its credential, STOP with a hard error naming
the field — never prompt mid-run and never silently skip a flagged step.

Do not enter Step 5 (Seed CMS content) until Step 4 — and Steps 4.5 / 4.6 /
4.7 when flagged — are complete.

Do not enter Step 7 (Deploy) until Step 6 (Verify) passes with 0 errors.
`deploy_target` was fixed at intake; deployment is never discussed mid-run.

### Intake (Step 0) — everything decided upfront

Collect ALL of the following during Step 0 (one plain question at a time) and
persist them into `store.config.json` + `.env` BEFORE any other step runs.
This list replaces every downstream checkpoint — no later step may re-ask any
of it.

**Core config** — `name`, `template_type` (`"ecommerce"` routes to
[`agents/ecommerce/AGENTS.md`](agents/ecommerce/AGENTS.md)),
`language` / `defaultLanguage` / `languages`, `tone`, `sections`,
`cms_sections` (explicit non-empty lists — there is NO runtime
section-detection confirm loop), and the ecommerce extras `delivery_types`,
`allow_guest`, `pos_token` (per [`agents/ecommerce/setup.md`](agents/ecommerce/setup.md)).

**Connections** — validated at intake via
[`agents/connect-erxes.md`](agents/connect-erxes.md): `erxes_api_url`,
`EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`, `erxes_main_domain`, `client_portal_id`;
prove gateway reachability with a live `{ __typename }` query sent with
`x-app-token`.

**Deployment & access** (explicit answer required — no default):

- `deploy_target` ∈ `none` | `github`. Values `eas` and `expo-web` are NOT
  valid today — the `scripts/eas-build.ts` / `scripts/deploy-web.ts` helpers
  do not exist yet. Reject them with a clear error and offer `github` or
  `none` instead. (`vercel_*` keys belong to the web pipeline only.)
- When `deploy_target = github`, or the build needs the starter repo:
  `GITHUB_TOKEN` must be present in `.env` AND `git ls-remote` against the
  starter repo URL must succeed during intake. Any failure = hard stop here.

**Design reference** — one question, then done:

> "How would you like the design to look? Paste a reference link
> (website or Figma URL), upload a screenshot, or describe what
> you want in words."

| User answer | `ui_source` | `ui_source_ref` | `design_strategy` |
|---|---|---|---|
| URL (Figma) | `figma` | the URL | `brand-first` |
| URL (other) | `screenshot` | the URL | `brand-first` |
| Screenshot files | `screenshot` | the file paths | `from-scratch` |
| Free-text description | `words` | the description | `from-scratch` |
| `.pen` file path | `pencil` | the path | `brand-first` |

Optional follow-up (only for `words`): "Do you have a color preference?" →
`color_hint`.

All other design fields (`direction_family`, `motion_level`, `product_category`,
`price_point`, `brand_personality`, `required_sections`) are NOT asked —
Step 3.5 infers them from the reference + `store.config.json` (`name`, `sections`,
`cms_sections`, `tone`).

**Integration & docs flags**

- `enable_messenger` (+ `messenger_brand_id` when true)
- `enable_push_notifications` (+ Firebase values when true)
- `enable_feedback_tickets` (+ `tickets_channel_id` / `tickets_pipeline_id` /
  `tickets_status_id` / stage id when true)
- `enable_business_analysis` (default false) — runs Step 0.5
- `enable_ux_research` (default false) — runs Step 0.75

**Pre-flight validation (execute during intake, before any generation):**

1. Tooling: `tsx --version` resolves inside `mobile/`.
2. Gateway reachable + token valid (the live query above).
3. Starter repo reachable with `GITHUB_TOKEN` (whenever clone or github
   deploy is involved).
4. `deploy_target` satisfies the rules above.

**Step 0 is complete only when:**

- every field above is collected and validated
- `.env` holds the required erxes, CMS, and deployment values
- the CMS is created via `tsx scripts/erxes-cms.ts` (when `has_cms`) and the
  returned `_id` is saved into `store.config.json` and `.env` as `ERXES_CMS_ID`

A vague or generic trigger like "create me a mobile app" is not sufficient
input to proceed — it only starts Step 0. If any required field above is
missing or fails validation: stop AT INTAKE, ask for what is missing, and do
not infer, default, guess, or silently continue. Once Step 0 closes, asking
anything is prohibited for the rest of the pipeline.

**Step 0.5 is complete only when** `enable_business_analysis` is false
(step skipped) or `output/<slug>/business-requirements.md` exists and covers
the sections required by [`agents/business-analyst.md`](agents/business-analyst.md).
Runs unattended — no user confirmation gate.

**Step 0.75 is complete only when** `enable_ux_research` is false
(step skipped) or `output/<slug>/ux-research.md` exists and covers the
sections required by [`agents/ux-ui-researcher.md`](agents/ux-ui-researcher.md).
Runs unattended — no user confirmation gate.

**Step 3.5 is complete only when** (artifact checks — no user input):

- the full design package exists: `designs/design.pen`, `designs/design.png`,
  `designs/home-option-a.png`, `design-tokens.json`, `ui-libraries.json`,
  `HANDOFF.md`
- `design.pen` covers ALL `required_sections` from `store.config.json`, in
  order, at mobile viewport (390×844)
- `HANDOFF.md` records the inferred decisions applied:
  `direction_family`, `motion_level`, `design_strategy`, brand inputs
- the artifacts are real Pencil outputs, not placeholders or stub files
- all Pencil work stayed inside the exact approved `.pen` file path for this app

**Step 4 is complete only when:**


- all 17 files listed in Step 4's "Read these files IN ORDER" were read, including `generate-pages.md` and `generate-checkout.md` (never skipped)
- all files were written in the specified order, ending with `.env.local`
- `babel-preset-expo` and `babel.config.js` exist before any bundling is attempted
- env var names in `lib/apollo/client.ts` and `.env.local` match exactly (no silently-empty auth headers)

If any of those are missing, stop and complete them before moving to Step 4.5, 4.6, or Step 5.

---

## Shared Module Integration

The ecommerce pipeline REUSES modules from the generic `agents/` folder. Do not duplicate — read the shared files at the correct step.

### Shared Files (read at the specified step)

| File                         | When to Read                           | Purpose                                                                                 |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- | --- |
| `agents/setup.md`            | Step 0 (if starting fresh)             | Generic setup collection — ask template type, languages, tone, design strategy, etc.    |
| `agents/pencil-design.md`    | Step 3.5                               | Pencil design tool usage, direction previews, design tokens                             |
| `agents/animations.md`       | Step 4 (before writing animation code) | Animation library implementations — Reanimated, Moti, Lottie, etc.                      |
| `agents/frontend.md`         | Step 4 (before code generation)        | Frontend build phases, token system, component architecture, zero-error build protocol  |
| `agents/ux-ui-researcher.md` | Step 0.75 (when `enable_ux_research` is true) | UX research document generation (unattended, flag-gated)                                |     |
| `agents/conventions.md`      | Before writing ANY code                | Global code conventions — React Native patterns, NativeWind, TypeScript. **Read AFTER `agents/ecommerce/conventions.md`; on conflict the ecommerce file wins** |

## Pipeline — New storefront (Mobile)

### Step 0 — Intake & Setup

Read [`agents/setup.md`](agents/setup.md). Collect every intake field listed in the Hard Gate above (one plain question at a time), run the pre-flight validations, write `store.config.json` and `.env`, create the CMS with `tsx scripts/erxes-cms.ts`, and save the returned `_id` into `store.config.json` and `.env` as `ERXES_CMS_ID`. Then **continue immediately** — no confirmation pause.

**Ecommerce routing:** If `template_type` is `"ecommerce"`, stop this pipeline immediately after Step 0 setup collection and switch to [`agents/ecommerce/AGENTS.md`](agents/ecommerce/AGENTS.md). Do not continue the generic pipeline steps below.

### Step 0.5 — Business Analysis (unattended, flag-gated)

Skip entirely unless `enable_business_analysis` is true in `store.config.json`. When enabled: read [`agents/business-analyst.md`](agents/business-analyst.md) and generate `output/<slug>/business-requirements.md` from `store.config.json` plus any BRD material supplied at intake. There is NO interview round and NO user confirmation — write the document from the collected config and continue.

### Step 0.75 — UX/UI Research (unattended, flag-gated)

Skip entirely unless `enable_ux_research` is true in `store.config.json`. When enabled: read [`agents/ux-ui-researcher.md`](agents/ux-ui-researcher.md) and generate `output/<slug>/ux-research.md` from `output/<slug>/business-requirements.md` and `store.config.json`. There is NO interview round and NO user confirmation — write the document and continue straight to Step 3.5.

### Step 1 — Read config

Read `store.config.json`. Derive:

- `slug` = name lowercased, spaces → hyphens
- `has_delivery` = `delivery_types` includes `"delivery"`
- `has_auth` = `allow_guest` is false
- `has_cms` = `cms_sections` is non-empty and not `["none"]`
- `has_blog` = `cms_sections` includes `"blog"`
- `has_contact` = `sections` includes `"contact"` or `cms_sections` includes `"contact"`
- `has_messenger` = `enable_messenger` is true in `store.config.json` (decided at intake)
- `has_push_notifications` = `enable_push_notifications` is true (decided at intake)
- `has_feedback_tickets` = `enable_feedback_tickets` is true (decided at intake)

**Section-to-screen rule:**

- The home screen should include the selected sections as landing sections
- Every selected section should also become a standalone screen/route unless purely decorative
- Use the same section names and slugs consistently across home screen composition, CMS pages, and bottom tab / drawer navigation

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

### Step 3 — Initialize Expo project

Run the scaffold script:

```bash
tsx scripts/clone.ts "<store-name>"
```

`clone.ts` internally runs `create-expo-app@latest output/<slug> --template default@sdk-55`
and creates the project in `output/<slug>/`. **If `output/<slug>/` already exists, `clone.ts` skips scaffolding and reuses it — do not run `create-expo-app` manually afterward.**

If `clone.ts` does not exist or fails, fall back to running manually:

```bash
npx create-expo-app@latest output/<slug> --template default@sdk-55
```

**CRITICAL:** Mobile ecommerce uses Expo, not Next.js.

Required packages to install after init:
...

**CRITICAL — `babel.config.js` must always be created at this step, before any bundling is attempted.** Metro fails with `Cannot find module 'babel-preset-expo'` if this file is missing or the package above was skipped. Create it immediately after the installs above (do not defer this to a later step or leave it to be added only if bundling fails):

```javascript
// output/<slug>/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
```

Before running, ensure `.env` has the correct configuration for Expo.

**CRITICAL — never let two conflicting project structures coexist.**

This project uses the Expo Router `app/` directory as the single source of
truth for routing and screens. The shipped starter uses a FLAT layout —
`app/`, `components/`, `graphql/`, `hooks/`, `store/`, `types/`, `lib/`,
`messages/` at the project root. Exactly one `src/` subtree is permitted:

- `src/messenger/` — only when Messenger is connected, per
  `connect-messenger.md`

Nothing else belongs under `src/`. (`frontend.md` PHASE 2.1 describes an
optional `src/features/<feature>/` organization for very large apps; it is
NOT part of this starter — do not create `src/features/`.)

If `clone.ts` or any starter template produces a `src/` directory with
anything beyond `src/messenger/`, treat this as a structural conflict with one
deterministic resolution — no user consultation: merge any needed content
from the starter's `src/` into the flat layout (`app/`, `components/`, etc.),
then delete the rest of `src/`. The flat shipped-starter layout always wins.
Never leave both trees populated "just in case."

**CRITICAL — never copy agent/tooling files into the generated app.**

The following must NEVER appear inside `output/<slug>/`:

- `AGENTS.md`, `CLAUDE.md`, or any other agent-instruction file
- `.claude/` or any other agent-config directory
- `scripts/` (the `tsx scripts/*.ts` tooling used in Steps 2, 5, 7 lives at
  the project root — e.g. `mobile/scripts/` — and is invoked FROM there
  against `output/<slug>/`; it is never copied into the output app itself)

If `clone.ts` or any copy step pulls these in from the working directory,
delete them immediately after cloning, before any other Step 3 work.

**CRITICAL — verify no duplicated/nested output path.**

After `tsx scripts/clone.ts "<store-name>"`, confirm the project lives at
exactly `output/<slug>/` — not `output/<slug>/<slug>/`. If clone.ts (or
`create-expo-app`) creates a nested duplicate folder with the same name,
flatten it immediately: move the inner folder's contents up one level and
delete the empty wrapper, before proceeding to Step 3.5.

> **Web → Mobile mapping:**
>
> - `next/navigation` → `expo-router` (`useRouter`, `useLocalSearchParams`, `Link`)
> - `pages/` or `app/` directory (Next.js) → `app/` directory (Expo Router)
> - CSS Modules / Tailwind → NativeWind (`className` on React Native components)
> - `<div>`, `<p>`, `<img>` → `<View>`, `<Text>`, `<Image>` from `react-native`
> - `layout.tsx` → `app/_layout.tsx` (Expo Router root layout)
> - API Routes → Expo API Routes (`app/api/` or separate backend)

### Step 3.5 — Design Generation (fully unattended)

**This phase runs with ZERO human interaction.** A single design reference was
captured at intake (`ui_source` + `ui_source_ref`) and lives in
`store.config.json`. Step 3.5 infers the remaining design fields from that
reference before generation begins. Never re-ask anything here.

See **Hard Gate** above — do not enter this step until Step 0 is complete and the
Step 0.5 / 0.75 artifacts exist for every enabled flag.

**Phase 0 — Design Inference (before generation starts):**

Analyze the provided reference and store config to populate every design field.
Write the inferred values into `store.config.json` before proceeding.

| Field | How inferred |
|---|---|
| `direction_family` | Match reference content (visuals, keywords, style) against the catalog in [`agents/ecommerce/pencil-design.md`](agents/ecommerce/pencil-design.md) — pick the single best fit. |
| `motion_level` | Default `2` for ecommerce; raise to `3` if reference shows prominent animations, `4–5` if motion is the primary feature. |
| `product_category` | Derive from store `name` + `sections` + `cms_sections` (e.g. "tech store" from name, "products" section → electronics). |
| `price_point` | Infer from tone + reference style: polished/luxurious → `luxury`, casual/accessible → `mid-range`, utilitarian → `budget`. |
| `brand_personality` | Infer from tone + reference content keywords. |
| `required_sections` | Set equal to `sections` from `store.config.json` (already collected at intake). |

Once every field above is populated in `store.config.json`, generation begins.

**Gate:** Do not generate any design output until `store.config.json` contains
`direction_family` and `motion_level`. A missing value = stop with a hard error
naming the field — never a question to the user.

**Valid `design_strategy`:** `from-scratch` | `brand-first` only. Audit-based
strategies are rejected at intake (no mobile `site:audit` tooling), so no
`reference_url` / `competitor_urls` / `source-audit.json` exists on this pipeline.

Read [`agents/pencil-design.md`](agents/ecommerce/pencil-design.md) for the direction-family catalog, token requirements, required components, and anti-patterns — then execute it in **UNATTENDED MODE**, which overrides its interactive checkpoints:

| pencil-design.md checkpoint | Unattended behavior |
| --------------------------- | ------------------- |
| "create 2–3 direction previews … get a user choice" | Generate **one** direction — the inferred `direction_family`, interpreted through `design_strategy`. Export a single preview (`homescreen-option-a.png`) as a record artifact. |
| "ask exactly: `do you wanna edit design before build frontend?`" | **SKIP.** No edit-review loop. |
| All "show the user / wait for approval / repeat until approved" steps | **SKIP.** Completion is decided solely by the artifact gate below. |
| Motion-level proposal | Skip presentation; apply inferred `motion_level` (0–5) directly. |

**Execution by `ui_source`:**

- `words` — creative brief = `ui_source_ref` (the user's description). The inferred design fields from Phase 0 provide additional context.
- `pencil` — open the `.pen` file at `ui_source_ref` via Pencil MCP tools as the base
- `figma` / `screenshot` — use `ui_source_ref` assets as the visual reference

Produce the full design package **directly — no intermediate selection round**:

```
output/<slug>/designs/design.pen             # full home design in the chosen direction_family
output/<slug>/designs/homescreen-option-a.png # single preview export (record only)
output/<slug>/designs/design.png             # full-package export alongside design.pen
output/<slug>/design-tokens.json
output/<slug>/ui-libraries.json
output/<slug>/HANDOFF.md
```

`HANDOFF.md` must record the applied decisions (`direction_family`, `motion_level`, `design_strategy`, brand inputs, `ui_source` artifacts used) — this replaces the human approval record.

For `pencil` / `figma` / `screenshot`: extract the dominant primary color → write to `store.config.json` as `color_hint` (e.g. `"forest-green"`, `"navy"`) unless one was already set at intake.

**Section rules (validated at intake — no detection round):**

- `required_sections` is a non-empty explicit list from `store.config.json`
- Homepage includes every listed section as a landing section
- Every listed section also becomes a standalone page/route unless purely decorative
- Use the same section names/slugs consistently across homepage composition, CMS pages, and navigation

The direction table in [`agents/pencil-design.md`](agents/ecommerce/pencil-design.md) is a REFERENCE catalog describing what each family looks like — it is never presented to anyone for selection; the choice was made at intake.

### Step 4 — Generate code

Read [`agents/frontend.md`](agents/frontend.md) and [`agents/generate.md`](agents/generate.md). Use `design-tokens.json`, `ui-libraries.json`, and `HANDOFF.md` from Step 3.5. Write all files into `output/<slug>/`.

Before Step 4 starts, verify all of these (artifact/config checks — no user input):

- the design package exists and is real Pencil exports (`designs/design.pen`, `designs/design.png`, `designs/homescreen-option-a.png`)
- `design.pen` represents ALL `required_sections` from `store.config.json` in order — not a partial hero or cropped concept
- `HANDOFF.md` records the inferred decisions (`direction_family`, `motion_level`, `design_strategy`, brand inputs)
- `ui-libraries.json` and `design-tokens.json` exist
- no edit-approval loop ran — unattended mode per Step 3.5
- `source-audit.json` is NOT expected on this pipeline
- the Pencil file path used during design matches the approved site path and no unrelated `.pen` project was modified

### Step 4.5 — Connect Messenger (optional, live chat)

**Skip this step if `has_messenger` is false.**

> **Pipeline mapping:** in the ecommerce pipeline this same integration runs EARLIER as mandatory Step 3.7 (before code generation, so the entry point is written with the approved design tokens). The steps below are the generic-pipeline placement — do not renumber either pipeline to match the other.

Run this step automatically right after Step 4 whenever `enable_messenger` is true in `store.config.json` — the flag was decided at intake, so this is not a mid-run question. The phrases below apply ONLY to standalone post-pipeline sessions (e.g. "connect messenger" on an already-built app), never during a pipeline run:

- "connect messenger to mobile app"
- "connect erxes messenger"
- "add live chat to expo app"
- "set up erxes messenger"
- "add messenger SDK"

Read [`agents/connect-messenger.md`](agents/connect-messenger.md) in full and run its pipeline without waiting for step-by-step instructions:

1. Scan the generated Expo project tree under `src/messenger/` before generating any file.
2. Set up the **Messenger's own Apollo client** — always separate from the CMS Apollo client (`lib/apollo/client.ts`). Messenger uses `credentials: 'include'` (cookie session) plus a `graphql-ws` split link for subscriptions; the CMS client uses the `x-app-token` header (plus `client-auth-token` when logged in) over HTTP only. Never merge the two clients and never pass the host app's bearer token to the Messenger client.
3. Add required env vars to `.env.local`:
   ```env
   EXPO_PUBLIC_ERXES_API_URL=<erxes gateway URL>
   EXPO_PUBLIC_ERXES_BRAND_CODE=<erxes brand/integration code>
   ```
4. Install dependencies:
   ```bash
   npx expo install @apollo/client graphql graphql-ws
   npx expo install @react-native-async-storage/async-storage
   npx expo install react-native-svg
   npx expo install react-native-get-random-values
   npx expo install react-native-render-html
   # Optional — attach button hides automatically when neither is installed
   npx expo install expo-image-picker
   ```
5. Generate the full `src/messenger/` tree exactly as specified in `connect-messenger.md` §17 (Apollo client/container, GraphQL mutations/queries/subscriptions, 7 hooks, 9 UI components, upload service, storage keys, public/internal types, utils, context, theme, `Widget.tsx`, `ErxesMessenger.tsx`, `index.ts`) plus `src/messengerConfig.ts` at the host level.
6. Mount `<ErxesMessenger>` (the only component host code should import) from wherever the store wants live chat exposed — typically the home screen or a persistent floating launcher (`showWidget`) — using `config.apiUrl` and `config.brandId` from `messengerConfig.ts` / `.env.local`.
7. Apply all messenger agent rules from `connect-messenger.md` §20, in particular:
   - `credentials: 'include'` on both the HTTP link and the upload fetch — never remove
   - `react-native-get-random-values` must be the first import in `ErxesMessenger.tsx`
   - Gate all hooks on `identity.ready`; never call `useConnect` or `useConversationsList` before identity resolves
   - Pass `visitorId` only when `customerId` is null — never send both
   - Host code imports only from `src/messenger/types/public.ts`, never `types/internal.ts`
   - Call `clearMessengerStorage` on logout — never clear only one key
8. Verify against `connect-messenger.md` §19 (Connection, Identity, Chat, UI, Environment checklists) before moving on.

### Step 4.6 — Connect Push Notifications (optional, Firebase/FCM)

**Skip this step if `has_push_notifications` is false.**

Run this step automatically right after Step 4 whenever `enable_push_notifications` is true in `store.config.json` — decided at intake, not a mid-run question. The phrases below apply ONLY to standalone post-pipeline sessions, never during a pipeline run:

- "add push notifications"
- "set up FCM"
- "connect firebase notifications"
- "add notification.md"

Read [`agents/ecommerce/notification.md`](agents/ecommerce/notification.md) in full and follow its pipeline exactly, substituting the project's own values for every placeholder:

| Placeholder              | Fill from                                                     |
| ------------------------ | ------------------------------------------------------------- |
| `<APP_NAME>`             | `store.config.json` → `name`                                  |
| `<IOS_BUNDLE_ID>`        | collected in Step 0 (or `app.json` → `ios.bundleIdentifier`)  |
| `<ANDROID_PACKAGE_NAME>` | collected in Step 0 (or `app.json` → `android.package`)       |
| `<FIREBASE_PROJECT_ID>`  | collected in Step 0                                           |
| `<IOS_TARGET_NAME>`      | collected in Step 0 (usually equals `<APP_NAME>`)             |
| `<BACKEND_GRAPHQL_URL>`  | `store.config.json` / `.env` → erxes gateway GraphQL endpoint |

1. **Firebase config files** — obtain `GoogleService-Info.plist` and `google-services.json` for `<FIREBASE_PROJECT_ID>` from the Firebase Console and commit both at the repo root (`output/<slug>/GoogleService-Info.plist`, `output/<slug>/google-services.json`). These are the source of truth; native `ios/` and `android/` files are generated from them via `expo prebuild` and must never be hand-edited directly.
2. **`app.json` wiring** — set `ios.bundleIdentifier`, `ios.googleServicesFile`, `android.package`, `android.googleServicesFile`, `ios.entitlements` (`aps-environment`), `ios.infoPlist.UIBackgroundModes: ["remote-notification"]`, and `android.permissions` (`POST_NOTIFICATIONS`), per `notification.md` → "Firebase Configuration".
3. **Install dependencies:**
   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/messaging expo-build-properties
   ```
   Add the three plugins to `app.json` → `plugins`: `@react-native-firebase/app`, `@react-native-firebase/messaging`, and `["expo-build-properties", { "ios": { "useFrameworks": "static" } }]`.
4. **Generate the committed application files** exactly as specified in `notification.md` → "Files Modified → React Native Application":
   - `src/constants/config.ts` — add the `deviceId` storage key
   - `src/utils/deviceId.ts` — **new**, `getOrCreateDeviceId()`
   - `src/graphql/notificationsQL.ts` — **new**, `clientPortalUserAddFcmToken` mutation against `<BACKEND_GRAPHQL_URL>`
   - `src/lib/push.ts` — **new**, module-scope background handler, `ensureNotificationPermission()`, `getFcmToken()`, `registerFcmToken()`
   - `src/hooks/usePushNotifications.ts` — **new**, foreground/background/terminated listeners, `onTokenRefresh`, permission + token registration, keyed on the auth session token
   - `app/_layout.tsx` — mount `usePushNotifications(token)` in the root layout so it runs on both first login and session-restore/app-startup for already-authenticated users
5. **Run prebuild** after `app.json` and the Firebase config files are in place:
   ```bash
   npx expo prebuild --platform ios
   npx expo prebuild --platform android
   npx pod-install
   ```
6. Apply the key behavioral rules from `notification.md`, in particular:
   - Registration is **best-effort and non-blocking** — permission denial or a failed mutation must never block login or crash the app; wrap in `try/catch`
   - Existing (already logged-in) users register their token on **app startup / session restore**, not only on the login event — do not gate registration on a login-only trigger
   - Send the same persisted `deviceId` on every call so the backend can dedupe per device
   - Never log the FCM token or any Firebase config values — only log failure counts/messages
   - `resolveRoute()` reads `data.route ?? data.url` and falls back to `/notification` when tapping a push
7. Verify against `notification.md` → "Verification Checklist" (Firebase initialization, permission prompts, token generation, backend registration, push delivery in foreground/background/terminated states, token refresh on reinstall, Android 13+ permission handling) before moving on.

### Step 4.7 — Connect Feedback Tickets (optional, erxes Client Portal)

**Skip this step if `has_feedback_tickets` is false.**

Run this step automatically right after Step 4 whenever `enable_feedback_tickets` is true in `store.config.json` — decided at intake, not a mid-run question. The phrases below apply ONLY to standalone post-pipeline sessions, never during a pipeline run:

- "connect feedback to tickets"
- "send feedback as a ticket"
- "add feedback tickets"
- "in-app feedback to erxes ticket"

Read [`agents/ecommerce/connect-erxes-tickets.md`](agents/ecommerce/connect-erxes-tickets.md) in full and follow its pipeline exactly, substituting the project's own values for every placeholder:

| Placeholder                             | Fill from                                            |
| --------------------------------------- | ---------------------------------------------------- |
| `EXPO_PUBLIC_ERXES_TICKETS_CHANNEL_ID`  | collected in Step 0 as `tickets_channel_id`          |
| `EXPO_PUBLIC_ERXES_TICKETS_PIPELINE_ID` | collected in Step 0 as `tickets_pipeline_id`         |
| `EXPO_PUBLIC_ERXES_TICKETS_STATUS_ID`   | collected in Step 0 as `tickets_status_id`           |
| `EXPO_PUBLIC_ERXES_TICKETS_STAGE_ID`    | collected in Step 0 as `tickets_stage_id` (optional) |

1. **Env vars** — add the four `EXPO_PUBLIC_ERXES_TICKETS_*` values to `.env.local`, per `connect-erxes-tickets.md` §3. Reuse the existing `EXPO_PUBLIC_ERXES_API_URL` and `EXPO_PUBLIC_ERXES_APP_TOKEN` from the CMS connection — do not duplicate them.
2. **Auth gating** — confirm the feedback flow reuses the project's existing auth/session hook and blocks submission entirely when no `CPUser` session is present, per `connect-erxes-tickets.md` §2. Never add an anonymous submission path.
3. **Generate the committed application files** exactly as specified in `connect-erxes-tickets.md` → "Files Modified":
   - `lib/graphql/mutations/tickets.ts` — **new**, `CP_CREATE_TICKET` mutation
   - `src/lib/feedbackTicket.ts` — **new**, `submitFeedbackAsTicket()` — best-effort, non-blocking, matching the `registerFcmToken` pattern from `notification.md`
   - `app/feedback.tsx` — **new**, feedback form gated on auth session
4. Apply the key behavioral rules from `connect-erxes-tickets.md` §7, in particular:
   - Use `cpCreateTicket` exactly as specified — do not substitute a different mutation name or add a nonexistent `customerId`/`cpUserId` argument
   - `channelId`, `pipelineId`, `statusId` are non-nullable — they were validated at intake when the tickets flag was enabled; if any are missing from config, STOP with a hard error naming the field (never prompt mid-run and never guess)
   - Never log tokens, ticket IDs tied to PII, or full request payloads
5. Verify against `connect-erxes-tickets.md` §6 (Verification) before moving on:
   - Submitting while logged out blocks the mutation entirely
   - Submitting while logged in creates a ticket visible in erxes Admin under the correct channel/pipeline, attributed to the submitting CPUser
   - `npx expo export` completes with zero errors

### Step 5 — Seed CMS content

Read [`agents/connect-erxes.md`](agents/connect-erxes.md) after the frontend project exists in `output/<slug>/`.

Use it in combined mode with this pipeline:

- fingerprint the generated site before mutations or code edits
- reuse `store.config.json`, `HANDOFF.md`, `design-tokens.json`, and `ui-libraries.json`
- reuse `ERXES_CMS_ID` from Step 2 when it already exists, and only create a CMS if it is missing
- seed pages, posts (if `has_blog`), and menus via `scripts/erxes-pages.ts`, `scripts/erxes-posts.ts`, `scripts/erxes-menu.ts` — formats per "Content file formats" below
- keep all app-side data fetching on the Apollo client from `lib/apollo/client.ts` (HTTP only)
- run `npx expo export` in `output/<slug>/` before deployment

### Step 6 — Verify

Seed content for **every language** in `languages` from `store.config.json`. Generate real translated content — not placeholders — for each locale.

Use the approved design handoff and CMS field map from `HANDOFF.md` plus the content-model decisions from [`agents/connect-erxes.md`](agents/connect-erxes.md) to shape page, post, menu, category, tag, and optional custom-type content while keeping mutation dependency order intact.

CMS page model:

- Seed content so homepage sections can be rendered on `/`
- Also create dedicated CMS pages for each selected section slug such as `/about`, `/services`, `/contact`
- Keep the homepage summary content and standalone page content aligned in tone and structure

Mutation order (always follow this):

```
cpContentCreateCMS or reuse existing CMS_ID → cpCmsCustomPostTypesAdd when needed → cpCmsCustomFieldGroupsAdd when needed → cpCmsCategoriesAdd → cpCmsTagsAdd → cpCmsPagesAdd → cpCmsPostsAdd → cpCmsAddTranslation when needed → cpCmsAddMenu
```

Generate a single content file per type and run each script **once** — content-file formats are owned by the per-template pipeline, see "Content file formats" below.

Before bundling, confirm `babel.config.js` exists and `babel-preset-expo` is in `package.json` dependencies (added in Step 3) — a missing preset causes `Cannot find module 'babel-preset-expo'` at bundle time and must be fixed at Step 3, not patched here.

```bash
cd output/<slug> && npx expo export
```

Fix all TypeScript and ESLint errors. Also run:

```bash
npx expo-doctor
```

Build must succeed with 0 errors before deploying.

**If `has_messenger` is true**, additionally confirm the messenger checklist from `connect-messenger.md` §19 before considering Step 6 complete:

- Messenger connect mutation succeeds and returns `customerId`
- WebSocket connection established (no `[messenger] network error` logs)
- `widgetsConversations` / `widgetsConversationDetail` return data and `conversationMessageInserted` fires on a new message

**If `has_push_notifications` is true**, additionally confirm the checklist from `notification.md` → "Verification Checklist" before considering Step 6 complete:

- App launches with no `No Firebase App '[DEFAULT]'` crash
- `messaging().getToken()` resolves a token and `clientPortalUserAddFcmToken` registers it with `{ deviceId, token, platform }`
- A test push from the Firebase Console is received in foreground (in-app toast), background (system tray), and terminated (tray + correct route on tap) states
- Android 13+ shows the `POST_NOTIFICATIONS` prompt; no prompt on Android ≤12

**If `has_feedback_tickets` is true**, additionally confirm the checklist from `connect-erxes-tickets.md` §6 before considering Step 6 complete:

- Submitting feedback while logged out does not fire the `cpCreateTicket` mutation
- Submitting feedback while logged in creates a ticket visible in erxes Admin under the correct channel/pipeline, attributed to the submitting CPUser
- No auth token or user PII is printed in client-side logs
- `npx expo export` completes with zero errors

**Content file formats — single source of truth:**

Do not re-derive JSON shapes in this file. Formats are owned by the per-template pipeline that seeds them:

- **Ecommerce builds** (`template_type = "ecommerce"`): follow [`agents/ecommerce/AGENTS.md`](agents/ecommerce/AGENTS.md) Step 5a/5b/5c — per-language page objects, flat per-language post objects, nested menu groups. Those are the exact input contracts consumed by `scripts/erxes-pages.ts`, `scripts/erxes-posts.ts`, and `scripts/erxes-menu.ts` (posts without explicit `categoryIds` auto-attach to a shared default "Blog" category).
- **Other template types:** shape content using the CMS field map from [`agents/connect-erxes.md`](agents/connect-erxes.md) combined mode. If another template needs seeding scripts, define their input contract in that template's own agent folder — do not copy ecommerce's shapes.

Universal content rules (any template):

- Slugs: **identical across all languages** — `about` stays `about` so all locales map to the same page
- Menu items carry `"kind"` — `"header"` or `"footer"` at the gateway level (for ecommerce, `scripts/erxes-menu.ts` derives this from the group names)
- `erxes-cms.ts` runs once only — the CMS itself is shared across all languages

## Verify CMS data

Run the verify query from [`agents/connect-erxes.md`](agents/connect-erxes.md) for each language in `languages`. All must pass before deploying. Also require a successful `cd output/<slug> && npx expo export` (per Step 6 above) to pass.

```graphql
query Verify($language: String) {
  cpPages(language: $language) {
    _id
    name
    slug
    status
  }
  cpPosts(language: $language, status: published) {
    _id
    title
    slug
  }
  header: cpMenus(language: $language, kind: "header") {
    _id
    label
    url
    order
  }
  footer: cpMenus(language: $language, kind: "footer") {
    _id
    label
    url
    order
  }
}
```

Pass per language: pages exist, posts exist (if `has_blog`), header has ≥ 2 items, footer has ≥ 1 item.

### Step 7 — Deploy

Read `deploy_target` from `store.config.json`.

**`eas` (recommended — iOS + Android):**

```bash
eas build --platform all
eas submit --platform all
```

**`expo-go` (development/preview):**

```bash
npx expo start --tunnel
```

**`web` (PWA via Expo):**

```bash
npx eas-cli deploy
```

**`github`:**

```bash
tsx scripts/github-push.ts "<store-name>"
```

---

## Pipeline — Updating an existing app

1. Read `store.config.json`
2. Read relevant files in `output/<slug>/`
3. Make only the targeted changes:
   - "connect messenger" / "add live chat" → jump directly to Step 4.5 and `agents/connect-messenger.md`
   - "add push notifications" / "set up FCM" → jump directly to Step 4.6 and `agents/ecommerce/notification.md`
   - "connect feedback to tickets" / "add feedback tickets" → jump directly to Step 4.7 and `agents/ecommerce/connect-erxes-tickets.md`
     rather than re-running the full pipeline
4. Redeploy: `eas build --platform all`
