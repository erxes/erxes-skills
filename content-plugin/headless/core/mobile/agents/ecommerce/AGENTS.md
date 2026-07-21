# erxes Ecommerce + CMS — Mobile Agent Instructions

You build and deploy Expo (React Native) ecommerce mobile apps that are fully connected to erxes POS (products, cart, payment), erxes CMS (pages, blog, navigation), erxes Messenger (in-app chat/support), and push notifications.

Read these files as needed — do not skip them:

| File                                           | Read when                                                  |
| ---------------------------------------------- | ---------------------------------------------------------- |
| [`setup.md`](setup.md)                         | Start of every new build                                   |
| [`conventions.md`](conventions.md)             | Before writing any code                                    |
| [`connect-erxes.md`](connect-erxes.md)         | Step 0.5 — connecting the app to the erxes gateway         |
| [`connect-messenger.md`](connect-messenger.md) | Step 3.7 — embedding erxes Messenger (chat/support widget) |
| [`generate.md`](generate.md)                   | Step 4 — code generation                                   |
| [`frontend.md`](frontend.md)                   | Step 4 — frontend build phases, token system               |

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
| `agents/frontend.md`                | Step 4 (before code generation)  | Frontend build phases, token system, component architecture, zero-error build protocol                |
| `agents/conventions.md`             | Before writing ANY code          | Generic code conventions — Expo Router / React Native patterns, data fetching, NativeWind, TypeScript |

### Ecommerce-Specific Files (always read these)

| File                                      | When to Read                       | Purpose                                                                                                                          |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `agents/ecommerce/setup.md`               | Step 0                             | Ecommerce-specific fields (delivery_types, allow_guest, pos_token)                                                               |
| `agents/ecommerce/conventions.md`         | Before writing ANY code            | Ecommerce-specific conventions — auth tokens, web-safe secure storage, Apollo headers, Jotai stores, payment flow                |
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
5. **Skip generic UX research** — optional, user can request it
6. **Proceed to erxes connection (Step 0.5)**, then design (Step 3.5) after setup complete

### File Reading Order for Ecommerce

