# erxes Ecommerce + CMS — Agent Instructions

You build and deploy Next.js ecommerce storefronts that are fully connected to both erxes POS (products, cart, payment) and erxes CMS (pages, blog, navigation).

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

| File                         | When to Read                           | Purpose                                                                                |
| ---------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| `agents/setup.md`            | Step 0 (if starting fresh)             | Generic setup collection — ask template type, languages, tone, design strategy, etc.   |
| `agents/pencil-design.md`    | Step 3.5                               | Pencil design tool usage, direction previews, design tokens                            |
| `agents/animations.md`       | Step 4 (before writing animation code) | Animation library implementations — GSAP, Framer Motion, Lenis, Three.js, etc.         |
| `agents/frontend.md`         | Step 4 (before code generation)        | Frontend build phases, token system, component architecture, zero-error build protocol |
| `agents/ux-ui-researcher.md` | Step 0.75 (if user wants UX research)  | UX research document generation (optional for ecommerce)                               |
| `agents/conventions.md`      | Before writing ANY code                | Generic code conventions — React/Next.js patterns, data fetching, Tailwind, TypeScript |

### Ecommerce-Specific Files (always read these)

| File                              | When to Read                     | Purpose                                                                                  |
| --------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents/ecommerce/setup.md`       | Step 0                           | Ecommerce-specific fields (delivery_types, allow_guest, pos_token)                       |
| `agents/ecommerce/conventions.md` | Before writing ANY code          | Ecommerce-specific conventions — auth tokens, Apollo headers, Jotai stores, payment flow |
| `agents/ecommerce/generate.md`    | Step 4                           | Ecommerce code generation — types, GraphQL, hooks, components, pages                     |
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

### File Reading Order for Ecommerce

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

## Pipeline — New storefront

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

**Section-to-page rule:**

- The homepage should include the selected sections as landing sections
- Every selected section should also become a standalone page/route unless the section is purely decorative
- Use the same section names and slugs consistently across homepage composition, CMS pages, and navigation

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
- `output/<slug>/.env.local` as both `ERXES_CMS_ID` and `NEXT_PUBLIC_CMS_ID`

### Step 3 — Clone starter

```bash
tsx scripts/clone.ts "<store-name>"
```

Clones starter repo into `output/<slug>/`. Skips if already exists.

**CRITICAL:** Ecommerce uses a different starter than generic business sites.

- Generic sites: `STARTER_REPO_URL=https://github.com/pages-web/erxes-web-starter`
- **Ecommerce sites: `STARTER_REPO_URL=https://github.com/pages-web/erxes-web-starter`** (or your ecommerce starter URL)

Before running `clone.ts`, ensure `.env` has the correct `STARTER_REPO_URL` for ecommerce.

### Step 3.5 — UI design source

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `store.config.json`.

**Hard Gate:** Do not generate any design directions until `store.config.json` exists and `design_strategy` is set.

**Design strategy controls the approach:**

- `from-scratch` — new site, no existing design to preserve
- `copy-site` — replicate an existing site as faithfully as possible
- `improve-site` — use an existing site or design as the base, then elevate it
- `brand-first` — build from a brand guide, Figma system, or locked visual identity
- `beat-competitors` — audit competitor references and design to stand out

**`words`** — user described the look in text
Read [`agents/pencil-design.md`](../pencil-design.md). Use `ui_source_ref` as the creative brief. Produce the full design package:

- First create 2 to 3 homepage-only direction previews in Pencil using the full selected homepage section sequence
- Save them as real preview artifacts:
  - `output/<slug>/designs/homepage-directions.pen`
  - `output/<slug>/designs/homepage-option-a.png`
  - `output/<slug>/designs/homepage-option-b.png`
  - `output/<slug>/designs/homepage-option-c.png` when a third option exists
- Show those previews to the user and get a choice
- Only after the user selects one option, expand that chosen direction into:
  - `output/<slug>/designs/design.pen`
  - `output/<slug>/designs/design.png`
  - `output/<slug>/design-tokens.json`
  - `output/<slug>/ui-libraries.json`
  - `output/<slug>/HANDOFF.md`
- After the full page design is ready in the approved Pencil file, ask exactly: `do you wanna edit design before build frontend?`
- Follow with a free-form request for page-specific edits
- Apply requested edits and repeat until the user explicitly approves

**`pencil`** — existing `.pen` file
Open file at `ui_source_ref` path using Pencil MCP tools. Use it as the base homepage direction, create full-homepage options in Pencil first, export preview images, show the user the choices, then after approval expand the chosen direction into the full design package listed above.

**`figma`** — Figma file or exported assets
Use URL or image paths in `ui_source_ref` as visual reference. Reconstruct full-homepage direction previews in Pencil first, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**`screenshot`** — uploaded screenshots
Read image files in `ui_source_ref`. Extract layout, sections, colors, and component patterns, rebuild full-homepage direction previews in Pencil first, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**`website`** — existing site URL
Fetch URL in `ui_source_ref`. Discover the main navigation, locale variants, and relevant internal pages first. Run:

