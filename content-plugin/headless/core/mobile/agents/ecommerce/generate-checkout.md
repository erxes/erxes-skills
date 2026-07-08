# Ecommerce Checkout + Verify Screens (Mobile)

> **Design rule:** Logic below is authoritative. All `className` values are reference only — apply your design tokens.

---

## Checkout (`app/checkout.tsx`)

Flow: fill delivery info → select payment method → submit → `createOrder` → navigate to `/verify`.

Key invariants identical to web:

- `deliveryInfo` must include all 6 fields: `firstName`, `lastName`, `email`, `phone`, `address`, `description`
- Pre-populate from `currentUser` on mount
- `type: "delivery"` always passed to `createOrder`
- On success → `router.push("/verify")`

```typescript
import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useAtom } from "jotai";
import { useRouter } from "expo-router";
import { cartItemsAtom, cartTotalAtom } from "@/store/cart.store";
import { currentUserAtom } from "@/store/auth.store";
import { useOrderCUD } from "@/hooks/order";
import { usePayments } from "@/hooks/payment";
import { PaymentType } from "@/components/payment/PaymentType";
import { formatPrice } from "@/lib/utils";

export default function CheckoutScreen() {
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

    const calculatedTotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.count, 0
    );

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
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-muted-foreground">Сагс хоосон байна</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold">Төлбөр төлөх</Text>

        {/* Delivery info */}
        <View className="mt-6 rounded-xl border bg-card p-4">
          <Text className="font-semibold">Хүргэлтийн мэдээлэл</Text>
          <View className="mt-4 gap-3">
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Нэр"
              className="rounded-lg border border-border bg-background px-3 py-2 min-h-[44px]"
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Овог"
              className="rounded-lg border border-border bg-background px-3 py-2 min-h-[44px]"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Имэйл хаяг"
              keyboardType="email-address"
              autoCapitalize="none"
              className="rounded-lg border border-border bg-background px-3 py-2 min-h-[44px]"
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Утасны дугаар"
              keyboardType="phone-pad"
              className="rounded-lg border border-border bg-background px-3 py-2 min-h-[44px]"
            />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Хаягаа оруулна уу"
              className="rounded-lg border border-border bg-background px-3 py-2 min-h-[44px]"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Нэмэлт мэдээлэл"
              multiline
              numberOfLines={3}
              className="rounded-lg border border-border bg-background px-3 py-2 min-h-[80px]"
            />
          </View>
        </View>

        {/* Payment method */}
        <View className="mt-4 rounded-xl border bg-card p-4">
          <PaymentType payments={payments} />
        </View>

        {/* Order summary */}
        <View className="mt-4 rounded-xl border bg-card p-4">
          <Text className="font-semibold">Захиалгын хураангуй</Text>
          <View className="mt-4 gap-2">
            {items.map((item) => (
              <View key={item.productId} className="flex-row justify-between">
                <Text className="text-sm">{item.productName} x {item.count}</Text>
                <Text className="text-sm">{formatPrice(item.unitPrice * item.count)}</Text>
              </View>
            ))}
            <View className="mt-2 border-t border-border pt-2 flex-row justify-between">
              <Text className="font-semibold">Нийт</Text>
              <Text className="font-semibold">{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || !firstName || !phone || !address}
          className="mt-6 mb-8 rounded-xl bg-primary p-4 items-center min-h-[44px]"
        >
          {isSubmitting
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-semibold">Захиалга илгээх</Text>
          }
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

---

## Verify (`app/verify.tsx`)

Key invariants identical to web except:

- `window.location.href` → `Linking.openURL(redirectUrl)`
- `<img src={qrData}>` → `<Image source={{ uri: qrData }}>`
- `next/image` → `expo-image`

```typescript
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useAtom } from "jotai";
import { useRouter } from "expo-router";
import { activeOrderAtom } from "@/store/order.store";
import { selectedPaymentAtom, invoiceAtom } from "@/store/payment.store";
import { currentUserAtom } from "@/store/auth.store";
import {
  useCreateInvoice,
  useCheckInvoice,
  useAddPaymentTransaction,
} from "@/hooks/payment";
import { formatPrice } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
    confirmed: "bg-blue-100 text-blue-700",
    preparing: "bg-purple-100 text-purple-700",
    delivering: "bg-indigo-100 text-indigo-700",
    done: "bg-emerald-100 text-emerald-700",
  };
  const labels: Record<string, string> = {
    paid: "Төлбөр төлөгдсөн", pending: "Хүлээгдэж байна",
    cancelled: "Цуцлагдсан", confirmed: "Баталгаажсан",
    preparing: "Бэлтгэж байна", delivering: "Хүргэлтэнд гарсан", done: "Дууссан",
  };
  return (
    <View className={`rounded-full px-3 py-1 ${styles[status] ?? "bg-gray-100"}`}>
      <Text className="text-xs font-medium">{labels[status] ?? status}</Text>
    </View>
  );
}

