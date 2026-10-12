# Step 0 — Hotel Setup

Run this after generic setup (`agents/setup.md`) is complete. Only ask fields that are missing.

## Fields already collected by generic setup (agents/setup.md)

These should already exist in `hotel.config.json`. Do NOT re-ask if they exist:

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

**Two files — never mixed. `hotel.config.json` holds non-secret config only; `.env.local` holds every secret plus the derived public values.**

Write `hotel.config.json` at the repo root:

```json
{
  "name": "<lowercase-dashed-name>",
  "template_type": "hotel",
  "language": "<first locale>",
  "languages": ["<all locales>"],
  "locales": ["<locale-a>", "<locale-b>"],
  "default_locale": "<locale in locales>",
  "tone": "<answer>",
  "allow_guest": true,
  "features": {
    "auth": true, "company_accounts": false, "activities": false, "dining": false,
    "spaWellness": false, "merch": false, "tours": false, "lodge_stays": false, "fund": false,
    "news": false, "careers": false, "sustainability": false, "offers": false,
    "custom_forms": false, "google_reviews": false, "maps": false, "chat_widget": false,
    "pay_at_property": false, "subscriptions": false, "video_hero": false,
    "animations": true, "pos": false, "kb": false
  },
  "motion_level": 1,
  "main_api_domain": "<https://tenant.next.erxes.io>",
  "main_subs_domain": "<wss://... or null>",
  "saas_domain": "<https://... or null>",
  "branch_id": "<pms branch id>",
  "tms_branch_id": "<bms branch id or null>",
  "client_portal_id": "<cp id>",
  "pipeline_id": "<pms pipeline id>",
  "booking_stage_id": "<first stage id>",
  "request_stage_id": "<stage id or null>",
  "pending_stage_id": "<stage id or null>",
  "paid_stage_id": "<paid stage id>",
  "pay_at_property_stage_id": "<stage id or null>",
  "approved_stage_id": "<stage id or null>",
  "payment_ids": ["<payment-method-id>"],
  "payment_provider": "<or null>",
  "ga_id": "<GA4 id or null>",
  "gtm_id": "<GTM container id or null>",
  "google_place_id": "<place id or null>",
  "category_ids": { "car": "<or null>", "pc": "<or null>", "parent": "<or null>" },
  "primary_color": "<hex/oklch>",
  "fonts": { "heading": "<or null>", "body": "<or null>" },
  "logo": "<path or null>",
  "favicon": "<path or null>",
  "social": { "instagram": "", "facebook": "", "twitter": "", "linkedin": "" },
  "contact": { "email": "", "phone": "", "address": "" },
  "ui_source": "<words|pencil|figma|screenshot|website>",
  "ui_source_ref": "<description | .pen path | figma url | screenshot path | website url>",
  "color_hint": "<answer or null>",
  "design_strategy": "<from-scratch|copy-site|improve-site|brand-first|beat-competitors>",
  "reference_url": "<url or null>",
  "competitor_urls": [],
  "sections": ["<...>"],
  "cms_sections": ["<about|contact|blog|faq>"],
  "required_sections": ["<...>"],
  "extra_notes": "<answer or null>",
  "deploy_target": "<vercel|github>",
  "erxes_endpoint": "<base-url>/gateway/graphql",
  "erxes_cms_id": "<created by cpContentCreateCMS>"
}
```

> **Secrets NEVER go in `hotel.config.json`.** These keys must not appear there: `cp_token`,
> `pms_token`, `erxes_pos_token`, `google_maps_api_key`, and the erxes app token.

Write `output/<slug>/.env.local` (preserve existing lines; only add/update collected fields):

```bash
# --- public (inlined into the client bundle by Next) ---
NEXT_PUBLIC_GRAPHQL_URL=<erxes_endpoint>
NEXT_PUBLIC_ERXES_APP_TOKEN=<cp_token>
NEXT_PUBLIC_CMS_ID=<erxes_cms_id>
NEXT_PUBLIC_CP_ID=<client_portal_id>
NEXT_PUBLIC_PMS_TOKEN=<pms_token>
NEXT_PUBLIC_BRANCH_ID=<branch_id>
NEXT_PUBLIC_TMS_BRANCH_ID=<tms_branch_id>
NEXT_PUBLIC_PMS_PIPELINE_ID=<pipeline_id>
NEXT_PUBLIC_BOOKING_STAGE_ID=<booking_stage_id>
NEXT_PUBLIC_REQUEST_STAGE_ID=<request_stage_id>
NEXT_PUBLIC_PENDING_STAGE_ID=<pending_stage_id>
NEXT_PUBLIC_PAID_STAGE_ID=<paid_stage_id>
NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID=<pay_at_property_stage_id>
NEXT_PUBLIC_APPROVED_STAGE_ID=<approved_stage_id>
NEXT_PUBLIC_PAYMENT_IDS=<comma-separated payment_ids>
NEXT_PUBLIC_SAAS_DOMAIN=<saas_domain>
NEXT_PUBLIC_MAIN_API_DOMAIN=<main_api_domain>
NEXT_PUBLIC_MAIN_SUBS_DOMAIN=<main_subs_domain>
NEXT_PUBLIC_GA_ID=<ga_id>
NEXT_PUBLIC_GTM_ID=<gtm_id>

# --- server-only secrets (never exposed to the client) ---
ERXES_APP_TOKEN=<cp_token>
GOOGLE_MAPS_API_KEY=<google_maps_api_key>
```

