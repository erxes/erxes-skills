# Hotel Next.js Code Generation Guide

> **Pipeline position:** Step 4 — bridge file, read FIRST before any hotel code is written. Runs after Step 3.5 (design approval).
> **Inputs:** approved design package from Step 3.5 — `output/<slug>/source-observation.md`, `output/<slug>/design-brief.md`, `design-tokens.json`, `ui-libraries.json`, `HANDOFF.md`.
> **Outputs:** the ordered code-generation contract that the hotel `generate-*.md` sub-files and this pipeline's Step 4 writers MUST follow.

## 0. Sub-file READ order — READ ALL before writing any code

This guide is split into focused sub-files. **When building a new hotel site, read ALL sub-files in the order listed below before writing any code.** Do not skip any sub-file — every one maps to required pages or features.

| Order | File | Contents | Required |
|-------|------|----------|----------|
| 1 | `generate-setup.md` | Dependencies, utils, constants, env, next.config | Always |
| 2 | `generate-types.md` | TypeScript interfaces (CMS + rooms/bookings/invoice) | Always |
| 3 | `generate-i18n.md` | i18n routing, request, messages JSON | Always |
| 4 | `generate-core.md` | Apollo Client, auth store, providers, layouts, globals.css | Always |
| 5 | `generate-graphql.md` | Hotel GraphQL file map (queries.ts/mutations.ts) | Always |
| 6 | `generate-hooks.md` | SDK hooks (rooms, booking CUD, invoice, auth, CMS) | Always |
| 7 | `generate-components.md` | Layout + room/booking components, hand-rolled UI | Always |
| 8 | `generate-pages.md` | Homepage, rooms, room detail, **auth** pages | Always |
| 9 | `generate-booking.md` | **booking/confirm** + **booking/verify** pages | Always |
| 10 | `generate-cms.md` | CMS pages (about, contact, blog, faq, amenities, gallery, offers) | Per `cms_sections` |

`payment.md` (the hotel payment/deposit flow) is not in the numbered read order because its logic is consumed through `generate-hooks.md`'s `useInvoice` — read it during `generate-booking.md`/`generate-pages.md` to write booking pages that match the payment sequence. It also serves as the Step 5 reference for payment wiring.

**Hard gate:** Do not write any page files until you have read the corresponding sub-file. Generating pages without reading the sub-file produces incomplete pages missing the booking flow, auth guards, and dynamic data fetching.

---

## 1. Design Agnosticism — READ FIRST

The hotel pipeline generates code from the approved design the same way the ecommerce pipeline does: the **logic layer is authoritative and locked**, and the **UI layer is replaced with the approved design**. All code examples in `agents/hotel/AGENTS.md` and this folder are reference implementations only — do not copy their classNames into the new project.

### Logic layer — follow exactly, do NOT change

- GraphQL queries, mutations, and types (`agents/hotel/reference.md`)
- Availability flow — check-in/check-out date handling, guest count, redirect from the homepage form to `/rooms` with query params
- Booking flow — deal creation (`cpDealsAdd`), invoice creation (`cpInvoiceCreate`), payment verification, deal stage advance (`cpDealsEdit`)
- Route structure: `/`, `rooms`, `rooms/[id]`, `booking/confirm`, `booking/verify`
- Apollo client + provider and `NEXT_PUBLIC_*` env wiring (`agents/conventions.md`)
- PMS IDs (`pipeline_id`, stage IDs, `payment_ids`) and `allow_guest` behavior

### UI layer — replace with the approved design

- Every Tailwind className in the reference page patterns is an example — map it to the project's design system before writing the file.
- Before writing any component, read `design-tokens.json` and `HANDOFF.md` from the approved Pencil design.
- Map every reference className to the project's design system:

| Reference className | Replace with |
|---|---|
| `bg-card`, `bg-background` | design token surface colors |
| `border-border` | design token border color |
| `text-primary`, `text-foreground` | design token text colors |
| `rounded-xl`, `rounded-2xl` | design token border-radius scale |
| `shadow-lg`, `shadow-xl` | design token shadow scale |
| `grid-cols-3`, `flex gap-4` | keep layout structure, adjust breakpoints with token spacing |
| `p-6`, `mb-8` | design token spacing scale |

