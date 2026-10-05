# erxes Hotel (PMS) + CMS — Agent Instructions

You build and deploy Next.js hotel websites fully connected to both erxes PMS (rooms, bookings, payments) and erxes CMS (pages, blog, navigation).

Read these files as needed — do not skip them:

| File | Read when |
| ---- | --------- |
| [`setup.md`](setup.md) | Step 0 — hotel-specific fields |
| [`reference.md`](reference.md) | GraphQL queries/mutations, starter payment operations, env vars |

---

## Shared Module Integration

The hotel pipeline REUSES modules from the generic `agents/` folder. Do not duplicate — read the shared files at the correct step.

### Shared Files (read at the specified step)

| File | When to Read | Purpose |
| ---- | ------------ | ------- |
| `agents/setup.md` | Step 0 (if starting fresh) | Generic setup — name, languages, tone, design strategy, etc. |
| `agents/pencil-design.md` | Step 3.5 | Pencil design tool usage, direction previews, design tokens |
| `agents/animations.md` | Step 4 (before animation code) | Animation library implementations |
| `agents/frontend.md` | Step 4 (before code generation) | Frontend build phases, token system, component architecture |
| `agents/conventions.md` | Before writing ANY code | Generic code conventions — React/Next.js patterns, Tailwind, TypeScript |

### Hotel-Specific Files (always read these)

| File | When to Read | Purpose |
| ---- | ------------ | ------- |
| `agents/hotel/setup.md` | Step 0 | Hotel-specific fields (pipeline_id, stage IDs, payment_ids, allow_guest) |
| `agents/hotel/generate-design.md` | Step 3.5 (before Pencil) | Autonomous hotel design derivation: source observation → design brief → assumptions |
| `agents/hotel/reference.md` | Step 4 + Step 5 | GraphQL queries/mutations, payment flow, env vars checklist |
| `agents/hotel/generate.md` | Step 4 (FIRST, before any code) | Hotel design-agnosticism bridge: Design Binding gate, token contract, per-page design source, sub-file READ order |
| `agents/hotel/conventions.md` | Step 4 (right after generate.md, before generate-core.md) | Hotel-specific conventions — starter-owned Apollo/auth/payment, no cart/no delivery, availability redirect, deal-based payment, `invoicesCheck` Boolean mutation, no `clientPortalId`, config checks |
| `agents/hotel/generate-setup.md` | Step 4 (second) | Dependencies, utils, constants, env, next.config |
| `agents/hotel/generate-types.md` | Step 4 (third) | TypeScript interfaces (CMS + rooms/bookings/invoice) |
| `agents/hotel/generate-i18n.md` | Step 4 (fourth) | i18n routing, request, messages JSON |
| `agents/hotel/generate-core.md` | Step 4 (fifth) | Consuming the starter's Apollo client/provider, layouts, globals.css — do NOT author `lib/apollo/` |
| `agents/hotel/generate-graphql.md` | Step 4 (sixth) | Hotel GraphQL file map (queries/mutations) + the starter payment operations to import |
| `agents/hotel/generate-hooks.md` | Step 4 (seventh) | SDK hooks (rooms, booking CUD, CMS) + import the starter's `useInvoice` and auth hooks |
| `agents/hotel/generate-components.md` | Step 4 (eighth) | Layout + room/booking components, hand-rolled UI |
| `agents/hotel/generate-pages.md` | Step 4 (ninth) | Homepage, rooms, room detail, auth pages |
| `agents/hotel/generate-booking.md` | Step 4 (tenth) | booking/confirm + booking/verify pages |
| `agents/hotel/generate-cms.md` | Step 4 (when `cms_sections` set) | CMS pages (about, contact, blog, faq, amenities, gallery, offers) |
| `agents/hotel/payment.md` | Step 4 (with generate-booking.md) + Step 5 | Hotel payment/deposit framework on the starter's invoice ops: QR/transactions flow, Boolean status check, deal completion |

### Routing from Generic Pipeline

When `template_type = "hotel"` is selected in `agents/setup.md`:

