# Ecommerce Coding Conventions — Mobile (Expo)

Follow these rules in every file.

---

## 1. Auth Token Storage

**`sessionStorage` / `localStorage` байхгүй — `expo-secure-store` ашиглана.**

```typescript
import * as SecureStore from "expo-secure-store";

await SecureStore.setItemAsync("token", token);
const token = await SecureStore.getItemAsync("token");
await SecureStore.deleteItemAsync("token");
```

- `expo-secure-store` — iOS Keychain / Android Keystore ашиглан аюулгүй хадгална
- App хаагдсан ч token хадгалагдана (session биш, persistent)
- Logout хийхэд `deleteItemAsync` дуудна

```bash
npx expo install expo-secure-store
```

---

## 2. Apollo Auth Link

**`client-auth-token` header-г request бүрт `expo-secure-store`-аас уншина.**

```typescript
import * as SecureStore from "expo-secure-store";
import { setContext } from "@apollo/client/link/context";

const authLink = setContext(async (_, { headers }) => {
  const token = (await SecureStore.getItemAsync("token")) ?? "";
  return {
    headers: {
      ...headers,
      "client-auth-token": token,
      "x-app-token": process.env.EXPO_PUBLIC_ERXES_CP_TOKEN ?? "",
      "erxes-pos-token": process.env.EXPO_PUBLIC_POS_TOKEN ?? "",
    },
  };
});
```

**ЧУХАЛ:** Login дараа `triggerRefetchUser(true)` дуудахын өмнө
`await SecureStore.setItemAsync("token", token)` хийсэн байх ёстой.

> `setContext` нь `async` callback дэмждэг тул `await` ашиглаж болно.

---

## 3. Token Types

| Token      | Env Var                      | Header              | Source                       |
| ---------- | ---------------------------- | ------------------- | ---------------------------- |
| CP Token   | `EXPO_PUBLIC_ERXES_CP_TOKEN` | `x-app-token`       | Client Portal ID             |
| Auth Token | —                            | `client-auth-token` | SecureStore (login response) |
| POS Token  | `EXPO_PUBLIC_POS_TOKEN`      | `erxes-pos-token`   | POS settings                 |

> `NEXT_PUBLIC_*` биш `EXPO_PUBLIC_*` ашиглана.

---

## 4. GraphQL File Organization

**`src/graphql/` биш `graphql/` ашиглана (Expo-д `src/` байхгүй).**

```typescript
// ЗӨВ
import { GET_PRODUCTS } from "@/graphql/products";
```

---

## 5. Jotai Store Rules

**Circular dependency байхгүй байх — web-тэй ижил дүрэм.**

```typescript
// ЗӨВ: order.store → cart.store (order.store нь cart.store-аас import хийхгүй)
// cart.store.ts
import { itemsAtom, cartTotalAtom } from "@/store/order.store";

// БУРУУ: order.store.ts дотор `import { something } from "./cart.store"` байж болохгүй
```

---

## 6. Navigation

**`next/link` болон `@/i18n/routing` байхгүй — `expo-router` ашиглана.**

```typescript
// ЗӨВ
import { Link, useRouter } from "expo-router";
const router = useRouter();
router.push("/(tabs)/products");
router.replace("/(auth)/login");

// БУРУУ
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
```

---

## 7. Client vs Screen Components

Expo-д Server Component байхгүй — бүгд client-side.

| Component          | Data fetching              | Why             |
| ------------------ | -------------------------- | --------------- |
| TabBar / Header    | `useQuery`                 | Navigation menu |
| ProductCard        | `useQuery` + press handler | Add to cart     |
| CartDrawer / Sheet | Jotai state                | No fetch needed |
| CheckoutScreen     | `useMutation` + form state | Payment         |
| ProfileScreen      | `useQuery` + `RequireAuth` | Protected       |

---

## 8. Image Handling

**`expo-image` ашиглана — `next/image` эсвэл `<img>` биш.**

```typescript
import { Image } from "expo-image";

export function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try { new URL(url); return true; }
  catch { return false; }
}

// Usage
{isValidUrl(product.attachment?.url) ? (
  <Image
    source={{ uri: product.attachment.url }}
    style={{ width: 200, height: 200 }}
    contentFit="cover"
    placeholder={blurhash}
  />
) : (
  <View className="bg-gray-200 w-[200px] h-[200px]" />
)}
```

---

## 9. Payment Flow

1. `app/checkout.tsx` — delivery info бөглөж (`firstName`, `lastName`, `email`, `phone`, `address`, `description`), payment method сонгож, `cpOrdersAdd` дуудна → `activeOrderAtom`-д хадгална
2. `app/verify.tsx` — `useCallback + setInterval(5000)` auto-polling — invoice үүссэний дараа 5 секунд тутамд `invoicesCheck` дуудна
3. "Төлбөр төлөх" товч — `invoiceCreate` → `paymentTransactionsAdd` хоёуланг нэг handler дотор дуудна → QR авна
4. QR харуулна (`txResult.transaction.response.qrData` эсвэл `details.qrData`)
5. `redirectUrl` байвал **`Linking.openURL(redirectUrl)`** ашиглана — `window.location.href` биш
6. "Төлөв шалгах" товч — `invoicesCheck` дуудна (auto-polling-тай зэрэгцэнэ)
7. `paymentStatus === "paid"` болмогц polling зогсоно, амжилтын UI харуулна

