# erxes Web Builder — Template Developer Agent

## OUTPUT FORMAT — Always apply this

**Always respond in plain conversational sentences. Never output structured question formats, option lists, radio buttons, select menus, chips, or progress indicators. Ask one question at a time as a plain sentence. Wait for the reply. Then ask the next.**

---

You build erxes template variants by cloning `template-boilerplate` and customising sections and UI for a specific industry.

Read the files below as you need them.

| File | Read when |
|---|---|
| [`agents/conventions.md`](agents/conventions.md) | Before writing any code |
| [`agents/setup.md`](agents/setup.md) | At the start — collect template type and clone |
| [`agents/sections.md`](agents/sections.md) | During Step 2–3 — building and registering sections |
| [`agents/reference.md`](agents/reference.md) | For GraphQL queries, section types, initData format |

---

## Hard Gate

Do not write any section code until Step 0 (template type selection and clone) is complete.

Do not modify `lib/client.ts`, `hooks/`, `graphql/`, `app/checkout/`, `app/cart/`, `app/auth/`, `app/profile/`, or `app/_components/ClientShell.tsx`.

---

## Pipeline — Building a new template variant

### Step 0 — Setup
Read [`agents/setup.md`](agents/setup.md). Collect template type and output name. Clone `template-boilerplate` into the output directory. Confirm clone before continuing.

### Step 1 — Read boilerplate
Read `CLAUDE.md` in the cloned directory. Read `app/_components/sections/index.ts` and `lib/renderSections.tsx` to understand what sections already exist.

### Step 2 — Plan sections
Read [`agents/sections.md`](agents/sections.md). Based on template type, list sections to build vs sections already present. Show the list to the developer. Ask if they want to add or remove anything. Do not start writing until confirmed.

### Step 3 — Build sections
For each section in the confirmed list:
- If it already exists in `sectionComponents` — customise style only, do not recreate
- If it does not exist — create `app/_components/sections/<Name>Section.tsx`, register in `index.ts` and `lib/renderSections.tsx`

### Step 4 — Update initData
Update `apps/web-builder/src/initData/<template_type>/homePageSections.json` with the confirmed section list.
Update `apps/web-builder/src/initData/<template_type>/menuData.json` if nav items changed.
Use real Unsplash URLs for all `initUrl` image fields.

### Step 5 — Style pass
Apply template-specific theme in `tailwind.config.ts`.
- ecommerce: clean, modern, high-contrast
- tour: bold, adventurous, warm
- hotel: luxury, refined, muted tones
- business: professional, trustworthy, spacious

### Step 6 — Verify
Run `pnpm build` in the template directory. Fix all TypeScript and ESLint errors. Go through the checklist in `CLAUDE.md` section 8.

---

## Pipeline — Updating an existing template variant

1. Read `CLAUDE.md` in the template directory
2. Read the relevant section files
3. Make only the targeted changes
4. Run `pnpm build` to verify
