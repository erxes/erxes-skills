# Hotel Payment Flow

Complete payment implementation for erxes hotel (PMS deals). Adapts the ecommerce
payment guide to the reservation domain — there is **no** cart and **no** order;
payment is attached to a **deal** (booking), and the gateway methods come from
`NEXT_PUBLIC_PAYMENT_IDS` instead of an interactive payment picker.

> **Everything here is starter-owned.** The invoice mutations, the invoice check,
> and `useInvoice` all ship with `erxes-web-starter`. Import them; do not author
> them. See `generate-hooks.md` §1 and `generate-graphql.md` §4.

---

## Overview

```
Room detail -> cpDealsAdd (BOOKING_STAGE_ID)
  -> /booking/confirm -> invoiceCreate (paymentIds from env, contentType "sales:deals")
  -> QR displayed on confirm page (transactions[].response / .details qrData)
  -> /booking/verify -> invoicesCheck (mutation -> Boolean)
  -> onPaid -> cpDealsEdit -> PAID_STAGE_ID  (done)
```

Hotel vs ecommerce differences — only the **domain** differs. The payment
operations are the starter's, shared with ecommerce:

| Concept | Ecommerce | Hotel |
|---|---|---|
| Subject | `pos:orders` (order) | `sales:deals` (deal/booking) |
| Invoice create | `invoiceCreate` | `invoiceCreate` — **same starter mutation** |
| Invoice check | `invoicesCheck` (mutation -> Boolean) | `invoicesCheck` — **same, Boolean** |
| Payment selection | `selectedPaymentAtom` (user picks) | `paymentIds` array from env |
| Landing target | `/verify` | `/booking/verify?invoiceId=...` (navigated in-app) |
| Completion | invoice paid | invoice paid **AND** deal advanced to `PAID_STAGE_ID` |

---

## Payment is QR / `transactions`-based — one path only

**There is exactly one payment path. Do not implement a second one.**

The starter's `INVOICE_CREATE` mutation selects `transactions` on the created
invoice, and the starter's `useInvoice` reads QR data out of the transaction
`response` / `details`. That is the flow:

1. `create()` -> invoice returned with `transactions[]`.
2. Render the QR from `transaction.response` / `transaction.details`.
3. `check(invoiceId)` -> `invoicesCheck` mutation returns `true` when paid.
4. `onPaid` -> advance the deal to `PAID_STAGE_ID`.

> **UNVERIFIED — NOT to be implemented.** The starter selects **no redirect
> field**. `redirectUrl` does not exist on `Invoice`; `redirectUri` is not in the
> starter's `InvoiceInput` and is not in the mutation's selection set.
> - Do **not** pass `redirectUri` in the invoice input.
> - Do **not** branch on `invoice.redirectUrl` or `invoice.redirectUri`.
> - Do **not** treat `/booking/verify` as a gateway return URL. The site
>   navigates there itself after `onPaid`.
>
> A redirect-based flow is a separate, unproven capability. If a hotel needs one,
> raise it as a gateway capability check first — never code it speculatively.

---

## Step 1: Invoice creation (`/booking/confirm`)

The room detail page already created the deal (`cpDealsAdd`) and redirected here
with `dealId` + `nights`. On mount, the starter's `useInvoice().create()` issues
`INVOICE_CREATE`:

```typescript
// consume the starter hook — do not recreate it
import { useInvoice } from "@/lib/hooks/useInvoice";

const { create, check, status } = useInvoice({ onPaid, onFailed });

await create({
  amount,                      // room.price x nights — never a nights * 100 placeholder
  contentType: "sales:deals",
  contentTypeId: dealId,
  paymentIds: getPaymentIds(), // NEXT_PUBLIC_PAYMENT_IDS, comma-split
  description: "Room booking",
});
```

**Invoice inputs (starter `InvoiceInput`):**

| Field | Value |
|---|---|
| `amount` | `room.price * calcNights(checkIn, checkOut)` — real total computed from room data; do not hardcode |
| `contentType` | `"sales:deals"` |
| `contentTypeId` | deal `_id` from `cpDealsAdd` |
| `paymentIds` | `NEXT_PUBLIC_PAYMENT_IDS.split(",").filter(Boolean)` (all configured gateway methods) |
| `description` | `"Room booking"` (or booking name) |
| `redirectUri` | **not sent** — not a starter field (see the UNVERIFIED note above) |

> The gateway returns the invoice `_id`; the confirm page keeps `status` at
> `"pending"` while payment proceeds.

---

## Step 2: Display the QR

QR-based flows display the QR on the confirm page while the user scans it. The
user leaves the page by scanning, not by redirect. Extract QR defensively:

```typescript
const qr =
  invoice?.transactions?.[0]?.response?.qrData ||
  invoice?.transactions?.[0]?.details?.qrData ||
  "";
```

For a live update without a manual refresh, the starter also exposes the
`INVOICE_UPDATED` and `TRANSACTION_UPDATED` subscriptions from
`@/graphql/ecommerce/queries/payment`. Use them if the design calls for it;
polling is not required.

---

## Step 3: Status check (`/booking/verify`)

`useInvoice().check(invoiceId)` runs `INVOICES_CHECK` — a **mutation**, and it
returns a plain **Boolean** (`true` = paid). It is not a query and it returns no
`status` string. Auto-invoke it in an effect when `invoiceId` is present:

```typescript
useEffect(() => {
  if (invoiceId) check(invoiceId);
}, [invoiceId]);
```

Map the Boolean:

- `true` -> `onPaid(invoiceId)` -> advance deal to `PAID_STAGE_ID` via `cpDealsEdit` -> success screen
- `false` -> `onFailed()` -> retry screen
- hook still `pending` -> show "verifying" until a terminal state

No auto-polling loop; a manual "re-check" button can re-invoke `check()` if the
first call arrives before the gateway settles.

---

## Step 4: Deal completion

Deal advancement is the hotel-specific step that ecommerce does not have.
On `onPaid(invoiceId)`:

```typescript
await cpDealsEdit({ variables: { _id: dealId, stageId: PAID_STAGE_ID } });
router.push(`/booking/verify?invoiceId=${invoiceId}`);
```

This moves the booking into the paid stage of the PMS pipeline. Confirm page order:
**advance the deal, then route to verify.**

---

## Deposits & cancellation fees

- **Deposit:** when the hotel takes a percentage upfront, create the invoice for
  the deposit amount (`amount = room.price * nights * depositPercent / 100`), show
  the remainder due at check-in on the summary, and still advance the deal to
  `PAID_STAGE_ID` only on full-payment invoices. Keep the policy copy (deposit %,
  refund window) from `HANDOFF.md`, then `design-brief.md`/`source-observation.md`
  `observed_copy`, on the confirm page.
- **Cancellation fee:** never a silent backend charge — display the cancellation
  policy on the confirm page and in the FAQ CMS page. (erxes PMS has no built-in
  auto-fee; the policy is informational.)
---

## Hooks — import, do not author

| Need | Source |
|---|---|
| `useInvoice` (`create`, `check`, `status`) | `@/lib/hooks/useInvoice` (starter) |
| `INVOICE_CREATE`, `INVOICES_CHECK`, `PAYMENT_TRANSACTIONS_ADD` | `@/graphql/ecommerce/mutations/payment` (starter) |
| `CP_PAYMENTS`, `INVOICE_UPDATED`, `TRANSACTION_UPDATED` | `@/graphql/ecommerce/queries/payment` (starter) |
| `useDeals`, `useDeal`, `useCreateDeal`, `useUpdateDeal` | hotel hooks in `lib/hooks/booking.ts` (authored — see `generate-hooks.md` §3) |

**There are no hotel `useCreateInvoice`, `useAddPaymentTransaction`, or
`useCheckInvoice` hooks to write.** The starter's `useInvoice` and the starter's
payment mutations already cover all three. Do not create hotel wrappers that
re-issue the same operations, and do not add a second payment path.

---

## GraphQL

See `generate-graphql.md` §4 for the verbatim starter operations. Summary of the
three hotel-relevant ones:

```graphql
# starter — @/graphql/ecommerce/mutations/payment
mutation InvoiceCreate($input: InvoiceInput!) {
  invoiceCreate(input: $input) {
    _id
    invoiceNumber
    amount
    remainingAmount
    status
    data
    contentTypeId
    transactions {
      _id
      paymentId
      paymentKind
      status
      details
      response
    }
  }
}

# starter — returns a plain Boolean; true means paid
mutation InvoicesCheck($id: String!) {
  invoicesCheck(_id: $id)
}

# starter — offline transaction (cash at reception, bank transfer)
mutation PaymentTransactionsAdd($input: PaymentTransactionInput!) {
  paymentTransactionsAdd(input: $input) {
    _id
    amount
    invoiceId
    paymentId
    paymentKind
    status
    response
    details
  }
}
```

Invoice variable contract (`invoiceCreate`):

```json
{
  "input": {
    "amount": "<total room cost = room price x nights>",
    "contentType": "sales:deals",
    "contentTypeId": "<deal._id>",
    "paymentIds": ["<NEXT_PUBLIC_PAYMENT_IDS split by comma>"],
    "description": "<room name> booking"
  }
}
```

Status mapping: `invoicesCheck` returns `true` = paid, `false` = not paid. There
is no status string to parse and no `{ _id, status, resolvedAt }` object.

---

## Нийтлэг алдаанууд (common errors)

1. **QR харагдахгүй** — `transactions[0].response` болон `details` хоёуланг шалга (`qrData` талбар). Redirect fallback байхгүй.
2. **Invoice `_id` байхгүй** — `invoiceCreate` амжилтгүй; `paymentIds` хоосон (env `NEXT_PUBLIC_PAYMENT_IDS` уншигдаагүй)
3. **`invoicesCheck`-ийг query гэж бодсон** — энэ бол **mutation**, `Boolean` буцаана: `true` = төлсөн. `.status` гэж уншвал алдаа
4. **amount = 0 байна** — `nights`/`room.price` анхны утга 0; `calcNights` + бодит room price-оос тооцоол, `nights * 100` placeholder бүү хэрэглэ
5. **validate BN: wrong stage** — deal-г буруу stage-руу зөөсөн; `BOOKING_STAGE_ID` → `PAID_STAGE_ID` дарааллыг шалга, `NEXT_PUBLIC_PAID_STAGE_ID` эрт хэрэглээгүй эсэхээ баталгаажуул
6. **verify дээр "pending" гацсан** — `onPaid` дотор `cpDealsEdit`-ийг invoice төлсөнөөс **өмнө** дуудсан бол deal paid буцаж ирнэ; дарааллыг `confirm → QR → check → advance → verify` гэж баримтал
