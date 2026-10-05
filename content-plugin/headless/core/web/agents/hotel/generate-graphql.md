# Hotel GraphQL Layer

Maps the erxes gateway queries/mutations the hotel frontend calls. The cloned
starter already defines the layout under `src/graphql/`; `scripts/clone.ts`
prunes inactive verticals after cloning, so a hotel run retains
`src/graphql/auth/`, `src/graphql/cms/`, `src/graphql/hotel/`, and the two shared payment operation files
`src/graphql/ecommerce/{mutations,queries}/payment.ts`.

**Do NOT recreate operations that already exist** in the cloned starter or in the
reference project's `src/graphql/` — import from there. Only author the hotel
specifics below.

---

## 1. Files layout

Folder-style, matching the reference project's established layout (one operation
file per concern, re-exported through `index.ts`):

```
src/graphql/hotel/
  queries/
    index.ts       → export * from "./rooms"; export * from "./booking";
    rooms.ts       → Room types + `cpPmsRooms` / `cpPmsCheckRooms`
    booking.ts     → Deal type + `cpDeals` / `cpDealDetail`
  mutations/
    index.ts       → export * from "./booking";
    booking.ts     → `cpDealsAdd` / `cpDealsEdit` (DealInput)
```

Each operation file also exports its matching `*Variables` / `*Data` types plus
the entity types (`Room`, `Deal`, `DealInput`) so `generate-hooks.md`
and `generate-types.md` can import them without re-declaring.

### Payment operations are NOT hotel files — import them

**Do not author any payment operation.** The starter keeps every hotel payment
operation in the `ecommerce` GraphQL folder:

| Import | From |
|---|---|
| `INVOICE_CREATE`, `INVOICES_CHECK`, `PAYMENT_TRANSACTIONS_ADD` | `@/graphql/ecommerce/mutations/payment` |
| `CP_PAYMENTS`, `INVOICE_UPDATED`, `TRANSACTION_UPDATED` | `@/graphql/ecommerce/queries/payment` |

---

## 2. `queries/rooms.ts`

```typescript
import { gql } from "@apollo/client";

// Room list for the selected date range
export const CP_PMS_ROOMS = gql`
  query CpPmsRooms(
    $pipelineId: String!
    $startDate: Date
    $endDate: Date
    $skipStageIds: [String]
    $page: Int
    $perPage: Int
  ) {
    cpPmsRooms(
      pipelineId: $pipelineId
      startDate: $startDate
      endDate: $endDate
      skipStageIds: $skipStageIds
      page: $page
      perPage: $perPage
    ) {
      _id
      name
      description
      price
    }
  }
`;

// Availability check for specific room(s) before showing the booking form
export const CP_PMS_CHECK_ROOMS = gql`
  query CpPmsCheckRooms(
    $pipelineId: String!
    $startDate: Date
    $endDate: Date
    $ids: [String]
    $skipStageIds: [String]
  ) {
    cpPmsCheckRooms(
      pipelineId: $pipelineId
      startDate: $startDate
      endDate: $endDate
      ids: $ids
      skipStageIds: $skipStageIds
    ) {
      _id
      available
    }
  }
`;
```

---

## 3. `queries/booking.ts`

```typescript
import { gql } from "@apollo/client";

// Bookings (deals) — customer's booking history
export const CP_DEALS = gql`
  query CpDeals(
    $pipelineId: String
    $customerIds: [String]
    $startDate: Date
    $endDate: Date
    $limit: Int
    $cursor: String
  ) {
    cpDeals(
      pipelineId: $pipelineId
      customerIds: $customerIds
      startDate: $startDate
      endDate: $endDate
      limit: $limit
      cursor: $cursor
    ) {
      _id
      name
      stageId
      startDate
      closeDate
      status
    }
  }
`;

export const CP_DEAL_DETAIL = gql`
  query CpDealDetail($_id: String!, $clientPortalCard: Boolean) {
    cpDealDetail(_id: $_id, clientPortalCard: $clientPortalCard) {
      _id
      name
      stageId
      startDate
      closeDate
      description
      status
      productsData
      paymentsData
    }
  }
`;
```

---

## 4. Payment operations — import from the starter, do not author

Copied verbatim from the starter (`src/graphql/ecommerce/mutations/payment.ts`
and `src/graphql/ecommerce/queries/payment.ts`). Note the invoice mutation is
`invoiceCreate` (no `cp` prefix) and that the check is a **mutation returning a
Boolean** — there is no `cpInvoicesCheck` query and no `{ _id, status,
resolvedAt }` object anywhere in the starter.

