# Section B — Step 2 (Design System + Pencil Handoff)

Use this file for **all UI design work** before Section C development.

This stage does not write frontend code. It creates the approved visual system and the exact handoff files that `agents/frontend.md` expects.

---

## Role

You are the design-stage agent for erxes CMS websites.

- Design first, code later
- Animation is part of the design, not a last-minute add-on
- Always produce a usable handoff for frontend and CMS seeding
- Keep the existing project pipeline intact: `design -> frontend -> connect erxes SaaS -> seed CMS`

Do not start design exploration if setup is incomplete.

---

## Inputs

Read `site.config.json` and use:

- `name`
- `template_type`
- `tone`
- `language`
- `languages`
- `sections`
- `ui_source`
- `ui_source_ref`
- `design_strategy`
- `reference_url`
- `competitor_urls`
- `color_hint`
- `extra_notes`

Also read the starter structure in `output/<slug>/` before designing so the handoff fits the real frontend target.

If any required input is missing, stop and send the flow back to setup instead of guessing.

Required before design starts:

- `site.config.json` exists
- `ui_source` exists
- `ui_source_ref` exists
- `design_strategy` exists
- `reference_url` exists when strategy is `copy-site` or `improve-site`
- `competitor_urls` has at least 2 URLs when strategy is `beat-competitors`

Do not present 3 design directions before those values exist.

---

## Pencil Path Discipline

Use exactly one approved Pencil project path for the current site.

Allowed path rules:

- If `ui_source` is `pencil`, the only source `.pen` file you may open is the exact path from `ui_source_ref`
- If `ui_source` is not `pencil`, create and use Pencil files only under `output/<slug>/designs/`
- Preview work must stay in `output/<slug>/designs/homepage-directions.pen`
- Final approved design must stay in `output/<slug>/designs/design.pen`

Do not:

- open a different existing `.pen` project because it looks related
- reuse another site's `.pen` file
- browse around multiple local `.pen` files and choose one yourself
- modify any `.pen` file outside the approved current-site path
- save the current site's design into some previously existing unrelated Pencil project

If the given `.pen` path is missing or invalid:

- stop
- report that the exact provided path could not be opened
- ask for a corrected path instead of switching to another `.pen` file

---

## Output Contract

Before full-site approval, create these homepage preview artifacts:

- `output/<slug>/designs/homepage-directions.pen`
- `output/<slug>/designs/homepage-option-a.png`
- `output/<slug>/designs/homepage-option-b.png`
- `output/<slug>/designs/homepage-option-c.png` when a third option exists

When `ui_source` is `website` and strategy is `copy-site` or `improve-site`, also create:

- `output/<slug>/source-audit.json`

Write these full handoff files only after the user selects one homepage option and the final full-page design review is approved:

- `output/<slug>/designs/design.pen`
- `output/<slug>/designs/design.png`
- `output/<slug>/design-tokens.json`
- `output/<slug>/ui-libraries.json`
- `output/<slug>/HANDOFF.md`

These files are required. Section C — Step 1 (Development) should not start without them and without explicit post-design approval.

Invalid output examples:

- a placeholder `design.png`
- a copied JSON file renamed to `.png`
- a blank or near-blank canvas export used as approval evidence
- tokens and handoff files created before the homepage option is approved
- design work saved into the wrong `.pen` project path

---

## Pipeline Position

This is Step 1 of the design-to-build flow:

1. Design in Pencil and define the visual system
2. Frontend agent reads the handoff and builds Next.js
3. Existing CMS scripts connect erxes SaaS and seed pages, posts, and menus

Do not change the main build logic in later steps. Your job is to make those steps more accurate.

---

## Supported UI Sources

### `words`

Use `ui_source_ref` as the creative brief. Generate the design direction from the written description.

### `pencil`

Open the provided `.pen` file from `ui_source_ref`. Use it as the primary layout and component reference. Improve structure only where needed for production readiness. Save the approved working copy to `output/<slug>/designs/design.pen`.

Path rule for `pencil`:

- open only the exact `.pen` path from `ui_source_ref`
- if preview variations are needed, derive them from that exact file or save them into `output/<slug>/designs/homepage-directions.pen`
- do not switch to another `.pen` project unless the user explicitly replaces `ui_source_ref`

### `figma`

