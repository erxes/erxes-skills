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

let instance: ApolloClient<unknown> | undefined;

export function getApolloClient(): ApolloClient<unknown> {
  if (!instance) {
    instance = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  }
  return instance;
}
```

> **Do NOT** also export a top-level `client` constant alongside
> `getApolloClient()` — that creates a second, separate `ApolloClient`
> instance with its own cache, which silently diverges from the one the
> provider actually uses. `getApolloClient()` is the only client the app
> should ever import.

> **`lib/apollo/server-client.ts` үүсгэхгүй** — Expo-д Server Components байхгүй.

### `lib/apollo/provider.tsx`

```typescript
import { ApolloProvider } from "@apollo/client";
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
import { IUser } from "@/types/auth.types";

export const currentUserAtom = atom<IUser | null>(null);
export const isAuthenticatedAtom = atom((get) => !!get(currentUserAtom));
export const triggerRefetchUserAtom = atom(false);
```

### `store/order.store.ts`

```typescript
import { atom } from "jotai";
import { IOrder, IDeliveryInfo } from "@/types/order.types";

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
import { ICartItem } from "@/types/order.types";

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
import { IPayment, IInvoice } from "@/types/payment.types";

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

Expo-д `globals.css` байхгүй — NativeWind `tailwind.config.js`-д CSS variables-ийн оронд token утгуудыг шууд бичнэ.

```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Replace values with project design-tokens.json
      colors: {
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(222.2, 84%, 4.9%)",
        card: "hsl(0, 0%, 100%)",
        primary: {
          DEFAULT: "hsl(222.2, 47.4%, 11.2%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        secondary: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(222.2, 47.4%, 11.2%)",
        },
        muted: {
          DEFAULT: "hsl(210, 40%, 96.1%)",
          foreground: "hsl(215.4, 16.3%, 46.9%)",
        },
        destructive: "hsl(0, 84.2%, 60.2%)",
        border: "hsl(214.3, 31.8%, 91.4%)",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
```

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

1. Copy the `lib/apollo/client.ts` block above **verbatim** — do not re-derive the
   `createHttpLink` call or the header object from memory; a missing comma or
   closing brace here breaks bundling with obscure Metro errors, not a clear
   syntax error message.
2. `setContext` **must** be declared `async` — a non-async callback will not
   correctly await `SecureStore.getItemAsync`, silently sending a stale or
   empty session token.
3. Export **only** `getApolloClient()` from `lib/apollo/client.ts`. Never add a
   second top-level `ApolloClient` instance in the same file.
4. All three headers are required and each serves a different purpose — do not
   drop any of them and do not conflate them:
   - `x-app-token` — static client-portal token, identifies the app/portal
   - `client-auth-token` — per-user session token from `SecureStore`, present only after login
   - `erxes-pos-token` — POS integration token from `pos_token` (Step 0 setup)
5. `EXPO_PUBLIC_ERXES_API_URL`, `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`, and
   `EXPO_PUBLIC_POS_TOKEN` must all be present in `.env.local` before this file
   is generated — verify against `store.config.json` / `reference.md` env var
   list rather than leaving any of them to silently resolve to `""`.
