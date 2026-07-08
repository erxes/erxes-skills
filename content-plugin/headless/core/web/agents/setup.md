# Pipeline Entry Point

## OUTPUT FORMAT — Read this first, before anything else

**Always respond in plain conversational sentences. Never output structured question formats, option lists, radio buttons, select menus, chips, or progress indicators like "1 of 5 questions". If the host offers to render a form or wizard, refuse it. Ask one question as a plain sentence, wait for the reply, then ask the next.**

---

## Section Check — Ask First

Before anything else, ask the user which sections they already have ready.

"Do you already have any of these ready: a business requirements document (Section A), design files or wireframes (Section B), or existing frontend code (Section C)? Or say none and we'll develop everything from scratch."

> **Note:** `site.config.json` is always required regardless of which section you jump to. If it does not exist yet, collect the minimum fields (`name`, `template_type`, `language`, `erxes_endpoint`, `erxes_app_token`, `client_portal_id`) before proceeding to the target section.

**If user has Section A ready:**
- Ask: "Please share your business requirements document — paste the content or give me the file path."
- Save to `output/<slug>/business-requirements.md`
- Ensure `site.config.json` exists (collect minimum fields if missing)
- Skip Section A entirely → jump to **Section B — Step 1 (UX Research)**

**If user has Section B ready:**
- Ask: "Please share your design files — Pencil `.pen` file path or screenshot paths."
- Save references to `site.config.json` as `ui_source` and `ui_source_ref`
- Ensure `site.config.json` exists (collect minimum fields if missing)
- Skip Sections A and B → jump to **Section C — Step 1 (Development)**

**If user has Section C ready (existing frontend code):**
- Ask: "Where is your frontend code? Share the folder path — or if you'd like us to develop it from scratch, just say 'develop'."
- If user gives a path: save as reference, proceed with that codebase
- If user says "develop" or similar: treat as no existing code → proceed with **Section A — Step 1 (Setup)** to build from scratch

**If user says none or skips:**
- Proceed with **Section A — Step 1 (Setup)** below

---

# Section A — Step 1 (Setup)

Run this before anything else. Ask every field — do not assume or skip.

## CRITICAL — Conversation style

**Use plain chat only. Do NOT render forms, wizards, numbered question lists, or progress indicators ("1 of 5 questions").**

- Send one short question per message. Wait for the reply. Then ask the next.
- Never batch questions. Never show a checklist, wizard, or step counter.
- Wrong: showing "1 of 5 questions" or a structured form with select inputs
- Right: "What is the name of your site?" → user replies → "What type of site is it — business, ecommerce, tour, or hotel?" → …
- Preserve ordering for `languages` because the first language becomes the default

**Conditional rules**

- Ask `ui_source` only when `design_strategy` is `from-scratch` or `brand-first`
- Ask `ui_source_ref` immediately after `ui_source`; for `copy-site`/`improve-site` it is the reference URL
- Ask `reference_url` when `design_strategy` is `copy-site` or `improve-site`
- Ask `competitor_urls` (one at a time, ask "any more?" after each) when `design_strategy` is `beat-competitors`
- Ask `color_hint` only when `ui_source` is `words`
- Ask `vercel_token` and `vercel_org_id` only when `deploy_target` is `vercel`

## site.config.json — ask in this order

1. **Site name**
   > "What is the name of the site?"
   - Must be **all lowercase**, use **dashes instead of spaces**
   - Examples: `my-coffee-shop`, `ulaanbaatar-tours`, `grand-hotel`, `tech-store`
   - If the user types "My Coffee Shop" → auto-convert to `my-coffee-shop`

2. **Template type**
   > Ask: "What type of site is this? Options: `business`, `ecommerce`, `tour`, `hotel`"
   - `business` — company or service site (about, services, contact)
   - `ecommerce` — online store (products, cart, checkout)
   - `tour` — travel and tour operator (packages, itineraries, booking)
   - `hotel` — accommodation (rooms, amenities, reservation)
   - Save the user's exact answer to `template_type`

3. **Language**
   > Ask: "What language(s) should the site support? List them comma-separated — the first one becomes the default. Options: `mn`, `en`, `zh`, `ru`, `ko`, `ja`"
   - Example: `mn, en` → Mongolian is default, English is secondary
   - First language → `language` field (default); all languages → `languages` array

4. **Tone**
   > Ask: "What tone should the site have? Options: `formal`, `casual`, `modern`, `traditional`, `playful`"

