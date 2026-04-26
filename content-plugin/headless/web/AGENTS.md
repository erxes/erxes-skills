# erxes-cms-web — Agent Instructions

You are an AI coding agent building and deploying Next.js websites connected to erxes CMS.
You orchestrate the pipeline below.

---

## Code conventions (follow these in every file you write)

### React / Next.js
- **Prefer Server Components** — every page and component is a Server Component by default
- Only add `"use client"` at the top when you truly need browser APIs or React hooks (`useState`, `useEffect`, event handlers)
- **Page components are `async`** — fetch data directly inside them, do not use `useQuery` in pages
- Use `<Link href="...">` for all internal navigation — never `<a href="...">`
- Use `next/image` `<Image>` for all images — never `<img>`
- Use `next/font` for fonts — never import fonts from a CDN in CSS
- Keep `"use client"` components small and leaf-level — never wrap a whole page in `"use client"`

### Data fetching from erxes
- In **Server Components** (pages): use `getClient().query(...)` directly — no hooks
- In **Client Components** (interactive widgets only): use Apollo `useQuery`
- Always include `context: { fetchOptions: { next: { revalidate: 60 } } }` in every `getClient().query()` call
- Always use `_id` (not `id`) in all GraphQL selections
- **Never send `clientPortalId` in query or mutation variables** — the gateway resolves it from the `x-app-token` header

### Tailwind CSS
- Match `color_hint` from config — use it as the primary color throughout
- Match `tone` from config:
  - `formal` → clean spacing, muted colors, serif-friendly classes
  - `casual` → rounded corners, bright accents, relaxed spacing
  - `modern` → dark backgrounds, sharp edges, bold typography
  - `traditional` → warm tones, conservative layout
  - `playful` → gradients, large rounded, vibrant colors
- Mobile-first — all layouts must be responsive

### TypeScript
- Never use `any` — use proper types or `unknown` with narrowing
- Never use `id` — erxes always returns `_id` (MongoDB ObjectId)

### Styling
- Never hardcode hex colors in components — use CSS variables (`var(--color-accent)`) or Tailwind token classes
- No inline styles — Tailwind classes only

### Content
- Never write lorem ipsum — all placeholder content must be real text in the site's language
- No hardcoded text — all copy comes from erxes CMS or config language

### File structure
- Components in `components/` — one file per component, PascalCase
- Run `pnpm build` (or `next build`) after generating all files — fix all TypeScript and ESLint errors before reporting done

---

## Step 0 — Setup (always run this first)

`site.config.json` does not exist — you must create it by asking the user for every field.
Do not read or assume any values. Ask each question, wait for the answer, then proceed.

### site.config.json fields — ask in this order:

1. **Site name** — "What is the name of the site?"
2. **Site type** — "What type of site? Choose: business / blog / landing / portfolio / ecommerce"
3. **Language** — "What language should the site be in? (mn = Mongolian, en = English, zh, ru, ko, ja)"
4. **Tone** — "What tone? Choose: formal / casual / modern / traditional / playful"
5. **Industry** — "What industry is this site for? (e.g. coffee shop, tech startup, law firm)"
6. **Sections** — "Which sections to include? Available: hero, about, services, blog, contact, gallery, pricing, team, testimonials, faq, menu, portfolio — hero is always included"
7. **Color hint** — "Primary color? (e.g. brown, blue, green) — or press Enter to skip"
8. **Extra notes** — "Any extra requirements or notes? — or press Enter to skip"
9. **erxes endpoint** — "erxes GraphQL endpoint URL?"
10. **erxes app token** — "erxes app token?"
11. **erxes client portal ID** — "erxes client portal ID (erxes_cp_id)?"
12. **erxes CMS ID** — "erxes CMS ID (erxes_cms_id)?"

### .env fields — ask for any that are missing or empty:

13. **GitHub token** — "GitHub personal access token (repo read scope)?"
14. **Starter repo URL** — "erxes-web-starter GitHub repo URL?"
15. **Vercel token** — "Vercel API token?"
16. **Vercel org ID** — "Vercel org/team ID?"

