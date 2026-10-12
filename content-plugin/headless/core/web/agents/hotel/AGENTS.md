# erxes Hotel (PMS) + CMS — Agent Instructions

You build and deploy Next.js hotel websites fully connected to both erxes PMS (rooms, bookings, payments) and erxes CMS (pages, blog, navigation), parameterized for any hotel brand.

**Path convention:** every path in this file is relative to `web/agents/hotel/` unless it starts with `../` (parent `web/agents/`) or `output/` (the generated site, at `output/<slug>/`).

---

## Spec files

| File | Scope | Read at |
|---|---|---|
| [01-architecture.md](01-architecture.md) | Tech stack, Apollo clients, SDK, state, routing constraints, env names, folder structure (FIXED patterns) | Phase 0 |
| [02-design.md](02-design.md) | Design tokens (Tailwind v4 CSS-first), fonts, colors, container, global styles (VARIABLE values from brief) | Phase 1 |
| [03a-layouts.md](03a-layouts.md) | UI primitives, layouts, containers, shell, composition rules, server/client boundaries (FIXED patterns) | Phase 4 |
| [03b-features.md](03b-features.md) | Feature-vertical components — about-us, accommodation, activities, dining, spa-wellness, etc. (feature-gated) | Phase 4 |
| [04-data-layer.md](04-data-layer.md) | GraphQL ops, SDK, hooks, Jotai atoms, types, auth, image resolution (FIXED patterns; domains/IDs from brief) | Phase 2 |
| [05-i18n.md](05-i18n.md) | next-intl v4 wiring, middleware, navigation, messages (locales/messages from brief) | Phase 3 |
| [06-booking-payment.md](06-booking-payment.md) | Two-track booking, deal/invoice flow, payment provider (FIXED patterns; stages/IDs from brief) | Phase 5 |
| [07-pages.md](07-pages.md) | Page tree, routing, metadata, layouts (FIXED patterns; page set gated by features) | Phase 6 |
| [08-animations.md](08-animations.md) | framer-motion/embla/carousel patterns, timings (FIXED patterns; intensity from brief) | Phase 6 |

> **Read only the spec file for the current phase.** In Phase 4 read `03a-layouts.md` (shell/primitives/containers) and/or `03b-features.md` (feature verticals) for what is actually being built — do not load both in full.

---

## Version pinning (FIXED)

- Install **exact** versions — no `^`, no `~`, no `@latest`. Commit the lockfile.
- Framework/library versions come from [01-architecture.md](01-architecture.md) and [04-data-layer.md](04-data-layer.md) and **OVERRIDE the starter's versions** (downgrade or replace the starter's if they differ).
- Exact versions the specs state: Next.js `15.4.10`, React `19.1.0`, react-dom `19.1.0`. `next-intl` resolves to `4.12.0` (05 §1.1).
- Where a spec gives only a range (e.g. `@apollo/client ^3.13.9`, `framer-motion ^12`, `embla-carousel-react ^8.6.0`), pin the version resolved in the cloned `pnpm-lock.yaml` and report it.
- After install: `grep -nE '"\^|"~' package.json` must print nothing.

---

## Variable mapping (Tegri Gobi = reference example only)

| Tegri-specific (example) | Supplied by intake/config | Notes |
|---|---|---|
| Brand name "Tegri Gobi Resort" | project_name / brand_name | From brief (required) |
| Primary color oklch(0.637 0.223 28.4) | primary_color | From brief (required). Never hardcode for new site. |
| Fonts Roboto + DM Sans | fonts.heading/fonts.body | From brief (optional; defaults per 02) |
| Locales en,mn | locales + default_locale | From brief (required) |
| Hostname tegrigobinew.next.erxes.io | main_api_domain (derived hosts) | Image remotePatterns set from main_api_domain |
| GA4/GTM IDs (G-D1V0GE4NDR/GTM-KQJSZZVZ) | analytics.ga4 / analytics.gtm | From brief (optional) |
| API hosts/domains | main_api_domain/main_subs_domain/saas_domain | From brief (required/conditional) |
| CP token/id | cp_token/cp_id | From brief (required) |
| PMS/TMS tokens/ids | pms_token/branch_id/tms_branch_id | From brief (required/conditional) |
| Pipeline/stage/payment ids | pipeline_id/booking_stage_id/pending_stage_id/paid_stage_id/pay_at_property_stage_id/payment_ids | From brief (required/conditional) |
| Google Maps/Places | google_maps_api_key/google_place_id | From brief (conditional by features.maps/reviews) |
| Forms | pay_at_property_form_id/tour_packages_form_id | From brief (conditional) |
| Erxes POS token literal (source) | erxes_pos_token | From brief (optional) |
| Category IDs (CAR_CATEGORY_ID/PC_CATEGORY_ID) | category_ids.car/pc | From brief (optional) |
| Social links (IG/FB) | social.* | From brief (optional) |
| Copy/strings | messages.* per locale | From brief (optional; defaults from messages templates) |
| Assets (logo/video/favicon) | logo/favicon/video_hero_url | From brief (optional) |