```typescript
import * as Linking from "expo-linking";

// redirectUrl байвал:
await Linking.openURL(redirectUrl);
// window.location.href биш
```

**`cpOrderChangeSaleStatus` дуудахгүй — энгийн flow.**
**Route: `/verify` (ID байхгүй) — `activeOrderAtom`-аас order уншина.**
**`currentUser` байвал `customerId: currentUser._id, customerType: "customer"` — үгүй бол `"empty"` / `"visitor"`.**

---

## 10. i18n Rules

**Every user-facing string MUST use `i18n.t("key")`. Zero exceptions.**

```typescript
import { i18n } from "@/lib/i18n";

// ЗӨВ — any component
<Text>{i18n.t("wishlist.title")}</Text>
<Text>{i18n.t("product.addToCart")}</Text>

// БУРУУ — hardcoded text
<Text>Хадгалсан бараа</Text>
<Text>Add to Cart</Text>
```

Key naming convention: `section.key` — e.g. `product.addToCart`, `cart.empty`, `order.submitOrder`

> `getTranslations()` / `useTranslations()` (next-intl) биш — `i18n.t()` (i18n-js) ашиглана.

---

## 11. Build Checklist

- [ ] `expo-secure-store` installed — `SecureStore.setItemAsync/getItemAsync/deleteItemAsync`
- [ ] Apollo `authLink` uses `async setContext` with `await SecureStore.getItemAsync("token")`
- [ ] `EXPO_PUBLIC_*` env vars — `NEXT_PUBLIC_*` биш
- [ ] `app/_layout.tsx` — `GestureHandlerRootView` хамгийн гадна, `SafeAreaProvider` дотор
- [ ] `react-native-gesture-handler` import `app/_layout.tsx`-ийн хамгийн эхний мөрт байна
- [ ] `store/order.store.ts` нь `cart.store`-аас import хийхгүй
- [ ] `useRouter`, `Link` нь `expo-router`-аас байна (`next/link`, `@/i18n/routing` биш)
- [ ] `useCurrentUser` — `fetchPolicy: "network-only"`, `triggerRefetchUser: () => refetch()`
- [ ] Login: mutation нэр `clientPortalUserLoginWithCredentials`, variables: `{ email, password }`
- [ ] Login response: `raw?.token` + `raw?.refreshToken` — хоёуланг `SecureStore`-д хадгална
- [ ] Token хадгалсны ДАРАА `triggerRefetchUser()` дуудна
- [ ] Register: mutation нэр `clientPortalUserRegister`, flat variables, token биш user object буцаана
- [ ] Logout: `SecureStore.deleteItemAsync("token")` + `deleteItemAsync("refreshToken")`, `setCurrentUser(null)`, `router.replace("/")`
- [ ] Apollo `authLink`: `x-app-token` = `EXPO_PUBLIC_ERXES_CP_TOKEN`, `erxes-pos-token` = `EXPO_PUBLIC_POS_TOKEN`
- [ ] `/verify` auto-polling: `useCallback` + `useEffect` + `setInterval(5000)` — `paymentStatus === "paid"` болмогц `clearInterval`
- [ ] `useCreateInvoice` — destructured params (`paymentIds`, `amount`, `description`, `contentType`, `contentTypeId`, `customerId`, `customerType`)
- [ ] `/verify` — `invoiceCreate` + `paymentTransactionsAdd` хоёуланг нэг handler дотор
- [ ] QR: `txResult.transaction?.response?.qrData` → `details?.qrData` → invoice transactions fallback
- [ ] `redirectUrl` байвал `Linking.openURL(redirectUrl)` ашигла (`window.location.href` биш)
- [ ] Checkout `router.push("/verify")` — ID байхгүй flat route
- [ ] `useOrderCUD` — `activeOrderAtom`-д `{ ...order, totalAmount: calculatedTotal }` хадгална
- [ ] `orderTotalAtom` — `activeOrder.totalAmount || 0` derived atom
- [ ] CartDrawer checks `currentUser` — redirects to `/(auth)/login` with `redirectAfterLogin` if guest
- [ ] `useLogin` checks `SecureStore.getItemAsync("redirectAfterLogin")` after successful login
- [ ] CMS screens — зөвхөн `cms_sections`-д байгаа screen-ийг үүсгэсэн
- [ ] HTML elements (`div`, `p`, `img`, `button`, `a`) ашиглаагүй
- [ ] Бүх touch targets `minHeight: 44`
- [ ] CMS HTML → `react-native-render-html` (not `dangerouslySetInnerHTML`)
- [ ] `npx expo export` 0 алдаатай
- [ ] `npx expo-doctor` бүх check давсан
