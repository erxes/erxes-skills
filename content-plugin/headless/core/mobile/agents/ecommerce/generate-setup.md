# Ecommerce Setup: Dependencies, Utils, Env, Config (Mobile)

## 1. Dependencies

```bash
# Core
npx expo install expo expo-router expo-constants expo-linking expo-status-bar

# Apollo Client & GraphQL
npx expo install @apollo/client graphql

# Auth token storage
npx expo install expo-secure-store

# Image
npx expo install expo-image

# Font
npx expo install expo-font expo-splash-screen

# Gestures & Safe area
npx expo install react-native-gesture-handler react-native-safe-area-context react-native-screens

# State management
npm install jotai

# i18n
npx expo install expo-localization
npm install i18n-js

# Form handling & validation
npm install react-hook-form zod @hookform/resolvers

# Styling
npm install nativewind tailwindcss

# HTML renderer (CMS content)
npx expo install react-native-render-html

# Deep linking / redirect
npx expo install expo-linking

# Haptics
npx expo install expo-haptics

# Utilities
npm install lodash.debounce
npm install -D @types/lodash.debounce
```

---

## 7. Utilities + Constants

### `lib/utils.ts`

`cn()` — NativeWind-д ч ашиглаж болно. `isValidUrl`, `formatPrice` — **ижил, өөрчлөлт байхгүй.**

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

`NEXT_PUBLIC_*` → `EXPO_PUBLIC_*`, `next.config` байхгүй.

```typescript
export const APP_NAME = "Ecommerce";

export const ERXES_API_URL =
  process.env.EXPO_PUBLIC_ERXES_API_URL || "http://localhost:4000";

export const ERXES_CP_TOKEN = process.env.EXPO_PUBLIC_ERXES_CP_TOKEN || "";

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
EXPO_PUBLIC_ERXES_API_URL=http://localhost:4000/graphql

# Client Portal Token
EXPO_PUBLIC_ERXES_CP_TOKEN=your_client_portal_id_here

# POS Token
EXPO_PUBLIC_POS_TOKEN=your_pos_token_here
```

---

## 16. Expo Config

`next.config.mjs` байхгүй — `app.config.ts` ашиглана.
`images.remotePatterns` байхгүй — `expo-image` дурын URL-г дэмждэг тул тохиргоо шаардлагагүй.

### `app.config.ts`

```typescript
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Ecommerce",
  slug: "ecommerce",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "ecommerce",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  plugins: ["expo-router", "expo-secure-store", "expo-font"],
  experiments: { typedRoutes: true },
});
```

### `tailwind.config.js`

```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

### `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["nativewind/babel"],
  };
};
```
