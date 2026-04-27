# erxes CMS Web — Agent Instructions

You build and deploy Next.js websites connected to erxes CMS.

Read the files below as you need them. They are split by concern — do not skip them.

| File | Read when |
|---|---|
| [`agents/conventions.md`](agents/conventions.md) | Before writing any code |
| [`agents/setup.md`](agents/setup.md) | At the start of every new site build |
| [`agents/generate.md`](agents/generate.md) | During Step 4 — code generation |
| [`agents/reference.md`](agents/reference.md) | For mutations, env vars, checklist, file ownership |
| [`agents/pencil-design.md`](agents/pencil-design.md) | When creating visual mockups or previews of the site |

---

## Pipeline — Building a new site

### Step 0 — Setup
Read [`agents/setup.md`](agents/setup.md). Collect all config fields, write `site.config.json` and `.env`, create the CMS with `tsx scripts/erxes-cms.ts`, save the returned `_id` into `site.config.json` and `.env` as `ERXES_CMS_ID`, then wait for confirmation.

### Step 1 — Read config
Read `site.config.json`. Derive:
- `slug` = name lowercased, spaces → hyphens
- `has_blog` = sections includes `"blog"`
- `has_contact` = sections includes `"contact"`

### Step 2 — Clone starter
```bash
tsx scripts/clone.ts "<site-name>"
```
Clones `erxes-web-starter` into `output/<slug>/`. Skips if already exists.

### Step 3 — Read starter files
Read `output/<slug>/` — understand `app/`, `components/`, `lib/apollo/`, `tailwind.config.*` before writing anything.

### Step 3.5 — UI design source + direction

Read `ui_source` and `ui_source_ref` from `site.config.json`, then follow the matching path below.

---

**`words`** — user described the look in text
Read [`agents/pencil-design.md`](agents/pencil-design.md). Use `ui_source_ref` as the Pencil prompt to generate a mockup. Save to `output/<slug>/designs/design.pen` and export as `design.png`. Show the image to the user and ask for approval or changes before continuing.

**`pencil`** — user has an existing `.pen` file
Open the file at the path in `ui_source_ref` using the Pencil MCP tools. Read its layout and components as the design reference for Step 4.

**`figma`** — user provided a Figma link or exported assets
Use the Figma URL or image paths in `ui_source_ref` as visual reference. Read the images and extract layout structure, colors, and component hierarchy to guide Step 4.

**`screenshot`** — user uploaded screenshots
Read the image files listed in `ui_source_ref`. Extract layout, sections, colors, and component patterns from the screenshots to guide Step 4.

**`website`** — user provided an existing site URL
Fetch the URL in `ui_source_ref`. Read the HTML structure and styles to extract sections, layout, and visual patterns as design reference for Step 4.

---

**If `required_sections` is empty or `"design"` in `site.config.json`:**
After analyzing the UI source above, identify which sections are present in the design layout. Map them to valid section names (`about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`). Write the detected sections back into `site.config.json` as `required_sections` before continuing to Step 4. Show the detected list to the user and ask for confirmation.

**If `ui_source` is `pencil`, `figma`, `screenshot`, or `website`:**
Extract the dominant primary color from the design and write it back into `site.config.json` as `color_hint` (e.g. `"forest-green"`, `"navy"`, `"warm-orange"`). Do not ask the user for it.

After handling the UI source, ask motion level (0–4) and present 3 visual directions from this table (skip if user wants to build immediately).

| Direction | Concept | Extra libraries |
|---|---|---|
| Glass Future | Dark surfaces, translucent panels | framer-motion, Lenis |
| Neon Brutalist | Raw grid, high-contrast, neon | framer-motion, react-scramble |
| Editorial Luxury | Magazine hierarchy, whitespace | framer-motion, Lenis |
| Morphic Soft | Soft gradients, rounded, 3D feel | framer-motion |
| Data Precision | Info density, monospace accents | framer-motion |
| Organic Texture | Noise textures, natural palette | framer-motion, Lenis |
| Mongolian Modern | Ulzii motifs, Cyrillic-first | framer-motion |
| Midnight Cinema | Full dark, film-poster, immersive | framer-motion, Lenis, GSAP |
| Swiss Grid | Strict grid, typography as hero | minimal |
| Aurora Gradient | Iridescent gradients, mesh bg | framer-motion, Lenis |