export default function VerifyScreen() {
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
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "creating" | "created" | "paid" | "error"
  >("idle");

  // Auto-polling — identical logic to web
  const pollPayment = useCallback(async (invoiceId: string) => {
    if (!invoiceId || paymentStatus === "paid") return;
    const result = await checkInvoice(invoiceId);
    if (result === "paid") {
      setPaymentStatus("paid");
      setStatus("Төлбөр амжилттай хийгдлээ! 🎉");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = createdInvoiceId || invoice?._id;
    if (!id || paymentStatus === "paid") return;
    const interval = setInterval(() => pollPayment(id), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdInvoiceId, invoice?._id]);

  // One handler: invoiceCreate + paymentTransactionsAdd — identical logic to web
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

      const qr =
        (txResult.transaction?.response as Record<string, unknown>)?.qrData ||
        (txResult.transaction?.details as Record<string, unknown>)?.qrData ||
        "";
      if (qr) setQrData(qr as string);
    } else {
      setPaymentStatus("error");
      setStatus("Төлбөр үүсгэхэд алдаа гарлаа");
    }

    // redirectUrl: Linking.openURL instead of window.location.href
    if (result.invoice?.redirectUrl) {
      await Linking.openURL(result.invoice.redirectUrl);
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

  if (!activeOrder) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-xl font-semibold">Идэвхтэй захиалга олдсонгүй</Text>
        <Text className="mt-2 text-muted-foreground">Та эхлээд бараа сонгон захиалаарай</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/products")}
          className="mt-6 rounded-xl bg-primary px-6 py-3 min-h-[44px] items-center"
        >
          <Text className="text-white font-semibold">Бараа харах</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold">Төлбөр баталгаажуулах</Text>

      {/* Order summary */}
      <View className="mt-6 rounded-xl border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-muted-foreground">Захиалгын дугаар</Text>
            <Text className="text-lg font-bold">#{activeOrder.number || activeOrder._id}</Text>
          </View>
          <StatusBadge status={activeOrder.status || "pending"} />
        </View>

        <View className="mt-4 border-t border-border pt-4 gap-3">
          {orderItems.map((item, idx) => (
            <View key={item._id || idx} className="flex-row items-center gap-3 rounded-xl border bg-background p-3">
              <View className="h-14 w-14 rounded-lg bg-muted items-center justify-center">
                {item.productImgUrl ? (
                  <Image
                    source={{ uri: item.productImgUrl }}
                    style={{ width: 56, height: 56, borderRadius: 8 }}
                    contentFit="cover"
                  />
                ) : <Text className="text-xl">📦</Text>}
              </View>
              <View className="flex-1">
                <Text className="font-medium">{item.productName || "Бараа"}</Text>
                <Text className="text-sm text-muted-foreground">
                  {item.count} x {formatPrice(item.unitPrice || 0)}
                </Text>
              </View>
              <Text className="font-semibold">
                {formatPrice((item.unitPrice || 0) * (item.count || 1))}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-4 border-t border-border pt-4 gap-1">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Барааны нийт</Text>
            <Text className="text-sm">{formatPrice(orderTotal)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Хүргэлт</Text>
            <Text className="text-sm text-green-600">Үнэгүй</Text>
          </View>
          <View className="flex-row justify-between mt-2 border-t border-border pt-2">
            <Text className="font-bold">Нийт төлөх</Text>
            <Text className="font-bold text-primary">{formatPrice(orderTotal)}</Text>
          </View>
        </View>
      </View>

      {/* Delivery info */}
      <View className="mt-4 rounded-xl border bg-card p-4">
        <Text className="font-semibold">Хүргэлтийн мэдээлэл</Text>
        <View className="mt-4 gap-3">
          <View>
            <Text className="text-xs text-muted-foreground">Нэр</Text>
            <Text className="font-medium">{deliveryInfo.firstName || "-"} {deliveryInfo.lastName || ""}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Имэйл</Text>
            <Text className="font-medium">{deliveryInfo.email || "-"}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Утас</Text>
            <Text className="font-medium">{deliveryInfo.phone || "-"}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Хаяг</Text>
            <Text className="font-medium">{deliveryInfo.address || "-"}</Text>
          </View>
          {deliveryInfo.description && (
            <View>
              <Text className="text-xs text-muted-foreground">Нэмэлт тайлбар</Text>
              <Text className="font-medium">{deliveryInfo.description}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Payment panel */}
      <View className="mt-4 rounded-xl border bg-card p-4 mb-8">
        <Text className="font-semibold">Төлбөр</Text>

        {paymentStatus === "paid" ? (
          <View className="mt-4 rounded-xl bg-green-50 p-4 items-center">
            <Text className="font-semibold text-green-700">Төлбөр амжилттай!</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/profile/orders")}
              className="mt-3 rounded-xl border border-border px-6 py-3 min-h-[44px] items-center"
            >
              <Text className="font-medium">Захиалгууд руу</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mt-4">
              <Text className="text-sm text-muted-foreground">Төлбөрийн хэрэгсэл</Text>
              <View className="mt-2 rounded-lg border bg-muted/30 p-3">
                <Text className="font-medium">{selectedPayment?.name || "Сонгоогүй"}</Text>
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-sm text-muted-foreground">Төлөх дүн</Text>
              <Text className="text-2xl font-bold text-primary">{formatPrice(orderTotal)}</Text>
            </View>

            {/* QR code — expo-image instead of <img> */}
            {qrData && (
              <View className="mt-4 rounded-xl bg-white p-4 items-center">
                <Text className="mb-2 text-sm text-muted-foreground">QR кодоор төлнө үү</Text>
                <Image
                  source={{ uri: qrData }}
                  style={{ width: 200, height: 200, borderRadius: 8 }}
                  contentFit="contain"
                />
              </View>
            )}

            <View className="mt-6 gap-3">
              <Pressable
                onPress={handleCreateInvoice}
                disabled={paymentStatus === "creating" || !selectedPayment}
                className="rounded-xl bg-primary p-4 items-center min-h-[44px]"
              >
                {paymentStatus === "creating"
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-semibold">
                      {qrData ? "QR код дахин авах" : "Төлбөр төлөх"}
                    </Text>
                }
              </Pressable>

              <Pressable
                onPress={handleCheckStatus}
                disabled={checking || !createdInvoiceId}
                className="rounded-xl border border-border p-4 items-center min-h-[44px]"
              >
                {checking
                  ? <ActivityIndicator />
                  : <Text className="font-medium">Төлөв шалгах</Text>
                }
              </Pressable>
            </View>
          </>
        )}

        {status && paymentStatus !== "paid" && (
          <View className="mt-4 rounded-lg bg-muted p-3">
            <Text className="text-sm text-muted-foreground text-center">{status}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```
