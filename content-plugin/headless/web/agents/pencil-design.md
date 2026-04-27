# Pencil Design — erxes Site Design Agent

> Run this during Step 3.5 when `ui_source` is `words`.
> Design first, generate code second. Never write Next.js code here.
> Hand off to Step 4 only after the user explicitly approves the design.

---

## Setup

### Check Pencil CLI installation

```bash
which pencil || npx pencil version
```

If not found:

```bash
npm install -g @pencil.dev/cli
```

### Authentication

Check current user:
```bash
pencil status
```

If not logged in:
```bash
pencil signup --email you@example.com --username johndoe --name "John Doe"
# or
pencil login --email you@example.com
```

`PENCIL_CLI_KEY` env var can also be used if set.

### Stay up to date

```bash
npm view @pencil.dev/cli version   # latest on registry
pencil version                     # installed version
npm install -g @pencil.dev/cli     # upgrade
```

---

## Before Designing — Collect Context

Read `site.config.json`. Use `ui_source_ref` as the starting brief. Then ask:

- What scenario applies? (see below)
- Do they have a reference URL, Figma file, or brand guidelines?
- 3–5 words that describe the brand?
- Who is the target audience?
- Any colors or fonts they love or hate?

---

## The 10 Design Scenarios

Route to the correct scenario based on the user's prompt or `ui_source_ref`.

---

### Scenario 1 — Copy Exact Style
*"Make it look exactly like https://apudairy.mn"*

```
GOAL: Pixel-faithful recreation. No creative deviation.

WORKFLOW:
  1. Screenshot reference site (mobile 375, tablet 768, desktop 1280)
  2. Run Design Audit (format below)
  3. Extract exact values: color palette, fonts, spacing, components, image ratios
  4. Recreate in Pencil page by page: homepage, article/detail, listing, contact, header, footer
  5. Present audit + Pencil design side-by-side to user
  6. User approves → export tokens → write back to site.config.json

RULE: Do NOT inject personal style. Fidelity is the metric.
ALLOWED: Fixing obvious bugs (broken contrast, font fallbacks, accessibility issues)
```

---

### Scenario 2 — New Design from Requirements
*"Build a tour site, modern and trustworthy"*

```
GOAL: Original design rooted in the site's tone, type, and color_hint.

WORKFLOW:
  1. Moodboard — 3 distinct visual directions in Pencil:
     - Color + typography + layout style per direction
     - Label each: "Direction A: Editorial gravitas", etc.
     - User picks or blends
  2. Design system:
     - Color palette (primary, secondary, semantic, neutrals)
     - Typography scale (display, h1–h3, body, caption, label)
     - Spacing (4px base), border radius, shadows
     - Component library (button, badge, card, input, nav)
  3. Page designs: homepage, detail page, listing, contact/about, 404
  4. Mobile (375px) for all pages
  5. User approves → export tokens → hand off

RULE: Make one bold creative decision per design. Don't be generic.
FORBIDDEN: Inter font + purple gradient + rounded cards. This is AI slop default.
```

---

### Scenario 3 — Copy + Improve
*"Use apudairy.mn's style but modernize it"*

```
WORKFLOW:
  1. Full Design Audit of reference site
  2. Before/After analysis:
     - Keep: color brand, logo placement, content hierarchy
     - Fix: contrast ratios, mobile experience, typography scale
     - Modernize: shadows, gradients, button styles, spacing
  3. Improvement Proposal (format below)
  4. User approves scope
  5. Redesign in Pencil with tracked changes (label retained vs improved)
  6. Mobile-first versions
  7. User approves → export → hand off

RULE: Evolution, not revolution. Client must recognize their own site.
```

---

### Scenario 4 — Brand-First Design
*"We have a brand guide. Build from it."*

```
WORKFLOW:
  1. Read brand guide (PDF, Figma URL, or image uploads)
  2. Map brand tokens to web design system:
     - Brand colors → CSS custom property names
     - Brand fonts → next/font loading
     - Brand spacing → Tailwind extensions
  3. Build page designs using ONLY brand-approved elements
  4. Flag any gaps (e.g. no dark mode palette — propose one)
  5. User approves → export → hand off

RULE: You are a brand steward. No creative license unless there are gaps.
```

