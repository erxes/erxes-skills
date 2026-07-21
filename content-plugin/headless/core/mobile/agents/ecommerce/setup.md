# Step 0 — Ecommerce Setup (Mobile)

Run this after generic setup (`agents/setup.md`) is complete. Only ask fields that are missing.

## CRITICAL — Conversation style

**Use plain chat only. Do NOT use forms, wizards, or numbered question lists.**

- Send one short message per question. Wait for the reply. Then ask the next.
- Never batch questions. Never show a checklist or wizard UI.

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
10. **Deploy target** → `eas`
11. **erxes API URL** → `erxes_api_url`, `erxes_main_domain`
12. **erxes app token** → `erxes_app_token`
13. **Client Portal ID** → `client_portal_id`
14. **Client portal TOKEN** → `EXPO_PUBLIC_ERXES_CP_TOKEN` (in .env)

## Ecommerce-specific fields (ask ONLY if missing)

15. **Delivery types**

    > "What order types does this store support? Choose any: `delivery` / `pickup` / `eat`"
    - `delivery` — customer provides address, items shipped
    - `pickup` — customer picks up in store
    - `eat` — dine-in (restaurant/café)
    - Can combine: `delivery, pickup`

16. **Allow guest checkout**

    > "Can customers check out without registering? Answer yes or no."
    - `yes` → `allow_guest: true`
    - `no` → `allow_guest: false` (login required)

17. **POS token**

    > "What is the POS token?"
    - erxes admin → `POS` → select your POS → copy the token
    - Goes into `EXPO_PUBLIC_POS_TOKEN` in `.env.local`

18. **Messenger brand ID** _(required — every ecommerce app ships with in-app chat)_

    > "What is your erxes Messenger brand ID? (erxes admin → Settings → Brands → copy the Brand ID)"
    - This is the `_id` of the Brand connected to the Messenger widget — a MongoDB ObjectId string (e.g. `64f8a2c1e5b3a90012345678`)
    - Goes into `store.config.json` as `messenger_brand_id`
    - **Do not proceed to Step 3.7 (`connect-messenger.md`) without this value** — if the user doesn't have one yet, tell them to create a Brand in erxes admin first, then return
    - Used as the `x-messenger-brand-id` header shared across Apollo client, Messenger SDK, and notification routing

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
  "deploy_target": "eas",
  "erxes_api_url": "<full graphql url>",
  "erxes_main_domain": "<base domain derived from api url>",
  "erxes_app_token": "<answer>",
  "client_portal_id": "<answer>",
  "pos_token": "<answer>"
}
```

Update `.env` — preserve existing lines, only add/update collected fields.

Write `output/<slug>/.env.local` with these values:

```bash
EXPO_PUBLIC_ERXES_CP_TOKEN=<client_portal_token>
EXPO_PUBLIC_POS_TOKEN=<pos_token>
EXPO_PUBLIC_ERXES_API_URL=<erxes_api_url>
```

**IMPORTANT:** Ensure `STARTER_REPO_URL` in `.env` points to the Expo mobile starter:

```
STARTER_REPO_URL=https://github.com/pages-web/erxes-mobile-starter
```

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.
