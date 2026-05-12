# erxes Tour (BMS) + CMS — Agent Instructions

You build and deploy Next.js tour operator websites fully connected to both erxes BMS (tours, bookings, payments) and erxes CMS (pages, blog, navigation).

Read these files as needed — do not skip them:

| File | Read when |
| ---- | --------- |
| [`setup.md`](setup.md) | Step 0 — tour-specific fields |
| [`reference.md`](reference.md) | GraphQL queries/mutations, payment flow, env vars |

---

## Shared Module Integration

The tour pipeline REUSES modules from the generic `agents/` folder. Do not duplicate — read the shared files at the correct step.

### Shared Files (read at the specified step)

| File | When to Read | Purpose |
| ---- | ------------ | ------- |
| `agents/setup.md` | Step 0 (if starting fresh) | Generic setup — name, languages, tone, design strategy, etc. |
| `agents/pencil-design.md` | Step 3.5 | Pencil design tool usage, direction previews, design tokens |
| `agents/animations.md` | Step 4 (before animation code) | Animation library implementations |
| `agents/frontend.md` | Step 4 (before code generation) | Frontend build phases, token system, component architecture |
| `agents/conventions.md` | Before writing ANY code | Generic code conventions — React/Next.js patterns, Tailwind, TypeScript |

### Tour-Specific Files (always read these)

| File | When to Read | Purpose |
| ---- | ------------ | ------- |
| `agents/tour/setup.md` | Step 0 | Tour-specific fields (branch_id, payment_ids, allow_guest) |
| `agents/tour/reference.md` | Step 4 + Step 5 | GraphQL queries/mutations, payment flow, env vars checklist |

### Routing from Generic Pipeline

When `template_type = "tour"` is selected in `agents/setup.md`:

1. **Stop following `agents/setup.md`** after collecting generic fields
2. **Switch to `agents/tour/AGENTS.md`** immediately
3. **Continue tour-specific setup** (branch_id, payment_ids, allow_guest)
4. **Proceed directly to design (Step 3.5)** after setup is complete

### File Reading Order for Tour

```
Step 0:  agents/setup.md (generic fields)
         |
         agents/tour/setup.md (tour-specific fields)
         |
Step 3.5: agents/pencil-design.md (design directions in Pencil)
         |
Step 4:  agents/conventions.md (generic conventions)
         agents/frontend.md (frontend architecture)
         agents/animations.md (if motion level > 0)
         agents/tour/reference.md (GraphQL reference + payment flow)
         |
Step 5:  Seed CMS content
         |
Step 6-7: Verify + Deploy
```

---

## Pipeline — New tour site

### Step 0 — Setup

**If coming from generic pipeline (`agents/setup.md`):**

- Generic fields already collected in `site.config.json`
- Read `agents/tour/setup.md` and ask ONLY missing tour-specific fields:
  - `branch_id`
  - `payment_ids`
  - `allow_guest`

**If starting fresh:**

- Read `agents/setup.md` first — collect generic fields
- When `template_type = "tour"`, switch to this file
- Then read `agents/tour/setup.md` — collect tour-specific fields

**After all fields collected:**

- Write `tour.config.json`
- Update `.env`
- Create CMS with `tsx scripts/erxes-cms.ts`
- Save returned `_id` as `ERXES_CMS_ID` in `tour.config.json` and `.env`

### Step 1 — Read config

Read `tour.config.json`. Derive:

- `slug` = name lowercased, spaces → hyphens
- `has_auth` = `allow_guest` is false
- `has_blog` = `cms_sections` includes `"blog"`
- `has_contact` = `cms_sections` includes `"contact"`

### Step 2 — Create CMS

```bash
tsx scripts/erxes-cms.ts
```

Calls `cpContentCreateCMS` with `{ name, description, languages, defaultLanguage, clientPortalId }` from `tour.config.json`.

Saves returned `_id` into:
- `tour.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`
- `output/<slug>/.env.local` as both `ERXES_CMS_ID` and `NEXT_PUBLIC_CMS_ID`

### Step 3 — Clone starter

```bash
tsx scripts/clone.ts "<tour-name>"
```

Clones starter repo into `output/<slug>/`. Skips if already exists.

### Step 3.5 — UI design source + direction

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `tour.config.json`.

**Hard Gate:** Do not generate any design directions until `tour.config.json` exists and `design_strategy` is set.

Read [`agents/pencil-design.md`](../pencil-design.md) and follow the matching `ui_source` path.

**For `pencil` / `screenshot` / `website`:**
Extract dominant primary color → write to `tour.config.json` as `color_hint`. Do not ask user.