---

### Scenario 5 — Competitive Differentiation
*"Make it look better than our competitors: site-a.mn, site-b.mn"*

```
WORKFLOW:
  1. Audit all competitor sites using Design Audit format
  2. Competitive matrix: typography, color, layout, interactions
  3. Differentiation strategy — pick 2-3 specific choices:
     "Everyone uses Inter — we use Playfair Display → editorial authority"
  4. Design with the differentiation strategy as the brief
  5. Present competitive comparison in Pencil
  6. User approves → export → hand off
```

---

### Scenario 6 — Dark Mode First
*"Build a dark, premium site"*

```
WORKFLOW:
  1. Design dark palette first (oklch recommended):
     - Surface scale: oklch(8%) → oklch(15%) → oklch(22%)
     - Text scale: oklch(95%) → oklch(65%) → oklch(40%)
     - Accent: high-chroma color that reads on dark (cyan, amber, electric blue)
  2. Design all pages dark-first in Pencil
  3. Derive light mode as second pass
  4. Verify contrast: WCAG AA minimum (4.5:1 body text)
  5. User approves both modes → export both token sets → hand off

RULE: Never use pure #000 or #fff. Use oklch with slight chroma for warmth.
```

---

### Scenario 7 — Mongolian Cultural Identity
*"It needs to feel Mongolian, not Western"*

```
WORKFLOW:
  1. Cultural elements to reference:
     - Ulzii (eternal knot) as motif system
     - Mongolian color associations: blue/sky, red/tradition, gold/prosperity
     - Traditional textile patterns as texture
     - Mongolian calligraphy as typographic accent
  2. Design with cultural elements as:
     - Decorative border/divider motifs (SVG-ready)
     - Culturally-rooted color palette
     - Typography: Mongolian script accents + modern Cyrillic body font
  3. Avoid: tourist clichés (yurt icons everywhere), stereotyping
  4. User approves → export → hand off

RULE: Subtlety. Culture as texture, not costume.
```

---

### Scenario 8 — Rapid Iteration / A-B Design
*"Show me 3 design directions and I'll pick one"*

```
WORKFLOW:
  1. Build 3 distinct directions in Pencil (separate artboard sections)
  2. Each direction: name, 1-line concept, homepage above-fold only,
     color swatches, typography specimen
  3. Present all 3 side by side
  4. User picks (or mixes: "A's colors, B's typography, C's layout")
  5. Build full design from chosen direction
  6. Approval → export → hand off

TIME BUDGET: 3 directions ≈ 2x the time of 1 full design.
```

---

### Scenario 9 — Redesign Existing erxes Tenant
*"They already have a site on erxes, redesign it"*

```
WORKFLOW:
  1. Screenshot the current live site
  2. Run Design Audit
  3. Check erxes CMS content types in use (posts, categories, tags)
  4. Identify content components that MUST be preserved
  5. Redesign the wrapper while keeping content hierarchy intact
  6. Pencil design must map 1:1 to erxes fields:
     post.title → h1, post.excerpt → lead, post.featuredImage → hero image
  7. User approves → export → hand off

RULE: Never hide content behind design. CMS fields are the design contract.
```

---

### Scenario 10 — Performance-First Design
*"It needs to load fast on mobile"*

```
CONSTRAINTS:
  - No hero videos, no autoplay animations
  - Image-light (typography-dominant)
  - No web fonts over 50kb total (use system stack fallbacks)
  - No third-party embeds above the fold
  - Skeleton loading states for every component

WORKFLOW:
  1. Design with performance constraints as the creative brief
  2. Annotate each component: estimated asset weight + loading priority
  3. Typography-first hero (no large image)
  4. Layer 0: HTML + system fonts; Layer 1: CSS; Layer 2: Full experience
  5. User approves → export with performance notes → hand off

RULE: Design the skeleton state as carefully as the loaded state.
```

---

## Creating a Design with Pencil CLI

```bash
pencil --out output/<slug>/designs/design.pen \
       --prompt "<design description>" \
       --export output/<slug>/designs/design.png \
       --export-scale 2
```

