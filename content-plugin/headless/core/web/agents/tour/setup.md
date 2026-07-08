# Step 0 — Tour Setup

Run this after generic setup (`agents/setup.md`) is complete. Only ask fields that are missing.

## Fields already collected by generic setup (agents/setup.md)

These should already exist in `site.config.json`. Do NOT re-ask if they exist:

1. **Site name** → `name`
2. **Languages** → `language`, `languages`
3. **Tone** → `tone`
4. **Sections** → `sections`
5. **Design strategy** → `design_strategy`
6. **UI source** → `ui_source`
7. **UI source ref** → `ui_source_ref`
8. **Color hint** → `color_hint`
9. **Extra notes** → `extra_notes`
10. **Deploy target** → `deploy_target`
11. **erxes API URL** → `erxes_endpoint`
12. **erxes app token** → `erxes_app_token`
13. **Client Portal ID** → `client_portal_id`

## Tour-specific fields (ask ONLY if missing)

14. **Branch ID**
    > Render as `text input`
    > "What is your erxes BMS branch ID?"
    - erxes admin → **BMS** → Settings → Branches → copy the `_id` of your branch
    - All tour queries are scoped to this branch
    - Save as `branch_id`

15. **Payment method IDs**
    > Render as `repeatable text input`
    > "What payment method IDs should be offered at checkout? (1 or more)"
    - erxes admin → **Settings** → **Payment** → copy the `_id` of each active payment method
    - Save as `payment_ids` array

16. **Allow guest booking**
    > Render as `single-select`
    > Options: `Yes` / `No`
    > "Can customers book a tour without registering?"
    - `Yes` → `allow_guest: true`
    - `No` → `allow_guest: false` (login required before booking)

17. **CMS sections**
    > Render as `multi-select chip grid (2–3 columns)`
    > Options: `about`, `contact`, `blog`, `faq`
    > "Which CMS content pages do you need?"
    - These become standalone CMS-managed pages
    - Save as `cms_sections` array; use `["none"]` if user skips all

---

## After collecting all answers

Write `tour.config.json`:

```json
{
  "name": "<lowercase-dashed-name>",
  "language": "<first language>",
  "languages": ["<all languages>"],
  "tone": "<answer>",
  "allow_guest": true,
  "branch_id": "<bms branch id>",
  "payment_ids": ["<payment-method-id>"],
  "ui_source": "<words|pencil|screenshot|website>",
  "ui_source_ref": "<description, .pen path, screenshot paths, or website url>",
  "color_hint": "<answer or null>",
  "design_strategy": "<from-scratch|copy-site|improve-site|brand-first|beat-competitors>",
  "reference_url": "<website url or null>",
  "competitor_urls": [],
  "sections": ["<hero|about|services|blog|contact|gallery|pricing|team|testimonials|faq>"],
  "cms_sections": ["<about|contact|blog|faq>"],
  "extra_notes": "<answer or null>",
  "deploy_target": "<vercel|github>",
  "erxes_endpoint": "<base-url>/gateway/graphql",
  "erxes_app_token": "<answer>",
  "client_portal_id": "<answer>",
  "erxes_cms_id": "<created by cpContentCreateCMS>"
}
```

Update `.env` — preserve existing lines, only add/update collected fields.

Write `output/<slug>/.env.local`:

```bash
NEXT_PUBLIC_ERXES_ENDPOINT=<erxes_endpoint>
NEXT_PUBLIC_ERXES_APP_TOKEN=<erxes_app_token>
NEXT_PUBLIC_CMS_ID=<erxes_cms_id>
NEXT_PUBLIC_BMS_BRANCH_ID=<branch_id>
NEXT_PUBLIC_PAYMENT_IDS=<comma-separated payment_ids>
```

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.
