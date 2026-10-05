# Hotel Components

> **Design rule:** All `className` values below are hotel reference patterns only (from `agents/hotel/AGENTS.md` page patterns and `agents/hotel/generate-design.md` Phase 4.3 component inventory). They are examples only — **do NOT copy them verbatim** — replace every one with project design tokens before writing the file.

# Design Binding Gate — REQUIRED before writing ANY component

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

If `globals.css` is missing those variables, write them **now** before any component. The current source of truth for this file is `agents/frontend.md` Phase 7; when a future hotel `generate-core.md` exists, this step moves there.

**Hard rule:** you may only use a semantic utility class in a component if its `--color-*` key is declared in the `@theme inline` block of `globals.css`. Before finishing a component, confirm:

- [ ] every className used (`bg-primary`, `text-primary-foreground`, `bg-card`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-secondary`, `bg-accent`, `text-destructive`, …) maps to a declared `--color-*` key
- [ ] no component uses a semantic class whose key is missing from `globals.css`
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

---

## Component Inventory

Design-agnostic component structure from the reference hotel project. Keep structure (state, hooks, JSX tree shape) identical; replace every className per the approved design.

Component inventory lives in `agents/hotel/generate-design.md` Phase 4.3. Cross-check the list below against it and build every component it declares. For non-`words` sources, `source-observation.md` `observed_components` is the authority — every observed component must exist in the built site.

### Shared (from starter — keep imports, restyle)

```tsx
// shadcn/ui — same component set as the boilerplate
Button, Input, Label, Textarea, Select (RadioGroup, Checkbox), Form helpers
```

### `components/layout/Header.tsx` — client

Structure: logo link (`/`) + nav menu + language switcher + mobile menu. Nav items come from `cpMenus` (kind `"header"`) via `NEXT_PUBLIC_CMS_ID`; fallback to hardcoded `[Home, Rooms, About, Contact]` when CMS returns empty.

```tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { CP_MENUS } from "@/graphql/cms/queries"; // from starter/generate-cms
import { CMS_ID } from "@/lib/constants";
import { Link, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";

function deduplicateMenus(menus: any[]) {
  return menus.filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);
}

const fallbackMenus = [
  { label: "Home", url: "/", order: 1 },
  { label: "Rooms", url: "/rooms", order: 2 },
  { label: "About", url: "/about", order: 3 },
  { label: "Contact", url: "/contact", order: 4 },
];

export default function Header() {
  const locale = useLocale();
  const pathname = usePathname();

  const { data } = useQuery(CP_MENUS, {
    variables: { language: locale, kind: "header", cpId: CMS_ID },
    skip: !CMS_ID,
  });

  const menus = useMemo(() => {
    const items = data?.cpMenus ?? [];
    return deduplicateMenus(items).length ? deduplicateMenus(items) : fallbackMenus;
  }, [data]);

  return (
    <header>
      <Link href="/">Hotel</Link>
      <nav>
        {menus.map((menu) => (
          <Link key={menu._id} href={menu.url} className={pathname === menu.url ? "active" : ""}>
            {menu.label}
          </Link>
        ))}
      </nav>
      {/* language switcher + mobile menu toggle — restyled only */}
    </header>
  );
}
```

### `components/layout/Footer.tsx` — client

Structure: branding + nav from `cpMenus` (kind `"footer"`) + copyright. Same dedupe + fallback logic as Header.

### `components/home/AvailabilityForm.tsx` — client

The homepage hero widget from `agents/hotel/AGENTS.md` Homepage pattern. On submit, `router.push(/${locale}/rooms?checkIn&checkOut&guests)` — **never calls the API directly.** Date inputs must enforce `checkOut > checkIn` and `guests` between 1 and 10. Structure is locked; restyle only.

### `components/rooms/RoomCard.tsx` — client/server-agnostic presentational

Structure: `Image` + name + description + price/night + booking link. Receives `IRoom` + optional checkIn/checkOut to thread into the `/rooms/[id]` URL. Rendered inside the rooms grid.

### `components/rooms/BookingForm.tsx` — client

The room-detail booking form from `agents/hotel/AGENTS.md` Room detail pattern. Structure: guestName/email/phone/note fields + availability banner + Book Now. On submit: `cpDealsAdd` via `useCreateBooking(roomId, checkIn, checkOut)` (see `generate-hooks.md`), then pushes `/booking/confirm?dealId&nights&amount`. Disabled while loading or when room unavailable. `amount = room.price × nights` is computed at submit time and included in the redirect.

### `components/booking/BookingSummary.tsx` — client

Rendered on `booking/confirm`. Structure: room name, check-in/check-out, nights, total amount, listed payment methods (from `NEXT_PUBLIC_PAYMENT_IDS`). Pure presentational — reads values from query params.

### `components/booking/PaymentStatus.tsx` — client

Rendered on `booking/verify`. Structure: `useInvoice().check()` in an effect + status branch (`idle` / `pending` / `paid` / `failed`). Restyle only — state flow is locked.

### `components/common/Image.tsx` — client

Server-safe image wrapper. Structure (locked):

```tsx
"use client";
import { useState } from "react";
import Image from "next/image";

function defaultImage() {
  // inlined SVG placeholder from the starter — restyle to a neutral hotel placeholder
  return "data:image/svg+xml;..."; // base64 from starter
}

type Props = {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function AppImage({ src, alt, className, width = 200, height = 200 }: Props) {
  const [fallback, setFallback] = useState(false);

  if (fallback || !src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={defaultImage()} className={className} width={width} height={height} alt={alt} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      onError={() => setFallback(true)}
    />
  );
}
```

---

## Rules

1. Every component uses only semantic classes declared in the `globals.css` `@theme inline` block — see the Hard rule above.
2. Component structure/hooks/JSX tree shape are locked from the reference patterns. Restyling = className + token mapping only; never restructure the availability widget, room grid, or booking form.
3. shadcn/ui component imports are kept; only pass different `className`/`variant` where the design requires.
4. Client components stay `"use client"` and must not import server-only modules.
5. Nav fallbacks keep the exact slugs (`/`, `/rooms`, `/about`, `/contact`) so login/booking flows always route.