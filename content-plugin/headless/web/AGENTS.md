# erxes CMS Web — Agent Instructions

You build and deploy Next.js websites connected to erxes CMS.

Read the files below as you need them. They are split by concern — do not skip them.

| File | Read when |
|---|---|
| [`agents/conventions.md`](agents/conventions.md) | Before writing any code |
| [`agents/setup.md`](agents/setup.md) | At the start of every new site build |
| [`agents/business-analyst.md`](agents/business-analyst.md) | During Step 0.5 — business analysis and BRD generation |
| [`agents/ux-ui-researcher.md`](agents/ux-ui-researcher.md) | During Step 0.75 — UX/UI research generation |
| [`agents/frontend.md`](agents/frontend.md) | During Step 4 — frontend implementation from approved design |
| [`agents/generate.md`](agents/generate.md) | During Step 4 — code generation |
| [`agents/connect-erxes.md`](agents/connect-erxes.md) | After Step 4 — connect the generated frontend to erxes CMS |
| [`agents/reference.md`](agents/reference.md) | For mutations, env vars, checklist, file ownership |
| [`agents/pencil-design.md`](agents/pencil-design.md) | During Step 3.5 — full design handoff creation with Pencil |

---

## Pipeline — Building a new site

## Hard Gate

Do not generate any design directions, visual concepts, or frontend ideas until Step 0 is complete.

Do not enter Step 3.5 design work until both Step 0.5 and Step 0.75 are complete and user-approved.

Step 0 is complete only when:
- `site.config.json` exists
- `ui_source` is collected
- `ui_source_ref` is collected
- `design_strategy` is collected
- `reference_url` is collected when `design_strategy` is `copy-site` or `improve-site`
- `competitor_urls` is collected when `design_strategy` is `beat-competitors`
- `.env` has the required erxes and deployment values

If any of those are missing:
- stop the design conversation
- return to setup collection
- do not present design directions yet

Step 0.5 is complete only when:
- `output/<slug>/business-requirements.md` exists
- the BRD covers the required sections from `agents/business-analyst.md`
- the user explicitly approved the BRD or gave a direct instruction to proceed

Step 0.75 is complete only when:
- `output/<slug>/ux-research.md` exists
- the UX research covers the required sections from `agents/ux-ui-researcher.md`
- the user explicitly approved the UX research or gave a direct instruction to proceed

Do not enter Step 4 frontend work until Step 3.5 is fully complete.

Step 3.5 is complete only when:
- 2 to 3 homepage-only direction previews were created in Pencil
- each homepage preview includes the full homepage with all selected or detected homepage sections in order
- preview exports were shown to the user
- the user selected one homepage option
- the selected option was expanded into the full Pencil design package
- the full designed pages were ready for user review in the approved Pencil file before frontend build
- the user was asked in free-form if they want any design edits before frontend build
- any requested design edits were applied inside the approved Pencil file path
- the user explicitly approved the final design package for build
- the design artifacts are real Pencil outputs, not placeholders or stub files
- when `ui_source` is `website` and strategy is `copy-site` or `improve-site`, a structured source audit JSON was created
- all Pencil work stayed inside the exact approved `.pen` file path for this site

### Step 0 — Setup
Read [`agents/setup.md`](agents/setup.md). Collect all config fields, write `site.config.json` and `.env`, create the CMS with `tsx scripts/erxes-cms.ts`, save the returned `_id` into `site.config.json` and `.env` as `ERXES_CMS_ID`, then wait for confirmation.

**Ecommerce routing:** If `template_type` is `"ecommerce"`, stop this pipeline immediately after Step 0 setup collection and switch to [`agents/ecommerce/AGENTS.md`](agents/ecommerce/AGENTS.md). Do not continue the generic pipeline steps below.

### Step 0.5 — Business Analysis
Read [`agents/business-analyst.md`](agents/business-analyst.md). Generate or validate `output/<slug>/business-requirements.md` from `site.config.json`, optional user-provided BRD input, and a plain-chat interview. Do not proceed to UX research or design until the user confirms the BRD is acceptable.

### Step 0.75 — UX/UI Research
Read [`agents/ux-ui-researcher.md`](agents/ux-ui-researcher.md). Generate or validate `output/<slug>/ux-research.md` from `output/<slug>/business-requirements.md`, `site.config.json`, optional user-provided UX research, and a plain-chat interview. Do not proceed to Step 3.5 until the user confirms the UX research is acceptable.

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

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `site.config.json`, then follow the matching path below.