1. **Stop following `agents/setup.md`** after collecting generic fields
2. **Rename generic `site.config.json` → `hotel.config.json`** — the config file this pipeline reads from here on. Same rule as ecommerce's `site.config.json` → `store.config.json` rename; shared design files (`agents/pencil-design.md`) accept `hotel.config.json` as an equivalent source.
3. **Switch to `agents/hotel/AGENTS.md`** immediately
4. **Continue hotel-specific setup** (pipeline_id, stage IDs, payment_ids, allow_guest)
5. **Proceed directly to design (Step 3.5)** after setup is complete

### File Reading Order for Hotel

```
Step 0:  agents/setup.md (generic fields)
         |
         agents/hotel/setup.md (hotel-specific fields)
         |
Step 3.5: agents/hotel/generate-design.md (autonomous: observe ui_source → design brief → assumptions; asks nothing)
         |
         agents/pencil-design.md (design directions in Pencil)
         |
Step 4:  agents/hotel/generate.md (sub-file READ order, design bindings)
         agents/hotel/conventions.md (hotel-specific conventions — auth model, no cart, payment, no clientPortalId)
         agents/hotel/generate-setup.md → generate-types.md → generate-i18n.md
         agents/hotel/generate-core.md → generate-graphql.md → generate-hooks.md
         agents/hotel/generate-components.md → generate-pages.md → generate-booking.md
         agents/hotel/generate-cms.md (if cms_sections set)
         agents/hotel/payment.md (payment/deposit framework)
         agents/hotel/reference.md (GraphQL reference + payment flow)
         agents/conventions.md (generic conventions)
         agents/frontend.md (frontend architecture)
         agents/animations.md (if motion level > 0)
         |
Step 5:  Seed CMS content
         |
Step 6-7: Verify + Deploy
```

### Business Analysis / UX Research Status — REPLACED for hotel

`agents/business-analyst.md` (generic Step 0.5) and `agents/ux-ui-researcher.md` (generic Step 0.75) are **not run** in the hotel pipeline. `agents/hotel/generate-design.md` replaces both, the same explicit way `agents/ecommerce/AGENTS.md` skips generic business analysis and makes UX research optional.

Why:

- Both generic files are conversational interviews. The hotel pipeline is autonomous from `agents/hotel/setup.md` onward — it asks no design questions at all — so running them would require user interaction the hotel flow deliberately does not have.
- `source_observation` + `design_brief` are the single durable design-intent records (`output/<slug>/source-observation.md`, `output/<slug>/design-brief.md`, and both blocks in `hotel.config.json`). Separate `business-requirements.md` / `ux-research.md` documents would create a second, divergent state source that nothing downstream reads.

Effect: `agents/hotel/generate-design.md` owns hotel design derivation end-to-end — setup → observed source → brief → `agents/pencil-design.md` — with no interview at any point. Deeper business or UX intent is expressed through `agents/hotel/setup.md` fields (`tone`, `extra_notes`, `sections`, `cms_sections`) or through the `ui_source` reference, never through a separate document.

---

## Pipeline — New hotel site

### Step 0 — Setup

**If coming from generic pipeline (`agents/setup.md`):**

- Generic fields already collected in `site.config.json` (renamed to `hotel.config.json` at routing)
- Read `agents/hotel/setup.md` and ask ONLY missing hotel-specific fields:
  - `pipeline_id`
  - `booking_stage_id`
  - `paid_stage_id`
  - `payment_ids`
  - `allow_guest`

**If starting fresh:**

- Read `agents/setup.md` first — collect generic fields
- When `template_type = "hotel"`, switch to this file
- Then read `agents/hotel/setup.md` — collect hotel-specific fields

**After all fields collected:**

- Write `hotel.config.json`
- Update `.env`
- Create CMS with `tsx scripts/erxes-cms.ts`
- Save returned `_id` as `ERXES_CMS_ID` in `hotel.config.json` and `.env`

### Step 1 — Read config

Read `hotel.config.json`. Derive:

- `slug` = name lowercased, spaces → hyphens
- `has_auth` = `allow_guest` is false
- `has_blog` = `cms_sections` includes `"blog"`
- `has_contact` = `cms_sections` includes `"contact"`