Install libraries after direction is chosen:
```bash
pnpm add framer-motion clsx tailwind-merge lucide-react next-themes
pnpm add react-intersection-observer          # motion ≥ 1
pnpm add lenis                                # motion ≥ 2
pnpm add gsap @gsap/react                     # motion ≥ 3
pnpm add three @react-three/fiber @react-three/drei  # motion 4
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button card badge separator input
```

### Step 4 — Generate code
Read [`agents/generate.md`](agents/generate.md). Write all files into `output/<slug>/`.

### Step 5 — Seed erxes content

Seed content for **every language** in `languages` from `site.config.json`. Generate real translated content — not placeholders — for each locale.

Mutation order (always follow this):
```
cpContentCreateCMS → cpCmsCategoriesAdd → cpCmsTagsAdd → cpCmsPagesAdd → cpCmsPostsAdd → cpCmsAddMenu
```

Generate a single content file per type with all languages included using the `translations` field. Run each script **once** — the mutation creates all language versions in a single call.

```bash
tsx scripts/erxes-pages.ts output/pages.json
tsx scripts/erxes-posts.ts output/posts.json   # if has_blog
tsx scripts/erxes-menu.ts  output/menu.json
```

**Content file format** — primary language is the first in `languages`, all others go in `translations`:

```json
// pages.json
[
  {
    "section": "about",
    "name": "Бидний тухай",
    "slug": "about",
    "description": "...",
    "content": "...",
    "translations": [
      { "language": "en", "title": "About Us", "content": "..." }
    ]
  }
]

// posts.json
[
  {
    "title": "Монгол гарчиг",
    "slug": "post-slug",
    "excerpt": "...",
    "content": "...",
    "translations": [
      { "language": "en", "title": "English Title", "excerpt": "...", "content": "..." }
    ]
  }
]

// menu.json — `kind` is required on every item
[
  { "label": "Нүүр", "url": "/", "order": 1, "kind": "header",
    "translations": [{ "language": "en", "title": "Home" }] },
  { "label": "Бидний тухай", "url": "/about", "order": 2, "kind": "header",
    "translations": [{ "language": "en", "title": "About" }] },
  { "label": "Нүүр", "url": "/", "order": 1, "kind": "footer",
    "translations": [{ "language": "en", "title": "Home" }] }
]
```

**Content rules:**
- Primary content (`name`/`title`/`content`) — write in the default language (first in `languages`)
- `translations` array — one entry per additional language with translated text
- Slugs: **identical across all languages** — `about` stays `about` so `/mn/about` and `/en/about` map to the same page
- Menu items **must include `"kind"`** — `"header"` or `"footer"`. Items without `kind` won't appear in navigation queries.
- `erxes-cms.ts` runs once only — the CMS itself is shared across all languages

### Step 6 — Verify CMS data

Run the verify query for each language in `languages`. All must pass before deploying.

```graphql
query Verify($language: String) {
  cpPages(language: $language)                         { _id name slug status }
  cpPosts(language: $language, status: published)      { _id title slug }
  header: cpMenus(language: $language, kind: "header") { _id label url order }
  footer: cpMenus(language: $language, kind: "footer") { _id label url order }
}
```
Pass per language: pages exist, posts exist (if `has_blog`), header has ≥ 2 items, footer has ≥ 1 item.

### Step 7 — Deploy

Read `deploy_target` from `site.config.json`.

**If `deploy_target` is `vercel`:**
```bash
tsx scripts/deploy.ts "<site-name>"
```
Pushes `output/<slug>/` as a new git repo to **`pages-web/<slug>`** (the `pages-web` GitHub org), then deploys to Vercel. Prints the live URL.

**If `deploy_target` is `github`:**
```bash
tsx scripts/github-push.ts "<site-name>"
```
Pushes `output/<slug>/` as a new git repo to **`GITHUB_USERNAME/<slug>`** (the user's personal account). Prints the repo URL. Does not deploy to Vercel.

---

## Pipeline — Updating an existing site

1. Read `site.config.json` — get site name and slug
2. Read the relevant files in `output/<slug>/`
3. Make only the targeted changes
4. Redeploy: `tsx scripts/deploy.ts "<site-name>"`
