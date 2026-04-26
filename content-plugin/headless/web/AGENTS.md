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

### Step 3.5 — Design direction (optional)
Skip if the user wants to build immediately. Otherwise ask motion level (0–4) and present 3 visual directions from this table.

If the user wants to preview what a direction will look like before committing, read [`agents/pencil-design.md`](agents/pencil-design.md) and use Pencil to generate a mockup. Save outputs to `output/<slug>/designs/`. Show the exported image to the user and ask if they want to proceed with that direction or try another.

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
Generate content in the correct **language** and **tone** for the site type.

Mutation order (always follow this):
```
cpContentCreateCMS → cpCmsCategoriesAdd → cpCmsTagsAdd → cpCmsPagesAdd → cpCmsPostsAdd → cpCmsAddMenu
```

```bash
tsx scripts/erxes-cms.ts                    # create CMS, save returned _id as ERXES_CMS_ID
tsx scripts/erxes-pages.ts output/pages.json   # one entry per section
tsx scripts/erxes-posts.ts output/posts.json   # if has_blog — generate 3 posts
tsx scripts/erxes-menu.ts  output/menu.json    # hero → "/", others → "/<section>"
```

### Step 6 — Verify CMS data
```graphql
query Verify($language: String) {
  cpPages(language: $language)                         { _id name slug status }
  cpPosts(language: $language, status: published)      { _id title slug }
  header: cpMenus(language: $language, kind: "header") { _id label url order }
  footer: cpMenus(language: $language, kind: "footer") { _id label url order }
}
```
Pass: pages exist, posts exist (if `has_blog`), header has ≥ 2 items, footer has ≥ 1 item.

### Step 7 — Deploy

Read `deploy_target` from `site.config.json`.

**If `deploy_target` is `vercel`:**
```bash
tsx scripts/deploy.ts "<site-name>"
```
Pushes `output/<slug>/` to a private GitHub repo (`GITHUB_USERNAME/site-slug`), then deploys to Vercel. Prints the live URL.

**If `deploy_target` is `github`:**
```bash
tsx scripts/github-push.ts "<site-name>"
```
Pushes `output/<slug>/` to a private GitHub repo only. Prints the repo URL. Does not deploy to Vercel.

---

## Pipeline — Updating an existing site

1. Read `site.config.json` — get site name and slug
2. Read the relevant files in `output/<slug>/`
3. Make only the targeted changes
4. Redeploy: `tsx scripts/deploy.ts "<site-name>"`
