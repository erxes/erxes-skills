# Ecommerce Core: Apollo Client, Jotai Stores, Layouts (Mobile)

## 4. Apollo Client

### `lib/apollo/client.ts`

`sessionStorage` → `SecureStore` (async), `NEXT_PUBLIC_*` → `EXPO_PUBLIC_*`.
`setContext` callback нь **`async` байх ёстой** — `SecureStore.getItemAsync` нь Promise буцаана. Заавал доорх бүрэн, ажиллах хувилбарыг **verbatim** ашигла — уг syntax алдаатай хувилбарыг дахин үүсгэж болохгүй.

```typescript
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";

const httpLink = createHttpLink({
  uri: process.env.EXPO_PUBLIC_ERXES_API_URL || "https://localhost:4000",
});

// MUST be async — SecureStore.getItemAsync returns a Promise, and the
// session token must be read fresh on every request (not captured once
// at module load), otherwise login/logout will not update the header.
const authLink = setContext(async (_, { headers }) => {
  const sessionToken = await SecureStore.getItemAsync("token");

  return {
    headers: {
      ...headers,
      // Static client-portal token — identifies the app/portal, not the user.
      // This is the header confirmed working against the live gateway:
      // curl -H "x-app-token: <token>" https://.../gateway/graphql
      "x-app-token": process.env.EXPO_PUBLIC_CLIENT_PORTAL_TOKEN || "",
      // Per-user session token, set after login (has_auth = true). Empty
      // string for guest/unauthenticated requests — never send `undefined`.
      "client-auth-token": sessionToken || "",
      // POS integration token, collected as `pos_token` during setup.
      "erxes-pos-token": process.env.EXPO_PUBLIC_POS_TOKEN || "",
    },
  };
});

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

> **Apollo Client v4:** `ApolloClient` is **NOT generic** — write
> `ApolloClient`, never `ApolloClient<unknown>` or `ApolloClient<any>`.
> The v3 generic parameter was removed in v4 and will fail typecheck.

> **Do NOT** also export a top-level `client` constant alongside
> `getApolloClient()` — that creates a second, separate `ApolloClient`
> instance with its own cache, which silently diverges from the one the
> provider actually uses. `getApolloClient()` is the only client the app
> should ever import.

> **`lib/apollo/server-client.ts` үүсгэхгүй** — Expo-д Server Components байхгүй.

### `lib/apollo/provider.tsx`

```typescript
// Apollo Client v4: ApolloProvider (and useQuery/useMutation in screens)
// MUST come from "@apollo/client/react" — the root entrypoint no longer
// exports them, and importing from "@apollo/client" crashes at runtime.
import { ApolloProvider } from "@apollo/client/react";
import { getApolloClient } from "./client";

export default function ApolloClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>;
}
```

---

## 5. Jotai Stores

Jotai stores — web-тэй **бүрэн ижил**. Өөрчлөлт байхгүй.

### `store/auth.store.ts`

```typescript
import { atom } from "jotai";
import { IUser } from "types/auth.types";

export const currentUserAtom = atom<IUser | null>(null);
export const isAuthenticatedAtom = atom((get) => !!get(currentUserAtom));
export const triggerRefetchUserAtom = atom(false);
```

### `store/order.store.ts`

```typescript
import { atom } from "jotai";
import { IOrder, IDeliveryInfo } from "types/orders.types";

export const activeOrderAtom = atom<IOrder | null>(null);
export const orderLoadingAtom = atom(false);
export const deliveryInfoAtom = atom<IDeliveryInfo>({
  address: "",
  phone: "",
  description: "",
});
export const orderTotalAtom = atom(
  (get) => get(activeOrderAtom)?.totalAmount || 0,
);

// IMPORTANT: Does NOT import from cart.store.ts — circular dependency байхгүй байх
```

### `store/cart.store.ts`

```typescript
import { atom } from "jotai";
import { ICartItem } from "types/orders.types";

export const cartItemsAtom = atom<ICartItem[]>([]);
export const cartTotalAtom = atom((get) =>
  get(cartItemsAtom).reduce(
    (sum, item) => sum + item.unitPrice * item.count,
    0,
  ),
);
export const cartCountAtom = atom((get) =>
  get(cartItemsAtom).reduce((sum, item) => sum + item.count, 0),
);
```

### `store/payment.store.ts`

```typescript
import { atom } from "jotai";
import { IPayment, IInvoice } from "types/payment.types";

export const selectedPaymentAtom = atom<IPayment | null>(null);
export const paymentsAtom = atom<IPayment[]>([]);
export const invoiceAtom = atom<IInvoice | null>(null);
export const paymentLoadingAtom = atom(false);
```

### `store/wishlist.store.ts`

```typescript
import { atom } from "jotai";

export interface IWishlistItem {
  productId: string;
  productName?: string;
  unitPrice?: number;
  productImgUrl?: string;
}

