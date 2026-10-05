# Hotel Pages

> **Design rule:** Page logic (data fetching, state, mutations, routing) is authoritative. All `className` values below are hotel reference patterns only (from `agents/hotel/AGENTS.md` page patterns) — they are examples only, not to be copied verbatim. Apply your design tokens to every className before writing the file.

# Design Binding Gate — REQUIRED before writing ANY page

### Step 1 — Read `design-tokens.json`

Open `output/<slug>/design-tokens.json`. Extract and hold in context (same table as `agents/hotel/generate.md` Design Binding Gate — Step 1):

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

If `globals.css` is missing those variables, write them **now** before any page. The current source of truth for this file is `agents/frontend.md` Phase 7; when a future hotel `generate-core.md` exists, this step moves there.

**Hard rule:** you may only use a semantic utility class in a page if its `--color-*` key is declared in the `@theme inline` block of `globals.css`. Before finishing a page, confirm:

- [ ] every className used maps to a declared `--color-*` key
- [ ] no page uses a semantic class whose key is missing from `globals.css`
- [ ] `globals.css` contains no v3 artifacts (`@tailwind base;`, `* { @apply border-border; }`, or an unmapped `:root { --primary: … }` block)

### Step 4 — className Mapping

Replace every hotel reference className using the extracted tokens (same table as `agents/hotel/generate.md` — "UI layer — replace with the approved design"):

| Reference className         | Replace with                                     |
| --------------------------- | ------------------------------------------------ |
| `bg-background`, `bg-card`  | design token surface colors                      |
| `bg-white/90`, `bg-black/50`| design token surface colors (overlay tints)      |
| `border-border`             | design token border color                        |
| `text-primary`, `text-foreground`, `text-red-500` | design token text colors            |
| `rounded-xl`, `rounded-2xl` | design token border-radius scale                 |
| `shadow-lg`, `shadow-xl`    | design token shadow scale                        |
| `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `flex flex-wrap gap-4` | keep layout structure, adjust breakpoints if needed |
| `p-6`, `mb-8`, `space-y-4`, `gap-6` | design token spacing scale               |
| font classes (`text-3xl font-bold`) | design token `typography.families`      |

The two "keep layout structure" rows are the core fidelity guarantee: preserve the reference grid/column/breakpoint structure from `agents/hotel/AGENTS.md` verbatim and change only token values — this is what keeps a copy-site hotel genuinely mirroring its reference rather than inventing a divergent layout.

---

## Per-Page Design Source (binding contract)

For each page, read the layout/section spec in this priority order, then write the page:

1. `HANDOFF.md` section "1. Frontend Build Map" — section-by-section layout guidance from the approved Pencil design
2. `output/<slug>/source-observation.md` — for non-`words` sources this outranks the brief on section order, components, and slugs
3. `output/<slug>/design-brief.md` — Phase 4.1 wireframes and Phase 4.2 layout-section-order table
4. The design token set from `design-tokens.json`

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

### Design token checks (run before writing any page)
- [ ] `design-tokens.json` read — color, radius, shadow, spacing, motion values captured
- [ ] `HANDOFF.md` read — approved homepage option and per-page notes confirmed
- [ ] `source-observation.md` read (non-`words` sources) and `design-brief.md` read — wireframes, layout order, component inventory, CMS/navigation field map, assumptions
- [ ] reference classNames from `agents/hotel/AGENTS.md` replaced with design tokens
- [ ] `app/globals.css` declares the semantic `--color-*` keys in an `@theme inline` block
- [ ] shadcn/ui components kept, only `className`/`variant` re-styled
- [ ] homepage hero availability widget redirects to `/rooms` — it does not call the API directly

### Logic checks
- [ ] env wiring: `NEXT_PUBLIC_PMS_PIPELINE_ID`, `NEXT_PUBLIC_BOOKING_STAGE_ID`, `NEXT_PUBLIC_PAID_STAGE_ID`, `NEXT_PUBLIC_PAYMENT_IDS`, `NEXT_PUBLIC_CMS_ID`
- [ ] `allow_guest` false → auth pages (`login` / `register` / `forgot-password`) present
- [ ] `has_blog` true → blog listing + detail routes present and bound to CMS posts
- [ ] header/footer nav from `cpMenus` via `NEXT_PUBLIC_CMS_ID`, using the menu kinds from brief 3.5
- [ ] `_id` everywhere, never `id`
- [ ] `pnpm build` passes with zero TypeScript and ESLint errors before reporting done

---

## Pages

### Homepage — `app/[locale]/page.tsx` (Client Component)

Structure per the Homepage pattern in `agents/hotel/AGENTS.md`: hero section (with `AvailabilityForm`) + the remaining selected homepage sections from the approved design (rooms preview, about, gallery, testimonials, contact CTA…). Homepage sections come from `hotel.config.json` → `sections` (or the design brief layout order). The hero availability widget must redirect to `/rooms` with query params — never call the API directly.

### Rooms listing — `app/[locale]/rooms/page.tsx` (Client Component)

Structure per the Rooms listing pattern: date picker pre-filled from `useSearchParams()` (`checkIn`, `checkOut`, `guests`), grid of `RoomCard`s from `useRooms()`, loading + empty + error states. Each card links to `/rooms/[id]?checkIn&checkOut`.

### Room detail — `app/[locale]/rooms/[id]/page.tsx` (Client Component)

Structure per the Room detail pattern: gallery, info, `BookingForm` (availability check via `useCheckRoom()`, `cpDealsAdd` via `useCreateBooking(roomId, checkIn, checkOut)`, then `/booking/confirm?dealId&nights&amount`). Availability banner when `available === false`.

### Auth pages — only when `has_auth` (`allow_guest` false)

- `app/[locale]/login/page.tsx`
- `app/[locale]/register/page.tsx`
- `app/[locale]/forgot-password/page.tsx`

Structure from the starter auth pages, bound to `useLogin` / `useRegister` (see `generate-hooks.md`). Restyle with design tokens; keep field structure and error handling.

### CMS pages — only sections in `cms_sections`

- `app/[locale]/about/page.tsx` — Server Component fetching `cpPages` content by slug (see `generate-cms.md`)
- `app/[locale]/contact/page.tsx` — Server Component + contact form structure from starter
- `app/[locale]/blog/page.tsx` — listing from `cpPosts` (only if `has_blog`)
- `app/[locale]/blog/[slug]/page.tsx` — detail from `cpPosts` + `generateStaticParams` (only if `has_blog`)
- `app/[locale]/faq/page.tsx` — CMS page by slug (only if section present)

Booking pages are covered in `generate-booking.md`.

---

## Rules

1. Only restyle (className → token mapping); keep page structure, hooks, and data fetching identical to the reference patterns.
2. `_id` everywhere, never `id`.
3. All env-derived ids go through `lib/constants.ts`; never inline `process.env.NEXT_PUBLIC_*` reads scattered across pages.
4. Pages resolve the design source per the Per-Page table above — wireframe/audit/HANDOFF first, token mapping second.