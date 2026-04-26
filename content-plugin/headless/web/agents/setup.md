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
   > "Which sections should be included? Type a comma-separated list. Hero is always included, so you do not need to type it. Example: `about, services, contact`"
   - Ask for a **typed answer**, not a long multi-select UI
   - Keep the prompt short so OpenCode Desktop can show the input and submit button
   - Valid sections: `about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`
   - If the user includes `hero`, keep it, but do not require it

6. **Color hint**
   > "Primary color? (e.g. `brown`, `blue`, `forest-green`) — or Enter to skip"

7. **Extra notes**
   > "Any extra requirements or notes? — or Enter to skip"

8. **erxes SaaS URL**
   > "What is the erxes SaaS URL? Type the base URL only. Example: `https://producttest.next.erxes.io`"
   - Ask for a **plain text answer**, not a select or radio input
   - Do not show a `Type your own` option
   - After the user answers, generate `ERXES_ENDPOINT` by appending `/gateway/graphql`
   - Example:
     `https://producttest.next.erxes.io` → `https://producttest.next.erxes.io/gateway/graphql`

9. **erxes app token**
   > "What is the erxes app token?"
   - Instruction: `Settings` → `Client portal` → `Create client portal` → copy the token

10. **Client portal ID**
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
13. **Starter repo URL** — "erxes-web-starter GitHub repo URL?"
14. **Vercel token** — "Vercel API token?"
15. **Vercel org ID** — "Vercel org/team ID?"

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
  "extra_notes": "<answer or null>"
}
```

Update `.env` — preserve existing lines, only add/update the collected fields.

After saving config, create the CMS with `cpContentCreateCMS`, then write the returned `_id` into:
- `site.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`

Then say: **"Config saved. Ready to build — shall I start?"** and wait for confirmation.
