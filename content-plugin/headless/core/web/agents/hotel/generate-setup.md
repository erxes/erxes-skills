# Hotel Setup: Dependencies, Utils, Env, Config

> Read alongside `agents/hotel/generate.md` (Design Agnosticism + Design Binding gate). All `className` values in the sub-files are from the reference hotel project — apply the approved design tokens, never copy them.

## 1. Dependencies

```bash
# Core
pnpm add next react react-dom

# Apollo Client & GraphQL
pnpm add @apollo/client graphql

# i18n
pnpm add next-intl

# Auth state (only for has_auth flows)
pnpm add jotai

# Form handling & validation (auth / booking forms)
pnpm add react-hook-form zod @hookform/resolvers

# UI utilities
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-dialog lucide-react
```

> **No Stripe, no POS token.** Hotel payments go through the erxes payment gateway configured in `payment_ids` (`NEXT_PUBLIC_PAYMENT_IDS`) — there is no separate payment SDK. Do not install `@stripe/*`.

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

const DAY_MS = 86400000;

export function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / DAY_MS));
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("mn-MN");
}
```

### `lib/constants.ts`

`lib/constants.ts` is **hotel-specific only**. The starter's Apollo layer reads
`process.env` directly, so do **not** add gateway-URL or app-token constants here.

```typescript
export const APP_NAME = "Hotel";

export const PMS_PIPELINE_ID = process.env.NEXT_PUBLIC_PMS_PIPELINE_ID || "";

export const BOOKING_STAGE_ID = process.env.NEXT_PUBLIC_BOOKING_STAGE_ID || "";

export const PAID_STAGE_ID = process.env.NEXT_PUBLIC_PAID_STAGE_ID || "";

// invoiceCreate paymentIds — comma-separated env split at runtime
export function getPaymentIds(): string[] {
  return (process.env.NEXT_PUBLIC_PAYMENT_IDS ?? "").split(",").filter(Boolean);
}

export const BOOKING_STATUS = {
  NEW: "new",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

export const PAYMENT_KINDS = {
  CASH: "cash",
  CARD: "card",
  BANK_TRANSFER: "bankTransfer",
  Q_PAY: "qPay",
  SOCIAL_PAY: "socialPay",
} as const;
```

> There is deliberately **no** `ERXES_API_URL`, `ERXES_ENDPOINT`,
> `ERXES_APP_TOKEN`, or `CMS_ID` constant. The starter owns those env reads
> (see `generate-core.md` §1), and `clientPortalId` is never sent.

---

## 15. Environment File

### `.env.local`

```bash
# Gateway GraphQL endpoint.
# NEXT_PUBLIC_GRAPHQL_URL is what the starter's Apollo client reads.
# The starter's server client reads GRAPHQL_URL and falls back to
# NEXT_PUBLIC_GRAPHQL_URL — only the fallback is guaranteed to be present.
NEXT_PUBLIC_GRAPHQL_URL=<erxes_endpoint from hotel.config.json>

# Erxes app token — sent as the `x-app-token` header on EVERY request.
# The same credential, exposed twice: public name for the browser,
# server name for server components.
NEXT_PUBLIC_ERXES_APP_TOKEN=<erxes_app_token from hotel.config.json>
ERXES_APP_TOKEN=<erxes_app_token from hotel.config.json>

# CMS record id created by erxes-cms.ts.
# Bookkeeping only — NOT sent as a header and NOT a GraphQL variable.
# Portal scoping comes from the x-app-token JWT.
NEXT_PUBLIC_CMS_ID=<erxes_cms_id from hotel.config.json>

# PMS pipeline (room availability)
NEXT_PUBLIC_PMS_PIPELINE_ID=<pipeline_id from hotel.config.json>

# Deal stages (bookings)
NEXT_PUBLIC_BOOKING_STAGE_ID=<booking_stage_id from hotel.config.json>
NEXT_PUBLIC_PAID_STAGE_ID=<paid_stage_id from hotel.config.json>

# Payment method IDs (comma-separated) for invoiceCreate paymentIds
NEXT_PUBLIC_PAYMENT_IDS=<comma-separated payment_ids from hotel.config.json>
```

> `lib/next-config-writer.ts` injects these values into `next.config.mjs` `env: {}`
> at build time, so most of them are already present. It also writes
> `NEXT_PUBLIC_ERXES_ENDPOINT` and `NEXT_PUBLIC_ERXES_CP_TOKEN`, which the starter
> **does not read** — ignore those; do not reference them in code.

> Every value comes from `hotel.config.json` — see `agents/hotel/setup.md`. Do not invent values.

---

## 16. Next.js Config

### `next.config.mjs`

```javascript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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
>
> **Deploy note:** referencia-г `agents/hotel/AGENTS.md`-н Step 7-оос харна уу. Статик export дээр `middleware.ts`-той нийцэхгүй (деталь: `agents/ecommerce/generate-i18n.md` deploy note) — i18n middleware сонгоход зөвхөн SSR deploy болно.