### Step 2 — Create CMS

```bash
tsx scripts/erxes-cms.ts
```

Calls `cpContentCreateCMS` with `{ name, description, languages, defaultLanguage, clientPortalId }` from `hotel.config.json`.

Saves returned `_id` into:
- `hotel.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`
- `output/<slug>/.env.local` as both `ERXES_CMS_ID` and `NEXT_PUBLIC_CMS_ID`

### Step 3 — Clone starter

```bash
tsx scripts/clone.ts "<hotel-name>"
```

Clones starter repo into `output/<slug>/`. Skips if already exists.

After cloning, `clone.ts` prunes the inactive vertical GraphQL layers: it detects hotel from `hotel.config.json` and removes
`src/graphql/tour/`, and prunes `src/graphql/ecommerce/` down to the shared payment operations. A hotel run keeps
`src/graphql/auth/`, `src/graphql/cms/`, `src/graphql/hotel/`, plus `src/graphql/ecommerce/{mutations,queries}/payment.ts`
— the payment operations `src/lib/hooks/useInvoice.ts` imports.

### Step 3.5 — UI design source + direction

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `hotel.config.json`.

**Hard Gate:** Do not generate any design directions until `hotel.config.json` exists, `design_strategy` is set, and `source-observation.md` exists.

**This step asks no questions.** The only user input is `agents/hotel/setup.md`.

**First, derive the hotel design brief:**

Read [`agents/hotel/generate-design.md`](generate-design.md). Resolve hotel-specific inputs from `hotel.config.json`, observe the `ui_source` source directly, and write `output/<slug>/source-observation.md`, `output/<slug>/design-brief.md`, plus the `source_observation` and `design_brief` blocks in `hotel.config.json`. Every default chosen is recorded in the brief's `## Assumptions` section. There is no interview and no brief-approval gate here.

**Then proceed with the shared Pencil flow.** All five `ui_source` cases, mirroring `agents/ecommerce/AGENTS.md`. Read [`agents/pencil-design.md`](../pencil-design.md) for every case — the observation and the brief are carried into the Pencil flow as pre-answered intake: Phase 0/0.5 reads `source-observation.md`, `design-brief.md`, and both config blocks and asks nothing.

**`words`** — user described the look in text
Use `ui_source_ref` as the creative brief. Produce the full design package:

- First create 2 to 3 homepage-only direction previews in Pencil using the full selected homepage section sequence
- Save them as real preview artifacts:
  - `output/<slug>/designs/homepage-directions.pen`
  - `output/<slug>/designs/homepage-option-a.png`
  - `output/<slug>/designs/homepage-option-b.png`
  - `output/<slug>/designs/homepage-option-c.png` when a third option exists
- Show those previews to the user and get a choice
- Only after the user selects one option, expand that chosen direction into:
  - `output/<slug>/designs/design.pen`
  - `output/<slug>/designs/design.png`
  - `output/<slug>/design-tokens.json`
  - `output/<slug>/ui-libraries.json`
  - `output/<slug>/HANDOFF.md`
- After the full page design is ready in the approved Pencil file, ask exactly: `do you wanna edit design before build frontend?`
- Follow with a free-form request for page-specific edits
- Apply requested edits and repeat until the user explicitly approves

**`pencil`** — existing `.pen` file
Open the exact path in `ui_source_ref` with the Pencil MCP tools. Use it as the base homepage direction, create full-homepage options in Pencil first, export preview images, show the user the choices, then after approval expand into the full design package listed above.

**`figma`** — Figma link or exported assets
Use the Figma URL or image paths in `ui_source_ref` as visual reference. Reconstruct full-homepage direction previews in Pencil first, export preview images, get a user choice, then expand into the full design package listed above.

**`screenshot`** — uploaded screenshots
Read every image listed in `ui_source_ref`. `agents/pencil-design.md` requires the explicit observed inventory recorded in `HANDOFF.md` before any rebuild. Rebuild full-homepage direction previews in Pencil, export preview images, get a user choice, then expand into the full design package listed above.

