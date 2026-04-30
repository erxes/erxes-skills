# Step 0 — Setup

Run this before anything else. Ask every field — do not assume or skip.

## CRITICAL — Conversation style

**Use structured option inputs first. Do NOT default to plain chat when the host can render buttons, selects, chips, or text inputs.**

- Preferred UI:
  - buttons or single-select chips for one-choice fields
  - multi-select chips for multi-choice fields
  - text input for custom answers
  - repeatable URL inputs for competitor URLs
- For fields with common known values, show recommended options first and also provide an `Other` input
- Use plain chat only as a fallback when structured inputs are unavailable
- Keep the setup flow step-by-step, but it may be rendered as a form or wizard
- Preserve ordering for `languages` because the first language becomes the default
- Do not force the user to type values that can be selected with options

**Input rules**

- `single-select + other`:
  - `template_type`
  - `tone`
  - `ui_source`
  - `design_strategy`
  - `color_hint`
  - `deploy_target`
- `multi-select + other`:
  - `languages`
  - `sections`
- `text input`:
  - `name`
  - `ui_source_ref`
  - `reference_url`
  - `erxes_saas_url`
  - `client_portal_id`
  - `github_username`
- `password input`:
  - `erxes_app_token`
  - `github_token`
  - `vercel_token`
- `repeatable text input`:
  - `competitor_urls`
- `textarea`:
  - `extra_notes`

**Conditional input rules**

- `ui_source_ref` depends on `ui_source`
- `design_strategy` depends on `ui_source`
- `reference_url` appears when `design_strategy` is `copy-site` or `improve-site`
- `competitor_urls` appears when `design_strategy` is `beat-competitors`
- `color_hint` appears only when `ui_source` is `words`
- `vercel_token` and `vercel_org_id` appear only when `deploy_target` is `vercel`

## site.config.json — ask in this order

1. **Site name**
   > "What is the name of the site?"
   - Must be **all lowercase**, use **dashes instead of spaces**
   - Examples: `my-coffee-shop`, `ulaanbaatar-tours`, `grand-hotel`, `tech-store`
   - If the user types "My Coffee Shop" → auto-convert to `my-coffee-shop`

2. **Template type**
   > Render as `single-select + Other input`
   > Recommended options: `business`, `ecommerce`, `tour`, `hotel`
   - `business` — company or service site (about, services, contact)
   - `ecommerce` — online store (products, cart, checkout)
   - `tour` — travel and tour operator (packages, itineraries, booking)
   - `hotel` — accommodation (rooms, amenities, reservation)
   - Save the user's exact answer to `template_type`

3. **Language**
   > Render as `ordered multi-select + Other input`
   > Recommended options: `mn`, `en`, `zh`, `ru`, `ko`, `ja`
   - Example: `mn, en` → Mongolian is default, English is secondary
   - Example: `en` → English only
   - First language entered → `language` field (default)
   - All languages entered → `languages` array

4. **Tone**
   > Render as `single-select + Other input`
   > Recommended options: `formal`, `casual`, `modern`, `traditional`, `playful`

5. **Sections**
   > Render as `multi-select + Other input`
   > Recommended options: `about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`, `design`
   - Valid sections: `about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`
   - If the user includes `hero`, keep it, but do not require it
   - If the user types `design`: skip saving sections now — defer to Step 3.5 where the UI source is analyzed. After analyzing the design, extract the sections present in the layout and save them to `site.config.json` before continuing to Step 4.

6. **UI source**
   > Render as `single-select`
   > Recommended options: `words`, `pencil`, `figma`, `screenshot`, `website`
   - `words` — user describes what they want in text; agent generates using Pencil AI guided by that description
   - `pencil` — user has an existing `.pen` file to use as the starting design
   - `figma` — user provides a Figma file link or exported assets
   - `screenshot` — user uploads one or more screenshots as visual reference
   - `website` — agent scrapes an existing website URL as design reference
   - Save as `ui_source` in `site.config.json`
   - Then render `ui_source_ref` as a text input with a source-specific placeholder:
     - `words` → "Describe the look and feel you want."
     - `pencil` → "Path to your `.pen` file."
     - `figma` → "Figma file URL or exported image paths."
     - `screenshot` → "Screenshot file path(s)."
     - `website` → "URL of the existing website."
   - Save the follow-up answer as `ui_source_ref` in `site.config.json`

