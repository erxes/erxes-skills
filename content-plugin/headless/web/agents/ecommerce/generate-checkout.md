# Ecommerce Checkout + Verify Pages

> **Design rule:** Logic below is authoritative. All `className` values are reference only — apply your design tokens.

---

## Checkout (`app/[locale]/checkout/page.tsx`) — Client

Flow: fill delivery info → select payment method (PaymentType component) → submit → `createOrder` → redirect to `/verify`.

Key invariants:
- `deliveryInfo` must include all 6 fields: `firstName`, `lastName`, `email`, `phone`, `address`, `description`
- Pre-populate from `currentUser` on mount
- `type: "delivery"` always passed to `createOrder`
- On success → `router.push("/verify")` (no ID — reads from `activeOrderAtom`)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useRouter } from "@/i18n/routing";
import { cartItemsAtom, cartTotalAtom } from "@/store/cart.store";
import { currentUserAtom } from "@/store/auth.store";
import { useOrderCUD } from "@/hooks/order";
import { usePayments } from "@/hooks/payment";
import { PaymentType } from "@/components/payment/PaymentType";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const [items] = useAtom(cartItemsAtom);
  const [total] = useAtom(cartTotalAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const { createOrder } = useOrderCUD();
  const { payments } = usePayments();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.firstName) setFirstName(currentUser.firstName);
      if (currentUser.lastName) setLastName(currentUser.lastName);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    const calculatedTotal = items.reduce((sum, item) => sum + item.unitPrice * item.count, 0);

    const result = await createOrder({
      items: items.map((item) => ({
        productId: item.productId,
        count: item.count,
        unitPrice: item.unitPrice,
      })),
      totalAmount: calculatedTotal,
      type: "delivery",
      customerId: currentUser?._id,
      customerType: "customer",
      deliveryInfo: { firstName, lastName, email, address, phone, description },
    });

    if (result.success) {
      router.push("/verify");
    } else {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-8 px-4">
        <p className="text-muted-foreground">Сагс хоосон байна</p>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <h1 className="text-2xl font-bold">Төлбөр төлөх</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">

        {/* Left — delivery info + payment method */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold">Хүргэлтийн мэдээлэл</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Нэр</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Нэр" />
              </div>
              <div className="space-y-2">
                <Label>Овог</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Овог" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Имэйл</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Имэйл хаяг" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Утас</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Утасны дугаар" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Хаяг</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Хаягаа оруулна уу" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Нэмэлт тайлбар</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Нэмэлт мэдээлэл"
                  className="flex min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <PaymentType payments={payments} />
          </div>
        </div>

        {/* Right — order summary + submit */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold">Захиалгын хураангуй</h2>
            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.productName} x {item.count}</span>
                  <span>{formatPrice(item.unitPrice * item.count)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Нийт</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <Button
              className="mt-6 w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !firstName || !phone || !address}
            >
              {isSubmitting ? "Ачааллаж байна..." : "Захиалга илгээх"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
```

---

## Verify (`app/[locale]/verify/page.tsx`) — Client

Payment verification page. Reads order from `activeOrderAtom` (no route ID).

Key invariants:
- `handleCreateInvoice`: calls `createInvoice` then immediately `addTransaction` in one handler
- QR: `txResult.transaction?.response?.qrData` → `txResult.transaction?.details?.qrData` fallback
- `redirectUrl`: if present on invoice → `window.location.href = invoice.redirectUrl`
- Auto-polling: `setInterval(5000)` via `useCallback` + `useEffect`; starts after `createdInvoiceId` is set; stops when `paymentStatus === "paid"`
- `handleCheckStatus`: manual poll button — calls `checkInvoice`, updates `paymentStatus`
- `orderTotal`: use `activeOrder.totalAmount` if > 0, else sum items
- `StatusBadge`: maps status string to colored badge

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { activeOrderAtom } from "@/store/order.store";
import { selectedPaymentAtom, invoiceAtom } from "@/store/payment.store";
import { currentUserAtom } from "@/store/auth.store";
import {
  useCreateInvoice,
  useCheckInvoice,
  useAddPaymentTransaction,
} from "@/hooks/payment";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-purple-100 text-purple-700 border-purple-200",
    delivering: "bg-indigo-100 text-indigo-700 border-indigo-200",
    done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const labels: Record<string, string> = {
    paid: "Төлбөр төлөгдсөн", pending: "Хүлээгдэж байна", cancelled: "Цуцлагдсан",
    confirmed: "Баталгаажсан", preparing: "Бэлтгэж байна",
    delivering: "Хүргэлтэнд гарсан", done: "Дууссан",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const [activeOrder] = useAtom(activeOrderAtom);
  const [selectedPayment] = useAtom(selectedPaymentAtom);
  const [invoice] = useAtom(invoiceAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const { createInvoice } = useCreateInvoice();
  const { checkInvoice } = useCheckInvoice();
  const { addTransaction } = useAddPaymentTransaction();

  const [qrData, setQrData] = useState("");
  const [createdInvoiceId, setCreatedInvoiceId] = useState("");
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "creating" | "created" | "paid" | "error">("idle");

  // Auto-polling: starts after createdInvoiceId set, stops when paid
  const pollPayment = useCallback(
    async (invoiceId: string) => {
      if (!invoiceId || paymentStatus === "paid") return;
      const result = await checkInvoice(invoiceId);
      if (result === "paid") {
        setPaymentStatus("paid");
        setStatus("Төлбөр амжилттай хийгдлээ! 🎉");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const id = createdInvoiceId || invoice?._id;
    if (!id || paymentStatus === "paid") return;
    const interval = setInterval(() => pollPayment(id), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdInvoiceId, invoice?._id]);

  // One handler: invoiceCreate + paymentTransactionsAdd
  const handleCreateInvoice = async () => {
    if (!activeOrder || !selectedPayment) return;
    setPaymentStatus("creating");

    const orderTotal =
      activeOrder.totalAmount && activeOrder.totalAmount > 0
        ? activeOrder.totalAmount
        : activeOrder.items?.reduce(
            (s: number, i: { unitPrice?: number; count?: number }) =>
              s + (i.unitPrice || 0) * (i.count || 1),
            0,
          ) || 0;

    const result = await createInvoice({
      paymentIds: [selectedPayment._id],
      amount: orderTotal,
      description: `Захиалга #${activeOrder._id}`,
      contentType: "pos:orders",
      contentTypeId: activeOrder._id,
      customerId: currentUser?._id || "empty",
      customerType: currentUser?._id ? "customer" : "visitor",
    });

    if (result.invoice?._id) {
      setCreatedInvoiceId(result.invoice._id);
      setPaymentStatus("created");

      const txResult = await addTransaction({
        invoiceId: result.invoice._id,
        paymentId: selectedPayment._id,
        amount: orderTotal,
      });

      // QR fallback chain
      const qr =
        (txResult.transaction?.response as Record<string, unknown>)?.qrData ||
        (txResult.transaction?.details as Record<string, unknown>)?.qrData ||
        "";
      if (qr) setQrData(qr as string);
    } else {
      setPaymentStatus("error");
      setStatus("Төлбөр үүсгэхэд алдаа гарлаа");
    }

    // redirectUrl-г шалгана
    if (result.invoice?.redirectUrl) {
      window.location.href = result.invoice.redirectUrl;
    }
  };

  const handleCheckStatus = async () => {
    const id = createdInvoiceId || invoice?._id;
    if (!id) { setStatus("Invoice олдсонгүй."); return; }
    setChecking(true);
    const result = await checkInvoice(id);
    if (result === "paid") {
      setPaymentStatus("paid");
      setStatus("Төлбөр амжилттай хийгдлээ! 🎉");
    } else if (result === "pending") {
      setStatus("Төлбөр хийгдээгүй байна. QR кодоор төлнө үү.");
    } else {
      setStatus("Мэдээлэл олдсонгүй");
    }
    setChecking(false);
  };

  const deliveryInfo = (activeOrder?.deliveryInfo || {}) as Record<string, string>;
  const orderItems = activeOrder?.items || [];
  const orderTotal =
    activeOrder?.totalAmount && activeOrder.totalAmount > 0
      ? activeOrder.totalAmount
      : orderItems.reduce((s, i) => s + (i.unitPrice || 0) * (i.count || 1), 0);

  // No active order state
  if (!activeOrder) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center py-8 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Идэвхтэй захиалга олдсонгүй</h2>
          <p className="mt-2 text-muted-foreground">Та эхлээд бараа сонгон захиалаарай</p>
          <Button onClick={() => router.push("/products")} className="mt-6">Бараа харах</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.push("/checkout")} className="hover:text-foreground">Төлбөр</button>
        <span>/</span>
        <span className="text-foreground">Баталгаажуулах</span>
      </div>

      <h1 className="text-2xl font-bold">Төлбөр баталгаажуулах</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">

        {/* Left — order details + delivery info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            {/* Order number + status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Захиалгын дугаар</p>
                <p className="text-lg font-bold">#{activeOrder.number || activeOrder._id}</p>
              </div>
              <StatusBadge status={activeOrder.status || "pending"} />
            </div>

            {/* Items list */}
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold">Барааны жагсаалт</h3>
              <div className="mt-4 space-y-4">
                {orderItems.map((item, idx) => (
                  <div key={item._id || idx} className="flex items-center gap-4 rounded-xl border bg-background p-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {item.productImgUrl ? (
                        <Image src={item.productImgUrl} alt={item.productName || ""} width={64} height={64} className="h-full w-full rounded-lg object-cover" />
                      ) : <span className="text-xl">📦</span>}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.productName || "Бараа"}</p>
                      <p className="text-sm text-muted-foreground">{item.count} x {formatPrice(item.unitPrice || 0)}</p>
                    </div>
                    <p className="font-semibold">{formatPrice((item.unitPrice || 0) * (item.count || 1))}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-6 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Барааны нийт</span><span>{formatPrice(orderTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Хүргэлт</span><span className="text-green-600">Үнэгүй</span></div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Нийт төлөх</span>
                <span className="text-primary">{formatPrice(orderTotal)}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Хүргэлтийн мэдээлэл</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Нэр</p><p className="font-medium">{deliveryInfo.firstName || "-"} {deliveryInfo.lastName || ""}</p></div>
              <div><p className="text-xs text-muted-foreground">Имэйл</p><p className="font-medium">{deliveryInfo.email || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Утас</p><p className="font-medium">{deliveryInfo.phone || "-"}</p></div>
              <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Хаяг</p><p className="font-medium">{deliveryInfo.address || "-"}</p></div>
              {deliveryInfo.description && (
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Нэмэлт тайлбар</p><p className="font-medium">{deliveryInfo.description}</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Right — payment panel */}
        <div className="space-y-6">
          <div className="sticky top-6 rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Төлбөр</h3>

            {/* Paid state */}
            {paymentStatus === "paid" && (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-center">
                <p className="font-semibold text-green-700">Төлбөр амжилттай!</p>
                <Button onClick={() => router.push("/orders")} className="mt-3 w-full" variant="outline">Захиалгууд руу</Button>
              </div>
            )}

            {/* Payment form */}
            {paymentStatus !== "paid" && (
              <>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Төлбөрийн хэрэгсэл</p>
                  <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                    <p className="font-medium">{selectedPayment?.name || "Сонгоогүй"}</p>
                    {selectedPayment?.kind && <p className="text-xs text-muted-foreground capitalize">{selectedPayment.kind}</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Төлөх дүн</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(orderTotal)}</p>
                </div>

                {/* QR code */}
                {qrData && (
                  <div className="mt-4 rounded-xl bg-white p-4 text-center">
                    <p className="mb-2 text-sm text-muted-foreground">QR кодоор төлнө үү</p>
                    <img src={qrData} alt="Payment QR" className="mx-auto rounded-lg border" style={{ maxWidth: 200 }} />
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleCreateInvoice}
                    disabled={paymentStatus === "creating" || !selectedPayment}
                    className="w-full"
                  >
                    {paymentStatus === "creating" ? "Үүсгэж байна..." : qrData ? "QR код дахин авах" : "Төлбөр төлөх"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCheckStatus}
                    disabled={checking || !createdInvoiceId}
                    className="w-full"
                  >
                    {checking ? "Шалгаж байна..." : "Төлөв шалгах"}
                  </Button>
                </div>
              </>
            )}

            {status && paymentStatus !== "paid" && (
              <div className="mt-4 rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">{status}</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
```