**`website`** — existing site URL
Fetch the URL in `ui_source_ref`. Discover the main navigation, locale variants, and relevant internal pages first. Run the audit — for **every** `design_strategy`, including `from-scratch` and `brand-first`:

```bash
pnpm site:audit "<reference-url-or-ui_source_ref>" "output/<slug>/source-audit.json"
```

Use that audit JSON as the source-of-truth inventory for both structure and static content, then turn it into full-homepage direction previews in Pencil, export preview images, get a user choice, then expand into the full design package listed above.

**For `pencil` / `figma` / `screenshot` / `website`:**
Extract dominant primary color → write to `hotel.config.json` as `color_hint`. Do not ask user.

**If `design_strategy` is `copy-site` or `improve-site`:**
Use `reference_url` from config as the source to copy or improve.

**If `design_strategy` is `beat-competitors`:**
Use `competitor_urls` from config as the competitor audit input — run `pnpm site:audit` once per competitor URL into `output/<slug>/source-audit-<n>.json` and compare them.

**Section detection:** if `sections` is empty or `"design"`, detect the real sections present in `source_observation.observed_section_order`, map them to valid section names, write them back into `hotel.config.json` as `required_sections`, then show the detected list to the user and ask for confirmation — one confirmation, same as ecommerce.

**Step 3.5 completion checklist — all must hold before Step 4:**

- [ ] no design question was asked — this step ran autonomously from `hotel.config.json`
- [ ] `ui_source_ref` was opened/fetched, or the unreachable-source stop condition was resolved with a corrected source
- [ ] `output/<slug>/source-observation.md` exists with a complete observed inventory
- [ ] `output/<slug>/design-brief.md` exists, contains the six artifacts (wireframe structure, layout section order, component inventory, visual direction candidates with a named lead, CMS/navigation field map, assumptions) — the assumptions table may be empty when nothing was defaulted
- [ ] `source_observation` and `design_brief` written into `hotel.config.json`
- [ ] for non-`words` sources, the wireframes and section order trace back to `observed_section_order`
- [ ] `source-audit.json` exists when `ui_source` is `website`, and one sibling audit per `competitor_urls` entry when `design_strategy` is `beat-competitors`
- [ ] homepage preview artifacts exist in `output/<slug>/designs/` (`homepage-option-a.png`, `b`, `c` when present) and each shows the full homepage section flow
- [ ] the user selected one homepage option
- [ ] `design.pen` + `design.png` exported from the approved Pencil design
- [ ] `design-tokens.json`, `ui-libraries.json`, `HANDOFF.md` written into `output/<slug>/designs/` or the approved Pencil path
- [ ] `HANDOFF.md` carries the observed inventory and assumptions lifted **verbatim** from `design-brief.md` / `source-observation.md`
- [ ] the user was asked `do you wanna edit design before build frontend?` and any requested edits were applied inside the approved Pencil file
- [ ] the user explicitly approved the final design (e.g. `it's okay`, `looks good`, `build frontend`)
- [ ] `required_sections` detected, written back into `hotel.config.json`, and confirmed

If any box is unchecked, stay in Step 3.5 and fix it — do not enter Step 4.

### Step 4 — Generate code

**Hard Gate:** Do not enter Step 4 until Step 3.5 is fully complete and the user has approved the final design.

**Read these files IN ORDER before writing code:**

1. `agents/hotel/generate.md` — sub-file READ order, design agnosticism, Design Binding gate, per-page design source
2. `agents/hotel/conventions.md` — hotel-specific conventions (starter-owned Apollo/auth/payment, no cart, availability redirect, deal-based payment, `invoicesCheck` Boolean mutation, no `clientPortalId`)
3. `agents/hotel/generate-setup.md` — dependencies, utils, constants, env, next.config
4. `agents/hotel/generate-types.md` — TypeScript interfaces
5. `agents/hotel/generate-i18n.md` — i18n routing, request, messages JSON
6. `agents/hotel/generate-core.md` — consuming the starter's Apollo client/provider, layouts, globals.css
7. `agents/hotel/generate-graphql.md` — Hotel GraphQL file map (do NOT recreate starter files)
8. `agents/hotel/generate-hooks.md` — SDK hooks (rooms, booking CUD, CMS) + importing `useInvoice`/auth
9. `agents/hotel/generate-components.md` — layout + room/booking components
10. `agents/hotel/generate-pages.md` — homepage, rooms, room detail, auth pages
11. `agents/hotel/generate-booking.md` — booking/confirm + booking/verify pages
12. `agents/hotel/generate-cms.md` — CMS pages (about, contact, blog, faq, amenities, gallery, offers) — read when `cms_sections` has sections
13. `agents/hotel/payment.md` — payment/deposit framework (invoice creation, status check, deal completion) — read alongside generate-booking.md
14. `agents/hotel/reference.md` — GraphQL queries/mutations, env vars
15. `agents/conventions.md` — generic conventions
16. `agents/frontend.md` — frontend architecture, token system
17. `agents/animations.md` — animation libraries (if motion level > 0)

