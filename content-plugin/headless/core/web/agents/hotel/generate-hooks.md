# Hotel Hooks Layer

Composable data hooks on top of Apollo. Keep them thin; colocation and naming
follow the reference project (`agents/hotel/AGENTS.md` page patterns).

---

## 1. `useInvoice` — IMPORT FROM THE STARTER, DO NOT AUTHOR

`src/lib/hooks/useInvoice.ts` ships with the starter. **Do not create, rewrite,
or extend it.** Import it and call it.

```typescript
// Consume the starter hook — do not recreate it
import { useInvoice } from "@/lib/hooks/useInvoice";

const { create, check, status } = useInvoice({ onPaid, onFailed });
```

Its contract is fixed by the starter:

- `create(input)` calls the `INVOICE_CREATE` mutation and returns the invoice.
  The input fields are the starter's `InvoiceInput` — `amount`, `phone`, `email`,
  `description`, `contentType`, `contentTypeId`, `customerId`, `customerType`,
  `paymentIds`, `data`.
- `check(invoiceId)` calls the `INVOICES_CHECK` **mutation**, which returns a
  plain **Boolean** (`true` = paid). It is not a query and returns no `status`
  string.
- `status` is one of `idle` / `pending` / `paid` / `failed`.

> **Do not pass `redirectUri`.** The starter's `InvoiceInput` has no such field
> and the starter selects no redirect value. Payment is QR / `transactions`
> based. See `agents/hotel/payment.md` and the UNVERIFIED note in
> `generate-graphql.md` §4.

## 2. Room + availability

```typescript
// lib/hooks/rooms.ts
"use client";

import { useQuery } from "@apollo/client";
import { CP_PMS_ROOMS, CP_PMS_CHECK_ROOMS } from "@/graphql/hotel/queries";
import { PMS_PIPELINE_ID } from "@/lib/constants";

export function useCheckRoom(roomId: string, checkIn?: string, checkOut?: string) {
  return useQuery(CP_PMS_CHECK_ROOMS, {
    variables: {
      pipelineId: PMS_PIPELINE_ID,
      startDate: checkIn || undefined,
      endDate: checkOut || undefined,
      ids: [roomId],
    },
    skip: !roomId || !checkIn || !checkOut,
  });
}

export function useRooms(checkIn?: string, checkOut?: string) {
  return useQuery(CP_PMS_ROOMS, {
    variables: {
      pipelineId: PMS_PIPELINE_ID,
      startDate: checkIn || undefined,
      endDate: checkOut || undefined,
    },
  });
}
```

---

## 3. Booking mutations (deal lifecycle)

```typescript
// lib/hooks/booking.ts
"use client";

import { useMutation } from "@apollo/client";
import { CP_DEALS_ADD, CP_DEALS_EDIT } from "@/graphql/hotel/mutations";
import { BOOKING_STAGE_ID, PAID_STAGE_ID } from "@/lib/constants";

export function useCreateBooking(roomId: string, checkIn?: string, checkOut?: string) {
  const [mutate] = useMutation(CP_DEALS_ADD);
  return async (input: {
    guestName: string;
    nights: number;
    unitPrice: number;
    description?: string;
    guests?: number;
  }) => {
    const { data } = await mutate({
      variables: {
        input: {
          name: `${input.guestName} — Room ${roomId} ${checkIn} to ${checkOut}`,
          stageId: BOOKING_STAGE_ID,
          startDate: checkIn,
          closeDate: checkOut,
          description: input.description,
          productsData: [
            {
              productId: roomId,
              quantity: 1,
              unitPrice: input.unitPrice,
              amount: input.unitPrice * input.nights,
            },
          ],
          extraData: { guests: input.guests ?? 1, checkIn, checkOut },
        },
      },
    });
    return data?.cpDealsAdd?._id as string | undefined;
  };
}

// Advance booking (deal) into PAID_STAGE_ID after payment verified
export function useMarkBookingPaid() {
  const [mutate] = useMutation(CP_DEALS_EDIT);
  return async (dealId: string, paymentsData?: unknown) => {
    await mutate({
      variables: { _id: dealId, input: { stageId: PAID_STAGE_ID, paymentsData } },
    });
  };
}
```

### `useBookingParams` — shared query-param reader for the booking flow

Used by both `booking/confirm` and `booking/verify` (and the room-detail booking
form handoff). Reads `dealId`, `invoiceId`, `nights`, `amount` from `searchParams`:

```typescript
// lib/hooks/useBookingParams.ts
"use client";

import { useSearchParams } from "next/navigation";

export function useBookingParams() {
  const searchParams = useSearchParams();
  return {
    dealId: searchParams.get("dealId") ?? "",
    invoiceId: searchParams.get("invoiceId") ?? "",
    nights: Number(searchParams.get("nights") ?? 1),
    amount: Number(searchParams.get("amount") ?? 0),
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
  };
}
```

> `amount` is threaded through the URL by the room-detail booking form
> (`/booking/confirm?dealId&nights&amount`) so the confirm page never recomputes
> pricing from a hardcoded placeholder. Compute it at handoff time with
> `room.price * calcNights(checkIn, checkOut)`.

---

## 4. CMS + auth (copy the starter/reference imports)

- `useMenus(kind)` → from `src/graphql/cms/` + dedupe helper used in Header/Footer (see `agents/hotel/generate-components.md`).
- `useCurrentUser`, `useLogin`, `useRegister`, `useLogout` → only when `has_auth`. Import the starter's auth hooks from `@/lib/auth/hooks`; the session token itself is the starter's business (`localStorage.getItem("token")` in the browser, `token` cookie on the server, sent as `authorization: Bearer`). Do not author a hotel token store.

---

## Rules

1. Hooks must stay client-side (`"use client"`) and never import server-only modules.
2. `useInvoice.check()` is the single entry point for invoice status. Do not duplicate its logic in pages. It calls the `INVOICES_CHECK` **mutation**, which returns a plain Boolean (`true` = paid) — there is no `cpInvoicesCheck` query. See `generate-graphql.md` §4.
3. Stage/pipeline/payment ids are read from `lib/constants.ts` env-derived helpers — never hardcoded.
4. Every hook returns Apollo's loading/error alongside data, so pages can render the pattern's loading + error states.
5. `UseInvoiceOptions` (`onPaid`/`onFailed`) and `CreateInvoiceParams` are defined by the starter's `src/lib/hooks/useInvoice.ts`; reuse that contract rather than redefining it in pages.