7. **Design strategy**
   - Ask this for **all** `ui_source` values before any design work starts
   - Render as `single-select + Other input`
   - Recommended options: `from-scratch`, `copy-site`, `improve-site`, `brand-first`, `beat-competitors`
   - Save as `design_strategy` in `site.config.json`

   **If `design_strategy` is `copy-site` or `improve-site`:**
   - If `ui_source` is `website`:
     - Reuse `ui_source_ref` as `reference_url` by default
     - Only ask for another URL if the user says the source site to copy/improve is different from `ui_source_ref`
   - If `ui_source` is `pencil`, `figma`, or `screenshot`, ask:
     > Render as `text input`
     > Label: "Source website URL to copy or improve"
   - Save as `reference_url` in `site.config.json`

   **If `design_strategy` is `beat-competitors`:**
   - Render as `repeatable URL inputs`
   - Require `2` to `5` entries
   - Save them as `competitor_urls` array in `site.config.json`

   **If `design_strategy` is `from-scratch` or `brand-first`:**
   - Set `reference_url` to `null`
   - Set `competitor_urls` to `[]`

8. **Color hint** — skip this question if `ui_source` is anything other than `words`
   > Render as `single-select + Other input`
   > Recommended options: `brown`, `blue`, `forest-green`
   - If the user provided a design (`pencil`, `figma`, `screenshot`, or `website`), do **not** ask this — the color will be extracted from the design in Step 3.5. Set `color_hint` to `null`.

9. **Extra notes**
   > Render as `textarea`
   > Optional

10. **Deployment target**
   > Render as `single-select + Other input`
   > Recommended options: `vercel`, `github`
   - `vercel` — push to GitHub and deploy to Vercel (live URL returned)
   - `github` — push to GitHub only (no Vercel deploy)
   - Save as `deploy_target` in `site.config.json`

11. **erxes SaaS URL**
   > Render as `text input`
   > Placeholder: `https://producttest.next.erxes.io`
   - After the user answers, generate `ERXES_ENDPOINT` by appending `/gateway/graphql`
   - Example:
     `https://producttest.next.erxes.io` → `https://producttest.next.erxes.io/gateway/graphql`

12. **erxes app token**
   > Render as `password input`
   - Instruction: `Settings` → `Client portal` → `Create client portal` → copy the token

13. **Client portal ID**
   > Render as `text input`
   - Ask for the client portal ID, not the CMS ID
   - Use this when calling `cpContentCreateCMS`
   - Do not ask the user for `erxes CMS ID`
   - After setup, create the CMS automatically and save the returned `_id` as `ERXES_CMS_ID`

## .env — ask for any that are missing

14. **GitHub token**
    - Render as `password input`
    - Instruction: GitHub → `Settings` → `Developer settings` → `Personal access tokens` → create a token with repo access, then copy it
15. **GitHub username**
    - Render as `text input`
    - Instruction: open GitHub and copy the username shown in your profile menu or profile URL
16. **Starter repo URL** — do **not** ask the user. Always use the value already set in `.env` (`STARTER_REPO_URL=https://github.com/pages-web/erxes-web-starter`). Never overwrite it.
17. **Vercel token** — render as `password input` — **only ask if `deploy_target` is `vercel`**
18. **Vercel org ID** — render as `text input` — **only ask if `deploy_target` is `vercel`**

## After collecting all answers

Write `site.config.json`:
```json
{
  "name": "<lowercase-dashed-name>",
  "template_type": "<business|ecommerce|tour|hotel>",
  "tone": "<answer>",
  "language": "<first language entered>",
  "languages": ["<all languages entered>"],
  "sections": ["hero", "..."],
  "client_portal_id": "<answer>",
  "erxes_endpoint": "<base-url>/gateway/graphql",
  "erxes_app_token": "<answer>",
  "erxes_cms_id": "<created by cpContentCreateCMS>",
  "color_hint": "<answer or null>",
  "extra_notes": "<answer or null>",
  "deploy_target": "<vercel|github>",
  "ui_source": "<words|pencil|figma|screenshot|website>",
  "ui_source_ref": "<description, .pen path, figma url, screenshot paths, or website url>",
  "design_strategy": "<from-scratch|copy-site|improve-site|brand-first|beat-competitors>",
  "reference_url": "<website url or null>",
  "competitor_urls": ["<url-1>", "<url-2>"]
}
```

Update `.env` — preserve existing lines, only add/update the collected fields.

After saving config, create the CMS with `cpContentCreateCMS`, then write the returned `_id` into:
- `site.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.
