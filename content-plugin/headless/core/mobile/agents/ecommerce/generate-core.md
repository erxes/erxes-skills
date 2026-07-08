# Ecommerce Core: Apollo Client, Jotai Stores, Layouts (Mobile)

## 4. Apollo Client

### `lib/apollo/client.ts`

`sessionStorage` → `SecureStore` (async), `NEXT_PUBLIC_*` → `EXPO_PUBLIC_*`.
`setContext` callback нь `async` байх ёстой — `SecureStore.getItemAsync` нь Promise буцаана.

```typescript
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";

const httpLink = createHttpLink({
  uri:
    process.env.EXPO_PUBLIC_ERXES_ENDPOINT || "http://localhost:4000/graphql",
});

const authLink = setContext(async (_, { headers }) => {
  const token = await SecureStore.getItemAsync("token");
  return {
    headers: {
      ...headers,
      "client-auth-token": token || "",
      "x-app-token": process.env.EXPO_PUBLIC_ERXES_CP_TOKEN || "",
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