Tegri Gobi values in 01-08 are reference examples only; do not copy them to another brand.

---

## Canonical GraphQL operations (starter-owned — do not rename)

These documents ship **in the starter** (`scripts/clone.ts`). Hotel code imports them; never re-declare, rename, or move them. Payment ops are shared with the ecommerce vertical and live in `src/graphql/ecommerce/{queries,mutations}/payment.ts`; booking ops live in `src/graphql/hotel/`. Verified against `output/test1/src/graphql/`.

| Field (SDL) | Kind | Exported const (file) | Result type |
|---|---|---|---|
| `invoiceCreate` | mutation | `INVOICE_CREATE` (`ecommerce/mutations/payment.ts`) | `Invoice` |
| `invoicesCheck` | **mutation** | `INVOICES_CHECK` (`ecommerce/mutations/payment.ts`) | `Boolean` |
| `paymentTransactionsAdd` | mutation | `PAYMENT_TRANSACTIONS_ADD` (`ecommerce/mutations/payment.ts`) | `PaymentTransaction` |
| `cpPayments` | query | `CP_PAYMENTS` (`ecommerce/queries/payment.ts`) | `Payment[]` |
| `invoiceUpdated` | subscription | `INVOICE_UPDATED` (`ecommerce/queries/payment.ts`) | `Boolean` |
| `transactionUpdated` | subscription | `TRANSACTION_UPDATED` (`ecommerce/queries/payment.ts`) | `Boolean` |
| `cpDealsAdd` | mutation | `hotel/mutations/booking.ts` | `Deal` |
| `cpDealsEdit` | mutation | `hotel/mutations/booking.ts` | `Deal` |
| `cpDeals` | query | `hotel/queries/booking.ts` | `Deal[]` |
| `cpDealDetail` | query | `hotel/queries/booking.ts` | `Deal` |
| `cpPmsRooms` | query | `hotel/queries/rooms.ts` | room list |
| `cpPmsCheckRooms` | query | `hotel/queries/rooms.ts` | room list |

> **Renamed-from-reference note.** The names `cpInvoiceCreate`, `cpInvoicesCheck`, and `cpInvoices` used throughout 04 and 06 describe the **Tegri Gobi reference project** — they do **NOT** exist in the starter. Generate with the starter names above: invoice creation is the `invoiceCreate` field (const `INVOICE_CREATE`); the paid check is the **`invoicesCheck` mutation** (const `INVOICES_CHECK`), not a query; there is no `cpInvoices`/`invoiceDetail` document in the starter. Only `cpPayments` matches the `cp*` convention.

---

## Feature flags

Defaults live in a single source: **hotel/setup.md section B**. Do not restate or invent them here. A flag OFF must produce NO routes, nav links, messages, or imports; a flag ON requires its spec sections to be present.

| Flag | Controls | Spec sections |
|---|---|---|
| auth | Login/signup/verify/reset/password | 03,04,07 |
| company_accounts | Company signup gate | 03,07,01 (API route) |
| activities/dining/spaWellness | Appointment contexts (Track B) | 03,06,07 |
| merch | Merch vertical | 03,06,07 |
| tours | Tours/BMS | 03,04,05,06,07 |
| lodge_stays | Lodge stays (BMS) | 03,07 |
| fund | Foundation | 03,06,07 |
| news | News/blog | 03,07 |
| careers | Careers/KB | 03,04,07 |
| sustainability/offers | Static pages | 03,07 |
| custom_forms | Erxes forms | 03,04,07 |
| google_reviews | Google Places reviews/API | 01,03,04,07 |
| maps | Google Maps embed | 01,03,07 |
| chat_widget | Erxes widget | 01,03,07 |
| pay_at_property | Pay-at-property option | 01,04,06 |
| subscriptions | GraphQL subscriptions (ws) | 01,04 |
| video_hero | Video hero vs image carousel | 03,07,08 |
| animations | Enable motion | 08 |
| pos/kb | POS/KB domains | 03,04 |