Before doing anything in Step 3.5, verify that Step 0 already collected the required setup inputs.
Also verify that Step 0.5 and Step 0.75 are complete and approved.
If `site.config.json` is missing, incomplete, or the strategy-dependent URL fields are missing, go back to setup and collect them first.
If `output/<slug>/business-requirements.md` or `output/<slug>/ux-research.md` is missing or unapproved, go back to those steps first.

Before designing, choose a `design_strategy` for Step 3.5:

- `from-scratch` — new site, no existing design to preserve
- `copy-site` — replicate an existing site as faithfully as possible
- `improve-site` — use an existing site or design as the base, then elevate it
- `brand-first` — build from a brand guide, Figma system, or locked visual identity
- `beat-competitors` — audit competitor references and design to stand out

Apply it like this:

- Ask the `design_strategy` explicitly for every `ui_source` before proceeding
- If `design_strategy` is `copy-site` or `improve-site`, use `reference_url` from config when present
- If `design_strategy` is `beat-competitors`, use `competitor_urls` from config when present
- Then read [`agents/pencil-design.md`](agents/pencil-design.md) and use that strategy to control whether the design should be faithful, improved, brand-led, or differentiated

---

**`words`** — user described the look in text
Read [`agents/pencil-design.md`](agents/pencil-design.md). Use `ui_source_ref` as the creative brief. Produce the full design package:
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
- After the full page design is ready, show it to the user and ask exactly:
- After the full page design is ready in the approved Pencil file, ask exactly:
  `do you wanna edit design before build frontend?`
- Follow with a free-form request for page-specific edits in the user's own words. Do not present preset edit options. The user should answer with the page they want to change and what should change, such as color, section order, spacing, or component treatment.
- Do not require the agent to separately present or re-show the design if the user can review it directly in Pencil
- Apply requested design edits in the same Pencil project, re-export the updated design artifacts when needed, and ask the same free-form design edit question again
- Repeat this edit-review loop until the user explicitly says the design is approved or gives a direct build instruction such as `it's okay`, `looks good`, or `build frontend`
- Then continue

**`pencil`** — user has an existing `.pen` file
Read [`agents/pencil-design.md`](agents/pencil-design.md). Open the file at the path in `ui_source_ref` using the Pencil MCP tools. Use it as the base homepage direction, create full-homepage options in Pencil first, export preview images, show the user the choices, then after approval expand the chosen direction into the full design package listed above.

**`figma`** — user provided a Figma link or exported assets
Read [`agents/pencil-design.md`](agents/pencil-design.md). Use the Figma URL or image paths in `ui_source_ref` as visual reference. Reconstruct full-homepage direction previews in Pencil first, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**`screenshot`** — user uploaded screenshots
Read [`agents/pencil-design.md`](agents/pencil-design.md). Read the image files listed in `ui_source_ref`. Extract layout, sections, colors, and component patterns, rebuild full-homepage direction previews in Pencil first, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**`website`** — user provided an existing site URL
Read [`agents/pencil-design.md`](agents/pencil-design.md). Fetch the URL in `ui_source_ref`. Discover the main navigation, locale variants, and relevant internal pages first. Run:
```bash
pnpm site:audit "<reference-url-or-ui_source_ref>" "output/<slug>/source-audit.json"
```
Use that audit JSON as the source-of-truth inventory for both structure and static content, then turn that into full-homepage direction previews in Pencil, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

---

**If `required_sections` is empty or `"design"` in `site.config.json`:**
After analyzing the UI source above, identify which sections are present in the design layout. Map them to valid section names (`about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`). Write the detected sections back into `site.config.json` as `required_sections` before continuing to Step 4. Show the detected list to the user and ask for confirmation.

Section-to-page rule:
- The homepage should include the selected sections as landing sections
- Every selected section should also become a standalone page/route unless the section is purely decorative
- Use the same section names and slugs consistently across homepage composition, CMS pages, and navigation

**If `ui_source` is `pencil`, `figma`, `screenshot`, or `website`:**
Extract the dominant primary color from the design and write it back into `site.config.json` as `color_hint` (e.g. `"forest-green"`, `"navy"`, `"warm-orange"`). Do not ask the user for it.