Use the Figma link or exported assets in `ui_source_ref` as the visual source. Reconstruct the structure in Pencil and preserve the core visual language.

### `screenshot`

Extract layout, sections, spacing, color energy, typography feel, and UI patterns from the screenshots. Rebuild the design in Pencil.

### `website`

Audit the referenced site in `ui_source_ref`. Extract layout patterns, hierarchy, component types, and motion direction. Do not blindly clone weak UX patterns.

If `design_strategy` is `copy-site` or `improve-site`, do not stop at the single URL. Discover and fetch the relevant internal pages and locale variants first, then use them as both design and content reference.

Preferred command:

```bash
pnpm site:audit "<reference-url-or-ui_source_ref>" "output/<slug>/source-audit.json"
```

Read the resulting `source-audit.json` before deciding homepage sections, copy strategy, CMS structure, or seed content.

---

## Working Method

### Phase 0 — Intake

If the user already gave enough direction, do not slow the flow with unnecessary questions.

Capture:

- site type
- audience
- tone
- content density
- visual ambition
- motion ambition
- constraints like mobile performance, accessibility, dark mode, or JS fallback

If `ui_source` is not `words`, infer as much as possible from the source and avoid asking for color or style basics that can be extracted.

### Phase 0.5 — Design Strategy Mode

Before presenting directions, choose the design strategy.

Available strategies:

- `from-scratch` — New site, no existing design to preserve
- `copy-site` — Replicate an existing site as faithfully as possible
- `improve-site` — Use an existing site or design as the foundation, then elevate it
- `brand-first` — Build from a brand guide, Figma system, or existing visual identity
- `beat-competitors` — Audit competitor references and intentionally differentiate

How to apply this:

- Ask the strategy explicitly for every `ui_source` before presenting directions
- If `design_strategy` is `copy-site` or `improve-site`, prefer `reference_url` from `site.config.json` instead of asking again
- If `design_strategy` is `beat-competitors`, use `competitor_urls` from `site.config.json` and only ask again if the list is missing or too short

Strategy rules:

#### `from-scratch`

- Create an original design system from the brief
- Do not imitate a specific reference too closely
- Use the source only for content or structural hints if needed

#### `copy-site`

- Prioritize visual fidelity over reinterpretation
- Preserve hierarchy, spacing logic, component style, and motion character
- Only fix obvious production or accessibility problems
- Preserve static marketing copy, navigation labels, page titles, and information architecture from the source unless the user explicitly asks to rewrite them

#### `improve-site`

- Keep the recognizable structure and brand signals
- Upgrade typography, spacing, hierarchy, responsiveness, and motion quality
- Evolution, not a total rewrite, unless the user asks for that
- Preserve the source site's core content, page purpose, and factual static text unless the user explicitly asks for new copy

#### `brand-first`

- Treat brand colors, typography, logo behavior, and visual language as locked inputs
- Fill only the missing pieces needed to make the web experience complete
- Do not drift into unrelated styles

#### `beat-competitors`

- Compare at least 2 reference sites if available
- Identify where competitors look generic, weak, or repetitive
- Make deliberate differentiation choices in typography, composition, motion, and interaction

If useful, record the chosen strategy in the handoff summary as `design_strategy`.

### Phase 0.75 — Source & Competitor Audit

**Run this phase immediately after Phase 0.5, before presenting any design directions.**

This phase fetches real data that informs direction choices. Do not skip it — directions created without audit data will be generic.

#### When `design_strategy` is `copy-site` or `improve-site`

Run the site audit on the reference URL:

```bash
pnpm site:audit "<reference_url>" "output/<slug>/source-audit.json"
```

Read `source-audit.json` before Phase 1. Extract:
- dominant colors and visual language
- layout patterns and section structure
- typography feel
- navigation labels and information architecture
- static marketing copy to preserve in CMS seed

#### When `design_strategy` is `beat-competitors`

Run site audit on each competitor URL from `competitor_urls`:

```bash
pnpm site:audit "<competitor-url-1>" "output/<slug>/competitor-1-audit.json"
pnpm site:audit "<competitor-url-2>" "output/<slug>/competitor-2-audit.json"
# repeat for each competitor URL
```

