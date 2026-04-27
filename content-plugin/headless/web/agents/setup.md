# Step 0 — Setup

Run this before anything else. Ask every field — do not assume or skip.

Question flow rules:
- Ask exactly **one question at a time**
- Wait for the user's answer before asking the next question
- Do **not** show the full checklist or all questions in a single message
- Do **not** render the setup as one large list of answer options
- Prefer short plain-text prompts over long selectable cards
- For free-text fields, use a normal text input prompt, not a radio/select UI
- Keep each prompt compact so OpenCode Desktop always shows the input and submit button

## site.config.json — ask in this order

1. **Site name**
   > "What is the name of the site?"
   - Must be **all lowercase**, use **dashes instead of spaces**
   - Examples: `my-coffee-shop`, `ulaanbaatar-tours`, `grand-hotel`, `tech-store`
   - If the user types "My Coffee Shop" → auto-convert to `my-coffee-shop`

2. **Template type**
   > "What type of site? Choose: `business` / `ecommerce` / `tour` / `hotel`"
   - `business` — company or service site (about, services, contact)
   - `ecommerce` — online store (products, cart, checkout)
   - `tour` — travel and tour operator (packages, itineraries, booking)
   - `hotel` — accommodation (rooms, amenities, reservation)

3. **Language**
   > "What languages does this site support? List them in order — the **first one is the default language**. Available: `mn` `en` `zh` `ru` `ko` `ja`"
   - Example: `mn, en` → Mongolian is default, English is secondary
   - Example: `en` → English only
   - First language entered → `language` field (default)
   - All languages entered → `languages` array

4. **Tone**
   > "What tone? Choose: `formal` / `casual` / `modern` / `traditional` / `playful`"

5. **Sections**
   > "Which sections should be included? Type a comma-separated list, or type `design` to detect sections from your UI design. Hero is always included. Example: `about, services, contact`"
   - Valid sections: `about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`
   - If the user includes `hero`, keep it, but do not require it
   - If the user types `design`: skip saving sections now — defer to Step 3.5 where the UI source is analyzed. After analyzing the design, extract the sections present in the layout and save them to `site.config.json` before continuing to Step 4.

6. **UI source**
   > "How do you want the UI designed? Choose: `words` / `pencil` / `figma` / `screenshot` / `website`"
   - `words` — user describes what they want in text; agent generates using Pencil AI guided by that description
   - `pencil` — user has an existing `.pen` file to use as the starting design
   - `figma` — user provides a Figma file link or exported assets
   - `screenshot` — user uploads one or more screenshots as visual reference
   - `website` — agent scrapes an existing website URL as design reference
   - Save as `ui_source` in `site.config.json`
   - Follow up immediately with the source-specific prompt below:
     - `words` → "Describe the look and feel you want."
     - `pencil` → "Path to your `.pen` file?"
     - `figma` → "Figma file URL or paste exported image paths?"
     - `screenshot` → "Drop your screenshot file(s) here."
     - `website` → "What is the URL of the existing website?"
   - Save the follow-up answer as `ui_source_ref` in `site.config.json`

7. **Color hint** — skip this question if `ui_source` is anything other than `words`
   > "Primary color? (e.g. `brown`, `blue`, `forest-green`) — or Enter to skip"
   - If the user provided a design (`pencil`, `figma`, `screenshot`, or `website`), do **not** ask this — the color will be extracted from the design in Step 3.5. Set `color_hint` to `null`.

8. **Extra notes**
   > "Any extra requirements or notes? — or Enter to skip"

9. **Deployment target**
   > "Deploy to Vercel after building, or just push to GitHub? Choose: `vercel` / `github`"
   - `vercel` — push to GitHub and deploy to Vercel (live URL returned)
   - `github` — push to GitHub only (no Vercel deploy)
   - Save as `deploy_target` in `site.config.json`

9. **erxes SaaS URL**
   > "What is the erxes SaaS URL? Type the base URL only. Example: `https://producttest.next.erxes.io`"
   - Ask for a **plain text answer**, not a select or radio input
   - Do not show a `Type your own` option
   - After the user answers, generate `ERXES_ENDPOINT` by appending `/gateway/graphql`
   - Example:
     `https://producttest.next.erxes.io` → `https://producttest.next.erxes.io/gateway/graphql`

10. **erxes app token**
   > "What is the erxes app token?"
   - Instruction: `Settings` → `Client portal` → `Create client portal` → copy the token

11. **Client portal ID**
    > "What is the client portal ID?"
    - Ask for the client portal ID, not the CMS ID
    - Use this when calling `cpContentCreateCMS`
    - Do not ask the user for `erxes CMS ID`
    - After setup, create the CMS automatically and save the returned `_id` as `ERXES_CMS_ID`

## .env — ask for any that are missing

11. **GitHub token**
    - Prompt: "What is your GitHub personal access token with repo access?"
    - Instruction: GitHub → `Settings` → `Developer settings` → `Personal access tokens` → create a token with repo access, then copy it
12. **GitHub username**
    - Prompt: "What is your GitHub username?"
    - Instruction: open GitHub and copy the username shown in your profile menu or profile URL
13. **Starter repo URL** — do **not** ask the user. Always use the value already set in `.env` (`STARTER_REPO_URL=https://github.com/pages-web/erxes-web-starter`). Never overwrite it.
14. **Vercel token** — "Vercel API token?" — **only ask if `deploy_target` is `vercel`**
15. **Vercel org ID** — "Vercel org/team ID?" — **only ask if `deploy_target` is `vercel`**

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
  "ui_source_ref": "<description, .pen path, figma url, screenshot paths, or website url>"
}
```

Update `.env` — preserve existing lines, only add/update the collected fields.

After saving config, create the CMS with `cpContentCreateCMS`, then write the returned `_id` into:
- `site.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.
