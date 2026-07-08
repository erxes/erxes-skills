# erxes Ecommerce + CMS — Mobile Agent Instructions (Expo)

You build and deploy **Expo (React Native)** ecommerce apps that are fully connected to both erxes POS (products, cart, payment) and erxes CMS (pages, blog, navigation).

Read these files as needed — do not skip them:

| File                               | Read when                                      |
| ---------------------------------- | ---------------------------------------------- |
| [`setup.md`](setup.md)             | Start of every new build                       |
| [`conventions.md`](conventions.md) | Before writing any code                        |
| [`generate.md`](generate.md)       | Step 4 — code generation                       |
| [`reference.md`](reference.md)     | GraphQL queries/mutations, env vars, checklist |
| [`payment.md`](payment.md)         | Checkout and payment implementation            |

---

## Shared Module Integration

The ecommerce pipeline REUSES modules from the generic `agents/` folder. Do not duplicate — read the shared files at the correct step.

### Shared Files (read at the specified step)

| File                         | When to Read                           | Purpose                                                                                 |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `agents/setup.md`            | Step 0 (if starting fresh)             | Generic setup collection — ask template type, languages, tone, design strategy, etc.    |
| `agents/pencil-design.md`    | Step 3.5                               | Pencil design tool usage, direction previews, design tokens                             |
| `agents/animations.md`       | Step 4 (before writing animation code) | Animation library implementations — Reanimated, Moti, Lottie, etc.                      |
| `agents/frontend.md`         | Step 4 (before code generation)        | Frontend build phases, token system, component architecture, zero-error build protocol  |
| `agents/ux-ui-researcher.md` | Step 0.75 (if user wants UX research)  | UX research document generation (optional for ecommerce)                                |
| `agents/conventions.md`      | Before writing ANY code                | Generic code conventions — React Native patterns, data fetching, NativeWind, TypeScript |

### Ecommerce-Specific Files (always read these)

| File                              | When to Read                     | Purpose                                                                                  |
| --------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents/ecommerce/setup.md`       | Step 0                           | Ecommerce-specific fields (delivery_types, allow_guest, pos_token)                       |
| `agents/ecommerce/conventions.md` | Before writing ANY code          | Ecommerce-specific conventions — auth tokens, Apollo headers, Jotai stores, payment flow |
| `agents/ecommerce/generate.md`    | Step 4                           | Ecommerce code generation — types, GraphQL, hooks, components, screens                   |
| `agents/ecommerce/reference.md`   | Step 4 + Step 5                  | GraphQL queries/mutations, env vars, payment flow checklist                              |
| `agents/ecommerce/payment.md`     | Step 4 (checkout implementation) | Payment implementation details                                                           |

### Routing from Generic Pipeline

When `template_type = "ecommerce"` is selected in `agents/setup.md`:

1. **Stop following `agents/setup.md`** after collecting generic fields
2. **Switch to `agents/ecommerce/AGENTS.md`** immediately
3. **Continue ecommerce-specific setup** (delivery_types, allow_guest, pos_token)
4. **Skip generic business analysis** — ecommerce has its own content flow
5. **Skip generic UX research** — optional, user can request it
6. **Proceed directly to design (Step 3.5)** after setup complete

### File Reading Order for Ecommerce (Mobile)

```
Step 0:  agents/setup.md (generic fields)
         |
         agents/ecommerce/setup.md (ecommerce-specific fields)
         |
Step 0.5: [OPTIONAL] agents/ux-ui-researcher.md (if user wants UX research)
         |
Step 3.5: agents/pencil-design.md (design directions in Pencil)
         |
Step 4:  agents/ecommerce/generate.md (ecommerce code generation)
         agents/ecommerce/conventions.md (ecommerce conventions)
         agents/conventions.md (generic conventions)
         agents/frontend.md (frontend architecture)
         agents/animations.md (animation libraries — if motion level > 0)
         agents/ecommerce/reference.md (GraphQL reference)
         agents/ecommerce/payment.md (payment flow)
         |
Step 5:  agents/ecommerce/reference.md (CMS seeding, env vars)
         |