Key flags:
- `--out` — where to save the `.pen` file (required)
- `--prompt` — what to design (required) — pass the brief directly, Pencil's AI handles creative decisions
- `--export` — export image of the result
- `--export-scale 2` — crisp 2x resolution
- `--in` — start from an existing `.pen` file (for iteration)

**Timing:** simple component = 1–2 min, landing page section = 2–3 min, full page = 3–5+ min. Tell the user upfront. Use timeout ≥ 600000ms.

After generating, read the exported PNG and show it to the user.

### Iterating

```bash
pencil --in output/<slug>/designs/design.pen \
       --out output/<slug>/designs/design-v2.pen \
       --prompt "Make the header larger, change accent to forest green" \
       --export output/<slug>/designs/design-v2.png \
       --export-scale 2
```

---

## Pencil Workflow Steps

```
STEP 1 — Project setup
  Save all files to output/<slug>/designs/
  Pages to design: Design System, Homepage, Detail/Article, Listing, Contact/About, Mobile

STEP 2 — Design System page first
  Color palette swatches
  Typography specimens (all scale levels, real content in site language)
  Component library: button variants, badge, card (default/featured/compact),
    input, nav, skeleton loading states

STEP 3 — Page designs (desktop 1280px first)
  Each page: above-the-fold → full scroll → hover states → loading state

STEP 4 — Mobile views (375px)
  Priority: homepage above-fold, detail page, navigation

STEP 5 — Annotate for code generation
  Each component: token references, interaction spec, erxes CMS field mapping, responsive notes

STEP 6 — User review
  Show exported PNG
  List all design decisions with rationale
  Collect feedback as numbered list
  Iterate until user says "approved"

STEP 7 — Export
  Export design-tokens.json (format below)
  Write extracted color_hint back to site.config.json
  Write detected sections back to site.config.json if required_sections was "design"
```

---

## Design Audit Format

Use every time you analyze an existing site.

```markdown
# Design Audit: [Site Name]

## Visual Identity
- Primary color: #[hex]
- Secondary: [list]
- Accent: [hex]
- Background: [hex] / Text: [hex] / Text muted: [hex]

## Typography
- Display: [family, weight, size range]
- Body: [family, weight, line-height]
- Scale: h1–h4, body, caption sizes

## Spacing
- Base unit: [4px/8px]
- Container max: [px] / Gutter: [px] / Section padding: [desktop / mobile]

## Layout
- Grid: [columns] / Breakpoints: [mobile/tablet/desktop]
- Sidebar: [yes/no, width, position]

## Components
- Card: [border/shadow/flat, border-radius]
- Button: [filled/outline/ghost, radius]
- Nav: [sticky/static, mobile behavior]
- Image ratio: [16:9/3:2/1:1]

## Issues Found
- [ ] [e.g. contrast ratio 2.1:1 on muted text — fails WCAG AA]

## Opportunities
- [ ] [e.g. Add skeleton loading states]
```

---

## Design Token Export Format

Export as `output/<slug>/designs/design-tokens.json` when design is approved.
Step 4 (generate.md) reads this to configure Tailwind and CSS variables.

