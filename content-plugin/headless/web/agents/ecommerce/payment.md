# Payment Flow

Complete payment implementation for erxes ecommerce.

---

## Overview

```
Checkout Form → cpOrdersAdd → /verify → invoiceCreate + paymentTransactionsAdd → QR Display → invoicesCheck (button) → Done
```

---

## Step 1: Checkout Form (`/checkout`)

User fills delivery info, selects payment method, clicks "Захиалга илгээх".

```typescript
// src/app/[locale]/checkout/page.tsx
const handleSubmit = async () => {
  if (items.length === 0) return;
  setIsSubmitting(true);

  const result = await createOrder({
    items: items.map((item) => ({
      productId: item.productId,
      count: item.count,
      unitPrice: item.unitPrice,
    })),
    totalAmount: items.reduce((sum, item) => sum + item.unitPrice * item.count, 0),
    type: "delivery",
    customerId: currentUser?._id,
    customerType: "customer",
    deliveryInfo: { address, phone, description },
  });

  if (result.success) {
    router.push("/verify");
  } else {
    setIsSubmitting(false);
  }
};
```

**PaymentType component** нь checkout хуудсан дээр байна — `selectedPaymentAtom`-д утга хадгална.

---

## Step 2: Order Creation (`useOrderCUD`)

```typescript
// src/hooks/order.ts
const createOrder = useCallback(async (variables) => {
  setOrderLoading(true);
  try {
    const calculatedTotal =
      variables.totalAmount > 0
        ? variables.totalAmount
        : variables.items.reduce((sum, item) => sum + item.unitPrice * item.count, 0);

    const { data } = await addMutation({
      variables: { ...variables, totalAmount: calculatedTotal },
    });
    const order = (data as any)?.cpOrdersAdd;

    if (order?._id) {
      setActiveOrder({ ...order, totalAmount: calculatedTotal });
      setCartItems([]);
    }

    return { success: !!order?._id, order: { ...order, totalAmount: calculatedTotal } };
  } finally {
    setOrderLoading(false);
  }
}, [...]);
```

**ЧУХАЛ:** `activeOrderAtom`-д `totalAmount`-г тооцоолсон утгаар хадгална — `activeOrder.totalAmount` 0 байж болзошгүй тул items-аас fallback тооцоол.

---

## Step 3: Verify хуудас (`/verify`)

`activeOrderAtom`-аас order, `selectedPaymentAtom`-аас payment уншина. Route-д ID байхгүй — `/verify` (flat route).

```typescript
// src/app/[locale]/verify/page.tsx
const [activeOrder] = useAtom(activeOrderAtom);
const [selectedPayment] = useAtom(selectedPaymentAtom);
const [invoice] = useAtom(invoiceAtom);
const { createInvoice } = useCreateInvoice();
const { checkInvoice } = useCheckInvoice();
const { addTransaction } = useAddPaymentTransaction();
const [qrData, setQrData] = useState<string>("");
const [createdInvoiceId, setCreatedInvoiceId] = useState<string>("");
const [checking, setChecking] = useState(false);
const [status, setStatus] = useState<string>("");
```

---

## Step 4: Invoice + Transaction үүсгэх

"Төлбөр төлөх" товч дарахад invoice үүсгэж, дараа нь transaction (QR) үүсгэнэ.