Read all competitor audit files before Phase 1. Extract:
- visual patterns competitors share (identify what looks generic or repetitive)
- typography and color choices across competitors
- layout conventions the new design must deliberately break
- interaction and motion patterns worth outperforming

**Do not present design directions until the audit files exist and have been read.**

### Phase 1 — Present Direction

Present **3 design directions** before any full design work. Do not skip this just because the user wants the site built quickly.

Only reduce this to 1 direction when the user explicitly says the exact direction is already chosen and no comparison is needed.

Each direction must include:

- name
- concept
- mood
- typography approach
- color energy
- layout feel
- animation signature
- complexity
- why it fits this project

**Direction families are mandatory per strategy — do not mix across strategies without a strong reason.**

| Strategy | Mandatory direction families | Character |
|---|---|---|
| `copy-site` | Swiss Grid, Editorial Luxury | faithful, structured, high-fidelity |
| `improve-site` | Morphic Soft, Aurora Gradient | evolved, elevated, familiar but upgraded |
| `beat-competitors` | Neon Brutalist, Glass Future, Midnight Cinema | bold, differentiated, deliberately distinct from audit findings |
| `brand-first` | Derived from brand inputs only — do not apply a preset family | identity-locked, fill missing pieces only |
| `from-scratch` | Any family from the full list below | open creative direction |

Full direction family list (available for `from-scratch` and as secondary references):

- Glass Future
- Neon Brutalist
- Editorial Luxury
- Morphic Soft
- Data Precision
- Organic Texture
- Mongolian Modern
- Midnight Cinema
- Swiss Grid
- Aurora Gradient

If the source is an existing design, make the three options:

- faithful
- improved
- bold reinterpretation

These options map directly to the mandatory families above — use the strategy's assigned families, not a free pick.

### Phase 1.5 — Homepage Direction Preview Gate

Before designing the full site, create only **homepage direction previews** in Pencil.

Rules:

- Build 2 to 3 homepage design options in Pencil first
- Each option must include:
  - hero
  - all selected or detected homepage sections in the real homepage order
  - header
  - footer direction
  - core typography, color, and motion language
- Each option should read as a real homepage from top to bottom, not a hero concept plus a few fragments
- If the homepage is long, the preview export can be a tall canvas or multiple slices, but it must cover the full homepage structure
- Do **not** design all standalone pages yet
- Export preview images for those homepage options and show them to the user
- Save the multi-option Pencil working file to `output/<slug>/designs/homepage-directions.pen`
- Save preview exports to `output/<slug>/designs/homepage-option-a.png`, `homepage-option-b.png`, and `homepage-option-c.png` when present
- The user must choose one option before full page design continues

User choice gate:

- Ask the user to choose the preferred option after the homepage previews are shown
- Do not continue to full page design until the user selects one option
- After selection, treat the chosen homepage direction as the locked visual system for the rest of the site
- Record the chosen option label in `HANDOFF.md`

### Phase 1.75 — Full-Page Design Edit Gate

After the chosen homepage direction is expanded into the full set of page designs, stop before frontend build and run a free-form review step.

Rules:

- Keep the full designed pages available in the approved Pencil file for user review, not just the homepage
- Ask exactly: `do you wanna edit design before build frontend?`
- Do not present canned edit choices, checkboxes, or another option matrix
- Ask for the page name and the requested change in the user's own words
- Accept edits like color changes, section placement changes, component swaps, spacing changes, hierarchy changes, or page-specific layout changes
- Apply the edits inside the same approved Pencil file path
- Re-export the updated design artifacts when edits were made
- Do not require separate re-presentation if the user can inspect the current state directly in Pencil
- Ask the same free-form design edit question again after each edit round
- Repeat this review loop until the user explicitly approves the design for build or gives a direct instruction to start frontend build
- Treat phrases like `it's okay`, `looks good`, `approved`, or `build frontend` as approval to exit the loop

### Phase 2 — Motion Level

Lock a motion level from `0` to `5`.

- `0` Static
- `1` Polished
- `2` Alive
- `3` Expressive
- `4` Cinematic
- `5` Theatrical

Bias toward richer motion unless performance or accessibility constraints clearly limit it.

### Phase 3 — Build the Pencil Design

Create or refine the design in Pencil and export:

- homepage
- standalone page layouts for each selected section after the homepage direction is approved
- section variants
- key reusable components
- mobile-aware layouts

