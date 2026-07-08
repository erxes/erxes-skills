# Payment — CP GraphQL Reference

All queries and mutations use the `cp` prefix on `localhost:4000/graphql`.
Source: `erxes/backend/plugins/payment_api`

> Note: payment plugin must be installed and enabled on the erxes instance.

---

## Queries

### 1. `cpPayments`
List available payment methods.
- `status: String`, `kind: String`

### 2. `cpInvoices`
List invoices with filters.
- `searchValue: String`, `kind: String`, `status: String`
- `contentType: String`, `contentTypeId: String`
- Pagination: `limit`, `cursor`, `direction`

### 3. `cpInvoiceDetail`
Single invoice detail.
- `_id: String!`

---

## Mutations

### 4. `cpInvoiceCreate`
Create a new invoice.
- `input: InvoiceInput!`
  - `amount: Float!`
  - `phone`, `email`, `description`
  - `customerId`, `customerType`
  - `contentType`, `contentTypeId`
  - `redirectUri`, `paymentIds: [String]`
  - `data: JSON`, `warningText`, `callback`, `currency`

### 5. `cpInvoicesCheck`
Check / verify invoice payment status.
- `_id: String!`

### 6. `cpPaymentTransactionsAdd`
Record a payment transaction against an invoice.
- `input: PaymentTransactionInput!`
  - `invoiceId: String!`
  - `paymentId: String!`
  - `amount: Float!`
  - `details: JSON`

---

## Subscriptions

### 7. `invoiceUpdated`
Real-time update when an invoice status changes.
- `_id: String!`

### 8. `transactionUpdated`
Real-time update when a transaction is processed.
- `invoiceId: String!`
