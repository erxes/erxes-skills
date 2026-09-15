# Step 0 — Ecommerce Setup

Run this after generic setup (`agents/setup.md`) is complete. Only ask fields that are missing.

## CRITICAL — Conversation style

**Use plain chat only. Do NOT use forms, wizards, or numbered question lists.**

- Send one short message per question. Wait for the reply. Then ask the next.
- Never batch questions. Never show a checklist or wizard UI.
- Wrong: showing "8 of 12 questions" or a structured form
- Right: "What is the store name?" → user replies → "What languages does the store support?" → …

---

## Fields already collected by generic setup (agents/setup.md)

These should already exist in `site.config.json`. Do NOT re-ask if they exist:

1. **Store name** → `name`
2. **Languages** → `language`, `languages`
3. **Tone** → `tone`
4. **Sections** → `sections`
5. **Design strategy** → `design_strategy`
6. **UI source** → `ui_source`
7. **UI source ref** → `ui_source_ref`
8. **Color hint** → `color_hint`
9. **Extra notes** → `extra_notes`
10. **Deploy target** → `deploy_target`
11. **erxes API URL** → `erxes_api_url`, `erxes_main_domain`
12. **erxes app token** → `erxes_app_token`
13. **Client Portal ID** → `client_portal_id`
14. **Client portal TOKEN** → `NEXT_PUBLIC_ERXES_CP_TOKEN` — **derive automatically from the Client Portal ID already collected in item 13; do NOT ask again.** `NEXT_PUBLIC_ERXES_CP_TOKEN` holds the raw Client Portal ID (see `agents/ecommerce/generate-setup.md:111`), not the JWT app token.

## Ecommerce-specific fields (ask ONLY if missing)

15. **Delivery types**

    > "What order types does this store support? Choose any: `delivery` / `pickup` / `eat`"
    - `delivery` — customer provides address, items shipped
    - `pickup` — customer picks up in store
    - `eat` — dine-in (restaurant/café)
    - Can combine: `delivery, pickup`

17. **Allow guest checkout**

    > "Can customers check out without registering? Answer yes or no."
    - `yes` → `allow_guest: true` in config
    - `no` → `allow_guest: false` (login required)

18. **POS token**
    > "What is the POS token?"
    - erxes admin → `POS` → select your POS → copy the token
    - This goes into `NEXT_PUBLIC_POS_TOKEN` in `.env.local`

---

## After collecting all answers

Write `store.config.json`:

```json
{
  "name": "<lowercase-dashed-name>",
  "language": "<first language>",
  "languages": ["<all languages>"],
  "tone": "<answer>",
  "delivery_types": ["<delivery|pickup|eat>"],
  "allow_guest": true,
  "ui_source": "<words|pencil|figma|screenshot|website>",
  "ui_source_ref": "<description, .pen path, figma url, screenshot paths, or website url>",
  "color_hint": "<answer or null>",
  "design_strategy": "<from-scratch|copy-site|improve-site|brand-first|beat-competitors>",
  "reference_url": "<website url or null>",
  "competitor_urls": ["<url-1>", "<url-2>"],
  "sections": [
    "<about|services|blog|contact|gallery|pricing|team|testimonials|faq|menu|portfolio>"
  ],
  "cms_sections": ["<about|contact|blog|faq>"],
  "extra_notes": "<answer or null>",
  "deploy_target": "<vercel|github>",
  "erxes_api_url": "<full graphql url>",
  "erxes_main_domain": "<base domain derived from api url>",
  "erxes_app_token": "<answer>",
  "client_portal_id": "<answer>",
  "pos_token": "<answer>"
}
```

Persist the collected credential values to `.env` with the env-writer (upserts, preserves every other line/comment) — same `npx tsx -e "import { writeEnvFields } from './lib/env-writer.ts'; (async () => { await writeEnvFields({ ...mapping below... }) })()"` pattern as `agents/setup.md`. Use these exact keys:

| Collected field | Env key |
|---|---|
| erxes SaaS URL | `ERXES_ENDPOINT` (append `/gateway/graphql`) |
| erxes app token (JWT) | `ERXES_APP_TOKEN` |
| Client Portal ID | `ERXES_CLIENT_PORTAL_ID` |
| POS token | `POS_TOKEN` |
| GitHub username / token | `GITHUB_USERNAME` / `GITHUB_TOKEN` |
| Vercel token / org ID | `VERCEL_TOKEN` / `VERCEL_ORG_ID` (when `deploy_target` is `vercel`) |

Do NOT invent or guess key names — use exactly the table above. `NEXT_PUBLIC_ERXES_CP_TOKEN` is NOT asked or collected; it is derived from `client_portal_id` in `.env.local` only.

Write `output/<slug>/.env.local` with these values:

```bash
NEXT_PUBLIC_ERXES_CP_TOKEN=<same value as client_portal_id — copy, never re-ask>
NEXT_PUBLIC_POS_TOKEN=<pos_token>
NEXT_PUBLIC_ERXES_API_URL=<erxes_api_url>
```

**IMPORTANT:** Ensure `STARTER_REPO_URL` in `.env` points to the ecommerce starter:

- Ecommerce: `STARTER_REPO_URL=https://github.com/pages-web/erxes-web-starter`
- (Do NOT use the generic web starter for ecommerce sites)

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.