```bash
pnpm site:audit "<reference-url-or-ui_source_ref>" "output/<slug>/source-audit.json"
```

Use that audit JSON as the source-of-truth inventory for both structure and static content, then turn that into full-homepage direction previews in Pencil, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**For `pencil` / `figma` / `screenshot` / `website`:**
Extract dominant primary color → write to `store.config.json` as `color_hint`. Do not ask user.

**If `design_strategy` is `copy-site` or `improve-site`:**
Use `reference_url` from config when present as the source to copy or improve.

**If `design_strategy` is `beat-competitors`:**
Use `competitor_urls` from config when present as the competitor audit input.

### Step 4 — Generate code

**Hard Gate:** Do not enter Step 4 until Step 3.5 is fully complete.

Step 3.5 is complete only when:

- 2 to 3 homepage-only direction previews were created in Pencil
- each homepage preview includes the full homepage with all selected or detected homepage sections in order
- preview exports were shown to the user
- the user selected one homepage option
- the selected option was expanded into the full Pencil design package
- the full designed pages were ready for user review in the approved Pencil file
- the user was asked `do you wanna edit design before build frontend?`
- any requested design edits were applied
- the user explicitly approved the final design package for build
- `design.pen` and `design.png` were exported from the approved Pencil design
- `HANDOFF.md` records the approved homepage option and preview files

**CRITICAL: Read these files IN ORDER before writing code:**

1. `agents/ecommerce/generate.md` — table of contents, design agnosticism rules, build checklist
2. `agents/ecommerce/generate-setup.md` — dependencies, utils, constants, env, next.config
3. `agents/ecommerce/generate-types.md` — TypeScript interfaces
4. `agents/ecommerce/generate-i18n.md` — i18n routing, middleware, messages JSON
5. `agents/ecommerce/generate-core.md` — Apollo Client, Jotai stores, app layouts
6. `agents/ecommerce/generate-graphql.md` — GraphQL file map (do NOT recreate starter files)
7. `agents/ecommerce/generate-hooks.md` — auth, order, payment, query hooks
8. `agents/ecommerce/generate-components.md` — layout + product components
9. `agents/ecommerce/generate-pages.md` — homepage, products, **login**, **register**, **profile**, **orders**, **wishlist**, cart
10. `agents/ecommerce/generate-checkout.md` — **checkout** + **verify** pages
11. `agents/ecommerce/generate-cms.md` — review system, CMS pages (about, blog) — read when `has_cms` is true
12. `agents/ecommerce/conventions.md` — ecommerce conventions (auth tokens, Apollo headers, Jotai stores, payment flow)
13. `agents/conventions.md` — generic conventions (React/Next.js patterns)
14. `agents/frontend.md` — frontend architecture, token system, build phases
15. `agents/animations.md` — animation libraries (if motion level > 0)
16. `agents/ecommerce/reference.md` — GraphQL queries/mutations
17. `agents/ecommerce/payment.md` — payment flow implementation

**Do NOT skip generate-pages.md or generate-checkout.md.** These files define the auth, profile, orders, wishlist, checkout, and verify pages. Skipping them produces a static site without the ecommerce flow.

**Then write files in this order:**

1. Dependencies install
2. Types (`types/`)
3. Apollo client + provider
4. Jotai store (`store/`)
5. GraphQL (`graphql/`)
6. Root layout + Providers
7. Auth pages: `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
8. Ecommerce pages: `page.tsx` (home), `products/page.tsx`, `products/[id]/page.tsx`, `cart/page.tsx`
9. Profile + account pages: `profile/page.tsx`, `orders/page.tsx`, `orders/[id]/page.tsx`, `wishlist/page.tsx`
10. Checkout + payment: `checkout/page.tsx`, `verify/page.tsx`
11. CMS pages: `about/page.tsx`, `contact/page.tsx`, `blog/page.tsx`, `faq/page.tsx` — only sections listed in `cms_sections`
12. Header + Footer (nav from `cpMenus` via `NEXT_PUBLIC_CMS_ID`)
13. `.env.local`

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

Generate two menus — `Main Navigation` (header) and `Footer` — with links appropriate to the store's `cms_sections`:

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
cd output/<slug> && pnpm build
```

Fix all TypeScript and ESLint errors. Build must succeed with 0 errors before deploying.

### Step 7 — Deploy

Read `deploy_target` from `store.config.json`.

**`vercel`:**

```bash
tsx scripts/deploy.ts "<store-name>"
```

**`github`:**

```bash
tsx scripts/github-push.ts "<store-name>"
```

---

## Pipeline — Updating an existing storefront

1. Read `store.config.json`
2. Read relevant files in `output/<slug>/`
3. Make only the targeted changes
4. Redeploy: `tsx scripts/deploy.ts "<store-name>"`