> Canonical names are the `AGENTS.md` env matrix — do not introduce aliases. `client_portal_id`
> stays in `hotel.config.json` for CMS creation only; `NEXT_PUBLIC_CP_ID` is derived from it.
> `NEXT_PUBLIC_GRAPHQL_URL` is the gateway URI the starter's Apollo client reads. `design_brief`
> and `source_observation` are **not** collected here — Step 3.5 plans design inputs with
> `agents/pencil-design.md`, then Step 4 Phase 1 (`02-design.md`) implements them.

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.


## Intake questions — one per required field (01-08)

Ask each **required** field exactly once, using the question text given. Conditional fields become
required only when their trigger holds. Secrets are written to `.env.local`; everything else to
`hotel.config.json`. Never guess; never hardcode an example as a value.

### A. Locales (05-i18n)
- `locales` (required) — "Which locales should the site support, in priority order?" → codes; first is primary. **Read from `hotel.config.json`; never hardcoded.**
- `default_locale` (required) — "Which locale is the default?" → must be one of `locales`.
- (`language`/`languages` from generic setup mirror the first/all of `locales`; `locales`/`default_locale` are authoritative for the hotel flow.)

### B. Feature flags (03,04,06,07,08) — single source of defaults
- "Which features should be enabled? (I'll confirm the full list.)" — ask once; store every key under `features.*` (booleans).
- Defaults: auth=true, company_accounts=false, activities=false, dining=false, `spaWellness`=false, merch=false, tours=false, lodge_stays=false, fund=false, news=false, careers=false, sustainability=false, offers=false, custom_forms=false, google_reviews=false, maps=false, chat_widget=false, pay_at_property=false, subscriptions=false, video_hero=false, animations=true, pos=false, kb=false.
- `motion_level` (optional) — "Motion intensity 0–5?" → default 1.

### C. Design (02,08)
- `ui_source` (required) — "How should I get the design?" → words | pencil | figma | screenshot | website.
- `ui_source_ref` (required unless `ui_source` = "words") — "Describe the look / paste the path, Figma URL, screenshot paths, or website URL."
- `design_strategy` (required) — "Design approach?" → from-scratch | copy-site | improve-site | brand-first | beat-competitors.
- `reference_url` (required if `design_strategy` ∈ {copy-site, improve-site}) — "Reference site URL?"
- `competitor_urls` (required if `design_strategy` = beat-competitors) — "Competitor URLs?"

### D. erxes connection (04,06)
- `main_api_domain` (required) — "erxes tenant host?" → e.g. https://your-tenant.next.erxes.io
- `main_subs_domain` (required if `features.subscriptions`) — "GraphQL subscriptions host?" → wss://…
- `saas_domain` (optional) — "erxes SaaS domain?"
- `cp_token` (required, SECRET → `.env.local` `NEXT_PUBLIC_ERXES_APP_TOKEN` + `ERXES_APP_TOKEN`; **not in config**)
- `client_portal_id` (required → config `client_portal_id` and `.env.local` `NEXT_PUBLIC_CP_ID`; the client-portal identifier)
- `pms_token` (required, SECRET → `.env.local` `NEXT_PUBLIC_PMS_TOKEN`; **not in config**)
- `branch_id` (required) — "PMS branch id?"
- `tms_branch_id` (required if `features.tours` or `features.lodge_stays`) — "BMS branch id?"
- `pipeline_id` (required) — "PMS pipeline id?"
- `booking_stage_id` (required) — "New-booking (first) stage id?"
- `request_stage_id` (optional) — "Booking-requested stage id?"
- `pending_stage_id` (optional) — "Pending stage id?"
- `paid_stage_id` (required) — "Paid/confirmed stage id?"
- `pay_at_property_stage_id` (required if `features.pay_at_property`) — "Pay-at-property stage id?"
- `approved_stage_id` (required if activities/dining/spa on) — "Appointment-approved stage id?"
- `payment_ids` (required, array) — "Which payment method ids to offer?"
- `payment_provider` (optional) — "Preferred payment provider?" (QR/`transactions` one-path)
- `erxes_pos_token` (optional, SECRET → `.env.local`; only if `features.pos`)
- `google_maps_api_key` (required if `features.maps` or `features.google_reviews`, SECRET → `.env.local` `GOOGLE_MAPS_API_KEY`; **not in config**)
- `google_place_id` (required if `features.google_reviews`) — "Google Place id?"

### E. Brand (02,03)
- `primary_color` (required) — "Primary brand color (hex or oklch)?" → validate format
- `fonts.heading`, `fonts.body` (optional) — "Heading/body fonts?"
- `logo`, `favicon` (optional) — "Logo/favicon paths?"
- `social` (optional) — "Social links?" → instagram/facebook/twitter/linkedin
- `contact` (optional) — "Contact email / phone / address?"

### F. Analytics & extras
- `ga_id`, `gtm_id` (optional → `.env.local` `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID`) — "GA4 / GTM ids?"
- `category_ids` (optional) — "POS car / PC / parent category ids?"
- `sections`, `cms_sections`, `required_sections` (optional; 07)
- `video_hero_url` (required if `features.video_hero`) — "Hero video URL?"
- per-locale message overrides (optional; 05)
- `seed_content` (optional, default false; Step 5)

Notes: never guess required values; every secret goes to `.env.local` (never committed, never in `hotel.config.json`); `default_locale` must be in `locales`; `locales`/`default_locale` are read from `hotel.config.json` and never hardcoded.