```
Step 0:   agents/setup.md (generic fields)
          |
          agents/ecommerce/setup.md (ecommerce-specific fields)
          |
Step 0.5: agents/connect-erxes.md (gateway URL, client-portal token, base headers)
          |
Step 0.75:[OPTIONAL] agents/ux-ui-researcher.md (if user wants UX research)
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

**If coming from generic pipeline (`agents/setup.md`):**

- Generic fields already collected in `site.config.json`
- Rename `site.config.json` → `store.config.json`
- Read `agents/ecommerce/setup.md` and ask ONLY missing ecommerce-specific fields:
  - `delivery_types`
  - `allow_guest`
  - `pos_token`

**If starting fresh:**

- Read `agents/setup.md` first — collect generic fields (name, template_type, languages, tone, etc.)
- When `template_type = "ecommerce"`, switch to this file
- Then read `agents/ecommerce/setup.md` — collect ecommerce-specific fields

**After all fields collected:**

- Write `store.config.json`
- Update `.env`
- Create CMS with `tsx scripts/erxes-cms.ts`
- Save returned `_id` as `ERXES_CMS_ID`

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

### Step 3.5 — UI design source

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `store.config.json`.

**Hard Gate:** Do not generate any design directions until `store.config.json` exists and `design_strategy` is set.

**Design strategy controls the approach:**

- `from-scratch` — new app, no existing design to preserve
- `copy-site` — replicate an existing app/site as faithfully as possible
- `improve-site` — use an existing app or design as the base, then elevate it
- `brand-first` — build from a brand guide, Figma system, or locked visual identity
- `beat-competitors` — audit competitor references and design to stand out

**`words`** — user described the look in text
Read [`agents/ecommerce/pencil-design.md`](pencil-design.md). Use `ui_source_ref` as the creative brief. Produce the full design package:

- First create 2 to 3 home-tab-only direction previews in Pencil using the full selected home section sequence, sized to mobile viewport (375–430px width)
- Save them as real preview artifacts:
  - `output/<slug>/designs/home-directions.pen`
  - `output/<slug>/designs/home-option-a.png`
  - `output/<slug>/designs/home-option-b.png`
  - `output/<slug>/designs/home-option-c.png` when a third option exists
- Show those previews to the user and get a choice
- Only after the user selects one option, expand that chosen direction into:
  - `output/<slug>/designs/design.pen`
  - `output/<slug>/designs/design.png`
  - `output/<slug>/design-tokens.json`
  - `output/<slug>/ui-libraries.json`
  - `output/<slug>/HANDOFF.md`
- After the full design is ready in the approved Pencil file, ask exactly: `do you wanna edit design before build frontend?`
- Follow with a free-form request for screen-specific edits
- Apply requested edits and repeat until the user explicitly approves

**`pencil`** — existing `.pen` file
Open file at `ui_source_ref` path using Pencil MCP tools. Use it as the base home direction, create full-home options in Pencil first, export preview images, show the user the choices, then after approval expand the chosen direction into the full design package listed above.

**`screenshot`** — uploaded screenshots
Read image files in `ui_source_ref`. Extract layout, sections, colors, and component patterns, rebuild full-home direction previews in Pencil first, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**`website`** — existing site URL
Fetch URL in `ui_source_ref`. Discover the main navigation, locale variants, and relevant pages first. Run:

```bash
pnpm site:audit "<reference-url-or-ui_source_ref>" "output/<slug>/source-audit.json"
```

Use that audit JSON as the source-of-truth inventory for both structure and static content, then turn that into full-home direction previews in Pencil, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**For `pencil` / `screenshot` / `website`:**
Extract dominant primary color → write to `store.config.json` as `color_hint`. Do not ask user.

**If `design_strategy` is `copy-site` or `improve-site`:**
Use `reference_url` from config when present as the source to copy or improve.

**If `design_strategy` is `beat-competitors`:**
Use `competitor_urls` from config when present as the competitor audit input.

### Step 3.7 — Connect erxes Messenger

**Mandatory — always run this step for every ecommerce mobile app.**

**Read `agents/connect-messenger.md`.**

If `messenger_brand_id` is missing from `store.config.json`, ask the user for it before proceeding — do not skip the step or ship the app without a messenger connection.

Embed the erxes Messenger widget (in-app chat/support) after the design is approved so the floating bubble/entry point matches the chosen design tokens:

- Register `messenger_brand_id` from `store.config.json`
- Generate the messenger bridge component (WebView-based or native SDK, per `connect-messenger.md`)
- Wire the messenger entry point (floating action button or tab icon) using the approved design tokens from Step 3.5
- Confirm the messenger connection reuses the same client-portal/app-token headers established in Step 0.5 — do not create a second auth path

### Step 4 — Generate code

**Hard Gate:** Do not enter Step 4 until Step 3.5 (and Step 3.7 when applicable) is fully complete.

Step 3.5 is complete only when:

- 2 to 3 home-tab-only direction previews were created in Pencil
- each home preview includes the full home tab with all selected or detected home sections in order
- preview exports were shown to the user
- the user selected one home option
- the selected option was expanded into the full Pencil design package
- the full designed screens were ready for user review in the approved Pencil file
- the user was asked `do you wanna edit design before build frontend?`
- any requested design edits were applied
- the user explicitly approved the final design package for build
- `design.pen` and `design.png` were exported from the approved Pencil design
- `HANDOFF.md` records the approved home option and preview files

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
13. `agents/ecommerce/conventions.md` — ecommerce conventions (auth tokens, web-safe secure storage, Apollo headers, Jotai stores, payment flow)
14. `agents/conventions.md` — generic conventions (Expo Router / React Native patterns)
15. `agents/frontend.md` — frontend architecture, token system, build phases
16. `agents/animations.md` — animation libraries (if motion level > 0)
17. `agents/ecommerce/reference.md` — GraphQL queries/mutations
18. `agents/ecommerce/payment.md` — payment flow implementation

**Do NOT skip generate-pages.md, generate-checkout.md, or notification.md.** These files define the auth, profile, orders, wishlist, checkout, verify, and push-notification flow. Skipping them produces a static app without the ecommerce flow or order-status alerts.

**Then write files in this order:**

1. Dependencies install (see `generate-setup.md` — includes `babel-preset-expo`, NativeWind, Metro config)
2. Types (`types/`)
3. Apollo client + provider (using web-safe secure storage wrapper — see `conventions.md`)
4. Jotai store (`store/`)
5. GraphQL (`graphql/`) — CP\_\* query variants
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

### Step 5 — Seed CMS content

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

```bash
tsx scripts/erxes-posts.ts output/posts.json
```

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