### After collecting all answers:

Write `site.config.json`:
```json
{
  "name": "<answer>",
  "template_type": "<answer>",
  "tone": "<answer>",
  "language": "<answer>",
  "industry": "<answer>",
  "sections": ["hero", ...],
  "erxes_endpoint": "<answer>",
  "erxes_app_token": "<answer>",
  "erxes_cp_id": "<answer>",
  "erxes_cms_id": "<answer>",
  "color_hint": "<answer or null>",
  "extra_notes": "<answer or null>"
}
```

Update `.env` — preserve existing lines, only add/update the fields collected above.

Then tell the user: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.

---

## Pipeline — Building a new site

### 1. Read config
Read `site.config.json`. Key fields:

| Field | Notes |
|---|---|
| `name` | Site display name |
| `template_type` | site type: business / blog / landing / portfolio / ecommerce |
| `language` | mn = Mongolian, en = English, etc. Write ALL content in this language |
| `tone` | formal / casual / modern / traditional / playful |
| `industry` | e.g. "coffee shop" |
| `sections` | sections to build: hero, about, services, blog, contact, gallery, pricing, team, testimonials, faq, menu, portfolio |
| `color_hint` | primary color for Tailwind classes |

Derive:
- `slug` = name lowercased, spaces → hyphens (e.g. "Mongolian Coffee Shop" → "mongolian-coffee-shop")
- `has_blog` = sections includes "blog"
- `has_contact` = sections includes "contact"

---

### 2. Clone starter
```bash
tsx scripts/clone.ts "<site-name>"
```
Clones `erxes-web-starter` into `output/<slug>/`. Skips if already exists.

---

### 3. Read starter files
Read all files in `output/<slug>/` to understand the existing structure:
- `app/` — Next.js App Router pages
- `components/` — existing components
- `lib/apollo/` — Apollo Client setup
- `tailwind.config.*` — Tailwind setup

---

### 3.5 Design direction (optional — skip if user wants to build immediately)

If the user wants a custom visual direction, ask:

```
How much motion do you want on this site?
  [0] NONE    — Static. CSS transitions only.
  [1] SUBTLE  — Fade-ins, hover states, gentle transitions.
  [2] MODERATE — Page transitions, scroll-triggered reveals.
  [3] EXPRESSIVE — Parallax, magnetic elements, custom cursors.
  [4] CINEMATIC — WebGL/canvas, immersive scroll journeys.
```

Then present 3 visual directions derived from `tone` and `color_hint`:

**Preset directions (pick 3 most relevant):**

| Direction | Concept | Libraries |
|---|---|---|
| **Glass Future** | Dark surfaces, translucent panels, blur depth | framer-motion, Lenis |
| **Neon Brutalist** | Raw grid, high-contrast, neon highlights | framer-motion, react-scramble |
| **Editorial Luxury** | Magazine hierarchy, generous whitespace | framer-motion, Lenis |
| **Morphic Soft** | Soft gradients, rounded forms, 3D feel | framer-motion |
| **Data Precision** | Info density as aesthetic, monospace accents | framer-motion |
| **Organic Texture** | Noise textures, natural palettes, handcrafted | framer-motion, Lenis |
| **Mongolian Modern** | Ulzii motifs, Cyrillic-first, traditional palette | framer-motion |
| **Midnight Cinema** | Full dark, film-poster energy, immersive scroll | framer-motion, Lenis, GSAP |
| **Swiss Grid** | Strict grid, typography as hero, no decoration | minimal/none |
| **Aurora Gradient** | Iridescent gradients, mesh backgrounds | framer-motion, Lenis |

After user picks direction, install libraries based on motion level:

```bash
# Always install
pnpm add framer-motion clsx tailwind-merge lucide-react next-themes

# Motion level ≥ 1
pnpm add react-intersection-observer

# Motion level ≥ 2
pnpm add lenis

# Motion level ≥ 3
pnpm add gsap @gsap/react

# Motion level 4
pnpm add three @react-three/fiber @react-three/drei

# shadcn/ui (always)
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button card badge separator input
```

---

