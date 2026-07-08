# Step 0 — Hotel Setup

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

## Hotel-specific fields (ask ONLY if missing)

14. **PMS Pipeline ID**
    > Render as `text input`
    > "What is your erxes PMS pipeline ID?"
    - erxes admin → **Sales** → open your rooms pipeline → the ID is in the URL
    - Example: `/settings/boards/deals?pipelineId=abc123` → ID is `abc123`
    - Save as `pipeline_id`

15. **Booking stage ID**
    > Render as `text input`
    > "What is the stage ID for new bookings (the first stage in your pipeline)?"
    - erxes admin → open the pipeline → hover over the first stage → copy the stage ID from the URL or settings
    - Save as `booking_stage_id`

16. **Paid stage ID**
    > Render as `text input`
    > "What is the stage ID for confirmed/paid bookings?"
    - This is the stage deals move to after payment is verified
    - Save as `paid_stage_id`

17. **Payment method IDs**
    > Render as `repeatable text input`
    > "What payment method IDs should be offered at checkout? (1 or more)"
    - erxes admin → **Settings** → **Payment** → copy the `_id` of each active payment method
    - Save as `payment_ids` array

18. **Allow guest booking**
    > Render as `single-select`
    > Options: `Yes` / `No`
    > "Can guests book without registering?"
    - `Yes` → `allow_guest: true`
    - `No` → `allow_guest: false` (login required before booking)

19. **CMS sections**
    > Render as `multi-select chip grid (2–3 columns)`
    > Options: `about`, `contact`, `blog`, `faq`
    > "Which CMS content pages do you need?"
    - These become standalone CMS-managed pages (about, contact, blog, faq)
    - Save as `cms_sections` array; use `["none"]` if user skips all

---

## After collecting all answers

Write `hotel.config.json`:

```json
{
  "name": "<lowercase-dashed-name>",
  "language": "<first language>",
  "languages": ["<all languages>"],
  "tone": "<answer>",
  "allow_guest": true,
  "pipeline_id": "<pms pipeline id>",
  "booking_stage_id": "<first stage id>",
  "paid_stage_id": "<paid stage id>",
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
NEXT_PUBLIC_PMS_PIPELINE_ID=<pipeline_id>
NEXT_PUBLIC_BOOKING_STAGE_ID=<booking_stage_id>
NEXT_PUBLIC_PAID_STAGE_ID=<paid_stage_id>
NEXT_PUBLIC_PAYMENT_IDS=<comma-separated payment_ids>
```

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.