After handling the UI source, lock motion level (0–5) and present 3 visual directions from this table before any full design or frontend work. Do not skip this step unless the user already provided both the motion level and the exact chosen direction in the same request.

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
# Important: keep the cloned starter's existing next/react/react-dom versions.
# Do not run create-next-app. Do not upgrade the framework stack. Avoid @latest.
pnpm add framer-motion clsx tailwind-merge lucide-react next-themes
pnpm add react-intersection-observer          # motion ≥ 1
pnpm add lenis                                # motion ≥ 2
pnpm add gsap @gsap/react                     # motion ≥ 3
pnpm add three @react-three/fiber @react-three/drei  # motion 4
# Only initialize shadcn if the starter does not already include it.
# Use a CLI version compatible with the starter's existing React/Next/Tailwind stack, not @latest.
```

### Step 4 — Generate code
Read [`agents/frontend.md`](agents/frontend.md) and [`agents/generate.md`](agents/generate.md). Use `design-tokens.json`, `ui-libraries.json`, and `HANDOFF.md` from Step 3.5. Write all files into `output/<slug>/`.

Before Step 4 starts, verify all of these:
- homepage preview artifacts exist and are real Pencil exports
- each preview represents the full homepage section flow, not a partial hero or cropped concept
- the user already selected one homepage option
- `design.pen` and `design.png` were exported from the approved Pencil design
- `HANDOFF.md` records the approved homepage option and preview files
- the full designed pages were available for user review in the approved Pencil file after expansion from the chosen homepage option
- the user was asked `do you wanna edit design before build frontend?`
- any requested page-level design changes were applied and the final design was explicitly approved
- `source-audit.json` exists when the source was a website being copied or improved
- the Pencil file path used during design matches the approved site path and no unrelated `.pen` project was modified

### Step 5 — Connect frontend to erxes CMS

Read [`agents/connect-erxes.md`](agents/connect-erxes.md) after the frontend project exists in `output/<slug>/`.

Use it in combined mode with this pipeline:

- fingerprint the generated site before mutations or code edits
- reuse `site.config.json`, `HANDOFF.md`, `design-tokens.json`, and `ui-libraries.json`
- reuse `ERXES_CMS_ID` from Step 0 when it already exists, and only create a CMS if it is missing
- merge Apollo, GraphQL, route, and navigation changes into the generated Next.js project without overwriting unrelated frontend code
- install Apollo and GraphQL dependencies required for erxes integration
- generate or update the frontend GraphQL layer, dynamic CMS routes, and shared navigation components
- keep all `getClient().query()` calls on `revalidate`
- run `pnpm build` in `output/<slug>/` before deployment

### Step 6 — Seed erxes content

Seed content for **every language** in `languages` from `site.config.json`. Generate real translated content — not placeholders — for each locale.

Use the approved design handoff and CMS field map from `HANDOFF.md` plus the content-model decisions from [`agents/connect-erxes.md`](agents/connect-erxes.md) to shape page, post, menu, category, tag, and optional custom-type content while keeping mutation dependency order intact.

CMS page model:
- Seed content so homepage sections can be rendered on `/`
- Also create dedicated CMS pages for each selected section slug such as `/about`, `/services`, `/contact`
- Keep the homepage summary content and standalone page content aligned in tone and structure

Mutation order (always follow this):
```
cpContentCreateCMS or reuse existing CMS_ID → cpCmsCustomPostTypesAdd when needed → cpCmsCustomFieldGroupsAdd when needed → cpCmsCategoriesAdd → cpCmsTagsAdd → cpCmsPagesAdd → cpCmsPostsAdd → cpCmsAddTranslation when needed → cpCmsAddMenu
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

### Step 7 — Verify CMS data

Run the verify query from [`agents/connect-erxes.md`](agents/connect-erxes.md) for each language in `languages`. All must pass before deploying. Also require `pnpm build` in `output/<slug>/` to pass.

```graphql
query Verify($language: String) {
  cpPages(language: $language)                         { _id name slug status }
  cpPosts(language: $language, status: published)      { _id title slug }
  header: cpMenus(language: $language, kind: "header") { _id label url order }
  footer: cpMenus(language: $language, kind: "footer") { _id label url order }
}
```
Pass per language: pages exist, posts exist (if `has_blog`), header has ≥ 2 items, footer has ≥ 1 item.

### Step 8 — Deploy

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
