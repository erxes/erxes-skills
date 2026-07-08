# Tour (BMS) — CP GraphQL Reference

All queries and mutations use the `cp` prefix on `localhost:4000/graphql`.

---

### 1. `cpBmsTours`
List all tours with optional filters.
- `branchId`, `categoryIds`, `name`, `status`, `tags`
- `startDate1`, `startDate2`, `endDate1`, `endDate2`, `innerDate`, `date_status`
- `webId`, `language`
- Pagination: `limit`, `cursor`, `cursorMode`, `direction`, `orderBy`, `sortMode`

### 2. `cpBmsTourDetail`
Single tour detail including full itinerary.
- `_id: String!`, `branchId`, `language`

### 3. `cpBmToursGroup`
List tours grouped by `groupCode` (same tour, multiple departure dates).
- Same filter args as `cpBmsTours`

### 4. `cpBmToursGroupDetail`
Detail of a tour group by group code.
- `groupCode`, `status`, `language`

### 5. `cpBmsTourCategories`
List tour categories.
- `parentId`, `name`, `branchId`, `language`

### 6. `cpBmsItineraries`
List itineraries.
- `branchId`, `name`, `language`
- Pagination: `limit`, `cursor`, `cursorMode`, `direction`, `orderBy`, `sortMode`

### 7. `cpBmsItineraryDetail`
Single itinerary detail.
- `_id: String!`, `language`

### 8. `cpBmsOrders`
List tour orders.
- `tourId`, `customerId`, `branchId`
- Pagination: `limit`, `cursor`, `cursorMode`, `direction`, `orderBy`, `sortMode`

### 9. `cpBmsOrderAdd`
Create a tour order.
- `order: BmsOrderInput`
  - `tourId`, `customerId`, `branchId`, `amount`, `numberOfPeople`
  - `type`, `status`, `note`, `internalNote`
  - `additionalCustomers: [String]`, `isChild`, `parent`

### 10. `cpBmsOrderEdit`
Update an existing tour order.
- `_id: String!`, `order: BmsOrderInput`

### 11. `cpBmsOrderRemove`
Delete one or more tour orders.
- `ids: [String]`

---

## Payment Workflow

### Step 1 — Create order → `cpBmsOrderAdd`
Book the tour and get the order `_id`.

### Step 2 — Create invoice → `cpInvoiceCreate`
```
input: {
  amount: Float!          # total tour cost
  customerId: String
  contentType: "bms:order"
  contentTypeId: <order._id>
  paymentIds: [String]    # which payment methods to offer
  description: String
  redirectUri: String     # where to redirect after payment
}
```

### Step 3 — Subscribe for real-time updates
```
subscription invoiceUpdated($_id: String!)
subscription transactionUpdated($invoiceId: String!)
```
Listen for status changes while the customer completes payment.

### Step 4 — Verify payment → `cpInvoicesCheck`
```
_id: <invoice._id>
```
Poll or call after redirect to confirm final payment status.

### Step 5 — (Optional) Record manual transaction → `cpPaymentTransactionsAdd`
```
input: {
  invoiceId: String!
  paymentId: String!
  amount: Float!
  details: JSON
}
```
Use if adding a manual/offline payment against the invoice.