**Write files in this order:**

1. Dependencies install (per `generate-setup.md`)
2. Types (`types/` per `generate-types.md`)
3. i18n routing + request + messages (per `generate-i18n.md`)
4. Wire the starter's `ApolloClientProvider` into `app/[locale]/layout.tsx` (per `generate-core.md`) — do not create `lib/apollo/` files
5. GraphQL (`graphql/hotel/` per `generate-graphql.md` — do NOT recreate starter files)
6. Hooks (`lib/hooks/`, `hooks/` per `generate-hooks.md`) — rooms/booking/CMS hooks; import the starter's `useInvoice` and auth hooks rather than writing them
7. Root layout + Providers
8. `app/globals.css` — write the CSS custom properties from `design-tokens.json` (Tailwind v4 `@import "tailwindcss";` + `@theme inline` block) **before** any component consumes them. Source of truth: `agents/frontend.md` Phase 7 + `generate-core.md`.
9. Auth pages (if `has_auth`): `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx` (per `generate-pages.md`)
10. Hotel pages:
    - `page.tsx` — homepage with selected sections + availability search form in the hero
    - `rooms/page.tsx` — room listing with availability date picker
    - `rooms/[id]/page.tsx` — room detail with booking form
11. Booking pages (per `generate-hooks.md` + `generate-booking.md` + `payment.md`):
    - `booking/confirm/page.tsx` — booking confirmation / payment
    - `booking/verify/page.tsx` — payment verification after redirect
12. CMS pages: `about/page.tsx`, `contact/page.tsx`, `blog/page.tsx`, `faq/page.tsx`, `amenities/page.tsx`, `gallery/page.tsx`, `offers/page.tsx` — only sections in `cms_sections` (per `generate-cms.md`)
13. Header + Footer (nav from `cpMenus` via `NEXT_PUBLIC_CMS_ID`)
14. `.env.local`

---

### Page patterns

#### Homepage — `app/[locale]/page.tsx`

The homepage hero must include a room availability search form. The form redirects to `/rooms` with the selected dates as query params — it does **not** call the API directly.

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