export const wishlistItemsAtom = atom<IWishlistItem[]>([]);
export const wishlistCountAtom = atom((get) => get(wishlistItemsAtom).length);
```

---

## 6. Theme + Root Layout

### `tailwind.config.js` (globals.css-ийн орлуулга)

Expo-д `globals.css` байхгүй — NativeWind `tailwind.config.js`-д token утгуудыг
шууд бичнэ. **Утгуудыг гараар бичихгүй — `design-tokens.json`-ийг шууд require хий**
(`lib/tokens.ts`-тэй адил нэг эх сурвалж; web-ийн CSS-variable pattern-ий RN
 equivalents — semantic class нь цорын ганц тохиромжтой зам болно).

```js
// tailwind.config.js — values come from design-tokens.json via require,
// never hand-copied. Same source lib/tokens.ts is generated from.
const designTokens = require("./design-tokens.json");
const t = designTokens.colors.semantic;

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: t.background,
        foreground: t.foreground,
        card: { DEFAULT: t.card, foreground: t.cardForeground },
        primary: { DEFAULT: t.primary, foreground: t.primaryForeground },
        secondary: {
          DEFAULT: t.secondary,
          foreground: t.secondaryForeground,
        },
        muted: { DEFAULT: t.muted, foreground: t.mutedForeground },
        accent: { DEFAULT: t.accent, foreground: t.accentForeground },
        destructive: t.destructive,
        border: t.border,
      },
      borderRadius: {
        sm: `${designTokens.radius.sm}px`,
        md: `${designTokens.radius.md}px`,
        lg: `${designTokens.radius.lg}px`,
        xl: `${designTokens.radius.xl}px`,
        "2xl": `${designTokens.radius["2xl"]}px`,
      },
      fontFamily: {
        display: [designTokens.typography.families.display],
        body: [designTokens.typography.families.body],
      },
    },
  },
  plugins: [],
};
```

**className-д хүрэхгүй гадаргуу** (navigator theme options, `placeholderTextColor`,
`tintColor`, Reanimated styles): `import { tokens } from "@/lib/tokens"` ашигла —
hex literal хаана ч бичихгүй (`generate-setup.md` → `lib/tokens.ts`).

**Generation-ий дараа заавал хийх шалгалт (post-generation gate):**

Файл бичиж дуусаад, `output/<slug>/tailwind.config.js` дээр дараах шалгалтыг ажиллуул:

​`bash
grep -E "222\.2, 84%|222\.2, 47\.4%|hsl\(0, 0%, 100%\)|<from " output/<slug>/tailwind.config.js
​`

- Match олдвол → placeholder эсвэл `<from ...>` тэмдэглэгээ хэвээр үлдсэн гэсэн үг. Файл **дутуу бичигдсэн, INVALID**. `output/<slug>/design-tokens.json`-г дахин уншиж, `const designTokens = require("./design-tokens.json")` мөр байхгүй бол INVALID — утгуудыг гараар бичсэн, drift хийнэ.
- Мөн `colors.*`, `borderRadius.*`, `fontFamily.*`-ийн утга бүрийг `design-tokens.json`-ийн харгалзах key-тэй нэг бүрчлэн шалгаж — `t.<key>` reference-ээр ирж байгаа эсэхийг баталгаажуул (гар hex = drift).

### `app/_layout.tsx` (Root layout)

`app/layout.tsx` + `app/[locale]/layout.tsx` хоёр файлын орлуулга — Expo-д нэг `_layout.tsx`.

```typescript
import "react-native-gesture-handler"; // MUST be first import
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import ApolloClientProvider from "@/lib/apollo/provider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // fonts from design-tokens.json typography.families
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApolloClientProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ApolloClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

> `has_auth = true` бол `AuthProvider`-г `ApolloClientProvider` дотор нэмнэ:
>
> ```tsx
> <ApolloClientProvider>
>   <AuthProvider>
>     <Stack screenOptions={{ headerShown: false }} />
>   </AuthProvider>
> </ApolloClientProvider>
> ```

> `NextIntlClientProvider`, `getMessages()`, `html`/`body` tag — **байхгүй**.

---

## Agent Rules — Apollo Client

1. **Apollo Client v4 import map (mandatory everywhere):**

   ```typescript
   // ЗӨВ (v4)
   import { useQuery, useMutation, ApolloProvider } from "@apollo/client/react";
   import { ApolloClient, InMemoryCache } from "@apollo/client";
   import { createHttpLink } from "@apollo/client";
   import { setContext } from "@apollo/client/link/context";
   import { gql } from "@apollo/client";

   // БУРУУ (v3 pattern — breaks in v4)
   import { useQuery, useMutation, ApolloProvider } from "@apollo/client";
   ```

2. Copy the `lib/apollo/client.ts` block above **verbatim** — do not re-derive the
   `createHttpLink` call or the header object from memory; a missing comma or
   closing brace here breaks bundling with obscure Metro errors, not a clear
   syntax error message.
3. `setContext` **must** be declared `async` — a non-async callback will not
   correctly await `SecureStore.getItemAsync`, silently sending a stale or
   empty session token.
4. Export **only** `getApolloClient()` from `lib/apollo/client.ts`. Never add a
   second top-level `ApolloClient` instance in the same file. `ApolloClient`
   itself is non-generic in v4 — never write `ApolloClient<unknown>`.
5. All three headers are required and each serves a different purpose — do not
   drop any of them and do not conflate them:
   - `x-app-token` — static client-portal token, identifies the app/portal
   - `client-auth-token` — per-user session token from `SecureStore`, present only after login
   - `erxes-pos-token` — POS integration token from `pos_token` (Step 0 setup)
6. `EXPO_PUBLIC_ERXES_API_URL`, `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`, and
   `EXPO_PUBLIC_POS_TOKEN` must all be present in `.env.local` before this file
   is generated — verify against `store.config.json` / `reference.md` env var
   list rather than leaving any of them to silently resolve to `""`.
