# TASK 06 — Booking & Payment Flow

> Scope: how the floating booking bar, availability search, room selection, guest details,
> erxes deal creation, and the payment provider connect into **one flow** — and exactly which
> pieces are swappable.
>
> This report deliberately does **not** re-document the component inventory (`03a-layouts.md` / `03b-features.md`),
> the operations catalog, hooks, or the Jotai store (`.analysis/04-data-layer.md`). Those are
> referenced as `03a/03b §x.y` / `04 §x`. It also does not re-document routing, layout, or i18n
> (`.analysis/01-architecture.md`, `.analysis/05-i18n.md`).
>
> All env values are **redacted**; only env var **names** are given.
> Anything not present in the source is written as `NOT FOUND IN CODE`.
>
> **Canonical starter payment ops (do not use the reference names):** generate with
> `invoiceCreate` (const `INVOICE_CREATE`), `invoicesCheck` (**mutation**, const `INVOICES_CHECK`),
> `paymentTransactionsAdd` (const `PAYMENT_TRANSACTIONS_ADD`), `cpPayments` (const `CP_PAYMENTS`),
> and the `invoiceUpdated`/`transactionUpdated` subscriptions — all in
> `src/graphql/ecommerce/{queries,mutations}/payment.ts`. The `cpInvoiceCreate` / `cpInvoicesCheck` /
> `cpInvoices` names used below are **Tegri Gobi reference names — reference only, do not copy.**
>
> **Canonical payment flow — one QR/`transactions` path, NO redirect/return URL.** Render the QR from
> `invoice.transactions` and confirm by polling `invoicesCheck`. Do **not** send a `redirectUri` and do
> not implement the TDB full-page redirect, its `?paymentReturn=1` query flag, or the
> `localStorage["tdbPaymentReturn"]`/`tdbTourPaymentReturn` return markers (see `_archive/payment.md` §UNVERIFIED
> and `_archive/conventions.md` §6). Any TDB redirect flow described below is **reference only, do not copy.**

## TABLE OF CONTENTS