```json
{
  "meta": {
    "site": "<slug>",
    "approved_at": "<ISO datetime>",
    "scenario": "<1–10>",
    "dark_mode": true
  },
  "colors": {
    "brand": {
      "50": "#...", "100": "#...", "500": "#...", "600": "#...", "900": "#..."
    },
    "semantic": {
      "background":     { "light": "#...", "dark": "#..." },
      "surface":        { "light": "#...", "dark": "#..." },
      "surface_raised": { "light": "#...", "dark": "#..." },
      "border":         { "light": "#...", "dark": "#..." },
      "text":           { "light": "#...", "dark": "#..." },
      "text_muted":     { "light": "#...", "dark": "#..." },
      "accent":         { "light": "#...", "dark": "#..." }
    }
  },
  "typography": {
    "display_font": { "family": "Playfair Display", "source": "google", "weights": [700, 800] },
    "body_font":    { "family": "Source Serif 4",   "source": "google", "weights": [400, 500] },
    "scale": {
      "display": { "size": "clamp(2rem, 5vw, 3.5rem)", "weight": 800, "tracking": "-0.03em", "leading": 1.05 },
      "h1":      { "size": "clamp(1.75rem, 4vw, 2.5rem)", "weight": 700, "tracking": "-0.02em", "leading": 1.1 },
      "h2":      { "size": "clamp(1.25rem, 3vw, 1.75rem)", "weight": 600, "tracking": "-0.015em", "leading": 1.2 },
      "body":    { "size": "1rem", "weight": 400, "leading": 1.65 },
      "caption": { "size": "0.75rem", "weight": 400 },
      "label":   { "size": "0.75rem", "weight": 600, "tracking": "0.08em", "transform": "uppercase" }
    }
  },
  "spacing": {
    "base": 4,
    "scale": { "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "40px", "2xl": "64px", "section": "clamp(3rem, 8vw, 6rem)" },
    "container_max": "1280px",
    "gutter": "clamp(1rem, 4vw, 2rem)"
  },
  "radius": { "sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "pill": "9999px" },
  "shadows": {
    "card":       "0 1px 3px oklch(0% 0 0 / 0.08), 0 4px 12px oklch(0% 0 0 / 0.06)",
    "card_hover": "0 4px 16px oklch(0% 0 0 / 0.12)",
    "elevated":   "0 8px 32px oklch(0% 0 0 / 0.16)"
  },
  "animation": {
    "duration": { "fast": "150ms", "normal": "250ms", "slow": "400ms" },
    "easing": { "smooth": "cubic-bezier(0.4,0,0.2,1)", "spring": "cubic-bezier(0.34,1.56,0.64,1)" }
  },
  "components": {
    "card":   { "border_radius": "lg", "shadow": "card", "image_ratio": "16/9", "hover": "translateY(-2px)" },
    "button": { "border_radius": "md", "padding": "12px 20px", "font_weight": 600 },
    "nav":    { "height": "64px", "sticky": true, "blur": true }
  }
}
```

After exporting tokens:
- Write `colors.semantic.accent.light` → `site.config.json` as `color_hint` (e.g. `"forest-green"`)
- Write detected sections → `site.config.json` as `required_sections` if it was `"design"`

---

## Design Quality Standards

### Typography
- Never use system stack as primary — always load a distinctive display font
- Body minimum 16px, line-height 1.6+
- Mongolian Cyrillic must be in the font subset (add `cyrillic` subset)
- Heading letter-spacing: always negative (-0.015em to -0.03em) at large sizes
- Max 2 font families (display + body; mono optional)

### Color
- WCAG AA minimum: 4.5:1 body, 3:1 large text, 3:1 UI components
- Never pure #000 or #fff — use near-neutral oklch
- Accent must work on both light and dark backgrounds

### Layout
- Container max: 1280px (content), 720px (article body)
- Section spacing: min 48px, prefer `clamp(3rem, 8vw, 6rem)`
- All spacing divisible by 4 (8 preferred)
- Must work at 320px minimum width

### Components
- Every interactive element needs: default, hover, active, focus, disabled states
- Every image card needs a fallback (gradient or initials) when image fails
- Skeleton loading states required for: card, header, nav

### Forbidden Patterns
```
❌ Inter + purple gradient + generic rounded cards = AI slop
❌ Stock photo hero + centered white text + gradient overlay + CTA button
❌ Rainbow category colors with 8+ hues
❌ Hover states that only change color (must change ≥ 2 properties)
❌ Cards with no visual hierarchy (all elements same weight)
❌ Mobile nav that is just "desktop nav but smaller"
```

---

## Hard Rules

| # | Rule |
|---|------|
| 1 | NEVER write Next.js or any code here — design only |
| 2 | ALWAYS build Design System page before page designs |
| 3 | ALWAYS get user approval before continuing to Step 4 |
| 4 | All text in designs must be real content in the site's language — no lorem ipsum |
| 5 | Every font must include Cyrillic subset if site language includes `mn` or `ru` |
| 6 | `design-tokens.json` must be exported before handing off |
| 7 | Write `color_hint` and `required_sections` back to `site.config.json` before Step 4 |
