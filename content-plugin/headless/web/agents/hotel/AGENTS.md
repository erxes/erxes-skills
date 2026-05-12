# erxes Hotel (PMS) + CMS — Agent Instructions

You build and deploy Next.js hotel websites fully connected to both erxes PMS (rooms, bookings, payments) and erxes CMS (pages, blog, navigation).

Read these files as needed — do not skip them:

| File | Read when |
| ---- | --------- |
| [`setup.md`](setup.md) | Step 0 — hotel-specific fields |
| [`reference.md`](reference.md) | GraphQL queries/mutations, payment flow, env vars |

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
| `agents/hotel/reference.md` | Step 4 + Step 5 | GraphQL queries/mutations, payment flow, env vars checklist |

### Routing from Generic Pipeline

When `template_type = "hotel"` is selected in `agents/setup.md`:

1. **Stop following `agents/setup.md`** after collecting generic fields
2. **Switch to `agents/hotel/AGENTS.md`** immediately
3. **Continue hotel-specific setup** (pipeline_id, stage IDs, payment_ids, allow_guest)
4. **Proceed directly to design (Step 3.5)** after setup is complete

### File Reading Order for Hotel

```
Step 0:  agents/setup.md (generic fields)
         |
         agents/hotel/setup.md (hotel-specific fields)
         |
Step 3.5: agents/pencil-design.md (design directions in Pencil)
         |
Step 4:  agents/conventions.md (generic conventions)
         agents/frontend.md (frontend architecture)
         agents/animations.md (if motion level > 0)
         agents/hotel/reference.md (GraphQL reference + payment flow)
         |
Step 5:  Seed CMS content
         |
Step 6-7: Verify + Deploy
```

---

## Pipeline — New hotel site

### Step 0 — Setup

**If coming from generic pipeline (`agents/setup.md`):**

- Generic fields already collected in `site.config.json`
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

### Step 3.5 — UI design source + direction

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `hotel.config.json`.

**Hard Gate:** Do not generate any design directions until `hotel.config.json` exists and `design_strategy` is set.

Read [`agents/pencil-design.md`](../pencil-design.md) and follow the matching `ui_source` path.

**For `pencil` / `screenshot` / `website`:**
Extract dominant primary color → write to `hotel.config.json` as `color_hint`. Do not ask user.

**If `design_strategy` is `copy-site` or `improve-site`:**
Use `reference_url` from config as the source to copy or improve.

**If `design_strategy` is `beat-competitors`:**
Use `competitor_urls` from config as the competitor audit input.

### Step 4 — Generate code

**Hard Gate:** Do not enter Step 4 until Step 3.5 is fully complete and the user has approved the final design.

**Read these files IN ORDER before writing code:**

1. `agents/hotel/reference.md` — GraphQL queries/mutations, env vars
2. `agents/conventions.md` — generic conventions
3. `agents/frontend.md` — frontend architecture, token system
4. `agents/animations.md` — animation libraries (if motion level > 0)

**Write files in this order:**

1. Dependencies install
2. Types (`types/`)
3. Apollo client + provider
4. Root layout + Providers
5. Auth pages (if `has_auth`): `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
6. Hotel pages:
   - `page.tsx` — homepage with selected sections + availability search form in the hero
   - `rooms/page.tsx` — room listing with availability date picker
   - `rooms/[id]/page.tsx` — room detail with booking form
   - `booking/confirm/page.tsx` — booking confirmation / payment
   - `booking/verify/page.tsx` — payment verification after redirect
7. CMS pages: `about/page.tsx`, `contact/page.tsx`, `blog/page.tsx`, `faq/page.tsx` — only sections in `cms_sections`
8. Header + Footer (nav from `cpMenus` via `NEXT_PUBLIC_CMS_ID`)
9. `.env.local`

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

#### 5a. Pages (`output/pages.json`)

For each section in `cms_sections`, generate a page object per language. Include real hotel-specific content (amenities, location, policies).

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
