# Tour — GraphQL Reference

All queries and mutations use the `cp` prefix. Pass `x-app-token: <erxes_app_token>` in every request header.

---

## Queries

### `cpBmsTours` — list tours

```graphql
query CpBmsTours(
  $branchId: String
  $categoryIds: [String]
  $name: String
  $status: String
  $tags: [String]
  $startDate1: Date
  $startDate2: Date
  $endDate1: Date
  $endDate2: Date
  $language: String
  $limit: Int
  $cursor: String
) {
  cpBmsTours(
    branchId: $branchId
    categoryIds: $categoryIds
    name: $name
    status: $status
    tags: $tags
    startDate1: $startDate1
    startDate2: $startDate2
    endDate1: $endDate1
    endDate2: $endDate2
    language: $language
    limit: $limit
    cursor: $cursor
  ) {
    _id
    name
    description
    price
    startDate
    endDate
    categoryIds
    # add tour-specific fields as available in your schema
  }
}
```

Use `NEXT_PUBLIC_BMS_BRANCH_ID` for `branchId`. Pass `language` from current locale.

---

### `cpBmsTourDetail` — single tour

```graphql
query CpBmsTourDetail($_id: String!, $branchId: String, $language: String) {
  cpBmsTourDetail(_id: $_id, branchId: $branchId, language: $language) {
    _id
    name
    description
    price
    startDate
    endDate
    categoryIds
    itineraryId
  }
}
```

---

### `cpBmToursGroup` — tours grouped by departure date

```graphql
query CpBmToursGroup(
  $branchId: String
  $categoryIds: [String]
  $startDate1: Date
  $startDate2: Date
  $language: String
  $limit: Int
) {
  cpBmToursGroup(
    branchId: $branchId
    categoryIds: $categoryIds
    startDate1: $startDate1
    startDate2: $startDate2
    language: $language
    limit: $limit
  ) {
    groupCode
    tours {
      _id
      name
      startDate
      price
    }
  }
}
```

Use this on the tour detail page to show available departure dates for the same tour.

---

### `cpBmToursGroupDetail` — tour group detail

```graphql
query CpBmToursGroupDetail($groupCode: String, $status: String, $language: String) {
  cpBmToursGroupDetail(groupCode: $groupCode, status: $status, language: $language) {
    groupCode
    tours {
      _id
      name
      startDate
      endDate
      price
    }
  }
}
```

---

### `cpBmsTourCategories` — tour categories for filter

```graphql
query CpBmsTourCategories($parentId: String, $name: String, $branchId: String, $language: String) {
  cpBmsTourCategories(
    parentId: $parentId
    name: $name
    branchId: $branchId
    language: $language
  ) {
    _id
    name
    parentId
  }
}
```

Load once on the tours listing page. Use results for the category filter chips.

---

### `cpBmsItineraryDetail` — itinerary for a tour

```graphql
query CpBmsItineraryDetail($_id: String!, $language: String) {
  cpBmsItineraryDetail(_id: $_id, language: $language) {
    _id
    name
    days {
      day
      title
      description
      activities
    }
  }
}
```

Call this on the tour detail page when `cpBmsTourDetail` returns an `itineraryId`.

---

### `cpBmsOrders` — user's booking history

```graphql
query CpBmsOrders(
  $tourId: String
  $customerId: String
  $branchId: String
  $limit: Int
  $cursor: String
) {
  cpBmsOrders(
    tourId: $tourId
    customerId: $customerId
    branchId: $branchId
    limit: $limit
    cursor: $cursor
  ) {
    _id
    tourId
    customerId
    amount
    numberOfPeople
    status
    type
    note
  }
}
```

Use on the orders/bookings history page (only shown when `has_auth` is true).

---

## Mutations

### `cpBmsOrderAdd` — create a booking

```graphql
mutation CpBmsOrderAdd($order: BmsOrderInput) {
  cpBmsOrderAdd(order: $order) {
    _id
    tourId
    amount
    status
  }
}
```

**Variables:**

```json
{
  "order": {
    "tourId": "<selected tour _id>",
    "customerId": "<cpUser._id if logged in>",
    "branchId": "<NEXT_PUBLIC_BMS_BRANCH_ID>",
    "amount": "<total price>",
    "numberOfPeople": "<number of travellers>",
    "type": "online",
    "status": "pending",
    "note": "<special requests>",
    "additionalCustomers": [],
    "isChild": false
  }
}
```

---

### `cpBmsOrderEdit` — update a booking

```graphql
mutation CpBmsOrderEdit($_id: String!, $order: BmsOrderInput) {
  cpBmsOrderEdit(_id: $_id, order: $order) {
    _id
    status
  }
}
```

---

### `cpBmsOrderRemove` — cancel a booking

```graphql
mutation CpBmsOrderRemove($ids: [String]) {
  cpBmsOrderRemove(ids: $ids)
}
```

---

## Payment Flow

### Step 1 — Create order → `cpBmsOrderAdd`

Call `cpBmsOrderAdd` on booking form submit. Store the returned `order._id`.

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
    "amount": "<total tour cost>",
    "contentType": "bms:order",
    "contentTypeId": "<order._id>",
    "paymentIds": ["<NEXT_PUBLIC_PAYMENT_IDS split by comma>"],
    "description": "<tour name> booking",
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

Call on the verify page (after redirect) and as a fallback if the subscription doesn't fire.

### Step 5 — (Optional) Record manual transaction → `cpPaymentTransactionsAdd`

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
| `NEXT_PUBLIC_ERXES_ENDPOINT` | `erxes_endpoint` from tour.config.json | Apollo client URI |
| `NEXT_PUBLIC_ERXES_APP_TOKEN` | `erxes_app_token` from tour.config.json | Apollo `erxes-app-token` header |
| `NEXT_PUBLIC_CMS_ID` | `erxes_cms_id` from tour.config.json | CMS queries |
| `NEXT_PUBLIC_BMS_BRANCH_ID` | `branch_id` from tour.config.json | All `cpBms*` queries |
| `NEXT_PUBLIC_PAYMENT_IDS` | `payment_ids` (comma-separated) | `cpInvoiceCreate` paymentIds |