Step 6-7: agents/ecommerce/reference.md (verify + deploy)
```

---

## Pipeline — New storefront (Mobile)

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

### Step 1 — Read config

Read `store.config.json`. Derive:

- `slug` = name lowercased, spaces → hyphens
- `has_delivery` = `delivery_types` includes `"delivery"`
- `has_auth` = `allow_guest` is false
- `has_cms` = `cms_sections` is non-empty and not `["none"]`
- `has_blog` = `cms_sections` includes `"blog"`
- `has_contact` = `sections` includes `"contact"` or `cms_sections` includes `"contact"`

**Section-to-screen rule:**

- The home screen should include the selected sections as landing sections
- Every selected section should also become a standalone screen/route unless purely decorative
- Use the same section names and slugs consistently across home screen composition, CMS screens, and bottom tab / drawer navigation

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

```bash
tsx scripts/clone.ts "<store-name>"
```

Creates the Expo project in `output/<slug>/`. Skips if already exists.

**CRITICAL:** Mobile ecommerce uses Expo, not Next.js.

```bash
npx create-expo-app@latest output/<slug> --template default@sdk-55
```

Required packages to install after init:

```bash
cd output/<slug>
npx expo install expo-router apollo-client @apollo/client graphql jotai nativewind tailwindcss
npx expo install expo-secure-store expo-constants expo-linking expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
```

Before running, ensure `.env` has the correct configuration for Expo.

> **Web → Mobile mapping:**
>
> - `next/navigation` → `expo-router` (`useRouter`, `useLocalSearchParams`, `Link`)
> - `pages/` or `app/` directory (Next.js) → `app/` directory (Expo Router)
> - CSS Modules / Tailwind → NativeWind (`className` on React Native components)
> - `<div>`, `<p>`, `<img>` → `<View>`, `<Text>`, `<Image>` from `react-native`
> - `layout.tsx` → `app/_layout.tsx` (Expo Router root layout)
> - API Routes → Expo API Routes (`app/api/` or separate backend)

### Step 3.5 — UI design source

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `store.config.json`.

**Hard Gate:** Do not generate any design directions until `store.config.json` exists and `design_strategy` is set.

**Design strategy controls the approach:**

- `from-scratch` — new app, no existing design to preserve
- `copy-site` — replicate an existing site/app as faithfully as possible
- `improve-site` — use an existing design as the base, then elevate it
- `brand-first` — build from a brand guide, Figma system, or locked visual identity
- `beat-competitors` — audit competitor references and design to stand out

**Mobile design considerations (always apply):**

- Design for touch targets (minimum 44×44pt)
- Bottom tab navigation or drawer navigation — choose based on section count
- Safe area insets (notch, home indicator) must be handled
- Gestures (swipe back, pull-to-refresh) should feel native
- iOS and Android platform conventions where they differ

**`words`** — user described the look in text:
Read [`agents/pencil-design.md`](../pencil-design.md). Use `ui_source_ref` as the creative brief. Produce the full design package:

- First create 2–3 home screen direction previews in Pencil (mobile viewport: 390×844)
- Save them as real preview artifacts:
  - `output/<slug>/designs/homescreen-directions.pen`
  - `output/<slug>/designs/homescreen-option-a.png`
  - `output/<slug>/designs/homescreen-option-b.png`
  - `output/<slug>/designs/homescreen-option-c.png` (when a third option exists)
- Show those previews to the user and get a choice
- Only after the user selects one option, expand that chosen direction into:
  - `output/<slug>/designs/design.pen`
  - `output/<slug>/designs/design.png`
  - `output/<slug>/design-tokens.json`
  - `output/<slug>/ui-libraries.json`
  - `output/<slug>/HANDOFF.md`
- After the full screen design is ready, ask exactly: `do you wanna edit design before build frontend?`
- Apply requested edits and repeat until the user explicitly approves

**`pencil`**, **`screenshot`**, **`website`** — same flow as web version but:

- All previews use mobile viewport (390×844)
- Extract mobile-specific patterns (bottom nav, cards, modals)

### Step 4 — Generate code

**Hard Gate:** Do not enter Step 4 until Step 3.5 is fully complete.

**CRITICAL: Read these files IN ORDER before writing code:**

1. `agents/ecommerce/generate.md` — table of contents, design agnosticism rules, build checklist
2. `agents/ecommerce/generate-setup.md` — dependencies, utils, constants, env, app.config.ts
3. `agents/ecommerce/generate-types.md` — TypeScript interfaces
4. `agents/ecommerce/generate-i18n.md` — i18n routing, locale config, messages JSON
5. `agents/ecommerce/generate-core.md` — Apollo Client, Jotai stores, app layouts
6. `agents/ecommerce/generate-graphql.md` — GraphQL file map (do NOT recreate starter files)
7. `agents/ecommerce/generate-hooks.md` — auth, order, payment, query hooks
8. `agents/ecommerce/generate-components.md` — layout + product components (React Native)
9. `agents/ecommerce/generate-screens.md` — home, products, **login**, **register**, **profile**, **orders**, **wishlist**, cart
10. `agents/ecommerce/generate-checkout.md` — **checkout** + **verify** screens
11. `agents/ecommerce/generate-cms.md` — review system, CMS screens (about, blog) — read when `has_cms` is true
12. `agents/ecommerce/conventions.md` — ecommerce conventions (auth tokens, Apollo headers, Jotai stores, payment flow)
13. `agents/conventions.md` — generic conventions (React Native patterns)
14. `agents/frontend.md` — frontend architecture, token system, build phases
15. `agents/animations.md` — animation libraries (if motion level > 0)
16. `agents/ecommerce/reference.md` — GraphQL queries/mutations
17. `agents/ecommerce/payment.md` — payment flow implementation

**Do NOT skip generate-screens.md or generate-checkout.md.** These files define the auth, profile, orders, wishlist, checkout, and verify screens. Skipping them produces a static app without the ecommerce flow.

**Then write files in this order:**

1. Dependencies install
2. Types (`types/`)
3. Apollo client + provider
4. Jotai store (`store/`)
5. GraphQL (`graphql/`)
6. Root layout: `app/_layout.tsx` + Providers
7. Tab/Stack navigation: `app/(tabs)/_layout.tsx` or drawer layout
8. Auth screens: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`
9. Ecommerce screens: `app/(tabs)/index.tsx` (home), `app/(tabs)/products/index.tsx`, `app/(tabs)/products/[id].tsx`, `app/cart.tsx`
10. Profile + account screens: `app/(tabs)/profile/index.tsx`, `app/orders/index.tsx`, `app/orders/[id].tsx`, `app/wishlist.tsx`
11. Checkout + payment: `app/checkout.tsx`, `app/verify.tsx`
12. CMS screens: `app/about.tsx`, `app/contact.tsx`, `app/blog/index.tsx`, `app/faq.tsx` — only sections listed in `cms_sections`
13. Navigation components: `components/layout/TabBar.tsx`, `components/layout/Header.tsx`
14. `.env.local`

