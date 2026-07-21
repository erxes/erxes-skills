# Ecommerce i18n Setup (Mobile)

`next-intl` болон `[locale]` routing байхгүй — `expo-localization` + `i18n-js` ашиглана.
`i18n/routing.ts`, `i18n/request.ts`, `middleware.ts` файлуудыг үүсгэхгүй.

`messages/mn.json` болон `messages/en.json` — **web-тэй бүрэн ижил, өөрчлөлт байхгүй.**

---

## `lib/i18n/index.ts`

```typescript
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";
import mn from "@/messages/mn.json";
import en from "@/messages/en.json";

export const i18n = new I18n({ mn, en });
i18n.locale = getLocales()[0]?.languageCode ?? "mn";
i18n.enableFallback = true;
i18n.defaultLocale = "mn";
```

## `store/locale.ts`

```typescript
import { atom } from "jotai";
import { getLocales } from "expo-localization";
import { i18n } from "@/lib/i18n";

export const localeAtom = atom(
  getLocales()[0]?.languageCode ?? "mn",
  (get, set, locale: string) => {
    set(localeAtom, locale);
    i18n.locale = locale;
  },
);
```

## Install

```bash
npx expo install expo-localization
npm install i18n-js
```

## Usage

```typescript
import { i18n } from "@/lib/i18n";

// Any component
<Text>{i18n.t("nav.home")}</Text>
<Text>{i18n.t("product.addToCart")}</Text>
<Text>{i18n.t("common.loading")}</Text>
```

## Language switcher

```typescript
import { useAtom } from "jotai";
import { localeAtom } from "@/store/locale";

const [locale, setLocale] = useAtom(localeAtom);
// setLocale("en") or setLocale("mn")
```
