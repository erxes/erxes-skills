# erxes-cms-web — Project Context

## What this is
A developer productivity tool that helps junior developers quickly scaffold a
Next.js website connected to erxes CMS by filling in a structured config file.
Not a website builder — a dev tool. The developer fills in site.config.json,
runs `npm start`, and gets a fully generated + deployed website.

## Tech stack
- Node.js + TypeScript (tsx — no compilation step needed)
- Kimi API via OpenAI-compatible SDK (baseURL: https://api.moonshot.ai/v1, model: kimi-k2.5)
- Next.js 16 App Router + Tailwind CSS + Apollo Client (for generated sites)
- Vercel CLI for deployment
- erxes CMS via GraphQL (Apollo Client queries + mutations)
- Pre-built starter: erxes-web-starter (private GitHub repo, cloned per site)

## How it works
Developer creates site.config.json (or answers CLI prompts if missing fields).
The pipeline runs 3 agents in sequence and outputs a live Vercel URL.

## Full pipeline
```
site.config.json or CLI prompts
        ↓
[Agent 1] Prompt understanding → SiteIntent object
        ↓
[Agent 2] Code generation → clones starter, Kimi generates files, mutations sent to erxes
        ↓
[Agent 3] Erxes content → creates pages, populates content, sets up forms in erxes CMS
        ↓
[Agent 4] Deploy → vercel deploy --prod → live URL returned
```

---

## Agents

### ✅ Agent 1 — Prompt understanding
**File:** `agents/prompt-understanding/index.ts`
**Status:** Built
**What it does:**
- Loads site.config.json via config-loader skill
- Falls back to interactive CLI prompts if file missing or fields empty
- Enriches config into SiteIntent (adds slug, has_blog, has_contact, has_ecommerce)
- No Kimi call needed — structured input replaces natural language parsing
**Skills used:**
- config-loader
- (intent-enrichment logic is now inline)

---

### ✅ Agent 2 — Code generation
**File:** `agents/code-generation/index.ts`
**Status:** Built
**What it does:**
- Clones erxes-web-starter from private GitHub into output/{slug}/
- Reads the starter file structure so Kimi knows what already exists
- Kimi pass 1: generates new/modified Next.js files on top of starter
- Writes Kimi's files into the cloned output folder
- Kimi pass 2: generates realistic placeholder content in correct language/tone
- Sends GraphQL mutations to erxes CMS to populate real content records
**Skills used:**
- repo-cloner
- repo-reader
- code-generator (Kimi pass 1)
- file-writer
- content-generator (Kimi pass 2)
- mutation-executor

---

### ✅ Agent 3 — Deploy
**File:** `agents/deploy/index.ts`
**Status:** Built
**What it does:**
- Runs `vercel deploy --prod` on the generated site in output/{slug}/
- Returns the Vercel-generated live URL (e.g. site-name.vercel.app)
- Custom subdomain support planned for later
**Skills used:**
- vercel-deploy

---

### 🔲 Agent 4 — Erxes content (planned)
**File:** `agents/erxes-content/index.ts`
**Status:** Not built yet
**What it does:**
- Receives SiteIntent after code generation
- Creates CMS page structure in erxes matching required_sections
- Populates each page/section with Kimi-generated content in correct language/tone
- Sets up erxes Forms for contact/lead capture sections
- Links all content to the correct erxes_cms_id from SiteIntent
- Returns a content map { section → erxes record ID } used by Apollo Client queries
**Skills needed:**
- page-creator — creates erxes CMS page records per section
- form-builder — creates erxes Forms for contact/lead sections
- content-seeder — calls Kimi to write section-specific content, sends mutations
- content-map-builder — collects all returned _id values into a map for the frontend

---

### 🔲 Agent 5 — UI design (planned)
**File:** `agents/ui-design/index.ts`
**Status:** Not built yet
**What it does:**
- Accepts one of: Figma URL, screenshot/image, existing website URL, or text description
- Extracts design tokens: colors, fonts, spacing, layout structure, component list
- Outputs a unified design spec JSON consumed by the code generation agent
- With this agent, Kimi generates components that match a real design instead of guessing
**Skills needed:**
- figma-parser — calls Figma REST API, extracts frames, colors, typography
- vision-analyzer — uses Kimi vision to read screenshots/images → layout + palette
- website-scraper — fetches URL, parses CSS/HTML → extracts design tokens
- design-spec-builder — normalizes all inputs into one design spec JSON format

---

## Skills

### ✅ config-loader
**File:** `skills/config-loader.ts`
**Status:** Built
Loads site.config.json. Validates all required fields. If any are missing,
opens interactive CLI prompts to collect them. Ensures hero section always included.

### ✅ repo-cloner
**File:** `skills/repo-cloner.ts`
**Status:** Built
Clones erxes-web-starter from private GitHub using GITHUB_TOKEN.
Injects token into HTTPS clone URL. Removes .git after clone (fresh project).
Skips clone if output/{slug}/ already exists.

### ✅ repo-reader
**File:** `skills/repo-reader.ts`
**Status:** Built
Reads all relevant files from the cloned starter (js, ts, tsx, json, css, md).
Skips node_modules, .git, .next, dist. Truncates files >5000 chars to keep
Kimi context manageable. Returns array of { path, content }.

### ✅ code-generator
**File:** `skills/code-generator.ts`
**Status:** Built
Kimi pass 1. Sends SiteIntent + starter file structure to Kimi.
Kimi returns JSON array of { path, content } files to add/modify on top of starter.
One component per section in required_sections. Each component uses Apollo Client
useQuery to fetch data from erxes. Tailwind classes match tone + color_hint.

### ✅ content-generator
**File:** `skills/content-generator.ts`
**Status:** Built
Kimi pass 2. Sends SiteIntent to Kimi.
Kimi generates realistic placeholder content in the correct language (mn/en/etc)
and tone, specific to the industry. Returns JSON array of GraphQL mutation objects
{ type, mutation, variables } ready to send to erxes.

### ✅ file-writer
**File:** `skills/file-writer.ts`
**Status:** Built
Takes the array of { path, content } files from code-generator.
Writes each file into output/{slug}/ creating folders as needed.

### ✅ mutation-executor
**File:** `skills/mutation-executor.ts`
**Status:** Built
Takes GraphQL mutation objects from content-generator.
Sends each mutation to erxes endpoint via fetch with Bearer token auth.
Collects results { type, success, data/error } for each mutation.

### ✅ vercel-deploy
**File:** `skills/vercel-deploy.ts`
**Status:** Built
Runs `vercel deploy --prod --yes` on the generated site directory.
Uses VERCEL_TOKEN and VERCEL_ORG_ID from env.
Parses Vercel CLI output to extract the deployed URL.

### 🔲 figma-parser (planned)
**File:** `skills/figma-parser.ts`
**Status:** Not built yet
Calls Figma REST API with FIGMA_TOKEN.
Extracts frames, component names, color styles, text styles, spacing.
Normalizes into design spec JSON format.

### 🔲 vision-analyzer (planned)
**File:** `skills/vision-analyzer.ts`
**Status:** Not built yet
Takes a screenshot or image file path.
Sends to Kimi vision model.
Extracts layout structure, color palette, font style, section breakdown.
Outputs design spec JSON.

### 🔲 website-scraper (planned)
**File:** `skills/website-scraper.ts`
**Status:** Not built yet
Fetches an existing website URL.
Parses CSS custom properties, font-family, color values, layout patterns.
Outputs design spec JSON.

### 🔲 design-spec-builder (planned)
**File:** `skills/design-spec-builder.ts`
**Status:** Not built yet
Normalizes output from any of the 3 input skills (figma/vision/scraper)
into a single unified design spec format consumed by code-generator.

---

## Shared types
**File:** `types.ts`

```ts
SiteConfig    // what developer fills in via config file or CLI
SiteIntent    // SiteConfig + derived fields (slug, has_blog, has_contact, has_ecommerce)
GeneratedFile // { path, content } — file Kimi generates
ContentMutation // { type, mutation, variables } — erxes GraphQL mutation
MutationResult  // { type, success, data?, error? }
AgentResult<T>  // { success, data?, error? }
```

---

## Environment variables (.env)
```
MOONSHOT_API_KEY        Kimi API key from platform.moonshot.ai
ERXES_GRAPHQL_ENDPOINT  erxes GraphQL endpoint (also in site.config.json per site)
ERXES_API_TOKEN         erxes API token (also in site.config.json per site)
GITHUB_TOKEN            GitHub personal access token (repo read scope)
STARTER_REPO_URL        https://github.com/your-org/erxes-web-starter
VERCEL_TOKEN            Vercel API token
VERCEL_ORG_ID           Vercel team/org ID
```

---

## Folder structure
```
erxes-cms-web/
  index.ts                              ← main entry point, runs full pipeline
  types.ts                              ← shared TypeScript interfaces
  site.config.example.json             ← template for developer to copy
  site.config.json                     ← developer fills this in (gitignored)
  .env.example                         ← env template
  .env                                 ← secrets (gitignored)
  package.json                         ← tsx, openai, dotenv
  tsconfig.json
  agents/
    prompt-understanding/
      index.ts                         ← ✅ built
    code-generation/
      index.ts                         ← ✅ built
    deploy/
      index.ts                         ← ✅ built
    erxes-content/
      index.ts                         ← 🔲 planned
    ui-design/
      index.ts                         ← 🔲 planned
  skills/
    config-loader.ts                   ← ✅ built
    repo-cloner.ts                     ← ✅ built
    repo-reader.ts                     ← ✅ built
    code-generator.ts                  ← ✅ built
    content-generator.ts               ← ✅ built
    file-writer.ts                     ← ✅ built
    mutation-executor.ts               ← ✅ built
    vercel-deploy.ts                   ← ✅ built
    figma-parser.ts                    ← 🔲 planned
    vision-analyzer.ts                 ← 🔲 planned
    website-scraper.ts                 ← 🔲 planned
    design-spec-builder.ts             ← 🔲 planned
  output/                              ← generated sites appear here
```

---

## Current status
- Core pipeline fully built (agents 1, 2, 3 + all supporting skills)
- Not yet tested end to end
- intent-classification.ts can be deleted (no longer used — replaced by config-loader)
- Erxes content agent (agent 4) is the next thing to build
- UI design agent (agent 5) is after that

## How to run
```bash
cp site.config.example.json site.config.json
# fill in site.config.json
npm install
npm start
```
