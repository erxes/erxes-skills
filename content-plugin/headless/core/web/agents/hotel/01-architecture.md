# Tegri Gobi Resort — Phase 1 Architecture Report

---

## 1. TECH STACK

### Framework & versions

| Item                    | Value                                                                                                                | Evidence             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Next.js                 | `15.4.10` (pinned, no caret)                                                                                         | `package.json:63`    |
| Router                  | **App Router** (all routes under `src/app`, incl. `layout.tsx`, `page.tsx`, `route.ts`)                              | `src/app/**`         |
| React                   | `19.1.0` / `react-dom` `19.1.0` (pinned)                                                                             | `package.json:66,67` |
| React Server Components | Enabled — `components.json` has `"rsc": true`                                                                        | `components.json:4`  |
| TypeScript              | `^5`, devDep                                                                                                         | `package.json:81`    |
| Dev server              | `next dev -p 3002` with `WATCHPACK_POLLING` + `CHOKIDAR_USEPOLLING` (needed in containers/VM mounts)                 | `package.json:6`     |
| `src/` dir              | Configured implicitly: Next infers `src/app` when a `src` dir exists; there is no `experimental.appDir` flag anymore | —                    |

### Language / TS config (`tsconfig.json`)

- `strict: true`
- `module: "esnext"`, `moduleResolution: "bundler"` (Next 15 default)
- `jsx: "preserve"`, `noEmit: true`, `isolatedModules: true`, `resolveJsonModule: true`
- Path alias: **single alias** `@/* → ./src/*` (`tsconfig.json:19-23`)
- `allowJs: true`, `skipLibCheck: true`, `target: ES2017`

ESLint is effectively disabled for type safety: `no-explicit-any`, `no-unused-vars`, `rules-of-hooks`, and `exhaustive-deps` are all `off` (`eslint.config.mjs:9-17`, duplicated in `.eslintrc.json` — both files exist; see Open Questions).

### Styling

- **Tailwind CSS v4** (`^4` devDep), via `@tailwindcss/postcss` — CSS-first config, no `tailwind.config.js` exists.
- `postcss.config.mjs` is 3 lines: `plugins: ["@tailwindcss/postcss"]`.
- `src/app/[locale]/globals.css:1-3`:
  ```css
  @import "tailwindcss";
  @import "tw-animate-css";
  @plugin "@tailwindcss/typography";
  ```
- `@custom-variant dark (&:is(.never-dark *))` — a custom dark variant gated on a `.never-dark` ancestor (line 5).
- Fonts: **Roboto** + **DM Sans**, both from `next/font/google`, exposed as CSS variables `--font-roboto` and `--font-dm-sans` (`src/app/[locale]/layout.tsx:21-37`). A `.font-roboto` and `.font-dm-sans` utility are hand-written in CSS (lines 39-64) rather than via `@theme`.
- Colors: shadcn-style CSS variables in `oklch`, mapped into Tailwind with `@theme inline` (`globals.css:67-104`), defined in `:root` (105+). Brand primary is `oklch(0.637 0.223 28.4)` (a warm red).
- `@tailwindcss/typography` used by `ContentRenderer.tsx` for CMS HTML (`prose` class).

### shadcn/ui

- `components.json`: style `new-york`, `cssVariables: true`, `prefix: ""`, `baseColor: neutral`, `iconLibrary: lucide`.
- CSS entrypoint `src/app/[locale]/globals.css`, aliases: `components → @/components`, `utils → @/lib/utils`, `ui → @/components/ui`, `lib → @/lib`, `hooks → @/hooks` (**this alias target does not exist** — see Open Questions).
- 38 files in `src/components/ui/`, of which ~26 are stock shadcn primitives (accordion, alert-dialog, avatar, badge, button, calendar, checkbox, dialog, form, input, label, menubar, popover, radio-group, scroll-area, select, separator, tabs, textarea, carousel, sonner, password, alert, skeleton bits). The rest are project-specific: `MainLoader.tsx`, `Loader.tsx`, `FourDotsLoader.tsx`, `loading.tsx`, `GridSkeleton.tsx`, `SkeletonAppointment.tsx`, `image.tsx`, `CustomImage.tsx`, `Icon.tsx`, `counter.tsx`, `date-time-picker.tsx`, `minimalist-calendar.tsx`, `minimalist-time-slot.tsx`, `time-picker.tsx`, `responsive-test.tsx`.
- Note `src/components/ui/image.tsx` — a **client** wrapper around `next/image` that rewrites CMS attachment keys through `readFile()` and swaps in a Cloudflare loader for remote URLs. Most page images go through this, not `next/image` directly.

### State management

- **Jotai** is the primary store (`src/store/`, 5 files). `zustand` appears once, in `src/components/appointment/hooks/usePaymentModal.tsx` — a one-off, not the app's convention.
- No Jotai `<Provider>` is mounted in the root layout. `src/store/index.tsx` exports a `Providers` component wrapping `<JotaiProvider><ApolloProvider>`, but **it is never imported anywhere** — dead code. Jotai works fine without an explicit Provider (default store).
- `src/store/index.tsx` also exports `useSelectAtom` — the `selectAtom` granularity helper for re-render control. Let me grep whether it's used... it is exported but the only other export (`Providers`) is unused. Treat `useSelectAtom` as an available pattern, not an established one.

Atom inventory:

| File                   | Atoms                                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/store/auth.ts`    | `currentUserAtom: IUser \| null`, `loadingUserAtom: boolean` (init `true`), `refetchCurrentUserAtom: boolean`                                                                                                         |
| `src/store/config.ts`  | `currentConfigAtom: IConfig \| null` (PMS branch config)                                                                                                                                                              |
| `src/store/pricing.ts` | `pricingPlanDetailsAtom: IPricingPlan[]`, `accountDiscountsAtom: IAccountDiscount[]`, `loadingAccountDiscountsAtom: boolean`                                                                                          |
| `src/store/reserve.ts` | `reserveAtom` (startDate/endDate/roomCount/guests), `selectedRoomsAtom`, `roomGuestAssignmentsAtom`, `dealIdAtom` (via `atomWithStorage`, persisted to localStorage), `currentStepAtom: number` (booking wizard step) |

### Data layer — GraphQL only, hand-written, **no codegen**

This is the single most important architectural fact. There is **no** REST client, no codegen config (`codegen.yml` / `*.codegen.ts` / `.graphql` files all absent), no `__generated__` types, and no tRPC. Everything is hand-written `gql` documents.

> **TARGET LAYOUT (FIXED) — generate against the starter, not `src/sdk/*`.**
> The starter that `scripts/clone.ts` produces already ships the data layer; extend it, do not rebuild it:
> - **Documents:** `src/graphql/hotel/queries/{rooms,booking,index}.ts` and `src/graphql/hotel/mutations/{booking,index}.ts`. The shared `src/graphql/auth/**` + `src/graphql/cms/**` layers are reused as-is.
> - **Shared payment ops:** `src/graphql/ecommerce/{queries,mutations}/payment.ts` (kept by `clone.ts` for hotel/tour — `src/graphql/hotel/mutations/index.ts` re-exports nothing from ecommerce; import the payment documents directly from the ecommerce path).
> - **Apollo clients:** `@/lib/apollo/client.ts` (browser factory), `@/lib/apollo/provider.tsx` (React provider), `@/lib/apollo/server-client.ts` (RSC/server). There is **no** `src/app/[locale]/ApolloClient.tsx` and **no** `src/sdk/getClient.tsx`.
> - Everything below that references `src/sdk/*`, `src/app/[locale]/ApolloClient.tsx`, or `createApolloClient()` describes the **Tegri Gobi reference project — reference only, do not copy.**

**(Reference only — Tegri Gobi.)** Three-layer split inside `src/sdk/`:

1. **`src/sdk/graphql/<domain>/`** — raw documents. Each domain has `queries.ts`, `mutations.ts`, `index.ts` (`index.ts` is a 2-line barrel: `export { default as queries } from "./queries"`). Domains: `auth, cms, config, customers, forms, kb, payments, pos, pricing, products, reviews, rooms, sales, tms`. (`pos` and `kb` have queries/mutations but **no consumer** in `src/sdk/queries` — `queries/kb.tsx` exists though. `pos` appears unused entirely.)
2. **`src/sdk/queries/*.tsx` and `src/sdk/mutations/*.tsx`** — the React layer. `queries/*` mix two kinds of function in one file:
   - client hooks: `useCmsPosts`, `useRooms`, `useCheckRooms` — wrap `useQuery` and return shaped domain objects
   - server functions: `getCmsPostDetail`, `getFormByCode`, `getTmsTourDetail`, `getDealDetail` — `async` functions that call `getClient().query()`. These are what `generateMetadata` uses.
3. **`src/sdk/hooks/*.tsx`** — 5 composite hooks (`useAccountDiscounts`, `useAddDeal`, `useErxesForm`, `usePlanPrice`, `useRoomPricing`).

**(Reference only — Tegri Gobi.)** Two Apollo clients exist in the reference project, and they are different on purpose. The generator uses the starter's `@/lib/apollo/{client,provider,server-client}.ts` instead (see TARGET LAYOUT above):

`src/sdk/getClient.tsx` — the SSR-only client used by `get*` functions in server context:

```ts
export function getClient() {
  const httpLink = new HttpLink({
    uri: `${process.env.NEXT_PUBLIC_MAIN_API_DOMAIN}/graphql`,
    fetch,
  });
  const authLink = setContext((_, { headers }) => ({
    headers: {
      ...headers,
      "x-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN,
      "Cache-Control": "no-cache",
    },
  }));
  return new ApolloClient({
    ssrMode: true,
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}
```

This is exactly the `@apollo/experimental-nextjs-app-support` RSC pattern — except that package is **declared as a dependency and never imported** (`getClient` is hand-rolled instead). `createApolloClient()` is also defined in `ApolloClient.tsx` and unused.

`src/app/[locale]/ApolloClient.tsx` — a **singleton browser client** exported as `client` and mounted via `<ApolloProvider>` in the root layout. It carries the full auth story:

- Auth token read from **`sessionStorage`** (`token`, `refreshToken`, `refetchToken`) per-request via `setContext`; header name `client-auth-token`. (`src/lib/utils.ts` has a _separate_, older `localStorage`+`access_token`+`NEXT_PUBLIC_ERXES_API_URL/oauth/refresh` implementation — parallel and inconsistent, see Open Questions.)
- `errorLink` intercepts `graphQLErrors` matching `"token expired"` or `extensions.code === "SUBREQUEST_HTTP_ERROR"`, runs `clientPortalUserRefreshToken`, writes the new token, then replays the operation.
- HTTP + WebSocket split: `graphql-ws` `GraphQLWsLink` pointed at `NEXT_PUBLIC_MAIN_SUBS_DOMAIN` (declared nowhere in `next.config.ts` → always `""` at runtime), only in the browser.
- A hardcoded `"erxes-pos-token"` header literal sits in the auth link.
- Link order: `ApolloLink.from([errorLink, splitLink])`.

Backend is the **Erxes platform** — the whole schema is `cp*`-prefixed client-portal mutations (`cpPosts`, `cpProducts`, `cpPmsRooms`, `cpPricingPlans`, `cpInvoices`, `cpBmsTours`, `cpForms`, `clientPortalCurrentUser`) plus sales (`cpSalesBoards/Pipelines/Stages`), POS, and PMS concepts. Hardcoded IDs are pervasive and scattered (see section 4).

### i18n

- **next-intl `^4.3.4`** — the current (non-legacy) API.
- Locales: **`en`, `mn`**; `defaultLocale: 'en'` (`src/i18n/routing.ts`).
- `src/i18n/request.ts` uses `getRequestConfig` + `requestLocale` + `hasLocale` and dynamic-imports `messages/${locale}.json`.
- `src/i18n/navigation.ts` exports a locale-aware `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` from `createNavigation(routing)`. App code consistently imports these instead of `next/link` / `next/navigation` — an important convention to encode.
- Root layout **also** manually re-imports messages (`layout.tsx:63`) and passes them to `NextIntlClientProvider` — redundant with `request.ts` but that's the current state.
- `next.config.ts` wraps with `createNextIntlPlugin()`.
- Middleware (`src/middleware.ts`) is 7 lines: `createMiddleware(routing)` with matcher `'/((?!api|trpc|_next|_vercel|.*\\..*).*)'`. **No auth, no redirects, no header manipulation** — locale prefix negotiation only, with `localePrefix: "always"` (the default).
- `src/components/LanguageSwitch.tsx` hand-rolls locale switching with `useRouter().push()` on a _plain_ next/navigation router and manual path splicing, rather than using next-intl's `usePathname`/`useRouter` pair.
- Messages: `messages/en.json` (58 KB, 1120 lines) and `messages/mn.json` (84 KB, 1116 lines). **48 top-level namespaces**, one per UI area, used as `useTranslations("Header")`. Namespaces include `Metadata` (SEO strings — note mn is _larger_, suggesting richer prose), `Header`, `Footer`, `Booking`, `Reserve`, `Profile`, `Payment`, `Appointment`, `Tours`, `Merch`, `Forms`, etc.

### Libraries by purpose

**Animation / scroll**

- `framer-motion@^12` — header/menu slide-ins, accordion reveals, `ScrollStack`, `SpaAccordton`, `FaqDatas`, `Reserve`. The default choice.
- `embla-carousel-react@^8` + `embla-carousel-autoplay` — hero image carousels (`VideoPageLayout` with4s autoplay, `memories`, `merch`, `dining`, `fund`, `authImages`, `lodgeStays`).
- `lottie-react@^2` — `src/components/ui/MainLoader.tsx` only, with `public/animation/mainLoader.json`.
- `lenis@^1.3.9` — **installed, zero imports.** Dead dependency.
- Custom `@keyframes kenburns` + `.animate-kenburns` in `globals.css:12-23`.

**Forms / validation**

- `react-hook-form@^7` + `@hookform/resolvers@^5` + **`zod@^4`** — the standard trio. Schemas are declared _inline inside_ the component (so `t()` can be used for messages) rather than in a shared file — see `src/containers/auth/login-form.tsx:24-33`. A few reusable primitives do live in `src/lib/zod.ts` (`passwordZod`, `phoneZod`).
- Typed form shapes live in `src/lib/schema/{appointment,booking,reserve}/types.ts` with `zodResolver` wiring in the sibling `index.tsx`.
- `react-day-picker@^9` — `src/components/ui/calendar.tsx` (shadcn calendar) and `src/components/appointment/time/AppointmentPickerDayRange.tsx`.

**Date**

- `date-fns@^4` — `src/lib/date.ts` (`FORMAT = "yyyy-MM-dd"`, `parseDate`, `formatToDate`, `toCalendarDay` for TZ-safe calendar days, plus hand-rolled `formatBookingDate`/`formatShortDate` with a Mongolian month table), `src/store/reserve.ts` defaults, `src/lib/booking-pricing.ts` (`differenceInDays` → `getNights`).
- `nuqs@^2` — URL search-param state for the booking/appointment flows. Mounted as `<NuqsAdapter>` in the root layout **and again** in each `*/booking/page.tsx` (redundant nesting).

**Icons**

- `lucide-react` — primary (and shadcn's configured `iconLibrary`).
- `react-icons@^5` — `src/components/ui/Icon.tsx` maps CMS icon _strings_ to icon packs (`Fa`, `Ai`, `Bs`, `Bi`, …), so the CMS/admin can pick an icon name.
- `src/icons/**` — 7 hand-written SVG components in 3 subfolders (`home/`, `about-us/`, `footer/`), named `XxxIcon.tsx`. A small legacy set alongside the two icon libraries.

**Payments**

- `@stripe/react-stripe-js@^3` — **installed, zero imports.** Payment runs through Erxes' own invoice system: `cpInvoices`/`invoiceDetail` (`src/sdk/graphql/payments/queries.ts`) and polling. `src/lib/payment-status.ts` normalizes invoice statuses and even includes a dev-only `?forceStatus=` escape hatch for testing the failure dialog.
- `negotiator@^1` + `@types/negotiator` — **installed, zero imports.**

**State / misc**

- `jotai` + `jotai/utils` (`atomWithStorage`, `selectAtom`).
- `zustand` — one file only.
- `sonner@^2` — toasts, with a themed `src/components/ui/sonner.tsx` wrapper.
- `nanoid@^5` — used in `src/lib/cms.ts` (actually imported: let me be precise — it's referenced alongside the erxes ID pattern matching) to generate/validate ids.
- `html-react-parser@^5` — `src/components/ContentRenderer.tsx`, sanitizes CMS HTML by stripping `style` attributes then renders with `prose`.
- `generate-password@^1` — `src/lib/password-generater.ts` (typo in filename, preserved).

**Payments/misc actually used:** `clsx` + `tailwind-merge` inside `cn()` (`src/lib/utils.ts:15-17`), `class-variance-authority` for variant APIs in `button/badge/alert`.

### Package manager — **pnpm**

Three lockfiles coexist, but `pnpm-lock.yaml` is authoritative:

| File                | Last commit                     | Evidence                                                                                                                    |
| ------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm-lock.yaml`    | `30591f9` **2026-08-17** "fund" | latest; `lockfileVersion: '9.0'`; has an `importers:` section with per-package peer-resolution hashes — pnpm-only structure |
| `package-lock.json` | `5437076` 2026-06-03            | `lockfileVersion 3`, 836 packages — npm v7+ format                                                                          |
| `yarn.lock`         | `5437076` 2026-06-03            | `yarn lockfile v1` — Yarn classic                                                                                           |

`pnpm-workspace.yaml` exists and is pnpm-specific — it only contains an `allowBuilds:` block approving native postinstall scripts for `@parcel/watcher`, `@swc/core`, `msw`, `sharp`, `unrs-resolver` (pnpm v10+ replaced `onlyBuiltDependencies` with `allowBuilds`). **No `packageManager` field in package.json.** The dev script's `WATCHPACK_POLLING`/`CHOKIDAR_USEPOLLING` pair is npm/yarn-specific (pnpm's watcher is chokidar-based too but the env vars are copy-paste cargo cult). No `node_modules` present in the checkout, so I could not confirm installation empirically — the `pnpm-workspace.yaml` + newest lockfile is the strongest signal.

---

## 2. FOLDER STRUCTURE

```
src/
├── app/                     Next App Router — the ONLY place with route files
│   ├── api/                 Route handlers (REST-ish), no locale segment
│   │   ├── company-signup/unlock/route.ts
│   │   └── google-reviews/route.ts
│   └── [locale]/            Locale segment: every page lives here
│       ├── (auth)/          Route group: auth pages, share one layout, no URL segment
│       │   ├── layout.tsx   Split-screen: form left, image collage right
│       │   └── login|signup|verify|forgot-password|reset-password|company-signup/page.tsx
│       ├── layout.tsx       Root layout: fonts, intl, nuqs, apollo, jotai providers, GTM/GA4
│       ├── globals.css      Tailwind v4 entry + theme tokens
│       ├── ApolloClient.tsx Browser Apollo singleton (co-located, not in a lib folder)
│       ├── <feature>/       One folder per content section, with page.tsx + [slug]/ + booking/ + payment/[slug]/
│       └── booking/         The room-booking wizard; also holds booking-layout.tsx + components/
├── components/
│   ├── layout/              Header, SecondaryHeader, Footer, MainVideo, Reserve, ReserveText, ConditionalLayout
│   ├── clientPages/         The real page bodies (camelCase folder = camelCase file)
│   ├── ui/                  shadcn primitives + project loaders + image wrappers
│   │   └── kibo-ui/video-player/   Vendored 3rd-party component (media-chrome based)
│   ├── shared/              Cross-feature UI: BookingLayout + shared/forms/
│   ├── <feature>/           about-us, accommodation, activities, dining, merch, fund,
│   │                        news, spa-wellness, sustainability, tours, profile, reserve, contact-us, booking, auth…
│   ├── authImages/          Auth-page background collage
│   └── *.tsx                Home-page sections (BannerSection, JourneySection, GallerySection…) + ErxesWidget, ContentRenderer, LanguageSwitch
├── containers/              Only 3 areas, all provider/form-shaped
│   ├── auth/9 files: login-form, register-form, forgot/reset-password-form, verify, current-user, private-route, redirector, auth-container
│   ├── config/              currentConfig.tsx (PMS branch config provider)
│   └── pricing/             pricingPlans.tsx (pricing plan + discount provider)
├── i18n/                    routing.ts, request.ts, navigation.ts
├── icons/                   7 hand-written SVG components (home/, about-us/, footer/)
├── lib/                     Framework-agnostic logic + hooks + zod schemas
│   ├── apollo/              STARTER LAYOUT (FIXED): client.ts, provider.tsx, server-client.ts
│   ├── hooks/               useMetadata, useFooterVisibility, useSelectedRooms
│   ├── schema/              appointment/, booking/, reserve/ — zod schemas + inferred types
│   ├── cms.ts               CMS customFields → product-id resolvers (nanoid)
│   ├── date.ts  pricing.ts  booking-pricing.ts  payment-status.ts  tms.ts  utils.ts  zod.ts
│   └── fund.ts  menu.ts  constants.ts  upload.ts  image-loader.tsx  use-media-query.tsx  …
├── graphql/                 GraphQL documents — STARTER LAYOUT (FIXED, see §1 TARGET LAYOUT)
│   ├── auth/ cms/           shared layers reused as-is (queries.ts, mutations.ts, index.ts)
│   ├── hotel/               active vertical: queries/{rooms,booking,index}.ts, mutations/{booking,index}.ts
│   └── ecommerce/           retained for hotel/tour: {queries,mutations}/payment.ts (shared payment ops)
├── store/                   Jotai atoms: auth, config, pricing, reserve, index
├── types/                   17 files, one per backend domain, interfaces only
├── middleware.ts            next-intl locale middleware
```

### `components` vs `containers` — the actual rule in this repo

This is **not** the classical "presentational vs container" split. The distinction is narrow and observable:

- **`components/`** — the dominant bucket (≈380 of 400 files). Everything that renders: UI, sections, page bodies (`clientPages/`), shadcn primitives, form pieces, feature widgets.
- **`containers/`** — only things that **wrap the whole app or own a whole form**:
  - App-wide providers mounted in `src/app/[locale]/layout.tsx`: `CurrentConfigProvider` (`containers/config/currentConfig.tsx`), `PricingPlansProvider` (`containers/pricing/pricingPlans.tsx`)
  - Complete, self-contained form screens for the auth flow (`containers/auth/*-form.tsx`, `verify.tsx`)
  - Auth guards and the user-menu widget (`private-route.tsx`, `redirector.tsx`, `current-user.tsx`)

So the practical rule for a generator: **`containers/` = app-level providers + standalone auth form screens + auth guards. Everything else goes in `components/`.** If you were writing a `reserve` form screen it would most likely go in `src/components/reserve/` (that folder exists and holds `date-picker.tsx`, `guest-counter.tsx`, `room-counter.tsx`), not `containers/`. Conversely, a new app-wide provider (currency config, feature flags) belongs in `containers/<area>/`.

The boundary is leaky: `src/components/booking/payment/`, `src/components/appointment/` and `src/components/shared/BookingLayout.tsx` are effectively container-ish but live under `components/`.

Note also that `clientPages/` exists precisely because page bodies are client components (see §3) — the folder name says "this is a `'use client'` page implementation," the `app/**/page.tsx` is the thin server wrapper.

### Naming conventions

- **Files:** `camelCase.tsx` almost everywhere (`accommodationPage.tsx`, `SecondaryHeader.tsx`, `login-form.tsx`). Kebab-case is rare and inconsistent — `custom-fields` style appears in `src/lib/schema/*/index.tsx`? No — the exceptions are `useSelectedRooms.tsx` (a `.tsx` hook), `utils.ts`, and a few `*.tsx` in `containers/auth` (`current-user.tsx`, `private-route.tsx`) that happen to be kebab because they were copied from a template. Don't infer style from any single folder.
- **Folders:** `camelCase` for `clientPages` subfolders (`aboutUsPage`, `spaWellnessPage`); `kebab-case` for route folders (required by Next), and for `src/components` feature folders (`about-us`, `spa-wellness`), `src/sdk/graphql` domains, `src/lib/schema`. So: **route & lib folders kebab, clientPages folders camelCase, ui subfolders kebab.**
- **Components:** `PascalCase.tsx`, always `export default` (even when a named export also exists, e.g. `ReviewCard.tsx`). Page bodies follow `<name>Page.tsx` / `<name>DetailPage.tsx`.
- **Hooks:** `use<Thing>.ts(x)` — `useRooms`, `useCmsPostDetail`, `useMetadata` (which is `async` and used inside `generateMetadata` despite the `use` prefix — a misnomer worth flagging).
- **Types:** `I`-prefixed interfaces (`IPageProps`, `IProduct`, `IDeal`), domain-named files in `src/types/`, enum-ish unions as bare types (`BookingContext = "activities" | "dining" | …`).
- **Atoms:** `<thing>Atom`, sometimes with a loader companion (`loadingUserAtom`).
- **Route param names:** `[slug]` for CMS content, `[id]` for tours (`tours/[id]`), `[slug]` for deals (`payment/[slug]` holds a deal id — the segment name is misleading, see Open Questions).

---

## 3. ROUTING

### Full route inventory

All pages live under `src/app/[locale]/`. **There is no `loading.tsx`, no `error.tsx`, no `not-found.tsx`, and no `template.tsx` anywhere in the repo** (the only `loading*` file is `src/components/ui/loading.tsx`, a component). Route-level suspense/error boundaries are delegated to a root `MainLoader` in `containers/config/currentConfig.tsx` and the Sonner toaster.

**The universal page pattern** — server component, `generateMetadata` fetches, body is a one-line client component render:

`src/app/[locale]/accommodation/[slug]/page.tsx` (complete, 24 lines):

```tsx
import ClientAccommodationDetailPage from "@/components/clientPages/accommodationPage/accommodationDetailPage";
import useMetadata from "@/lib/hooks/useMetadata";
import { getCmsPostDetail } from "@/sdk/queries/cms";
import { IPageProps } from "@/types";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: IPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { post } = await getCmsPostDetail(slug, locale);
  const { title, excerpt } = post || {};
  const { metadata } = await useMetadata(title, excerpt, locale);
  return { ...metadata };
}

const AccommodationDetailPage = () => {
  return <ClientAccommodationDetailPage />;
};

export default AccommodationDetailPage;
```

`params` and `searchParams` are **Promises** (Next 15 async request APIs) and are always `await`ed. `IPageProps` (`src/types/index.ts:3-6`) types this shared shape.

| Route                                   | Component type                                            | Data fetching                                                              | Renders                                                                            |
| --------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/[locale]`                             | server                                                    | none in page; client child does `useCmsPageDetail("home")` + `useCmsPosts` | `clientPages/homePage/homePage.tsx`                                                |
| `/[locale]/about-us`                    | server                                                    | none; i18n for meta                                                        | `clientPages/aboutUsPage/aboutUsPage.tsx`                                          |
| `/[locale]/accommodation`               | server                                                    | none; i18n for meta                                                        | `clientPages/accommodationPage/accommodationPage.tsx`                              |
| `/[locale]/accommodation/[slug]`        | server                                                    | `getCmsPostDetail(slug, locale)` in `generateMetadata`                     | `accommodationDetailPage.tsx`                                                      |
| `/[locale]/activities`                  | server                                                    | none                                                                       | `clientPages/activitiesPage/activitiesPage.tsx`                                    |
| `/[locale]/activities/[slug]`           | server                                                    | `getCmsPostDetail`                                                         | `activitiesDetailPage.tsx`                                                         |
| `/[locale]/activities/booking`          | server                                                    | none                                                                       | `<NuqsAdapter><BookingPage context="activities"/></NuqsAdapter>`                   |
| `/[locale]/activities/payment/[slug]`   | server                                                    | `getDealDetail(slug)`                                                      | `<AppointmentPaymentPage context="activities"/>`                                   |
| `/[locale]/booking`                     | server                                                    | none                                                                       | `clientPages/bookingPages/bookingPage.tsx`                                         |
| `/[locale]/booking/details`             | server                                                    | none                                                                       | `bookingPages/bookingDetailsPage.tsx`                                              |
| `/[locale]/booking/confirm`             | server                                                    | none                                                                       | wrapped in `<Suspense>` (client uses `useSearchParams`) → `bookingConfirmPage.tsx` |
| `/[locale]/booking/payment/[slug]`      | server                                                    | **none — `generateMetadata` fully commented out**                          | `bookingPages/bookingPaymentPage.tsx`                                              |
| `/[locale]/careers`                     | server                                                    | none                                                                       | `clientPages/careersPage/careersPage.tsx`                                          |
| `/[locale]/contact-us`                  | server                                                    | none                                                                       | `clientPages/contactUsPage/contactUsPage.tsx`                                      |
| `/[locale]/dining`                      | server                                                    | none                                                                       | `clientPages/diningPage/diningPage.tsx`                                            |
| `/[locale]/dining/booking`              | server                                                    | none                                                                       | `<BookingPage context="dining"/>` in NuqsAdapter                                   |
| `/[locale]/dining/payment/[slug]`       | server                                                    | `getDealDetail(slug)`                                                      | `<AppointmentPaymentPage context="dining"/>`                                       |
| `/[locale]/forms/[slug]`                | **server, renders client child with server-fetched data** | `getFormByCode(slug)` — called **twice** (meta + body)                     | `<FormsDetailPage form={form}/>` in `DefaultPageLayout`; has a not-found branch    |
| `/[locale]/fund`                        | server                                                    | none                                                                       | `clientPages/fundPage/fundPage.tsx`                                                |
| `/[locale]/fund/projects/[slug]`        | server                                                    | `getCmsPostDetail` + static `getFundProject(slug, locale)`, `.catch()`d    | `fundPage/fundProjectDetailPage.tsx`                                               |
| `/[locale]/legal-notice`                | server                                                    | none                                                                       | `clientPages/legalNoticePage/legalNoticePage.tsx`                                  |
| `/[locale]/lodge-stays`                 | server                                                    | none                                                                       | `clientPages/lodgeStaysPage/lodgeStaysPage.tsx`                                    |
| `/[locale]/lodge-stays/[slug]`          | server                                                    | `getTmsTourDetail(slug)`                                                   | `accommodationPage/lodgeStaysDetailPage.tsx`                                       |
| `/[locale]/merch`                       | server                                                    | none                                                                       | `clientPages/merchPage/merchPage.tsx`                                              |
| `/[locale]/merch/payment`               | server                                                    | none                                                                       | `<NuqsAdapter><MerchBookingPage/></NuqsAdapter>`                                   |
| `/[locale]/merch/payment/[slug]`        | server                                                    | `getDealDetail(slug)`                                                      | `<AppointmentPaymentPage context="merch"/>`                                        |
| `/[locale]/news`                        | server                                                    | none                                                                       | (no `newsPage` in clientPages list — see Open Questions)                           |
| `/[locale]/news/[slug]`                 | server                                                    | `getCmsPostDetail`                                                         | `clientPages/newsPage/newsDetailPage.tsx`                                          |
| `/[locale]/offers`                      | server                                                    | none                                                                       | `clientPages/offersPage/offersPage.tsx`                                            |
| `/[locale]/profile`                     | server, `await searchParams`                              | none; reads `?tab=`                                                        | `DefaultPageLayout` + `Tabs` + `PersonalTab`/`SecurityTab`/`BookingsTab`           |
| `/[locale]/profile/detail/[slug]`       | server                                                    | `getDealDetail(slug)`                                                      | `clientPages/profilePages/profileBookingDetailPage.tsx`                            |
| `/[locale]/spa-wellness`                | server                                                    | none                                                                       | `clientPages/spaWellnessPage/spaWellnessPage.tsx`                                  |
| `/[locale]/spa-wellness/booking`        | server                                                    | none                                                                       | `<BookingPage context="spa"/>` in NuqsAdapter                                      |
| `/[locale]/spa-wellness/payment/[slug]` | server                                                    | —                                                                          | (file exists; not read individually)                                               |
| `/[locale]/sustainability`              | server                                                    | none                                                                       | `clientPages/sustainabilityPage/sustainabilityPage.tsx`                            |
| `/[locale]/tours`                       | server                                                    | none                                                                       | `clientPages/toursPage/toursPage.tsx`                                              |
| `/[locale]/tours/[id]`                  | server                                                    | `getTmsTourDetail(id)`                                                     | `clientPages/toursPage/tourDetailPage.tsx`                                         |
| `/[locale]/tours/booking`               | server                                                    | none                                                                       | `<NuqsAdapter><TourBookingPage/></NuqsAdapter>`                                    |
| `/[locale]/tours/payment/[slug]`        | server                                                    | —                                                                          | (file exists)                                                                      |
| `/[locale]/(auth)/login`                | server                                                    | none                                                                       | `<Link href="/">` + logo + `containers/auth/login-form`                            |
| `/[locale]/(auth)/signup`               | server                                                    | none                                                                       | `containers/auth/register-form` (mode `customer`)                                  |
| `/[locale]/(auth)/company-signup`       | server                                                    | none                                                                       | same form, `mode="company"` + access-code gate → `POST /api/company-signup/unlock` |
| `/[locale]/(auth)/verify`               | server                                                    | none                                                                       | `containers/auth/verify` (OTP; reads `?email=&userId=` via `useSearchParams`)      |
| `/[locale]/(auth)/forgot-password`      | server                                                    | none                                                                       | `containers/auth/forgot-password-form`                                             |
| `/[locale]/(auth)/reset-password`       | server                                                    | none                                                                       | `containers/auth/reset-password-form` (reads `?token=`)                            |

**Layouts:** exactly two. `src/app/[locale]/layout.tsx` (root) and `src/app/[locale]/(auth)/layout.tsx` (split-screen auth shell).

**Route handlers** (`src/app/api/`, outside `[locale]`, so never locale-prefixed):

- `POST /api/company-signup/unlock` — compares a submitted code against a hardcoded `ACCESS_CODE = "tegri"`, then sets an `httpOnly`, `sameSite: lax`, 1-hour cookie `company_signup_unlocked=true`. Hardcoded secret in source; gate is trivially bypassable.
- `GET /api/google-reviews` — server-side proxy to Google Places API, `revalidate = 86400`, normalizes reviews to `{id, author, authorPhoto, rating, text, publishTime}`, degrades to `{reviews: []}` on any error. Keeps the API key off the client.

**Files in `app/` that are not routes:** `booking/booking-layout.tsx` and `booking/components/{BookingSteps,SelectedRoomsCard}.tsx` are colocated components (only `bookingConfirmPage.tsx` imports `booking-layout`). `ApolloClient.tsx` is a colocated client module.

### The root layout (`src/app/[locale]/layout.tsx`)

Server component. Responsibilities, in order:

1. `generateMetadata` — default site metadata from `getTranslations({locale, namespace:"Metadata"})` via `useMetadata`.
2. Validates the locale segment with `hasLocale(routing.locales, locale)` → `notFound()`.
3. Loads messages by dynamic import (redundant with `request.ts`).
4. Injects three analytics scripts in `<head>`: GA4 `G-D1V0GE4NDR` (loader + inline config), GTM `GTM-KQJSZZVZ` (inline snippet + `<noscript>` iframe), and `<link rel="icon">`.
5. Applies font CSS variables + `roboto.className` + `antialiased` to `<body>`.
6. **Provider nesting** (the part a generator must reproduce):
   ```tsx
   <NextIntlClientProvider locale={locale} messages={messages}>
     <NuqsAdapter>
       <Apollo>
         {" "}
         {/* app/[locale]/ApolloClient.tsx */}
         <CurrentConfigProvider>
           {" "}
           {/* containers/config — blocks render, MainLoader */}
           <PricingPlansProvider>
             {" "}
             {/* containers/pricing */}
             <ConditionalLayout>{children}</ConditionalLayout>
           </PricingPlansProvider>
         </CurrentConfigProvider>
       </Apollo>
     </NuqsAdapter>
     <Toaster richColors closeButton />
   </NextIntlClientProvider>;
   {
     /*<PrivacyTermsGate /> — commented out */
   }
   <ErxesWidget />;
   ```

`CurrentConfigProvider` is the app's **global loading/error gate**: it queries `cpPmsBranchDetail` with `cache-and-network`, renders `<MainLoader/>` while loading, and renders a localized "server down" screen with a bouncing `ServerOff` icon on error (`src/containers/config/currentConfig.tsx:16-40`). `PricingPlansProvider` resolves plan→product mappings and derives account discounts.

`ConditionalLayout` (`src/components/layout/ConditionalLayout.tsx`) is a **client component that swaps chrome by pathname string matching** — the single most idiosyncratic thing in the routing layer:

- `noLayoutRoutes` (`/login`, `/signup`, `/company-signup`, `/verify`, `/forgot-password`, `reset-password`, `/forms`) → no header, no footer. Note `reset-password` is missing its leading slash, and matching uses `pathname.endsWith(route) || pathname.includes(route)` — so `/forms` also strips chrome from any URL containing "forms".
- Otherwise a secondary (compact) header for `/contact-us`, `/dining`, `/spa-wellness`, `/offers`, `/booking`, `/news`, `/profile`, `/careers`, `/legal-notice`, `/activities`, `/merch`, `/tours` plus the detail subpaths `/accommodation/`, `/fund/projects/`, `/news/`, `/lodge-stays/`, `/booking/`, `/profile/detail/`; full `Header` for `/`, `/about-us`, `/accommodation`, `/lodge-stays`, `/fund`, `/sustainability`, `/tours`.
- `/booking` appears twice in `secondaryHeaderRoutes`.

The **navigation itself is CMS-driven**: `Header` calls `useCmsMenus(locale)` → `cpMenus`, then `getMenuTree()` (`src/lib/menu.ts`) splits into `topLevel` + `getChildren(parentId)`. Page copy likewise comes from `cpPages` / `cpPosts`, keyed by slug (`useCmsPageDetail("home", locale)`).

---

## 4. CONFIGURATION

### `next.config.ts` (34 lines, complete)

```ts
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  env: {
    /* 14 hardcoded values — see below */
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tegrigobinew.next.erxes.io",
        pathname: "/**",
      },
    ],
  },
};
export default createNextIntlPlugin()(nextConfig);
```

What it does and does not contain:

- **`env:` block with 14 inline values.** This is the _only_ env mechanism — `.env*` is gitignored (`.gitignore:33`) and **no `.env*` file exists in the checkout**. All configuration is therefore committed secrets. Note `NEXT_PUBLIC_*` entries are inlined into the client bundle by definition, including `NEXT_PUBLIC_ERXES_APP_TOKEN` (a JWT).
- **`images.remotePatterns`:** exactly one host, `tegrigobinew.next.erxes.io`, path `/**`. Everything else CMS-hosted goes through the custom `cloudflareLoader` in `src/lib/image-loader.tsx`.
- **Not present:** `redirects()`, `rewrites()`, `typescript.ignoreBuildErrors`, `eslint.ignoreDuringBuilds`, `experimental` (no typedRoutes, no serverActions config), `output`, `webpack`, `turbopack`, `poweredByHeader: false`, `generateBuildId`, headers/CSP. So: **no redirect logic anywhere in Next config** — routing is entirely middleware + filesystem.

The dev script pins port **3002**, and the README is untouched `create-next-app` boilerplate (mentions `app/page.tsx`, port 3000, Geist font, Vercel deploy) — it describes nothing about this project.

### Environment variable NAMES in use (no values)

| Name                                  | Where used                                                                                                                         | Purpose                                                                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SAAS_DOMAIN`             | `next.config.ts`; `src/sdk/hooks/useErxesForm.tsx`                                                                                 | Erxes SaaS host; loads the remote `widgets/build/formWidget.bundle.js`                                                                |
| `NEXT_PUBLIC_MAIN_API_DOMAIN`         | `next.config.ts`; `src/sdk/getClient.tsx:7`; `src/app/[locale]/ApolloClient.tsx:21`; `src/lib/utils.ts:57,63`; `src/lib/upload.ts` | GraphQL gateway base URL; also used to resolve `/read-file?key=` CMS attachments                                                      |
| `NEXT_PUBLIC_MAIN_SUBS_DOMAIN`        | `src/app/[locale]/ApolloClient.tsx:118`                                                                                            | graphql-ws subscription endpoint. **Absent from the `env` block** → empty string at runtime                                           |
| `NEXT_PUBLIC_ERXES_APP_TOKEN`                | `next.config.ts`; `src/sdk/getClient.tsx:16`; `ApolloClient.tsx:57`                                                                | `x-app-token` header identifying the client portal                                                                                    |
| `NEXT_PUBLIC_CP_ID`                   | `next.config.ts`; `src/sdk/mutations/auth.tsx:17`; `src/sdk/queries/cms.tsx` (×3); `src/sdk/queries/tms.tsx`                       | Client-portal id scoping CMS queries                                                                                                  |
| `NEXT_PUBLIC_PMS_TOKEN`               | `next.config.ts`; `src/sdk/queries/rooms.tsx` (×2); `src/containers/config/currentConfig.tsx:18`                                   | PMS branch token → room categories, department, site config                                                                           |
| `NEXT_PUBLIC_BRANCH_ID`               | `next.config.ts`; `src/sdk/hooks/useRoomPricing.tsx`                                                                               | Branch for room pricing                                                                                                               |
| `NEXT_PUBLIC_TMS_BRANCH_ID`           | `next.config.ts`; `src/sdk/queries/tms.tsx` (×2, with hardcoded fallback)                                                          | Tour-management branch for tours/lodge stays                                                                                          |
| `NEXT_PUBLIC_PMS_PIPELINE_ID`                         | `next.config.ts` only — **never read in `src/`**                                                                                   | Unused                                                                                                                                |
| `NEXT_PUBLIC_REQUEST_STAGE_ID`                    | `next.config.ts` only — **never read in `src/`**                                                                                   | Unused                                                                                                                                |
| `NEXT_PUBLIC_PENDING_STAGE_ID`                    | `next.config.ts`; `src/sdk/hooks/useAddDeal.tsx:…`                                                                                 | Pipeline stage for a newly created deal                                                                                               |
| `NEXT_PUBLIC_PAID_STAGE_ID`                       | `next.config.ts` only — **never read in `src/`**                                                                                   | Unused                                                                                                                                |
| `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID`            | `next.config.ts`; `src/sdk/hooks/useAddDeal.tsx`                                                                                   | Stage for pay-at-property deals                                                                                                       |
| `GOOGLE_MAPS_API_KEY`                 | `next.config.ts`; `src/app/api/google-reviews/route.ts:31`                                                                         | Server-side Google Places call                                                                                                        |
| `GOOGLE_PLACE_ID`                     | `next.config.ts`; `src/app/api/google-reviews/route.ts:4`                                                                          | Resort's Place ID                                                                                                                     |
| `NEXT_PUBLIC_ERXES_API_URL`           | **only** in `src/lib/utils.ts:151`                                                                                                 | OAuth refresh endpoint for the _other_, unused auth path                                                                              |
| `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` | `src/components/booking/PayAtPropertyForm.tsx`                                                                                     | Erxes form id for pay-at-property (has inline fallback)                                                                               |
| `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID`   | `src/components/clientPages/toursPage/CreateOwnTripForm.tsx`                                                                       | Erxes form id for "create your own trip" (inline fallback)                                                                            |
| `CAR_CATEGORY_ID`                     | `src/components/shared/forms/TimeForm.tsx` (×3)                                                                                    | Truthiness switch that changes time-slot bounds to 09:00–17:00 and swaps the time-slot UI — a **behavioral** flag, not a config value |
| `PC_CATEGORY_ID`                      | `src/components/shared/forms/TimeForm.tsx`                                                                                         | Truthiness switch for PC-category time-slot variant                                                                                   |
| `PARENT_CATEGORY_ID`                  | `src/components/appointment/hooks/useCategories.tsx`                                                                               | Parent category for appointment products                                                                                              |
| `NEXT_PUBLIC_APPROVED_STAGE_ID`                   | `src/components/appointment/hooks/useDeals.tsx`                                                                                    | Approved stage for appointment deals                                                                                                  |
| `NODE_ENV`                            | `src/app/api/company-signup/unlock/route.ts`; `src/lib/payment-status.ts` (×2)                                                     | Cookie `secure` flag, dev-only payment logging + `forceStatus` escape hatch                                                           |

Six hardcoded IDs live **outside** env entirely, which is the bigger maintainability issue: pipeline ids in `src/components/appointment/bookingContext.ts:4-45` (tours, activities, dining, spa, merch), `PMS_BOARD_NAME`/`PMS_PIPELINE_NAME` as _string lookups_ in `src/sdk/queries/sales.tsx:6-7`, `REVIEW_PIPELINE_ID` duplicated in `src/sdk/queries/reviews.tsx:33` **and** `src/components/profile/components/ReviewSection.tsx:17`, `ROOM_PRODUCT_FIELD_ID = "field_1785745542450"` in `src/lib/cms.ts`, the `erxes-pos-token` literal in `ApolloClient.tsx`, both GA/GTM ids in `layout.tsx`, and `ACCESS_CODE = "tegri"` in the unlock route.

---

## 5. EVIDENCE — key patterns

### Root layout provider stack — `src/app/[locale]/layout.tsx:53-120` (trimmed)

```tsx
export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return (
    <html lang={locale}>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-D1V0GE4NDR"
          strategy="afterInteractive"
        />
        {/* + inline GA4 config, inline GTM snippet, favicon link */}
      </head>
      <body
        className={`${roboto.variable} ${dmSans.variable} ${roboto.className} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NuqsAdapter>
            <Apollo>
              <CurrentConfigProvider>
                <PricingPlansProvider>
                  <ConditionalLayout>{children}</ConditionalLayout>
                </PricingPlansProvider>
              </CurrentConfigProvider>
            </Apollo>
          </NuqsAdapter>
          <Toaster richColors closeButton />
        </NextIntlClientProvider>
        <ErxesWidget />
      </body>
    </html>
  );
}
```

### i18n setup — `src/i18n/routing.ts`, `request.ts`, `navigation.ts` (all three, complete)

```ts
// routing.ts
export const routing = defineRouting({
  locales: ["en", "mn"],
  defaultLocale: "en",
});

// request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

// navigation.ts
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### Middleware — `src/middleware.ts` (complete, 7 lines)

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
```

### Data-fetching: the two-layer hook pattern — `src/sdk/queries/rooms.tsx:17-63`

```ts
export const useRoomCategoryIds = () => {
  const { data, loading } = useQuery(configQueries.PmsBranchDetail, {
    variables: { id: process.env.NEXT_PUBLIC_PMS_TOKEN },
    fetchPolicy: "cache-first",
  });
  return {
    roomCategoryIds: data?.cpPmsBranchDetail?.roomCategories ?? [],
    loading,
  };
};

const useRooms = (options?: OperationVariables) => {
  const { pipelineId } = usePipelineId(); // chained hook
  const { roomCategoryIds, loading: loadingCategoryIds } = useRoomCategoryIds();
  const { data, loading } = useQuery<{ cpProducts: IProduct[] }>(
    queries.rooms,
    {
      variables: { pipelineId, categoryIds: roomCategoryIds, perPage: 500 },
      skip: !pipelineId || roomCategoryIds.length === 0, // skip-guard
      ...options,
    },
  );
  const rooms: IProduct[] = useMemo(() => data?.cpProducts || [], [data]);
  return { rooms, loading: loading || loadingCategoryIds }; // aggregated loading
};
```

The dominant idioms: **`skip:` guards for dependent queries**, chained hooks (`usePipelineId` → `useSalesStages` → `useCheckRooms`), **`loading || loadingX || loadingY` aggregation**, and `fetchPolicy` chosen explicitly per hook (`cache-first` for reference data, `no-cache` for volatile availability/pricing).

### Data-fetching: the `use client` page body — `src/components/clientPages/homePage/homePage.tsx` (complete)

```tsx
"use client";
import React, { useEffect } from "react";
import VideoPageLayout from "../VideoPageLayout";
import { useParams } from "next/navigation";
import { useCmsPageDetail, useCmsPosts } from "@/sdk/queries/cms";

const ClientHomePage = () => {
  const params = useParams();
  const currentLocale = params.locale as string; // locale via useParams, not a prop

  const { page, refetch, loading } = useCmsPageDetail("home", currentLocale);
  const { posts } = useCmsPosts();

  useEffect(() => {
    refetch();
  }, [currentLocale]); // locale-change refetch idiom

  return (
    <VideoPageLayout
      title={page?.name}
      description={page?.description}
      imageSrc={page?.thumbnail?.url}
      pageImages={page?.pageImages}
      loading={loading}
    >
      <div className="space-y-10 lg:space-y-15">
        <WhyChooseUs />
        <AccommodationSection />
        <JourneySection />
        <GallerySection />
        <NewsSection />
        <MemoriesSection />
        <BannerSection isShow={true} isContainer={true} />
      </div>
    </VideoPageLayout>
  );
};
export default ClientHomePage;
```

The `useEffect(refetch, [locale])` pattern is repeated in `Header.tsx`, `SecondaryHeader.tsx` — an Apollo cache-invalidation workaround for locale switches.

### Form + validation + navigation idiom — `src/containers/auth/login-form.tsx:24-58`

```tsx
const t = useTranslations("Login");
const formSchema = z.object({
  // schema inline, so t() supplies messages
  login: z
    .string()
    .min(1, { message: t("NameRequired") })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+|[0-9]{6,}$/, t("WrongPhoneOrMail"))
    .transform((val) => val.trim()),
  password: z.string().min(1, { message: t("PasswordRequired") }),
  rememberMe: z.boolean().optional(),
});
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { login: "", password: "" },
});
const { login, loading } = useLogin(); // SDK mutation hook owns the request
const isEmail = form.watch("login").includes("@");
function onSubmit(values: z.infer<typeof formSchema>) {
  login({
    variables: {
      password: values.password,
      ...(isEmail ? { email: values.login } : { phone: values.login }),
    },
  });
}
```

`export default function LoginForm()` — unnamed-default style in `containers/auth`.

### Booking-context polymorphism — `src/components/appointment/bookingContext.ts` (excerpt)

```ts
export type BookingContext = "activities" | "dining" | "spa" | "merch" | "tours";
export const CONTEXT_CONFIG: Record<BookingContext, BookingContextConfig> = {
  activities: { pipelineId: "zHNxwsQph-ykx7jthX69P", chargedFor: "activities",
                paymentRoute: (id) => `/activities/payment/${id}`, returnPath: "/activities" },
  dining:     { pipelineId: "uGnWVWY_KG_zHjRtrfuhv", ... paymentRoute: (id) => `/dining/payment/${id}` },
  spa:        { pipelineId: "5WWzj8fI8OpflTk9CLhzf", ... paymentRoute: (id) => `/spa-wellness/payment/${id}` },
  merch:      { pipelineId: "-2vZ4sQPLYMTcbfETMU3r", ... paymentRoute: (id) => `/merch/payment/${id}` },
  tours:      { pipelineId: TOURS_PIPELINE_ID,     ... paymentRoute: (id) => `/tours/payment/${id}` },
};
```

This is the project's answer to "how do 5 different bookable things share one booking + payment UI": a single `context` prop threaded from `app/[locale]/<x>/booking/page.tsx` → `BookingPage context=...` → `AppointmentPaymentPage context=...`, with pipeline id, charge label, payment URL and post-booking return path all resolved from one map. **Five routes × two (booking, payment) share two components because of this.** A generator should reproduce this pattern for any multi-product-booking site.

---

## 6. OPEN QUESTIONS

Things unclear, inconsistent, or dead — a generator must decide on each.

**Lockfiles & tooling**

1. Three lockfiles. `pnpm-lock.yaml` is newest (2026-08-17) and `pnpm-workspace.yaml` exists, so pnpm is the real PM — but `package.json` has no `packageManager` field and `package-lock.json` + `yarn.lock` were both touched 2026-06-03. Pick pnpm, delete the other two, add `"packageManager": "pnpm@<ver>"`.
2. Dual ESLint configs: `eslint.config.mjs` (flat, ESLint 9) and `.eslintrc.json` (legacy). ESLint 9 ignores `.eslintrc.json`, so it is dead. `next lint` is deprecated in Next 15.4. The identical rule-disable block in both is duplication.
3. `components.json` aliases `hooks → @/hooks` but **`src/hooks` does not exist**; all hooks live in `src/lib/hooks/`. Adding a shadcn component that uses `use-mobile` would create a second hook location or fail to resolve.
4. No `prettier` config despite `prettier@^3` being a devDep; `src/sdk/queries/rooms.tsx` uses semicolons while neighbouring files omit them — no enforced formatter.
5. No test framework at all. `package.json` scripts are `dev`/`build`/`start`/`lint` only. No `typecheck` script either.
6. README is unmodified `create-next-app` boilerplate (wrong port, wrong font, mentions `app/page.tsx`). Misleading.

**Environment & security** 7. All 14 env values are hardcoded in `next.config.ts` and committed. `NEXT_PUBLIC_ERXES_APP_TOKEN` is a JWT and `NEXT_PUBLIC_PMS_TOKEN` is a secret token — both are inlined into the client bundle by Next. `GOOGLE_MAPS_API_KEY` at least is server-only. 8. `ACCESS_CODE = "tegri"` in `src/app/api/company-signup/unlock/route.ts` gates company signup. Hardcoded, committed, identical to a value in `next.config.ts`'s commit history. Trivial bypass; the httpOnly cookie it sets is never actually verified server-side. 9. `NEXT_PUBLIC_MAIN_SUBS_DOMAIN` is read in `ApolloClient.tsx` but never defined → `createClient({url: ""})`. Subscriptions are silently non-functional. 10. `NEXT_PUBLIC_PMS_PIPELINE_ID`, `NEXT_PUBLIC_REQUEST_STAGE_ID`, `NEXT_PUBLIC_PAID_STAGE_ID` are defined in `next.config.ts` but referenced nowhere in `src/`. 11. Hardcoded IDs in source where env would be correct: `bookingContext.ts` pipeline ids, `REVIEW_PIPELINE_ID` (duplicated in2 files), `ROOM_PRODUCT_FIELD_ID = "field_1785745542450"` (`src/lib/cms.ts`), `erxes-pos-token` literal, GA4/GTM ids, `local.omz.mn` in `src/lib/utils.ts:readFileSchedule`. Several also carry inline fallback _and_ an env read with `||` fallbacks (`NEXT_PUBLIC_TMS_BRANCH_ID`, `GOOGLE_PLACE_ID`, the two form ids) — unclear which is authoritative.

**Two competing auth/token implementations** 12. `src/app/[locale]/ApolloClient.tsx` + `src/sdk/mutations/auth.tsx` use **`sessionStorage`** (`token`/`refreshToken`/`refetchToken`, header `client-auth-token`, automatic refresh). `src/lib/utils.ts` exports `getAccessToken`/`getRefreshToken`/`saveTokens`/`isTokenExpired`/`refreshTokens` using **`localStorage`** + `NEXT_PUBLIC_ERXES_API_URL/oauth/refresh`. These are separate systems; the localStorage one appears vestigial. A generator must pick one (sessionStorage + refresh-on-`token expired` is the one actually wired up). 13. Auth is **client-side only**: `containers/auth/private-route.tsx` redirects on a null atom but is **imported nowhere**. `redirector.tsx` likewise appears unused. Nothing enforces auth server-side — `profile/*` renders freely. `ConditionalLayout` hides chrome via string matching rather than route groups. 14. `currentUserAtom` starts `null` with `loadingUserAtom` defaulting `true`, so the initial render is "loading" — but since `PrivateRoute` is never mounted, the guard does nothing.

**Dead code & unused things** 15. Unused npm dependencies: `@apollo/experimental-nextjs-app-support`, `lenis`, `negotiator`, `@types/negotiator`, `@stripe/react-stripe-js`, `react-player`, `button`, `add`, `shadcn-ui`, `shadcn`. 16. `src/store/index.tsx` — the whole `Providers` component is unimported; no `JotaiProvider` is mounted. 17. `createApolloClient()` in `ApolloClient.tsx` — unimported. 18. Unused components: `src/components/TrendActivitiesSection.tsx` (zero references), `src/components/MemoriesSection.tsx` is referenced only by `homePage` (which has `<SubscriptionSection/>` commented out); `src/lib/hooks/useSelectedRooms.tsx`, `src/lib/upload.ts`, `src/lib/showFormErrors.ts`, `src/lib/booking-pricing.ts` — verify before assuming reachability. 19. `src/sdk/graphql/pos/**` — no consumer in `src/sdk/queries` or `mutations`. `src/sdk/queries/kb.tsx` exists but `graphql/kb` looks orphaned. 20. `src/components/common/privacy-terms-gate.tsx` — the only consumer (`<PrivacyTermsGate/>`) is commented out in the root layout. `privacy-terms-modal.tsx` and `terms-modal.tsx` are used by `register-form.tsx`. 21. **No `newsPage.tsx`** in `src/components/clientPages/newsPage/` — yet `src/app/[locale]/news/page.tsx` exists. Needs verification of what it renders. 22. `src/app/[locale]/booking/payment/[slug]/page.tsx` has its **entire `generateMetadata` commented out** — that page ships with no title/description. 23. Commented-out code in `src/sdk/queries/cms.tsx` (`useCmsTags`, `useCmsCategory`), `layout.tsx`, `VideoPageLayout.tsx`, several `src/app/api/**` — plus `PaymentPage` vs `AppointmentPaymentPage` duplication between `clientPages/bookingPages/bookingPaymentPage.tsx` and `appointment/payment/paymentPage.tsx`. 24. **No `loading.tsx`, `error.tsx`, `not-found.tsx`, or `template.tsx`** at any route level. `notFound()` is called in the root layout for a bad locale, but there is no custom not-found boundary — users get the framework default. Error handling leans entirely on Apollo `errorLink` → Sonner toast, plus the `CurrentConfigProvider` gate. 25. `booking-layout.tsx` sits in `app/` but is a plain component (not a `layout.tsx`), imported only by `bookingConfirmPage.tsx`. Confusing placement. 26. `bookingContext.ts:48` exports a `pipelineId` field, and `useTourDeal.tsx` also exports `TOURS_PIPELINE_ID` from `bookingContext` — the tour pipeline id is defined once and imported twice; fine, but worth noting `CONTEXT_CONFIG.spa.pipelineId` (`5WWzj8fI8OpflTk9CLhzf`) is **identical to `NEXT_PUBLIC_PMS_PIPELINE_ID`** in `next.config.ts` — is the "PMS" pipeline actually the spa pipeline?

**Architectural quirks a generator must decide about** 27. **No RSC data fetching.** Every page body is a client component that fetches via Apollo `useQuery`; the server only does `generateMetadata` fetches. So the page HTML ships empty and the client waterfall is long. Whether to reproduce this or use RSC fetching is the biggest decision. 28. **Duplicate fetches:** `forms/[slug]/page.tsx` calls `getFormByCode(slug)` twice (metadata + body) with no caching/dedup. `fund/projects/[slug]` calls `getCmsPostDetail` with `.catch()` fallback. 29. **Chrome selection by pathname string matching** in `ConditionalLayout` instead of route groups. Fragile: `/booking` listed twice; `reset-password` missing its slash; `includes(route)` means any URL containing `/forms` loses header _and_ footer. The `(auth)` route group already exists — the two mechanisms overlap. 30. **`NuqsAdapter` mounted twice** — root layout and each `*/booking/page.tsx`. Harmless but redundant. 31. **Messages loaded twice** — `request.ts` and a manual `await import()` in `layout.tsx`. 32. `useMetadata` is `async` and named `use*` despite being a plain helper called from `generateMetadata`. Also `tours/[id]` builds its description by regex-stripping HTML from `tourData.content`, as does `fund/projects/[slug]`. 33. `getRoomProductId` reads a hardcoded BlockNote field id (`field_1785745542450`) out of `customFieldsData`; `getProductId`/`getPickerProductIds` use a **shape-based** heuristic (nanoid pattern + a blocklist of prose keys). `getRoomProductId`'s own comment says it is "the single source of truth" while `getProductId` still exists and is used for merch/rooms. Genuinely unclear which CMS field convention to standardize on — `src/lib/cms.ts` documents this well and is worth reading in full before generating. 34. `src/app/[locale]/merch/payment/page.tsx` (no slug) and `merch/payment/[slug]/page.tsx` (deal id in a `[slug]` segment) coexist — inconsistent naming vs `tours/[id]`. The `[slug]` segments for payment pages all hold deal ids, not slugs. 35. `useTmsTours` hardcodes `language: "en"` (`src/sdk/queries/tms.tsx:29`) so the Mongolian locale shows English tours. Same pattern in `useCmsPages` (`language || "mn"`). Locale propagation is inconsistent across SDK hooks. 36. `components.json` says `"rsc": true` but almost nothing is a server component — the config is aspirational.