1. [User Flow](#1-user-flow)
2. [Booking Bar](#2-booking-bar)
3. [Booking State](#3-booking-state)
4. [Erxes Mapping](#4-erxes-mapping)
5. [API Calls In The Flow](#5-api-calls-in-the-flow)
6. [Payment](#6-payment)
7. [Edge Cases](#7-edge-cases)
8. [Sequence Diagram](#8-sequence-diagram)
9. [Swap Points](#9-swap-points)
10. [REPRODUCE vs AVOID Rules](#10-reproduce-vs-avoid-rules)
11. [Brand-Specific Hardcoding Audit](#11-brand-specific-hardcoding-audit)
12. [Open Questions / Uncertainties](#12-open-questions--uncertainties)

---

## 1. USER FLOW

There are **two parallel booking tracks**. They share the payment component
(`src/components/booking/payment/payment-detail.tsx`) but share almost nothing else.

| Track | Trigger | Entry route | Deal pipeline |
|---|---|---|---|
| **A — Room stay** (the core track) | floating booking bar → search results → room pick → details → payment → confirm | `/[locale]/booking`, `/booking/details`, `/booking/payment/[slug]`, `/booking/confirm` | discovered at runtime by display-string match (`PMS board` / `PMS`) |
| **B — Appointment contexts** (activities / dining / spa / merch / tours) | "Book now" on a product/tour card | `/[locale]/<context>/booking`, `/[locale]/<context>/payment/[slug]` | hardcoded literal pipeline ids in `CONTEXT_CONFIG` |

### 1.1 Track A — step by step

| # | Step | Route (locale-prefixed) | `page.tsx` (server, `src/app/[locale]/…`) | Client container | Layout / stepper | State written |
|---|---|---|---|---|---|---|
| 0 | Floating booking bar (search widget) | rendered on 5 pages via `VideoPageLayout` | — | `src/components/layout/Reserve.tsx` | `src/components/clientPages/VideoPageLayout.tsx:101-109` | `reserveAtom` |
| 1 | Availability search + room list | `/booking` | `src/app/[locale]/booking/page.tsx` | `src/components/clientPages/bookingPages/bookingPage.tsx` (`ClientBookingRoomsPage`) | `src/app/[locale]/booking/booking-layout.tsx` + `components/BookingSteps` step **1** | clears `selectedRoomsAtom`, `roomGuestAssignmentsAtom`, sets `currentStepAtom = 1` |
| 1b | Guest/room split per selected room | (same page, right rail) | — | `src/app/[locale]/booking/components/SelectedRoomsCard.tsx` | same | writes `roomGuestAssignmentsAtom` (via `ReservationSummary`) |
| 2 | Guest details + payment option | `/booking/details` | `src/app/[locale]/booking/details/page.tsx` | `src/components/clientPages/bookingPages/bookingDetailsPage.tsx` | step **2** | reads `dealIdAtom`; sets `currentStepAtom = 2`; creates deal |
| 3 | Payment | `/booking/payment/<dealId>?type=half\|full` | `src/app/[locale]/booking/payment/[slug]/page.tsx` (**`generateMetadata` is fully commented out**, lines 8–24) | `src/components/clientPages/bookingPages/bookingPaymentPage.tsx` → `src/components/booking/payment/payment-detail.tsx` | step **3** | sets `currentStepAtom = 3`, **resets `reserveAtom` to defaults** |
| 4 | Confirmation | `/booking/confirm` or `/booking/confirm?type=payAtProperty` | `src/app/[locale]/booking/confirm/page.tsx` (wrapped in `<Suspense>`, because client uses `useSearchParams`) | `src/components/clientPages/bookingPages/bookingConfirmPage.tsx` | step **4** | sets `currentStepAtom = 4`; resets `reserveAtom` (pay-at-property branch only) |

**Step 0 → 1 navigation** is a plain route push, **not** a query-param handoff:

```tsx
// src/components/layout/Reserve.tsx:100-116
async function onSubmit(values: ReserveFormT) {
  setReserve(values);
  if (pathname === "/booking") {
    const trimmedRooms = selectedRooms.filter((_, index) => index < values.roomCount);
    setSelectedRooms(trimmedRooms);
    setRoomGuestAssignments((prev) =>
      prev.filter((assignment) => trimmedRooms.some((room) => room._id === assignment.roomId)),
    );
    await refetchResultRooms();
  } else {
    router.push("/booking");
  }
}
```

So dates/guests/room-count travel **only in the in-memory Jotai `reserveAtom`** (see §3).

**Step 1 → 2**: `SelectedRoomsCard.handleContinueButton()` → `router.push("/booking/details")`
(`src/app/[locale]/booking/components/SelectedRoomsCard.tsx:35-38`). Room ids, dates and
assignments stay in Jotai atoms. **Step 2 → 3**: `bookingDetailsPage.tsx:111-129` creates the
deal and pushes `/booking/payment/${newDealId}?type=${typeParam}` where
`typeParam = "half"` for `paymentOption === "prePayment"`, else `"full"`.

**Guard rails on Track A**

- `src/app/[locale]/booking/booking-layout.tsx:15-19` — if `selectedRooms.length === 0 && !params.slug`
  → `router.push("/booking")`. Effect deps are `[selectedRooms]` only (`params.slug` missing from deps).
- `src/components/clientPages/bookingPages/bookingPage.tsx:88-92` — if `guests.adult === 0 && roomCount === 0`
  (the `reserveAtom` defaults) → renders the "Booking details required" empty panel instead of results.
- `src/components/clientPages/bookingPages/bookingPage.tsx:78-82` — on mount, `selectedRooms` and
  `roomGuestAssignments` are wiped, so reloading `/booking` always starts empty.

### 1.2 Track B — step by step

| # | Step | Route | `page.tsx` | Client container |
|---|---|---|---|---|
| B0 | Product pick | `/activities?productId=…`, `/dining?productId=…`, `/spa-wellness?productId=…`, `/merch/payment?productId=…` | various | links built in `src/components/merch/{FeaturedMerch,MerchHero,MerchProductsCarousel}.tsx` etc. |
| B1 | Guest form | `/<context>/booking?productId=&memberId=&from=&to=` | `src/app/[locale]/<context>/booking/page.tsx` → `<NuqsAdapter><BookingPage context=…/></NuqsAdapter>` | `src/components/clientPages/bookingPage/bookingPage.tsx` (**singular `bookingPage`** — a *different* file from Track A's `bookingPages/bookingPage.tsx`) |
| B1t | Tour variant | `/tours/booking?tourId=&pricingOptionId=&date=&people=` | `src/app/[locale]/tours/booking/page.tsx` | `src/components/clientPages/toursPage/TourBookingPage.tsx` |
| B2 | Payment | `/<context>/payment/<dealId>` | `src/app/[locale]/<context>/payment/[slug]/page.tsx` (server does `getDealDetail(slug)` for metadata on all but tours) | `src/components/appointment/payment/paymentPage.tsx` (`AppointmentPaymentPage`) |
| B2t | Tour payment | `/tours/payment/<orderId>?…` | `src/app/[locale]/tours/payment/[slug]/page.tsx` | `src/components/appointment/payment/tourPaymentPage.tsx` → `tourPaymentDetail.tsx` |
| B3 | Done | returns to `config.returnPath` after 2 s | — | `paymentPage.tsx:360-362` |

Track B handoff is **entirely in the query string** (nuqs `useQueryState` for input,
`URLSearchParams` for the payment hop):

```tsx
// src/components/clientPages/toursPage/TourBookingPage.tsx:328-343
const params = new URLSearchParams({
  tourId, amount: String(total), numberOfPeople: String(values.numberOfPeople),
  email: values.email, phone: values.phone, customer: bookerName,
  ...(dealId ? { dealId } : {}), paymentType: values.paymentType,
  ...(pricingOptionId ? { pricingOptionId } : {}),
  ...(dateRange ? { from: format(dateRange.from, "yyyy-MM-dd"), to: format(dateRange.to, "yyyy-MM-dd") } : {}),
});
router.push(`${config.paymentRoute(order._id)}?${params.toString()}`);
```

`src/components/appointment/bookingContext.ts` is the single table that maps a context to
`{ pipelineId, chargedFor, paymentRoute, returnPath }` — see §4.3.

### 1.3 Which pages render the floating bar

`Reserve` is rendered in exactly **two** places:

1. `src/components/clientPages/VideoPageLayout.tsx:101-109` (when `showReserve !== false`) — used by
   `homePage.tsx`, `aboutUsPage.tsx`, `accommodationPage.tsx`, `lodgeStaysPage.tsx`, `sustainabilityPage.tsx`.
   Positioned `fixed … bottom-4 z-40`, hidden with `opacity-0 pointer-events-none translate-y-full`
   when `useFooterVisibility()` reports the `<footer>` is in view.
2. `src/components/clientPages/bookingPages/bookingPage.tsx:99` → `<Reserve hideCloseButton fixedOpen />`
   (pinned open, no close X, no floating pill).

`Reserve` is **not** in the header, the root layout, or `DefaultPageLayout`.
`NOT FOUND IN CODE`: any global/nested route rendering of the booking bar.

---

## 2. BOOKING BAR

Component: `src/components/layout/Reserve.tsx` (295 lines, `"use client"`).
Full source of the behavioural core:

```tsx
// src/components/layout/Reserve.tsx — structure & control flow (excerpts, verbatim)
const LS_KEY_RESERVE_OPEN = "reserve_open";
const MAX_PEOPLE_PER_ROOM = 4;

type ReserveProps = { className?: string; hideCloseButton?: boolean; fixedOpen?: boolean };

const Reserve = ({ className, hideCloseButton = false, fixedOpen = false }: ReserveProps) => {
  const router = useRouter();
  const pathname = usePathname();                      // from @/i18n/navigation
  const params = useParams();
  const currentLocale = params.locale as string;
  const calendarLocale = currentLocale === "mn" ? mnLocale : enUS;   // date-fns locale

  const t = useTranslations("Reserve");
  const [reserve, setReserve] = useAtom(reserveAtom);
  const [open, setOpen] = useState<boolean>(() => {
    if (fixedOpen) return true;
    if (typeof window === "undefined") return true;    // SSR default = open
    try {
      const saved = window.localStorage.getItem(LS_KEY_RESERVE_OPEN);
      return saved !== null ? saved === "true" : true;
    } catch (_) { return true; }
  });

  const { reserveFormSchema } = useReserveSchemas();
  const [selectedRooms, setSelectedRooms] = useAtom(selectedRoomsAtom);
  const setRoomGuestAssignments = useSetAtom(roomGuestAssignmentsAtom);
  const { loading, refetchResultRooms } = useResultRooms(currentLocale);

  const form = useForm<ReserveFormT>({
    resolver: zodResolver(reserveFormSchema),
    defaultValues: { ...reserve },
  });

  const roomCountValue = form.watch("roomCount");
  const maxPeople = Math.max(roomCountValue || 0, 1) * MAX_PEOPLE_PER_ROOM;

  // onSubmit / onError / effects — see §1.1 block above and §2.3 below
  …
};
```

### 2.1 Structure (fields, in DOM order)

Rendered as one `<form>` inside a `motion.div` panel (`rounded-[25px] sm:rounded-[50px]`, shadow
`0_2px_6.1px_0_rgba(0,0,0,0.25)`), or, when closed, as a fixed pill FAB.

| # | Label key (`Reserve` ns) | Field name | Widget | File |
|---|---|---|---|---|
| 1 | `Check-in` | `startDate` | `DatePicker` (`Calendar` icon) | `src/components/reserve/date-picker.tsx` |
| 2 | `Check-out` | `endDate` | `DatePicker` (`MapPin` icon — icon choice looks accidental) | same |
| 3 | `Room` | `roomCount` | `RoomCounter` | `src/components/reserve/room-counter.tsx` |
| 4 | `Guest` | `guests` (`{adult, child, pet?}`) | `GuestCounter` | `src/components/reserve/guest-counter.tsx` |
| 5 | `Reserve` (submit) | — | `<Button>` + `ArrowRight`, `disabled={loading}` | `Reserve.tsx:255-265` |

Close **X**: `Reserve.tsx:157-167` — an absolutely-positioned `Button` at `-top-2 -right-2` /
`lg:-top-1 lg:right-1`, `aria-label="Close"`, rendered only when `!(hideCloseButton || fixedOpen)`.
It calls `setOpen(false)`; the persist effect then writes `localStorage.reserve_open = "false"`.

Floating pill (the "floating pill behavior"): `Reserve.tsx:270-289` —
`className="inline-flex fixed right-4 z-50 gap-2 items-center px-4 py-2 text-white bg-black rounded-full shadow-lg bottom-18 hover:bg-black/90"`,
keyed `reserve-fab`, with `<Calendar>` + `t("Reserve")`. Clicking it sets `open = true`.
Both branches are inside `<AnimatePresence initial={false} mode="wait">` with spring transitions.

### 2.2 Validation rules

Schema — `src/lib/schema/reserve/index.tsx` (entire file):

```ts
export const useReserveSchemas = () => {
  const t = useTranslations("Reserve")
  const reserveFormSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
    roomCount: z.number().min(1, t("roomCountErrorMessageMin")),
    guests: z.object({
      adult: z.number().min(1, t("adultCountErrorMessageMin")),
      child: z.number(),
      pet: z.boolean().optional(),
    }),
  })
  return { reserveFormSchema }
}
```

| Rule | Enforced where | Notes |
|---|---|---|
| `startDate` / `endDate` must be `Date` | zod | **no** cross-field check that `endDate > startDate` — `NOT FOUND IN CODE` |
| min nights | **NOT FOUND IN CODE** | nothing prevents check-out ≤ check-in in the widget |
| `roomCount ≥ 1` | zod (`roomCountErrorMessageMin`) | |
| `adult ≥ 1` | zod (`adultCountErrorMessageMin`) | `child ≥ 0` implicitly (z.number()) |
| no past dates | `date-picker.tsx:69` → `disabled={(date) => date < startOfDay(new Date())}` | today **is** selectable |
| max people | `Reserve.tsx:98` `maxPeople = Math.max(roomCount \|\| 0, 1) * 4` (`MAX_PEOPLE_PER_ROOM = 4`) | passed to `GuestCounter`; clamps adults first, then children (`guest-counter.tsx:39-52,54-62,118-127`) |
| max adults / max children | `GuestCounter` accepts `maxAdult` / `maxChild` props | **never passed by `Reserve`** → unlimited apart from `maxPeople` |
| children disabled while `adult === 0` | `guest-counter.tsx:127` `disableButtons={!adult}` | |
| `pet` | field exists in the type; **no UI renders it** — `NOT FOUND IN CODE` |
| infants | **NOT FOUND IN CODE** | there is no infant concept anywhere in the codebase |
| max rooms | `RoomCounter` accepts `max`; **`Reserve` never passes it** → `roomCount` unbounded above |
| max guests global | only via `maxPeople` | a user can set 1 room → `maxPeople = 4`; 10 rooms → `maxPeople = 40` |

Errors are surfaced by `showErrors(errors)` from `src/lib/showFormErrors.ts` (sonner toasts),
called from `Reserve.tsx:118-120`.

### 2.3 Navigation, persistence, show/hide

- **Navigation:** `router.push("/booking")` from `@/i18n/navigation` when not already on `/booking`;
  on `/booking` it stays put and refetches availability. **No query params, no searchParams, no
  cookie** — the handoff is purely `reserveAtom`.
- **Open/close persistence:** `localStorage["reserve_open"]` (`"true"`/`"false"`), written by
  `Reserve.tsx:126-133`, read in the `useState` initializer at `Reserve.tsx:74-83`.
  Skipped entirely when `fixedOpen` is true. `try/catch` around every access (private-mode safe).
- **SSR default:** open (`typeof window === "undefined" → true`).
- **Footer overlap:** `VideoPageLayout.tsx:101-108` toggles
  `opacity-0 pointer-events-none translate-y-full` when `useFooterVisibility()` is true.
  `src/lib/hooks/useFooterVisibility.ts` measures `document.querySelector("footer").getBoundingClientRect().top <= window.innerHeight`
  on `scroll` (listener is **not** throttled/rAF'd).
- **Form ⇄ atom sync:** `Reserve.tsx:122-124` `useEffect(() => form.reset({ ...reserve }), [reserve, setReserve])`
  — resets the RHF instance whenever the atom changes (including on mount).
- **Double availability subscription:** `Reserve.tsx:88` calls `useResultRooms(currentLocale)` and
  `bookingPage.tsx:74` calls it again. `cpPmsRooms` is `fetchPolicy: "no-cache"` (`rooms.tsx:120`),
  so on `/booking` the availability query is issued **twice**. See AVOID A-07.

---

## 3. BOOKING STATE

All booking state is **Jotai**. Definition file: `src/store/reserve.ts` (entire file, 21 lines):

```ts
import { IProduct } from "@/types/products";
import { IReserve, IRoomGuestAssignment } from "@/types/reserve";
import { addDays } from "date-fns";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { toCalendarDay } from "@/lib/date";

export const reserveAtomDefaultValues: IReserve = {
  startDate: toCalendarDay(new Date()),
  endDate: toCalendarDay(addDays(new Date(), 1)),
  roomCount: 0,
  guests: { adult: 0, child: 0, pet: false },
};

export const reserveAtom = atom<IReserve>(reserveAtomDefaultValues);
export const selectedRoomsAtom = atom<IProduct[]>([]);
export const roomGuestAssignmentsAtom = atom<IRoomGuestAssignment[]>([]);

export const dealIdAtom = atomWithStorage<string | null>("dealId", null);

export const currentStepAtom = atom<number>(1);
```

`src/store/index.tsx` wraps the app in a plain `<JotaiProvider>` (no `provider`/`WeakMap` trick, no
`atomWithStorage` defaults other than `dealIdAtom`) inside `Providers`.

### 3.1 Atom inventory

| Atom | Type | Persistence | Written by | Read by |
|---|---|---|---|---|
| `reserveAtom` | `IReserve` `{startDate, endDate, roomCount, guests:{adult,child,pet}}` | **memory only** — lost on hard reload | `Reserve.tsx:101` (form submit), `bookingConfirmPage.tsx:35` (reset to defaults, pay-at-property branch), `bookingPaymentPage.tsx:33` (**reset on entering payment**) | `Reserve.tsx:73` (defaults), `bookingPage.tsx:67` (nights/empty state), `useResultRooms` (`rooms.tsx:159`), `useAddDeal.tsx:28`, `useRoomPricing.tsx:22`, `ReservationSummaryWrapper.tsx:30`, `SelectedRoomsCard.tsx:17`, `useSelectedRooms.tsx:17` |
| `selectedRoomsAtom` | `IProduct[]` | memory only | `useSelectedRooms.tsx` (`handleSelectRoom` :22, `handleRemoveRoom` :33, `handleRemoveAllRooms` :40), `bookingPage.tsx:80` (clear on mount), `Reserve.tsx:106` (trim to `roomCount`) | `useCheckRooms` (`rooms.tsx:95` — already-selected rooms are filtered out of availability), `booking-layout.tsx:12` (guard), `SelectedRoomsCard.tsx:18`, `ReservationSummaryWrapper.tsx:29`, `useAddDeal.tsx:29`, `useSelectedRooms.tsx:15` |
| `roomGuestAssignmentsAtom` | `IRoomGuestAssignment[]` `{roomId, adult, child}` | memory only | `ReservationSummary.tsx` `setRoomGuestAssignments` (auto-distribute effect :151-220 and manual `updateRoomAssignment` :238-287), `useSelectedRooms.tsx:34,41`, `bookingPage.tsx:81`, `Reserve.tsx:107` | `ReservationSummary.tsx:101,317`, `useAddDeal.tsx:30`, `ReservationSummaryWrapper` (read path only in `readOnly`) |
| `dealIdAtom` | `string \| null` | **`localStorage["dealId"]`** via `atomWithStorage` | `useAddDeal.tsx:31` `setDealId(null)` — cleared immediately before `cpDealsAdd` (:312); **never set to a real id anywhere** | `bookingDetailsPage.tsx:37` → `cancelPreviousDeal()` (:66-78) |
| `currentStepAtom` | `number` 1..4 | memory only | `bookingPage.tsx:79` (→1), `bookingDetailsPage.tsx:136` (→2), `bookingPaymentPage.tsx:32` (→3), `bookingConfirmPage.tsx:32` (→4) | `booking-layout.tsx:13` → `BookingSteps` |
| `currentConfigAtom` (`src/store/config.ts`) | `IConfig \| null` | memory only | `src/containers/config/currentConfig.tsx:20-24` from `cpPmsBranchDetail` | `bookingDetailsPage.tsx:36,60-61,140-148` (`checkintime` / `checkouttime` defaults) |
| `pricingPlanDetailsAtom` (`src/store/pricing`) | `IPricingPlan[]` | memory only | pricing hooks (04 §6) | `useRoomPricing.tsx:27` |

### 3.2 Reset points (complete list)

| Trigger | What is reset | Where |
|---|---|---|
| `/booking` mount | `selectedRoomsAtom = []`, `roomGuestAssignmentsAtom = []`, `currentStepAtom = 1` | `bookingPage.tsx:78-82` |
| Booking bar submit while already on `/booking` | `selectedRooms` trimmed to `roomCount`; assignments pruned | `Reserve.tsx:103-111` |
| Entering `/booking/payment/[slug]` | `reserveAtom ← reserveAtomDefaultValues` | `bookingPaymentPage.tsx:31-34` |
| `/booking/confirm?type=payAtProperty` mount | `reserveAtom ← reserveAtomDefaultValues` | `bookingConfirmPage.tsx:31-36` |
| Pay-at-property success | `sessionStorage["payAtPropertyConfirmation"]` removed on Continue | `bookingConfirmPage.tsx:57` |
| TDB return marker | `localStorage["tdbPaymentReturn"]` deleted on read (one-shot) | `payment-detail.tsx:84` |
| Before creating a deal | `dealIdAtom ← null` | `useAddDeal.tsx:312` |
| **Never reset** | `roomGuestAssignmentsAtom` on payment/confirm; `dealIdAtom` after a completed booking | — |

**NOT FOUND IN CODE:** any reset of `reserveAtom`/`selectedRoomsAtom` on logout, on a successful
non-pay-at-property confirmation, or on session expiry.

### 3.3 URL / storage carriers (summary)

| Medium | Key / param | Written | Read |
|---|---|---|---|
| `localStorage` | `reserve_open` | `Reserve.tsx:129` | `Reserve.tsx:78` |
| `localStorage` | `dealId` | `atomWithStorage` (`store/reserve.ts:19`) | same |
| `localStorage` | `tdbPaymentReturn` `{dealId, invoiceId, at}` | `payment-detail.tsx:388-395` | `payment-detail.tsx:80-90` (TTL 30 min) |
| `localStorage` | `tdbTourPaymentReturn` `{orderId, invoiceId, dealId, at}` | `tourPaymentDetail.tsx` | `tourPaymentDetail.tsx` (TTL 30 min) |
| `localStorage` | `customerId`, `cachedCustomerId` | `ErxesFormModal.tsx:341` | `ErxesFormModal.tsx:313-316` |
| `sessionStorage` | `token`, `refreshToken`/`refetchToken` | auth (04 §2) | `ApolloClient.tsx:39-47` |
| `sessionStorage` | `payAtPropertyConfirmation` | `bookingDetailsPage.tsx:98-101` | `bookingConfirmPage.tsx:38-41` |
| query | `?type=half\|full` | `bookingDetailsPage.tsx:120-122` | `payment-detail.tsx:106` |
| query | `?paymentReturn=1` — **reference only (TDB redirect); the canonical flow has no return URL** | TDB `redirectUri` (`payment-detail.tsx:315-318`) | `payment-detail.tsx:108`, stripped at :242-246 |
| query | `?forceStatus=` | — (test hook) | `payment-status.ts:39-44` (dev only) |
| query (Track B) | `productId`, `memberId`, `from`, `to`, `tourId`, `pricingOptionId`, `date`, `people`, `amount`, `numberOfPeople`, `email`, `phone`, `customer`, `dealId`, `paymentType` | links / `TourBookingPage.tsx:328-343` | `bookingPage.tsx:28-31`, `tourPaymentPage.tsx:21-30` |

---

## 4. ERXES MAPPING

The backend is **erxes** reached through the client-portal (`cp*`-prefixed) GraphQL API.
Transport/auth setup: 04 §2, `src/app/[locale]/ApolloClient.tsx`.

### 4.1 Every erxes concept used by the flow, by NAME

| erxes concept | GraphQL operation (exact name) | Role in the booking flow | Where |
|---|---|---|---|
| **Board** | `cpSalesBoards` | top container; the PMS board is found by **name equality** | `src/sdk/graphql/sales/queries.ts:150-158`, consumed `src/sdk/queries/sales.tsx:9-17` |
| **Pipeline** | `cpSalesPipelines(boardId, isAll)` → `.list` | rooms live under one pipeline; found by **name equality** | `queries.ts:160-169`, `sales.tsx:19-30` |
| **Stage** | `cpSalesStages(pipelineIds, isAll)` → `{_id, name, code}` | booking lifecycle: `pending`, `payAtProperty`, `confirmed`, `canceled`, `checkedout`, `paid` | `queries.ts:183-191`, lookups listed in §4.4 |
| **Deal** | `cpDealsAdd`, `cpDealsEdit`, `cpDealsChange`, `cpDealsCreateProductsData`, `cpDeals` (list), `cpDealDetail` | **one booking = one deal** | `src/sdk/graphql/sales/mutations.ts`, `queries.ts` |
| **Product (room)** | `cpProducts(pipelineId, boardId, categoryIds, perPage)` | room inventory; `unitPrice`, `discounts`, `categoryId` | `src/sdk/graphql/rooms/queries.ts:3-51` |
| **Product category** | `productCategories(parentId)` | room types | `rooms/queries.ts:53-66` |
| **Deal product line** | `productsData: JSON` on the deal | priced line items (adult line + optional child line) | `useAddDeal.tsx:85-122` |
| **Customer** | `customersMain.list` (find by `searchValue`), `clientPortalUserRegister` (create) | buyer identity | `src/sdk/queries/customers.tsx:13-31`, `src/sdk/mutations/customers.tsx:8-40` |
| **Company** | `companyIds: [String]` on `cpDealsAdd` | B2B accounts (`currentUser.erxesCompanyId`) | `useAddDeal.tsx:266` |
| **Label** | `cpSalesPipelineLabelsAdd(name, colorCode, pipelineId)` | marks origin: `"Website"` (rooms) / `"Web"` (appointment) | `useAddDeal.tsx:161-173`, `useBookingSubmit.tsx:63-73` |
| **Tag** | `cpTagsAdd(name, type: "sales:deal", colorCode)` | payment type: `"Pre payment"` / `"Full payment"` | `src/sdk/mutations/sales.tsx:21-35` |
| **Invoice** | reference: `cpInvoiceCreate(input: InvoiceInput)`, `cpInvoices(contentType, contentTypeId)`, `cpInvoicesCheck(_id)`; **starter:** `invoiceCreate(input)`, `invoicesCheck(_id)` (mutation), `cpPayments` | money record for a deal/order | `src/graphql/ecommerce/{mutations,queries}/payment.ts` |
| **Payment method** | `cpPayments(status, kind)` | selectable gateways (`quickqr`, `qpay`, `tdb`) | `src/sdk/graphql/payments/queries.ts:4-14` |
| **PMS branch** | `cpPmsBranchDetail(_id: <env>)` | `roomCategories`, `departmentId`, `checkintime`, `checkouttime`, `paymentIds`, `pipelineConfig` | `src/sdk/graphql/config/queries.ts:44-78` |
| **PMS occupancy** | `cpPmsRooms(pipelineId, startDate, endDate, skipStageIds)` | which rooms are already taken | `sales/queries.ts:1-22` |
| **PMS check** | `cpPmsCheckRooms(...)` | **defined but never used** — `NOT FOUND IN CODE` (no caller) | `rooms/queries.ts:68-114` |
| **BMS order** | `cpBmsOrderAdd`, `cpBmsOrderEdit` | tours only (order ≠ deal) | `src/sdk/mutations/tms.tsx` |
| **Form / lead** | `cpFormDetail`, `cpWidgetsSaveLead` | pay-at-property pre-auth form | `ErxesFormModal.tsx` |
| **Pipeline detail** | `salesPipelineDetail(_id) { paymentTypes, addExtraService }` | defined, `NOT FOUND IN CODE` (no caller) | `sales/queries.ts:194-200, 218-224` |

### 4.2 How the pipeline / board are found **today** (display-string match)

`src/sdk/queries/sales.tsx:1-37` (entire logic):

```ts
import { OperationVariables, useQuery } from "@apollo/client";
import { queries } from "../graphql/sales";
import { IDealDetail, IStage, ITag } from "@/types/sales";
import { getClient } from "../getClient";

const PMS_BOARD_NAME = "PMS board";
const PMS_PIPELINE_NAME = "PMS";

export const usePipelineId = () => {
  const { data: boardsData, loading: boardsLoading } = useQuery(queries.boards);

  const boards = boardsData?.cpSalesBoards ?? [];
  const boardId = boards.find(
    (board: { name: string }) => board.name === PMS_BOARD_NAME,
  )?._id;

  const { data: pipelinesData, loading: pipelinesLoading } = useQuery(
    queries.pipelines,
    { variables: { boardId, isAll: true }, skip: !boardId },
  );

  const pipelines = pipelinesData?.cpSalesPipelines?.list ?? [];
  const pipelineId = pipelines.find(
    (pipeline: { name: string }) => pipeline.name === PMS_PIPELINE_NAME,
  )?._id;

  return { boardId, pipelineId, loading: boardsLoading || pipelinesLoading };
};
```

Consequences of this design:

- Requires **three sequential round-trips** before any room query can start
  (`cpSalesBoards` → `cpSalesPipelines` → `cpSalesStages` → `cpProducts`/`cpPmsRooms`).
- Renaming the board/pipeline in erxes silently breaks availability search:
  `pipelineId === undefined` → `useRooms` skips (`rooms.tsx:53`) → zero rooms, and
  `useCheckRooms` skips (`rooms.tsx:110`) → zero available.
- `payment-detail.tsx:143-149` has a bespoke `waitForStages()` polling loop (20 × 500 ms ≈ 10 s)
  purely because the redirect-return from the payment provider does a full page reload and the
  stage query may not have resolved yet. Same pattern duplicated in `useTourDeal.tsx:33-40`.
- Because board lookup is by `name` only (not `type`), any other board literally named
  `"PMS board"` would be picked first.

### 4.3 Track B pipelines are literals instead

`src/components/appointment/bookingContext.ts` (entire file):

```ts
export type BookingContext = "activities" | "dining" | "spa" | "merch" | "tours";

export const TOURS_BOARD_ID = "<pipeline-id-REDACTED>";
export const TOURS_PIPELINE_ID = "<pipeline-id-REDACTED>";

export type TourStageCode = "incomplete" | "future" | "canceled" | "ended";

export const TOUR_STAGE_NAMES: Record<TourStageCode, string> = {
  incomplete: "Pending", future: "Confirmed", canceled: "Canceled", ended: "Ended",
};

export const CONTEXT_CONFIG: Record<BookingContext, BookingContextConfig> = {
  activities: { pipelineId: "<pipeline-id-REDACTED>", chargedFor: "activities",
                paymentRoute: (id) => `/activities/payment/${id}`, returnPath: "/activities" },
  dining:     { pipelineId: "<pipeline-id-REDACTED>", chargedFor: "dining",
                paymentRoute: (id) => `/dining/payment/${id}`,     returnPath: "/dining" },
  spa:        { pipelineId: "<pipeline-id-REDACTED>", chargedFor: "spa",
                paymentRoute: (id) => `/spa-wellness/payment/${id}`, returnPath: "/spa-wellness" },
  merch:      { pipelineId: "<pipeline-id-REDACTED>", chargedFor: "merch",
                paymentRoute: (id) => `/merch/payment/${id}`,      returnPath: "/merch" },
  tours:      { pipelineId: TOURS_PIPELINE_ID,       chargedFor: "tours",
                paymentRoute: (id) => `/tours/payment/${id}`,      returnPath: "/tours" },
};
```

> Note `spa.pipelineId` is **also** the value declared as
> `NEXT_PUBLIC_PMS_PIPELINE_ID` in `next.config.ts` — but `process.env.NEXT_PUBLIC_PMS_PIPELINE_ID` is never read (§11).
> Also `TOURS_BOARD_ID` is exported and never imported anywhere (`NOT FOUND IN CODE` usage).

Two further display-string lookups bypass `CONTEXT_CONFIG` entirely:

- `useStagesAppointment` hardcodes a **different literal** pipeline id (`sales.tsx:71-87`, value REDACTED).
- `useStageActivities` hardcodes the **same** pipeline id as `CONTEXT_CONFIG.activities` (`sales.tsx:88-104`) —
  same value as `CONTEXT_CONFIG.activities.pipelineId`, duplicated.

### 4.4 Stage resolution — every lookup

| Stage code / name matched | Purpose | Location |
|---|---|---|
| `code === "pending"` (or env `NEXT_PUBLIC_PENDING_STAGE_ID`) | new room-stay deal before payment | `useAddDeal.tsx:212-220` |
| `code === "payAtProperty"` (or env `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID`) | pay-at-property deal | `useAddDeal.tsx:212-220` |
| `code === "canceled"` | cancel a previous deal before creating a new one; user-facing cancel | `bookingDetailsPage.tsx:66-78`, `CancelBookingDialog.tsx:54`, `bookingDetailsPage.tsx:67-69` |
| `code === "confirmed"` | payment succeeded → move deal here | `payment-detail.tsx:170-172`, `bookingPaymentPage.tsx:37` |
| `code === "checkedout"` | terminal — excludes room from occupancy, blocks cancel | `rooms.tsx:15`, `CancelBookingDialog.tsx:56` |
| `name === "Pending"` (**name**, not code) | Track B new deal | `useBookingSubmit.tsx:161` |
| `code/name.toLowerCase() === "paid"` | Track B payment success | `paymentPage.tsx:308-312` |
| tour `code === "incomplete"` else `name === "Pending"` | tour deal create | `useTourDeal.tsx:24-31, 81` |
| tour `code/name` ∈ {`incomplete`,`future`,`canceled`,`ended`} | tour stage change | `useTourDeal.tsx:107-127` |

### 4.5 What the code *expects* to be configured instead

**`hotel.config.json`: `NOT FOUND IN CODE`.** There is no `hotel.config.json` anywhere in the repo
(no root `hotel.config.json`, no `src/hotel.config.json`, and the string `hotel.config` does not
appear in any `.ts`/`.tsx`/`.json`/`.md` file). Likewise the key names
`pipeline_id`, `booking_stage_id`, `paid_stage_id`, `payment_ids` are **`NOT FOUND IN CODE`**
(they appear nowhere in `src/`).

What the code actually reads today, and what a config file would have to replace:

| Config concern | Current source (hardcoded / discovered) | Suggested config key (proposed, **not present in code**) |
|---|---|---|
| PMS board id | found by `name === "PMS board"` (`sales.tsx:6`) | `board_id` |
| PMS pipeline id | found by `name === "PMS"` (`sales.tsx:7`) | `pipeline_id` |
| Booking (pending) stage id | `process.env.NEXT_PUBLIC_PENDING_STAGE_ID` with `code === "pending"` fallback (`useAddDeal.tsx:212-220`) | `booking_stage_id` |
| Paid stage id | matched `code/name === "paid"` (`paymentPage.tsx:308-312`); **`NEXT_PUBLIC_PAID_STAGE_ID` env exists in `next.config.ts` but is never read** | `paid_stage_id` |
| Pay-at-property stage id | `process.env.NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID` + `code === "payAtProperty"` fallback | `pay_at_property_stage_id` |
| Confirmed stage id | `code === "confirmed"` only, no env | `confirmed_stage_id` |
| Canceled / checked-out stage ids | `code === "canceled"` / `"checkedout"` only | `canceled_stage_id`, `checkedout_stage_id` |
| Payment method ids | `cpPayments(status:"active")` — **the branch's own `paymentIds` field is fetched but never used** (`types/config.ts:21`, `config/queries.ts:15,60`; no consumer) | `payment_ids` |
| Track B pipelines | 5 literal ids in `bookingContext.ts` | `contexts.<name>.pipeline_id` |
| PMS branch id | `process.env.NEXT_PUBLIC_PMS_TOKEN` | `pms_branch_id` |
| Department id | `cpPmsBranchDetail.departmentId` (discovered) | — (server-derived) |

### 4.6 Deal lifecycle as erxes sees it

```
cpSalesBoards ──name="PMS board"──▶ boardId
boardId ──cpSalesPipelines──▶ pipelineId (name="PMS")
pipelineId ──cpSalesStages──▶ stageIds by code
stageId (pending|payAtProperty) ──cpDealsAdd──▶ deal {_id, number}
   ├─ customerIds / companyIds      (from cpCustomerFind / clientPortalUserRegister)
   ├─ labelIds  ["Website"]         (cpSalesPipelineLabelsAdd, created on demand)
   ├─ tagIds    ["Pre payment"|"Full payment"]  (cpTagsAdd, created on demand)
   ├─ productsData JSON             (room line + child line, amount computed client-side)
   ├─ startDate / closeDate         (check-in / check-out)
   └─ description (plain text)      (guest summary, nights, discounts, total)
       │
       ├─ payment: cpInvoiceCreate {contentType:"sales:deal", contentTypeId: dealId}
       │             └─ cpInvoicesCheck(poll) ──status paid──▶ cpDealsChange → confirmed
       └─ pay-at-property: cpDealsChange → payAtProperty (no invoice)
```

Stage moves use `cpDealsChange(itemId, destinationStageId, sourceStageId)`
(`src/sdk/graphql/sales/mutations.ts:102-117`, hook `src/sdk/mutations/sales.tsx:37-51`).

---

## 5. API CALLS IN THE FLOW

Everything below goes through the Apollo client in `src/app/[locale]/ApolloClient.tsx`
(`httpLink` → `NEXT_PUBLIC_ERXES_API_URL`; subscriptions → `NEXT_PUBLIC_MAIN_SUBS_DOMAIN`;
**not used by any payment/booking operation** — all are queries or mutations).
Only `fetchPolicy` values are given; `refetchWritePolicy` defaults to Apollo's default.

### 5.1 Phase — reservation search (booking bar submit → `/booking`)

| # | Phase | Op (exact) | File:line | Key variables | `fetchPolicy` | Cacheable |
|---|---|---|---|---|---|---|
| 1 | resolve board | `cpSalesBoards` | `src/sdk/graphql/sales/queries.ts:150-158` | none | default | yes |
| 2 | resolve pipeline | `cpSalesPipelines` | `sales/queries.ts:160-169` | `{boardId, isAll:true}` | default | yes |
| 3 | resolve stages | `cpSalesStages` | `sales/queries.ts:183-191` | `{pipelineIds:[pipelineId], isAll:true}` | default | yes |
| 4 | room catalog | `cpProducts` | `src/sdk/graphql/rooms/queries.ts:3-51` | `{perPage:500, pipelineId, boardId, categoryIds}` | default | yes |
| 5 | room categories | `productCategories` | `rooms/queries.ts:53-66` | `{parentId: PARENT_CATEGORY_ID}` | default | yes |
| 6 | branch config | `cpPmsBranchDetail` | `src/sdk/graphql/config/queries.ts:44-78` | `{_id: NEXT_PUBLIC_PMS_TOKEN}` | `cache-and-network` | yes (04 §4) |
| 7 | availability | `cpPmsRooms` | `sales/queries.ts:1-22` | `{pipelineId, startDate, endDate, skipStageIds}` | **`no-cache`** | no |
| 8 | board/pipeline detail (pricing) | `cpSalesPipelines` (via `usePipelineId`) | `sales/queries.ts:160-169` | `{boardId, isAll:true}` | default | yes |
| 9 | current user | `currentUser` | `src/sdk/graphql/auth/queries.ts` | — | default | yes |
| 10 | reviews / CMS (page level) | `cmsPostsBySlug`, `reviews*` | `src/sdk/graphql/cms/queries.ts` | locale-dependent | default | yes |

Ops 1–3 are a **hard serial chain**: 2 skips while `!boardId`, 3 skips while `!pipelineId`
(`sales.tsx:14, 26-27`). `src/sdk/queries/rooms.tsx:53` `useRooms` skips while
`!pipelineId || roomCategoryIds.length === 0`; `rooms.tsx:110` `useCheckRooms` skips while
`!pipelineId || roomIds.length === 0`.

**`skipStageIds`** = ids of stages whose `code ∈ {"canceled","checkedout"}`
(`rooms.tsx:15` → `TERMINAL_STAGE_CODES`), i.e. cancelled/checked-out stays do **not** block
a room; a `confirmed`/`pending` stay **does**.

`useResultRooms` (`rooms.tsx:159-189`) is the composed hook returning
`{rooms, availableRooms, loading, refetchResultRooms}`:
`availableRooms = rooms.filter(not occupied).filter(not already in selectedRooms)`.

### 5.2 Phase — `/booking/details` (deal creation)

Called from `src/sdk/hooks/useAddDeal.tsx:204-324` in this order:

| # | Op (exact) | Guarded by | Purpose |
|---|---|---|---|
| 1 | `cpSalesPipelineLabelsAdd` | labels list has no `name.toLowerCase()==="website"` (`useAddDeal.tsx:161-173`) | creates the `"Website"` label once, color `#ff6900` |
| 2 | `cpTagsAdd(type:"sales:deal")` | tags list has no `Pre payment`/`Full payment` (`:175-185`, hook `src/sdk/mutations/sales.tsx:21-35`) | creates the payment-type tag once (`#63D2D6` / `#4BBF6B`) |
| 3 | `customersMain.list` (`type:"lead"`) | not logged in (`queries/customers.tsx:14-26`, `fetchPolicy:"no-cache"`) | find customer by email — **takes `list[0]`, no email equality check** |
| 4 | `clientPortalUserRegister` | step 3 found nothing (`mutations/customers.tsx:11-41`) | creates a cp user + its `erxesCustomerId`; random password via `src/lib/password-generater` |
| 5 | **`cpDealsAdd`** | after `setDealId(null)` (`:312`) and `stageId` exists (`:314-317`) | creates the booking deal |

`variables` built at `useAddDeal.tsx:240-303`:

```ts
{
  productsData,        // JSON lines, see below
  stageId,             // env NEXT_PUBLIC_PENDING_STAGE_ID | env NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID | stage.code match
  startDate, closeDate,// check-in / check-out
  description,         // plain text: note, room:adult/child lines, "N night(s)", discounts, "Total amount: N"
  labelIds: [labelId],
  tagIds:   [tagId],
  name,                // user full name, or `${firstName} ${lastName}`, or company username
  customerIds?: [erxesCustomerId],
  companyIds?:  [erxesCompanyId],
}
```

Product line shape (`useAddDeal.tsx:85-122`) — one **room** line plus an optional **child** line:

```ts
{
  productId, name, startDate, endDate,
  unitPrice,                 // from useRoomPricing.getRoomUnitPrice
  quantity: nights,          // Math.max(1, differenceInCalendarDays(end, start))
  amount: applyDiscountRate(unitPrice * assignment.adult * nights, match?.rate),
  uom, tickUsed: true,
  information: { adults, children },
}
```
Child line: `quantity = assignment.child * nights`, priced from
`useChildProduct.getChildUnitPrice(room.name)` (`src/sdk/queries/products.tsx`), child-specific
discount rate; only emitted when `assignment.child > 0 && childProduct?._id`.

**Important:** the price is computed **entirely on the client** and sent as `amount`/`unitPrice`.
There is no server-side price recomputation call in this flow — `NOT FOUND IN CODE`.

Pay-at-property branch (`onAtPropertySuccess`, `bookingDetailsPage.tsx:80-109`) additionally
stores a confirmation blob in `sessionStorage[PAY_AT_PROPERTY_CONFIRMATION_KEY]` and skips
invoice creation entirely (goes straight to `/booking/confirm?type=payAtProperty`).

### 5.3 Phase — `/booking/payment/[slug]`

| # | Op (exact) | File | When |
|---|---|---|---|
| 1 | `cpDealDetail(_id)` | `sales/queries.ts` (`useDealDetail`) | mount, `bookingPaymentPage.tsx:27` |
| 2 | `cpSalesBoards` → `cpSalesPipelines` → `cpSalesStages` | chained (§5.1 #1-3) | mount (`useStages` in `payment-detail.tsx:131`) |
| 3 | `cpPayments(status:"active")` | `payments/queries.ts:4-14` | mount (`payment-detail.tsx:113`) |
| 4 | `cpInvoices(contentType:"sales:deal", contentTypeId)` | `payments/queries.ts:46-54` | mount + on every "Proceed to Payment" (`:151-153`, `:302-308`, both `fetchPolicy:"no-cache"`) |
| 5 | `invoiceDetail(_id)` | `payments/queries.ts:16-44` | only if an invoice already exists (`:340-344`, `no-cache`) |
| 6 | **`invoiceCreate(input)`** (const `INVOICE_CREATE`; reference: `cpInvoiceCreate`) | `src/graphql/ecommerce/mutations/payment.ts` | `createNewInvoice()` (`:320-338`) |
| 7 | **`invoicesCheck(_id)`** (const `INVOICES_CHECK`, mutation; reference: `cpInvoicesCheck`) | `src/graphql/ecommerce/mutations/payment.ts` | polling — see §6.4 |
| 8 | `cpDealsChange(itemId, destinationStageId, sourceStageId)` | `sales/mutations.ts:102-117` | on success → `code === "confirmed"` (`payment-detail.tsx:176-180`) |

`InvoiceInput` fields actually sent (`src/sdk/mutations/payments.tsx:50-61`):

```ts
{
  amount,                                  // > 0 validated at :37-41
  currency: currency || "MNT",
  contentType: "sales:deal",
  contentTypeId: dealDetail._id,
  paymentIds: [payment._id],
  description,                             // "Full payment" | "50% deposit"
  phone: dealDetail.customers[0].primaryPhone  ?? "",
  email: dealDetail.customers[0].primaryEmail  ?? "",
  // NO redirectUri — the canonical flow is QR/transactions (see the top note + `_archive/payment.md`).
  // The reference project set redirectUri only for kind==="tdb"; do not reproduce it.
}
```

> ⚠ `invoicesCheckMutation` imported from `src/components/appointment/graphql/mutations/invoice.ts`
> is a **different** document than `payments/mutations.checkInvoice`, though both resolve to
> `cpInvoicesCheck(_id)`. Track A/B room flow uses `payments/mutations`; `paymentPage.tsx:301`
> (Track B) uses the appointment copy. See 04 §4.

### 5.4 Phase — Track B (activities / dining / spa / merch / tours)

| # | Op | Where | Note |
|---|---|---|---|
| 1 | `cpProducts` (`useProducts`, context-scoped) | `src/components/appointment/hooks/*` | product list for the context |
| 2 | `cpSalesStages(pipelineIds:[CONTEXT_CONFIG[ctx].pipelineId])` | `useSalesStages` (`sales.tsx`) | **no board/pipeline lookup** — literal id |
| 3 | `customersMain.list` / `clientPortalUserRegister` | `useFindCustomer` / `useAddCpUser` | same as §5.2 |
| 4 | `cpDealsAdd` (label `"Web"` `#eb144c`) | `useBookingSubmit.tsx:63-73, 161-...` | stage by **`name === "Pending"`** (`:161`) |
| 5 | `cpBmsOrderAdd` | `src/sdk/mutations/tms.tsx` | **tours only**, `TourBookingPage.tsx:270-283` — creates an *order* in parallel with the deal |
| 6 | `invoiceCreate` / `invoicesCheck` / `cpDealsChange` → `code/name === "paid"` | `paymentPage.tsx:301-318`, `tourPaymentDetail.tsx` | Track B uses stage **`paid`**, Track A uses **`confirmed`**. (Reference used `cpInvoiceCreate`/`cpInvoicesCheck`.) |
| 7 | `cpBmsOrderEdit` | `tourPaymentDetail.tsx:9` | marks the BMS order paid after the deal is paid |

### 5.5 Calls present in the repo but **not** used by this flow

- `cpPmsCheckRooms` — `src/sdk/graphql/rooms/queries.ts:68-114`. `NOT FOUND IN CODE` (no caller).
- `salesPipelineDetail` — `src/sdk/graphql/sales/queries.ts:194-200, 218-224`. `NOT FOUND IN CODE`.
- `cpPmsBranchDetail.paymentIds` — fetched (`config/queries.ts:15,60`) but never consumed;
  payment methods come from `cpPayments` instead. See `types/config.ts:21`.
- `usePayments(kind?)` accepts a `kind` filter but **no caller passes it** (`queries/payments.tsx:5`).
- `useInvoiceIdByDealId` / `useInvoiceDetail` hooks in `queries/payments.tsx:15-38` — used by
  Track B (`paymentPage.tsx:300`); `payment-detail.tsx` uses its own `useLazyQuery` copies.

---

## 6. PAYMENT

### 6.1 Component map

```
src/components/booking/payment/
├── payment-detail.tsx        563 L  ← the orchestrator (shared by Track A and Track B)
├── PaymentMethodSelector.tsx 101 L  ← full source §6.2
├── PaymentQrDialog.tsx       132 L  ← full source §6.3
├── PaymentCheckingDialog.tsx  49 L  ← full source §6.3
├── PaymentSuccessDialog.tsx   60 L  ← full source §6.3
├── PaymentFailedDialog.tsx    77 L  ← full source §6.3
└── PaymentTdbDialog.tsx       88 L  ← FULL SOURCE below; DEAD — imported nowhere
```

`PaymentTdbDialog` has **zero imports** in the repo (`grep -r "PaymentTdbDialog"` → only its own file).
The TDB card flow was rewritten to `window.location.assign(...)` + the checking dialog.

**Mount sites of `PaymentDetail` (4 total):**

| Consumer | Props |
|---|---|
| `bookingPaymentPage.tsx:65-69` | `reconciliationOnly` when `dealDetail.paymentsData && stage.code !== "confirmed"` |
| `bookingPaymentPage.tsx:73` | default (full widget) when no `paymentsData` |
| `appointment/payment/paymentPage.tsx:446-451` | `onPaymentConfirmed={finalizeAppointmentPayment}`, `successPath=CONTEXT_RETURN_PATH[context]` |
| `appointment/payment/tourPaymentDetail.tsx` | its own copy of the whole flow (§6.6) |

`reconciliationOnly` hides only the method selector + submit button
(`payment-detail.tsx:489-527`); **the mount-effect return-check still runs** (`:224-294`), so a
revisit to an already-paid deal re-polls and can flip the stage.

### 6.2 `PaymentMethodSelector.tsx` — FULL SOURCE

```tsx
"use client";

import { IPayment } from "@/types/payments";
import { CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_META: Record<string, { label: string; icon: React.ReactNode }> = {
  quickqr: { label: "QPay / QuickQR", icon: <QrCode className="w-5 h-5" /> },
  qpay: { label: "QPay", icon: <QrCode className="w-5 h-5" /> },
  tdb: { label: "Card", icon: <CreditCard className="w-5 h-5" /> },
};

const PaymentMethodSelector = ({
  payments,
  selectedId,
  onSelect,
  loading,
}: {
  payments: IPayment[];
  selectedId: string;
  onSelect: (payment: IPayment) => void;
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-500">No payment methods available.</p>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => {
        const meta = KIND_META[payment.kind] || {
          label: payment.name || payment.kind,
          icon: <CreditCard className="w-5 h-5" />,
        };
        const selected = selectedId === payment._id;
        return (
          <button
            type="button"
            key={payment._id}
            onClick={() => onSelect(payment)}
            className={cn(
              "group w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-600 group-hover:bg-gray-200",
              )}
            >
              {meta.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {meta.label}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {payment.name}
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors",
                selected ? "border-primary" : "border-gray-300",
              )}
            >
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-transform",
                  selected ? "bg-primary scale-100" : "scale-0",
                )}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
```

Notes: **the three `KIND_META` labels are hardcoded English**, not `useTranslations`.
Unknown `kind` falls back to `payment.name || payment.kind` with a card icon. The empty state
string `"No payment methods available."` is also hardcoded (not from the `Payment` namespace).

### 6.3 The four live dialogs — FULL SOURCE

#### `PaymentCheckingDialog.tsx` (49 lines)

```tsx
"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

const PaymentCheckingDialog = ({ open, onClose }: {
  open: boolean; onClose: () => void;
}) => {
  const tPayment = useTranslations("Payment");

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="w-full max-w-sm p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="sr-only">{tPayment("Checking payment info")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-2 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
            <Loader2 className="w-9 h-9 animate-spin text-primary" />
          </div>
          <p className="text-base font-medium text-foreground max-w-xs">
            {tPayment("Checking payment info")}
          </p>
          <Button className="w-full max-w-[200px]" onClick={onClose}>
            {tPayment("Close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCheckingDialog;
```

#### `PaymentSuccessDialog.tsx` (60 lines)

```tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const PaymentSuccessDialog = ({ open, orderNumber, onClose }: {
  open: boolean; orderNumber?: string; onClose: () => void;
}) => {
  const tPayment = useTranslations("Payment");

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="w-full max-w-sm p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6" />
        <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-2 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary">
            <Check className="w-9 h-9 text-primary-foreground" strokeWidth={3} />
          </div>

          <DialogTitle className="text-lg font-semibold text-foreground">
            {tPayment("Payment paid successfully")}
          </DialogTitle>

          {orderNumber && (
            <div className="w-full rounded-2xl border border-border bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">{tPayment("Order number")}</p>
              <p className="text-base font-bold text-foreground">#{orderNumber}</p>
            </div>
          )}

          <Button className="w-full" onClick={onClose}>{tPayment("Close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessDialog;
```

#### `PaymentFailedDialog.tsx` (77 lines)

```tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Clock, XCircle } from "lucide-react";

const PaymentFailedDialog = ({ open, status, onRetry, onClose }: {
  open: boolean;
  /** normalized failure status, e.g. "expired" | "refused" */
  status: string | null;
  onRetry?: () => void;
  onClose: () => void;
}) => {
  const tPayment = useTranslations("Payment");

  const isExpired = status === "expired";
  const title = isExpired
    ? tPayment("Payment expired")
    : status === "refused" || status === "declined"
      ? tPayment("Payment refused")
      : tPayment("Payment failed");
  const description = isExpired
    ? tPayment("Payment expired description")
    : status === "refused" || status === "declined"
      ? tPayment("Payment refused description")
      : tPayment("Payment failed description");

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="w-full max-w-sm p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6" />
        <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-2 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50">
            {isExpired ? (
              <Clock className="w-9 h-9 text-red-500" />
            ) : (
              <XCircle className="w-9 h-9 text-red-500" />
            )}
          </div>

          <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground max-w-xs">{description}</p>

          <div className="flex w-full flex-col gap-2">
            {onRetry && (
              <Button className="w-full" onClick={onRetry}>{tPayment("Retry")}</Button>
            )}
            <Button variant="outline" className="w-full" onClick={onClose}>
              {tPayment("Close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentFailedDialog;
```

`onRetry` is passed only when a payment method is already selected
(`payment-detail.tsx:556`), so **a failure during the very first attempt shows no Retry button**.

#### `PaymentQrDialog.tsx` (132 lines) — full source

```tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { getCurrencySymbol } from "@/lib/utils";
import { useTranslations } from "next-intl";

type BankLink = { name: string; description: string; logo: string; link: string };
type ParsedResponse = { qrData?: string; amount?: number | string; currency?: string; urls?: BankLink[] };

const PaymentQrDialog = ({ open, onOpenChange, parsedResponse, amount, currency, pollCapped, onCheckAgain }: {
  open: boolean;
  onOpenChange: (state: boolean) => void;
  parsedResponse: ParsedResponse | null;
  amount: number;
  currency: string;
  pollCapped: boolean;
  onCheckAgain: () => void;
}) => {
  const tPayment = useTranslations("Payment");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-base">{tPayment("Payment Section")}</DialogTitle>
        </DialogHeader>

        {!parsedResponse ? (
          <div className="py-12 flex justify-center"><Loader /></div>
        ) : (
          <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-2">
            <p className="text-2xl font-semibold text-gray-900">
              {getCurrencySymbol(parsedResponse.currency ?? currency)}
              {Number(parsedResponse.amount ?? amount).toLocaleString()}{" "}
              <span className="text-base font-normal text-gray-500">
                {parsedResponse.currency ?? currency}
              </span>
            </p>

            <div className="rounded-2xl border border-gray-200 p-3 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={parsedResponse.qrData} alt="QR Code" className="w-56 h-56 mx-auto" />
            </div>

            <p className="text-sm text-gray-500 text-center max-w-xs">
              {tPayment("Scan QR instruction")}
            </p>

            {Array.isArray(parsedResponse.urls) && parsedResponse.urls.length > 0 && (
              <div className="md:hidden w-full">
                <p className="text-xs text-gray-400 text-center mb-2">{tPayment("Or choose bank")}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {parsedResponse.urls.map((u) => (
                    <a key={u.name} href={u.link}
                       className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.logo} alt={u.name}
                           className="w-10 h-10 rounded-md object-contain"
                           onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span className="text-xs text-center leading-tight text-gray-700">{u.description}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {pollCapped && (
              <div className="flex flex-col items-center gap-2 pt-1">
                <p className="text-sm text-gray-500">{tPayment("Still waiting")}</p>
                <Button variant="outline" size="sm" onClick={onCheckAgain}>
                  {tPayment("Check again")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentQrDialog;
```

> The QR `img src={parsedResponse.qrData}` is a **data-URI string returned by the provider**
> (the payment gateway returns `qrData` as an `<img>`-loadable payload). It is rendered
> unescaped; the bank links (`urls[].link`) are rendered as raw `href` values from the
> provider response with no allow-list.

#### `PaymentTdbDialog.tsx` (88 lines) — FULL SOURCE, **dead code**

```tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

const PaymentTdbDialog = ({ open, onOpenChange, url, amount, currency, pollCapped, onCheckAgain }: {
  open: boolean;
  onOpenChange: (state: boolean) => void;
  url: string;
  amount: number;
  currency: string;
  pollCapped: boolean;
  onCheckAgain: () => void;
}) => {
  const tPayment = useTranslations("Payment");

  const reopen = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-base">{tPayment("Payment Section")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-2 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="w-7 h-7" />
          </div>

          <p className="text-2xl font-semibold text-gray-900">
            {getCurrencySymbol(currency)}
            {amount.toLocaleString()}{" "}
            <span className="text-base font-normal text-gray-500">{currency}</span>
          </p>

          <p className="text-sm text-gray-600 max-w-sm">
            {tPayment("Complete payment in the new tab")}
          </p>

          {!pollCapped && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{tPayment("Waiting for payment")}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full pt-2">
            <Button variant="outline" className="w-full" onClick={reopen}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {tPayment("Re-open payment tab")}
            </Button>

            {pollCapped && (
              <Button variant="secondary" className="w-full" onClick={onCheckAgain}>
                {tPayment("Check again")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentTdbDialog;
```

### 6.4 Status polling — COMPLETE REFERENCE

There are **four independent pollers**. None share code except `src/lib/payment-status.ts`.

#### 6.4.1 State normalizer — `src/lib/payment-status.ts` (entire file)

```ts
// Invoice status helpers shared by the booking + tour payment flows.
// TDB reports the outcome of a hosted-page order through the invoice status,
// so a terminal failure ("Expired", "Refused") has to stop polling instead of
// waiting out the timeout.

export const isPaidStatus = (status: any) =>
  status === true ||
  (typeof status === "string" &&
    ["paid", "complete"].includes(status.toLowerCase()));

const FAILED_STATUSES = [
  "expired", "refused", "declined", "canceled", "cancelled", "failed", "error",
];

/**
 * Returns the normalized failure status ("Expired", "Refused", ...) when the
 * invoice check reports a terminal failure, otherwise null.
 */
export const getFailedStatus = (status: any): string | null => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[payment] cpInvoicesCheck status:", status);
  }
  if (typeof status !== "string") return null;
  const normalized = status.trim().toLowerCase();
  return FAILED_STATUSES.includes(normalized) ? normalized : null;
};

/**
 * Dev-only escape hatch: `?forceStatus=expired` on a payment page makes the
 * return flow behave as if the invoice check reported that failure, so the
 * failed dialog can be exercised without a real expired TDB invoice.
 */
export const getForcedFailedStatus = (): string | null => {
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window === "undefined") return null;
  const forced = new URLSearchParams(window.location.search).get("forceStatus");
  return forced ? getFailedStatus(forced) : null;
};
```

- `isPaidStatus`: `true`, `"paid"`, `"complete"` (case-insensitive).
- `getFailedStatus`: returns the **lower-cased** status string; `console.log` on every call
  in non-production.
- `getForcedFailedStatus`: dev-only test hook, `?forceStatus=<failedStatus>`.

#### 6.4.2 Poller A — **QR dialog poller** (`payment-detail.tsx:417-454`)

Runs while `qrOpen && resolvedInvoiceId`.

```ts
pollCount.current = 0;
setPollCapped(false);
const MAX_POLLS = 100; // ~5 minutes at 3s interval

pollRef.current = setInterval(async () => {
  pollCount.current += 1;
  if (pollCount.current > MAX_POLLS) {
    clearInterval(pollRef.current!);
    pollRef.current = null;
    setPollCapped(true);            // → "Still waiting" + "Check again" in PaymentQrDialog
    return;
  }
  try {
    const result = await handleCheckInvoice(resolvedInvoiceId);
    const status = result?.data?.cpInvoicesCheck;
    if (isPaidStatus(status)) { clearInterval(pollRef.current!); pollRef.current = null; await finalizeAsPaid(); return; }
    const failed = getFailedStatus(status);
    if (failed) finalizeAsFailed(failed);
  } catch { /* silent */ }
}, 3000);
```

- **Interval 3000 ms, cap 100 iterations (~5 min).**
- Effect deps `[qrOpen, resolvedInvoiceId]`; cleanup clears the interval.
- **No pause while the dialog is closed** other than via `qrOpen` deps.
- Errors are swallowed (`catch {}`), so a network outage just burns the budget.

#### 6.4.3 Poller B — **TDB return poller** (`payment-detail.tsx:272-289`) — **reference only, do not copy; the canonical QR/`transactions` flow has no Poller B**

Runs on mount when a return marker exists or `?paymentReturn=1`.

```ts
const RETURN_MAX_CHECKS = 20; // ~1 minute at 3s interval
for (let i = 0; i < RETURN_MAX_CHECKS; i++) {
  if (returnCancelRef.current) return;
  const result = await handleCheckInvoice(invoiceId);
  const status = result?.data?.cpInvoicesCheck;
  if (isPaidStatus(status)) { await finalizeAsPaid(); return; }
  const failed = getFailedStatus(status);
  if (failed) { finalizeAsFailed(failed); return; }
  await new Promise((resolve) => setTimeout(resolve, 3000));
}
setCheckingOpen(false);
toast.error(tPayment("Payment not confirmed yet"));
```

- **Sequential `await` loop, 20 × 3 s ≈ 60 s** (plus request time).
- `returnCancelRef.current = true` is set by `handleCheckingClose` (:218-221) and
  `finalizeAsFailed` (:198-207) — closing the checking dialog aborts the loop.
- On timeout: dialog closes + toast `"Payment not confirmed yet"`. **The invoice is left as-is**;
  no stage change, no user-facing retry CTA.

#### 6.4.4 Poller C — **on-mount single check** (`payment-detail.tsx:264-269`)

Non-return path with an existing invoice:

```ts
const result = await handleCheckInvoice(invoiceId);
if (isPaidStatus(result?.data?.cpInvoicesCheck)) await finalizeAsPaid();
return;
```

**One shot, no interval.** Used so that revisiting `/booking/payment/<dealId>` after paying
outside the tab still finalizes.

#### 6.4.5 Poller D — **Track B invoice poller** (`appointment/payment/paymentPage.tsx:320-336`)

```ts
useEffect(() => {
  if (!invoiceId) return;
  pollRef.current = setInterval(async () => {
    try {
      const { data } = await checkInvoice({ variables: { id: invoiceId } });
      if (isPaidStatus(data?.cpInvoicesCheck)) { clearInterval(pollRef.current!); refetch(); }
    } catch {}
  }, 3000);
  return () => { if (pollRef.current) clearInterval(pollRef.current); };
}, [invoiceId]);
```

- **No max-poll cap at all.** Polls forever until paid (or unmounted).
- Does **not** call `getFailedStatus` → an `Expired`/`Refused` invoice keeps polling indefinitely.
- On paid it only `refetch()`es the deal; the stage change is done by a *separate* effect
  (`:338-364`) guarded by `completionStartedRef` — that effect fires when `dealDetail.paymentsData`
  becomes truthy, changes the stage to `code/name === "paid"`, toasts, then
  `setTimeout(() => router.push(CONTEXT_RETURN_PATH[context]), 2000)`.

#### 6.4.6 Stage-resolution wait loop (not a poller, but same pattern)

`waitForStages()` at `payment-detail.tsx:143-149`:

```ts
const STAGES_WAIT_MAX_CHECKS = 20; // ~10s at 500ms interval
for (let i = 0; i < STAGES_WAIT_MAX_CHECKS; i++) {
  if (!stagesLoadingRef.current && stagesRef.current.length > 0) return;
  await new Promise((resolve) => setTimeout(resolve, 500));
}
```

Duplicated in `src/components/appointment/hooks/useTourDeal.tsx:33-40`.

#### 6.4.7 Poller summary table

| ID | Location | Trigger | Interval | Cap | Failure handled | Cancel |
|---|---|---|---|---|---|---|
| A | `payment-detail.tsx:417-454` | QR dialog open + invoice id | 3000 ms | 100 (~5 min) → `pollCapped` | yes (`getFailedStatus`) | effect cleanup |
| B | `payment-detail.tsx:272-289` | TDB/QR return path on mount | 3000 ms sequential | 20 (~60 s) → toast | yes | `returnCancelRef` |
| C | `payment-detail.tsx:264-269` | mount, existing invoice, not a return | once | 1 | **no** | n/a |
| D | `paymentPage.tsx:320-336` | `invoiceId` truthy (Track B) | 3000 ms | **none (infinite)** | **no** | effect cleanup |
| — | `payment-detail.tsx:143-149` | stage change | 500 ms | 20 (~10 s) | n/a | n/a |
| — | `useTourDeal.tsx:33-40` | tour deal create | 500 ms | 10 (~5 s) | n/a | n/a |

Tour variant `src/components/appointment/payment/tourPaymentDetail.tsx` **re-implements A/B/C
verbatim** with `TDB_RETURN_KEY = "tdbTourPaymentReturn"` (`:45`), same 30 min TTL (`:46`),
same `RETURN_MAX_CHECKS = 20` (`:215`) and `MAX_POLLS = 100` (`:368`), plus a
`useBmsOrderEdit` call to mark the BMS order paid.

### 6.5 `payment-detail.tsx` control flow (the orchestrator)

> **Reference only.** This pseudo-code traces the Tegri Gobi reference orchestrator, including the
> `tdb`/return-marker branches. A generated site implements the single QR/`transactions` path (create →
> render QR from `transactions` → Poller A); skip every `isReturn` / `marker` / `tdbPaymentReturn` line.

```
mount
 ├─ getForcedFailedStatus()?  ──yes──▶ finalizeAsFailed (dev only)
 └─ readTdbReturnMarker(dealId) → marker
    isReturn = marker || ?paymentReturn=1
    ├─ isReturn → setCheckingOpen(true); strip ?paymentReturn from URL (replaceState)
    ├─ invoiceId = marker.invoiceId || cpInvoices[0]._id
    │    └─ none → close checking dialog, STOP
    ├─ !isReturn → Poller C (single check) → maybe finalizeAsPaid, STOP
    └─ isReturn → Poller B (20×3s) → finalizeAsPaid | finalizeAsFailed | timeout toast

"Proceed to Payment" click → runPaymentFlow(payment)
 ├─ cpInvoices(sales:deal, dealId)            → existingId
 ├─ existingId?
 │    ├─ invoiceDetail(existingId)            → existing.amount, existing.transactions
 │    ├─ existing.amount === invoiceAmount
 │    │     && pickTransactionResponse(tx, payment._id)  → reuse existing invoice + response
 │    └─ else → createNewInvoice()
 ├─ no existingId → createNewInvoice()
  │      └─ invoiceCreate({amount, contentType:"sales:deal", paymentIds:[payment._id],
  │                          description, phone, email})   // no redirectUri
  │         → { _id, transactions[] } ; render QR from transactions ; response = last tx matching payment._id
 ├─ !response → throw "Invoice was created without a payment transaction."
 ├─ parsedTx = safeJsonParse(response) ; parsedTx.error → throw `${kind}: ${error}`
 ├─ kind === "tdb"
 │    ├─ validate order.hppUrl / order.id / order.password else throw
 │    ├─ localStorage["tdbPaymentReturn"] = {dealId, invoiceId, at: Date.now()}
 │    └─ window.location.assign(`${hppUrl}/?id=…&password=…`)   ← full page leaves
 └─ else (qpay/quickqr)
      ├─ setPaymentResponse(response); setQrOpen(true)
      └─ Poller A starts (effect :417)

finalizeAsPaid()
 ├─ onPaymentConfirmed?  → await it (Track B: change stage to "paid")
 └─ else (Track A) → waitForStages() → cpDealsChange → stage.code === "confirmed"
 └─ setQrOpen(false); setCheckingOpen(false); setSuccessOpen(true)
      └─ SuccessDialog onClose → router.push(successPath)  (default "/booking/confirm")

finalizeAsFailed(status)
 ├─ returnCancelRef = true; clearInterval(pollRef)
 ├─ setQrOpen(false); setCheckingOpen(false); setFailedStatus(status)
 └─ FailedDialog: Retry (only if selectedPayment) | Close
```

`computeInvoiceAmount` (`:43-53`) sums `productsData[].amount` and halves (rounded) when
`paymentType === "half"`. `paymentType` comes from `?type=` or, if absent, from the deal's
tag name `"pre payment"` (`:32-41`) — **a tag-name lookup to decide money**.

### 6.6 Track B payment (summary, not duplicating Track A)

- `appointment/payment/paymentPage.tsx` (461 L) renders `PaymentSummaryCard` + `PaymentDetail`
  with `onPaymentConfirmed = finalizeAppointmentPayment` (stage → `code/name === "paid"`).
  Display prices are recomputed **again** client-side from `products` × `productsData`
  (`:98-111`), and `Math.round(total/2)` for prepayment when `CONTEXT_PRESENTATION[ctx].canHalve`.
- `appointment/payment/tourPaymentPage.tsx` (167 L) reads **everything from the query string**
  (`amount`, `numberOfPeople`, `email`, `phone`, `customer`, `pricingOptionId`, `dealId`,
  `paymentType`, `from`, `to`) and derives `payableAmount = isPrePayment ? amount * 0.5 : amount`
  (`:30`). **The amount shown and charged is client-supplied.**
- `appointment/payment/tourPaymentDetail.tsx` (495 L) = copy of `payment-detail.tsx` with
  `TDB_RETURN_KEY = "tdbTourPaymentReturn"` and `useBmsOrderEdit` added.

---

## 7. EDGE CASES

| # | Scenario | Actual behaviour | Evidence |
|---|---|---|---|
| E-01 | Checkout date ≤ check-in date | **Allowed.** No cross-field zod rule; `nights = Math.max(1, differenceInCalendarDays(...))` silently bills 1 night. | `reserve/index.tsx` (whole file), `useAddDeal.tsx:50, 224-227` |
| E-02 | User reloads `/booking` | `selectedRooms` + `roomGuestAssignments` cleared on mount; `reserveAtom` also resets (memory only) → "Booking details required" empty state. `dealIdAtom` survives (localStorage). | `bookingPage.tsx:78-82`, `store/reserve.ts:19` |
| E-03 | User reloads `/booking/details` | `dealIdAtom` may hold a **stale** deal → `cancelPreviousDeal()` cancels it (moves to `canceled`) then creates a new one. | `bookingDetailsPage.tsx:66-78, 114` |
| E-04 | `selectedRooms` empty on `/booking/details` | `BookingLayout` guard redirects to `/booking`. On `/booking/payment/[slug]` and `/booking/confirm` the guard is bypassed via `params.slug`. | `booking-layout.tsx:15-19` |
| E-05 | Zero rooms match the search | `useCheckRooms` returns `[]`; `bookingPage.tsx` renders the empty-results branch. **`loading` covers only the loading state — no error state.** | `bookingPage.tsx`, `rooms.tsx:110` |
| E-06 | Board/pipeline renamed in erxes | `pipelineId === undefined` → `useRooms`/`useCheckRooms` skip → **0 rooms, 0 available, no error message.** | `sales.tsx:6-7`, `rooms.tsx:53,110` |
| E-07 | Stage list not loaded when returning from TDB | `waitForStages()` waits up to 10 s, then stage change is **silently skipped** (`if (confirmedStageId && …)`), payment still shows success. | `payment-detail.tsx:143-149, 174` |
| E-08 | Two deals / double-submit on details | `handleAddDeal` always `cpDealsAdd`s; the previous deal is cancelled first — but if `canceledStageId` is missing (stage list not loaded) the old deal is left `pending`. | `bookingDetailsPage.tsx:66-78` |
| E-09 | Existing invoice with a **different** amount (price changed between visits) | Falls through to `createNewInvoice()` → **a second invoice is created on the same deal**; `cpInvoices[0]` is then ambiguous for Poller C/D. | `payment-detail.tsx:345-358, 257` |
| E-10 | Existing invoice, same amount, but no transaction for this `payment._id` | Creates a new invoice (same as E-09). | `payment-detail.tsx:351-354` |
| E-11 | Invoice created but `transactions[]` empty | Throws `"Invoice was created without a payment transaction."` → red `flowError` box + toast. **The orphan invoice is left on the deal.** | `payment-detail.tsx:365-367` |
| E-12 | Provider returns `parsedTx.error` | Throws `KIND: <error>` → same as E-11. | `payment-detail.tsx:372-374` |
| E-13 | TDB returns without `hppUrl`/`id`/`password` | Throws `"TDB did not return a valid hosted page URL."` | `payment-detail.tsx:380-382` |
| E-14 | TDB return, `localStorage` unavailable | **Not applicable to the canonical flow** — the QR/`transactions` path has no return URL or marker. In the reference project the marker write is `try/catch`ed and `?paymentReturn=1` triggers the return flow **only if the redirectUri round-trips the query** (the code comment says TDB does not preserve it), else the return is lost. Do not reproduce. | `payment-detail.tsx:387-398, 68-69` |
| E-15 | TDB return marker older than 30 min | `readTdbReturnMarker` returns `null` **after deleting the key** → return flow silently downgraded to Poller C (single check). | `payment-detail.tsx:84-85` |
| E-16 | QR poller hits 100 iterations | `pollCapped = true` → dialog shows `"Still waiting"` + `"Check again"`. **Dialog stays open, nothing auto-closes.** | `payment-detail.tsx:426-431`, `PaymentQrDialog:115-124` |
| E-17 | TDB return poller times out (60 s) | Checking dialog closes + toast `"Payment not confirmed yet"`. Deal stays unpaid; user must click "Proceed to Payment" again (creating yet another invoice if amount differs). | `payment-detail.tsx:288-289` |
| E-18 | Track B invoice never reaches `paid` | Poller D polls **forever**, no cap, no failure detection. | `paymentPage.tsx:323-331` |
| E-19 | Failure during the first payment attempt | `PaymentFailedDialog` gets `onRetry = undefined` (no method selected yet → `selectedPayment` null) → **only Close**. | `payment-detail.tsx:556` |
| E-20 | `payments` list empty (`cpPayments` returns `[]`) | `PaymentMethodSelector` renders `"No payment methods available."` (hardcoded EN); submit button stays disabled (`canSubmit` requires `selectedPayment`). | `PaymentMethodSelector:37-41`, `payment-detail.tsx:485` |
| E-21 | `amount ≤ 0` at invoice creation | `handleInvoiceCreate` throws with an explicit message naming `productsData` as likely cause. | `mutations/payments.tsx:37-41` |
| E-22 | Guest count exceeds `roomCount × 4` | `GuestCounter` clamps via `maxPeople`; **but `Reserve` never passes `max` to `RoomCounter`** so the user can raise `roomCount` to compensate and effectively bypass the cap. | `Reserve.tsx:98`, `room-counter.tsx` |
| E-23 | Two tabs open on `/booking/payment/<dealId>` | Both run Poller A on the same invoice; both may call `finalizeAsPaid` → duplicate `cpDealsChange` (second one is a no-op because of the `sourceStageId !== confirmedStageId` guard). | `payment-detail.tsx:174` |
| E-24 | User navigates away mid-poll | Effect cleanup clears the interval; **no `beforeunload` warning** — payment in progress can be abandoned silently. | `payment-detail.tsx:448-453` |
| E-25 | `?forceStatus=` in production | Ignored (`NODE_ENV === "production"` → `null`). In dev it short-circuits **before** the return marker is read, so it also skips invoice reconciliation. | `payment-status.ts:39-44`, `payment-detail.tsx:228-232` |
| E-26 | Signed-out user on `/booking/details` | No deal can be created for a company; the form shows a Sign-in CTA. `handleAddDeal` throws `"Customer could not be resolved"` if neither `customerIds` nor `companyIds` resolve. | `bookingDetailsPage.tsx:160-177`, `useAddDeal.tsx:305-310` |
| E-27 | Customer lookup returns a row with no `_id` | Throws `"Customer could not be resolved"`. | `useAddDeal.tsx:280-282` |
| E-28 | Pay-at-property + stage list missing | `stageId` undefined → `toast.error('Stage not found for code "payAtProperty"')`, **returns `undefined`, no redirect, no deal**. | `useAddDeal.tsx:314-317` |
| E-29 | Deal already `confirmed` when revisiting payment | `bookingPaymentPage.tsx:36-40` `router.replace("/booking/confirm")` whenever `paymentsData && stage.code === "confirmed"`. | `bookingPaymentPage.tsx:36-40` |
| E-30 | Confirm page hard-refreshed | Non-pay-at-property branch reads nothing → default titles/sections render; `payAtProperty` confirmation blob is lost after `sessionStorage` removal on Continue. | `bookingConfirmPage.tsx:37-45, 55-60` |

---

## 8. SEQUENCE DIAGRAM

### 8.1 Track A — room stay, QR payment (happy path)

```
Browser                      Next.js (client)                 erxes (cp* GraphQL)           Provider
  │                                │                                   │                          │
  │ ─ click "Reserve" (FAB) ─────▶ │ Reserve.tsx                       │                          │
  │                                │  setReserve(form) ─▶ reserveAtom  │                          │
  │                                │  router.push("/booking")          │                          │
  │                                │                                   │                          │
  │ ◀─ /booking ──────────────────  │ bookingPage.tsx                   │                          │
  │                                │  clear selectedRooms, assignments │                          │
  │                                │  ─ cpSalesBoards ────────────────▶ │                          │
  │                                │  ◀─ [{_id,name:"PMS board"}] ───── │  (sales.tsx:9-17)        │
  │                                │  ─ cpSalesPipelines(boardId) ────▶ │                          │
  │                                │  ◀─ [{_id,name:"PMS"}] ─────────── │                          │
  │                                │  ─ cpSalesStages(pipelineId) ────▶ │                          │
  │                                │  ◀─ [{code:"pending"...}] ──────── │                          │
  │                                │  ─ cpProducts / cpPmsRooms ──────▶ │                          │
  │                                │  ◀─ rooms + occupancy ──────────── │                          │
  │ ◀─ room cards ──────────────── │                                   │                          │
  │ ─ select rooms ──────────────▶ │ useSelectedRooms (cap = roomCount) │                          │
  │ ─ "Continue" ────────────────▶ │ router.push("/booking/details")    │                          │
  │                                │                                   │                          │
  │ ◀─ /booking/details ──────────  │ bookingDetailsPage.tsx            │                          │
  │ ─ submit ────────────────────▶ │ cancelPreviousDeal()              │                          │
  │                                │  ─ cpDealsEdit(stage=canceled) ──▶ │ (only if dealId stale)    │
  │                                │ handleAddDeal()                   │                          │
  │                                │  ─ cpSalesPipelineLabelsAdd ─────▶ │ label "Website" #ff6900   │
  │                                │  ─ cpTagsAdd ────────────────────▶ │ "Pre payment" #63D2D6    │
  │                                │  ─ customersMain.list(email) ────▶ │ or clientPortalUserReg.  │
  │                                │  ─ cpDealsAdd ───────────────────▶ │                          │
  │                                │  ◀─ {deal: {_id}} ──────────────── │                          │
  │                                │  router.push(/booking/payment/{id}?type=half|full)
  │                                │                                   │                          │
  │ ◀─ /booking/payment/{dealId} ─  │ bookingPaymentPage.tsx            │                          │
  │                                │  setReserve(reserveAtomDefaults)   │                          │
  │                                │  ─ cpDealDetail ─────────────────▶ │                          │
  │                                │  ─ cpPayments(status:"active") ──▶ │ [quickqr, qpay, tdb]     │
  │ ◀─ PaymentMethodSelector ───── │                                   │                          │
  │ ─ pick method + "Proceed" ───▶ │ runPaymentFlow()                  │                          │
  │                                │  ─ cpInvoices(sales:deal) ───────▶ │ existing?                │
  │                                │  ─ invoiceDetail(id) ────────────▶ │ amount match?            │
  │                                │  ─ cpInvoiceCreate(input) ───────▶ │                          │
  │                                │  ◀─ {_id, transactions:[{response}]}                        │
  │                                │  setQrOpen(true)                   │                          │
  │ ◀─ PaymentQrDialog (QR) ────── │                                   │                          │
  │                                │  POLLER A: every 3s ─ cpInvoicesCheck(id) ─▶ │                │ ◀─ user pays
  │                                │  ◀─ "paid" ─────────────────────── │                          │
  │                                │ waitForStages() [≤10s×500ms]      │                          │
  │                                │  ─ cpDealsChange → confirmed ────▶ │                          │
  │ ◀─ PaymentSuccessDialog ────── │                                   │                          │
  │ ─ "Close" ───────────────────▶ │ router.push("/booking/confirm")    │                          │
  │ ◀─ /booking/confirm ─────────── │ currentStepAtom = 4               │                          │
```

### 8.2 Track A — payment (canonical: QR / `transactions` one-path)

```
Browser / payment-detail.tsx                                        erxes gateway
  │ ─ pick method + "Proceed" ─▶ runPaymentFlow()
  │     invoiceCreate({amount, contentType:"sales:deal", paymentIds:[payment._id], …})  // no redirectUri
  │     ◀─ { _id, transactions[] } ───────────────────────────────── │
  │     response = last tx matching payment._id ; parse → QR payload
  │     setQrOpen(true) → PaymentQrDialog renders the QR
  │     POLLER A: every 3s invoicesCheck(id) ─▶ "paid" | "Expired"/"Refused" | cap toast
  │     waitForStages() → cpDealsChange → stage.code="confirmed"
  │   ◀─ PaymentSuccessDialog ─▶ router.push("/booking/confirm")
```

> **Reference only (do not copy):** the Tegri Gobi reference project had a second Track A path for
> `kind === "tdb"` that built a `redirectUri`, stored `localStorage["tdbPaymentReturn"]`, did a full-page
> `window.location.assign(hppUrl…)`, and relied on a 20×3s **Poller B** after the return. The canonical
> flow is the single QR/`transactions` path above — no redirect, no return marker, no Poller B.

### 8.3 Track B — appointment / tour

```
Product page ──Link──▶ /<context>/booking?productId=&from=&to=&memberId=
      bookingPage (singular) → useBookingSubmit
         ─ cpSalesStages([literal pipelineId]) ─▶ stage by name === "Pending"
         ─ cpTagsAdd / cpSalesPipelineLabelsAdd ("Web") ─▶
         ─ customersMain.list | clientPortalUserRegister ─▶
         ─ cpDealsAdd ─▶ dealId
      (tours: cpBmsOrderAdd first → order._id, then useTourDealAdd → dealId)
         ─ router.push(config.paymentRoute(id) + "?" + URLSearchParams) ─▶
/<context>/payment/{id}
      AppointmentPaymentPage
         ─ cpDealDetail ─, ─ cpSalesStages(literal) ─, ─ cpInvoices ─
         PaymentDetail({onPaymentConfirmed: changeStage → "paid",
                        successPath: CONTEXT_RETURN_PATH[context]})
         POLLER D (infinite, 3s) cpInvoicesCheck ─▶ refetch deal
         effect on dealDetail.paymentsData ─▶ cpDealsChange → "paid"
         toast.success → setTimeout 2000ms → router.push(returnPath)
```

---

## 9. SWAP POINTS

**CORE = must be reproduced** to get a working booking + payment flow on a new erxes instance.
**OPTIONAL = brand/product specific**; can be swapped, dropped, or replaced without breaking the flow.

### 9.1 CORE — swap the identity, keep the behaviour

| # | Piece | Current implementation | Why CORE | Safe to swap? |
|---|---|---|---|---|
| C-01 | Board → pipeline → stage resolution | `src/sdk/queries/sales.tsx:6-7` display-string match (`"PMS board"` / `"PMS"`) chained via `usePipelineId` | every room query skips without a `pipelineId` | ✅ replace with an env/config id (see §4.5) |
| C-02 | Deal creation | `src/sdk/hooks/useAddDeal.tsx:204-324` `cpDealsAdd` with `productsData`, `labelIds`, `tagIds`, `customerIds`/`companyIds` | the deal is the booking record | ⚠ shape is erxes-specific; ids are swappable |
| C-03 | Stage state machine | `pending`/`payAtProperty` → `confirmed` (Track A) or `paid` (Track B) → `canceled` | drives every success/cancel path | ✅ make the codes configurable |
| C-04 | Customer resolution | `customersMain.list` by email → `clientPortalUserRegister` (`queries/customers.tsx`, `mutations/customers.tsx`) | deals require a customer/company | ✅ only if your backend still exposes these |
| C-05 | Invoice lifecycle | `invoiceCreate` → `invoicesCheck` polling → `cpDealsChange` (`src/graphql/ecommerce/{queries,mutations}/payment.ts`, `payment-detail.tsx`) | **the only source of "paid"** | ✅ swap the gateway, keep the poll contract |
| C-06 | `src/lib/payment-status.ts` | `isPaidStatus` / `getFailedStatus` | shared by all 4 pollers | ✅ extend the status lists, keep the API |
| C-07 | `payment-detail.tsx` orchestrator | invoice reuse / create, TDB redirect, QR poller, return poller | used by Track A **and** Track B | ⚠ refactorable but 563 L of coupled logic |
| C-08 | Availability computation | `cpPmsRooms` + `skipStageIds` (`sales/queries.ts`, `rooms.tsx:110-158`) | defines "available" | ⚠ requires a PMS-like occupancy source |
| C-09 | Jotai atoms | `src/store/reserve.ts` (5 atoms) + `selectedRoomsAtom`/`roomGuestAssignmentsAtom` | the only carrier between steps 1→2→3 | ⚠ if you switch to URL state, every writer listed in §3.1 must change |
| C-10 | Route guards | `booking-layout.tsx:15-19`, `bookingPage.tsx:88-92` | prevents empty-state crashes | ✅ |
| C-11 | Money computed client-side | `useAddDeal.tsx:50, 65-127`, `computeInvoiceAmount` (`payment-detail.tsx:43-53`) | invoice `amount` comes from here | ⚠ **must** move server-side in any re-implementation (A-01) |

### 9.2 OPTIONAL — brand / product specific

| # | Piece | Location | Notes |
|---|---|---|---|
| O-01 | Floating pill FAB look (position, radius, spring) | `Reserve.tsx:270-289` | pure presentation |
| O-02 | `MAX_PEOPLE_PER_ROOM = 4` | `Reserve.tsx:60` | business rule, one constant |
| O-03 | `KIND_META` gateway labels/icons | `PaymentMethodSelector.tsx:7-11` | hardcoded EN; should be i18n |
| O-04 | Dialog visuals (QR size `w-56 h-56`, bank grid `md:hidden`) | `PaymentQrDialog.tsx` | swap freely |
| O-05 | `PaymentTdbDialog.tsx` | whole file | **already dead** — safe to delete |
| O-06 | `DinoFundCard` on the payment page | `bookingPaymentPage.tsx:76` | unrelated donation widget; removable |
| O-07 | Pay-at-property pre-auth form | `PayAtPropertyForm.tsx` + `ErxesFormModal.tsx` | erxes-form-driven; optional product feature |
| O-08 | Track B literal pipelines | `bookingContext.ts` | only needed if you keep activities/dining/spa/merch/tours |
| O-09 | Tours double-record (BMS order **and** deal) | `TourBookingPage.tsx:270-300` | could be deal-only |
| O-10 | Label colours `#ff6900` / `#63D2D6` / `#4BBF6B` / `#eb144c` | `useAddDeal.tsx:168`, `mutations/sales.tsx:26`, `useBookingSubmit.tsx` | cosmetic |
| O-11 | Currency symbol resolution | `src/lib/utils.ts:71-80` + literal `₮`/`$` in JSX | see §11 |
| O-12 | `CurrentConfig` branch detail fetch | `containers/config/currentConfig.tsx` | only for check-in/out time defaults + room categories |

---

## 10. REPRODUCE vs AVOID RULES

### 10.1 REPRODUCE (do this the same way)

1. **Keep one booking = one erxes deal.** All four Track A routes key off `dealId`
   (`/booking/payment/[slug]` slug **is** the deal id — `bookingDetailsPage.tsx:122`).
2. **Hand state between steps 1→2→3 through in-memory atoms, not the URL**
   (`src/store/reserve.ts`). Do not add query params for dates/guests/rooms — the existing
   form-reset effect `Reserve.tsx:122-124` assumes the atom is the source of truth.
3. **Resolve stages through `useStages()` once and gate money operations on it.**
   `useAddDeal.tsx:314-317` refuses to create a deal without a `stageId` and toasts —
   reproduce that guard rather than sending `stageId: undefined`.
4. **Guard the steps.** `booking-layout.tsx:15-19` (redirect to `/booking` with no rooms)
   and `bookingPage.tsx:88-92` (empty `reserveAtom` → CTA instead of a broken grid).
5. **Poll `cpInvoicesCheck` with a cap and a failure branch.** Copy the constants from
   `payment-detail.tsx`: QR `MAX_POLLS = 100 @ 3000ms`, return `RETURN_MAX_CHECKS = 20 @ 3000ms`,
   stage wait `STAGES_WAIT_MAX_CHECKS = 20 @ 500ms`.
6. **Distinguish "returning from the provider" from a normal mount** with a one-shot marker +
   TTL (`payment-detail.tsx:77-90`) and **strip the URL flag after reading it**
   (`:242-246`) so a refresh cannot re-trigger the return flow.
7. **Create the invoice only when the amount matches**, else create a new one —
   `payment-detail.tsx:340-363` — so a re-priced deal is never charged the old amount.
8. **Use `fetchPolicy: "no-cache"` for anything that must reflect the provider's state:**
   `invoiceIdByDealId`, `invoiceDetail`, `customersMain.list`, `cpPmsRooms`
   (`payment-detail.tsx:151-156`, `customers.tsx:17`, `rooms.tsx:120`).
9. **Cancel the previous deal before creating the next one**
   (`bookingDetailsPage.tsx:66-78`) so abandoned checkouts do not double-book inventory.
10. **Surface every money error instead of failing silently:** `handleInvoiceCreate` throws on
    `amount ≤ 0` / missing `paymentId` / missing `contentTypeId` (`mutations/payments.tsx:37-47`);
    `payment-detail.tsx:405-414` turns every throw into a toast **and** a visible `flowError` box.
11. **Treat invoice status as the single source of truth for payment**, not the deal stage —
    stage is a *consequence* of `isPaidStatus()` (`payment-detail.tsx:435-439`).
12. **Keep `getForcedFailedStatus()` dev-only** (`payment-status.ts:40`) if you keep a test hook.

### 10.2 AVOID (do not reproduce)

1. **A-01 — Do not compute money on the client and trust it.**
   `useAddDeal.tsx:65-127` builds `productsData[].amount` in the browser;
   `TourBookingPage.tsx:328` puts `amount` in the **query string**;
   `tourPaymentPage.tsx:22, 30` reads `amount` back from the query and charges
   `amount * 0.5`. Anyone can edit the URL. Recompute server-side from `deal.productsData`
   at invoice creation.
2. **A-02 — Do not locate pipelines/board/stages by display name.**
   `sales.tsx:6-7` (`"PMS board"`, `"PMS"`) and `useBookingSubmit.tsx:161`
   (`stage.name === "Pending"`) break on any rename or on a non-English erxes.
   Use stage **`code`** or configured ids (§4.5).
3. **A-03 — Do not duplicate the payment orchestrator.**
   `payment-detail.tsx` (563 L) and `tourPaymentDetail.tsx` (495 L) are near-copies with
   different `TDB_RETURN_KEY`s. Any fix must be applied twice today.
4. **A-04 — Do not write secrets or tokens into `src/`.**
   `src/app/[locale]/ApolloClient.tsx:57` sends a literal `erxes-pos-token` header value.
   Read it from an env var (name only; value must never be committed).
5. **A-05 — Do not declare env keys that are never read, or read keys that are never declared.**
   `next.config.ts` declares `NEXT_PUBLIC_REQUEST_STAGE_ID`, `NEXT_PUBLIC_PAID_STAGE_ID` (and `NEXT_PUBLIC_PMS_PIPELINE_ID`) with
   **0** `process.env.*` reads in `src/`; conversely `NEXT_PUBLIC_ERXES_API_URL`,
   `NEXT_PUBLIC_MAIN_SUBS_DOMAIN`, `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID`,
   `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` are read but absent from `next.config.ts`'s `env`
   block → `undefined` at build time (they only work if provided by the deploy shell).
   Declare exactly the set in §11.
6. **A-06 — Do not keep the two-track divergence.** Track A moves deals to `confirmed`,
   Track B to `paid`; Track A resolves pipelines via board lookup, Track B uses literals;
   Track B has its own `Pending` name-match. Pick one state machine.
7. **A-07 — Do not mount the same no-cache query twice.**
   `Reserve.tsx:88` and `bookingPage.tsx:74` both call `useResultRooms(currentLocale)`,
   and `cpPmsRooms` is `no-cache` → two identical availability requests per visit to `/booking`.
   Lift the hook or share a context.
8. **A-08 — Do not leave an unbounded poller.** `paymentPage.tsx:323-331` has **no cap and no
   failure branch**; an `Expired` invoice polls forever. Always mirror the QR poller's cap +
   `getFailedStatus`.
9. **A-09 — Do not create invoices without cleanup.** On `createNewInvoice()` failure the
   invoice already exists on the deal (E-11/E-12) and becomes `cpInvoices[0]` for the next
   mount's Poller C. Create idempotently or void on failure.
10. **A-10 — Do not `catch {}` around money.** `payment-detail.tsx:290-292, 443-445` and
    `paymentPage.tsx:330` swallow errors with no log and no user feedback; a failed
    `cpInvoicesCheck` looks identical to "still pending".
11. **A-11 — Do not reset booking state on the payment route.**
    `bookingPaymentPage.tsx:33` resets `reserveAtom` **on mount**, so a browser Back to
    `/booking` shows the "Booking details required" panel even though the user did complete
    a search. Reset on *success* instead.
12. **A-12 — Do not rely on a component that is never imported.** `PaymentTdbDialog.tsx` is
    dead; `cpPmsCheckRooms` and `salesPipelineDetail` are defined with no callers.
    Delete or wire them up.
13. **A-13 — Do not give a retry affordance that depends on prior UI state.**
    `payment-detail.tsx:556` passes `onRetry` only when `selectedPayment` is set, so the
    most common failure (first attempt) has no Retry button.
14. **A-14 — Do not hardcode English inside otherwise-i18n components.**
    `PaymentMethodSelector.tsx:8-10, 38` (`"QPay / QuickQR"`, `"No payment methods available."`),
    `payment-detail.tsx:55-58` (`"Full payment"`, `"50% deposit"` — used as the **invoice
    description** sent to the gateway), `useAddDeal.tsx:168, 177`, `mutations/sales.tsx:25`.
    See 05 §5 for the i18n contract.
15. **A-15 — Do not store the open/closed state of the booking bar only in `localStorage`
    with an SSR default of `true`** (`Reserve.tsx:74-83`) — the widget can flash open on
    every cold load for a returning user who had closed it.

---

## 11. BRAND-SPECIFIC HARDCODING AUDIT

Values are **REDACTED**. "Should be" names are *proposed* keys — none of them exist in the
code today unless stated. Rows marked **LIVE** are read by the booking/payment flow.

| # | File:line | Hardcoded VALUE (REDACTED) | Should be |
|---|---|---|---|
| 1 | `src/app/[locale]/ApolloClient.tsx:57` | header `erxes-pos-token` value **REDACTED** | `NEXT_PUBLIC_ERXES_POS_TOKEN` (env, not committed) |
| 2 | `next.config.ts:6` | `NEXT_PUBLIC_SAAS_DOMAIN` = brand domain **REDACTED** | keep as env (already an env *name*, but the value is committed) |
| 3 | `next.config.ts:7` | `NEXT_PUBLIC_MAIN_API_DOMAIN` = **REDACTED** | same |
| 4 | `next.config.ts:8` | `NEXT_PUBLIC_ERXES_APP_TOKEN` (JWT) **REDACTED** | same — **secret-classified** |
| 5 | `next.config.ts:10` | `NEXT_PUBLIC_PMS_TOKEN` (branch id) **REDACTED** | same — **LIVE**, `containers/config/currentConfig.tsx`, `rooms.tsx` |
| 6 | `next.config.ts:11` | `NEXT_PUBLIC_BRANCH_ID` **REDACTED** | same — **LIVE**, `useRoomPricing.tsx:22`, `rooms.tsx` |
| 7 | `next.config.ts:12` | `NEXT_PUBLIC_CP_ID` **REDACTED** | same |
| 8 | `next.config.ts:14` | `NEXT_PUBLIC_REQUEST_STAGE_ID` **REDACTED** | delete — **0 reads in `src/`** |
| 9 | `next.config.ts:15` | `NEXT_PUBLIC_PENDING_STAGE_ID` **REDACTED** | keep — **LIVE**, `useAddDeal.tsx:23` |
| 10 | `next.config.ts:16` | `NEXT_PUBLIC_PAID_STAGE_ID` **REDACTED** | keep **only if read** — **0 reads in `src/`**; Track B finds the stage by `code/name === "paid"` instead (`paymentPage.tsx:308-312`) |
| 11 | `next.config.ts:17` | `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID` **REDACTED** | keep — **LIVE**, `useAddDeal.tsx:24` |
| 12 | `next.config.ts:18` | `NEXT_PUBLIC_TMS_BRANCH_ID` **REDACTED** | keep — **LIVE**, `queries/tms.tsx:82`; **but also duplicated as a literal at `tms.tsx:18`** → remove the literal fallback |
| 13 | `next.config.ts:13` (approx.) | `NEXT_PUBLIC_PMS_PIPELINE_ID` **REDACTED** | **0 reads in `src/`** — either delete or wire into `usePipelineId` |
| 14 | `src/sdk/queries/sales.tsx:6` | `PMS_BOARD_NAME = "PMS board"` | `NEXT_PUBLIC_PMS_BOARD_NAME` or `NEXT_PUBLIC_PMS_BOARD_ID` |
| 15 | `src/sdk/queries/sales.tsx:7` | `PMS_PIPELINE_NAME = "PMS"` | `NEXT_PUBLIC_PMS_PIPELINE_NAME` or `NEXT_PUBLIC_PMS_PIPELINE_ID` |
| 16 | `src/components/appointment/bookingContext.ts:13` | `TOURS_BOARD_ID` **REDACTED** | `NEXT_PUBLIC_TOURS_BOARD_ID` (**currently exported and never imported**) |
| 17 | `src/components/appointment/bookingContext.ts:14` | `TOURS_PIPELINE_ID` **REDACTED** | `NEXT_PUBLIC_TOURS_PIPELINE_ID` |
| 18 | `src/components/appointment/bookingContext.ts:24` | `activities.pipelineId` **REDACTED** | `NEXT_PUBLIC_ACTIVITIES_PIPELINE_ID` |
| 19 | `src/components/appointment/bookingContext.ts:30` | `dining.pipelineId` **REDACTED** | `NEXT_PUBLIC_DINING_PIPELINE_ID` |
| 20 | `src/components/appointment/bookingContext.ts:36` | `spa.pipelineId` **REDACTED** | `NEXT_PUBLIC_SPA_PIPELINE_ID` (same literal as `next.config.ts` `NEXT_PUBLIC_PMS_PIPELINE_ID`) |
| 21 | `src/components/appointment/bookingContext.ts:42` | `merch.pipelineId` **REDACTED** | `NEXT_PUBLIC_MERCH_PIPELINE_ID` |
| 22 | `src/sdk/queries/sales.tsx:74` | `useStagesAppointment.pipelineIds[0]` **REDACTED** | `NEXT_PUBLIC_APPOINTMENT_PIPELINE_ID` (third place a pipeline id lives) |
| 23 | `src/sdk/queries/sales.tsx:91` | `useStageActivities.pipelineIds[0]` **REDACTED** | same value as #18 — deduplicate into one key |
| 24 | `src/components/booking/PayAtPropertyForm.tsx:14` | erxes form id **REDACTED** (env fallback literal) | keep as `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` **and declare it in `next.config.ts`** (currently absent) |
| 25 | `src/components/clientPages/toursPage/CreateOwnTripForm.tsx:15-16` | erxes form id **REDACTED** (env fallback literal) | `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID` — declared nowhere in `next.config.ts` |
| 26 | `src/components/booking/ErxesFormModal.tsx:40-88` | 19 erxes **field ids** (all **REDACTED**) + `CARD_NUMBER_FIELD_ID`/`CARD_EXPIRY_FIELD_ID`/`CARD_CVV_FIELD_ID` (`:98-100`) | one `NEXT_PUBLIC_PAY_AT_PROPERTY_FIELD_IDS` JSON map, or fetch by field code |
| 27 | `src/sdk/hooks/useAddDeal.tsx:168` | label name `"Website"` + colour **REDACTED** | `NEXT_PUBLIC_DEAL_LABEL_NAME` / `..._COLOR` |
| 28 | `src/sdk/hooks/useAddDeal.tsx:177`, `src/sdk/mutations/sales.tsx:25` | tag names `"Pre payment"` / `"Full payment"` | `NEXT_PUBLIC_PREPAYMENT_TAG` / `NEXT_PUBLIC_FULLPAYMENT_TAG` — **also used as money logic** (`payment-detail.tsx:37-40`, `paymentPage.tsx:366-368`) |
| 29 | `src/sdk/mutations/sales.tsx:26` | tag colours **REDACTED** | config keys |
| 30 | `src/components/appointment/hooks/useBookingSubmit.tsx:64-72` | label name `"Web"` + colour **REDACTED** | same key family as #27 (note: `"Web"` ≠ `"Website"`) |
| 31 | `src/components/appointment/hooks/useBookingSubmit.tsx:161` | `stage.name === "Pending"` | stage **code** key, e.g. `NEXT_PUBLIC_PENDING_STAGE_CODE` |
| 32 | `src/components/appointment/bookingContext.ts:18-22` | tour stage **names** `Pending`/`Confirmed`/`Canceled`/`Ended` | stage **codes** or configured ids |
| 33 | `src/components/booking/payment/payment-detail.tsx:55-58` | invoice descriptions `"Full payment"` / `"50% deposit"` | i18n key **and** a config key (this string is sent to the gateway) |
| 34 | `src/components/booking/payment/payment-detail.tsx:159` | default currency `"MNT"` | `NEXT_PUBLIC_DEFAULT_CURRENCY` |
| 35 | `src/components/appointment/payment/tourPaymentDetail.tsx:110` | `const currency = "MNT"` | same key as #34 (duplicated default) |
| 36 | `src/components/appointment/payment/tourPaymentPage.tsx:122,126,133,142` | currency symbol `$` literal in JSX | `getCurrencySymbol(currency)` like Track A |
| 37 | `src/components/appointment/payment/paymentPage.tsx:172,237,247,260,275` | currency symbol `₮` literal in JSX | `getCurrencySymbol(currency)` |
| 38 | `src/components/booking/payment/PaymentMethodSelector.tsx:8-10` | labels `"QPay / QuickQR"` / `"QPay"` / `"Card"` | i18n keys keyed by `payment.kind` |
| 39 | `src/components/booking/payment/PaymentMethodSelector.tsx:38` | `"No payment methods available."` | `Payment` namespace key |
| 40 | `src/components/appointment/payment/paymentPage.tsx:27-39, 41-78` | `CONTEXT_RETURN_PATH`, `PAYMENT_TO_BOOKING_CONTEXT`, `CONTEXT_PRESENTATION` — return paths `/activities`, `/dining`, `/spa-wellness`, `/merch` and per-context copy keys | already a config table; move it to env/config alongside §4.3 |
| 41 | `src/components/booking/ErxesFormModal.tsx:683` | `alt="Tegri Resort"` (brand string) | brand config / i18n key |
| 42 | `src/components/booking/payment/payment-detail.tsx:77` + `tourPaymentDetail.tsx:45` | `localStorage` keys `"tdbPaymentReturn"` / `"tdbTourPaymentReturn"` | prefix with the brand namespace, or keep (they are internal) |
| 43 | `next.config.ts` (env block) | **missing:** `NEXT_PUBLIC_ERXES_API_URL`, `NEXT_PUBLIC_MAIN_SUBS_DOMAIN`, `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID`, `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` — read in `src/` but **not declared** | add to the `env` block |
| 44 | `src/sdk/queries/tms.tsx:18` | `NEXT_PUBLIC_TMS_BRANCH_ID` **literal fallback value** **REDACTED** | remove the literal; read the env only (`:82` already does) |
| 45 | `src/sdk/queries/reviews.tsx` + `components/.../ReviewSection.tsx` | `REVIEW_PIPELINE_ID` **REDACTED** (outside the payment flow, same class of defect) | `NEXT_PUBLIC_REVIEW_PIPELINE_ID` |

**Env var names actually read by `src/`** (names only, complete):
`NEXT_PUBLIC_APPROVED_STAGE_ID`, `CAR_CATEGORY_ID`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACE_ID`,
`NEXT_PUBLIC_BRANCH_ID`, `NEXT_PUBLIC_CP_ID`, `NEXT_PUBLIC_ERXES_APP_TOKEN`,
`NEXT_PUBLIC_ERXES_API_URL`, `NEXT_PUBLIC_MAIN_API_DOMAIN`, `NEXT_PUBLIC_MAIN_SUBS_DOMAIN`,
`NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID`, `NEXT_PUBLIC_PMS_TOKEN`, `NEXT_PUBLIC_SAAS_DOMAIN`,
`NEXT_PUBLIC_TMS_BRANCH_ID`, `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID`, `NODE_ENV`,
`PARENT_CATEGORY_ID`, `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID`, `PC_CATEGORY_ID`, `NEXT_PUBLIC_PENDING_STAGE_ID`.

**No `.env*` file exists in the repo** (verified by glob at repo root); all configuration is
inlined in `next.config.ts`.

---

## 12. OPEN QUESTIONS / UNCERTAINTIES

1. **`hotel.config.json` does not exist.** Confirmed `NOT FOUND IN CODE` (§4.5). If the
   requirement to document `pipeline_id` / `booking_stage_id` / `paid_stage_id` / `payment_ids`
   comes from an external spec, those are **proposed** keys only — is that file expected to be
   *added* by the re-implementation, or does it live outside this repo?
2. **Is `NEXT_PUBLIC_PAID_STAGE_ID` (`next.config.ts:16`) meant to replace the `code/name === "paid"`
   lookup at `paymentPage.tsx:308-312`?** It is declared and never read — the most likely
   explanation is a half-finished refactor, but there is no comment saying so.
3. **Is `NEXT_PUBLIC_PMS_PIPELINE_ID` (`next.config.ts`) meant to replace the board/pipeline name match in
   `sales.tsx`?** Its value is byte-identical to `CONTEXT_CONFIG.spa.pipelineId`
   (`bookingContext.ts:36`), which suggests copy-paste rather than intent. `NOT FOUND IN CODE`
   to confirm.
4. **`NEXT_PUBLIC_REQUEST_STAGE_ID` is declared and never read.** Which request/quote flow was it for?
   No `request` stage code appears anywhere in `src/`.
5. **Why do Track A and Track B settle on different stages (`confirmed` vs `paid`)?**
   Both are erxes stage codes on (different) pipelines. Is this intentional (two pipelines,
   two lifecycles) or drift? It determines whether §4.6's state machine can be unified.
6. **Invoice reuse rule is amount-only.** `payment-detail.tsx:347` reuses an existing invoice
   when `existingAmount === invoiceAmount`, ignoring `paymentIds`. If a user switches from QPay
   to Card with the same amount, the old transaction is reused — is that correct for this
   backend, or should the check include `paymentId`?
7. **`cpInvoices[0]` is used without ordering.** `payment-detail.tsx:257` and
   `queries/payments.tsx:22` take the first invoice; after the E-09 double-invoice scenario it
   is ambiguous which one is authoritative. Does the API guarantee order (e.g. newest first)?
   `NOT FOUND IN CODE`.
8. **Does the TDB `redirectUri` actually round-trip the query string?** (Reference only — moot for the
   target.) The comment at `payment-detail.tsx:68-69` says it does *not*, yet `redirectUri` is built
   *with* `?type=…&paymentReturn=1` (`:315-318`) and the code also strips that param on return
   (`:242-246`). The canonical flow removes `redirectUri` entirely (QR/`transactions` one-path), so the
   question does not apply to a generated site.
9. **`productsData.currency` is read but never written.** `payment-detail.tsx:159` takes
   `productsData[0].currency || "MNT"` but `useAddDeal.tsx:85-122` never sets `currency` on a
   line. Is `currency` added server-side by erxes?
10. **`useResultRooms` is called with `language` = the route locale** (`rooms.tsx:159`,
    `Reserve.tsx:88`) and forwards it to `cmsPostsBySlug("accommodation", {language})`.
    Is availability supposed to be locale-dependent, or is the CMS call a leftover?
11. **`dealIdAtom` is `atomWithStorage("dealId")` but is only ever written `null`**
    (`useAddDeal.tsx:312`). Who is supposed to write a real id? If nothing does, the
    `cancelPreviousDeal()` path (`bookingDetailsPage.tsx:66-78`) can never fire. `NOT FOUND IN CODE`.
12. **`RoomCounter` accepts `max` and `GuestCounter` accepts `maxAdult`/`maxChild`, but
    `Reserve.tsx` passes none of them.** Intentional (unbounded) or an unfinished UI?
13. **`guests.pet` exists in the type and the zod schema but no UI writes it.**
    Is a pet fee/field expected? `NOT FOUND IN CODE`.
14. **No minimum-nights rule anywhere.** Is that a product decision, or is it enforced by
    erxes/PMS server-side (not visible from this repo)?
15. **`cpPmsCheckRooms` and `salesPipelineDetail` are fully written with zero callers.**
    Were they part of a pricing/quote step that was removed, or not yet wired?
16. **`PaymentTdbDialog` is complete but unimported.** Was the card flow originally
    new-tab (`window.open`) and later changed to `window.location.assign`? If so, is the
    new-tab variant still wanted?
17. **Are the erxes form field ids in `ErxesFormModal.tsx:40-100` stable across form edits?**
    They are erxes-generated and would silently break if the pay-at-property form is rebuilt
    in the erxes UI. No fallback exists.
18. **`payment-detail.tsx` is mounted with `reconciliationOnly` on revisit**
    (`bookingPaymentPage.tsx:64-70`), which hides the selector but still runs the mount
    reconciliation effect. Confirm this is desired — it means a page view can mutate a deal's
    stage.
19. **What is `NEXT_PUBLIC_TMS_BRANCH_ID` used for besides tour detail queries?** Only two
    reads found (`tms.tsx:18, 82`), one of which is a literal fallback — is the fallback
    intentional for local dev?
20. **`getCurrencySymbol` maps `MNT` → `$` in English and `₮` in Mongolian**
    (`src/lib/utils.ts:71-80`), while Track B hardcodes one or the other in JSX (§11 #36-37).
    Which is authoritative for the English locale?
