# Ecommerce Coding Conventions — Mobile (Expo)

> **SOURCE OF TRUTH for ecommerce builds.** Read this file BEFORE
> `agents/conventions.md` (which holds only project-wide/global rules).
> Where the two files overlap on an ecommerce build, THIS file wins —
> do not "reconcile" a conflict by re-introducing generic-web patterns.

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
      "x-app-token": process.env.EXPO_PUBLIC_CLIENT_PORTAL_TOKEN ?? "",
      "erxes-pos-token": process.env.EXPO_PUBLIC_POS_TOKEN ?? "",
    },
  };
});
```

**ЧУХАЛ:** Login дараа `triggerRefetchUser(true)` дуудахын өмнө
`await SecureStore.setItemAsync("token", token)` хийсэн байх ёстой.

> `setContext` нь `async` callback дэмждэг тул `await` ашиглаж болно.

**Canonical Apollo client file:** `lib/apollo/client.ts` — энэ нь тус тус төсөлд зөвшөөрөгдсөн ЦОР ГАНЦ Apollo client файл. `lib/apollo-client.ts` эсвэл `graphql/client.ts` үүсгэж болохгүй (хуучин docs-ийн нэрс — бүү ашигла). Экспорт нь зөвхөн `getApolloClient()`.

**`clientPortalId` — хэзээ ч variables-д илгээхгүй** (`cpContentCreateCMS`-ээс бусад тохиолдолд): gateway нь portal-ыг `x-app-token` header-оос өөрөө тодорхойлно. Web pipeline-ийн `cmsLink` auto-injectionтай зөрчилддөггүй — web нь operation document-д `$clientPortalId` declare хийлгүй зөвхөн variables object-ээр нэмдэг тул gateway түүнийг ignore хийдэг; mobile doc-ууд харин operation дотор ч variable-аар ч бүү declare хий.

---

## 3. Token Types

| Token      | Env Var                              | Header              | Source                       |
| ---------- | ------------------------------------ | ------------------- | ---------------------------- |
| CP Token   | `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`    | `x-app-token`       | Client Portal JWT            |
| Auth Token | —                                    | `client-auth-token` | SecureStore (login response) |
| POS Token  | `EXPO_PUBLIC_POS_TOKEN`              | `erxes-pos-token`   | POS settings                 |

> `NEXT_PUBLIC_*` биш `EXPO_PUBLIC_*` ашиглана.
> **Хуучин нэр хэрэглэхгүй:** `EXPO_PUBLIC_ERXES_CP_TOKEN` гэсэн нэр
> docs-ийн эртний хувилбарт байсан боловч код `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`
> уншидаг тул хоосон auth header үүсгэнэ — хэзээ ч бүү ашигла.

---

## 4. Apollo Data-Fetching Rules (erxes)

- All data fetching happens client-side with Apollo `useQuery` / `useMutation`.
- **Apollo Client v4 imports (mandatory):**

```typescript
// ЗӨВ — v4: hooks/provider live in the react entrypoint
import { useQuery, useMutation, ApolloProvider } from "@apollo/client/react";
import { gql } from "@apollo/client"; // gql stays on the root entrypoint
import { setContext } from "@apollo/client/link/context";

// БУРУУ — v3 pattern, crashes in v4 ("useQuery is not a function" / provider undefined)
import { useQuery, useMutation } from "@apollo/client";
```

- **`ApolloClient` нь v4-өөс generic биш** — `ApolloClient<unknown>` биш
  шууд `ApolloClient` гэж type-лана:

```typescript
let instance: ApolloClient | undefined;

export function getApolloClient(): ApolloClient {
  if (!instance) {
    instance = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  }
  return instance;
}
```

- Always use `_id` (not `id`) in GraphQL selections — erxes returns MongoDB ObjectIds.
- **Never send `clientPortalId` in query/mutation variables** — the gateway
  resolves it from the `x-app-token` header. Passing it as a variable either
  errors or silently scopes wrong.
- Prefer `fetchPolicy: "cache-and-network"` on queries backing pull-to-refresh
  screens; use `"network-only"` for `CURRENT_USER` so login state never serves stale.

---

## 5. Project Structure (flat starter layout)

**Шинээр app үүсгэхдээ shipped starter-ийн FLAT бүтцийг ашиглана — `src/features/` байхгүй.** (`frontend.md` PHASE 2.1-ийн feature-folder зохион байгуулалт нь зөвхөн маш том app-уудад OPTIONAL; ecommerce docs-ийг бүгд доорх flat бүтцэд зориулж бичсэн.)

Each domain owns its files under top-level folders:

```
graphql/auth/          # FORGOT_PASSWORD, RESET_PASSWORD, …
graphql/cms/           # CP_PAGES, CP_POSTS, CP_CATEGORIES, …
graphql/ecommerce/     # POSC_PRODUCTS, CP_CREATE_TICKET, …
hooks/                 # auth.ts, order.ts, payment.ts, review.ts
store/                 # auth.store.ts, cart.store.ts, order.store.ts, …
types/                 # auth.types.ts, cms.types.ts, order.types.ts, payment.types.ts
lib/                   # apollo/client.ts, i18n/, constants.ts, utils.ts
components/            # ui/, layout/, payment/, products/
```

**Зөвхөн `src/messenger/` л `src/` дор орно** (Messenger холбогдсон үед л — `connect-messenger.md`). Үүнээс бусад `src/` контент бол бүтцийн зөрчил.

```typescript
// ЗӨВ — feature-owned imports go through the feature folder
import { GET_PRODUCTS } from "graphql/ecommerce/queries/product";
import { cartItemsAtom } from "store/cart.store";