### Component structure — keep, style differently

Every page and component structure (state, hooks, JSX tree shape, data fetching) must be preserved. Only the `className` props and token-mapped styling change. Do not restructure the room-card grid, the booking form fields, or the availability widget while restyling.

### shadcn/ui components

Keep component imports (`Button`, `Input`, `Label`, `Select`, …). Only pass different `className` or `variant` props where the design requires it.

---

## Design Binding Gate — REQUIRED before writing ANY component or page

`agents/hotel/generate-components.md`, `agents/hotel/generate-pages.md`, and `agents/hotel/generate-booking.md` each start with this gate (same wording, 4 steps). It is the exact gate pattern from `agents/ecommerce/generate-components.md` (Design Binding), adapted to the hotel domain. Do not write any file until all four steps pass.

### Step 1 — Read `design-tokens.json`

Open `output/<slug>/design-tokens.json`. Extract and hold in context:

| Token path                          | Used for                       |
| ----------------------------------- | ------------------------------ |
| `colors.semantic.background`        | page background                |
| `colors.semantic.card`              | card surface                   |
| `colors.semantic.primary`           | brand color, CTA buttons       |
| `colors.semantic.primaryForeground` | text on primary buttons        |
| `colors.semantic.secondary`         | secondary surfaces             |
| `colors.semantic.foreground`        | body text                      |
| `colors.semantic.mutedForeground`   | helper text, labels            |
| `colors.semantic.border`            | dividers, input borders        |
| `colors.semantic.destructive`       | error, delete actions          |
| `typography.families.display`       | headings font                  |
| `typography.families.body`          | body font                      |
| `radius`                            | border-radius scale            |
| `shadows`                           | shadow scale                   |
| `spacing.scale`                     | spacing rhythm                 |
| `motion`                            | animation variants, durations  |

### Step 2 — Read `HANDOFF.md`

Open `output/<slug>/HANDOFF.md`. Confirm:

- approved visual direction and chosen homepage option (Approval Record)
- per-page and per-component notes (Frontend Build Map)
- motion level — if > 0, apply animation tokens from `motion` in `design-tokens.json`
- the erxes CMS field map (menu kinds, page slugs, blog categories)

### Step 3 — Verify `app/globals.css`

Check that `output/<slug>/app/globals.css` (Tailwind **v4** — must start with `@import "tailwindcss";`) declares the design tokens inside an `@theme inline` block:

```css
@theme inline {
  --color-background: <from token colors.semantic.background>;
  --color-card: <from token colors.semantic.card>;
  --color-primary: <from token colors.semantic.primary>;
  --color-primary-foreground: <from token colors.semantic.primaryForeground>;
  --color-foreground: <from token colors.semantic.foreground>;
  --color-muted-foreground: <from token colors.semantic.mutedForeground>;
  --color-border: <from token colors.semantic.border>;
  --color-muted: <from token colors.semantic.muted>;
  --color-destructive: <from token colors.semantic.destructive>;
  --radius-sm: <from token radius>;
  --radius-md: <from token radius>;
  --radius-lg: <from token radius>;
}
```

If `globals.css` is missing those variables, write them **now** before any component. The current source of truth for this file is `agents/frontend.md` Phase 7; when a future hotel `generate-core.md` exists, this step moves there.

**Hard rule:** you may only use a semantic utility class in a component if its `--color-*` key is declared in the `@theme inline` block of `globals.css`. Before finishing a component, confirm:

- [ ] every className used (`bg-primary`, `text-primary-foreground`, `bg-card`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-secondary`, `bg-accent`, `text-destructive`, …) maps to a declared `--color-*` key
- [ ] no component uses a semantic class whose key is missing from `globals.css`
- [ ] `globals.css` contains no v3 artifacts (`@tailwind base;`, `* { @apply border-border; }`, or an unmapped `:root { --primary: … }` block)

### Step 4 — className Mapping

Replace every reference className using the extracted tokens and the mapping table in the "UI layer — replace with the approved design" section above. The two "keep layout structure" rows are the core fidelity guarantee: preserve the reference grid/column/breakpoint structure from `agents/hotel/AGENTS.md` verbatim and change only token values — this is what keeps a copy-site hotel genuinely mirroring its reference rather than inventing a divergent layout.

For a copy-site, the grid/column/breakpoint structure to preserve is the one observed in `output/<slug>/source-observation.md` when a source was observed. The patterns in `agents/hotel/AGENTS.md` are the fallback for `ui_source = words`, not the default for a real reference.

---

## Per-Page Design Source (binding contract)

For each page, read the layout/section spec in this priority order, then write the page:

1. `HANDOFF.md` section "1. Frontend Build Map" — section-by-section layout guidance from the approved Pencil design
2. **When `ui_source` is not `words`:** `output/<slug>/source-observation.md` — `observed_section_order`, `observed_components`, `observed_routes`, `observed_copy`. This outranks the brief on every structural fact.
3. `output/<slug>/design-brief.md` — Phase 4.1 wireframes and Phase 4.2 layout-section-order table. Authoritative for `ui_source = words`; for every other source it is derived from the observation.
4. The design token set from `design-tokens.json`

For non-`words` sources, when the brief and `source-observation.md` disagree on section order, components, or slugs: **the observation wins.** The brief is a derived artifact, never an independent opinion.

| Page | Where the layout spec lives |
| ---- | --------------------------- |
| Homepage (`page.tsx`) | observed_section_order (non-`words`) or brief 4.1 HOME wireframe (`words`) · HANDOFF build map |
| Rooms listing (`rooms/page.tsx`) | observed room-grid structure · brief 4.1 rooms wireframe · brief 4.2 table |
| Room detail (`rooms/[id]/page.tsx`) | observed detail structure · brief 4.1 room-detail wireframe · brief 4.2 |
| Booking confirm (`booking/confirm/page.tsx`) | brief 4.1 booking-flow wireframe (summary · guest details · payment) |
| Booking verify (`booking/verify/page.tsx`) | brief 4.1 booking-flow wireframe (payment status screen) |
| CMS pages (`about` / `contact` / `blog` / `faq` / `amenities` / `gallery` / `offers`) | observed_routes (non-`words`) · brief 4.2 table rows · brief 4.5 CMS field map (slug, menu kind) |

The booking-flow pages are the hotel-specific extension of this contract: their structure (redirect to `/rooms`, deal creation, invoice, payment verify) is locked by `agents/hotel/AGENTS.md` page patterns and `agents/hotel/reference.md` — only their visual design is sourced from the design package.

---

## Build Checklist

### Design token checks (run before writing any component)
- [ ] `design-tokens.json` read — color, radius, shadow, spacing, motion values captured
- [ ] `HANDOFF.md` read — approved homepage option and per-page notes confirmed
- [ ] `source-observation.md` read — observed section order, components, routes, copy (non-`words` sources)
- [ ] `design-brief.md` read — wireframes, layout order, component inventory, CMS/navigation field map, assumptions
- [ ] reference classNames from `agents/hotel/AGENTS.md` replaced with design tokens
- [ ] `app/globals.css` declares the semantic `--color-*` keys in an `@theme inline` block
- [ ] shadcn/ui components kept, only `className`/`variant` re-styled
- [ ] homepage hero availability widget redirects to `/rooms` — it does not call the API directly

### Logic checks
- [ ] Gemini/pipeline env wiring: `NEXT_PUBLIC_PMS_PIPELINE_ID`, `NEXT_PUBLIC_BOOKING_STAGE_ID`, `NEXT_PUBLIC_PAID_STAGE_ID`, `NEXT_PUBLIC_PAYMENT_IDS`, `NEXT_PUBLIC_CMS_ID`
- [ ] `allow_guest` false → auth pages (`login` / `register` / `forgot-password`) present
- [ ] `has_blog` true → blog listing + detail routes present and bound to CMS posts
- [ ] header/footer nav from `cpMenus` via `NEXT_PUBLIC_CMS_ID`, using the menu kinds from brief 3.5
- [ ] `_id` everywhere, never `id`
- [ ] `pnpm build` passes with zero TypeScript and ESLint errors before reporting done