### 4. Generate code
Write files directly into `output/<slug>/`.

---

#### 4a. Mock data layer (`lib/mock/`)

Build with placeholder data first so the site can be developed and tested without a live erxes connection. The mock layer and the real GraphQL layer must have **identical export signatures** — swapping one for the other requires no component changes.

**`lib/mock/index.ts`** — stable export interface (never change these signatures):
```typescript
// Placeholder implementations — replaced by lib/graphql/index.ts after CMS is seeded
export { getPages, getPageBySlug } from "./pages";
export { getPosts, getPostBySlug, getFeaturedPost } from "./posts";
export { getCategories } from "./categories";
export { getHeaderMenu, getFooterMenu } from "./menus";
```

All mock functions must return data shaped exactly like the real erxes queries.
All mock content must be real text in the site's language — no lorem ipsum.

After CMS is seeded (Step 5), `lib/graphql/index.ts` is generated with the same exports but backed by real Apollo queries. Components import from `@/lib/data` which re-exports from whichever layer is active.

---

#### 4b. Apollo Client files

**`lib/apollo-client.ts`** — Server-side client:
```typescript
import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_ERXES_ENDPOINT,
      headers: {
        "erxes-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN ?? "",
      },
    }),
  });
});
```

**`lib/apollo-wrapper.tsx`** — Client-side provider:
```typescript
"use client";

import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloNextAppProvider } from "@apollo/client-integration-nextjs";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_ERXES_ENDPOINT,
      headers: {
        "erxes-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN ?? "",
      },
    }),
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
```

---

#### 4c. Layout — Header and Footer

**`components/Header.tsx`**
- Fetches menu items using `GET_HEADER_MENU` query (see GraphQL library below)
- Server Component — use `getClient().query(...)` directly
- Logo/site name on the left, nav links on the right
- Mobile-responsive (hamburger menu as `"use client"` sub-component)
- Use Tailwind CSS matching `tone` and `color_hint`

**`components/Footer.tsx`**
- Fetches footer menu using `GET_FOOTER_MENU`
- Renders site name, nav links, copyright line

**`app/layout.tsx`** — update to include ApolloWrapper, Header and Footer:
```tsx
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="...">
      <body>
        <ApolloWrapper>
          <Header />
          <main>{children}</main>
          <Footer />
        </ApolloWrapper>
      </body>
    </html>
  );
}
```

---

#### 4d. Pages — one per menu item

First, look at the menu items created in erxes (from `tsx scripts/erxes-menu.ts` output or `output/menu.json`).
Generate a Next.js page for **each menu item** based on its `url`:

- Menu item with `url: "/"` → `app/page.tsx` (home)
- Menu item with `url: "/about"` → `app/about/page.tsx`
- Menu item with `url: "/contact"` → `app/contact/page.tsx`
- etc.

Rules:
- Derive the page file path directly from the menu item's `url` field
- Each page imports and renders the matching section component full-width
- Each page fetches its CMS content by passing the page slug (derived from url) to erxes

**Dynamic CMS page** `app/[slug]/page.tsx`:
```typescript
import { getClient } from "@/lib/apollo-client";
import { GET_PAGE_BY_SLUG, GET_PAGES } from "@/lib/graphql/queries/cms";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const { data } = await getClient().query({
    query: GET_PAGES,
    variables: { language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  return (data.cpPages ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const { data } = await getClient().query({
    query: GET_PAGE_BY_SLUG,
    variables: { slug: params.slug, language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  if (!data.cpPageDetail) notFound();

  const page = data.cpPageDetail;
  return (
    <main>
      <div dangerouslySetInnerHTML={{ __html: page.content ?? "" }} />
    </main>
  );
}
```

**Dynamic blog post** `app/blog/[slug]/page.tsx`:
```typescript
import { getClient } from "@/lib/apollo-client";
import { GET_POST_BY_SLUG, GET_POSTS } from "@/lib/graphql/queries/cms";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const { data } = await getClient().query({
    query: GET_POSTS,
    variables: { language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  return (data.cpPosts ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { data } = await getClient().query({
    query: GET_POST_BY_SLUG,
    variables: { slug: params.slug, language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });

  if (!data.cpPostDetail) notFound();

  const post = data.cpPostDetail;
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
    </article>
  );
}
```

