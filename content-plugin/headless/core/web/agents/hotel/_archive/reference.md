# Hotel — GraphQL Reference

All queries and mutations use the `cp` prefix. Pass `x-app-token: <erxes_app_token>` in every request header.

---

## Queries

### `cpPmsRooms` — list available rooms

```graphql
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
    # add room-specific fields as available in your schema
  }
}
```

Use `NEXT_PUBLIC_PMS_PIPELINE_ID` for `pipelineId`. Call this when the user selects check-in / check-out dates on the rooms page.

---

### `cpPmsCheckRooms` — check specific room availability

```graphql
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
```

Call this on the room detail page before showing the booking form to confirm the room is still available.

---

### `cpDeals` — list booking deals (for user's booking history)

```graphql
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
```

---

### `cpDealDetail` — single booking detail

```graphql
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
```

---

## Mutations

### `cpDealsAdd` — create a booking

```graphql
mutation CpDealsAdd($input: DealInput!) {
  cpDealsAdd(input: $input) {
    _id
    name
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "<guest name> — <room name> <check-in> to <check-out>",
    "stageId": "<NEXT_PUBLIC_BOOKING_STAGE_ID>",
    "startDate": "<check-in ISO date>",
    "closeDate": "<check-out ISO date>",
    "customerIds": ["<cpUser._id if logged in>"],
    "productsData": [
      {
        "productId": "<room _id>",
        "quantity": 1,
        "unitPrice": "<room price per night>",
        "amount": "<total price>"
      }
    ],
    "description": "<special requests>",
    "extraData": {
      "guests": "<number of guests>",
      "checkIn": "<check-in date>",
      "checkOut": "<check-out date>"
    }
  }
}
```

---

### `cpDealsEdit` — advance deal to paid stage

```graphql
mutation CpDealsEdit($_id: String!, $input: DealInput!) {
  cpDealsEdit(_id: $_id, input: $input) {
    _id
    stageId
  }
}
```

**Variables (after payment verified):**

```json
{
  "_id": "<deal._id>",
  "input": {
    "stageId": "<NEXT_PUBLIC_PAID_STAGE_ID>",
    "paymentsData": "<payment details JSON>"
  }
}
```

---

## Payment Flow

### Step 1 — Create booking → `cpDealsAdd`

Call `cpDealsAdd` on booking form submit. Store the returned `deal._id`.

### Step 2 — Create invoice → `invoiceCreate` (starter operation)

Hotel imports this from `@/graphql/ecommerce/mutations/payment`; it is not
re-authored. The selection includes `transactions`:

```graphql
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
```

**Variables:**

```json
{
  "input": {
    "amount": "<total room cost>",
    "contentType": "sales:deals",
    "contentTypeId": "<deal._id>",
    "paymentIds": ["<NEXT_PUBLIC_PAYMENT_IDS split by comma>"],
    "description": "<room name> booking"
  }
}
```

> **UNVERIFIED — not to be implemented.** There is no `redirectUrl` field on
> `Invoice` and no `redirectUri` in `InvoiceInput`. Do not select, send, or branch
> on either. Payment is QR / `transactions`-based. See `agents/hotel/payment.md`.

### Step 3 — Subscribe for real-time updates (starter operations)

```graphql
subscription InvoiceUpdated($invoiceId: String!) {
  invoiceUpdated(_id: $invoiceId)
}

subscription TransactionUpdated($invoiceId: String!) {
  transactionUpdated(invoiceId: $invoiceId)
}
```

Listen while the user completes payment on the confirm page. Both are scalar
subscriptions imported from `@/graphql/ecommerce/queries/payment`.

### Step 4 — Verify payment → `invoicesCheck` (starter mutation, Boolean)

```graphql
mutation InvoicesCheck($id: String!) {
  invoicesCheck(_id: $id)
}
```

Returns a plain **Boolean** (`true` = paid). There is **no** `cpInvoicesCheck`
query and no `{ _id, status, resolvedAt }` object. Call it on the verify page and
as a fallback if the subscription doesn't fire. Use the starter's
`useInvoice().check(invoiceId)`.

### Step 5 — Advance deal stage → `cpDealsEdit`

Call `cpDealsEdit` with `stageId: NEXT_PUBLIC_PAID_STAGE_ID` once `invoicesCheck`
returns `true`.

### Step 6 — (Optional) Record manual transaction → `paymentTransactionsAdd`

```graphql
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

Imported from `@/graphql/ecommerce/mutations/payment`; do not author a `cp`-
prefixed copy.

---

## Environment Variables

| Variable | Source | Used in |
| -------- | ------ | ------- |
| `NEXT_PUBLIC_GRAPHQL_URL` | `erxes_endpoint` from hotel.config.json | Apollo client URI (starter) |
| `NEXT_PUBLIC_ERXES_APP_TOKEN` | `erxes_app_token` from hotel.config.json | Apollo `x-app-token` header (starter) |
| `ERXES_APP_TOKEN` | `erxes_app_token` from hotel.config.json | server-side `x-app-token` header (starter) |
| `NEXT_PUBLIC_CMS_ID` | `erxes_cms_id` from hotel.config.json | record-keeping only — NOT a header, NOT a GraphQL variable |
| `NEXT_PUBLIC_PAID_STAGE_ID` | `paid_stage_id` from hotel.config.json | `cpDealsEdit` stageId |
| `NEXT_PUBLIC_PAYMENT_IDS` | `payment_ids` (comma-separated) | `invoiceCreate` paymentIds |
