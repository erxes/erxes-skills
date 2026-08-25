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

# Babel preset — REQUIRED by babel.config.js below. Missing this causes
# "Cannot find module 'babel-preset-expo'" at bundle time. Always install
# this in the same pass as the other core deps — do not defer it.
npx expo install babel-preset-expo

# Utility functions used by lib/utils.ts (cn())
npm install clsx tailwind-merge

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

**Agent rule:** after running these installs, verify `babel-preset-expo`,
`clsx`, and `tailwind-merge` all appear in `package.json` before moving on —
these three are the ones most often silently skipped because they are not
directly imported by name in a screen/component the way `jotai` or
`react-hook-form` are.

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

**IMPORTANT — naming must match `lib/apollo/client.ts` (`generate-core.md`) exactly.**
The Apollo client reads the client-portal token from
`process.env.EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`. Use that same variable name
here and in `.env.local` below — do not introduce a differently-named
variable (e.g. `EXPO_PUBLIC_ERXES_CP_TOKEN`) for the same value, or the
`x-app-token` header will silently resolve to an empty string and every
gateway request will fail as if unauthenticated.

```typescript
export const APP_NAME = "Ecommerce";

export const ERXES_API_URL =
  process.env.EXPO_PUBLIC_ERXES_API_URL || "http://localhost:4000";

// Same value used as the "x-app-token" header in lib/apollo/client.ts —
// keep this variable name identical in both places.
export const CLIENT_PORTAL_TOKEN =
  process.env.EXPO_PUBLIC_CLIENT_PORTAL_TOKEN || "";

export const POS_TOKEN = process.env.EXPO_PUBLIC_POS_TOKEN || "";

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

### `lib/tokens.ts` — Design Token Wiring (MANDATORY before any component)

Single typed accessor generated **directly from `output/<slug>/design-tokens.json`**
in the same pass as `tailwind.config.js` + `global.css` below. This mirrors the
web pipeline's architectural enforcement: className-reachable styling uses
semantic utility classes (`bg-primary`, `text-accent`) generated from the same
JSON; only surfaces className cannot reach (navigator theme options, native
props like `placeholderTextColor`/`tintColor`, Reanimated styles) import from
here. Hex literals are unnecessary everywhere.

```typescript
// lib/tokens.ts — GENERATED from design-tokens.json. Values below are examples.
// Regenerate whenever design-tokens.json changes — never let them diverge.
export const tokens = {
  colors: {
    semantic: {
      background: "#F8F9FA",
      foreground: "#14213D",
      card: "#FFFFFF",
      cardForeground: "#14213D",
      primary: "#14213D",
      primaryForeground: "#FFFFFF",
      secondary: "#0A1F44",
      accent: "#D4AF37",
      muted: "#EEF0F3",
      mutedForeground: "#8A93A0",
      border: "#E2E6EA",
      destructive: "#C0392B",
    },
  },
  radius: { input: 12, btn: 14, card: 16 },
} as const;

export type Tokens = typeof tokens;
```

**Agent rules:**

1. Generate this file BEFORE any component or screen — components reference
   `tokens.colors.*`, not hex.
2. className-reachable styling → semantic classes ONLY (`bg-primary`,
   `text-accent`, `rounded-card`). Arbitrary values (`bg-[#D4AF37]`) forbidden.
3. className-unreachable surfaces → `import { tokens } from "@/lib/tokens"`.
4. Product color-swatch data (`colorOptions[].hex`) is product DATA, not theme
   styling — it does not come from tokens and is exempt from rule 3.
5. Post-generation gate:
   ```bash
   grep -rnE '#[0-9A-Fa-f]{6}' output/<slug>/app output/<slug>/components output/<slug>/src --include='*.tsx' --include='*.ts' | grep -v 'hex:'
   ```
   must return zero hits (the `grep -v 'hex:'` exempts swatch data fields).

---

## 15. Environment File

### `.env.local`

```bash
# Erxes API gateway (GraphQL endpoint)
EXPO_PUBLIC_ERXES_API_URL=http://localhost:4000/graphql

# Client Portal app token
EXPO_PUBLIC_CLIENT_PORTAL_TOKEN=your_client_portal_jwt_here

# POS integration token — collected as `pos_token` during Step 0 setup.
EXPO_PUBLIC_POS_TOKEN=your_pos_token_here
```

**Agent rule:** verify these three variable names against `lib/apollo/client.ts`
(`generate-core.md`) after writing this file — the two files must use the
exact same identifiers or the Apollo headers resolve to empty strings at
runtime with no build-time error to flag it.

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
  web: { bundler: "metro" },
  experiments: { typedRoutes: true },
});
```

> If Step 4.5 (`connect-messenger.md`) or Step 4.6 (`notification.md`) run
> afterward, they append their own plugin entries (`expo-build-properties`,
> `@react-native-firebase/app`, `@react-native-firebase/messaging`, etc.) to
> this same `plugins` array — do not overwrite it, extend it.

### `tailwind.config.js`

```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

> This is the bare scaffold. The full design-token mapping (colors/radius/
> fontFamily from `design-tokens.json`) belongs in the authoritative sample in
> `generate-core.md` §6 — wire it there in the same pass as `lib/tokens.ts`.

### `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### `metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

### `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Mirror design-tokens.json semantic colors as CSS variables — NativeWind v4
   supports :root custom properties; enables runtime theming / dark mode via
   vars() from "nativewind" later. Values come from design-tokens.json. */
@layer base {
  :root {
    --color-background: #f8f9fa;
    --color-primary: #14213d;
    --color-accent: #d4af37;
    --color-foreground: #14213d;
    --color-muted: #eef0f3;
    --color-border: #e2e6ea;
  }
}
```

Write the actual values from this project's `design-tokens.json` — the ones
above are examples.

**Agent rule:** this file must not be generated until `babel-preset-expo` has
been installed (see Dependencies section above) — writing the config before
the package exists is what produces `Cannot find module 'babel-preset-expo'`
at first bundle.