The design must cover the actual sections that the site will build, not just a hero mockup.

Before leaving this phase:

- make sure the full page design set is available in the approved Pencil file for user review
- ask `do you wanna edit design before build frontend?`
- wait for free-form page-specific feedback or explicit approval
- if feedback is given, apply it in Pencil and ask again
- do not hand off to Section C — Step 1 until that review loop is closed

Page model:

- The homepage must include the selected sections as landing-page sections
- The homepage is designed first as the direction-preview stage, and those previews must already show the full homepage section flow
- Only after the user chooses the homepage direction should the agent design the remaining pages
- Every selected section must also have a dedicated standalone page design
- Use the same visual system across homepage sections and standalone pages
- The standalone pages should expand the corresponding homepage section rather than feel like unrelated templates

**Ecommerce page model** — when `template_type` is `ecommerce`, design ALL of the following pages after the homepage direction is approved:

| Page | Route | Key elements to design |
|---|---|---|
| Product listing | `/products` | filter sidebar, product grid, sort controls, pagination |
| Product detail | `/products/[id]` | image gallery, price, variant selector, add-to-cart, reviews section |
| Cart | `/cart` | line items, quantity controls, order summary, checkout CTA |
| Checkout | `/checkout` | delivery form, payment method selector, order summary panel |
| Login | `/login` | email/password form, social login options, redirect-back hint |
| Register | `/register` | registration form, terms checkbox |
| Profile | `/profile` | editable personal info form, avatar |
| Orders | `/orders` | order history list with status badges |
| Order detail | `/orders/[id]` | items, delivery status timeline, totals |
| Wishlist | `/wishlist` | saved product grid with remove and add-to-cart actions |

- Design all ecommerce pages in the same Pencil file as the homepage (`output/<slug>/designs/design.pen`)
- Include mobile viewport for cart, checkout, and product detail — these are high-traffic mobile pages
- Cart drawer design is required in addition to the full cart page
- Auth pages (login, register) must match the overall visual system but can be minimal layout

### Phase 3.5 — Content Audit Finalization for `copy-site` and `improve-site`

**Note:** The site audit command (`pnpm site:audit`) was already run in Phase 0.75. This phase uses that output to finalize content decisions before building full page designs.

If `source-audit.json` does not exist, stop and run Phase 0.75 first before continuing.

Re-read `output/<slug>/source-audit.json` and finalize:

- Discover internal links from header, footer, sitemap, locale switchers, and obvious section CTAs
- Fetch any relevant pages not yet covered by the initial audit
- Check locale variants when multiple languages are visible or when locale-prefixed URLs exist
- Capture page titles, section headings, subheadings, CTA labels, menu labels, footer text, contact information, and other static marketing copy
- Use this content inventory to keep CMS structure and seeded content aligned with the real site

Discovery rules:

- Prefer navigation pages and high-signal marketing pages first
- Include locale variants such as `/en/about-us` when present
- Include pages that map to selected sections such as about, services, contact, pricing, blog, FAQ, team, portfolio, and gallery
- If the site exposes a sitemap or a clear page index, use it to discover additional relevant pages
- Do not scrape private, authenticated, checkout, cart, search, or irrelevant utility pages

Content-copy rules:

- For `copy-site`, preserve source static text as faithfully as practical for the CMS seed baseline
- For `improve-site`, preserve the meaning, page purpose, and factual source content while improving presentation and UX
- When locales exist, carry source-language content into the corresponding locale seed content rather than inventing replacement copy
- Only generate entirely new marketing copy when the source content is missing, clearly incomplete, or the user asked for a rewrite

Examples:

- homepage includes `about`, `services`, `contact`
- also design `/about`, `/services`, `/contact`
- if `blog` exists, design blog listing and blog detail
- if `pricing` exists, design a dedicated pricing page
- if `gallery` exists, design a dedicated gallery page
- if `team` exists, design a dedicated team page

Required component coverage:

- header
- hero
- section heading pattern
- cards or content blocks
- CTA block
- footer
- mobile navigation

Add section-specific components when relevant:

- services grid
- pricing cards
- testimonials
- blog listing
- contact form
- gallery
- team
- FAQ
- portfolio
- menu or catalog

**Ecommerce-specific required components** — when `template_type` is `ecommerce`, also cover:

- product card (image, name, price, wishlist icon, add-to-cart)
- product grid (responsive, with skeleton loading state)
- product image gallery (main image + thumbnail strip)
- variant selector (size, color chips)
- cart drawer (slide-in panel with line items and subtotal)
- cart line item (image, name, qty stepper, remove)
- checkout delivery form
- checkout order summary panel
- payment method selector
- order status badge (pending, processing, delivered, cancelled)
- order history row
- wishlist card (product card variant with remove action)
- auth form (shared style for login and register)
- profile form (editable fields with save button)

### Phase 4 — Produce the Handoff Files

After the user approves the full-page design review, write the token, library, and handoff files described below.

---

## Required Design Decisions

Before handoff, lock:

- primary and secondary color system
- neutral surfaces
- typography families for display and body
- spacing rhythm
- radius and shadow language
- motion personality
- hover behavior
- section transitions
- page transition approach
- ambient motion choice
- mobile adaptation rules

If `languages` includes Cyrillic or CJK languages, choose font families that support them.

---

## `design-tokens.json` Requirements

This file is the source of truth for frontend styling and motion.

It must include at minimum:

```json
{
  "meta": {
    "siteName": "example-site",
    "visualDirection": "editorial-luxury",
    "motionLevel": 3,
    "defaultLocale": "mn",
    "locales": ["mn", "en"]
  },
  "colors": {
    "brand": {},
    "neutral": {},
    "semantic": {
      "background": "",
      "foreground": "",
      "card": "",
      "cardForeground": "",
      "popover": "",
      "popoverForeground": "",
      "primary": "",
      "primaryForeground": "",
      "secondary": "",
      "secondaryForeground": "",
      "muted": "",
      "mutedForeground": "",
      "accent": "",
      "accentForeground": "",
      "border": "",
      "input": "",
      "ring": "",
      "success": "",
      "warning": "",
      "destructive": ""
    }
  },
  "typography": {
    "families": {
      "display": "",
      "body": "",
      "mono": ""
    },
    "scale": {}
  },
  "spacing": {
    "scale": {},
    "layout": {}
  },
  "radius": {},
  "shadows": {},
  "motion": {
    "duration": {},
    "easing": {},
    "spring_configs": {},
    "variants": {},
    "gsap_configs": {}
  }
}
```

Rules:

- No placeholder values
- No missing semantic keys
- Motion variants must match the actual design behavior
- Token names should be stable and implementation-friendly

---

## `ui-libraries.json` Requirements

This file tells the frontend agent exactly what to install and why.

It must include:

```json
{
  "motion_level": 3,
  "visual_direction": "editorial-luxury",
  "packages": [],
  "shadcn_components": [],
  "custom_components": [],
  "animation_config": {
    "core_library": "framer-motion",
    "scroll_library": "lenis",
    "text_animation": "custom",
    "page_transition": "framer",
    "ambient_system": "css",
    "micro_interactions": "framer-motion",
    "gsap_plugins": []
  }
}
```

Rules:

- Only include libraries the design actually uses
- Match motion level to library weight
- Include `gsap`, `three`, `rive`, `lottie`, `barba`, `vanilla-tilt`, `react-scramble`, or similar only when justified by the design
- Include shadcn components and copied UI library patterns only if they are part of the approved system

---

## `HANDOFF.md` Requirements

This file connects design to frontend and CMS.

It must include:

- design summary
- approved visual direction
- approved homepage option label
- homepage preview artifact paths
- source website inventory when `ui_source` is `website`
- motion level
- chosen fonts and why
- chosen libraries and why
- setup commands for required packages
- section-by-section layout guidance
- component inventory
- animation rules
- interaction rules
- responsive behavior
- accessibility notes
- content tone guidance per language
- exact items that must not change during implementation
- exact Pencil file paths used during design

Also include these two sections explicitly:

### 0. Approval Record

Include:

- homepage options shown
- selected option
- preview artifact file paths
- Pencil project paths used
- confirmation that the homepage previews covered the full homepage section flow
- confirmation that `design.pen` and `design.png` came from the approved Pencil direction
- any locked constraints the frontend must not reinterpret

When `ui_source` is `website` and strategy is `copy-site` or `improve-site`, also include:

- source pages audited
- locale variants audited
- static text/content areas that should be preserved into CMS seed data
- the path to `source-audit.json`

### 1. Frontend Build Map

Map the design to implementation targets such as:

- homepage section sequence
- header
- hero
- section wrappers
- cards
- CTA
- footer
- standalone section pages for every selected section
- dynamic CMS page templates
- blog listing and blog detail

### 2. erxes CMS Field Map

Map the design to CMS data that Step 5 will seed:

- homepage sections and their order
- page slugs for each section
- menu structure for header and footer
- which sections need long-form page content
- whether blog is required
- recommended categories and tags if blog exists
- translation expectations for all locales

When the source is an existing website, also map:

- source page URL → CMS page slug
- source locale URL → locale content bucket
- source static text blocks that should be preserved or adapted

This is how the design stage supports dynamic erxes content without changing the existing mutation scripts.

---

## Section Detection Rules

If `sections` is empty or set to `design`, inspect the approved design and detect the real sections present.

Allowed output values:

- `about`
- `services`
- `blog`
- `contact`
- `gallery`
- `pricing`
- `team`
- `testimonials`
- `faq`
- `menu`
- `portfolio`

Write the detected list back into `site.config.json` as `required_sections` or `sections`, following the current project flow.

Show the detected list to the user and get confirmation before Section C — Step 1.

---

## Color Extraction Rules

If `ui_source` is `pencil`, `figma`, `screenshot`, or `website`:

- extract the dominant primary color from the source
- write it back into `site.config.json` as `color_hint`
- do not ask the user for it unless the source is too ambiguous

Use meaningful names like:

- `forest-green`
- `navy`
- `warm-orange`
- `sky-blue`
- `oxblood`

---

## Quality Bar

The approved design must be:

- production-oriented
- visually coherent across sections
- responsive in structure
- animation-aware
- accessible in contrast and hierarchy
- realistic for a Next.js + Tailwind implementation
- compatible with dynamic erxes CMS content

Do not produce a pretty mockup that cannot survive real CMS data.

---

## Anti-Patterns

Do not:

- stop at a single hero image
- stop at partial homepage concepts when the user needs a homepage choice
- design all pages before the user chooses a homepage direction
- design only the homepage when standalone section pages are required
- output only a PNG without tokens and handoff
- generate tokens or `HANDOFF.md` before the homepage option is chosen
- fake Pencil completion with placeholder `.png` or `.pen` files
- copy non-image files into `.png` outputs
- treat a website reference as homepage-only when the user asked to copy or improve the full site context
- open or modify unrelated `.pen` projects outside the approved current-site path
- invent frontend code in this step
- choose random libraries without mapping them to motion needs
- use placeholder content strategy
- design layouts that break when menu labels, page titles, or CMS text get longer
- ignore multilingual typography needs

---

## Completion Gate

Section B — Step 2 is complete only when all of these are true:

- 2 to 3 homepage previews were built in Pencil
- homepage preview exports exist
- homepage previews show the full homepage section sequence
- the user approved one homepage option
- `design.pen` exists
- `design.png` exists
- `design-tokens.json` exists
- `ui-libraries.json` exists
- `HANDOFF.md` exists
- `HANDOFF.md` contains the approval record
- sections are confirmed
- `color_hint` is set
- all design artifacts came from the approved `.pen` path for this site

If the source is a website with strategy `copy-site` or `improve-site`, Section B — Step 2 is not complete until the relevant source pages and locale variants were audited and recorded in the handoff.
If the source is a website with strategy `copy-site` or `improve-site`, `source-audit.json` must exist and be used during handoff creation.

If `template_type` is `ecommerce`, Section B — Step 2 is not complete until ALL of the following page designs exist in the approved Pencil file:
- homepage (with all selected homepage sections)
- `/products` — product listing
- `/products/[id]` — product detail
- `/cart` — cart page
- `/checkout` — checkout page
- `/login` — login page
- `/register` — register page
- `/profile` — profile page
- `/orders` — order history
- `/orders/[id]` — order detail
- `/wishlist` — wishlist page
- cart drawer component
- all ecommerce-specific components listed in Phase 3

If any artifact is a placeholder, blank stub, or file-type fake, Section B — Step 2 is not complete.

Only then should the pipeline continue to `agents/frontend.md` and `agents/generate.md`.