**React Native component rules:**

- Use `<View>`, `<Text>`, `<ScrollView>`, `<FlatList>`, `<Pressable>` — never HTML elements
- Use `StyleSheet.create()` or NativeWind `className` for styling
- Use `expo-image` for optimized images instead of `<img>`
- Use `expo-router` `<Link>` and `useRouter()` for navigation
- All touch targets minimum 44×44pt
- Handle keyboard avoiding with `KeyboardAvoidingView`

### Step 5 — Seed CMS content

**Skip this step if `has_cms` is false.**

Seed content for every language in `store.config.json`. Use real translated text — no placeholders.

**Generate content JSON files first, then run scripts.**

#### 5a. Screens/Pages (`output/pages.json`)

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

```bash
tsx scripts/erxes-pages.ts output/pages.json
```

#### 5b. Blog posts (`output/posts.json`) — only if `has_blog`

Generate 3 starter posts in each language:

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

Generate two menus — `Main Navigation` (bottom tabs / drawer) and `Footer` — with links appropriate to the store's `cms_sections`:

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

Only include links for screens that exist in `cms_sections`.

```bash
tsx scripts/erxes-menu.ts output/menu.json
```

### Step 6 — Verify

```bash
cd output/<slug> && npx expo export
```

Fix all TypeScript and ESLint errors. Also run:

```bash
npx expo-doctor
```

Build must succeed with 0 errors before deploying.

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
3. Make only the targeted changes
4. Redeploy: `eas build --platform all`