// БУРУУ — flat legacy paths
import { GET_PRODUCTS } from "@/graphql/ecommerce/queries/product";
import { cartItemsAtom } from "@/store/cart.store";
```

---

## 6. Jotai Store Rules

**Circular dependency байхгүй байх — web-тэй ижил дүрэм.**

```typescript
// ЗӨВ: order.store → cart.store (order.store нь cart.store-аас import хийхгүй)
// store/cart.store.ts
import { itemsAtom, cartTotalAtom } from "store/order.store";

// БУРУУ: order.store.ts дотор `import { something } from "./cart.store"` байж болохгүй
```

---

## 7. Navigation

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

> **Exception:** in-app routes үргэлж `expo-router`-оор. Гэтэл payment
> `redirectUrl` гэх мэт **гадаад deep link**-ийг `expo-linking`-ийн
> `Linking.openURL(url)`-ээр нээнэ — үүнийг router-оор солих боломжгүй
> (дэлгэрэнгүй §10 Payment Flow).

---

## 8. Client vs Screen Components

Expo-д Server Component байхгүй — бүгд client-side.

| Component          | Data fetching              | Why             |
| ------------------ | -------------------------- | --------------- |
| TabBar / Header    | `useQuery`                 | Navigation menu |
| ProductCard        | `useQuery` + press handler | Add to cart     |
| CartDrawer / Sheet | Jotai state                | No fetch needed |
| CheckoutScreen     | `useMutation` + form state | Payment         |
| ProfileScreen      | `useQuery` + `RequireAuth` | Protected       |

---

## 9. Image Handling

**`expo-image` ашиглана — `next/image` эсвэл `<img>` биш.**

> Note: доорх жишээнд image хэмжээг `style={{ width, height }}`-ээр өгсөн —
> `expo-image`-д uri + contentFit-тэй хамт ашиглахад зүш зүйлс байхгүй;
> layout бус styling-ийг className token-оор, зурагний хэмжээг style/className
> аль альгаар өгч болно.

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

## 10. Payment Flow

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

## 11. i18n Rules

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

## 12. Build Checklist

- [ ] `expo-secure-store` installed — `SecureStore.setItemAsync/getItemAsync/deleteItemAsync`
- [ ] Apollo `authLink` uses `async setContext` with `await SecureStore.getItemAsync("token")`
- [ ] `EXPO_PUBLIC_*` env vars — `NEXT_PUBLIC_*` биш
- [ ] `app/_layout.tsx` — `GestureHandlerRootView` хамгийн гадна, `SafeAreaProvider` дотор
- [ ] `react-native-gesture-handler` import `app/_layout.tsx`-ийн хамгийн эхний мөрт байна
- [ ] `store/order.store.ts` нь `cart.store`-аас import хийхгүй
- [ ] Бүтцэд `src/` дор зөвхөн `src/messenger/` байна (`conventions.md` §5 — flat starter layout)
- [ ] `useRouter`, `Link` нь `expo-router`-аас байна (`next/link`, `@/i18n/routing` биш)
- [ ] `useCurrentUser` — `fetchPolicy: "network-only"`, `triggerRefetchUser: () => refetch()`
- [ ] Login: mutation нэр `clientPortalUserLoginWithCredentials`, variables: `{ email, password }`
- [ ] Login response: `raw?.token` + `raw?.refreshToken` — хоёуланг `SecureStore`-д хадгална
- [ ] Token хадгалсны ДАРАА `triggerRefetchUser()` дуудна
- [ ] Register: mutation нэр `clientPortalUserRegister`, flat variables, token биш user object буцаана
- [ ] Logout: `SecureStore.deleteItemAsync("token")` + `deleteItemAsync("refreshToken")`, `setCurrentUser(null)`, `router.replace("/")`
- [ ] Apollo `authLink`: `x-app-token` = `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`, `erxes-pos-token` = `EXPO_PUBLIC_POS_TOKEN`
- [ ] Apollo v4 imports: `useQuery`/`useMutation`/`ApolloProvider` from `@apollo/client/react`; `ApolloClient` non-generic
- [ ] No `clientPortalId` passed in any query/mutation variables
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