**If `design_strategy` is `copy-site` or `improve-site`:**
Use `reference_url` from config as the source to copy or improve.

**If `design_strategy` is `beat-competitors`:**
Use `competitor_urls` from config as the competitor audit input.

### Step 4 — Generate code

**Hard Gate:** Do not enter Step 4 until Step 3.5 is fully complete and the user has approved the final design.

**Read these files IN ORDER before writing code:**

1. `agents/tour/reference.md` — GraphQL queries/mutations, env vars
2. `agents/conventions.md` — generic conventions
3. `agents/frontend.md` — frontend architecture, token system
4. `agents/animations.md` — animation libraries (if motion level > 0)

**Write files in this order:**

1. Dependencies install
2. Types (`types/`)
3. Apollo client + provider
4. Root layout + Providers
5. Auth pages (if `has_auth`): `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
6. Tour pages:
   - `page.tsx` — homepage with selected sections
   - `tours/page.tsx` — tour listing with category and date filters
   - `tours/[id]/page.tsx` — tour detail with itinerary and booking form
   - `booking/confirm/page.tsx` — booking summary + payment
   - `booking/verify/page.tsx` — payment verification after redirect
   - `orders/page.tsx` — user's booking history (if `has_auth`)
7. CMS pages: `about/page.tsx`, `contact/page.tsx`, `blog/page.tsx`, `faq/page.tsx` — only sections in `cms_sections`
8. Header + Footer (nav from `cpMenus` via `NEXT_PUBLIC_CMS_ID`)
9. `.env.local`

---

### Page patterns

#### Tours listing — `app/[locale]/tours/page.tsx` (Client Component)

```tsx
"use client";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { CP_BMS_TOURS, CP_BMS_TOUR_CATEGORIES } from "@/graphql/tour/queries";
import Image from "@/components/common/Image";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function ToursPage() {
  const locale = useLocale();
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [name, setName] = useState("");

  const { data: catData } = useQuery(CP_BMS_TOUR_CATEGORIES, {
    variables: { branchId: process.env.NEXT_PUBLIC_BMS_BRANCH_ID, language: locale },
  });

  const { data, loading } = useQuery(CP_BMS_TOURS, {
    variables: {
      branchId: process.env.NEXT_PUBLIC_BMS_BRANCH_ID,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      startDate1: startDate || undefined,
      startDate2: endDate || undefined,
      name: name || undefined,
      language: locale,
    },
  });

  const tours = data?.cpBmsTours ?? [];
  const categories = catData?.cpBmsTourCategories ?? [];

  return (
    <main>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input placeholder="Search tours..." value={name} onChange={(e) => setName(e.target.value)} />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        {categories.map((cat: { _id: string; name?: string }) => (
          <button key={cat._id}
            onClick={() => setCategoryIds((prev) =>
              prev.includes(cat._id) ? prev.filter((id) => id !== cat._id) : [...prev, cat._id]
            )}
            className={categoryIds.includes(cat._id) ? "bg-primary text-white" : "border"}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {/* Tour cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map((tour: { _id: string; name?: string; price?: number; startDate?: string }) => (
          <Link key={tour._id} href={`/tours/${tour._id}`}>
            <div className="rounded-xl border overflow-hidden">
              <Image src={null} alt={tour.name ?? ""} width={400} height={250} />
              <div className="p-4">
                <h3>{tour.name}</h3>
                <p>{tour.startDate}</p>
                <p className="font-bold">{tour.price}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

---

#### Tour detail — `app/[locale]/tours/[id]/page.tsx` (Client Component)

```tsx
"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  CP_BMS_TOUR_DETAIL, CP_BM_TOURS_GROUP, CP_BMS_ITINERARY_DETAIL,
} from "@/graphql/tour/queries";
import { CP_BMS_ORDER_ADD } from "@/graphql/tour/mutations";
import Image from "@/components/common/Image";

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedTourId, setSelectedTourId] = useState(id);
  const [note, setNote] = useState("");

  const { data } = useQuery(CP_BMS_TOUR_DETAIL, {
    variables: { _id: id, branchId: process.env.NEXT_PUBLIC_BMS_BRANCH_ID, language: locale },
  });
  const tour = data?.cpBmsTourDetail;

  const { data: groupData } = useQuery(CP_BM_TOURS_GROUP, {
    variables: { branchId: process.env.NEXT_PUBLIC_BMS_BRANCH_ID, language: locale },
  });
  const departures = groupData?.cpBmToursGroup?.flatMap((g: { tours?: { _id: string; startDate?: string; price?: number }[] }) => g.tours ?? []) ?? [];

  const { data: itineraryData } = useQuery(CP_BMS_ITINERARY_DETAIL, {
    variables: { _id: tour?.itineraryId, language: locale },
    skip: !tour?.itineraryId,
  });
  const itinerary = itineraryData?.cpBmsItineraryDetail;

  const [createOrder, { loading }] = useMutation(CP_BMS_ORDER_ADD);

  async function handleBook() {
    const { data } = await createOrder({
      variables: {
        order: {
          tourId: selectedTourId,
          branchId: process.env.NEXT_PUBLIC_BMS_BRANCH_ID,
          amount: (tour?.price ?? 0) * numberOfPeople,
          numberOfPeople,
          type: "online",
          status: "pending",
          note,
        },
      },
    });
    const orderId = data?.cpBmsOrderAdd?._id;
    if (orderId) router.push(`/booking/confirm?orderId=${orderId}&amount=${(tour?.price ?? 0) * numberOfPeople}`);
  }

  if (!tour) return null;
  return (
    <main>
      <Image src={null} alt={tour.name ?? ""} width={1200} height={500} />
      <h1>{tour.name}</h1>
      <p>{tour.description}</p>

      {/* Departure date picker */}
      <select value={selectedTourId} onChange={(e) => setSelectedTourId(e.target.value)}>
        {departures.map((d: { _id: string; startDate?: string }) => (
          <option key={d._id} value={d._id}>{d.startDate}</option>
        ))}
      </select>

      {/* Itinerary */}
      {itinerary?.days?.map((day: { day?: number; title?: string; description?: string }) => (
        <div key={day.day}>
          <h3>Day {day.day} — {day.title}</h3>
          <p>{day.description}</p>
        </div>
      ))}

      {/* Booking form */}
      <div>
        <input type="number" min={1} value={numberOfPeople} onChange={(e) => setNumberOfPeople(Number(e.target.value))} />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Special requests" />
        <p>Total: {(tour.price ?? 0) * numberOfPeople}</p>
        <button onClick={handleBook} disabled={loading}>Book Now</button>
      </div>
    </main>
  );
}
```

---

#### Booking confirm — `app/[locale]/booking/confirm/page.tsx` (Client Component)

```tsx
"use client";
import { use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvoice } from "@/lib/hooks/useInvoice";

export default function BookingConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") ?? "";
  const amount = Number(searchParams.get("amount") ?? 0);

  const { create, status } = useInvoice({
    onPaid: (invoiceId) => router.push(`/booking/verify?invoiceId=${invoiceId}`),
  });

  useEffect(() => {
    if (orderId && amount) {
      create({
        amount,
        contentType: "bms:order",
        contentTypeId: orderId,
        paymentIds: (process.env.NEXT_PUBLIC_PAYMENT_IDS ?? "").split(",").filter(Boolean),
        description: "Tour booking",
        redirectUri: `${window.location.origin}/booking/verify`,
      });
    }
  }, [orderId, amount]);

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
import { use, useEffect, useState } from "react";
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
  if (status === "paid") return <p>Booking confirmed!</p>;
  return <p>Payment failed. Please try again.</p>;
}
```

### Step 5 — Seed CMS content

Seed content for every language in `tour.config.json`. Use real translated text — no placeholders.

**Generate content JSON files first, then run scripts.**

#### 5a. Pages (`output/pages.json`)

For each section in `cms_sections`, generate a page object per language. Include real tour-operator content (destination guides, company story, booking policies).

```bash
tsx scripts/erxes-pages.ts output/pages.json
```

#### 5b. Blog posts (`output/posts.json`) — only if `has_blog`

Generate 3 starter posts per language. Use topics relevant to the tour operator (e.g. destination highlights, travel tips, seasonal itineraries).

```bash
tsx scripts/erxes-posts.ts output/posts.json
```

#### 5c. Navigation menu (`output/menu.json`)

Generate two menus — `Main Navigation` (header) and `Footer`:

- Header: Home, Tours, About, Contact, Blog (only existing sections)
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

Read `deploy_target` from `tour.config.json`.

**`vercel`:**

```bash
tsx scripts/deploy.ts "<tour-name>"
```

**`github`:**

```bash
tsx scripts/github-push.ts "<tour-name>"
```

---

## Pipeline — Updating an existing tour site

1. Read `tour.config.json`
2. Read relevant files in `output/<slug>/`
3. Make only the targeted changes
4. Redeploy: `tsx scripts/deploy.ts "<tour-name>"`
