# Hotel (PMS) — CP GraphQL Reference

All queries and mutations use the `cp` prefix on `localhost:4000/graphql`.

---

### 1. `cpPmsRooms`
List rooms with booking date availability.
- `pipelineId: String!`, `startDate`, `endDate`, `skipStageIds`
- `page`, `perPage`

### 2. `cpPmsCheckRooms`
Check availability of specific rooms by ID.
- `pipelineId: String!`, `startDate`, `endDate`, `ids`, `skipStageIds`

### 3. `cpDeals`
List booking deals from the sales pipeline.
- `stageId`, `pipelineId`, `customerIds`, `productIds`, `labelIds`, `tagIds`
- `startDate`, `endDate`, `branchIds`, `departmentIds`, `boardIds`, `stageCodes`
- `search`, `priority`, `assignedUserIds`, `assignedToMe`
- Granular date filters: `startDateStartDate/EndDate`, `closeDateStartDate/EndDate`, `createdStartDate/EndDate`
- Pagination: `limit`, `cursor`, `cursorMode`, `direction`, `orderBy`, `sortMode`

### 4. `cpDealDetail`
Single deal detail.
- `_id: String!`, `clientPortalCard: Boolean`

### 5. `cpDealsAdd`
Create a new hotel booking deal.
- `name`, `stageId`, `customerIds`, `companyIds`, `productsData`, `paymentsData`
- `startDate`, `closeDate`, `description`, `assignedUserIds`, `labelIds`, `tagIds`
- `branchIds`, `departmentIds`, `attachments`, `priority`, `status`
- `processId`, `aboveItemId`, `propertiesData`, `extraData`

### 6. `cpDealsEdit`
Update an existing hotel booking deal.
- `_id: String!` + same optional args as `cpDealsAdd`

---

## Payment Workflow

### Step 1 — Create booking deal → `cpDealsAdd`
Book the room and get the deal `_id`.

### Step 2 — Create invoice → `cpInvoiceCreate`
```
input: {
  amount: Float!          # total room cost
  customerId: String
  contentType: "sales:deals"
  contentTypeId: <deal._id>
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

### Step 5 — Advance deal stage → `cpDealsEdit`
```
_id: <deal._id>
stageId: <paid stage id>
paymentsData: JSON
```
Move the deal to the paid/confirmed stage once payment is verified.

### Step 6 — (Optional) Record manual transaction → `cpPaymentTransactionsAdd`
```
input: {
  invoiceId: String!
  paymentId: String!
  amount: Float!
  details: JSON
}
```
Use if adding a manual/offline payment against the invoice.