---

#### 4e. Section components

**One component per section** in `sections`:
- Path: `components/<SectionName>.tsx` (e.g. `components/Hero.tsx`, `components/About.tsx`)
- Server Components — use `getClient().query()` to fetch content
- Use Tailwind CSS — match `tone` and `color_hint` from config
- Write all UI text in the language from config (mn = Mongolian, en = English, etc.)

---

#### 4f. TypeScript types

**`types/cms.ts`**:
```typescript
export interface Media {
  readonly url: string;
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface Category {
  readonly _id: string;
  readonly name: string;
  readonly code: string;
  readonly description?: string;
  readonly order?: number;
}

export interface Tag {
  readonly _id: string;
  readonly name: string;
  readonly colorCode?: string;
}

export type PostStatus = "published" | "draft" | "archived";

export interface Post {
  readonly _id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly content?: string;
  readonly status: PostStatus;
  readonly publishedDate?: string;
  readonly category?: Category;
  readonly categoryIds?: readonly string[];
  readonly tags?: readonly Tag[];
  readonly tagIds?: readonly string[];
  readonly featuredImage?: Media;
  readonly featured?: boolean;
}

export interface NavItem {
  readonly _id: string;
  readonly label: string;
  readonly url: string;
  readonly order: number;
  readonly target?: string;
}

export interface CmsPage {
  readonly _id: string;
  readonly name: string;
  readonly slug: string;
  readonly content?: string;
  readonly pageItems?: ReadonlyArray<{
    readonly _id: string;
    readonly name: string;
    readonly type: string;
    readonly content?: string;
    readonly order: number;
  }>;
}
```

---

#### 4g. Motion components (when motion level ≥ 1)

**`hooks/useReducedMotion.ts`**:
```typescript
"use client";
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
```

**`components/motion/FadeIn.tsx`** (motion level ≥ 1):
```typescript
"use client";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  once?: boolean;
}

const directionVariants = {
  up:    { hidden: { opacity: 0, y: 24 },  visible: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -16 }, visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 24 },  visible: { opacity: 1, x: 0 } },
  none:  { hidden: { opacity: 0 },          visible: { opacity: 1 } },
} as const;

export function FadeIn({ children, delay = 0, direction = "up", className, once = true }: FadeInProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: once, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={directionVariants[direction]}
      transition={{ duration: prefersReduced ? 0 : 0.4, delay: prefersReduced ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

---

### 4h. GraphQL query library

**`lib/graphql/queries/cms.ts`**:

```typescript
import { gql } from "@apollo/client";