function AvailabilityForm() {
  const router = useRouter();
  const locale = useLocale();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    router.push(`/${locale}/rooms?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 bg-white/90 p-6 rounded-2xl shadow-lg">
      <div>
        <label>Check-in</label>
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
      </div>
      <div>
        <label>Check-out</label>
        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
      </div>
      <div>
        <label>Guests</label>
        <input type="number" min={1} max={10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
      </div>
      <button type="submit">Check Availability</button>
    </form>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* Hero with availability form */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center">
        {/* Background image via design tokens */}
        <h1>Welcome</h1>
        <AvailabilityForm />
      </section>

      {/* Other selected sections rendered below hero */}
    </main>
  );
}
```

The rooms listing page reads `checkIn`, `checkOut`, and `guests` from `useSearchParams()` and pre-fills the date picker.

---

#### Rooms listing — `app/[locale]/rooms/page.tsx` (Client Component)

```tsx
"use client";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import { CP_PMS_ROOMS } from "@/graphql/hotel/queries";
import Image from "@/components/common/Image";
import { Link } from "@/i18n/routing";

export default function RoomsPage() {
  const searchParams = useSearchParams();
  // Pre-fill from homepage availability form
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");

  const { data, loading } = useQuery(CP_PMS_ROOMS, {
    variables: {
      pipelineId: process.env.NEXT_PUBLIC_PMS_PIPELINE_ID!,
      startDate: checkIn || undefined,
      endDate: checkOut || undefined,
    },
    skip: !process.env.NEXT_PUBLIC_PMS_PIPELINE_ID,
  });

  const rooms = data?.cpPmsRooms ?? [];

  return (
    <main>
      {/* Date picker */}
      <div className="flex gap-4 mb-8">
        <div>
          <label>Check-in</label>
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div>
          <label>Check-out</label>
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
      </div>

      {/* Room cards */}
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room: { _id: string; name?: string; price?: number; description?: string }) => (
            <Link key={room._id} href={`/rooms/${room._id}?checkIn=${checkIn}&checkOut=${checkOut}`}>
              <div className="rounded-xl border overflow-hidden">
                <Image src={null} alt={room.name ?? ""} width={400} height={260} />
                <div className="p-4">
                  <h3>{room.name}</h3>
                  <p>{room.description}</p>
                  <p className="font-bold">{room.price} / night</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

---

#### Room detail — `app/[locale]/rooms/[id]/page.tsx` (Client Component)

```tsx
"use client";
import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { CP_PMS_CHECK_ROOMS } from "@/graphql/hotel/queries";
import { CP_DEALS_ADD } from "@/graphql/hotel/mutations";
import Image from "@/components/common/Image";

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const router = useRouter();

  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const { data: availData } = useQuery(CP_PMS_CHECK_ROOMS, {
    variables: {
      pipelineId: process.env.NEXT_PUBLIC_PMS_PIPELINE_ID!,
      startDate: checkIn || undefined,
      endDate: checkOut || undefined,
      ids: [id],
    },
    skip: !checkIn || !checkOut,
  });
  const available = availData?.cpPmsCheckRooms?.[0]?.available ?? true;

  const [createDeal, { loading }] = useMutation(CP_DEALS_ADD);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1;

  async function handleBook() {
    const { data } = await createDeal({
      variables: {
        input: {
          name: `${guestName} — Room ${id} ${checkIn} to ${checkOut}`,
          stageId: process.env.NEXT_PUBLIC_BOOKING_STAGE_ID,
          startDate: checkIn,
          closeDate: checkOut,
          description: note,
          extraData: { guestName, email, phone, checkIn, checkOut },
        },
      },
    });
    const dealId = data?.cpDealsAdd?._id;
    if (dealId) router.push(`/booking/confirm?dealId=${dealId}&nights=${nights}`);
  }

  return (
    <main>
      <Image src={null} alt={`Room ${id}`} width={1200} height={500} />
      {!available && <p className="text-red-500">This room is not available for the selected dates.</p>}

      {/* Booking form */}
      <div>
        <p>Check-in: {checkIn} — Check-out: {checkOut} ({nights} nights)</p>
        <input placeholder="Guest name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <textarea placeholder="Special requests" value={note} onChange={(e) => setNote(e.target.value)} />
        <button onClick={handleBook} disabled={loading || !available || !guestName}>Book Now</button>
      </div>
    </main>
  );
}
```

---

#### Booking confirm — `app/[locale]/booking/confirm/page.tsx` (Client Component)

```tsx
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvoice } from "@/lib/hooks/useInvoice";
import { useMutation } from "@apollo/client";
import { CP_DEALS_EDIT } from "@/graphql/hotel/mutations";

