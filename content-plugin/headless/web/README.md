# erxes CMS — Headless Web

AI-powered scaffolding tool that builds and deploys Next.js websites connected to [erxes](https://erxes.io) headless CMS.

You describe a site. The AI collects config, clones a starter repo, generates a full Next.js frontend, seeds your erxes CMS with pages, posts, and navigation in every language, and deploys to Vercel — all from a single conversation in OpenCode.

---

## How it works

This repo provides the mechanical tools (CLI scripts + utility functions). The AI brain is [OpenCode](https://opencode.ai) running [Kimi K2](https://kimi.ai) as the model.

```
You (in OpenCode chat)
  └── OpenCode reads AGENTS.md — knows the full pipeline
        └── calls scripts via CLI
              ├── tsx scripts/clone.ts          → clones starter repo
              ├── tsx scripts/erxes-cms.ts       → creates CMS, saves CMS ID
              ├── tsx scripts/erxes-pages.ts     → seeds CMS pages (per language)
              ├── tsx scripts/erxes-posts.ts     → seeds blog posts (per language)
              ├── tsx scripts/erxes-menu.ts      → builds navigation (per language)
              └── tsx scripts/deploy.ts          → pushes to GitHub + deploys to Vercel
```

---

## Requirements

- [OpenCode](https://opencode.ai) with Kimi K2 model
- [erxes](https://erxes.io) SaaS account (or self-hosted)
- GitHub personal access token (`repo` scope) — for cloning the starter and pushing generated sites
- Vercel account + API token (optional — can deploy to GitHub only)

---

## Setup

**1. Clone this repo**

```bash
git clone https://github.com/your-org/erxes-skills
cd erxes-skills/content-plugin/headless/web
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Copy the env example**

```bash
cp .env.example .env
```

Fill in `.env`:

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_USERNAME=your_github_username
STARTER_REPO_URL=https://github.com/your-org/erxes-web-starter

VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id

ERXES_ENDPOINT=https://your-tenant.next.erxes.io/gateway/graphql
ERXES_APP_TOKEN=your_erxes_app_token
ERXES_CLIENT_PORTAL_ID=your_client_portal_id
# ERXES_CMS_ID is created automatically on first run
```

**4. Open OpenCode and point it at this folder**

```bash
opencode
```

Set model to **Kimi K2** in OpenCode settings.

---

## How to start

Once inside OpenCode, type:

```
Build a new site
```

OpenCode reads `AGENTS.md` and walks you through setup one question at a time — then builds and deploys everything automatically.

### What OpenCode will ask you

1. **Site name** — lowercase, dashes for spaces (e.g. `my-coffee-shop`)
2. **Site type** — `business` / `ecommerce` / `tour` / `hotel`
3. **Languages** — comma-separated, first is default (e.g. `mn, en`)
4. **Tone** — `formal` / `casual` / `modern` / `traditional` / `playful`
5. **Sections** — comma-separated list, or type `design` to detect from your UI
6. **UI source** — `words` / `pencil` / `figma` / `screenshot` / `website`
7. **Primary color** — only asked if no design is provided (e.g. `forest-green`)
8. **Extra notes** — any additional requirements (optional)
9. **Deploy target** — `vercel` (GitHub + Vercel) or `github` (GitHub only)
10. **erxes SaaS URL** — base URL, e.g. `https://yourname.next.erxes.io`
11. **erxes app token** — from `Settings → Client portal → Create client portal`
12. **Client portal ID** — same place as the app token

### Updating an existing site

```
Fix the hero section — the heading should say "Welcome to [name]"
```

```
Add a pricing section to the existing site
```

OpenCode reads the existing files, makes the targeted change, and redeploys.

---

## Project structure

```
content-plugin/headless/web/
├── AGENTS.md               ← AI pipeline — OpenCode reads this first
├── agents/
│   ├── setup.md            ← setup questions and site.config.json schema
│   ├── conventions.md      ← code rules the AI must follow
│   ├── generate.md         ← code generation guide (i18n, Apollo, SEO, components)
│   ├── reference.md        ← mutations, env vars, file ownership, checklist
│   └── pencil-design.md    ← UI mockup generation with Pencil
├── scripts/                ← CLI tools called by OpenCode
│   ├── clone.ts            → clone starter repo into output/<slug>/
│   ├── erxes-cms.ts        → create CMS record, save returned ID
│   ├── erxes-pages.ts      → seed CMS pages from JSON (run per language)
│   ├── erxes-posts.ts      → seed blog posts from JSON (run per language)
│   ├── erxes-menu.ts       → create header/footer menus (run per language)
│   ├── deploy.ts           → push to GitHub + deploy to Vercel
│   └── github-push.ts      → push to GitHub only
├── lib/                    ← utility functions used by scripts
│   ├── config-loader.ts    → reads site.config.json + env, returns SiteIntent
│   ├── repo-cloner.ts      → git clone of starter repo
│   ├── cms-creator.ts      → cpContentCreateCMS mutation
│   ├── page-creator.ts     → cpCmsPagesAdd mutations (with language)
│   ├── post-seeder.ts      → cpCmsCategoriesAdd + cpCmsPostsAdd (with language)
│   ├── menu-builder.ts     → cpCmsAddMenu mutations (with language + kind)
│   ├── github-pusher.ts    → create private repo + git push
│   ├── vercel-deploy.ts    → vercel deploy --prod
│   └── next-config-writer.ts → injects env vars into next.config.mjs
├── output/                 ← generated sites (gitignored)
├── site.config.example.json
└── .env.example
```

---

## OpenCode + Kimi K2 setup

1. Install OpenCode: [opencode.ai](https://opencode.ai)
2. In OpenCode settings, add a provider:
   - Provider: **Moonshot**
   - API key: get from [platform.moonshot.ai](https://platform.moonshot.ai)
   - Model: `kimi-k2` (or latest available)
3. Open this folder in OpenCode
4. Start chatting — OpenCode picks up `AGENTS.md` automatically

> Kimi K2 is recommended for its long context window and strong TypeScript/Next.js code generation.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` scope — clones starter, pushes generated sites |
| `GITHUB_USERNAME` | Yes | Your GitHub username — generated sites are pushed as private repos here |
| `STARTER_REPO_URL` | Yes | GitHub URL of your `erxes-web-starter` repo |
| `VERCEL_TOKEN` | If deploying to Vercel | Vercel API token |
| `VERCEL_ORG_ID` | If deploying to Vercel | Vercel team/org ID |
| `ERXES_ENDPOINT` | Yes | erxes GraphQL endpoint — your SaaS URL + `/gateway/graphql` |
| `ERXES_APP_TOKEN` | Yes | erxes app token — `Settings → Client portal → Create client portal` |
| `ERXES_CLIENT_PORTAL_ID` | Yes | Client portal ID — used when creating the CMS |
| `ERXES_CMS_ID` | Generated | Created automatically by `cpContentCreateCMS` on first run |
| `ERXES_LANGUAGE` | No | Default language code — `en`, `mn`, etc. (default: `en`) |

---

## License

MIT