```typescript
// @/graphql/ecommerce/mutations/payment.ts  (starter — import, never recreate)
export const INVOICE_CREATE = gql`
  mutation InvoiceCreate($input: InvoiceInput!) {
    invoiceCreate(input: $input) {
      _id
      invoiceNumber
      amount
      remainingAmount
      phone
      email
      description
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
`;

// Returns a plain Boolean — `true` means paid.
export const INVOICES_CHECK = gql`
  mutation InvoicesCheck($id: String!) {
    invoicesCheck(_id: $id)
  }
`;

export const PAYMENT_TRANSACTIONS_ADD = gql`
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
`;

// @/graphql/ecommerce/queries/payment.ts  (starter)
export const CP_PAYMENTS = gql`
  query cpPayments {
    cpPayments {
      _id
      name
      kind
      status
      config
      createdAt
    }
  }
`;

export const INVOICE_UPDATED = gql`
  subscription invoiceUpdated($invoiceId: String!) {
    invoiceUpdated(_id: $invoiceId)
  }
`;

export const TRANSACTION_UPDATED = gql`
  subscription transactionUpdated($invoiceId: String!) {
    transactionUpdated(invoiceId: $invoiceId)
  }
`;
```

Starter `InvoiceInput` (the only accepted invoice fields):

```typescript
{
  amount: number;
  phone?: string;
  email?: string;
  description?: string;
  contentType?: string;
  contentTypeId?: string;
  customerId?: string;
  customerType?: string;
  paymentIds?: string[];
  data?: Record<string, unknown>;
}
```

> **UNVERIFIED — do not implement.** The starter selects **no redirect field**
> (`redirectUrl` does not exist on `Invoice`; `redirectUri` is not in the
> starter's `InvoiceInput` and is not selected in the response). Therefore the
> payment flow is **QR / `transactions`-based only**. Do not add a
> `redirectUri` input and do not branch on `invoice.redirectUrl` / `.redirectUri`.
> A redirect-based flow would need a gateway capability check first.

---

## 5. `mutations/booking.ts`

```typescript
import { gql } from "@apollo/client";

// Create a booking (a deal) from the room detail booking form
export const CP_DEALS_ADD = gql`
  mutation CpDealsAdd($input: DealInput!) {
    cpDealsAdd(input: $input) {
      _id
      name
    }
  }
`;

// advance deal stage (dealsEdit), e.g. to PAID_STAGE_ID after payment verified
export const CP_DEALS_EDIT = gql`
  mutation CpDealsEdit($_id: String!, $input: DealInput!) {
    cpDealsEdit(_id: $_id, input: $input) {
      _id
      stageId
    }
  }
`;
```

---

## 6. Payment mutations — see §4

There is no `src/graphql/hotel/mutations/payment.ts`. `invoiceCreate`,
`paymentTransactionsAdd`, and `invoicesCheck` are imported from
`@/graphql/ecommerce/mutations/payment` (see §4). Do not create a hotel copy and
do not add a `cp`-prefixed invoice mutation.

---

## Variable contracts (from `agents/hotel/reference.md`)

`CpDealsAdd` input:

```json
{
  "input": {
    "name": "<guest name> — <room name> <check-in> to <check-out>",
    "stageId": "<NEXT_PUBLIC_BOOKING_STAGE_ID>",
    "startDate": "<check-in ISO date>",
    "closeDate": "<check-out ISO date>",
    "customerIds": ["<cpUser._id if logged in>"],
    "productsData": [
      { "productId": "<room _id>", "quantity": 1, "unitPrice": "<room price per night>", "amount": "<total>" }
    ],
    "description": "<special requests>",
    "extraData": { "guests": "<number of guests>", "checkIn": "<check-in date>", "checkOut": "<check-out date>" }
  }
}
```

`CpDealsEdit` input (`_id` + `input`):

```json
{ "_id": "<deal._id>", "input": { "stageId": "<NEXT_PUBLIC_PAID_STAGE_ID>", "paymentsData": "<payment details JSON>" } }
```

`CpInvoiceCreate` input:

```json
{
  "input": {
    "amount": "<total room cost = room price × nights>",
    "contentType": "sales:deals",
    "contentTypeId": "<deal._id>",
    "paymentIds": ["<NEXT_PUBLIC_PAYMENT_IDS split by comma>"],
    "description": "<room name> booking",
    "redirectUri": "<site-url>/booking/verify?invoiceId=<invoice._id>"
  }
}
```

---

## 7. CMS + Auth + Users

Clone the reference imports for anything that already exists in the starter:

- CMS pages `/` and `/[slug]` and blog lists → existing `src/graphql/cms/` queries.
- Menu queries → `cpMenus(language, kind)` (see `agents/hotel/reference.md`).
- Auth (login/register/logout/current user) → existing `src/graphql/auth/` queries/mutations — only used when `has_auth` is true in `hotel.config.json`.

---

## Rules

1. Every operation must be reachable from the resolver in `agents/hotel/reference.md` — do not invent new field names; extend only by diffing real gateway responses.
2. Keep the folder-style `queries/` + `mutations/` split with `index.ts` re-exports per the reference project's established layout (`src/graphql/hotel/`). Do not collapse into flat `queries.ts` / `mutations.ts` files — the starter and generated code import from the folder layout.
3. All ids passed to mutations are MongoDB `_id` values. Env-derived ids (`NEXT_PUBLIC_PMS_PIPELINE_ID`, stage ids, payment ids) are read in `lib/constants.ts` and passed as variables — never inline them in the GraphQL string.