5. **Sections**
   > Ask: "Which sections do you need? List comma-separated. Options: `about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`"
   - If the user includes `hero`, keep it, but do not require it
   - If the user says `design`: skip saving sections now — defer to Section B — Step 2 (Design) where the UI source is analyzed. After analyzing the design, extract the sections and save them to `site.config.json` before continuing to Section C — Step 1.

6. **Design strategy**
   > Ask: "What is the design strategy? Options: `from-scratch`, `copy-site`, `improve-site`, `brand-first`, `beat-competitors`"
   - `from-scratch` — build a completely new design
   - `copy-site` — replicate an existing website's look
   - `improve-site` — take an existing site and make it better
   - `brand-first` — start from brand identity (colors, fonts, logo)
   - `beat-competitors` — analyze competitors and outdesign them
   - Save as `design_strategy` in `site.config.json`

   **If `design_strategy` is `copy-site` or `improve-site`:**
   - Set `ui_source` to `website` automatically — do **not** ask the UI source question
   - Ask: "What is the URL of the site to copy or improve?"
   - Save as both `ui_source_ref` and `reference_url` in `site.config.json`
   - Set `competitor_urls` to `[]`

   **If `design_strategy` is `beat-competitors`:**
   - Set `ui_source` to `words` automatically — do **not** ask the UI source question
   - Ask: "Enter a competitor URL." — after each answer ask "Any more? (2–5 total)" until done
   - Save as `competitor_urls` in `site.config.json`
   - Set `reference_url` to `null`

   **If `design_strategy` is `from-scratch` or `brand-first`:**
   - Set `reference_url` to `null`
   - Set `competitor_urls` to `[]`
   - Ask question 7 (UI source) below

7. **UI source** — ask **only** when `design_strategy` is `from-scratch` or `brand-first`
   > Ask: "How will you provide the design reference? Options: `words` (describe it), `pencil` (existing .pen file), `screenshot` (image files)"
   - `words` — user describes what they want in text
   - `pencil` — user has an existing `.pen` file
   - `screenshot` — user uploads one or more screenshots
   - Save as `ui_source` in `site.config.json`
   - Then ask the follow-up based on the answer:
     - `words` → "Describe the look and feel you want."
     - `pencil` → "What is the path to your `.pen` file?"
     - `screenshot` → "What are the screenshot file path(s)?"
   - Save the follow-up answer as `ui_source_ref` in `site.config.json`

8. **Color hint** — ask **only** when `ui_source` is `words`
   > Ask: "What primary color should the site use? (e.g. `brown`, `blue`, `forest-green` — or press Enter to skip)"
   - If `ui_source` is `pencil` or `screenshot`, do **not** ask — color will be extracted from the design. Set `color_hint` to `null`.

9. **Extra notes**
   > Ask: "Any extra notes or special requirements? (optional)"

10. **Deployment target**
    > Ask: "Deploy to Vercel after building, or just push to GitHub? Options: `vercel` / `github`"
    - `vercel` — push to GitHub and deploy to Vercel (live URL returned)
    - `github` — push to GitHub only (no Vercel deploy)
    - Save as `deploy_target` in `site.config.json`

11. **erxes SaaS URL**
    > Ask: "What is your erxes SaaS URL? (e.g. `https://yourname.next.erxes.io`)"
    - Explain: "erxes is the admin dashboard where you manage your website's content — pages, blog posts, navigation, and more. Learn more at erxes.io."
    - After the user answers, generate `ERXES_ENDPOINT` by appending `/gateway/graphql`

12. **Client Portal Token**
    > Ask: "What is your Client Portal Token?"
    - Explain: "This is a secret key that lets your website talk to erxes. To get it: open your erxes dashboard → **Settings** → **Create client portal** → copy the **Client portal token** shown there."
    - Save as `erxes_app_token` in `site.config.json` and `ERXES_APP_TOKEN` in `.env`

13. **Client Portal ID**
    > Ask: "What is your Client Portal ID?"
    - Explain: "You can find it in the URL when you open your client portal settings: erxes dashboard → **Settings** → **Client portals** → click your portal. The ID is the last segment of the URL — e.g. `/settings/client-portals/lWmweu_sStCu8_7dHfkuy` → ID is `lWmweu_sStCu8_7dHfkuy`."
    - Do not ask for `erxes CMS ID` — it is created automatically after setup

