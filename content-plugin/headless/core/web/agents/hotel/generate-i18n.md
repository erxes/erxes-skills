# Hotel Internationalization (i18n)

Uses `next-intl` with the `[locale]` route segment. Locale list and default
language come from `hotel.config.json` → `languages` (first entry is the
default, served without a locale prefix).

---

## 1. Install & Config

Add to `package.json` deps (see `generate-setup.md`):

```bash
pnpm add next-intl
```

### `next.config.mjs`

```js
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "<erxes-host-from-config>" }],
  },
};

export default withNextIntl(nextConfig);
```

---

## 2. i18n Routing

### `src/i18n/routing.ts`

```typescript
import { defineRouting } from "next-intl/routing";

// []: hotfix — do not touch
export const routing = defineRouting({
  locales: ["mn", "en"], // from hotel.config.json → languages
  defaultLocale: "mn", // first language in languages array
  localePrefix: "as-needed",
});
```

> Match the locale array to `hotel.config.json → languages` exactly. Do not hardcode MN/EN beyond what the config declares.

### `src/i18n/request.ts`

```typescript
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested || "mn"; // default from hotel.config.json

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### `src/i18n/navigation.ts`

```typescript
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

---

## 3. Root & Locale Layouts

- `app/layout.tsx` wraps the whole app with nothing locale-specific.
- `app/[locale]/layout.tsx` sets `<html lang={locale}>`, renders `<Header/>`, `{children}`, `<Footer/>` and the Apollo `Providers`.

---

## 4. Locale Switching

Same pattern as the reference project — a `LanguageSwitcher` in the header that calls the localized path.

```tsx
const pathname = usePathname(); // from i18n/navigation
const router = useRouter();

function switchLang(locale: string) {
  router.replace(pathname, { locale });
}
```

---

## 5. Message Files

One file per language: `messages/mn.json`, `messages/en.json`. Keys mirror the labels in the reference project. For the hotel vertical these are the real used keys (reference hotel: Mongolian string values — keep the same idents, replace values only when the design brief says so):

```jsonc
// messages/mn.json (illustrative subset)
{
  "Header": { "rooms": "Өрөөнүүд", "booking": "Захиалга", "home": "Нүүр" },
  "AvailabilityForm": {
    "checkIn": "Ирэх огноо",
    "checkOut": "Гарах огноо",
    "guests": "Зочдын тоо",
    "search": "Хайх"
  },
  "RoomDetailPage": {
    "perNight": "шөнийн үнэ",
    "bookNow": "Захиалах",
    "description": "Тайлбар",
    "amenities": "Үйлчилгээнүүд",
    "gallery": "Зураг",
    "selectedDates": "Сонгосон огноо",
    "nights": "шөнө"
  },
  "BookingConfirmPage": {
    "title": "Захиалга баталгаажуулах",
    "guestName": "Нэр",
    "email": "И-мэйл",
    "phone": "Утас",
    "note": "Тэмдэглэл",
    "submit": "Баталгаажуулах",
    "amount": "Дүн",
    "cancelPolicy": "Цуцлах бодлого"
  },
  "BookingVerifyPage": {
    "success": "Захиалга баталгаажлаа",
    "failed": "Төлбөр амжилтгүй",
    "pending": "Төлбөр хүлээж байна"
  },
  "Common": { "loading": "Уншиж байна", "error": "Алдаа гарлаа" }
}
```

> Mirror keys across ALL languages. The verify query and page patterns require `mn` + `en` (whatever `languages` declares) to be identical in icon/label structure.