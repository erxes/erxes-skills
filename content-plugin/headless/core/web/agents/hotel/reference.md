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

### Step 2 — Create invoice → `cpInvoiceCreate`

```graphql
mutation CpInvoiceCreate($input: InvoiceInput!) {
  cpInvoiceCreate(input: $input) {
    _id
    status
    redirectUri
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
    "description": "<room name> booking",
    "redirectUri": "<site-url>/booking/verify?invoiceId=<invoice._id>"
  }
}
```

### Step 3 — Subscribe for real-time updates

```graphql
subscription InvoiceUpdated($_id: String!) {
  invoiceUpdated(_id: $_id) {
    _id
    status
  }
}

subscription TransactionUpdated($invoiceId: String!) {
  transactionUpdated(invoiceId: $invoiceId) {
    _id
    status
  }
}
```

Listen while the user completes payment on the confirm page.

### Step 4 — Verify payment → `cpInvoicesCheck`

```graphql
query CpInvoicesCheck($_id: String!) {
  cpInvoicesCheck(_id: $_id) {
    _id
    status
    resolvedAt
  }
}
```

Call this on the verify page (after redirect) and also as a fallback if the subscription doesn't fire.

### Step 5 — Advance deal stage → `cpDealsEdit`

Call `cpDealsEdit` with `stageId: NEXT_PUBLIC_PAID_STAGE_ID` once `cpInvoicesCheck` returns a confirmed status.

### Step 6 — (Optional) Record manual transaction → `cpPaymentTransactionsAdd`

```graphql
mutation CpPaymentTransactionsAdd($input: TransactionInput!) {
  cpPaymentTransactionsAdd(input: $input) {
    _id
  }
}
```

**Variables:**

```json
{
  "input": {
    "invoiceId": "<invoice._id>",
    "paymentId": "<payment method _id>",
    "amount": "<amount>",
    "details": {}
  }
}
```

---

## Environment Variables

| Variable | Source | Used in |
| -------- | ------ | ------- |
| `NEXT_PUBLIC_ERXES_ENDPOINT` | `erxes_endpoint` from hotel.config.json | Apollo client URI |
| `NEXT_PUBLIC_ERXES_APP_TOKEN` | `erxes_app_token` from hotel.config.json | Apollo `erxes-app-token` header |
| `NEXT_PUBLIC_CMS_ID` | `erxes_cms_id` from hotel.config.json | CMS queries |
| `NEXT_PUBLIC_PMS_PIPELINE_ID` | `pipeline_id` from hotel.config.json | `cpPmsRooms`, `cpPmsCheckRooms` |
| `NEXT_PUBLIC_BOOKING_STAGE_ID` | `booking_stage_id` from hotel.config.json | `cpDealsAdd` stageId |
| `NEXT_PUBLIC_PAID_STAGE_ID` | `paid_stage_id` from hotel.config.json | `cpDealsEdit` stageId |
| `NEXT_PUBLIC_PAYMENT_IDS` | `payment_ids` (comma-separated) | `cpInvoiceCreate` paymentIds |
