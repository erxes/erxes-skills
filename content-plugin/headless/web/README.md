# erxes CMS — Headless Web

AI-powered scaffolding tool that builds and deploys Next.js websites connected to [erxes](https://erxes.io) headless CMS.

You give it a site name, industry, and tone. It clones a starter repo, seeds your erxes CMS with pages, posts, and navigation, generates a full Next.js frontend, and deploys to Vercel — all from a single conversation in OpenCode.

---

## How it works

This repo provides the mechanical tools (CLI scripts + utility functions). The AI brain is [OpenCode](https://opencode.ai) running [Kimi K2](https://kimi.ai) as the model.

```
You (in OpenCode chat)
  └── OpenCode reads AGENTS.md — knows the full pipeline
        └── calls scripts via CLI
              ├── tsx scripts/clone.ts        → clones starter repo
              ├── tsx scripts/erxes-pages.ts  → seeds CMS pages
              ├── tsx scripts/erxes-posts.ts  → seeds blog posts
              ├── tsx scripts/erxes-menu.ts   → builds navigation
              └── tsx scripts/deploy.ts       → deploys to Vercel
```

---

## Requirements

- [OpenCode](https://opencode.ai) with Kimi K2 model
- [erxes](https://erxes.io) SaaS account (or self-hosted)
- GitHub personal access token (to clone the starter repo)
- Vercel account + API token

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
STARTER_REPO_URL=https://github.com/your-org/erxes-web-starter

VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id

ERXES_ENDPOINT=https://your-tenant.next.erxes.io/gateway/graphql
GITHUB_USERNAME=your_github_username
ERXES_APP_TOKEN=your_erxes_app_token
ERXES_CLIENT_PORTAL_ID=your_client_portal_id
ERXES_CMS_ID=created_automatically_by_cpContentCreateCMS
```

**4. Open OpenCode and point it at this folder**

```bash
opencode
```

Set model to **Kimi K2** in OpenCode settings.

---

## Usage

Once inside OpenCode, start the conversation:

```
Build a new site
```

OpenCode reads `AGENTS.md` and walks you through the full setup — it will ask for your site name, industry, tone, language, sections, and erxes credentials, then build and deploy everything automatically.

### What OpenCode will ask you

1. Site name
2. Site type — business / blog / landing / portfolio / ecommerce
3. Language — `mn` Mongolian, `en` English, etc.
4. Tone — formal / casual / modern / traditional / playful
5. Industry — e.g. "coffee shop", "law firm", "tech startup"
6. Sections — hero, about, services, blog, contact, gallery, pricing, team, faq...
7. Primary color hint — e.g. "brown", "blue" (optional)
8. erxes SaaS URL, app token, and client portal ID (if not already in `.env`)

### Updating an existing site

```
Fix the hero section — the heading should say "Welcome to [name]"
```

OpenCode reads the existing site files, makes the targeted change, and redeploys.

---

## Project structure

```
content-plugin/headless/web/
├── AGENTS.md               ← AI instructions — OpenCode reads this
├── scripts/                ← CLI tools called by OpenCode
│   ├── clone.ts            → clone starter repo into output/<slug>/
│   ├── erxes-pages.ts      → seed CMS pages from JSON
│   ├── erxes-posts.ts      → seed blog posts from JSON
│   ├── erxes-menu.ts       → create navigation menu
│   └── deploy.ts           → deploy to Vercel
├── lib/                    ← utility functions used by scripts
│   ├── repo-cloner.ts
│   ├── page-creator.ts
│   ├── post-seeder.ts
│   ├── menu-builder.ts
│   ├── vercel-deploy.ts
│   ├── next-config-writer.ts
│   └── config-loader.ts
├── output/                 ← generated sites (gitignored)
├── .env.example
└── site.config.example.json
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

> Kimi K2 is recommended for this workflow because of its long context window and strong code generation for TypeScript and Next.js.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` scope — clones starter, pushes generated sites |
| `GITHUB_USERNAME` | Yes | Your GitHub username — generated sites pushed as private repos here |
| `STARTER_REPO_URL` | Yes | GitHub URL of your `erxes-web-starter` repo |
| `VERCEL_TOKEN` | Yes | Vercel API token |
| `VERCEL_ORG_ID` | Yes | Vercel team/org ID |
| `ERXES_ENDPOINT` | Yes | erxes GraphQL endpoint URL, usually derived from your SaaS URL by appending `/gateway/graphql` |
| `ERXES_APP_TOKEN` | Yes | erxes app token. Find it in `Settings` → `Client portal` → `Create client portal` |
| `ERXES_CLIENT_PORTAL_ID` | Yes | client portal ID used when creating the CMS |
| `ERXES_CMS_ID` | Generated | created automatically by `cpContentCreateCMS` |
| `ERXES_LANGUAGE` | No | Default language code — `en`, `mn`, etc. (default: `en`) |

---

## License

MIT