```typescript
const handleCreateInvoice = async () => {
  if (!activeOrder || !selectedPayment) return;

  const orderTotal =
    activeOrder.totalAmount && activeOrder.totalAmount > 0
      ? activeOrder.totalAmount
      : activeOrder.items?.reduce(
          (sum: number, item: any) => sum + (item.unitPrice || 0) * (item.count || 1),
          0,
        ) || 0;

  const result = await createInvoice({
    paymentIds: [selectedPayment._id],
    amount: orderTotal,
    description: `Захиалга #${activeOrder._id}`,
    contentType: "pos:orders",
    contentTypeId: activeOrder._id,
    customerId: "empty",
    customerType: "visitor",
  });

  if (result.invoice?._id) {
    setCreatedInvoiceId(result.invoice._id);

    const txResult = await addTransaction({
      invoiceId: result.invoice._id,
      paymentId: selectedPayment._id,
      amount: orderTotal,
    });

    const qr =
      (txResult.transaction?.response as any)?.qrData ||
      (txResult.transaction?.details as any)?.qrData ||
      ((result.invoice.transactions?.[0]?.response as any)?.qrData) ||
      "";

    if (qr) setQrData(qr);
  }

  if (result.invoice?.redirectUrl) {
    window.location.href = result.invoice.redirectUrl;
  }
};
```

**Invoice input талбарууд:**

| Талбар | Утга |
|--------|------|
| `paymentIds` | `[selectedPayment._id]` |
| `amount` | `activeOrder.totalAmount` (items-аас fallback) |
| `description` | `"Захиалга #${activeOrder._id}"` |
| `contentType` | `"pos:orders"` |
| `contentTypeId` | `activeOrder._id` |
| `customerId` | `"empty"` |
| `customerType` | `"visitor"` |

---

## Step 5: QR харуулах

```typescript
{qrData && (
  <div className="mt-6 flex flex-col items-center">
    <p className="text-sm text-muted-foreground mb-2">QR кодоор төлнө үү</p>
    <img
      src={qrData}
      alt="Payment QR"
      className="rounded-lg border border-border"
      style={{ maxWidth: 256, maxHeight: 256 }}
    />
  </div>
)}
```

**QR-г `txResult.transaction.response.qrData` эсвэл `details.qrData`-аас авна.** Зарим payment provider base64, зарим нь URL буцаана — хоёуланг нь дэмжинэ.

---

## Step 6: Төлбөрийн төлөв шалгах (Button)

**Auto-polling байхгүй.** Хэрэглэгч "Төлбөрийн төлөв шалгах" товч дарна.

```typescript
const handleCheckStatus = async () => {
  const invoiceIdToCheck = createdInvoiceId || invoice?._id;
  if (!invoiceIdToCheck) {
    setStatus("Invoice олдсонгүй. Эхлээд төлбөр үүсгэнэ үү.");
    return;
  }
  setChecking(true);
  setStatus("Төлбөрийн мэдээлэл шалгаж байна...");
  const result = await checkInvoice(invoiceIdToCheck);
  setStatus(
    result === "paid"
      ? "Төлбөр амжилттай"
      : result === "pending"
        ? "Төлбөр хийгдээгүй байна"
        : "Мэдээлэл олдсонгүй",
  );
  setChecking(false);
};
```

---

## Hooks

### `useCreateInvoice`

```typescript
// src/hooks/payment.ts
export function useCreateInvoice() {
  const [createMutation, { loading, error }] = useMutation(CREATE_INVOICE);
  const [, setInvoice] = useAtom(invoiceAtom);

  const createInvoice = useCallback(async (params: {
    paymentIds: string[];
    amount: number;
    description?: string;
    contentType?: string;
    contentTypeId?: string;
    customerId?: string;
    customerType?: string;
  }) => {
    const { data } = await createMutation({
      variables: {
        input: {
          amount: params.amount,
          paymentIds: params.paymentIds,
          description: params.description || "",
          contentType: params.contentType || "pos:orders",
          contentTypeId: params.contentTypeId,
          customerId: params.customerId || "empty",
          customerType: params.customerType || "visitor",
          data: {},
        },
      },
    });

    const invoice = (data as any)?.invoiceCreate;
    if (invoice) setInvoice(invoice);

    return { success: !!invoice, invoice };
  }, [createMutation, setInvoice]);

  return { createInvoice, loading, error };
}
```

### `useAddPaymentTransaction`

```typescript
export function useAddPaymentTransaction() {
  const [addMutation, { loading, error }] = useMutation(PAYMENT_TRANSACTIONS_ADD);

  const addTransaction = useCallback(async (params: {
    invoiceId: string;
    paymentId: string;
    paymentKind?: string;
    amount?: number;
    details?: Record<string, unknown>;
  }) => {
    const { data } = await addMutation({
      variables: {
        input: {
          invoiceId: params.invoiceId,
          paymentId: params.paymentId,
          paymentKind: params.paymentKind,
          amount: params.amount,
          details: params.details,
        },
      },
    });

    const transaction = (data as any)?.paymentTransactionsAdd;
    return { success: !!transaction, transaction };
  }, [addMutation]);

  return { addTransaction, loading, error };
}
```

### `useCheckInvoice`

```typescript
export function useCheckInvoice() {
  const [checkMutation, { loading, error }] = useMutation(CHECK_INVOICE);

  const checkInvoice = useCallback(async (invoiceId: string) => {
    const { data } = await checkMutation({ variables: { id: invoiceId } });
    return (data as any)?.invoicesCheck ?? null;
  }, [checkMutation]);

  return { loading, error, checkInvoice };
}
```

### `usePaymentPoller` (no-op)

```typescript
export function usePaymentPoller() {
  return { startPolling: () => {}, stopPolling: () => {}, isPolling: false };
}
```

---

## Store

```typescript
// src/store/payment.store.ts
export const selectedPaymentAtom = atom<IPayment | null>(null);
export const paymentsAtom = atom<IPayment[]>([]);
export const invoiceAtom = atom<IInvoice | null>(null);
export const paymentLoadingAtom = atom(false);

// src/store/order.store.ts
export const activeOrderAtom = atom<IOrder | null>(null);
export const orderLoadingAtom = atom(false);
export const deliveryInfoAtom = atom<IDeliveryInfo>({
  address: "", phone: "", description: "",
});
export const orderTotalAtom = atom((get) => get(activeOrderAtom)?.totalAmount || 0);
```

---

## GraphQL

```graphql
mutation InvoiceCreate($input: InvoiceInput!) {
  invoiceCreate(input: $input) {
    _id invoiceNumber amount remainingAmount
    phone email description status data contentTypeId
    redirectUrl
    transactions { _id paymentId paymentKind status details response }
  }
}

mutation InvoicesCheck($id: String!) {
  invoicesCheck(_id: $id)
}

mutation PaymentTransactionsAdd($input: PaymentTransactionInput!) {
  paymentTransactionsAdd(input: $input) {
    _id amount invoiceId paymentId paymentKind status response details
  }
}
```

---

## Нийтлэг алдаанууд

1. **QR харагдахгүй** — `txResult.transaction.response` болон `details` хоёуланг шалга (`qrData` талбар)
2. **Invoice үүсгэхэд алдаа** — `selectedPayment` null байна, checkout дээр payment сонгоогүй
3. **activeOrder._id байхгүй** — `createOrder` амжилтгүй болсон, checkout-ийн error state шалга
4. **totalAmount = 0** — items-аас fallback тооцоол: `items.reduce((s, i) => s + i.unitPrice * i.count, 0)`
5. **redirectUrl байгаа бол** — `window.location.href` ашиглан redirect хий (QR харуулахгүй)
