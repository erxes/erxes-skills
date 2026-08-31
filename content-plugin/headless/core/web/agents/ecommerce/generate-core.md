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
import { ApolloLink } from "@apollo/client";

const httpLink = createHttpLink({
  uri:
    process.env.NEXT_PUBLIC_ERXES_ENDPOINT || "http://localhost:4000/graphql",
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

/**
 * Intercepts every operation whose name starts with "cp" and auto-injects
 * `clientPortalId` into variables so callers don't have to pass it manually.
 * Required for cpMenus, cpPages, cpPosts, cpCategories, etc.
 */
const cmsLink = new ApolloLink((operation, forward) => {
  const { operationName, variables } = operation;
  if (
    operationName.startsWith("cp") &&
    variables &&
    !variables.clientPortalId
  ) {
    operation.variables = {
      ...variables,
      clientPortalId: process.env.NEXT_PUBLIC_ERXES_CP_TOKEN || "",
    };
  }
  return forward(operation);
});

let instance: ApolloClient<unknown> | undefined;

export function getApolloClient(): ApolloClient<unknown> {
  if (!instance) {
    instance = new ApolloClient({
      link: authLink.concat(cmsLink).concat(httpLink),
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
        "client-portal-id": process.env.NEXT_PUBLIC_ERXES_CP_TOKEN || "",
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

The starter runs **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme`). Do NOT use
Tailwind v3 syntax (`@tailwind base; … ` or a bare `:root { --primary: … }` block) —
v4 only generates the semantic utility classes (`bg-primary`, `text-primary-foreground`,
`bg-card`, `border-border`, `bg-muted`, …) when their color keys live inside the
`@theme inline` block. Without that mapping the classes resolve to nothing and the
whole design collapses to the starter's default theme.

```css
@import "tailwindcss";

:root {
  /* Replace every value with the exact token read from design-tokens.json. No hardcoded values. */
  --background: <colors.semantic.background>;
  --foreground: <colors.semantic.foreground>;
  --card: <colors.semantic.card>;
  --card-foreground: <colors.semantic.cardForeground>;
  --popover: <colors.semantic.popover>;
  --popover-foreground: <colors.semantic.popoverForeground>;
  --primary: <colors.semantic.primary>;
  --primary-foreground: <colors.semantic.primaryForeground>;
  --secondary: <colors.semantic.secondary>;
  --secondary-foreground: <colors.semantic.secondaryForeground>;
  --muted: <colors.semantic.muted>;
  --muted-foreground: <colors.semantic.mutedForeground>;
  --accent: <colors.semantic.accent>;
  --accent-foreground: <colors.semantic.accentForeground>;
  --destructive: <colors.semantic.destructive>;
  --border: <colors.semantic.border>;
  --input: <colors.semantic.input>;
  --ring: <colors.semantic.ring>;
  --radius: <radius>;
}

/* Tailwind v4: expose every CSS variable as a theme key. A semantic utility class
   (bg-primary, text-primary-foreground, bg-card, border-border, bg-muted, ...) is only
   generated if its "--color-*" key is declared here — never use a class whose key is missing. */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
```

> Replace the CSS variable values with the project's design tokens from `design-tokens.json`.
> Do NOT add `* { @apply border-border; }` or any `@apply` of a semantic class without first
> confirming the class's `--color-*` key is declared in the `@theme inline` block above — an
> `@apply` of an unknown utility is a hard build error in Tailwind v4.
>
> **Checklist before writing any component:**
> - [ ] `app/globals.css` starts with `@import "tailwindcss";`
> - [ ] every semantic `--color-*` key used by components (`bg-primary`, `text-primary-foreground`,
>       `bg-card`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-secondary`, `bg-accent`,
>       `text-destructive`, …) is declared inside `@theme inline`
> - [ ] no semantic class is used in a component unless its key exists in the `@theme inline` block
> - [ ] no `@apply border-border` / v3 directive (`@tailwind base;`) remains in the file

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

// ЧУХАЛ: Next.js 15-д params нь Promise болсон — await хийж destructure хийнэ.
// Static export хийхэд заавал байх: `output: "export"` дээр [locale] сегмент
// generateStaticParams-гүй бол хуудас үүсэхгүй (build алдагдана).
export function generateStaticParams() {
  return [{ locale: "mn" }, { locale: "en" }];
}

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
