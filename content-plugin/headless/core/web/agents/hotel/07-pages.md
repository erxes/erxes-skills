# TASK 07 — Pages, Routing & Metadata

> Scope: the App Router page tree under `src/app`, page composition, layouts/providers,
> metadata/SEO, rendering strategy, and page-level reproduction rules.
>
> This report does **not** re-document components, operations, or hooks already covered in
> `03a-layouts.md` / `03b-features.md` and `04-data-layer.md` — those are referenced as
> `03a/03b §x.y` / `04 §x`. Booking/payment *flows* are covered in `06-booking-payment.md`.
>
> All env values are **REDACTED**. Anything not present in the source is `NOT FOUND IN CODE`.

## TABLE OF CONTENTS

1. [Route Tree](#1-route-tree)
2. [Route Table](#2-route-table)
3. [Per-Page Composition](#3-per-page-composition)
4. [Layouts & Providers](#4-layouts--providers)
5. [Metadata & SEO](#5-metadata--seo)
6. [Special Logic](#6-special-logic)
7. [Page Templates](#7-page-templates)
8. [Sitemap Tree](#8-sitemap-tree)
9. [REPRODUCE vs AVOID Rules](#9-reproduce-vs-avoid-rules)
10. [Brand-Specific Hardcoding Audit](#10-brand-specific-hardcoding-audit)
11. [Open Questions / Uncertainties](#11-open-questions--uncertainties)

---

## 1. ROUTE TREE

Full `page.tsx` tree under `src/app` — **45 pages**, **2 layouts**, **0**
`loading.tsx` / `error.tsx` / `not-found.tsx` / `template.tsx` / `default.tsx` anywhere.

```
src/app/
├── api/                                      Route Handlers (no [locale] prefix)
│   ├── company-signup/unlock/route.ts        POST — access-code gate for company signup
│   └── google-reviews/route.ts               GET  — Google Places reviews proxy (revalidate 86400)
│
└── [locale]/                                 <html> is rendered HERE (no root layout.tsx)
    ├── layout.tsx                            ROOT + locale layout: providers, GA/GTM, header/footer (§4.2)
    ├── globals.css
    ├── ApolloClient.tsx                      "use client" Apollo provider module (not a route)
    │
    ├── (auth)/                               ROUTE GROUP (1 of 1) — full-width split auth screens
    │   ├── layout.tsx                        two-pane: form | Images
    │   ├── login/page.tsx                    sign-in (logo + LoginForm)
    │   ├── signup/page.tsx                   register (RegisterForm)
    │   ├── company-signup/page.tsx           corporate signup gated by cookie “company_signup_unlocked”
    │   ├── verify/page.tsx                   code verification (Verify container)
    │   ├── forgot-password/page.tsx          reset request
    │   └── reset-password/page.tsx           set new password (from token)
    │
    ├── page.tsx                              Home (ClientHomePage)
    ├── about-us/page.tsx                     About us (VideoPageLayout + CMS page “aboutus”)
    ├── sustainability/page.tsx               Sustainability (CMS page “/sustainability-home”)
    ├── offers/page.tsx                       Offers — reuses JourneySection
    ├── careers/page.tsx                      Careers — erxes knowledge-base articles + forms link
    ├── legal-notice/page.tsx                 Legal notice (i18n messages)
    ├── contact-us/page.tsx                   Contact — info, form, map, FAQ
    ├── news/page.tsx                         News list (NewsSection grid)
    ├── news/[slug]/page.tsx                  News article (CMS post)
    ├── forms/[slug]/page.tsx                 Generic erxes form renderer (async page + server fetch)
    │
    ├── accommodation/page.tsx                Stay list: rooms + lodge stays (2 CMS sections)
    ├── accommodation/[slug]/page.tsx         Room detail (CMS post + room product pricing)
    ├── lodge-stays/page.tsx                  Lodge stays list (mirror of accommodation)
    ├── lodge-stays/[slug]/page.tsx           Lodge stay detail (BMS tour detail)
    │
    ├── activities/page.tsx                   Experiences list (CMS “activitiespage”)
    ├── activities/[slug]/page.tsx            Experience detail (CMS post)
    ├── activities/booking/page.tsx           Track B booking form (appointment pipeline)
    ├── activities/payment/[slug]/page.tsx    Track B payment
    │
    ├── dining/page.tsx                       Dining (tabbed: dining / experiences / à-la-carte)
    ├── dining/booking/page.tsx               Track B booking form
    ├── dining/payment/[slug]/page.tsx        Track B payment
    │
    ├── spa-wellness/page.tsx                 Spa & wellness (CMS posts “spa-wellness”)
    ├── spa-wellness/booking/page.tsx         Track B booking form
    ├── spa-wellness/payment/[slug]/page.tsx  Track B payment
    │
    ├── merch/page.tsx                        Merch shop (CMS + POS products)
    ├── merch/payment/page.tsx                Merch checkout (sku + qty, uses its own NuqsAdapter)
    ├── merch/payment/[slug]/page.tsx         Merch payment (Track B)
    │
    ├── tours/page.tsx                        Tours (tabs: packages | custom)
    ├── tours/[id]/page.tsx                   Tour detail (BMS tour detail)   ← dynamic segment NAMED id, not slug
    ├── tours/booking/page.tsx                Tour booking (BMS order + deal)
    ├── tours/payment/[slug]/page.tsx         Tour payment (separate tour flow, 06 §6.6)
    │
    ├── fund/page.tsx                         Foundation (hero, impact, projects, FAQ)
    ├── fund/projects/[slug]/page.tsx         Fund project detail (CMS post + static fund data)
    │
    ├── booking/page.tsx                      Track A rooms & availability
    ├── booking/details/page.tsx              Track A guest details + deal creation
    ├── booking/payment/[slug]/page.tsx       Track A payment (generateMetadata COMMENTED OUT)
    ├── booking/confirm/page.tsx              Booking confirmation
    ├── booking/booking-layout.tsx            NOT a route layout — a client component (step guard)
    ├── booking/components/BookingSteps.tsx   stepper (04)
    ├── booking/components/SelectedRoomsCard.tsx  room/guest split card (06 §1.1)
    │
    └── profile/page.tsx                      Profile (tabs: personal | security | bookings) — server component
        └── profile/detail/[slug]/page.tsx    Booking detail in profile (deal-driven)
```

Landmarks:

- **No root `src/app/layout.tsx`** — `src/app/[locale]/layout.tsx` is the layout for everything
  (there is no non-locale wrapper, so `/hello` without a locale prefix 404s except via middleware).
- **Route groups:** only `(auth)`. No group owns the home/booking/fund pages.
- **`BookingSteps` note:** the top-level booking stepper is actually a *client* file
  `src/app/[locale]/booking/components/BookingSteps.tsx` living *inside* the app tree (imported by
  `booking-layout.tsx`); it is not a Next.js `layout`.
- **Dynamic segments:** `[slug]` everywhere except `tours/[id]` (inconsistent naming — see §9 R-04).
- **Route handlers:** only the two `route.ts` above; both are brand/admin utilities, not part of
  the marketing site.
- **`merch/payment` has no `[slug]`, `activities|dining|spa-wellness/booking` have no `[slug]`**
  — product id arrives via query string (`?productId=…`), so these step pages are not
  deep-linkable to a specific product.

## 2. ROUTE TABLE (45 pages)

Legend: `type` = parameter type; CORE = needed in any re-implementation; OPTIONAL = brand/product
feature, gated by the proposed config keys consistent with `03a §5`.

| # | URL pattern (locale-prefixed) | `page.tsx` file | Server / Client | params / searchParams | Purpose | Tier (config key) |
|---|---|---|---|---|---|---|
| 1 | `/<locale>` | `[locale]/page.tsx` (5 L) | S→C `ClientHomePage` | — | Home: hero carousel + 6 sections | CORE |
| 2 | `/about-us` | `about-us/page.tsx` | S→C `ClientAboutUsPage` | — | About us (CMS “aboutus”) | CORE |
| 3 | `/sustainability` | `sustainability/page.tsx` | S→C `ClientSustainabilityPage` | — | Sustainability (CMS “/sustainability-home”) | OPTIONAL (`features.sustainability`) |
| 4 | `/offers` | `offers/page.tsx` | S→C `ClientOffersPage` | — | Offers = `JourneySection` reuse | OPTIONAL (`features.offers`) |
| 5 | `/careers` | `careers/page.tsx` | S→C `ClientCareers` | — | Careers FAQ from erxes KB + application forms | OPTIONAL (`features.careers`) |
| 6 | `/legal-notice` | `legal-notice/page.tsx` | S→C `ClientNoticePage` | — | Legal text from i18n messages | CORE |
| 7 | `/contact-us` | `contact-us/page.tsx` | S→C `contactUsPage` | — | Contacts, form, map, FAQ (id `#faq`) | CORE |
| 8 | `/news` | `news/page.tsx` | S→C + static `<NewsSection>` | — | News grid (CMS “news”) | OPTIONAL (`features.news`) |
| 9 | `/news/[slug]` | `news/[slug]/page.tsx` | S(meta)→C | `params.slug` = CMS post id | Article detail | OPTIONAL (`features.news`) |
| 10 | `/forms/[slug]` | `forms/[slug]/page.tsx` | **Server async page** (one of two) | `params.slug` = **form code** | Render any erxes form by code | OPTIONAL (`features.customForms`) |
| 11 | `/accommodation` | `accommodation/page.tsx` | S→C `ClientAccommodationPage` | — | Stay list (rooms + lodge stays) | CORE |
| 12 | `/accommodation/[slug]` | `accommodation/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = CMS post id | Room detail + live room price | CORE |
| 13 | `/lodge-stays` | `lodge-stays/page.tsx` | S→C `ClientLodgeStaysPage` | — | Lodge stays list (BMS tours) | OPTIONAL (`features.lodgeStays`) |
| 14 | `/lodge-stays/[slug]` | `lodge-stays/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = BMS tour id | Lodge stay detail | OPTIONAL (`features.lodgeStays`) |
| 15 | `/activities` | `activities/page.tsx` | S→C `ClientActivitiesPage` | — | Experiences list | OPTIONAL (`features.activities`) |
| 16 | `/activities/[slug]` | `activities/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = CMS post id | Experience detail | OPTIONAL (`features.activities`) |
| 17 | `/activities/booking` | `activities/booking/page.tsx` | S→C `BookingPage` (+ own `NuqsAdapter`) | `productId`, `memberId`, `from`, `to` (nuqs) | Track B booking | OPTIONAL (`features.activities`) |
| 18 | `/activities/payment/[slug]` | `activities/payment/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = dealId | Track B payment | OPTIONAL (`features.activities`) |
| 19 | `/dining` | `dining/page.tsx` | S→C `ClientDiningPage` | `tab`, `categoryIds` (nuqs) | Dining tabs | OPTIONAL (`features.dining`) |
| 20 | `/dining/booking` | `dining/booking/page.tsx` | S→C `BookingPage` | `productId`, `memberId`, `from`, `to` | Track B booking | OPTIONAL (`features.dining`) |
| 21 | `/dining/payment/[slug]` | `dining/payment/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = dealId | Track B payment | OPTIONAL (`features.dining`) |
| 22 | `/spa-wellness` | `spa-wellness/page.tsx` | S→C `ClientSpaWellnessPage` | — | Spa & wellness | OPTIONAL (`features.spaWellness`) |
| 23 | `/spa-wellness/booking` | `spa-wellness/booking/page.tsx` | S→C `BookingPage` | `productId`, `memberId`, `from`, `to` | Track B booking | OPTIONAL (`features.spaWellness`) |
| 24 | `/spa-wellness/payment/[slug]` | `spa-wellness/payment/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = dealId | Track B payment | OPTIONAL (`features.spaWellness`) |
| 25 | `/merch` | `merch/page.tsx` | S→C `ClientMerchPage` | — | Merch storefront | OPTIONAL (`features.merch`) |
| 26 | `/merch/payment` | `merch/payment/page.tsx` | S→C `MerchBookingPage` (+ own `NuqsAdapter`) | `productId` (`useQueryState`) | Merch checkout (qty → payment link) | OPTIONAL (`features.merch`) |
| 27 | `/merch/payment/[slug]` | `merch/payment/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = dealId | Merch payment (Track B) | OPTIONAL (`features.merch`) |
| 28 | `/tours` | `tours/page.tsx` | S→C `ClientToursPage` | — (tabs via local state) | Tours packages / custom | OPTIONAL (`features.tours`) |
| 29 | `/tours/[id]` | `tours/[id]/page.tsx` | S(meta, fetch)→C | `params.id` = BMS tour id | Tour detail | OPTIONAL (`features.tours`) |
| 30 | `/tours/booking` | `tours/booking/page.tsx` | S→C `TourBookingPage` | `tourId`, `pricingOptionId`, `date`, `people` (nuqs) | Tour booking | OPTIONAL (`features.tours`) |
| 31 | `/tours/payment/[slug]` | `tours/payment/[slug]/page.tsx` | S→C `TourPaymentPage` | `orderId`(slug) + full query-string payload | Tour payment (separate flow) | OPTIONAL (`features.tours`) |
| 32 | `/fund` | `fund/page.tsx` | S→C `ClientFundPage` | `#impact`/`#projects`/`#faq` anchors | Foundation | OPTIONAL (`features.fund`) |
| 33 | `/fund/projects/[slug]` | `fund/projects/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = CMS post id | Fund project detail | OPTIONAL (`features.fund`) |
| 34 | `/booking` | `booking/page.tsx` | S→C `ClientBookingRoomsPage` | — (atoms, 06 §3) | Track A room search | CORE |
| 35 | `/booking/details` | `booking/details/page.tsx` | S→C `ClientBookingDetailsPage` | — | Guest details + deal create | CORE |
| 36 | `/booking/payment/[slug]` | `booking/payment/[slug]/page.tsx` | S→C (meta **commented out**) | `params.slug` = dealId | Track A payment | CORE |
| 37 | `/booking/confirm` | `booking/confirm/page.tsx` | S→C `<Suspense>` wrapper | `?type=payAtProperty` | Confirmation | CORE (`?type=payAtProperty` gate: `features.pay_at_property`) |
| 38 | `/profile` | `profile/page.tsx` | **Server async page** (one of two) | `?tab=personal\|security\|bookings` | Account tabs | CORE |
| 39 | `/profile/detail/[slug]` | `profile/detail/[slug]/page.tsx` | S(meta, fetch)→C | `params.slug` = dealId | Booking detail in profile | CORE |
| 40 | `/login` | `(auth)/login/page.tsx` | S→C `LoginForm` | — | Sign in | CORE |
| 41 | `/signup` | `(auth)/signup/page.tsx` | S→C `RegisterForm` | — | Register | CORE |
| 42 | `/company-signup` | `(auth)/company-signup/page.tsx` | S→C `CompanySignupGate` (reads cookie server-side) | — | Company signup behind access code | OPTIONAL (`features.companyAccounts`) |
| 43 | `/verify` | `(auth)/verify/page.tsx` | S→C `Verify` | — | Verify phone/email code | CORE |
| 44 | `/forgot-password` | `(auth)/forgot-password/page.tsx` | S→C `ForgotPasswordForm` | — | Reset request | CORE |
| 45 | `/reset-password` | `(auth)/reset-password/page.tsx` | S→C `ResetPasswordForm` | — | Set new password | CORE |

### 2.1 Not-route files inside the app tree (collectors' corner)

- `src/app/[locale]/booking/booking-layout.tsx` — a **client component** (step guard, 06 §1.1), imported
  as `<BookingLayout>` by the four booking pages. It is *not* registered as a Next.js `layout`.
- `src/app/[locale]/booking/components/{BookingSteps,SelectedRoomsCard}.tsx` — client components.
- `src/app/[locale]/ApolloClient.tsx` — the `httpLink`/`authLink`/`wsLink`/`errorLink` setup (04 §2.4).
- `src/app/[locale]/globals.css`, `src/app/[locale]/layout.tsx` — see §4.

### 2.2 Auth pages nuance

All six auth pages are in route group `(auth)` but **none of them is auth-protected itself**;
they are public. `ConditionalLayout` hides header/footer on them (§4.4). The company-signup gate
is enforced by a **cookie read at render time** (`company_signup_unlocked`), written by
`api/company-signup/unlock` after entering access code — this is the only "hard" gate in the app.

### 2.3 Booking/payment deep-links and params (summary, full detail in 06)

| Route | Params that actually matter | Notes |
|---|---|---|
| `/booking` | atoms only (`reserveAtom`, `selectedRoomsAtom`) | reload → empty state (06 §3.2, E-02) |
| `/booking/payment/[slug]` | `slug`=dealId, `?type=half\|full`, `?paymentReturn=1`, `?forceStatus=` (dev) | 06 §6.4 |
| `/<ctx>/booking` | `productId`, `memberId`, `from`, `to` via nuqs `useQueryState` | product id in URL → deep-linkable |
| `/<ctx>/payment/[slug]` | `slug`=dealId (server meta fetch) | |
| `/tours/payment/[slug]` | `slug`=orderId + `?tourId=&amount=&numberOfPeople=&email=&phone=&customer=&pricingOptionId=&dealId=&paymentType=&from=&to=` | amounts ride the query string (06 AVOID A-01) |

## 3. PER-PAGE COMPOSITION

Each subsection lists the page's sections top-to-bottom, the container/component that owns them,
the data source, and notable loading/empty/responsive behavior. Full component behavior is in
`03a-layouts.md`/`03b-features.md`/`04-data-layer.md`; here we document only how a page arranges them.

Common patterns first (so per-page lists stay short):

- **Generic page "shell"** — most marketing pages render `<Container>` inside a spacer:
  `src/components/clientPages/DefaultPageLayout.tsx` wraps children in
  `container relative mt-20 py-10 min-h-[50vh] sm:min-h-[60vh] lg:min-h-screen`.
- **`VideoPageLayout`** (`src/components/clientPages/VideoPageLayout.tsx`) renders the hero
  (`MainVideo`, `ReserveText`, `Reserve`) + an image carousel from `pageImages`, then children;
  it subscribes to footer visibility (03a §3.4/§3.5/§3.6). Used by home, about-us,
  sustainability, and accommodation.
- **Most CMS feeds opt-in to locale refetch** via `useEffect(() => refetch(), [currentLocale])`
  after the initial query — the CMS query itself always starts with the i18n `locale` from params.
- **Loading states** are skeletons: `ToursListSkeleton`, `MainLoader` (`text="Loading …"`), product
  skeleton grids; empty states usually render nothing (no explicit empty-message in most sections).
- **Head/foot chrome** is decided by `ConditionalLayout` (§4.4), not by the pages themselves.

### 3.1 Home — `src/app/[locale]/page.tsx` → `clientPages/homePage/homePage.tsx`

The `page.tsx` (5 lines) just renders `<ClientHomePage />`; **it has no `generateMetadata`** — the
home title/description come from the **layout-level** `generateMetadata` (`[locale]/layout.tsx:34-47`,
t("homeTitle")/t("homeDescription")) — a unique arrangement (§5.2).

`ClientHomePage` (homePage.tsx:30-41) renders `<VideoPageLayout>` with `title/description/imageSrc/
pageImages` from `useCmsPageDetail("home", currentLocale)` + `<Loading>` prop, then (shared space-y):

1. **WhyChooseUs** → `ScrollStack` — the signature **"stacked rounded hero cards"** (see 3.1.1).
2. **AccommodationSection** (`AccommodationList.tsx`) — heading + description from CMS page slug
   `"accommodationsection"`, then `<Accommodation perPage={2}/>` + `<LodgeStays perPage={2}/>`.
   The tab switcher / "See All" is **commented out** — both lists always render stacked.
3. **JourneySection** — per-journey carousels + alternating two-column rows
   (`index % 2 !== 0 ? lg:flex-row-reverse`), posts slug `"desertjourney"` (no locale arg at
   hook call) + page slug `"journeysection"`; intro/outro text via `ContentRenderer`.
4. **GallerySection** — carousel grid, posts slug `"gallery"`.
5. **NewsSection** — news grid, posts slug `"news"` (createDate → slug link), plus newsletter
   `SubscriptionSection`.
6. **MemoriesSection** — reviews carousel: `usePublicReviews` + `useGoogleReviews` (the latter
   hits the `api/google-reviews` proxy, §5.4).
7. **BannerSection `isShow={true} isContainer={true}`** — CTA banner shipping CMS page slug
   `"bannerdesctiption"` **[sic — the source slug has a typo]** (hardcode for the promotion/banner,
   see §10).
8. `{/* <SubscriptionSection /> */}` — slot kept commented.

#### 3.1.1 Stacked rounded hero cards + pill badges (detail)

`src/components/ScrollStack.tsx` — this is the "stacked rounded hero cards and pill badges" item.

- **Cards:** each `StackCard` is a sticky `motion.div` (`sticky top-20 md:top-28 lg:top-32`,
  `zIndex: index+1`) containing an image block with
  `rounded-[24px] md:rounded-[28px] shadow-2xl ring-1 ring-black/5 bg-black`, a full-bleed
  `bg-black/30` overlay, image `h-[50vh] md:h-[60vh] lg:max-h-[620px] object-cover` (w/h 1920×1080).
- **Stacking effect:** `useScroll` on the card with `offset: ["start 65%", "start 45%"]`;
  `y = useTransform(scrollYProgress, [0,1], [120, index*gap])` — lower cards translate to expose
  the ones beneath. `gap = 72px` desktop, `40px` mobile (via `matchMedia("(max-width: 640px)")`,
  with legacy `addListener` fallback).
- **Container:** `relative mb-24 md:mb-44`, height = `items.length × 80vh` (mobile `70vh`).
- **Pill badges:** absolute top-left (`left-6 top-6`) two `rounded-full border backdrop-blur-sm`
  pills: a round icon container (Sun icon, `p-1 lg:p-2`) + a text pill (`px-2 lg:px-2 lg:py-1.5`,
  `text-[10px] lg:text-xs font-roboto uppercase`) holding `item.title` or the fallback literal
  **"HEALING OASIS HIDDEN AMONG THE DUNES"** (§10).
- **Data:** `useCmsPostsBySlug("whychooseus", { language: currentLocale })` (via `WhyChooseUs.tsx`,
  which refetches on locale change).
- **Responsive differences:** sticky offsets/rounded radii/img heights/gaps escalate at `md`/`lg`
  breakpoints; the pills shrink font on mobile; hero uses scale not.

### 3.2 About us — `about-us/page.tsx` → `clientPages/aboutUsPage/aboutUsPage.tsx`

`<VideoPageLayout>` (CMS page `"aboutus"`, refetches on locale) containing `<Greeting/>`,
`<OurService/>`, `<Banner isShow={false}/>` (banner hidden); `SubscriptionSection` import is kept
but commented out. All three sections read their own CMS posts/page slugs (03a/03b §x). Static page;
no `[slug]`.

### 3.3 Sustainability — `sustainability/page.tsx` → `clientPages/sustainabilityPage/…`

`<VideoPageLayout showReserve={false}>` from CMS page `"/sustainability-home"` (leading slash!), plus
`SustainabilitySection` (image rows + ESG pillars) and the "check your CO₂" cards. Banner follows.
Static page.

### 3.4 Offers — `offers/page.tsx` → `ClientOffersPage`

Thin page: renders `<VideoPageLayout>` + `<BannerSection>` + **reuses** `<JourneySection>` (the same
desertjourney posts) — no dedicated offers CMS feed. Note: a product-level "offers" feature would
need its own source; today it's a journey showcase.

### 3.5 Careers — `careers/page.tsx` → `ClientCareers`

KPI header + erxes **knowledge-base** FAQ (`useKbArticles`/category) + links to erxes **forms**
(join / subscribe). No careers CMS collection exists (open question §11).

### 3.6 Legal notice — `legal-notice/page.tsx` → `ClientNoticePage`

Entirely from i18n `messages/{locale}.json` (`LegalNotice.*` keys) rendered into sections; no fetch,
no CMS. Good reference for a "static content" template (§7 template C).

### 3.7 Contact us — `contact-us/page.tsx` → `ClientContactUsPage`

Two-column: left = contact info + contact form (erxes submit) + FAQ (`id="faq"` anchors), right =
Google Map embed (map iframe with `GOOGLE_MAPS_API_KEY` / `GOOGLE_PLACE_ID`, §10) — lazy-loaded on
scroll. Uses `SecondaryHeader` (see §4.4 route list).

### 3.8 News — list+detail

- **List** `news/page.tsx` → static `<NewsSection>` (CMS posts `"news"`, card grid + paginate-less
  "latest 10") wrapped in `VideoPageLayout` from CMS page `"news"`.
- **Detail** `news/[slug]/page.tsx` → `clientPages/newsPage/newsDetailPage.tsx`:
  `DefaultPageLayout` + `<MainLoader text="Loading news details">` while
  `useCmsPostDetail(slug, locale)` loads; then title meta row (author?, date,
  `toLocaleDateString("mn-MN", …)`) + ContentRenderer body + share buttons (`Share2`) + back link
  + `SubscriptionSection`. Image gallery carousel of attachments. **Double-fetch** — the same post is
  fetched **server-side** in the page's `generateMetadata` (§5.3).

### 3.9 Forms — `forms/[slug]/page.tsx` (async server page)

The only truly dynamic listing page: resolves `params.slug` as a **form code**,
server-fetches the form definition, and renders `<ErxesFormModal>`-based renderer with the form's
fields flattened into a static-styled preview + live `ErxesForm` submit. The **page component
itself** re-fetches the form server-side (`getFormByCode`) in addition to `generateMetadata` —
second double-fetch path (§5.3). Relies on env `NEXT_PUBLIC_ERXES_API_URL` /
`NEXT_PUBLIC_MAIN_SUBS_DOMAIN`.

### 3.10 Stay pages

- **Accommodation list** `accommodation/page.tsx` → `ClientAccommodationPage`:
  `<VideoPageLayout>` (CMS page slug + heading/copy), then CMS-based room cards
  (`Accommodation`) merging BMS room data `useRooms()` (live price/occupancy, `src/sdk/queries/rooms`),
  then `<LodgeStays>` (BMS tours tagged lodge-stay) + `SubscriptionSection`. Card layout
  `md:grid-cols-2`, responsive image `h-[200px] md:h-[280px]`.
- **Room detail** `accommodation/[slug]/page.tsx` → `clientPages/accommodationPage/accommodationDetailPage.tsx`:
  CMS post (`useCmsPostDetail(slug, locale)`, refetch on locale) with
  ContentRenderer, room info pills, bed/occupancy engraved from linked BMS **room** product id
  (env `NEXT_PUBLIC_BRANCH_ID`), price from `useRooms()` by productId, image gallery, right-hand
  **reservation card** (Track A `selectedRoomsAtom`) + `BookingLink`/`toggle` → buttons to
  `/booking`. **Double-fetch** (§5.3).
- **Lodge stays list** `lodge-stays/page.tsx` → `ClientLodgeStaysPage`: same CMS "flat" list via
  `<LodgeStays>` (no video hero), `DefaultPageLayout`-like.
- **Lodge stay detail** `lodge-stays/[slug]/page.tsx` → `clientPages/…/lodgeStaysDetailPage.tsx`:
  a BMS **tour** rendered like a stay (uses `useTmsTourDetail`, see 03b §6.4); hero + itinerary +
  image gallery; **Double-fetch** (§5.3).

### 3.11 Experiences / dining / spa / merch

- **Activities list** `activities/page.tsx` → `ClientActivitiesPage`: `VideoPageLayout` (CMS page
  `"activitiespage"`), then `ActivitiesList` (CMS posts slug `"activitiespage"` category?) card grid,
  except stronger hero on desktop.
- **Activity detail** `activities/[slug]/page.tsx` → `activitiesDetailPage.tsx`:
  `useCmsPostDetail(slug, locale)`; `<MainLoader>`; hero + ContentRenderer + two buttons
  (Book → `BookingPage` track B; enclosed **reserves**), `?productId` maps CMS post ↔ POS product
  via `getProductId` (`src/lib/cms.ts`). **Line 12 keeps `const { title, excerpt } = post;` before
  the loading gate — crashes if `post` undefined mid-render.** **Double-fetch** (§5.3).
- **Dining** `dining/page.tsx` → `ClientDiningPage`: `VideoPageLayout` (CMS `"dining"`), then a
  **tab bar** — Dining / Experiences / À-la-carte — switching `useCmsPostsBySlug` feeds
  (`"dining"`, …) driven by nuqs (`?tab=…`, `?categoryIds=…`); category filter chips; cards link to
  track-B `/dining/booking?productId=…`.
- **Spa wellness** `spa-wellness/page.tsx` → `ClientSpaWellnessPage`: `VideoPageLayout` (CMS
  `"spa-wellness"` page + posts) + treatment cards + `SubscriptionSection`.
- **Merch** `merch/page.tsx` → `ClientMerchPage`: `<div className="pt-20">` stacking
  `MerchHero` (CMS `"merch"` carousel + "Shop" CTA), `FeaturedMerch` (CMS `"merch"` posts →
  product ids via `getProductId` → `MerchProductsCarousel` (POS products `usePoscProducts`,
  `src/sdk/queries/pos`)), plus loyalty/quality banner. Product card → `/merch/payment?productId=…`.

### 3.12 Tours

- **Tours** `tours/page.tsx` → `ClientToursPage`: hero (`ToursHero`) + `ToursList`
  (`useTmsTours({ branchId: env, tourType })` cards: image, name, ref, start date, CTA) + **custom
  trip** tab (`CreateOwnTripForm`, 06 §9.1) via `Tab` buttons (local state). `ToursListSkeleton`
  while loading.
- **Tour detail** `tours/[id]/page.tsx` → `tourDetailPage.tsx` (client): hero `min-h-[50vh]…[80vh]`
  full-bleed image + name + meta pill row (`bg-black/40 backdrop-blur-sm` — date range, duration,
  refNumber) → `TourItineraryAccordion` (groupDays) → `TourPricing` (groupPricingOptionIds) →
  sticky CTA; itinerary attachment download via `fetch`+`URL.createObjectURL`; `<MainLoader
  text="Loading tour details">`. Reads `useTmsTourDetail(id, { language: locale })` — **server
  `generateMetadata` already fetched it (§5.3)**.
- **Tour booking / payment** — see `06-booking-payment.md` §6 & §9 (BMS order → deal → paid).

### 3.13 Foundation — `fund/page.tsx` → `ClientFundPage`

Hero + "impact" (counters) + projects grid (CMS pages `"fund-projects"`?) linking to
`/fund/projects/[slug]` + FAQ (static). Project detail `fund/projects/[slug]/page.tsx` →
`fundProjectDetailPage.tsx`: `useCmsPostDetail` + **static fund data** (`fundData` map on the brand —
hardcoded project metas, see §10), ContentRenderer, donation CTA. **Double-fetch** (§5.3).

### 3.14 Booking (Track A) & Track B — summary (flows documented in `06-*`)

- `/booking` → `ClientBookingRoomsPage` — ReservationBar/header + room grid + cart
  (`SelectedRoomsCard`), step 1 of `BookingLayout` (06 §3).
- `/booking/details` → `ClientBookingDetailsPage` — guest info + payment method → deal create
  (06 §4).
- `/booking/payment/[slug]` → `ClientBookingPaymentPage` — payment screen (06 §6.4);
  `generateMetadata` block **commented out** in `page.tsx`.
- `/booking/confirm` → server page wrapping `<Suspense>` `CheckoutConfirm` (reads `?type`).

### 3.15 Profile — `/profile` + `/profile/detail/[slug]`

- `/profile` → **server async component** reading `?tab=personal|security|bookings` from
  `searchParams` and conditionally rendering `Personal`/`Security`/`Bookings` container by tab.
  **Not auth-guarded** in code (guest renders the tabs; data calls 401 → error toasts quietly).
- `/profile/detail/[slug]` → `profileBookingDetailPage.tsx`: server `generateMetadata` fetches the
  **deal** by `params.slug` (`getDealDetail`), client re-fetches with `useDealDetail`; card layout of
  deal + order + payments, cancel/refresh actions, "book again" → `/booking`.

### 3.16 Auth (route group) — `(auth)/layout.tsx`

Six pages share the `(auth)` two-pane layout (left white form panel, right `<Images/>` full-bleed
on `lg+`, hidden on mobile): `login`, `signup`, `company-signup`, `verify`, `forgot-password`,
`reset-password`. Each page exports `generateMetadata` from i18n `"Metadata"` keys
(`loginTitle`…`resetPasswordDescription`). These are the pages where `ConditionalLayout` hides the
Header/Footer entirely (§4.4); `(auth)/layout.tsx` supplies chrome.

## 4. LAYOUTS & PROVIDERS

### 4.1 Topology

Only two Next layouts exist:

- `src/app/[locale]/layout.tsx` — serves **every** page (there is no root `src/app/layout.tsx`).
- `src/app/[locale]/(auth)/layout.tsx` — only the 6 auth pages.

`ConditionalLayout` (a client component, **not** a Next layout) is the only "chrome" component; it is
invoked from the locale layout and decides Header vs SecondaryHeader vs none.

### 4.2 `src/app/[locale]/layout.tsx` — FULL SOURCE (layout + metadata + tagging)

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Roboto, DM_Sans } from "next/font/google";
import Script from "next/script";
import ConditionalLayout from "../../components/layout/ConditionalLayout";
import "./globals.css";
import Apollo from "./ApolloClient";
import CurrentConfigProvider from "@/containers/config/currentConfig";
import PricingPlansProvider from "@/containers/pricing/pricingPlans";
import { Toaster } from "@/components/ui/sonner";
import { IPageProps } from "@/types";
import { getTranslations } from "next-intl/server";
import useMetadata from "@/lib/hooks/useMetadata";
import ErxesWidget from "@/components/ErxesWidget";
// import PrivacyTermsGate from "@/components/common/privacy-terms-gate"
import { NuqsAdapter } from "nuqs/adapters/next/app";

const roboto = Roboto({           // --font-roboto
  weight: ["300", "400", "500", "700"], subsets: ["latin"], display: "swap",
  variable: "--font-roboto",
});
const dmSans = DM_Sans({          // --font-dm-sans
  weight: ["300", "400", "500", "700"], subsets: ["latin"], display: "swap",
  variable: "--font-dm-sans",
});

export async function generateMetadata({ params }: Pick<IPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const { metadata } = await useMetadata(t("homeTitle"), t("homeDescription"), locale);
  return { ...metadata };
}

export default async function RootLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-<MEASUREMENT-ID-REDACTED>" strategy="afterInteractive" />
        <Script id="ga4-script" strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-<MEASUREMENT-ID-REDACTED>');` }} />
        <Script id="gtm-script" strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-<CONTAINER-ID-REDACTED>');` }} />
        <link rel="icon" href={"/favicon.ico"} sizes="any" />
      </head>
      <body className={`${roboto.variable} ${dmSans.variable} ${roboto.className} antialiased`}>
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-<CONTAINER-ID-REDACTED>" height="0" width="0"
            style={{ display: "none", visibility: "hidden" }} />
        </noscript>
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
        {/* <PrivacyTermsGate /> */}
        <ErxesWidget />
      </body>
    </html>
  );
}
```

Key notes (all cite above lines):

- Provider/component order: `html` → `head(GA/GTM/favicon)` → `body` →
  `NextIntlClientProvider` → `NuqsAdapter` → `Apollo` → `CurrentConfigProvider` →
  `PricingPlansProvider` → `ConditionalLayout{children}`; Toaster immediate child of i18n provider;
  `ErxesWidget` outside i18n provider, last in body.
- **No `JotaiProvider`.** `src/store/index.tsx` exports `Providers` (JotaiProvider + Apollo) but has
  **zero usages** (grep across `src` finds only the definition) — atoms (`reserveAtom`,
  `selectedRoomsAtom`, …) therefore use the **default Jotai global store**, and `createApolloClient`
  is unused. (The reply "`<Apollo>` client provider is `ApolloClient.tsx`", 04 §2.4.)
- `hasLocale` gate → `notFound()` — **the** locale guard replacing middleware (cross-check §11:
  no `middleware.ts` found at repo root or `src/`). **(Reference only — Tegri Gobi.)** The TARGET
  starter DOES require `src/middleware.ts` (next-intl): `scripts/clone.ts` ships it and the Phase 0
  and Phase 3 manifests list it. Do not adopt the no-middleware conclusion for a generated site.
- Messages loaded with a **static dynamic `import(messages/${locale}.json)`** — requires the file to
  exist per locale (en/mn), else build-time import error rather than runtime fallback.
- GA4 + GTM ids are hardcoded literals (§10). Both strategies `afterInteractive`. GTM noscript iframe in body.
- `PrivacyTermsGate` import is **commented out** — the GDPR/Cookie gate is not rendered anywhere.
- `NuqsAdapter` is global here; some booking pages wrap a **second** `NuqsAdapter` (§9 AVOID A-02).

### 4.3 `src/app/[locale]/(auth)/layout.tsx` — FULL SOURCE

```tsx
import React from "react";
import Images from "@/components/authImages/images";

export default function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      <div className="bg-white flex w-full lg:w-1/2 min-h-screen items-center justify-center px-4 sm:px-8 lg:px-20 xl:px-28 py-8">
        {children}
      </div>
      <div className="hidden lg:block w-full lg:w-1/2 min-h-screen relative">
        <Images />
      </div>
    </div>
  );
}
```

- `Images` (`src/components/authImages/images.tsx`) renders the rotating brand-content slides
  (03b §1.9); the panel is `hidden` below `lg`.
- This group has **no own providers** — it inherits the locale layout; it only divides the screen.

### 4.4 `ConditionalLayout` rules — FULL SOURCE (`src/components/layout/ConditionalLayout.tsx`)

```tsx
"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import SecondaryHeader from "./SecondaryHeader";
import Footer from "./Footer";

const noLayoutRoutes = [
  "/login", "/signup", "/company-signup", "/verify", "/forgot-password",
  "reset-password",            // NOTE: missing leading slash — matches any "/…reset-password"
  "/forms",
];
const hideLayout = noLayoutRoutes.some((route) =>
  pathname.endsWith(route) || pathname.includes(route));

const secondaryHeaderRoutes = [
  "/contact-us", "/dining", "/spa-wellness", "/offers", "/booking", "/news",
  "/profile", "/booking", "/careers", "/legal-notice", "/activities", "/merch", "/tours",
];
const matchesConfiguredRoutes = secondaryHeaderRoutes.some((route) =>
  pathname === route || pathname.endsWith(route) || pathname.includes(`${route}/`));

const useSecondaryHeader =
  matchesConfiguredRoutes ||
  pathname.includes("/accommodation/") || pathname.includes("/fund/projects/") ||
  pathname.includes("/news/") || pathname.includes("/lodge-stays/") ||
  pathname.includes("/booking/") || pathname.includes("/profile/detail/");

return (
  <div className="flex flex-col">
    {!hideLayout && (useSecondaryHeader ? <SecondaryHeader /> : <Header />)}
    {children}
    <div className="flex flex-col h-full justify-end items-end">
      {!hideLayout && <Footer />}
    </div>
  </div>
);
```

Behavior summary:

- **No chrome** on: login, signup, company-signup, verify, forgot-password, `…/reset-password`
  (typo-tolerant because of `includes`), and **any** `/forms…` route.
- **SecondaryHeader** (compact menu bar) on contact-us, dining, spa-wellness, offers, booking, news,
  profile, careers, legal-notice, activities, merch, tours + any accommodation/lodge-stays detail,
  news article, routing, booking, fund project, profile detail path. Everything else (including
  home, about-us, sustainability, fund index, auth) gets the full `Header`.
- Header/Footer/ReservationBar fetch their data in the respective `<>` components:
  `Header.tsx`/`SecondaryHeader.tsx` each call `useCmsMenus(currentLocale)` (CMS menus), Footer uses
  the **i18n messages** + social links; the **Reserve** floating booking bar (03a §3.5) is the
  always-visible booking CTA.

## 5. METADATA & SEO

### 5.1 `useMetadata` — FULL SOURCE (`src/lib/hooks/useMetadata.ts`, 37 L) — the metadata "builder"

```ts
const useMetadata = async (
  title: string,
  description: string,
  locale: string,
  image?: string,
) => {
  const imageUrl = image ? image : "/images/metaBackground.jpg";

  const metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1920, height: 1080, alt: title }],
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };

  return { metadata };
};

export default useMetadata;
```

- **OG image** is a fixed 1920×1080, either the CMS `thumbnail.url` passed in or the hardcoded
  `/images/metaBackground.jpg` (public asset) — there is **no runtime OpenGraph image generation**
  (`no ImageResponse`, `no opengraph-image.*`).
- It is `async`, always returns the same shape `{ metadata }`; call sites ignore the `image`
  parameter more often than not (News/accommodation detail pass nothing → social preview always the
  background image).
- **No** `keywords`, `metadataBase`, `canonical`, `alternates`, `robots`, or `authors` fields are
  ever emitted. Cross-locale HTML `<link rel="alternate" hreflang>` is **NOT FOUND IN CODE**
  (grep for `canonical|alternates|robots:` → 0 hits).

### 5.2 Who emits metadata for the home page

- Home (`/`) has **no** `generateMetadata` in `page.tsx` — it relies on the **layout-level**
  `generateMetadata` (`src/app/[locale]/layout.tsx:34-47`) which uses `t("homeTitle")` /
  `t("homeDescription")` from `messages/*.json`. That means the layout metadata **only ever matches
  the home page**; any sub-page's own `generateMetadata` **overrides** it (Next merges layout + page
  metadata at the page segment). If a future page stops defining `generateMetadata`, it would
  silently inherit home's title — see AVOID A-05.
- Every other one of the 45 pages defines its own `generateMetadata`.

### 5.3 generateMetadata **server-side network fetches** (the double-fetch risk)

All of these call the shared server Apollo client (`src/sdk/getClient.ts`, 04 §2.7) with
`x-app-token: process.env.NEXT_PUBLIC_ERXES_APP_TOKEN` and **no `cache`/`revalidate` option** (default
`fetch` data cache behavior) — then the client container for the same route fetches the **same
record again** through the browser (double-fetch, AVOID A-01).

| Route | `page.tsx` call site | Server helper (04 §) | Re-fetched client-side by |
|---|---|---|---|
| `/accommodation/[slug]` | `accommodation/[slug]/page.tsx:12` | `getCmsPostDetail(slug, locale)` (cms.tsx:60) | `accommodationDetailPage.tsx:48` (`useCmsPostDetail`) |
| `/news/[slug]` | `news/[slug]/page.tsx:11` | `getCmsPostDetail` | `newsDetailPage.tsx:24` |
| `/activities/[slug]` | `activities/[slug]/page.tsx:11` | `getCmsPostDetail` | `activitiesDetailPage.tsx:19` |
| `/fund/projects/[slug]` | `fund/projects/[slug]/page.tsx:13` (`.catch()` ✓) | `getCmsPostDetail` + static `getFundProject(slug, locale)` | `fundProjectDetailPage` (`useCmsPostDetail`) |
| `/tours/[id]` | `tours/[id]/page.tsx:11` | `getTmsTourDetail(id)` (tms.tsx:76) | `tourDetailPage.tsx:24` (`useTmsTourDetail`) |
| `/lodge-stays/[slug]` | `lodge-stays/[slug]/page.tsx:~11` | `getTmsTourDetail(slug)` | `lodgeStaysDetailPage.tsx:34` |
| `/<ctx>/payment/[slug]` (activities/dining/spa-wellness/merch) | e.g. `activities/payment/[slug]/page.tsx:13` | `getDealDetail(slug)` (sales.tsx:150) | `AppointmentPaymentPage` (`useDealDetail`) |
| `/profile/detail/[slug]` | `profile/detail/[slug]/page.tsx:13` | `getDealDetail(slug)` | `profileBookingDetailPage` (`useDealDetail`) |
| `/forms/[slug]` | `forms/[slug]/page.tsx:13` **and** `:27` | `getFormByCode(slug)` — fetched **twice server-side** (once for metadata, once in the page body) | `FormsDetailPage` stateless (props) |

**Crash paths inside generateMetadata** (un-guarded destructuring — a deleted CMS post / private deal
makes the whole page 500):

- `news/[slug]/page.tsx:12` `const { title, excerpt } = post;`
- `activities/[slug]/page.tsx:12` `const { title, excerpt } = post;`
- `accommodation/[slug]/page.tsx:13` `const { title, excerpt } = post || {}` (safe-ish)
- `activities/payment/[slug]/page.tsx:18-19` `const { number } = dealDetail` — **no guard**
- `profile/detail/[slug]/page.tsx:15-16` `const { number } = dealDetail` — **no guard**
- The **only** defensive one is `fund/projects/[slug]/page.tsx:13-24` (`getCmsPostDetail(...).catch(…)+ optional chaining + project fallback`).
- **Why `/booking/payment/[slug]` metadata is commented out:** same `getDealDetail` risk — the
  maintainers disabled it (06 §6.4). Reproduce the fund pattern instead (AVOID A-03).

### 5.4 SEO-related files & route handlers

| Item | Location | Status |
|---|---|---|
| `sitemap.ts` | `src/app/**` | **NOT FOUND IN CODE** — no sitemap whatsoever |
| `robots.ts` / `robots.txt` | `src/app/**` | **NOT FOUND IN CODE** |
| `manifest.*` (PWA) | `src/app/**` | **NOT FOUND IN CODE** |
| `opengraph-image`/`twitter-image` | `src/app/**` | **NOT FOUND IN CODE** (static OG only) |
| JSON-LD / structured data | anywhere in `src` | **NOT FOUND IN CODE** |
| `favicon.ico` | `public/favicon.ico`, wired `[locale]/layout.tsx:93` | present (brand asset) |
| `api/google-reviews` | `src/app/api/google-reviews/route.ts` | `GET`, `export const revalidate = 86400`, falls back to `next.config` env `GOOGLE_PLACE_ID`, returns `{ reviews: NormalizedGoogleReview[] }`; used by `MemoriesSection`. Gated by `features.google_reviews` |

The site therefore has **zero machine-readable SEO surface** beyond per-page `<title>`/`meta
description`/OG (`og:image` always the meta background unless detail pages pass one) — see
AVOID A-06.

## 6. SPECIAL LOGIC

### 6.1 Locale routing without middleware

`src/i18n/routing.ts` defines `locales: ["en","mn"]`, `defaultLocale: "en"`. There is **no
`middleware.ts` at the repo root and none under `src/`** (`ls middleware.ts src/middleware.ts` →
empty; no `middleware*` inside `src`). Locale handling is done inside the layout:

- `src/app/[locale]/layout.tsx:58-60` — `if (!hasLocale(routing.locales, locale)) notFound();`
- Requests for `.<domain>/xxx` (no locale segment) therefore 404 (no root layout to redirect);
  only prefixed `/en`, `/mn` (and the 2 API routes and public assets) resolve.
- `src/i18n/request.ts` guards `NEXT_PUBLIC_MAIN_SUBS_DOMAIN` config fetch (05) and falls back to
  the routing default if `hasLocale` fails; `src/i18n/navigation.ts` is the typed `Link`/`usePathname`.

### 6.2 Rendering strategy

- `generateStaticParams`: **NOT FOUND IN CODE** anywhere — every dynamic `[slug]` page is rendered
  per request (default dynamic server render), including the BMS/CMS detail pages.
- `export const dynamic`/`export const revalidate`: **NOT FOUND IN CODE** on any page. The only
  `revalidate` in the app is `src/app/api/google-reviews/route.ts:3` (`86400`).
- Consequences: detail pages issue a server round-trip (metadata fetch → render shell) on **every**
  request; no ISR/SSG exists. React Query+Apollo caching applies only to the client data layer.
- `Suspense`: used in **exactly one place** — `booking/confirm/page.tsx:26` (wraps
  `ClientBookingConfirmPage` which reads `?type` via `useSearchParams`). The nuqs pages
  (`activities/booking`, `dining/booking`, `spa-wellness/booking`, `tours/booking`, `merch/payment`)
  do **not** wrap their `useQueryState` usage in `Suspense` — they rely on the layout-level
  `NuqsAdapter` and may emit the Next.js "useSearchParams should be wrapped in Suspense" module
  bailing note at build time (see §6 Open Questions).

### 6.3 The company-signup "gate" (only real page-level protection)

- `src/app/api/company-signup/unlock/route.ts` — `POST`; compares submitted access code against a
  **literal access code string** (value REDACTED, §10 row 5); on success sets httpOnly cookie
  `company_signup_unlocked` (1h, `secure` in prod).
- `src/app/[locale]/(auth)/company-signup/page.tsx:29` — reads `await cookies()` server-side and
  shows `<CompanySignupGate/>` (code entry) vs the signup form depending on the cookie.
- Every other "account" page (login, signup, verify, profile) is **entirely ungated in code** —
  there is no `redirect()`/auth middleware; a loader hits tokenless requests and handles 401s
  client-side. Profile renders even for guests.

### 6.4 Other page-level decisions

- `?tab=` whitelist in `profile/page.tsx:31-34` (`personal|security|bookings`, default `personal`);
  the tab content is swapped server-side so the SSR HTML always matches the tab.
- `booking/confirm` distinguishes `?type=payAtProperty` (and friends) for the confirmation copy.
- `forms/[slug]` is the "catch-all form" — `getFormByCode` at both metadata and page body; if the
  code is missing/unknown it renders the `Forms` i18n "Not found" block instead of `notFound()`
  (`forms/[slug]/page.tsx:29-38`).
- Recommended touchpoints for page-level `notFound()` are otherwise absent (only the locale guard
  uses it); the REST of the site renders partial/empty states rather than 404s.

## 7. PAGE TEMPLATES

The three recurring `page.tsx` skeletons below regenerate the site's routing/SEO behavior with
"brand content" placeholders.

### 7.1 Template A — "static shell → client container" (majority of routes)

Used by: home, about-us, accommodation (list), lodge-stays, activities, dining, spa-wellness,
merch, tours, fund, contact-us, offers, careers, legal-notice, news, auth, all booking pages.
The `page.tsx` carries only metadata + `<Client… />`; all data fetching lives client-side.

```tsx
// src/app/[locale]/<route>/page.tsx
import ClientContainer from "@/components/clientPages/<route>/<container>";
import useMetadata from "@/lib/hooks/useMetadata";
import { IPageProps } from "@/types";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: IPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const { metadata } = await useMetadata(t("<route>Title"), t("<route>Description"), locale);
  return { ...metadata };
}

export default function Page() {
  return <ClientContainer />;
}
```

### 7.2 Template B — "detail page" (server metadata fetch + client detail container)

Used by: `accommodation/[slug]`, `news/[slug]`, `activities/[slug]`, `fund/projects/[slug]`,
`tours/[id]`, `lodge-stays/[slug]`, `*/payment/[slug]`, `profile/detail/[slug]`.

```tsx
// src/app/[locale]/<route>/[slug]/page.tsx
import ClientDetail from "@/components/clientPages/<route>/detailPage";
import useMetadata from "@/lib/hooks/useMetadata";
import { getCmsPostDetail } from "@/sdk/queries/cms";   // or TMS/deal/forms helper
import { IPageProps } from "@/types";
import { Metadata } from "next";

export async function generateMetadata({ params }: IPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { post } = await getCmsPostDetail(slug, locale).catch(() => ({ post: undefined }));
  const { title, excerpt } = post || {};                              // REFACTOR: optional chaining (see A-03)
  const { metadata } = await useMetadata(title, excerpt, locale);
  return { ...metadata };
}

export default function Page() {
  return <ClientDetail />;      // NOTE: re-fetches the same record (A-01)
}
```

### 7.3 Template C — "static content page" (i18n messages, zero CMS)

Used by: `legal-notice` (entirely from `messages/{locale}.json`), plus the tabs in `profile`.
No network at all; good for brand-legalese/FAQ pages.

```tsx
// src/app/[locale]/legal-notice/page.tsx
export async function generateMetadata({ params }: IPageProps): Promise<Metadata> {
  /* t("legalNoticeTitle")/t("legalNoticeDescription") via useMetadata */
}
export default function Page() {
  return <ClientNoticePage />;   // renders LegalNotice.* message keys
}
```

### 7.4 Template D — "async server page" (render-time decisions)

Used by: `forms/[slug]` and `profile`. The page awaits server data/`searchParams` and composes
children directly (no client container): `forms/[slug]/page.tsx:24-45` shows the `<DefaultPageLayout>`
+ not-found-block pattern; `profile/page.tsx:28-87` shows the `searchParams` tab whitelist pattern.

## 8. SITEMAP TREE

`x` marks pages that exist in code today.

```
/ (home) [home] ........................  x  . CORE  features.home
├─ /about-us ............................  x  . CORE
├─ /sustainability ......................  x  . OPTIONAL features.sustainability
├─ /offers ..............................  x  . OPTIONAL features.offers (== journey showcase)
├─ /careers .............................  x  . OPTIONAL features.careers
├─ /legal-notice ........................  x  . CORE
├─ /contact-us ..........................  x  . CORE
├─ /news ................................  x  . OPTIONAL features.news
│   └─ /news/[slug] .....................  x  . OPTIONAL
├─ /forms/[slug] ........................  x  . OPTIONAL features.customForms
├─ /accommodation .......................  x  . CORE
│   └─ /accommodation/[slug] ............  x  . CORE
├─ /lodge-stays .........................  x  . OPTIONAL features.lodgeStays
│   └─ /lodge-stays/[slug] ..............  x  . OPTIONAL
├─ /activities ..........................  x  . OPTIONAL features.activities
│   ├─ /activities/[slug] ...............  x  . OPTIONAL
│   ├─ /activities/booking ..............  x  . OPTIONAL   (multi-step, NOINDEX)
│   └─ /activities/payment/[slug] .......  x  . OPTIONAL   (NOINDEX)
├─ /dining (+ booking, payment/[slug]) ..  x  . OPTIONAL features.dining
├─ /spa-wellness (+ booking, payment) ...  x  . OPTIONAL features.spaWellness
├─ /merch ...............................  x  . OPTIONAL features.merch
│   ├─ /merch/payment ...................  x  . OPTIONAL   (checkout, NOINDEX)
│   └─ /merch/payment/[slug] ............  x  . OPTIONAL
├─ /tours ...............................  x  . OPTIONAL features.tours
│   ├─ /tours/[id] ......................  x  . OPTIONAL
│   ├─ /tours/booking ...................  x  . OPTIONAL   (NOINDEX)
│   └─ /tours/payment/[slug] ............  x  . OPTIONAL   (NOINDEX)
├─ /fund ................................  x  . OPTIONAL features.fund
│   └─ /fund/projects/[slug] ............  x  . OPTIONAL
└─ /booking (Track A rooms > details > payment/[slug] > confirm)   x . CORE  (NOINDEX mid-flow)
    └─ /profile, /profile/detail/[slug] .  x  . CORE (NOINDEX)
    └─ /login /signup /company-signup /verify /forgot-password /reset-password  x . CORE (NOINDEX)
```

> NOINDEX/robots decision today: **nothing** — there is no `robots.ts`. A regenerated site should
> mark `/booking*`, `*/booking`, `*/payment/[slug]`, `/profile*`, `/forms/*`, `/merch/payment` as
> `noindex, nofollow` (AVOID A-06) but keep the canonical trees above indexable.

## 9. REPRODUCE vs AVOID RULES (numbered)

REPRODUCE (do exactly like the codebase — these patterns are deliberate and worth keeping):

- **R-01** — One `<html>` per locale in `src/app/[locale]/layout.tsx`, guarded by
  `hasLocale(routing.locales, locale) ?? notFound()` (layout.tsx:58-60) — **do not** add a root
  `src/app/layout.tsx` and do not add middleware for locales (there is none today).
- **R-02** — Keep `page.tsx` files as thin shells (1 import of the client container + metadata), so
  the entire routing table stays auditable by `find src/app -name page.tsx` (§1) and switching an
  OPTIONAL feature on/off is a one-file change (config keys, §2).
- **R-03** — Centralize all metadata through `useMetadata(title, description, locale, image?)`
  (`src/lib/hooks/useMetadata.ts`); always add `generateMetadata` to every page so home/layout
  metadata never leaks onto sub-pages.
- **R-04** — Use `[slug]` consistently for CMS/BMS/deal ids and PIN the segment name; the one
  outlier `tours/[id]` (tours/[id]/page.tsx:10) proves the rule — rename check $why.
- **R-05** — Await `params` an `searchParams` (both are `Promise` under Next 15) — every page here
  already does (`const { locale, slug } = await params`).
- **R-06** — Keep all Chrome decision logic in `ConditionalLayout` as a **client** component
  (Header vs SecondaryHeader vs none) rather than per-route layouts; only `(auth)` has a real
  route-group layout.
- **R-07** — Use the string-split `index % 2 !== 0 ? "lg:flex-row-reverse"` alternating layout on
  journey rows (JourneySection.tsx) — responsive pattern the brand relies on.
- **R-08** — Provider nesting order in the layout: i18n → nuqs → apollo → config → pricing →
  chrome (layout.tsx:106-115); keep cosms-level providers *above* `ConditionalLayout` so every page
  inherits them.
- **R-09** — `DefaultPageLayout` (mt-20/py-10/min-h-screen) as the shared margin for page content;
  `VideoPageLayout` for pages with hero video + image carousel + Reserve.
- **R-10** — For brand content pages intended as lists, embed the list section directly in the page
  (home puts `NewsSection` inline) and let the detail pages reference sections by URL only.

AVOID (debt in the current code — don't reproduce):

- **A-01** — **Double fetch**: server `generateMetadata` + client hook fetch the same record
  (`accommodationDetailPage.tsx:48`, `newsDetailPage.tsx:24`, `activitiesDetailPage.tsx:19`,
  `tourDetailPage.tsx:24`, `lodgeStaysDetailPage.tsx:34`, payment/profile detail). Reproduce by
  fetching once server-side and passing a serialized payload / running Apollo preload so the client
  cache is already warm — or drop the server fetch and degrade the social preview, don't do both.
- **A-02** — **Duplicate `NuqsAdapter`**: already present globally in `[locale]/layout.tsx:107`,
  yet `activities/booking/page.tsx:25`, `dining/booking`, `spa-wellness/booking`, `tours/booking`,
  and `merch/payment/page.tsx:19` re-wrap in a child `NuqsAdapter`. Keep exactly one.
- **A-03** — **Un-guarded destructuring in `generateMetadata`**: `news/[slug]/page.tsx:12`,
  `activities/[slug]/page.tsx:12`, `activities/payment/[slug]/page.tsx:18`,
  `profile/detail/[slug]/page.tsx:15` can throw (500). Copy the `fund/projects/[slug]/page.tsx:13-24`
  defensive pattern (`getCmsPostDetail().catch(…)`, `|| {}`, fallback titles) everywhere.
- **A-04** — **No `notFound()` for bad slugs**: unknown CMS posts render empty containers rather
  than 404 (server shell still 200s). Prefer `notFound()` in the detail pages.
- **A-05** — **Home metadata only via layout** (`[locale]/layout.tsx:34-47`) — any page that ever
  drops its own `generateMetadata` silently inherits `homeTitle`. Give home its own
  `generateMetadata` too and demote the layout one to locale defaults.
- **A-06** — **No SEO surface**: no `sitemap.ts`, `robots.ts`, `manifest`, canonical/hreflang,
  JSON-LD. Add them (robots must exclude /booking*, */payment, /profile*).
- **A-07** — **No `loading.tsx`/`error.tsx`**: users see blank screens during client hydration and
  Next default error pages. Add per-segment `loading.tsx` (skeletons already exist per-component)
  and an app-wide `error.tsx`.
- **A-08** — **`ConditionalLayout` matching is loose**: `pathname.includes(route)` plus the
  `"reset-password"` entry missing its leading slash (ConditionalLayout.tsx:23-29) can hide the
  header on paths that merely *contain* those substrings. Use exact segment matching.
- **A-09** — **`matchMedia` legacy `addListener` branch + `(mql as any)`** in `ScrollStack.tsx:86-94`
  — modern `MediaQueryList` needs only `addEventListener`; drop the fallback.
- **A-10** — **Hardcoded i18n/slug stickiness**: CMS slugs are locale-static literals
  ("bannerdesctiption" [sic], "/sustainability-home", "desertjourney", "whychooseus", "merch", …) —
  centralize into `03a §5` config + registry so a CMS rename doesn't silently blank sections.
- **A-11** — **`tours/[id]` naming** breaks the `[slug]` convention (A/R-04) — normalize.
- **A-12** — **Partial content fallbacks**: `activities/[slug]` container keeps
  `const { title, excerpt } = post;` *before* the loading gate (activitiesDetailPage.tsx:12) — move
  the destructure after the loading check / make optional.

## 10. BRAND-SPECIFIC HARDCODING AUDIT

Values below are **summarized/redacted** (exact strings in source — see cited lines). "Where it
should come from" = the proposed config/registry per `03a §5`.

| # | File:line | Hardcoded value (redacted) | Where it should come from |
|---|---|---|---|
| 1 | `src/app/[locale]/layout.tsx:69, 79, 90, 100` | GA4 measurement id + GTM container id (values `G-…`/`GTM-…`, REDACTED) | env `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` |
| 2 | `src/app/[locale]/layout.tsx:67-104` | GA/GTM `<Script>` snippets inline | extract to a `GoogleTag` component; ids from env |
| 3 | `src/app/[locale]/layout.tsx:93` | `/favicon.ico` | per-brand asset |
| 4 | `src/app/api/google-reviews/route.ts:5` | fallback Google `PLACE_ID` (`ChIJU…` redacted) | env only — matched to brand |
| 5 | `src/app/api/company-signup/unlock/route.ts` | company access code literal (value REDACTED) | env `COMPANY_SIGNUP_ACCESS_CODE` (rotate) |
| 6 | `src/components/ScrollStack.tsx:65` | fallback card title "HEALING OASIS HIDDEN AMONG THE DUNES" | CMS "whychooseus" post title or config |
| 7 | `src/components/JourneySection.tsx:123` | CMS posts slug `"desertjourney"` (also not locale-passed) | config + locale param |
| 8 | `src/components/JourneySection.tsx:129` | CMS page slug `"journeysection"` | config |
| 9 | `src/components/BannerSection.tsx:21-24` | CMS page slug `"bannerdesctiption"` (typo in source) | config (use correct spelling) |
| 10 | `src/components/AccommodationList.tsx:33-36` | CMS page slug `"accommodationsection"` | config |
| 11 | `src/components/clientPages/sustainabilityPage/*` | CMS page slug `"/sustainability-home"` (leading slash) | config |
| 12 | `src/components/WhyChooseUs.tsx:12` | CMS posts slug `"whychooseus"` | config |
| 13 | `src/components/GallerySection.tsx:16` + `NewsSection.tsx:43` + `MerchHero/FeaturedMerch` | slugs `"gallery"`, `"news"`, `"merch"` | config |
| 14 | `src/components/NewsSection.tsx` + homepage | news excerpt ends `"..."` etc. (rendered content) | CMS excerpt |
| 15 | `src/lib/hooks/useMetadata.ts:7` | default OG image `/images/metaBackground.jpg` | brand config |
| 16 | `src/sdk/queries/tms.tsx:76-90` | `language: "en"` hardcoded inside `getTmsTourDetail` (server) | derive from locale/branch |
| 17 | `src/components/clientPages/newsPage/newsDetailPage.tsx:31` | date format locale hardcoded `"mn-MN"` | current locale |
| 18 | `src/components/fund/data.ts` (`getFundContent`, `getFundProject`) | full statically-embedded fund copy/statistics map | CMS pages/posts |
| 19 | `contact-us` map embed + `MemoriesSection` reviews | `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACE_ID` (via env names) | env (already env-backed; keep) |
| 20 | `src/app/[locale]/ApolloClient.tsx:57` | erxes-pos-token literal (secret) — flagged in `04-*` | env, never in source |
| 21 | `src/components/layout/ConditionalLayout.tsx:17-25, 31-45` | whitelists of route paths for no-chrome / SecondaryHeader | config-driven route sets |

All of these are **redacted** in `07-pages.md` documents; a regenerating agent must treat the above
rows as configuration, never as source-of-truth content.

## 11. OPEN QUESTIONS / UNCERTAINTIES

1. **middleware**: the user premise says "middleware.ts (next-intl only)"; the **Tegri Gobi reference
   project** below has **no** `middleware.ts` at root or under `src/`, and handles locale detection with
   `hasLocale`+`notFound` in the layout. **TARGET CORRECTION:** a generated site DOES require
   `src/middleware.ts` (next-intl) — `scripts/clone.ts` ships it and the Phase 0/Phase 3 manifests list
   it. Reconcile any other references to the no-middleware conclusion against that.
2. **Locale fallback for list feeds**: `JourneySection` calls `useCmsPostsBySlug("desertjourney")`
   *without* passing the locale, while every sibling passes it — does erxes CMS filter by a default
   language then? Persian? Verify the CMS behavior and whether the section shows untranslated posts
   in `mn`.
3. **Nested `NuqsAdapter`** (A-02): does the inner adapter actually throw/ignore or silently no-op in
   the r18 release pinned here? It works today, but the layering is undocumented.
4. **`/forms` reachability**: `ConditionalLayout` strips chrome from *any* `/forms...` path yet
   there is no `/forms` index page in `src/app` — only `forms/[slug]`. Is `/forms` a real CMS-linked
   page elsewhere, or dead config?
5. **Auth protection** for `/profile`: there is no code-level guard; guests can render the tabs.
   Is the 401 handshake considered "authorization" by product, or should there be a server
   `redirect("/login")`?
6. **`getDealDetail` "number" crash**: `activities/payment/[slug]` and `profile/detail/[slug]`
   metadata would throw if a deal is private/deleted (A-03). Booking's is already disabled; are
   these intentionally live?
7. **Home metadata coupling** (A-05): if an OPTIONAL feature page (e.g. `/offers`) were temporarily
   stripped of its `generateMetadata`, Next would silently serve the home title again. Decide
   whether layout metadata should be neutral (site defaults) rather than home-specific.
8. **CMS slugs are locale-independent and typo'd**: is renaming the source slugs ("bannerdesctiption",
   "/sustainability-home") planned, or must the regenerated site preserve the typos for API
   compatibility?
9. **OG/twitter images**: detail pages never pass the `useMetadata` `image` param, so every social
   share shows the fixed background; is dynamic per-post OG (ImageResponse) on the roadmap?
10. **`tours/[id]` vs `[slug]`**: BMS tour ids appear both as `params.slug` (lodge-stays) and
    `params.id` (tours) — unify in the regenerated site, but confirm no existing inbound/bookmarked
    URLs depend on one or the other.