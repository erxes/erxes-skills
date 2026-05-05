# Ecommerce Core: Apollo Client, Jotai Stores, Layouts

## 4. Apollo Client

### `lib/apollo/client.ts` (Client singleton)

```typescript
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri:
    process.env.NEXT_PUBLIC_ERXES_ENDPOINT ||
    "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  return {
    headers: {
      ...headers,
      "client-auth-token": token || "",
      "x-app-token": process.env.NEXT_PUBLIC_ERXES_CP_TOKEN || "",
      "erxes-pos-token": process.env.NEXT_PUBLIC_POS_TOKEN || "",
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

### `lib/apollo/server-client.ts` (Server components)

```typescript
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";
import { cookies } from "next/headers";

export async function getServerApolloClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return new ApolloClient({
    link: new HttpLink({
      uri:
        process.env.ERXES_ENDPOINT ||
        process.env.NEXT_PUBLIC_ERXES_ENDPOINT ||
        "http://localhost:4000/graphql",
      headers: {
        "client-auth-token": token || "",
        "x-app-token": process.env.NEXT_PUBLIC_ERXES_CP_TOKEN || "",
        "erxes-pos-token": process.env.NEXT_PUBLIC_POS_TOKEN || "",
      },
      fetchOptions: { cache: "no-store" },
    }),
    cache: new InMemoryCache(),
  });
}
```

### `lib/apollo/provider.tsx` (Client)

```typescript
"use client";

import { ApolloProvider } from "@apollo/client/react";
import { getApolloClient } from "./client";

export default function ApolloClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>
  );
}
```

---

## 5. Jotai Store

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

export const orderTotalAtom = atom((get) => {
  const order = get(activeOrderAtom);
  return order?.totalAmount || 0;
});

// IMPORTANT: This store does NOT import from cart.store.ts to avoid circular dependencies
```

### `store/cart.store.ts`

```typescript
import { atom } from "jotai";
import { ICartItem } from "@/types/order.types";

export const cartItemsAtom = atom<ICartItem[]>([]);

export const cartTotalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.unitPrice * item.count, 0);
});

export const cartCountAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.count, 0);
});
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

## 6. Globals CSS + Root Layout + Locale Layout

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

> Replace CSS variable values with the project's design tokens from `design-tokens.json`.

### `app/layout.tsx`

```typescript
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
```

### `app/[locale]/layout.tsx`

```typescript
import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import ApolloClientProvider from "@/lib/apollo/provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "../globals.css";

// ЧУХАЛ: Next.js 15-д params нь Promise болсон — await хийж destructure хийнэ
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        <ApolloClientProvider>
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </NextIntlClientProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
```
