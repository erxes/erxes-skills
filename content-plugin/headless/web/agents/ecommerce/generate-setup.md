# Ecommerce Setup: Dependencies, Utils, Env, Config

## 1. Dependencies

```bash
# Core
pnpm add next react react-dom

# Apollo Client & GraphQL
pnpm add @apollo/client graphql

# i18n
pnpm add next-intl

# State management
pnpm add jotai

# Form handling & validation
pnpm add react-hook-form zod @hookform/resolvers

# UI utilities
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-dialog lucide-react

# Payment
pnpm add @stripe/stripe-js @stripe/react-stripe-js

# Utilities
pnpm add lodash.debounce
pnpm add -D @types/lodash.debounce
```

---

## 7. Utilities + Constants

### `lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
  }).format(amount);
}
```

### `lib/constants.ts`

```typescript
export const APP_NAME = "Ecommerce";

export const ERXES_API_URL =
  process.env.NEXT_PUBLIC_ERXES_API_URL || "http://localhost:4000";

export const ERXES_CP_TOKEN = process.env.NEXT_PUBLIC_ERXES_CP_TOKEN || "";

export const POS_CONFIG_TOKEN = "pos-config-token";

export const ORDER_STATUS = {
  NEW: "new",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PAID: "paid",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const PAYMENT_KINDS = {
  CASH: "cash",
  CARD: "card",
  BANK_TRANSFER: "bankTransfer",
  Q_PAY: "qPay",
  SOCIAL_PAY: "socialPay",
  STRIPE: "stripe",
} as const;
```

---

## 15. Environment File

### `.env.local`

```bash
# Erxes API
NEXT_PUBLIC_ERXES_API_URL=http://localhost:4000/graphql

# Client Portal Token (Client Portal ID)
NEXT_PUBLIC_ERXES_CP_TOKEN=your_client_portal_id_here

# POS Config Token (stored in cookie: pos-config-token)
NEXT_PUBLIC_POS_TOKEN=your_pos_token_here
```

---

## 16. Next.js Config

### `next.config.mjs`

```javascript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tic.next.erxes.io",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
```

> **ЧУХАЛ:** `images.remotePatterns`-д erxes API hostname заавал бүртгүүлсэн байх ёстой. Үгүй бол `next/image` "hostname is not configured" алдаа гарна.