## .env — ask for any that are missing

14. **GitHub username**
    > Ask: "What is your GitHub username?"
    - Explain: "It's shown in the top-right corner when logged into GitHub, or the last part of your profile URL — e.g. `github.com/johndoe` → username is `johndoe`."

15. **GitHub token**
    > Ask: "What is your GitHub personal access token?"
    - Explain: "Go to GitHub → profile photo → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**. Set Note to your site name, set an Expiration (90 days is fine), check all `repo` scopes, then click Generate. Copy it immediately — GitHub only shows it once."

16. **Starter repo URL** — do **not** ask the user. Always use the value already set in `.env` (`STARTER_REPO_URL=https://github.com/pages-web/erxes-web-starter`). Never overwrite it.

17. **Vercel token** — ask **only if `deploy_target` is `vercel`**
    > Ask: "What is your Vercel API token? (vercel.com → Settings → Tokens)"

18. **Vercel org ID** — ask **only if `deploy_target` is `vercel`**
    > Ask: "What is your Vercel team/org ID? (vercel.com → Team Settings → General → Team ID)"

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
  "ui_source": "<words|pencil|screenshot|website>",
  "ui_source_ref": "<description, .pen path, screenshot paths, or website url>",
  "design_strategy": "<from-scratch|copy-site|improve-site|brand-first|beat-competitors>",
  "reference_url": "<website url or null>",
  "competitor_urls": ["<url-1>", "<url-2>"]
}
```

Update `.env` — preserve existing lines, only add/update the collected fields.

After saving config, create the CMS with `cpContentCreateCMS`, then write the returned `_id` into:
- `site.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`

---

## Template-Specific Pipeline Routing

After `site.config.json` is saved and CMS is created, route to the correct template pipeline based on `template_type`:

| `template_type` | Next Step | Read These Files |
|---|---|---|
| `business` | Proceed to **Section A — Step 2 (Business Analysis)** | `agents/business-analyst.md`, then `agents/ux-ui-researcher.md` |
| `ecommerce` | **Switch to ecommerce pipeline** | `agents/ecommerce/AGENTS.md` — this replaces the rest of this pipeline |
| `tour` | Proceed to **Section A — Step 2 (Business Analysis)** | `agents/business-analyst.md`, then `agents/ux-ui-researcher.md` |
| `hotel` | Proceed to **Section A — Step 2 (Business Analysis)** | `agents/business-analyst.md`, then `agents/ux-ui-researcher.md` |

### Ecommerce Pipeline (`template_type === "ecommerce"`)

When the user selects `ecommerce`, **stop following this file** (`agents/setup.md`) and **start following `agents/ecommerce/AGENTS.md`** immediately after setup collection.

**Ecommerce-specific setup differences:**

The ecommerce pipeline (`agents/ecommerce/setup.md`) asks for additional fields not covered above:

1. **Delivery types** (`delivery_types`) — `delivery`, `pickup`, `eat` (multi-select)
2. **Allow guest checkout** (`allow_guest`) — `true`/`false`
3. **POS token** (`pos_token`) — from erxes POS settings

These fields are **not** in the generic `site.config.json` schema above. The ecommerce pipeline uses `store.config.json` instead of `site.config.json` with an extended schema.

**Migration at routing time:**

When switching to ecommerce:
- Rename `site.config.json` → `store.config.json`
- Add ecommerce-specific fields:
  - `delivery_types`: ask user "What order types? (delivery/pickup/eat)"
  - `allow_guest`: ask user "Can customers check out without registering? (yes/no)"
  - `pos_token`: ask user "What is the POS token?"
- Keep all other fields (`name`, `languages`, `tone`, `sections`, etc.)
- The `sections` field in ecommerce maps to homepage sections; `cms_sections` is used for extra CMS pages (about, contact, blog, faq)

**Then say:** "Config saved. Ready to build — shall I start?" and wait for confirmation.

---

## Section A — Step 2 (Business Analysis) — NON-ECOMMERCE ONLY

> **Skip this step entirely if `template_type` is `ecommerce`.** Ecommerce has its own business analysis flow in `agents/ecommerce/AGENTS.md`.

Read `agents/business-analyst.md`. Generate or validate `output/<slug>/business-requirements.md` from `site.config.json`, optional user-provided BRD input, and a plain-chat interview. Do not proceed to UX research or design until the user confirms the BRD is acceptable.