**Flag naming:** config keys are snake_case (`features.custom_forms`); 07-pages.md and the starter code use camelCase (`features.customForms`). Every flag whose spelling differs:

| Config key (snake_case) | Code/spec key (camelCase) | Source |
|---|---|---|
| company_accounts | companyAccounts | 07-pages.md |
| custom_forms | customForms | 07-pages.md |
| lodge_stays | lodgeStays | 07-pages.md, 03, 04, 08 |
| video_hero | heroVideo | 03, 08 |
| chat_widget | messenger | 03, 04, 08 |

Flags not listed keep the same spelling in both conventions.

**Single-key flags (use exactly one spelling everywhere — config, code, and specs):** `spaWellness`
(NO `spa` alias — 03/04/08 already use `spaWellness`; 07-pages.md must too), `google_reviews`, and
`pay_at_property`. Do not introduce `spa`, `googleReviews`, or `payAtProperty`.

---

## Intake (part of Step 0)

Intake happens inside Step 0. The canonical question set is [hotel/setup.md](setup.md), which builds on the generic [../setup.md](../setup.md):

- Generic fields: `name`, `template_type`, `language`/`languages`, `tone`, `sections`, `design_strategy`, `ui_source`, `ui_source_ref`, `color_hint`, `extra_notes`, `deploy_target`, `erxes_endpoint`, `erxes_app_token`, `client_portal_id`.
- Hotel fields: `pipeline_id`, `booking_stage_id`, `paid_stage_id`, `payment_ids`, `allow_guest`, `cms_sections`.
- New-spec fields (hotel/setup.md §A–F): `locales`/`default_locale`, `features`, design (`ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, `competitor_urls`, `motion_level`), erxes connection (`main_api_domain`, `main_subs_domain`, `cp_token`, `cp_id`, `pms_token`, `branch_id`, `tms_branch_id`, pipeline/stage/payment ids, payment provider), brand (`primary_color`, fonts, logo/favicon/social/contact), and `sections`/`cms_sections`/`required_sections`.
- Never guess a required value. Secrets go to `.env` only.
- **If any required erxes value is missing or is a placeholder, STOP at intake and ask the user.** Never fabricate data or a mock backend. There is no demo mode, no fixture data, no `src/demo/`, and no `NEXT_PUBLIC_DEMO_MODE`.
- **Client-portal identifier = `ERXES_CLIENT_PORTAL_ID`** (read by `lib/config-loader.ts`). `ERXES_CP_TOKEN` is NOT read anywhere; `NEXT_PUBLIC_ERXES_CP_TOKEN` and `NEXT_PUBLIC_CP_ID` are derived from the identifier by `lib/next-config-writer.ts`.
- **Config file:** `hotel.config.json` at the repo root (`process.cwd()`). `scripts/clone.ts`, `lib/config-loader.ts` (used by `scripts/erxes-cms.ts`), and `lib/next-config-writer.ts` all read `hotel.config.json` first, then fall back to `site.config.json`/`store.config.json`.
- **Seed files:** `output/pages.json`, `output/posts.json`, `output/menu.json` (repo-root `output/`, **not** `output/<slug>/`); each `scripts/erxes-*.ts` takes the path as its argument.
- **`.env` variable names (names only):**
  - Written at intake: `ERXES_ENDPOINT`, `ERXES_APP_TOKEN`, `ERXES_CLIENT_PORTAL_ID`, `ERXES_CMS_ID`, `GITHUB_USERNAME`, `GITHUB_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `STARTER_REPO_URL`.
  - **Canonical env matrix — the single source of truth.** `lib/next-config-writer.ts` emits these into the generated `next.config.mjs`, and hotel code reads **only** these names. Do not introduce aliases.

    | Variable | Purpose |
    |---|---|
    | `NEXT_PUBLIC_GRAPHQL_URL` | client + server GraphQL endpoint |
    | `NEXT_PUBLIC_ERXES_APP_TOKEN` | client `x-app-token` |
    | `ERXES_APP_TOKEN` | server `x-app-token` |
    | `NEXT_PUBLIC_CMS_ID` | CMS scoping record-keeping |
    | `NEXT_PUBLIC_CP_ID` | client-portal id (record-keeping only) |
    | `NEXT_PUBLIC_PMS_TOKEN` | PMS branch token |
    | `NEXT_PUBLIC_BRANCH_ID` | branch scoping (rooms/pricing) |
    | `NEXT_PUBLIC_TMS_BRANCH_ID` | TMS/BMS branch scoping (tours/lodge stays) |
    | `NEXT_PUBLIC_PMS_PIPELINE_ID` | booking pipeline id |
    | `NEXT_PUBLIC_BOOKING_STAGE_ID` | new-booking stage |
    | `NEXT_PUBLIC_REQUEST_STAGE_ID` | booking-requested stage |
    | `NEXT_PUBLIC_PENDING_STAGE_ID` | pending stage |
    | `NEXT_PUBLIC_PAID_STAGE_ID` | paid stage |
    | `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID` | pay-at-property stage |
    | `NEXT_PUBLIC_APPROVED_STAGE_ID` | appointment-approved stage |
    | `NEXT_PUBLIC_PAYMENT_IDS` | payment method ids (comma-separated) |
    | `NEXT_PUBLIC_GA_ID` | GA4 measurement id |
    | `NEXT_PUBLIC_GTM_ID` | GTM container id |
    | `GOOGLE_MAPS_API_KEY` | Google Maps embed (server) |
    | `GOOGLE_PLACE_ID` | Google Places |
    | `NEXT_PUBLIC_SAAS_DOMAIN` / `NEXT_PUBLIC_MAIN_API_DOMAIN` / `NEXT_PUBLIC_MAIN_SUBS_DOMAIN` | starter hosts |
    | `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` / `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID` | erxes widget form ids |
    | `CAR_CATEGORY_ID` / `PC_CATEGORY_ID` / `PARENT_CATEGORY_ID` | POS category ids |

---

## Shared Module Integration

Reuse from parent `agents/`: [agents/setup.md](../setup.md) (generic intake), [agents/pencil-design.md](../pencil-design.md) (design), [agents/frontend.md](../frontend.md), [agents/conventions.md](../conventions.md), [agents/animations.md](../animations.md). Hotel-specific logic lives here.

---

## Generation order (spec-driven)

Phases 0-6 run **at Pipeline Step 4**, on the already-cloned `output/<slug>/`. Pipeline Step 3.5 only plans design inputs. Each phase: read specs -> produce -> pass the gate. A gate passes only when (a) every manifest file exists (proved with `find`/`ls`), (b) `tsc --noEmit` exits 0, and (c) `pnpm build` exits 0. Typecheck/build alone never passes a phase. Never write "done" or "structured" without the `find` output. Conditional manifest entries are required only when their feature flag is ON; when a flag is OFF, none of its files may exist.

### Phase 0 — Architecture bootstrap (read 01)
- Validate brief (intake) complete; if any required missing -> ask user.
- Write config + `.env` skeleton (do not fill secrets blindly).
- Required files: `hotel.config.json`, `.env.local`, `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/[locale]/layout.tsx`, `src/middleware.ts`.

### Phase 1 — Design system (read 02)
- Apply branches from brief (primary_color, fonts, radius) into `design-tokens.json` and `globals.css` (Tailwind v4 CSS-first).
- Keep the container override and `.never-dark` rule as FIXED patterns; the brief cannot override FIXED.
- Required files: `design-tokens.json`, `src/app/[locale]/globals.css`.

### Phase 2 — Data layer & Auth (read 04)
- Generate the GraphQL layer on the **starter layout**: `src/graphql/hotel/*` and `@/lib/apollo/*`. Inject hosts/IDs/tokens from brief; apply `pos`/`kb`/`subscriptions`. Do **NOT** author `src/sdk/getClient.tsx`, `src/sdk/graphql/*`, `src/sdk/queries/*`, `src/sdk/hooks/*`, `src/sdk/mutations/*`, or `src/app/[locale]/ApolloClient.tsx` — those belong to the Tegri Gobi reference project and are reference-only (do not copy).
- Required files: `src/graphql/hotel/queries/{rooms,booking,index}.ts`, `src/graphql/hotel/mutations/{booking,index}.ts`, the shared payment documents re-used from `src/graphql/ecommerce/{queries,mutations}/payment.ts`, `src/lib/apollo/{client.ts,provider.tsx,server-client.ts}`, `src/store/{auth,config,pricing,reserve,index}.ts`, `src/types/*.ts`. Conditional: `src/app/api/company-signup/unlock/route.ts` (company_accounts), `src/app/api/google-reviews/route.ts` (google_reviews).

### Phase 3 — i18n (read 05)
- Set up next-intl v4 per FIXED patterns with `locales`/`default_locale` from brief; generate messages with brief overrides merged.
- Required files: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/middleware.ts`, `src/components/LanguageSwitch.tsx`, `messages/<locale>.json` for every configured locale (repo root, not under `src/`).

### Phase 4 — Components & UI (read 03a, 03b)
- Build primitives/layout per FIXED patterns; include feature-gated verticals per flags.
- Required files: `src/components/ui/{button,image,card,carousel,form,input,label,dialog,accordion,tabs}.tsx`, `src/components/layout/{ConditionalLayout,Header,SecondaryHeader,Footer,Reserve,ReserveText}.tsx`, `src/components/clientPages/**`, `src/containers/{auth,config,pricing}/**`. Conditional: `src/components/{about-us,accommodation,activities,dining,merch,fund,news,spa-wellness,sustainability,tours,profile,reserve,contact-us,booking,auth}/**` for the matching feature.

### Phase 5 — Booking & Payment (read 06)
- Implement two-track booking per FIXED patterns; inject pipeline/stage/payment ids from brief; apply `pay_at_property`.
- Required files: `src/components/booking/**` (incl. `payment/payment-detail.tsx`, `payment/PaymentMethodSelector.tsx`, the payment dialogs), `src/components/reserve/{date-picker,guest-counter,room-counter}.tsx`, `src/components/layout/Reserve.tsx`, `src/store/reserve.ts`, `src/lib/{booking-pricing,payment-status}.ts`, `src/app/[locale]/booking/{page.tsx,details/page.tsx,payment/[slug]/page.tsx,confirm/page.tsx}`. Conditional: Track B pages under `src/app/[locale]/<context>/{booking,payment/[slug]}/` for enabled contexts, and `src/components/appointment/**`.

### Phase 6 — Pages, routing, metadata & animations (read 07,08)
- Assemble the page set gated by flags; apply metadata/SEO and animations (`animations` flag, `motion_level`).
- Required files: `src/app/[locale]/page.tsx`, `src/app/[locale]/about-us/page.tsx`, `src/app/[locale]/contact-us/page.tsx`, `src/app/[locale]/legal-notice/page.tsx`, `src/app/[locale]/accommodation/{page.tsx,[slug]/page.tsx}`, `src/app/[locale]/profile/{page.tsx,detail/[slug]/page.tsx}`, `src/app/[locale]/(auth)/layout.tsx`, `src/lib/hooks/useMetadata.ts`. Conditional: route folders in 07 §2 whose feature flag is ON (news, forms, lodge-stays, activities, dining, spa-wellness, merch, tours, fund, sustainability, offers, careers). Animations: `src/components/ScrollStack.tsx` plus the framer-motion/embla consumers listed in 08 §1.1-1.2 when `animations` is ON.

If a manifest entry cannot be derived from its spec, say so in the execution report and do not invent it.

---

## Run model

- Run Phases 0-6 in order; do not stop between phases to ask the user.
- If context is running out, stop at a clean phase boundary, write `output/<slug>/build-state.json` (`{completed: [...], next: "<phase>"}`), and print `RESUME FROM: <phase>`.
- On resume, read `build-state.json` and skip completed phases.

---

## Global rules

- Tegri values are reference only; parameterize everything via brief/config/flags.
- If a required value is missing -> stop and ask user (never guess).
- Keep FIXED structural patterns from 01-08 unchanged; only VARIABLE values differ.
- **Deprecation:** `generate-*.md` and the archived `hotel/_archive/conventions.md`, `hotel/_archive/payment.md`, `hotel/_archive/reference.md` are deprecated as generation steps — do not use them to generate code and do not edit or delete them. They may be referenced ONLY where they are the sole source for erxes connection details; list each such case in the execution report. `hotel/setup.md` and `agents/setup.md` are ACTIVE intake/setup sources, not deprecated.
- For the hotel flow, any instruction in `agents/setup.md` that sends design/generation to `generate-*.md` is superseded by this file's Pipeline and Phases.
- Do not duplicate appointment/graphql (04). Use the starter's Apollo modules exactly — one browser client (`@/lib/apollo/client.ts` + `provider.tsx`) and one server client (`@/lib/apollo/server-client.ts`). Do **not** author `src/sdk/getClient.tsx` or `src/app/[locale]/ApolloClient.tsx` (Tegri Gobi reference only).
- Tailwind v4 CSS-first; preserve the `.never-dark` rule and container override as FIXED.
- next-intl v4 per 05; `params`/`searchParams` as Promises (Next 15).

---

## Conflict precedence

1. Project brief (user input) — highest for VARIABLE
2. Design artifacts (Pencil/design-tokens/HANDOFF) — override brief only if explicitly approved by user
3. Feature flags — gate inclusion
4. Defaults — lowest; never applied to required missing fields
5. FIXED patterns in 01-08 — cannot be overridden by brief

---

## Final verification checklist (evidence required: command output or file path per item)

- [ ] Step 0 intake complete: every required field in `hotel.config.json` present (paste keys).
- [ ] Step 1 `hotel.config.json` + `.env.local` aligned with brief; no secret in config (show keys).
- [ ] Version pinning: `grep -nE '"\^|"~' package.json` prints nothing; exact versions match 01/04 (paste output + diff).
- [ ] Phase manifests complete for all Phases 0-6: paste the `find` output for each manifest.
- [ ] `tsc --noEmit` exits 0 (paste).
- [ ] `pnpm build` exits 0 (paste).
- [ ] `pnpm lint` exits 0 (paste).
- [ ] Locale key parity: every configured locale has an identical key set (paste leaf-key count per locale).
- [ ] Tokens parameterized; no hardcoded Tegri values in new site code.
- [ ] Brand leakage (grep `src/`, `messages/`, `public/`, config, metadata, case-insensitive, for every Tegri value in Variable mapping):
  - [ ] brand name / domain / place names
  - [ ] copy strings
  - [ ] brand-specific color/font names
  - Any hit fails unless the user's own brief contains that value.
- [ ] Feature flags: each OFF flag has no routes/nav/messages/imports (grep proof); each ON flag has its spec sections.
- [ ] Route -> HTTP status table after `pnpm build && pnpm start`: `curl -s -o /dev/null -w "%{http_code}" <url>` for every enabled route (paste table).
- [ ] Step 5 seeding: `output/pages.json`, `output/posts.json`, `output/menu.json` exist; verify GraphQL query returns pages/posts/header/footer for each locale.
- [ ] Step 6 Verify and Step 7 Deploy: queries pass per enabled feature; live URL or repo URL returned.

---

## Pipeline

1. **Step 0 — Setup/Intake**: read [agents/setup.md](../setup.md) (generic) then [agents/hotel/setup.md](setup.md) (hotel-specific). This performs intake/questions (§A–F) and writes `hotel.config.json` + `.env.local`, then waits for confirmation. If intake needs a field the specs require, collect it here.
2. **Step 1 — Read config**: read `hotel.config.json` (and the brief if present).
3. **Step 2 — Create CMS** (skip if `hotel.config.json` already has `erxes_cms_id`): run `tsx scripts/erxes-cms.ts`. It prints the CMS record as JSON; write the returned `_id` into `hotel.config.json` as `erxes_cms_id` and into `.env` as `ERXES_CMS_ID`.
4. **Step 3 — Clone starter**: run `tsx scripts/clone.ts "<site-name>"`; it clones into `output/<slug>/`, prunes inactive vertical `src/graphql/` layers, and prints the output directory.
   > **HARD GATE — Step 3 is not completion.** The cloned starter is ONLY a scaffold. After cloning you MUST continue to Step 3.5 and then Step 4 and generate all code from specs 01-08. Where starter code or starter versions disagree with specs 01-08, the specs WIN. Never stop, summarize, or report completion after Step 3.
5. **Step 3.5 — Design**: use [agents/pencil-design.md](../pencil-design.md) with the brief from intake. This step only plans design inputs (tokens, section list, HANDOFF); it does not generate site code.
6. **Step 4 — Generate code (spec-driven)**: execute Phases 0-6 on `output/<slug>/` (01-08). This REPLACES the deprecated `generate-*.md` chain.
7. **Step 5 — Seed CMS content**: generate one JSON file per type at `output/pages.json`, `output/posts.json`, `output/menu.json` (menu items require `kind: "header"` or `"footer"`; slugs identical across locales; all languages in `translations`), then run:
   ```bash
   tsx scripts/erxes-pages.ts output/pages.json
   tsx scripts/erxes-posts.ts output/posts.json
   tsx scripts/erxes-menu.ts  output/menu.json
   ```
8. **Step 6 — Verify**: `pnpm build` plus every item in the Final verification checklist.
9. **Step 7 — Deploy**: `tsx scripts/deploy.ts "<site-name>"` when `deploy_target` is `vercel`, or `tsx scripts/github-push.ts "<site-name>"` when `deploy_target` is `github`.