export default function BookingConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dealId = searchParams.get("dealId") ?? "";
  const nights = Number(searchParams.get("nights") ?? 1);

  const [advanceDeal] = useMutation(CP_DEALS_EDIT);

  const { create, status } = useInvoice({
    onPaid: async (invoiceId) => {
      await advanceDeal({
        variables: { _id: dealId, input: { stageId: process.env.NEXT_PUBLIC_PAID_STAGE_ID } },
      });
      router.push(`/booking/verify?invoiceId=${invoiceId}`);
    },
  });

  useEffect(() => {
    if (dealId) {
      create({
        amount: nights * 100, // replace with actual room price × nights
        contentType: "sales:deals",
        contentTypeId: dealId,
        paymentIds: (process.env.NEXT_PUBLIC_PAYMENT_IDS ?? "").split(",").filter(Boolean),
        description: "Room booking",
        redirectUri: `${window.location.origin}/booking/verify`,
      });
    }
  }, [dealId]);

  return (
    <main>
      <h1>Booking Summary</h1>
      <p>Status: {status}</p>
      {status === "pending" && <p>Waiting for payment...</p>}
    </main>
  );
}
```

---

#### Booking verify — `app/[locale]/booking/verify/page.tsx` (Client Component)

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInvoice } from "@/lib/hooks/useInvoice";

export default function BookingVerifyPage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId") ?? "";
  const [done, setDone] = useState(false);

  const { check, status } = useInvoice({
    onPaid: () => setDone(true),
    onFailed: () => setDone(true),
  });

  useEffect(() => {
    if (invoiceId) check(invoiceId);
  }, [invoiceId]);

  if (!done) return <p>Verifying payment...</p>;
  if (status === "paid") return <p>Booking confirmed! Thank you.</p>;
  return <p>Payment failed. Please try again.</p>;
}
```

### Step 5 — Seed CMS content

Seed content for every language in `hotel.config.json`. Use real translated text — no placeholders.

**Generate content JSON files first, then run scripts.**

#### Seed JSON contract (enforced by the scripts)

The seed scripts read a **strict subset** of fields. Anything outside it is
silently dropped — no error, no effect.

**Pages (`output/pages.json`)** — only these fields reach `cpPagesCreate`:

| Field | Used | Notes |
|---|---|---|
| `section` | key only | groups the pages in your source file; **not sent** to the mutation |
| `name` | yes | the page title |
| `slug` | yes | identical across all languages |
| `description` | yes | |
| `content` | yes | |
| `translations` | yes | one entry per additional language |
| `title` | **ignored** | use `name` |
| `lang` / `language` | **ignored** | determined by the mutation's language loop |
| `status` | **ignored** | created as a normal published page |
| `meta` / `seo` | **ignored** | **no SEO meta support in the seed scripts** |

**Menu items (`output/menu.json`)**: `label`, `url`, `order`, `kind`
(`"header"` / `"footer"`), `translations`. `kind` is required — items without it
are invisible to `cpMenus(kind:)`.

**Slugs stay identical across languages** so `/mn/about` and `/en/about` resolve
to the same page.

#### 5a. Pages (`output/pages.json`)

For each section in `cms_sections`, generate a page object per language. Include real hotel-specific content (amenities, location, policies). Use `name` — **not** `title` — and do not add `meta`/`seo` keys.

```bash
tsx scripts/erxes-pages.ts output/pages.json
```

#### 5b. Blog posts (`output/posts.json`) — only if `has_blog`

Generate 3 starter posts per language. Use topics relevant to the hotel (e.g. local attractions, travel tips, seasonal offers).

```bash
tsx scripts/erxes-posts.ts output/posts.json
```

#### 5c. Navigation menu (`output/menu.json`)

Generate two menus — `Main Navigation` (header) and `Footer`:

- Header: Home, Rooms, About, Contact, Blog (only existing sections)
- Footer: About, Contact, Blog, FAQ (only existing sections)

Every item needs `"kind"`.

```bash
tsx scripts/erxes-menu.ts output/menu.json
```

### Step 6 — Verify

```bash
cd output/<slug> && pnpm build
```

Fix all TypeScript and ESLint errors. Build must succeed with 0 errors before deploying.

### Step 7 — Deploy

Read `deploy_target` from `hotel.config.json`.

**`vercel`:**

```bash
tsx scripts/deploy.ts "<hotel-name>"
```

**`github`:**

```bash
tsx scripts/github-push.ts "<hotel-name>"
```

---

## Pipeline — Updating an existing hotel site

1. Read `hotel.config.json`
2. Read relevant files in `output/<slug>/`
3. Make only the targeted changes
4. Redeploy: `tsx scripts/deploy.ts "<hotel-name>"`
