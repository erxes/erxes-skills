# Hotel Booking Flow (booking/confirm + booking/verify)

> **Design rule:** Booking logic (deal creation, invoice, payment verify) is authoritative. All `className` values below are hotel reference patterns only — they are examples only, not to be copied verbatim. Apply your design tokens to every className before writing the file, and keep the booking-flow structure (redirect to `/rooms`, deal create → invoice → verify) intact.

The hotel booking pipeline is the direct analog of ecommerce's checkout, but deals
with reservations, not cart/orders. There is no cart and there are no delivery types —
the flow is:

```
room detail (BookingForm)
  → cpDealsAdd (BOOKING_STAGE_ID)
  → /booking/confirm?dealId&nights  (summary + payment)
  → cpInvoiceCreate (NEXT_PUBLIC_PAYMENT_IDS)
  → payment gateway redirect / QR
  → /booking/verify?invoiceId  (cpInvoicesCheck → onPaid/onFailed)
  → cpDealsEdit → PAID_STAGE_ID
```

# Design Binding Gate — REQUIRED before writing any booking page

### Step 1 — Read `design-tokens.json`

Open `output/<slug>/design-tokens.json`. Extract and hold in context (same table as `agents/hotel/generate.md` Design Binding Gate — Step 1).

### Step 2 — Read `HANDOFF.md`

Open `output/<slug>/HANDOFF.md`. Confirm the booking-flow wireframe notes (Frontend Build Map) and the approved visual direction. Motion level — if > 0, apply `motion` tokens to status transitions (`pending` → `paid`/`failed`).

### Step 3 — Verify `app/globals.css`

Check that `output/<slug>/app/globals.css` (Tailwind v4, `@import "tailwindcss";`) declares the design tokens in an `@theme inline` block (same gate as `generate-pages.md`). Hard rule: only use semantic classes whose `--color-*` keys are declared.

### Step 4 — className Mapping

Map every reference className to design tokens using the table in `agents/hotel/generate-pages.md` Step 4 (same contract). Preserve the booking-page structure (summary panel, guest details, payment method list, status screen) and change only token values.

---

## Booking confirm — `app/[locale]/booking/confirm/page.tsx`

Structure is locked by `agents/hotel/AGENTS.md` Booking confirm pattern. Key contract:

- Reads `dealId` and `nights` from query params.
- On mount, `useInvoice().create()` with the reference signature (`generate-hooks.md` → `CreateInvoiceParams`):
  - `amount`: **real total = room price × nights**; the reference hardcodes `nights * 100` as a placeholder — replace it. When the room isn't passed via query param, fetch the deal detail (`cpDealDetail`) or the room price (`cpPmsRooms`) to compute it.
  - `contentType: "sales:deals"`, `contentTypeId: dealId`
  - `paymentIds` from `NEXT_PUBLIC_PAYMENT_IDS` (via `getPaymentIds()`)
  - `redirectUri: ${window.location.origin}/booking/verify`
- `onPaid(invoiceId)`: advance the deal to `PAID_STAGE_ID` via `cpDealsEdit` (`useMarkBookingPaid()`), then push `/booking/verify?invoiceId`.
- Renders `BookingSummary` (room, dates, nights, total) + `PaymentStatus` states (`idle` → `pending` → `paid`).

```tsx
// structure sketch — restyle with tokens, keep logic intact
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvoice } from "@/lib/hooks/useInvoice";
import { useMarkBookingPaid } from "@/lib/hooks/booking";
import { getPaymentIds } from "@/lib/constants";
import { BookingSummary } from "@/components/booking/BookingSummary";

export default function BookingConfirmPage() {
  const { dealId, nights, amount } = useBookingParams();
  const router = useRouter();
  const markPaid = useMarkBookingPaid();

  const { create, status } = useInvoice({
    onPaid: async (invoiceId) => {
      await markPaid(dealId);
      router.push(`/booking/verify?invoiceId=${invoiceId}`);
    },
  });

  useEffect(() => {
    if (dealId && amount) {
      create({
        amount, // computed = room.price × nights — see useBookingParams
        contentType: "sales:deals",
        contentTypeId: dealId,
        paymentIds: getPaymentIds(),
        description: "Room booking",
        redirectUri: `${window.location.origin}/booking/verify`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, amount]);

  return (
    <main>
      <BookingSummary ... />
      <p>Status: {status}</p>
      {status === "pending" && <p>Waiting for payment...</p>}
    </main>
  );
}
```

### Payment redirect behavior

When the chosen payment method requires an external redirect (e.g. QPay/SocialPay),
`cpInvoiceCreate` returns the invoice `_id`; the redirect/QR data is handled per
`agents/hotel/payment.md`. The booking-verify page is the universal landing target —
`redirectUri` always points at `/booking/verify`.

---

## Booking verify — `app/[locale]/booking/verify/page.tsx`

Structure is locked by `agents/hotel/AGENTS.md` Booking verify pattern:

- Reads `invoiceId` from query params.
- `useInvoice().check(invoiceId)` on mount → `cpInvoicesCheck`.
- `onPaid` → "Booking confirmed!"; `onFailed` → "Payment failed. Please try again."
- Status state machine: `idle → pending (verifying) → paid | failed`.

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInvoice } from "@/lib/hooks/useInvoice";

export default function BookingVerifyPage() {
  const invoiceId = useSearchParams().get("invoiceId") ?? "";
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

---

## Room detail → booking handoff

Room detail (`rooms/[id]`) calls `useCreateBooking(roomId, checkIn, checkOut)` and pushes:

```
/booking/confirm?dealId=<dealId>&nights=<n>&amount=<room.price × nights>
```

`nights` must be computed with `calcNights(checkIn, checkOut)` (see `generate-setup.md`), never a placeholder default when dates are present. `amount` is computed the same way and threaded through so the confirm page never hardcodes `nights * 100`.

---

## Booking flow rules

1. Deadlines/cancellation policy: copy the policy copy from `HANDOFF.md`, then `design-brief.md`/`source-observation.md` `observed_copy` (or the CMS FAQ section) into the confirm page — cancellation-fee handling is documented in `agents/hotel/payment.md`.
2. Auth: when `allow_guest` is false, require login before `cpDealsAdd` — redirect unauthenticated users to `/login?redirect=<current>`.
3. `_id` everywhere, never `id`.
4. Never hardcode the invoice amount (`nights * 100` in the AGENTS pattern is a placeholder). Total = room price × nights, sourced from real room data.
5. All env-derived ids (`NEXT_PUBLIC_PMS_PIPELINE_ID`, stage ids, payment ids) come from `lib/constants.ts`.
6. Do not restructure the state/hook flow while restyling — only className/token changes.