export const GET_PAGES = gql`
  query CpPages($language: String) {
    cpPages(language: $language) {
      _id name slug status content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_PAGE_BY_SLUG = gql`
  query CpPageBySlug($slug: String!, $language: String) {
    cpPageDetail(slug: $slug, language: $language) {
      _id name slug status content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_POSTS = gql`
  query CpPosts($language: String, $categoryId: String, $page: Int, $perPage: Int) {
    cpPosts(language: $language, status: published, categoryId: $categoryId, page: $page, perPage: $perPage) {
      _id title slug excerpt content featured publishedDate categoryIds tagIds
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query CpPostBySlug($slug: String!, $language: String) {
    cpPostDetail(slug: $slug, language: $language) {
      _id title slug content excerpt featured publishedDate categoryIds tagIds
    }
  }
`;

export const GET_CATEGORIES = gql`
  query CpCategories($language: String) {
    cpCategories(language: $language) {
      list { _id name slug description }
    }
  }
`;

export const GET_TAGS = gql`
  query CpTags($language: String) {
    cpCmsTags(language: $language) {
      tags { _id name slug colorCode }
    }
  }
`;

export const GET_HEADER_MENU = gql`
  query CpHeaderMenu($language: String) {
    cpMenus(language: $language, kind: "header") {
      _id label url order target contentType contentTypeId
    }
  }
`;

export const GET_FOOTER_MENU = gql`
  query CpFooterMenu($language: String) {
    cpMenus(language: $language, kind: "footer") {
      _id label url order target
    }
  }
`;
```

> **Note:** Use `cpCmsMenus` if `cpMenus` is not available in the starter — check the starter's existing Apollo setup first.

---

### 5. Seed erxes content

Generate content in the correct **language** and **tone** for the industry.
Write JSON files, then call the scripts.

#### Mutation auth header

All mutations send:
```
POST ${ERXES_ENDPOINT}
Content-Type: application/json
x-app-token: ${ERXES_APP_TOKEN}
```

**Never send `clientPortalId` in mutation variables** — the gateway resolves it from `x-app-token`.

#### Mutation dependency order

```
Step 1  cpContentCreateCMS         → CMS config (if not already created)
Step 2  cpCmsCategoriesAdd         → CATEGORY_IDs
Step 3  cpCmsTagsAdd               → TAG_IDs
Step 4  cpCmsPagesAdd              → PAGE_IDs
Step 5  cpCmsPostsAdd              → POST_IDs
Step 6  cpCmsAddMenu               → MENU_IDs
```

**Pages** — one per section:
```bash
tsx scripts/erxes-pages.ts output/pages.json
```
`output/pages.json`:
```json
[
  {
    "section": "hero",
    "name": "Hero",
    "slug": "hero",
    "description": "Short description",
    "content": "<html content for this section>"
  }
]
```

**Blog posts** — only if `has_blog` is true:
```bash
tsx scripts/erxes-posts.ts output/posts.json
```
`output/posts.json`:
```json
{
  "category": { "name": "Blog", "slug": "blog" },
  "posts": [
    {
      "title": "Post title",
      "slug": "post-slug",
      "excerpt": "1-2 sentence summary",
      "content": "<full HTML post body>"
    }
  ]
}
```
Generate 3 posts.

**Menu** — navigation items matching sections:
```bash
tsx scripts/erxes-menu.ts output/menu.json
```
`output/menu.json`:
```json
[
  { "label": "Home",    "url": "/",        "order": 1 },
  { "label": "About",   "url": "/about",   "order": 2 },
  { "label": "Contact", "url": "/contact", "order": 3 }
]
```
Hero section → url "/". All other sections → url "/<section>".

---

### 6. Verify CMS data

After seeding, run this query to confirm frontend can read everything:

```graphql
query VerifyStaticSiteCMS($language: String) {
  cpPages(language: $language) { _id name slug status }
  cpPosts(language: $language, status: published) { _id title slug categoryIds }
  cpCategories(language: $language) { list { _id name slug } }
  cpCmsTags(language: $language) { tags { _id name slug } }
  header: cpMenus(language: $language, kind: "header") { _id label url order }
  footer: cpMenus(language: $language, kind: "footer") { _id label url order }
}
```

**Pass criteria:**
- `cpPages` returns at least Home and one other page
- `cpPosts` returns at least 2 published posts (if `has_blog`)
- `header` returns at least 2 ordered menu items
- `footer` returns at least 1 menu item

---

### 7. Deploy
```bash
tsx scripts/deploy.ts "<site-name>"
```
Deploys `output/<slug>/` to Vercel. Prints the live URL.

---

## Pipeline — Updating an existing site

When asked to fix a bug or change something:

1. Read `site.config.json` to get the site name and slug
2. Read the relevant files in `output/<slug>/`
3. Make only the targeted changes — write modified files directly
4. Redeploy:
```bash
tsx scripts/deploy.ts "<site-name>"
```

---

## erxes mutations reference

All mutations require the `x-app-token` header. **Do not put `clientPortalId` in variables.**

| Mutation | Input type | Use for |
|---|---|---|
| `cpContentCreateCMS` | `ContentCMSInput` | Create CMS config (run once, returns CMS_ID) |
| `cpCmsPagesAdd` | `PageInput` | CMS pages (one per section) |
| `cpCmsPostsAdd` | `PostInput` | Blog posts |
| `cpCmsCategoriesAdd` | `PostCategoryInput` | Blog categories |
| `cpCmsAddMenu` | `MenuItemInput` | Navigation menu items |
| `cpCmsTagsAdd` | `PostTagInput` | Tags |
| `cpCmsCustomPostTypesAdd` | `CustomPostTypeInput` | Custom types (product, project, job, event) |

### Menu item kinds
- `"header"` — top navigation bar
- `"footer"` — footer links
- `"link"` — standalone link (fallback)

---

## Production readiness checklist

Before marking a site as done:

### CMS Data
- [ ] All sections have a corresponding Page in erxes
- [ ] Blog posts created and categorized (if `has_blog`)
- [ ] Header and footer menu wired in correct order

### Frontend Code
- [ ] `lib/apollo-client.ts` uses `registerApolloClient`
- [ ] `lib/apollo-wrapper.tsx` is `"use client"` and wraps root layout
- [ ] `generateStaticParams` implemented on `[slug]/page.tsx` routes
- [ ] All `getClient().query()` calls include `revalidate` in context
- [ ] `_id` (not `id`) used in all GraphQL selections
- [ ] No hardcoded API URLs — all use `process.env.NEXT_PUBLIC_*`
- [ ] `next build` outputs 0 TypeScript errors

### Environment
- [ ] `NEXT_PUBLIC_ERXES_ENDPOINT`, `NEXT_PUBLIC_ERXES_APP_TOKEN`, `NEXT_PUBLIC_ERXES_CP_ID`, `NEXT_PUBLIC_ERXES_CMS_ID` set in `next.config.mjs`
- [ ] `.env` is in `.gitignore`

---

## Key env vars

| Var | Purpose |
|---|---|
| `ERXES_ENDPOINT` | erxes GraphQL endpoint |
| `ERXES_APP_TOKEN` | Bearer token for erxes API (`x-app-token` header) |
| `ERXES_CP_ID` | clientPortalId — for reference only, not sent in variables |
| `ERXES_CMS_ID` | CMS id |
| `STARTER_REPO_URL` | Private GitHub repo of erxes-web-starter |
| `GITHUB_TOKEN` | GitHub token (repo read scope) for cloning |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `NEXT_PUBLIC_MOTION_LEVEL` | 0–4 — read by Providers.tsx to conditionally mount Lenis/cursor |
| `NEXT_PUBLIC_VISUAL_DIRECTION` | e.g. `glass-future`, `editorial-luxury` — for conditional CSS classes |
| `REVALIDATE_SECRET` | Secret token for ISR on-demand revalidation webhook (`/api/revalidate`) |

---

## File ownership rules

These define which layer creates each file. Never overwrite across boundaries.

| Files | Owner | Rule |
|---|---|---|
| `lib/mock/` | Frontend build | Never modify after creation — connectErxes uses it as a reference |
| `lib/mock/index.ts` export signatures | Frontend build | **Never change** — connectErxes must produce identical signatures in `lib/graphql/` |
| `lib/graphql/` | CMS seeding (Step 5) | Created after mutations succeed; replaces mock at runtime |
| `lib/apollo-client.ts` | CMS seeding | Server Apollo client |
| `lib/apollo-wrapper.tsx` | CMS seeding | Client Apollo provider |
| `components/**` | Frontend build | Never overwritten by CMS seeding |
| `types/cms.ts` | Frontend build | Shared — neither layer modifies after creation |
| `.env` / `next.config.mjs` | Setup / deploy | `next-config-writer.ts` rewrites `next.config.mjs` before every deploy |

---

## Project structure

```
scripts/
  clone.ts          tsx scripts/clone.ts "<site-name>"
  erxes-pages.ts    tsx scripts/erxes-pages.ts output/pages.json
  erxes-posts.ts    tsx scripts/erxes-posts.ts output/posts.json
  erxes-menu.ts     tsx scripts/erxes-menu.ts output/menu.json
  deploy.ts         tsx scripts/deploy.ts "<site-name>"
skills/             mechanical tools (clone, read, write, mutate, deploy)
output/             generated sites appear here
site.config.json    developer fills this in
.env                secrets
```
