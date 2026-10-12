# TASK 03a — Layouts, Shell & Primitives

> Extracted from `03-components.md`; the feature-vertical half is [03b-features.md](03b-features.md). Read only the spec file for the current phase.

---

## TASK 03 — Component Catalog: `src/components` + `src/containers`

**Scope.** Every file in `src/components` (196 `.tsx` + 17 `.ts`/`.d.ts` helpers = 213 files) and `src/containers` (11 `.tsx` files) = 224 files total. Read-only analysis of the reference repository; no reference file was modified.

**Reading key.**
- **S/C** = module directive. `C` = `"use client"` at line 1–3; `S` = no directive (usable from either side, but in practice only ever imported by client components).
- **Props** = whether the component declares a typed props interface/type, and its name. `—` = no typed props (either no props, or inline/untyped destructuring).
- **Used by** = files that import it (resolved by import path, not by name coincidence).
- **Class** = `CORE` (any hotel site needs it) or `OPTIONAL` (Tegri-Gobi-specific or a third-party integration).

**Verified counts.** 224 files total: 213 in `src/components` (196 `.tsx` + 17 `.ts`, one of which is `types/index.d.ts`) and 11 `.tsx` in `src/containers`. 29 338 LOC in `src/components` + `src/containers`. Of the 196 `src/components` `.tsx` files, **162** declare `"use client"` at module level and **34** do not; all 11 containers declare it. Only **1** file in the entire `src/components` tree is a genuine server component (`src/components/contact-us/Maps.tsx` is a server component *candidate* but is imported by a client page, which makes it client in practice — see Open Questions #7).

---

## 1. INVENTORY TABLE

### 1.1 `src/containers` — 11 files

The entire `containers/` tree is only three things: two app-wide providers, seven auth screens/guards, one header widget. Nothing else in the app lives here.

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `containers/config/currentConfig.tsx` | Root provider. Queries `cpPmsBranchDetail` with the PMS token, writes `currentConfigAtom`, and gates the whole app: `MainLoader` while loading, localized "server down" screen on error. | C | `React.PropsWithChildren` | `app/[locale]/layout.tsx` | **CORE** |
| `containers/pricing/pricingPlans.tsx` | Root provider. Resolves pricing-plan → product mappings and derives `accountDiscountsAtom`. | C | `PropsWithChildren` | `app/[locale]/layout.tsx` | **CORE** (booking) |
| `containers/auth/current-user.tsx` | Header user widget: avatar + dropdown (Profile / Log out) when logged in, "Sign in" pill when not. Reads `currentUserAtom`, calls `useLogout`. | C | `interface CurrentUserProps { isScrolled: boolean }` | `layout/Header.tsx`, `layout/SecondaryHeader.tsx` | **CORE** |
| `containers/auth/login-form.tsx` | Complete login screen form. Inline zod schema built from `t()` messages, calls `useLogin` SDK hook. | C | — (inline) | `containers/auth/auth-container.tsx`, `(auth)/login/page.tsx` | **CORE** |
| `containers/auth/register-form.tsx` | Signup form, `mode: "customer" \| "company"`, with OTP + terms/privacy modal consent. | C | `type RegisterFormProps` | `auth-container.tsx`, `(auth)/signup/page.tsx`, `auth/CompanySignupGate.tsx` | **CORE** |
| `containers/auth/forgot-password-form.tsx` | Password-reset-request form. | C | — | `(auth)/forgot-password/page.tsx` | **CORE** |
| `containers/auth/reset-password-form.tsx` | New-password form, reads `?token=`. | C | — | `(auth)/reset-password/page.tsx` | **CORE** |
| `containers/auth/verify.tsx` | OTP verification screen, reads `?email=&userId=` from `useSearchParams`. | C | default + named exports | `(auth)/verify/page.tsx` | **CORE** |
| `containers/auth/auth-container.tsx` | Sliding login⇄signup switcher with framer-motion. **Dead** — zero importers. | C | `interface AuthContainerProps { initialView?: "login" \| "signup" }` | *(none)* | **OPTIONAL / dead** |
| `containers/auth/private-route.tsx` | Client-side auth guard, redirects when `currentUserAtom` is null. **Dead** — zero importers, never mounted. | C | — | *(none)* | **CORE** (must actually be wired) |
| `containers/auth/redirector.tsx` | Auth redirect helper. **Dead** — zero importers. | C | — | *(none)* | **OPTIONAL / dead** |

### 1.2 `src/components/layout` — 7 files

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `layout/ConditionalLayout.tsx` | Chrome router. Decides Header vs SecondaryHeader vs nothing vs Footer from the pathname string. Wraps `children` in `app/[locale]/layout.tsx`. | C | `interface ConditionalLayoutProps { children }` | `app/[locale]/layout.tsx` | **CORE** |
| `layout/Header.tsx` | Full transparent→white scroll-aware header: CMS menu, dropdown submenus, language switch, user widget, framer-motion slide-in mobile drawer. | C | — (none) | `ConditionalLayout.tsx` | **CORE** |
| `layout/SecondaryHeader.tsx` | Same content, always-white solid variant for interior pages. ~55% duplicated from `Header`. | C | — (none) | `ConditionalLayout.tsx` | **CORE** |
| `layout/Footer.tsx` | Brand-red footer: locale-switched logo, contact block, 2 link columns, social icons, "Contact Us" pill, erxes credit bar. | C | — (none) | `ConditionalLayout.tsx` | **CORE** |
| `layout/Reserve.tsx` | **The floating booking bar.** DatePicker ×2, RoomCounter, GuestCounter, submit. Renders a fixed pill or a collapsed FAB. | C | `type ReserveProps { className?, hideCloseButton?, fixedOpen? }` | `clientPages/VideoPageLayout.tsx`, `clientPages/bookingPages/bookingPage.tsx` | **CORE** |
| `layout/ReserveText.tsx` | Hero title + description overlay (or a fallback logo image), with a pulse skeleton variant. | S (no directive) | `interface ReserveTextProps { title?, text?, loading? }` | `clientPages/VideoPageLayout.tsx` | **CORE** |
| `layout/MainVideo.tsx` | Vendored kibo-ui `VideoPlayer` wrapper playing `/video/main.mp4`. **Commented out** at its only call site. | C | — | `VideoPageLayout.tsx` (commented) | **OPTIONAL** |

### 1.3 `src/components/clientPages` — 38 files

These are the page bodies. All 32 carry `"use client"`; all are default-exported; none accept props except where noted. Each is a one-line render from a thin server `page.tsx` (except `formsDetailPage`, which receives server-fetched data).

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `clientPages/VideoPageLayout.tsx` | **The universal page shell.** `min-h-screen` hero with Embla image carousel or single image, 40% scrim, `ReserveText` overlay, floating `Reserve`, then `children` in `space-y-10 lg:space-y-15`. | C | inline: `{ children, title, description, imageSrc?, pageImages?, showReserve?, loading? }` | aboutUs, lodgeStays, home, accommodation, sustainability pages | **CORE** |
| `clientPages/DefaultPageLayout.tsx` | The interior-page shell: `container relative mt-20 py-10 min-h-[50vh]…lg:min-h-screen`. 19 importers. | C | `{ className? } & PropsWithChildren` | 19 pages/detail pages | **CORE** |
| `clientPages/homePage/homePage.tsx` | Home composition: 8 sections inside `VideoPageLayout`. | C | — | `app/[locale]/page.tsx` | **CORE** |
| `clientPages/aboutUsPage/aboutUsPage.tsx` | `Greeting`, `OurService`, `Banner`. | C | — | `about-us/page.tsx` | **CORE** |
| `clientPages/accommodationPage/accommodationPage.tsx` | Two headed blocks: accommodation list, then lodge stays. | C | — | `accommodation/page.tsx` | **CORE** |
| `clientPages/accommodationPage/accommodationDetailPage.tsx` | Room detail: gallery carousel, amenities pills, price, favourite/share, related rooms. | C | — | `accommodation/[slug]/page.tsx` | **CORE** |
| `clientPages/accommodationPage/lodgeStaysDetailPage.tsx` | Lodge/tour-stay detail with itinerary accordion. | C | — | `lodge-stays/[slug]/page.tsx` | **OPTIONAL** (lodge stays) |
| `clientPages/lodgeStaysPage/lodgeStaysPage.tsx` | Lodge stays primary, accommodation secondary (order inverted vs the accommodation page). | C | — | `lodge-stays/page.tsx` | **OPTIONAL** |
| `clientPages/activitiesPage/activitiesPage.tsx` | `ActivitiesHero` + heading + `ActivitiesImages` / `ActivitiesAccordion`. | C | — | `activities/page.tsx` | **CORE** |
| `clientPages/activitiesPage/activitiesDetailPage.tsx` | Activity detail + booking CTA. | C | — | `activities/[slug]/page.tsx` | **CORE** |

> **Not a `src/components` file.** The route `app/[locale]/activities/booking/page.tsx` is a 3-line `server` component that wraps the shared `clientPages/bookingPage/bookingPage` in `<NuqsAdapter>` with `context="activities"`. It is listed here for orientation only, because it is where `bookingPage/bookingPage.tsx` is actually consumed. Its two siblings are `app/[locale]/dining/booking/page.tsx` (`context="dining"`) and `app/[locale]/spa-wellness/booking/page.tsx` (`context="spa"`) — **these three routes are the only consumers of `bookingPage/bookingPage.tsx`**. `app/[locale]/tours/booking/page.tsx` and `app/[locale]/merch/payment/page.tsx` mount `NuqsAdapter` without it. See A38.
| `clientPages/spaWellnessPage/spaWellnessPage.tsx` | `Stillness` + `SpaImages` / `SpaContent`, guarded by `GridSkeleton`. | C | — | `spa-wellness/page.tsx` | **CORE** |
| `clientPages/diningPage/diningPage.tsx` | Tabbed dining (nuqs `?tab=`, `?categoryIds=`): overview / experiences / à la carte. | C | — | `dining/page.tsx` | **CORE** |
| `clientPages/toursPage/toursPage.tsx` | `ToursHero` + `Tabs`: `ToursList` / `CreateOwnTripForm`. | C | — | `tours/page.tsx` | **OPTIONAL** |
| `clientPages/toursPage/ToursHero.tsx` | Tour hero image + overlapping pill tab bar. | C | `type ToursHeroProps { activeTab, onTabChange }` | `toursPage.tsx` | **OPTIONAL** |
| `clientPages/toursPage/ToursList.tsx` | Grid of `TourCard`. | C | — | `toursPage.tsx` | **OPTIONAL** |
| `clientPages/toursPage/TourCard.tsx` | Tour card: 16/9 image, date line, name, price, outline pill CTA. | C | `{ tour: BmTour }` | `ToursList.tsx` | **OPTIONAL** |
| `clientPages/toursPage/tourDetailPage.tsx` | Tour detail + `TourPricing` + `TourItineraryAccordion`. | C | — | `tours/[id]/page.tsx` | **OPTIONAL** |
| `clientPages/toursPage/TourPricing.tsx` | Per-person pricing table. | C | `interface TourPricingProps` | `tourDetailPage.tsx` | **OPTIONAL** |
| `clientPages/toursPage/TourItineraryAccordion.tsx` | Day-by-day accordion. | C | — | `tourDetailPage.tsx` | **OPTIONAL** |
| `clientPages/toursPage/TourBookingPage.tsx` | 677-line tour booking flow. | C | — | `tours/booking/page.tsx` | **OPTIONAL** |
| `clientPages/toursPage/CreateOwnTripForm.tsx` | "Create your own trip" Erxes form. | C | — | `toursPage.tsx` | **OPTIONAL** |
| `clientPages/merchPage/merchPage.tsx` | `MerchHero` + `FeaturedMerch` + `MerchProductsCarousel`. | C | — | `merch/page.tsx` | **OPTIONAL** (merch) |
| `clientPages/merchPage/MerchBookingPage.tsx` | Merch cart/checkout flow. | C | — | `merch/payment/page.tsx` | **OPTIONAL** |
| `clientPages/bookingPage/bookingPage.tsx` | **Appointment booking page** (activity/dining/spa). `interface BookingPageProps { context: BookingContext }`. | C | `interface BookingPageProps` | 4 × `*/booking/page.tsx` | **CORE** (booking) |
| `clientPages/bookingPages/bookingPage.tsx` | **Room booking wizard** — different component, same filename as above. | C | — | `booking/page.tsx` | **CORE** |
| `clientPages/bookingPages/bookingDetailsPage.tsx` | Step 2: personal info, check-in time, cancellation policy, pay-at-property. | C | — | `booking/details/page.tsx` | **CORE** |
| `clientPages/bookingPages/bookingConfirmPage.tsx` | Step 3, wrapped in `<Suspense>` in the page. | C | — | `booking/confirm/page.tsx` | **CORE** |
| `clientPages/bookingPages/bookingPaymentPage.tsx` | Room payment (invoices, not Stripe). | C | — | `booking/payment/[slug]/page.tsx` | **CORE** |
| `clientPages/newsPage/newsDetailPage.tsx` | News article: `ContentRenderer` + `NewsSection` + `SubscriptionSection`. | C | — | `news/[slug]/page.tsx` | **CORE** |
| `clientPages/sustainabilityPage/sustainabilityPage.tsx` | `VideoPageLayout` with `showReserve={false}` + `SustainabilitySection`. | C | — | `sustainability/page.tsx` | **CORE** |
| `clientPages/fundPage/fundPage.tsx` | Dino Fund page: `FundHero`, `ImpactSection`, `ProjectsSection`, `FaqSection`. | C | — | `fund/page.tsx` | **OPTIONAL** (fund) |
| `clientPages/fundPage/fundProjectDetailPage.tsx` | Fund project detail. | C | — | `fund/projects/[slug]/page.tsx` | **OPTIONAL** (fund) |
| `clientPages/careersPage/careersPage.tsx` | Careers, accordion-driven. | C | — | `careers/page.tsx` | **CORE** |
| `clientPages/contactUsPage/contactUsPage.tsx` | Contact grid + `ContactForm` + `Maps` + `FaqDatas` (`#faq`). | C | — | `contact-us/page.tsx` | **CORE** |
| `clientPages/legalNoticePage/legalNoticePage.tsx` | Legal notice, `DefaultPageLayout` + `ContentRenderer`. | C | — | `legal-notice/page.tsx` | **CORE** |
| `clientPages/offersPage/offersPage.tsx` | Offers = `DefaultPageLayout` + `JourneySection` (reuses the home journey block). | C | — | `offers/page.tsx` | **CORE** |
| `clientPages/formsPage/formsDetailPage.tsx` | The **only** client page that receives props from its server wrapper. | C | `{ form: IForm }` | `forms/[slug]/page.tsx` | **OPTIONAL** (Erxes forms) |
| `clientPages/profilePages/profileBookingDetailPage.tsx` | 793-line booking-detail + invoice + `ReviewSection`. | C | — | `profile/detail/[slug]/page.tsx` | **CORE** (account) |

### 1.4 Home-page sections (`src/components/*.tsx` root) — 16 files

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `WhyChooseUs.tsx` | Thin wrapper: `useCmsPostsBySlug("whychooseus")` → `<ScrollStack/>`. | C | — | `homePage.tsx` | **CORE** |
| `Accommodation.tsx` | Accommodation cards: carousel on mobile, 2-col grid on desktop. Joins CMS posts with PMS rooms for price. | C | `type AccommodationProps { perPage?: number }` | `AccommodationList.tsx`, `accommodationPage.tsx`, `lodgeStaysPage.tsx` | **CORE** |
| `AccommodationList.tsx` | Wraps `Accommodation` + `LodgeStays` + `SubscriptionSection` with headings. | C | — | `homePage.tsx` | **CORE** |
| `LodgeStays.tsx` | Lodge-stay cards. Same carousel/grid shape as `Accommodation`; locale-specific hardcoded id blocklist. | C | `type LodgeStaysProps { perPage?: number }` | `accommodationPage.tsx`, `lodgeStaysPage.tsx`, `AccommodationList.tsx` | **OPTIONAL** |
| `JourneySection.tsx` | Alternating image-carousel + CMS-HTML rows. | C | — | `homePage.tsx`, `offersPage.tsx` | **CORE** |
| `GallerySection.tsx` | Centered peeking carousel of all gallery images. | C | — | `homePage.tsx` | **CORE** |
| `NewsSection.tsx` | News cards with `layout: "carousel" \| "grid"` variant. | C | `interface NewsSectionProps { showHeader?: "false"\|"true"; layout?: "carousel"\|"grid" }` | `homePage.tsx`, `news/page.tsx` | **CORE** |
| `MemoriesSection.tsx` | Google-reviews carousel using `ReviewCard`. | C | — | `homePage.tsx` | **CORE** (reviews) |
| `ReviewCard.tsx` | Single review: stars, quote, author, date, prev/next, optional "Google review" badge. | S | `interface ReviewCardProps { review, author, date, rating, source?, onPrevious?, onNext? }` | `MemoriesSection.tsx` | **CORE** (reviews) |
| `ScrollStack.tsx` | **The signature effect.** Sticky `useScroll`-driven fanning card stack. | C | `interface ScrollStackProps { items: ScrollStackItem[] }` | `WhyChooseUs.tsx` | **CORE** |
| `BannerSection.tsx` | Location/directions banner: heading, lazy 3D-tour iframe, 3 travel facts, Maps link. | C | `{ isShow?, isContainer? }` (inline) | `homePage.tsx`, `aboutUsPage.tsx` | **OPTIONAL** (dino 3D tour) |
| `SubscriptionSection.tsx` | Newsletter email capture. Rendered but commented out on home/accommodation/lodge-stays/about-us. | C | — | 5 pages (all inside comments on 3 of them) | **CORE** |
| `LanguageSwitch.tsx` | Locale dropdown; hand-rolled path splice + `router.push`. | C | `interface LanguageSwitcherProps { isScrolled: boolean }` | `Header.tsx`, `SecondaryHeader.tsx` | **CORE** |
| `ContentRenderer.tsx` | Sanitized CMS HTML → `prose` with brand type overrides. | C | `{ content: string; className?: string }` | 3 files + `lodgeStays` via `dangerouslySetInnerHTML` elsewhere | **CORE** |
| `ErxesWidget.tsx` | Loads the Erxes messenger bundle on idle, path-blocklist aware. | C | — | `app/[locale]/layout.tsx` | **OPTIONAL** (vendor) |
| `TrendActivitiesSection.tsx` | **Dead** — zero importers. | C | — | *(none)* | **OPTIONAL / dead** |

### 1.10 `src/components/booking` — 15

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `booking/ReservationSummary.tsx` | **819 lines** — the largest component in the repo. Full booking summary. | C | `interface ReservationSummaryProps` | `ReservationSummaryWrapper.tsx` | **CORE** |
| `booking/ReservationSummaryWrapper.tsx` | Store-connected wrapper. | C | — | `bookingDetailsPage.tsx`, `bookingPaymentPage.tsx` | **CORE** |
| `booking/PersonalInfoForm.tsx` | Booking personal-info step. | C | — | `bookingDetailsPage.tsx` | **CORE** |
| `booking/CheckInTimeForm.tsx` | Arrival-time slot picker. | C | — | `bookingDetailsPage.tsx` | **CORE** |
| `booking/CancellationPolicy.tsx` | Policy text + `ContentRenderer` + `ConfirmButton`. | C | `type CancellationPolicyProps` | `bookingDetailsPage.tsx` | **CORE** |
| `booking/ConfirmButton.tsx` | Terms checkbox + submit. | C | — | `CancellationPolicy.tsx` | **CORE** |
| `booking/PayAtPropertyForm.tsx` | Pay-at-property form + `Modal` + Erxes form. | C | — | `bookingDetailsPage.tsx` | **CORE** |
| `booking/ErxesFormModal.tsx` | **779 lines.** Full Erxes form renderer (remote widget bundle). | C | `interface ErxesFormModalProps` | `PayAtPropertyForm.tsx` | **OPTIONAL** (vendor) |
| `booking/payment/payment-detail.tsx` | **563 lines.** Invoice status machine, QPay QR, success/fail/checking/TDB dialogs. | C | — | `bookingPaymentPage.tsx`, `appointment/payment/paymentPage.tsx` | **CORE** |
| `booking/payment/PaymentQrDialog.tsx` | QPay QR modal. | C | — | `payment-detail.tsx`, `tourPaymentDetail.tsx` | **OPTIONAL** (QPay) |
| `booking/payment/PaymentMethodSelector.tsx` | Card / bank-transfer / at-property. | C | — | 2 payment details | **CORE** |
| `booking/payment/PaymentSuccessDialog.tsx` | Success modal. | C | — | 2 payment details | **CORE** |
| `booking/payment/PaymentFailedDialog.tsx` | Failure modal + retry. | C | — | 2 payment details | **CORE** |
| `booking/payment/PaymentCheckingDialog.tsx` | "Checking payment" poll modal. | C | — | 2 payment details | **CORE** |
| `booking/payment/PaymentTdbDialog.tsx` | TDB bank-transfer dialog. **Dead.** | C | — | *(none)* | **OPTIONAL / dead** |

### 1.11 `src/components/common` — 4

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `common/terms-modal.tsx` | T&C modal. | C | `interface TermsModalProps` | `register-form.tsx`, `ContactForm.tsx`, `privacy-terms-gate.tsx` | **CORE** |
| `common/privacy-terms-modal.tsx` | Privacy modal. | C | `interface PrivacyTermsModalProps` | same 3 | **CORE** |
| `common/privacy-terms-gate.tsx` | Cookie/consent gate. **Dead** — its only call site in the root layout is commented out. | C | — | *(none)* | **OPTIONAL / dead** |
| `common/success-popup.tsx` | Generic success toast-modal. **Dead.** | C | `interface SuccessPopupProps` | *(none)* | **OPTIONAL / dead** |

### 1.17 `src/components/reserve` — 3 — the booking-bar sub-widgets

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `reserve/date-picker.tsx` | Popover + single-mode `Calendar`, past dates disabled, `toCalendarDay()` TZ normalization. | C | `{ date: Date; setDate; icon; locale? }` (inline) | `layout/Reserve.tsx` | **CORE** |
| `reserve/room-counter.tsx` | Popover + `Counter` + Apply. | C | `{ icon, count, setCount, max? }` (inline) | `layout/Reserve.tsx` | **CORE** |
| `reserve/guest-counter.tsx` | Popover + adult/child `Counter`s with `maxPeople` clamping. | C | `{ icon, guests, setGuests, maxPeople?, maxAdult?, maxChild? }` (inline) | `layout/Reserve.tsx` | **CORE** |

### 1.18 `src/components/shared` — 7

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `shared/BookingLayout.tsx` | The 2-column appointment booking shell: form steps left, sticky `ProductDetail` right. | C | `interface BookingLayoutProps { form, onSubmit, detail? }` | `bookingPage.tsx` | **CORE** |
| `shared/forms/TimeForm.tsx` | Step 1 — date + time slot. | C | — | `BookingLayout.tsx`, `bookingDetailsPage.tsx` | **CORE** |
| `shared/forms/PaymentForm.tsx` | Step 2 — payment type radio group. | C | `interface PaymentFormProps` | `BookingLayout.tsx` | **CORE** |
| `shared/forms/RoomInformationForm.tsx` | Per-room guest assignment; gated on `paymentType === "roomCharge"`. | C | `interface Product` | `BookingLayout.tsx`, `InformationForm.tsx`, `MerchBookingPage.tsx` | **CORE** |
| `shared/forms/UserInformationForm.tsx` | Guest contact details. | C | `interface UserInformationFormProps` | `BookingLayout.tsx`, `InformationForm.tsx` | **CORE** |
| `shared/forms/ConfirmForm.tsx` | Submit + summary + terms. | C | `interface ConfirmFormProps` | `BookingLayout.tsx` | **CORE** |
| `shared/forms/InformationForm.tsx` | Composes `UserInformationForm` or `RoomInformationForm`. | C | `interface InformationFormProps` | `bookingPage.tsx`, `MerchBookingPage.tsx` | **CORE** |

> **Export convention anomaly.** `shared/forms/` is the only folder where **both** a named and a default export is the convention — every one of the 6 files exports both (`DN`). Everywhere else in `src/components` the default export is the norm and named exports are the exception (only `containers/auth/verify.tsx` has both).

### 1.21 `src/components/ui` — 40 files

**Stock shadcn (24)** — regenerate with `shadcn add`; do not hand-edit.

| Path | Base | Consumers | Class |
|---|---|---|---|
| `ui/accordion.tsx` | Radix Accordion | 7 | CORE |
| `ui/alert-dialog.tsx` | Radix AlertDialog | **0 (dead)** | OPTIONAL / dead |
| `ui/alert.tsx` | shadcn + cva | **0 (dead)** | OPTIONAL / dead |
| `ui/avatar.tsx` | Radix Avatar | 2 | CORE |
| `ui/badge.tsx` | shadcn + cva | 2 | CORE |
| `ui/button.tsx` | shadcn + cva | **73 — the most-imported file in the app** | CORE |
| `ui/calendar.tsx` | react-day-picker v9 | 4 | CORE |
| `ui/card.tsx` | shadcn | 21 | CORE |
| `ui/carousel.tsx` | Embla + shadcn | 20 | CORE |
| `ui/checkbox.tsx` | Radix Checkbox | 5 | CORE |
| `ui/dialog.tsx` | Radix Dialog | 12 | CORE |
| `ui/form.tsx` | react-hook-form + shadcn | 18 | CORE |
| `ui/input.tsx` | shadcn | 18 | CORE |
| `ui/label.tsx` | Radix Label | 9 | CORE |
| `ui/menubar.tsx` | Radix Menubar | 1 | CORE |
| `ui/popover.tsx` | Radix Popover | 5 | CORE |
| `ui/radio-group.tsx` | Radix RadioGroup | 5 | CORE |
| `ui/scroll-area.tsx` | Radix ScrollArea | **0 (dead)** | OPTIONAL / dead |
| `ui/select.tsx` | Radix Select | 2 | CORE |
| `ui/separator.tsx` | Radix Separator | 2 | CORE |
| `ui/sonner.tsx` | sonner + next-themes | 1 | CORE |
| `ui/tabs.tsx` | Radix Tabs | 5 | CORE |
| `ui/textarea.tsx` | shadcn | 8 | CORE |
| `ui/password.tsx` | shadcn + strength meter | 1 | CORE |

**Project-specific (16)**

| Path | Purpose | S/C | Props | Consumers | Class |
|---|---|---|---|---|---|
| `ui/image.tsx` | **The image wrapper.** CMS-key → URL, blur→sharp animation, Cloudflare loader, media-query width, placeholder fallback. | C | `type ImageProps = CommonImageProps & { src?: unknown; alt?; skipAnimation? }` | **41** | **CORE** |
| `ui/Icon.tsx` | Maps a CMS icon *string* to a react-icons pack. | S | — | 2 | CORE |
| `ui/counter.tsx` | `−/n/+` stepper with max toast. | S | `{ count, setCount, max?, toastText?, disableButtons? }` | 2 | **CORE** |
| `ui/loading.tsx` | `LoadingIcon` (spinner) + `Loader2Icon` re-export. | S | `type LucideProps` | 7 | **CORE** |
| `ui/MainLoader.tsx` | Full-viewport Lottie loader (`public/animation/mainLoader.json`). | C | `{ text?: string }` | 16 | **CORE** |
| `ui/FourDotsLoader.tsx` | 4-dot pulse indicator. | C | `interface FourDotsLoaderProps` | 2 | CORE |
| `ui/GridSkeleton.tsx` | Section skeleton. **No `"use client"`** yet consumed only by client trees. | S | `type GridSkeletonProps { mobileSingle? }` | 2 | **CORE** |
| `ui/SkeletonAppointment.tsx` | Appointment form skeleton. | S | `type GridSkeletonAppointmentProps` | 2 | **CORE** |
| `ui/Loader.tsx` | Multi-variant inline loader; **contains raw hex `#D33718`**. | S | `interface LoaderProps` | 4 | **CORE** |
| `ui/CustomImage.tsx` | Bare `next/image` re-wrapper. **Dead.** | S | `interface CustomImageProps` | **0** | **OPTIONAL / dead** |
| `ui/date-time-picker.tsx` | Date+time composite. **Dead.** | C | `interface DateTimePickerProps` | **0** | **OPTIONAL / dead** |
| `ui/minimalist-calendar.tsx` | Compact calendar (used instead of `Calendar` in `TourBookingPage`). | C | `interface MinimalistCalendarProps` | 2 | CORE |
| `ui/minimalist-time-slot.tsx` | Compact time slots. **Dead.** | C | `interface TimeSlot` | **0** | **OPTIONAL / dead** |
| `ui/time-picker.tsx` | Hour/minute picker. | C | `interface TimePickerProps` | 1 | CORE |
| `ui/kibo-ui/video-player/index.tsx` | Vendored 3rd-party video player (media-chrome). **Dead** — only `MainVideo` used it. | C | `type VideoPlayerProps` | **0** | **OPTIONAL / dead** |
| `ui/responsive-test.tsx` | Debug breakpoint viewer. **Dead.** | C | — | **0** | **OPTIONAL / dead** |

> **Counting method for the Consumers column:** distinct **importing files**, resolved by import path (`@/…` and relative forms both normalised, extensions stripped), self-excluded. Not import *statements* — a file importing three names from one module counts once. 8 of the 40 files (20%) have zero importers.

---

## 2. GROUPING

### 2.1 UI primitives — `src/components/ui` (40 files)

Three distinct sub-populations, and the generator must not mix them:

1. **Vendored shadcn (24)** — `components.json` declares `new-york`, `neutral`, `rsc: true`. These files carry `data-slot="..."` attributes, `cva` variant maps, and `cn()` on the className. `button.tsx`, `badge.tsx`, `alert.tsx`, `form.tsx`, `carousel.tsx` are the only ones with real local modification. Rule: **regenerate, never edit.**
2. **Project image/media layer (5)** — `image.tsx`, `Icon.tsx`, `kibo-ui/video-player/`, `MainLoader.tsx`, `Loader.tsx`. These are the "replace shadcn's assumption with ours" layer.
3. **Project widget layer (11)** — `counter.tsx`, `loading.tsx`, `FourDotsLoader.tsx`, `GridSkeleton.tsx`, `SkeletonAppointment.tsx`, `date-time-picker.tsx`, `minimalist-calendar.tsx`, `minimalist-time-slot.tsx`, `time-picker.tsx`, `CustomImage.tsx`, `responsive-test.tsx`.

**Import-frequency ranking** (distinct importer files, self excluded — same method as the §1.21 Consumers column):

| Rank | File | Importers |
|---|---|---|
| 1 | `ui/button.tsx` | **73 — the most-imported file in the app** |
| 2 | `ui/image.tsx` | **41** |
| 3 | `ui/card.tsx` | 21 |
| 4 | `ui/carousel.tsx` | 20 |
| 5= | `ui/form.tsx` | 18 |
| 5= | `ui/input.tsx` | 18 |
| 7 | `ui/MainLoader.tsx` | 16 |
| 8 | `ui/dialog.tsx` | 12 |
| 9 | `ui/label.tsx` | 9 |
| 10 | `ui/textarea.tsx` | 8 |
| 11= | `ui/accordion.tsx` | 7 |
| 11= | `ui/loading.tsx` | 7 |
| 13= | `ui/checkbox.tsx`, `popover.tsx`, `radio-group.tsx`, `tabs.tsx` | 5 each |
| 17= | `ui/calendar.tsx`, `ui/Loader.tsx` | 4 each |
| 19= | `ui/avatar.tsx`, `badge.tsx`, `counter.tsx`, `Icon.tsx`, `FourDotsLoader.tsx`, `GridSkeleton.tsx`, `SkeletonAppointment.tsx`, `select.tsx`, `separator.tsx`, `minimalist-calendar.tsx` | 2 each |
| 29= | `ui/menubar.tsx`, `password.tsx`, `sonner.tsx`, `time-picker.tsx` | 1 each |
| 33= | `ui/alert-dialog.tsx`, `alert.tsx`, `CustomImage.tsx`, `date-time-picker.tsx`, `kibo-ui/video-player/index.tsx`, `minimalist-time-slot.tsx`, `responsive-test.tsx`, `scroll-area.tsx` | **0 — dead** |

The five highest-leverage files are `button`, `image`, `card`, `carousel`, and then `form`/`input` tied. **8 of the 40 files (20%) are dead.**

### 2.2 Layout — `src/components/layout` (7) + 1 loose

| Concern | Component | Notes |
|---|---|---|
| Chrome router | `layout/ConditionalLayout.tsx` | pathname string matching, 3 outcomes |
| Transparent→solid header | `layout/Header.tsx` | home-page hero pages |
| Solid header | `layout/SecondaryHeader.tsx` | interior pages |
| Footer | `layout/Footer.tsx` | red `bg-primary` |
| Hero copy overlay | `layout/ReserveText.tsx` | title OR fallback logo |
| Floating booking bar | `layout/Reserve.tsx` | the site's signature interaction |
| Hero video | `layout/MainVideo.tsx` | dead (commented out) |
| Mobile drawer | *inside* `Header.tsx` / `SecondaryHeader.tsx` | **not extracted** — duplicated per header |
| Language switcher | `LanguageSwitch.tsx` (root, not `layout/`) | 2 consumers |

**Key structural fact:** there is no `MobileMenu.tsx` and no `Nav.tsx`. Both headers inline the full drawer (~130 lines each), which is why they are 422 and 236 lines and why ~55% is duplication.

### 2.3 Sections

**Home (`src/components/*.tsx` root)** — 8 in `homePage.tsx`'s `space-y-10 lg:space-y-15` wrapper, in this exact order:

```
WhyChooseUs           → ScrollStack
AccommodationSection  → AccommodationList → Accommodation + LodgeStays + SubscriptionSection(commented)
JourneySection        → JourneyItem ×N  (alternating)
GallerySection        → centered peeking carousel
NewsSection           → news cards
MemoriesSection       → ReviewCard ×N  (Google reviews)
BannerSection         → 3D-tour + travel facts
SubscriptionSection   → (commented out)
```

**Feature folders** — one folder per content area, each owning its own section components: `about-us` (2), `activities` (3), `accommodation` (1, dead), `contact-us` (3), `dining` (7), `fund` (11), `merch` (4), `profile` (8), `reserve` (3), `shared` (8), `spa-wellness` (4), `sustainability` (1).

**The pattern every feature section follows:**

```
"use client"
const params = useParams(); const currentLocale = params.locale as string;
const { posts, loading, refetch } = useCmsPostsBySlug("<slug>", { language: currentLocale });
useEffect(() => { refetch() }, [currentLocale]);
if (loading) return <skeleton-shaped-to-match>;
return <section className="container"> <h1 className="text-2xl lg:text-3xl ...">{page?.name}</h1> … </section>
```

### 2.4 Booking widgets — `src/components/reserve` + `src/components/layout/Reserve.tsx` + `src/components/booking`

Four layers:

| Layer | Files | Purpose |
|---|---|---|
| **Search bar** | `layout/Reserve.tsx` + `reserve/date-picker.tsx` + `reserve/room-counter.tsx` + `reserve/guest-counter.tsx` + `ui/counter.tsx` | Fixed floating pill, localStorage-persisted open state, jotai-backed, submits → `/booking` |
| **Appointment wizard** | `clientPages/bookingPage.tsx` + `shared/BookingLayout.tsx` + `shared/forms/*` (6) + `appointment/products/ProductDetail.tsx` | Shared across 5 bookable contexts via `bookingContext.ts` |
| **Room wizard** | `clientPages/bookingPages/booking{Page,DetailsPage,ConfirmPage,PaymentPage}.tsx` + `booking/*` (8) + `booking/payment/*` (6) | 4 steps, separate from the appointment wizard |
| **Profile** | `profile/*` (8) | Booking history, cancel, review |

### 2.5 Shared

| Component | What is shared |
|---|---|
| `clientPages/DefaultPageLayout.tsx` | The interior page frame — 19 importers |
| `clientPages/VideoPageLayout.tsx` | The hero page frame — 5 importers |
| `ContentRenderer.tsx` | Sanitized CMS HTML → `prose` |
| `ui/image.tsx` | All imagery |
| `ui/button.tsx` | All actions |
| `ui/card.tsx` | All surfaces |
| `ui/carousel.tsx` | All carousels |
| `ui/GridSkeleton.tsx`, `ui/MainLoader.tsx` | Loading |
| `ui/Icon.tsx` | CMS-driven icons |
| `shared/forms/*` | Shared booking steps |

**Note there is no `shared/Modal.tsx`, no `shared/Badge.tsx`, no `shared/Pill.tsx`, no `shared/Card.tsx`, and no `shared/Slider.tsx`.** The pill is an inline `<div className="border rounded-full … backdrop-blur-md">` repeated 6× across `Accommodation.tsx` and `LodgeStays.tsx`. The floating round button exists twice, unrelated: `ReviewCard`'s chevrons and `Reserve`'s FAB.

---

## 3. TOP 15 COMPONENTS — FULL SOURCE + ANALYSIS

### 3.1 `src/components/layout/ConditionalLayout.tsx`

**Props interface**

```ts
interface ConditionalLayoutProps {
  children: React.ReactNode;
}
```

**Purpose.** Decides which chrome wraps `children`. It is the *only* consumer of `Header`, `SecondaryHeader` and `Footer`, and it is mounted once, in `src/app/[locale]/layout.tsx` around `{children}`.

**FULL REAL SOURCE**

```tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import SecondaryHeader from "./SecondaryHeader";
import Footer from "./Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  const noLayoutRoutes = [
    "/login",
    "/signup",
    "/company-signup",
    "/verify",
    "/forgot-password",
    "reset-password",
    "/forms",
  ];

  const hideLayout = noLayoutRoutes.some(
    (route) => pathname.endsWith(route) || pathname.includes(route),
  );

  const secondaryHeaderRoutes = [
    "/contact-us",
    "/dining",
    "/spa-wellness",
    "/offers",
    "/booking",
    "/news",
    "/profile",
    "/booking",
    "/careers",
    "/legal-notice",
    "/activities",
    "/merch",
    "/tours"
  ];

  const matchesConfiguredRoutes = secondaryHeaderRoutes.some(
    (route) =>
      pathname === route ||
      pathname.endsWith(route) ||
      pathname.includes(`${route}/`),
  );

  const useSecondaryHeader =
    matchesConfiguredRoutes ||
    pathname.includes("/accommodation/") ||
    pathname.includes("/fund/projects/") ||
    pathname.includes("/news/") ||
    pathname.includes("/lodge-stays/") ||
    pathname.includes("/booking/") ||
    pathname.includes("/profile/detail/");

  return (
    <div className="flex flex-col">
      {!hideLayout && (useSecondaryHeader ? <SecondaryHeader /> : <Header />)}
      {children}
      <div className="flex flex-col h-full justify-end items-end">
        {!hideLayout && <Footer />}
      </div>
    </div>
  );
}
```

**Internal composition.** Zero children beyond the three chrome components. It is a pure predicate over `usePathname()`.

**State / hooks / context.** `usePathname()` from `next/navigation` — **not** the locale-aware `usePathname` from `@/i18n/navigation`. That is deliberate in effect (stripping the locale is not needed for `includes` matching) but accidental in intent.

**Styling.** `flex flex-col`; the footer sits inside `flex flex-col h-full justify-end items-end` so it hugs the bottom.

**Brand content.** None. All route strings are site-config and belong in config, not code.

**GENERALIZED version**

```tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import SecondaryHeader from "./SecondaryHeader";
import Footer from "./Footer";

/**
 * Chrome routing config. Move to config/navigation.ts in a generated site.
 * Note the leading-slash consistency requirement (see AVOID #16).
 */
const CHROME = {
  /** No header and no footer at all. */
  bare: ["/login", "/signup", "/company-signup", "/verify",
         "/forgot-password", "/reset-password", "/forms"],
  /** Solid header instead of the transparent hero header. */
  secondaryHeader: ["/contact-us", "/dining", "/spa-wellness", "/offers",
                    "/booking", "/news", "/profile", "/careers",
                    "/legal-notice", "/activities", "/merch", "/tours"],
  /** Detail sub-routes that inherit their parent's secondary header. */
  secondaryHeaderPrefixes: ["/accommodation/", "/fund/projects/", "/news/",
                             "/lodge-stays/", "/booking/", "/profile/detail/"],
} as const;

/** Strip the locale segment so config never has to encode it. */
const stripLocale = (p: string) => p.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

const matchesAny = (p: string, routes: readonly string[]) =>
  routes.some((r) => p === r || p.startsWith(`${r}/`));

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = stripLocale(usePathname());

  const hideLayout = matchesAny(pathname, CHROME.bare);

  const useSecondaryHeader =
    matchesAny(pathname, CHROME.secondaryHeader) ||
    CHROME.secondaryHeaderPrefixes.some((p) => pathname.includes(p));

  return (
    <div className="flex flex-col min-h-screen">
      {!hideLayout && (useSecondaryHeader ? <SecondaryHeader /> : <Header />)}
      <main className="flex-1">{children}</main>
      {!hideLayout && <Footer />}
    </div>
  );
}
```

---

### 3.2 `src/components/layout/Header.tsx` — 422 lines

**Props interface.** None. `export default function Header()`.

**Purpose.** The transparent hero header. Becomes solid white + gains padding once `window.scrollY > 10`. Renders a CMS-driven mega-nav, a language switcher, the `CurrentUser` widget, and a framer-motion mobile drawer.

**FULL REAL SOURCE**

```tsx
"use client";

import LanguageSwitcher from "../LanguageSwitch";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import CurrentUser from "@/containers/auth/current-user";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCmsMenus } from "@/sdk/queries/cms";
import { getMenuTree } from "@/lib/menu";
import { useParams } from "next/navigation";

export default function Header() {
  const params = useParams();
  const currentLocale = params.locale as string;
  const [isScrolled, setIsScrolled] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    setIsScrolled(window.scrollY > 10);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  const { cmsMenus, refetch } = useCmsMenus(currentLocale);

  useEffect(() => {
    refetch();
  }, [currentLocale]);

  const { topLevel: topLevelMenus, getChildren: getChildMenus } =
    getMenuTree(cmsMenus);

  const menuVariants = {
    hidden: {
      x: "100%",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        opacity: { duration: 0.2 },
      },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: {
        opacity: { duration: 0.15, delay: 0.05 },
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.25,
      },
    },
  };

  const navItemVariants = {
    hidden: {
      x: 30,
      opacity: 0,
      scale: 0.95,
    },
    visible: (i: number) => ({
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.1 + 0.08 * i,
      },
    }),
    exit: (i: number) => ({
      x: 20,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        delay: (cmsMenus.length - i - 1) * 0.03,
      },
    }),
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.05 },
    },
  };

  const menuButtonVariants = {
    hover: {
      scale: 1.05,
    },
    tap: {
      scale: 0.95,
    },
  };

  const iconRotateVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 },
  };

  const navLinkVariants = {
    hover: {
      scale: 1.05,
      y: -2,
    },
  };

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: isScrolled
          ? "rgba(255, 255, 255, 1)"
          : "rgba(255, 255, 255, 0)",
        paddingTop: isScrolled ? "20px" : "36px",
        paddingBottom: isScrolled ? "20px" : undefined,
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 z-50 w-full shadow-lg"
      style={{
        boxShadow: isScrolled ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      <div className="container">
        <div className="flex justify-between items-center h-10">
          <motion.div
            variants={logoVariants}
            initial="hidden"
            animate="visible"
          >
            <Link className="flex items-center" href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Image
                  src="/images/header-logo.png"
                  alt="Tegri Gobi Resort"
                  width={101}
                  height={40}
                  className="w-auto h-10"
                />
              </motion.div>
            </Link>
          </motion.div>

          <nav className="hidden items-center space-x-8 xl:flex">
            {topLevelMenus.map((item, index) => {
              const children = getChildMenus(item._id);

              return (
                <motion.div
                  key={item._id}
                  className="relative group/menu"
                  variants={navLinkVariants}
                  whileHover="hover"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 0.1 + index * 0.05,
                    },
                  }}
                >
                  <Link
                    href={item.url}
                    className={`text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                      isScrolled
                        ? "text-gray-900 hover:text-gray-600"
                        : "text-white hover:text-white/80"
                    }`}
                  >
                    <span className="relative font-bodoni z-10">
                      {item.label}
                    </span>
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-current"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>

                  {!!children.length && (
                    <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
                      <div className="min-w-44 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
                        {children.map((child) => (
                          <Link
                            key={child._id}
                            href={child.url}
                            className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </nav>

          <motion.div
            className="hidden items-center space-x-4 xl:flex"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <LanguageSwitcher isScrolled={isScrolled} />
            <CurrentUser isScrolled={isScrolled} />
          </motion.div>

          <motion.button
            type="button"
            aria-label="Toggle menu"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            variants={menuButtonVariants}
            whileHover="hover"
            whileTap="tap"
            className={`xl:hidden inline-flex items-center justify-center rounded-md p-2 transition-all duration-300 ${
              isScrolled
                ? "text-gray-900 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
          >
            <motion.div
              variants={iconRotateVariants}
              animate={isMenuOpen ? "open" : "closed"}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="fixed inset-0 z-40 xl:hidden xl:bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            className="xl:hidden absolute  top-0 right-0 z-[60] w-80 max-w-[85vw] bg-white shadow-2xl border-l border-gray-100/50 flex flex-col h-dvh"
          >
            <motion.div
              className="flex flex-shrink-0 justify-between items-center px-4 py-14 h-16 bg-white border-b sm:px-6 border-gray-100/50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
            >
              <Link
                className="flex items-center"
                href="/"
                onClick={() => setIsMenuOpen(false)}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src="/images/header-logo.png"
                    alt="Tegri Gobi Resort"
                    width={90}
                    height={36}
                    className="w-auto h-9"
                  />
                </motion.div>
              </Link>
              <motion.button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="inline-flex justify-center items-center p-2 text-gray-700 rounded-full transition-colors hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>

            <div className="overflow-y-auto flex-1 bg-white">
              <nav className="px-4 py-6 space-y-2 sm:px-6">
                {topLevelMenus.map((item, index) => (
                  <motion.div
                    key={item._id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={navItemVariants}
                  >
                    <motion.div
                      whileHover={{
                        scale: 1.02,
                        x: 8,
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={item.url}
                        onClick={() => setIsMenuOpen(false)}
                        className="block overflow-hidden relative px-4 py-3 text-base font-medium text-gray-900 rounded-lg transition-all duration-200 hover:bg-gray-50 group"
                      >
                        <motion.div
                          className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"
                          initial={{ scaleY: 0 }}
                          whileHover={{ scaleY: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{ transformOrigin: "top" }}
                        />
                        <span className="relative z-10">{item.label}</span>
                      </Link>
                    </motion.div>

                    {getChildMenus(item._id).map((child) => (
                      <Link
                        key={child._id}
                        href={child.url}
                        onClick={() => setIsMenuOpen(false)}
                        className="block rounded-lg py-2 pl-8 pr-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </motion.div>
                ))}
              </nav>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-shrink-0 px-4 pt-4 pb-6 bg-white border-t sm:px-6 border-gray-100/50"
            >
              <div className="flex justify-between items-center">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
                  <LanguageSwitcher isScrolled={true} />
                </motion.div>
                <motion.div
                  className="flex flex-1 justify-end"
                  whileHover={{ scale: 1.02 }}
                >
                  <CurrentUser isScrolled={true} />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
```

**Internal composition.** `LanguageSwitcher` (×2 — desktop + drawer footer), `CurrentUser` (×2), `Link` from `@/i18n/navigation`, `next/image` **directly** (not the `ui/image` wrapper — the logo is a local asset), and `AnimatePresence` ×2 (overlay, drawer). Menu data from `useCmsMenus(locale)` → `getMenuTree()` from `src/lib/menu.ts`:

```ts
export const getMenuTree = (menus: ICmsMenu[]) => {
  const ids = new Set(menus.map((item) => item._id));
  return {
    topLevel: menus.filter((item) => !item.parentId || !ids.has(item.parentId)),
    getChildren: (parentId: string) =>
      menus.filter((item) => item.parentId === parentId),
  };
};
```

**State.** `isScrolled: boolean` (init `true` — server-render assumption), `isMenuOpen: boolean`. No jotai, no context.

**Hooks.** `useParams` (locale), `useCmsMenus`, `getMenuTree` (plain function), 4 × `useEffect`: scroll listener, body-scroll lock, locale refetch.

**Styling approach.**
- Header surface is animated via framer-motion `animate` on `backgroundColor`/`paddingTop`/`paddingBottom`, **plus** a hardcoded `boxShadow` in the `style` prop (not a Tailwind class, not a token).
- `fixed top-0 z-50 w-full shadow-lg` — note the class `shadow-lg` fights the inline `boxShadow`; whichever is more specific wins and the inline one always does.
- Desktop nav is `hidden … xl:flex`; the hamburger is `xl:hidden`. **Breakpoint is `xl`, not `lg`.**
- Nav spacing `space-x-8`; right cluster `space-x-4`.
- Submenu: `invisible absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 group-hover/menu:visible group-hover/menu:opacity-100`, panel `min-w-44 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5`. Uses a **named** group `group/menu` so it survives nested groups.
- Drawer: `absolute top-0 right-0 z-[60] w-80 max-w-[85vw] h-dvh` — `z-[60]` and `[85vw]` are arbitrary values; the theme has no `z-60`.
- Drawer header has `py-14 h-16` — 56px vertical padding *and* `h-16` (64px). The padding alone exceeds the height.

**Brand content and how it arrives.**

| Content | Source | Line |
|---|---|---|
| Logo image path `/images/header-logo.png` | **hardcoded** | 171, 330 |
| Logo `alt` `"Tegri Gobi Resort"` | **hardcoded** | 172, 331 |
| Nav labels | CMS `cpMenus` via `useCmsMenus` | 209 |
| Nav hrefs | CMS `item.url` | 201, 369 |
| Menu button `aria-label` | **hardcoded English** | 256 |
| Drawer item gradient `from-blue-500 to-purple-600` | **hardcoded, off-brand** | 374 |

**GENERALIZED version**

```tsx
"use client";

import LanguageSwitcher from "@/components/LanguageSwitch";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import CurrentUser from "@/containers/auth/current-user";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCmsMenus } from "@/sdk/queries/cms";
import { getMenuTree } from "@/lib/menu";
import { useParams } from "next/navigation";
import { SITE } from "@/config/site";

/** Extracted so Header and SecondaryHeader share one implementation. */
export function DesktopNav({ scrolled }: { scrolled: boolean }) { /* … see REPRODUCE #2 … */ }
export function MobileDrawer({ open, onClose, scrolled }: {
  open: boolean; onClose: () => void; scrolled: boolean;
}) { /* … see REPRODUCE #2 … */ }

export default function Header() {
  // … identical scroll/lock/menu logic …
  <Image src={SITE.logo} alt={SITE.name} width={101} height={40} className="w-auto h-10" />
  // nav link colour:
  //   scrolled ? "text-foreground hover:text-muted-foreground"
  //            : "text-white hover:text-white/80"
  // drawer indicator:
  //   className="absolute top-0 left-0 w-1 h-full bg-primary"
  //   (brand token, NOT from-blue-500 to-purple-600)
  // hamburger aria-label: useTranslations("Header")("openMenu")
}
```

---

### 3.3 `src/components/layout/SecondaryHeader.tsx` — 236 lines

**Props interface.** None.

**Purpose.** The solid-white header for interior pages. Functionally identical to `Header` minus the transparency animation and several per-item entrance animations.

**FULL REAL SOURCE**

```tsx
"use client";

import LanguageSwitcher from "../LanguageSwitch";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import CurrentUser from "@/containers/auth/current-user";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { useCmsMenus } from "@/sdk/queries/cms";
import { getMenuTree } from "@/lib/menu";

export default function SecondaryHeader() {
  const params = useParams();
  const currentLocale = params.locale as string;
  const [isScrolled, setIsScrolled] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMenuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  const { cmsMenus, refetch } = useCmsMenus(currentLocale);

  useEffect(() => {
    refetch();
  }, [currentLocale]);

  const { topLevel: topLevelMenus, getChildren: getChildMenus } =
    getMenuTree(cmsMenus);

  const menuVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { opacity: { duration: 0.2 } } },
    exit: { x: "100%", opacity: 0, transition: { opacity: { duration: 0.2 } } },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.25 } },
  };

  const navItemVariants = {
    hidden: { x: 30, opacity: 0, scale: 0.95 },
    visible: (i: number) => ({
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { delay: 0.1 + 0.08 * i },
    }),
    exit: (i: number) => ({
      x: 20,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        delay: (cmsMenus.length - i - 1) * 0.03,
      },
    }),
  };

  return (
    <motion.header
      initial={false}
      transition={{ duration: 0.3 }}
      className="fixed top-0 z-50 w-full bg-white"
      style={{
        boxShadow: isScrolled
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="container py-4">
        <div className="flex justify-between items-center h-14">
          <Link className="flex items-center" href="/">
            <Image
              src="/images/header-logo.png"
              alt="Tegri Gobi Resort"
              width={101}
              height={40}
              className="w-auto h-10"
            />
          </Link>

          <nav className="hidden items-center space-x-8 xl:flex">
            {topLevelMenus.map((item) => {
              const children = getChildMenus(item._id);

              return (
                <div key={item._id} className="relative group/menu">
                  <Link
                    href={item.url}
                    className="text-sm font-medium text-gray-900 transition hover:text-gray-600"
                  >
                    {item.label}
                  </Link>

                  {!!children.length && (
                    <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
                      <div className="min-w-44 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
                        {children.map((child) => (
                          <Link
                            key={child._id}
                            href={child.url}
                            className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center space-x-4 xl:flex">
            <LanguageSwitcher isScrolled={true} />
            <CurrentUser isScrolled={true} />
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-2 text-gray-900 rounded-md xl:hidden hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            className="fixed top-0 right-0 bottom-0 z-[60] w-80 max-w-[85vw] bg-white h-dvh shadow-2xl border-l border-gray-100 flex flex-col"
          >
            <div className="flex justify-between items-center px-4 py-10 h-16 border-b">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <Image
                  src="/images/header-logo.png"
                  alt="Tegri Gobi Resort"
                  width={90}
                  height={36}
                  className="w-auto h-9"
                />
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <nav className="px-4 py-6 space-y-2">
                {topLevelMenus.map((item, index) => (
                  <motion.div
                    key={item._id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={navItemVariants}
                  >
                    <Link
                      href={item.url}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-base font-medium text-gray-900 rounded-lg transition hover:bg-gray-50"
                    >
                      {item.label}
                    </Link>

                    {getChildMenus(item._id).map((child) => (
                      <Link
                        key={child._id}
                        href={child.url}
                        onClick={() => setIsMenuOpen(false)}
                        className="block rounded-lg py-2 pl-8 pr-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </motion.div>
                ))}
              </nav>
            </div>

            <div className="flex justify-between items-center px-4 py-4 border-t">
              <LanguageSwitcher isScrolled={true} />
              <CurrentUser isScrolled={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
```

**Composition, state, styling.** Same shape as `Header`. The differences that matter:

| Aspect | `Header` | `SecondaryHeader` |
|---|---|---|
| Surface | animated `backgroundColor` transparent→white | static `bg-white` |
| Root padding | animated `paddingTop/paddingBottom` | static `py-4` on `.container` |
| Shadow | `isScrolled ? "…0.1" : "none"` | `isScrolled ? "…0.2" : "…0.1"` |
| Drawer position | `absolute` (inside header) | `fixed` |
| Overlay class | `xl:hidden xl:bg-black/40` | `bg-black/40` (no `xl:hidden`) |
| Drawer top padding | `py-14` | `py-10` |
| Nav entrance | per-item `initial/animate` fade-down | none |
| Logo wrap | `motion.div` with spring hover | plain `Link` |
| Body-scroll lock | `add`/`remove` in if/else | `classList.toggle` |

**Brand content.** Same three hardcoded items as `Header`: logo path (lines 89, 177), `alt` text (90, 178), `aria-label`s (137, 185).

**GENERALIZED version.** `SecondaryHeader` should not exist. Extract from `Header`:

```tsx
// components/layout/HeaderChrome.tsx
export function HeaderChrome({ variant }: { variant: "transparent" | "solid" }) {
  // identical JSX; only the <motion.header> animate/style props differ:
  //   transparent → animate={{ backgroundColor, paddingTop, paddingBottom }}
  //   solid      → className="fixed top-0 z-50 w-full bg-white", shadow constant
  // Then:
  //   <Header />          → <HeaderChrome variant="transparent" />
  //   <SecondaryHeader /> → <HeaderChrome variant="solid" />
}
```

---

### 3.4 `src/components/layout/Footer.tsx` — 279 lines

**Props interface.** None.

**Purpose.** Brand-red footer with two entirely separate mobile and desktop trees (the mobile block is `lg:hidden`, the desktop block is `hidden lg:flex`). Duplicate contact markup appears in both.

**FULL REAL SOURCE**

```tsx
"use client";

import React from "react";
import Image from "../ui/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import ErxesLogoIcon from "@/icons/footer/ErxesLogoIcon";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";

export default function Footer() {
  const t = useTranslations("Footer");
  const locale = useLocale();

  // ✅ Direct download PDF
  const brochureUrl =
    locale === "en"
      ? "/Gobi Catalogue 20x20 (1).pdf"
      : "https://drive.google.com/file/d/1D9Hs8fQ8yR_x50zpoLUl2-ZPz0DrWX3A/view?ts=68a587e7";

  const footerLogo =
    locale === "en" ? "/images/logo-footer-en.png" : "/images/logo-footer.png";

  const aboutLinks = [
    { name: t("New Opening"), href: "#" },
    { name: t("Careers"), href: "/careers" },
    { name: t("News"), href: "/news" },
  ];

  // ✅ PDF → download (заавал <a> ашиглана)
  const experienceLinks = [
    { type: "link", name: t("Legal Notice"), href: "/legal-notice" },
    { type: "download", name: t("Download brochure"), href: brochureUrl },
    { type: "link", name: t("FAQ"), href: "/contact-us#faq" },
  ];

  const socialLinks = [
    {
      icon: <FaInstagram className="lg:w-5 lg:h-5 w-4 h-4" />,
      href: "https://www.instagram.com/tegri_gobi_resort",
      label: "Instagram",
    },
    {
      icon: <FaFacebook className="lg:w-5 lg:h-5 w-4 h-4" />,
      href: "https://www.facebook.com/Tegrigobiresort",
      label: "Facebook",
    },
    {
      icon: <Mail className="lg:w-5 lg:h-5 w-4 h-4" />,
      href: "mailto:manager@tegritravel.mn",
      label: "Email",
    },
  ];

  return (
    <footer className="w-full bg-primary text-white z-20">
      <div className="container w-full py-8 md:py-12">
        {/* #### MOBILE #### */}
        <div className="flex flex-col gap-8 lg:hidden">
          <div className="flex flex-col items-center gap-6 text-center">
            <Image
              alt="Tegri Gobi logo"
              src={footerLogo}
              width={220}
              height={96}
              skipAnimation
              className="w-[180px] sm:w-[220px] h-auto object-contain"
            />

            <div className="space-y-4">
              <p className="text-gray-200 text-sm">{t("Visit hotels")}</p>

              <div className="space-y-3 text-sm text-white">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 text-gray-300" />
                  <Link href="mailto:manager@tegritravel.mn">
                    manager@tegritravel.mn
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4 text-gray-300" />
                  <Link href="tel:+97677773331">+976 7777 3331</Link>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {socialLinks.map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-white/10 hover:text-gray-300"
                    >
                      {link.icon}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/contact-us"
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-5 py-2 text-sm rounded-full shadow-lg hover:shadow-xl"
              >
                {t("Contact Us")}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* MOBILE LINKS */}
          <div className="grid grid-cols-2 gap-8 text-center text-sm">
            {/* ABOUT */}
            <div className="space-y-4">
              <h3 className="font-medium text-white">{t("About")}</h3>
              <div className="flex flex-col gap-3">
                {aboutLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    className="text-gray-200 hover:text-white"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* EXPERIENCE */}
            <div className="space-y-4">
              <h3 className="font-medium text-white">{t("Experience")}</h3>
              <div className="flex flex-col gap-3">
                {experienceLinks.map((link, i) =>
                  link.type === "download" ? (
                    <a
                      key={i}
                      href={link.href}
                      download
                      className="text-gray-200 hover:text-white"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={i}
                      href={link.href}
                      className="text-gray-200 hover:text-white"
                    >
                      {link.name}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* #### DESKTOP #### */}
        <div className="hidden lg:flex justify-between items-start">
          {/* ABOUT */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold border-b border-white/20 pb-2">
              {t("About")}
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              {aboutLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="text-gray-200 hover:text-white flex gap-2 group"
                >
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          {/* CENTER LOGO & CONTACT */}
          <div className="flex flex-col items-center gap-6 max-w-md">
            <Image
              src={footerLogo}
              alt="Tegri Gobi logo"
              width={218}
              height={30}
              className="object-contain"
            />

            <p className="text-gray-200 text-sm">{t("Visit hotels")}</p>

            <div className="text-sm text-gray-200 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-gray-300" />
                <Link href="mailto:manager@tegritravel.mn">
                  manager@tegritravel.mn
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-gray-300" />
                <Link href="tel:+97677773331">+976 7777 3331</Link>
              </div>

              <div className="flex items-center justify-center gap-3 mt-4">
                {socialLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-white/10 hover:text-gray-300"
                  >
                    {link.icon}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 text-sm rounded-full shadow-lg hover:shadow-xl"
            >
              {t("Contact Us")}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* EXPERIENCE */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold border-b border-white/20 pb-2">
              {t("Experience")}
            </h3>

            <div className="flex flex-col gap-3 text-sm">
              {experienceLinks.map((link, i) =>
                link.type === "download" ? (
                  <a
                    key={i}
                    href={link.href}
                    download
                    className="text-gray-200 hover:text-white flex gap-2 group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </a>
                ) : (
                  <Link
                    key={i}
                    href={link.href}
                    className="text-gray-200 hover:text-white flex gap-2 group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* #### BOTTOM #### */}
      <div className="container border-t border-gray-400 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-white text-xs sm:text-sm">{t("Copyright")}</p>

          <Link
            href="https://erxes.mn/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs sm:text-sm hover:text-gray-300"
          >
            Powered by <ErxesLogoIcon />
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

**Composition.** `ui/image` (`skipAnimation` on mobile only), `next-intl` `useTranslations("Footer")` + `useLocale()`, locale-aware `Link`, `ErxesLogoIcon`, lucide + react-icons, and **3 in-component link arrays** (`aboutLinks`, `experienceLinks`, `socialLinks`).

**State / hooks.** `useLocale()` only — the only component in the app that switches assets by locale other than `LanguageSwitch`.

**Styling.** `bg-primary text-white z-20`; mobile `flex flex-col gap-8 lg:hidden`; desktop `hidden lg:flex justify-between items-start`; desktop layout is 3 columns `[links] [center logo+contact] [links]`. Link colour is always `text-gray-200 hover:text-white` — even on a red background, where `gray-200` is a very low-contrast grey.

**Brand content — every one of these is hardcoded:**

| Content | Value | Line |
|---|---|---|
| Email | `manager@tegritravel.mn` ×3 | 50, 76, 194 |
| Phone | `+976 7777 3331` / `+97677773331` ×2 | 83, 201 |
| Instagram URL | `https://www.instagram.com/tegri_gobi_resort` | 40 |
| Facebook URL | `https://www.facebook.com/Tegrigobiresort` | 45 |
| Brochure EN | `/Gobi Catalogue 20x20 (1).pdf` | 18 |
| Brochure MN | a Google Drive file id URL | 19 |
| Logo (en) | `/images/logo-footer-en.png` | 22 |
| Logo (mn) | `/images/logo-footer.png` | 22 |
| Logo `alt` | `"Tegri Gobi logo"` ×2 | 62, 183 |
| About links | Careers, News, `New Opening → "#"` | 24-28 |
| Vendor credit | `https://erxes.mn/` + `ErxesLogoIcon` | 268, 273 |

Only the *labels* come from messages.

**GENERALIZED version**

```tsx
"use client";

import Image from "../ui/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { SITE, SOCIAL, FOOTER_LINKS } from "@/config/site";

const { contact: { email, phone }, social, logoFooter: { en, mn }, vendorCredit } = SITE;

export default function Footer() {
  const t = useTranslations("Footer");

  // brochure: one CMS/CMS-hosted URL per locale, NOT a Google Drive link
  const experienceLinks = [
    { type: "link",     name: t("Legal Notice"),     href: "/legal-notice" },
    { type: "download", name: t("Download brochure"), href: SITE.brochure[SITE.locale] },
    { type: "link",     name: t("FAQ"),              href: "/contact-us#faq" },
  ];

  // contact + social markup is written ONCE and reused by both breakpoints,
  // only the surrounding flex direction changes.
  return (
    <footer className="w-full bg-primary text-primary-foreground z-20">
      {/* one <FooterContact/> component, one <FooterLinks groups={…}/> component */}
      {/* bottom bar: Powered-by block is OPTIONAL and driven by config.vendorCredit */}
    </footer>
  );
}
```

---

### 3.5 `src/components/layout/Reserve.tsx` — 295 lines

**Props interface**

```ts
type ReserveProps = {
  className?: string;
  hideCloseButton?: boolean;
  fixedOpen?: boolean;
};
```

**Purpose.** The floating booking search bar. The site's single most important interaction: always-visible date range + room count + guest count + submit, rendered as a white pill over the hero, or as a collapsed black FAB once dismissed.

**FULL REAL SOURCE**

```tsx
"use client";

import { useAtom, useSetAtom } from "jotai";
import {
  currentStepAtom,
  reserveAtom,
  selectedRoomsAtom,
  roomGuestAssignmentsAtom,
} from "@/store/reserve";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "../reserve/date-picker";
import { RoomCounter } from "../reserve/room-counter";
import { GuestCounter } from "../reserve/guest-counter";
import { showErrors } from "@/lib/showFormErrors";
import { ReserveFormT } from "@/lib/schema/reserve/types";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useReserveSchemas } from "@/lib/schema/reserve";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useResultRooms } from "@/sdk/queries/rooms";
import { LoadingIcon } from "../ui/loading";
import {
  ArrowRight,
  BedDouble,
  Calendar,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { enUS, mn as mnLocale } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";

const formLabelClass =
  "text-black text-[14px] sm:text-[16px] font-roboto not-italic font-normal leading-normal";

const MotionButton = motion(Button);

const LS_KEY_RESERVE_OPEN = "reserve_open";
const MAX_PEOPLE_PER_ROOM = 4;

const Reserve = ({
  className,
  hideCloseButton = false,
  fixedOpen = false,
}: ReserveProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const calendarLocale = currentLocale === "mn" ? mnLocale : enUS;

  const t = useTranslations("Reserve");

  const [reserve, setReserve] = useAtom(reserveAtom);
  const [open, setOpen] = useState<boolean>(() => {
    if (fixedOpen) return true;
    if (typeof window === "undefined") return true;
    try {
      const saved = window.localStorage.getItem(LS_KEY_RESERVE_OPEN);
      return saved !== null ? saved === "true" : true;
    } catch (_) {
      return true;
    }
  });

  const { reserveFormSchema } = useReserveSchemas();
  const [selectedRooms, setSelectedRooms] = useAtom(selectedRoomsAtom);
  const setRoomGuestAssignments = useSetAtom(roomGuestAssignmentsAtom);
  const { loading, refetchResultRooms } = useResultRooms(currentLocale);

  const form = useForm<ReserveFormT>({
    resolver: zodResolver(reserveFormSchema),
    defaultValues: {
      ...reserve,
    },
  });

  const roomCountValue = form.watch("roomCount");
  const maxPeople = Math.max(roomCountValue || 0, 1) * MAX_PEOPLE_PER_ROOM;

  async function onSubmit(values: ReserveFormT) {
    setReserve(values);
    if (pathname === "/booking") {
      const trimmedRooms = selectedRooms.filter(
        (_, index) => index < values.roomCount,
      );
      setSelectedRooms(trimmedRooms);
      setRoomGuestAssignments((prev) =>
        prev.filter((assignment) =>
          trimmedRooms.some((room) => room._id === assignment.roomId),
        ),
      );
      await refetchResultRooms();
    } else {
      router.push("/booking");
    }
  }

  const onError = (errors: FieldErrors<ReserveFormT>) => {
    showErrors(errors);
  };

  useEffect(() => {
    form.reset({ ...reserve });
  }, [reserve, setReserve]);

  useEffect(() => {
    if (fixedOpen) return;
    try {
      localStorage.setItem(LS_KEY_RESERVE_OPEN, String(open));
    } catch (_) {
      // ignore
    }
  }, [open, fixedOpen]);

  return (
    <div
      className={cn(
        className,
        "flex justify-center items-center w-full sm:px-6",
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        {(fixedOpen ? true : open) ? (
          <motion.div
            key="reserve-panel"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 26,
              mass: 0.8,
            }}
            className="relative flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-10 w-full sm:w-auto py-4 sm:py-5 px-4 sm:px-6 rounded-[25px] sm:rounded-[50px] bg-white shadow-[0_2px_6.1px_0_rgba(0,0,0,0.25)]"
          >
            {!(hideCloseButton || fixedOpen) && (
              <Button
                type="button"
                variant="outline"
                aria-label="Close"
                onClick={() => !fixedOpen && setOpen(false)}
                className="inline-flex absolute -top-2 -right-2 justify-center items-center w-8 h-8 rounded-full md:top-1 md:right-1 lg:-top-1 lg:right-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="grid grid-cols-2 gap-4 px-2 w-full md:grid-cols-2 lg:flex lg:items-center sm:gap-6 lg:gap-10 sm:w-auto"
              >
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={formLabelClass}>
                        {t("Check-in")}
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          icon={<Calendar className="w-4 h-4 lg:w-5 lg:h-5" />}
                          locale={calendarLocale}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={formLabelClass}>
                        {t("Check-out")}
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          icon={<MapPin className="w-4 h-4 lg:w-5 lg:h-5" />}
                          locale={calendarLocale}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={formLabelClass}>
                        {t("Room")}
                      </FormLabel>
                      <FormControl>
                        <RoomCounter
                          count={field.value}
                          setCount={field.onChange}
                          icon={<BedDouble className="w-4 h-4 lg:w-5 lg:h-5" />}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={formLabelClass}>
                        {t("Guest")}
                      </FormLabel>
                      <FormControl>
                        <GuestCounter
                          guests={field.value}
                          setGuests={field.onChange}
                          maxPeople={maxPeople}
                          icon={<Users className="w-4 h-4 lg:w-5 lg:h-5" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  variant="default"
                  className="has-[>svg]:pl-6 has-[>svg]:pr-3 gap-2 py-2.5 col-span-2 md:col-span-2 lg:col-span-1"
                  disabled={loading}
                >
                  <h1 className="text-white text-center font-roboto text-[14px] sm:text-[16px] not-italic font-medium leading-normal">
                    {t("Reserve")}
                  </h1>

                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                </Button>
              </form>
            </Form>
          </motion.div>
        ) : (
          !fixedOpen && (
            <MotionButton
              key="reserve-fab"
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                mass: 0.7,
              }}
              className="inline-flex fixed right-4 z-50 gap-2 items-center px-4 py-2 text-white bg-black rounded-full shadow-lg bottom-18 hover:bg-black/90"
            >
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{t("Reserve")}</span>
            </MotionButton>
          )
        )}
      </AnimatePresence>
    </div>
  );
};
export default Reserve;
```

**Internal composition.** `Form` + 4 × `FormField` (`startDate`, `endDate`, `roomCount`, `guests`) → `DatePicker` ×2, `RoomCounter`, `GuestCounter`; plus `Button` (close ×), `Button` (submit), `LoadingIcon` *(imported, never rendered)*, `showErrors`, `useResultRooms`.

**State / hooks / context.**
- **Jotai:** `reserveAtom` (read+write), `selectedRoomsAtom` (read+write), `roomGuestAssignmentsAtom` (write). `currentStepAtom` is imported but **unused**.
- **RHF + zod:** `useForm<ReserveFormT>` with `zodResolver(reserveFormSchema)` where the schema comes from `useReserveSchemas()` (a hook, so messages are localized).
- **localStorage:** key `reserve_open` persists dismissal across visits; read in a lazy `useState` initializer with `typeof window === "undefined"` guard.
- **`useResultRooms`** — only used for `loading` and a `refetchResultRooms` call in the on-booking-page branch.
- **Navigation:** locale-aware `usePathname`/`useRouter` from `@/i18n/navigation`; locale from `useParams`.
- **Dates:** `date-fns/locale` `enUS` / `mn`, selected by locale.

**Behaviour worth copying exactly.** The submit has two distinct modes:
- On `/booking`: treat the bar as an *edit* of the current search — write to the store, trim `selectedRooms` to the new count, drop guest assignments for removed rooms, then refetch availability.
- Anywhere else: treat as *entry* — write to the store and `router.push("/booking")`.

**Styling.** `rounded-[25px] sm:rounded-[50px]`; arbitrary shadow `shadow-[0_2px_6.1px_0_rgba(0,0,0,0.25)]`; `grid grid-cols-2 … lg:flex`; `grid grid-cols-2 … lg:flex`; `col-span-2 md:col-span-2 lg:col-span-1` for the submit. The FAB uses `bottom-18` — **invalid in Tailwind v4's default scale** (no `18` spacing key exists for `bottom`; the theme only defines 0.5-step numbers, so `bottom-18` compiles to nothing).

**Brand content.** Only the `₮`-less, currency-free labels (`Check-in`, `Check-out`, `Room`, `Guest`, `Reserve`) from messages, plus `MAX_PEOPLE_PER_ROOM = 4` and `LS_KEY_RESERVE_OPEN` — both of which are config.

**GENERALIZED version**

```tsx
type ReserveProps = {
  className?: string;
  hideCloseButton?: boolean;
  fixedOpen?: boolean;
  /** What the bar is attached to; changes the submit semantics. */
  scope?: "entry" | "edit";
  onSearch?: (values: ReserveFormT) => void | Promise<void>;
};

export const RESERVE_CONFIG = {
  maxPeoplePerRoom: 4,          // ← was MAX_PEOPLE_PER_ROOM
  storageKey: "reserve_open",   // ← was LS_KEY_RESERVE_OPEN
  bookingPath: "/booking",
} as const;

// onSubmit:
//   scope === "edit"   → patch store + trim selectedRooms + refetch availability
//   scope === "entry"  → patch store + router.push(RESERVE_CONFIG.bookingPath)
//
// FAB positioning: replace `bottom-18` with a real token, e.g. `bottom-6`.
// Remove the unused `currentStepAtom` and `LoadingIcon` imports.
```

---

### 3.6 `src/components/layout/ReserveText.tsx` — 48 lines

**Props interface**

```ts
interface ReserveTextProps {
  title?: string;
  text?: string;
  loading?: boolean;
}
```

**Purpose.** The hero copy block that sits under the hero image and above the floating booking bar. Renders a pulse skeleton while loading, an `<h1>` when a title exists, or a fallback logo image when it does not.

**FULL REAL SOURCE**

```tsx
import Image from "../ui/image"

interface ReserveTextProps {
  title?: string
  text?: string
  loading?: boolean
}

const ReserveText = ({
  title = "",
  text = "",
  loading = false,
}: ReserveTextProps) => {
  if (loading) {
    return (
      <div className='flex absolute right-0 left-0 bottom-16 flex-col gap-4 items-center px-4 md:bottom-18 lg:bottom-32 sm:px-6 z-5'>
        <div className='animate-pulse'>
          <div className='h-8 bg-white/20 rounded w-64 mx-auto mb-4 md:h-10 lg:h-12'></div>
          <div className='h-4 bg-white/20 rounded w-96 mx-auto lg:h-5'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex absolute right-0 left-0 bottom-16 flex-col gap-4 items-center px-4 md:bottom-18 lg:bottom-32 sm:px-6 z-5'>
      {title ? (
        <h1 className='text-2xl font-medium text-center text-white uppercase font-roboto md:text-3xl lg:text-4xl'>
          {title}
        </h1>
      ) : (
        <div className='flex justify-center w-[100px] lg:w-[150px]'>
          <Image
            src='/images/about-logo.png'
            alt='About Logo'
            width={1920}
            height={1080}
            className='object-contain w-full h-full'
          />
        </div>
      )}
      <p className='max-w-3xl text-base font-normal text-center text-white font-roboto lg:text-xl'>
        {text}
      </p>
    </div>
  )
}
export default ReserveText
```

**Composition / state.** Zero hooks, zero state. Purely prop-driven. **No `"use client"` directive**, but it is imported by `VideoPageLayout` which is a client component, so it compiles into the client bundle.

**Styling.** `absolute right-0 left-0 bottom-16 md:bottom-18 lg:bottom-32`. Two of the three are suspect: **`z-5` is not a valid Tailwind class** (the theme's default z-index scale is 0, 10, 20, 30, 40, 50, `auto`), and **`bottom-18` is invalid** for the same reason `bottom-18` fails in `Reserve`. The intended value is almost certainly `bottom-20` (or `z-10`). Because the booking bar is `z-40` and the header is `z-50`, the hero copy renders under both regardless.

The image fallback declares `width={1920} height={1080}` for an asset displayed at `100–150px` wide with `object-contain` — a 13× intrinsic-size mismatch.

**Brand content.** `src='/images/about-logo.png'` and `alt='About Logo'` are hardcoded, and the component is named after a booking feature while actually being a hero-title component.

**GENERALIZED version**

```tsx
import Image from "@/components/ui/image";

interface ReserveTextProps {
  title?: string;
  text?: string;
  loading?: boolean;
  /** Rendered instead of `title` when title is empty. */
  fallbackLogo?: string;
}

const ReserveText = ({ title = "", text = "", loading = false, fallbackLogo }: ReserveTextProps) => {
  if (loading) return <HeroTextSkeleton />;

  return (
    // z-5 → z-10 ; bottom-18 → bottom-20
    <div className="flex absolute inset-x-0 bottom-16 md:bottom-20 lg:bottom-32 flex-col items-center gap-4 px-4 sm:px-6 z-10">
      {title ? (
        <h1 className="text-2xl font-medium text-center text-white uppercase font-roboto md:text-3xl lg:text-4xl">
          {title}
        </h1>
      ) : fallbackLogo ? (
        <div className="flex justify-center w-[100px] lg:w-[150px]">
          <Image src={fallbackLogo} alt="" width={300} height={150} className="object-contain w-full h-auto" />
        </div>
      ) : null}
      <p className="max-w-3xl text-base font-normal text-center text-white font-roboto lg:text-xl">{text}</p>
    </div>
  );
};
export default ReserveText;
```

---

### 3.7 `src/components/clientPages/VideoPageLayout.tsx` — 117 lines

**Props interface** (inline, not a named interface)

```tsx
{
  children: React.ReactNode;
  title: string;
  description: string;
  imageSrc?: string;
  pageImages?: IAttachment[];
  showReserve?: boolean;
  loading?: boolean;
}
```

**Purpose.** The hero page frame. Five pages use it (`homePage`, `aboutUsPage`, `accommodationPage`, `lodgeStaysPage`, `sustainabilityPage`). Despite the name, video is disabled — it renders an Embla image carousel or a single image, plus a 40% scrim, plus the hero copy, plus the floating booking bar.

**FULL REAL SOURCE**

```tsx
"use client";

import MainVideo from "../layout/MainVideo";
import ReserveText from "../layout/ReserveText";
import Reserve from "../layout/Reserve";
import Image from "@/components/ui/image";
import { useFooterVisibility } from "@/lib/hooks/useFooterVisibility";
import { useMemo, useRef } from "react";
import { IAttachment } from "@/types/products";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const VideoPageLayout = ({
  children,
  title,
  description,
  imageSrc,
  pageImages,
  showReserve = true,
  loading = false,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  imageSrc?: string;
  pageImages?: IAttachment[];
  showReserve?: boolean;
  loading?: boolean;
}) => {
  const isFooterVisible = useFooterVisibility();
  const images = useMemo(
    () =>
      pageImages?.flatMap((image) =>
        typeof image?.url === "string" && image.url.trim()
          ? [image.url]
          : [],
      ) || [],
    [pageImages],
  );
  const autoplay = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  );

  return (
    <div className="space-y-10 lg:space-y-15">
      <div className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-screen overflow-hidden">
        {loading && !imageSrc && images.length === 0 ? (
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full scale-110 blur-2xl bg-gradient-to-b from-neutral-600 via-neutral-800 to-neutral-900 animate-pulse" />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ) : (
          // <MainVideo />
          <div className="absolute inset-0 z-0">
            {images.length > 0 ? (
              <Carousel
                opts={{ loop: true }}
                plugins={images.length > 1 ? [autoplay.current] : []}
                className="h-full w-full [&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]>div]:h-full"
              >
                <CarouselContent className="ml-0 h-full">
                  {images.map((src, index) => (
                    <CarouselItem
                      className="h-full pl-0"
                      key={`${src}-${index}`}
                    >
                      <Image
                        src={src}
                        alt="hero background"
                        className="w-full h-full object-cover"
                        width={1920}
                        height={1080}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <Image
                src={imageSrc || "/images/bg-home.png"}
                alt="hero background"
                className="w-full h-full object-cover"
                width={1920}
                height={1080}
              />
            )}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}

        <ReserveText title={title} text={description} loading={loading} />

        {showReserve && (
          <Reserve
            className={`fixed right-0 left-0 bottom-4 px-4 md:px-0 lg:px-0 sm:bottom-4 lg:bottom-4 transition-all duration-500 ease-in-out transform z-40 ${
              isFooterVisible
                ? "opacity-0 pointer-events-none translate-y-full"
                : "opacity-100 translate-y-0"
            }`}
          />
        )}
      </div>

      {children}
    </div>
  );
};

export default VideoPageLayout;
```

**Internal composition.** `MainVideo` (imported, **commented out** at line 61), `ReserveText`, `Reserve`, `ui/image`, `ui/carousel` + `embla-carousel-autoplay`, and `useFooterVisibility`.

**State / hooks.**
- `useFooterVisibility()` — a scroll listener that does `document.querySelector("footer")` and compares `getBoundingClientRect().top` to `window.innerHeight`, returning `true` once the footer enters the viewport. Full source:

```ts
// src/lib/hooks/useFooterVisibility.ts
export const useFooterVisibility = () => {
  const [isFooterVisible, setIsFooterVisible] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector("footer")
      if (!footer) return
      const footerRect = footer.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const isVisible = footerRect.top <= windowHeight
      setIsFooterVisible(isVisible)
    }
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  return isFooterVisible
}
```
- `useMemo` normalises `pageImages` → `string[]`, dropping non-string/empty URLs.
- `useRef(Autoplay({ delay: 4000 }))` — a plugin instance in a ref, so it is not recreated each render.

**Three-way hero image decision** (this is the interesting logic):
1. `loading && !imageSrc && images.length === 0` → blurred gradient skeleton.
2. `images.length > 0` → looping Embla carousel with 4s autoplay; the autoplay plugin is only attached when there is more than one image.
3. otherwise → single `imageSrc`, falling back to `/images/bg-home.png`.

**Styling.** `space-y-10 lg:space-y-15` is the site-wide section rhythm. Hero: `relative min-h-[60vh] md:min-h-[70vh] lg:min-h-screen overflow-hidden`. Carousel height is forced through arbitrary-variant selectors on the shadcn slot attributes: `[&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]>div]:h-full`. The booking bar is `fixed … z-40` with an opacity + `translate-y-full` slide-out when the footer approaches.

**Brand content.** `alt="hero background"` (×2, hardcoded English), `/images/bg-home.png` fallback, and the 40% scrim `bg-black/40`.

**GENERALIZED version**

```tsx
type VideoPageLayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  imageSrc?: string;
  pageImages?: IAttachment[];
  showReserve?: boolean;
  loading?: boolean;
  heroFallback?: string;      // ← was "/images/bg-home.png"
  scrimClassName?: string;    // ← was "bg-black/40"
  heroAlt?: string;           // ← was "hero background"
};

const VideoPageLayout = ({ … }: VideoPageLayoutProps) => {
  // identical logic. Optionally rename to <HeroPageLayout/> since video is disabled,
  // or restore <MainVideo/> behind a `media: "video" | "images"` prop.
};
```

---

### 3.8 `src/components/clientPages/DefaultPageLayout.tsx` — 22 lines

**Props interface** (inline + `PropsWithChildren`)

```tsx
{ className?: string } & PropsWithChildren
```

**FULL REAL SOURCE**

```tsx
"use client"

import { cn } from "@/lib/utils"
import { PropsWithChildren } from "react"

const DefaultPageLayout = ({
  children,
  className,
}: { className?: string } & PropsWithChildren) => {
  return (
    <div
      className={cn(
        className,
        "container relative mt-20 py-10 min-h-[50vh] sm:min-h-[60vh] lg:min-h-screen"
      )}
    >
      {children}
    </div>
  )
}

export default DefaultPageLayout
```

**Why it is in the top 15.** It has **19 importers** — more than any other component except `Button` and `ui/image`. It is the interior-page counterpart to `VideoPageLayout` and the reason both `mt-20` (to clear the `fixed` header) and the `min-h-*` ladder are consistent across 19 pages.

**Styling.** `container relative mt-20 py-10 min-h-[50vh] sm:min-h-[60vh] lg:min-h-screen`. `className` is merged **first** in `cn()`, so caller classes win over the defaults via `twMerge` — that is the intended override mechanism, used everywhere: `<DefaultPageLayout className="space-y-8 lg:space-y-12">`.

**Note.** `"use client"` is present but unnecessary — no hooks, no handlers. 8 pages import it only to render static CMS content.

**GENERALIZED version**

```tsx
import { cn } from "@/lib/utils";

type DefaultPageLayoutProps = {
  children: React.ReactNode;
  className?: string;
  /** Height of the sticky header, used as the top offset. */
  headerOffsetClassName?: string;   // ← was hardcoded "mt-20"
};

const DefaultPageLayout = ({ children, className, headerOffsetClassName = "mt-20" }: DefaultPageLayoutProps) => (
  <div className={cn(className, "container relative", headerOffsetClassName,
                      "py-10 min-h-[50vh] sm:min-h-[60vh] lg:min-h-screen")}>
    {children}
  </div>
);
export default DefaultPageLayout;
```

---

### 3.9 `src/components/LanguageSwitch.tsx` — 74 lines

**Props interface**

```ts
interface LanguageSwitcherProps {
  isScrolled: boolean;
}
```

**FULL REAL SOURCE**

```tsx
"use client"

import { useParams, usePathname, useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

const languages = [
  { code: "en", label: "English" },
  { code: "mn", label: "Монгол" },
]

interface LanguageSwitcherProps {
  isScrolled: boolean
}

export default function LanguageSwitcher({ isScrolled }: LanguageSwitcherProps) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentLocale = params.locale as string
  const currentLanguage = languages.find((lang) => lang.code === currentLocale)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLanguageChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.split("/").slice(2).join("/")
    const query =
      typeof window !== "undefined"
        ? window.location.search.replace(/^\?/, "")
        : ""

    router.push(`/${newLocale}/${pathWithoutLocale}${query ? `?${query}` : ""}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 font-medium text-sm px-2 py-1 ${
          isScrolled ? "text-gray-900" : "text-white"
        }`}
      >
        {currentLanguage?.code.toUpperCase()}
        <ChevronDown className={`size-4 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`absolute right-0 top-full mt-1 z-50 min-w-32 rounded-md border bg-white shadow-md py-1 transition-all duration-200 origin-top ${
        open ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95 pointer-events-none"
      }`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              {lang.label}
            </button>
          ))}
      </div>
    </div>
  )
}
```

**Composition / state.** No children beyond two buttons. `open` local state, `ref` for outside-click detection on `mousedown`.

**The locale-switch mechanism — this is the important part.** It imports `usePathname` and `useRouter` from **`next/navigation`**, not from `@/i18n/navigation`. next-intl exports locale-aware versions of both, and the locale-aware `useRouter` is the correct tool. Instead the component:

1. Takes `pathname` (which **still contains** the locale segment for `next/navigation`'s `usePathname`).
2. `pathname.split("/").slice(2).join("/")` — strips the leading empty string and the locale segment. For `/en/booking` this yields `booking`, so the pushed URL becomes `/mn/booking` — correct, but with **no leading slash**.
3. Preserves the query string by reading `window.location.search` directly.
4. Calls `router.push()`.

Edge cases this breaks on: a root path `/en` yields `""` → pushes `/mn/` (trailing slash, works but differs from `/mn`); `hash` is dropped entirely; and because `next/navigation`'s `router.push` is not locale-aware, it will re-run middleware on a URL that already has the prefix — harmless but redundant.

**Styling.** Trigger `text-sm px-2 py-1` with a `isScrolled` colour swap. Panel: `absolute right-0 top-full mt-1 z-50 min-w-32 rounded-md border bg-white shadow-md py-1`, closed state `opacity-0 scale-y-95 pointer-events-none`. `scale-y-95` is a valid Tailwind value (95% of the theme scale). **The trigger `<button>` has no `type` attribute** — inside the booking bar's `<form>` this would default to `type="submit"`; here it is in the header, so no impact, but it is a latent bug.

**Brand content.** The `languages` array with native endonyms `English` / `Монгол` is hardcoded, and the locale codes `en`/`mn` are duplicated here instead of being read from `src/i18n/routing.ts`.

**GENERALIZED version**

```tsx
"use client"

import { useParams, useLocale } from "next-intl";
import { useTransition } from "react";
import { routing, usePathname, useRouter } from "@/i18n/navigation";

const languages = [
  { code: "en", label: "English" },
  { code: "mn", label: "Монгол" },
  // ← derive codes from `routing.locales`; endonyms are legitimate to hardcode
];

export default function LanguageSwitcher({ isScrolled }: { isScrolled: boolean }) {
  const router = useRouter();          // locale-aware
  const pathname = usePathname();      // locale-aware: already stripped
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
      // next-intl preserves the query string for you — no manual window.location.read
    });
  };

  return (
    /* … same markup, plus `disabled={isPending}` / `aria-busy` on the trigger … */
  );
}
```

---

### 3.10 `src/components/ui/image.tsx` — 115 lines

**Props interface**

```tsx
export type CommonImageProps = Omit<
  Omit<Omit<NextImageProps, "alt">, "src">,
  "fill"
>;

type ImageProps = CommonImageProps & {
  src?: unknown;
  alt?: string;
  skipAnimation?: boolean;
};
```

**Purpose.** The application's mandatory image component. 51 importers. It does five things no plain `next/image` does: (1) resolve CMS storage keys to URLs, (2) blur→sharp load animation, (3) route remote images through a Cloudflare Image loader, (4) pick a device-appropriate source width, (5) fall back to a placeholder on error.

**FULL REAL SOURCE**

```tsx
"use client";

import NextImage, { ImageProps as NextImageProps } from "next/image";

import { cn, readFile } from "@/lib/utils";
import cloudflareLoader from "@/lib/image-loader";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";

const PLACEHOLDER = "/images/metaBackground.jpg";

const Image = ({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  skipAnimation,
  quality,
  ...restProps
}: ImageProps) => {
  const fixedSrc = readFile(src || "");
  const [srcI, setSrcI] = useState(fixedSrc || PLACEHOLDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextSrc = fixedSrc || PLACEHOLDER;
    setSrcI(nextSrc);
    setLoading(true);
  }, [fixedSrc]);

  const getLoader = () => {
    if (srcI.includes("//:localhost") || srcI.startsWith("/")) return undefined;
    return cloudflareLoader;
  };

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 480px)");

  //  TODO: use srcSet etc.
  const getWidth = () => {
    const fallbackWidth = "1200";

    if (isDesktop) return width?.toString() || fallbackWidth;

    const widthNum = parseInt(width?.toString() || "0");

    if (isTablet && widthNum > 768) return "768";

    if (widthNum > 480) return "480";

    return widthNum > 0 ? widthNum.toString() : fallbackWidth;
  };

  const handleComplete = () => setLoading(false);
  const onError = () => {
    if (srcI !== PLACEHOLDER) {
      setSrcI(PLACEHOLDER);
    }
  };
  const fill = (!width && !height) || undefined;
  const fromCF = srcI.includes("https://imagedelivery.net/");
  return (
    <NextImage
      {...restProps}
      quality={quality}
      src={
        fromCF
          ? cloudflareLoader({
              src: srcI,
              width: parseInt(getWidth() || "480"),
              quality: parseInt(quality?.toString() || "75"),
            })
          : srcI
      }
      loader={getLoader()}
      onLoad={handleComplete}
      onError={onError}
      alt={alt || ""}
      fill={fill}
      width={width}
      height={height}
      unoptimized={fromCF}
      className={cn(
        "object-cover",
        !skipAnimation && loading
          ? "scale-110 blur-2xl grayscale"
          : "scale-100 blur-0 grayscale-0",
        srcI === PLACEHOLDER && "object-contain",
        className,
      )}
      sizes={
        fill
          ? sizes ||
            `(max-width: 768px) 20vw,
      (max-width: 1200px) 15vw,
      15vw`
          : undefined
      }
    />
  );
};

export type CommonImageProps = Omit<
  Omit<Omit<NextImageProps, "alt">, "src">,
  "fill"
>;

type ImageProps = CommonImageProps & {
  src?: unknown;
  alt?: string;
  skipAnimation?: boolean;
};
export default Image;
```

**The `readFile()` contract** (`src/lib/utils.ts:46-63`) — this is why `src` is typed `unknown`:

```ts
export const READ_FILE = "/read-file?key=";

export const readFile = (value?: unknown) => {
  const url = getAttachmentUrl(value);          // string | {url} | ""
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.includes(READ_FILE)) {                // already a full read-file URL
    const apiUrl = url.split(READ_FILE)[0];
    return url.replace(apiUrl, process.env.NEXT_PUBLIC_MAIN_API_DOMAIN || "");
  }
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;
  return process.env.NEXT_PUBLIC_MAIN_API_DOMAIN + READ_FILE + encodeStorageKey(url);
};
```

So a CMS attachment key like `erxes-saas/…/image.jpg` becomes `NEXT_PUBLIC_MAIN_API_DOMAIN + "/read-file?key=" + encodeURIComponent(key).replace(/%2F/g, "/")`. `getAttachmentUrl` also unwraps `{url}` objects, which is why callers can pass `item?.thumbnail?.url` *or* the attachment object itself.

**State / hooks.** `srcI: string`, `loading: boolean`. `useEffect` resets both whenever `fixedSrc` changes. `useMediaQuery("(min-width: 768px)")` and `"(min-width: 480px)"` drive `getWidth()`.

**Styling / animation.** The blur→sharp effect is pure CSS class swap, no framer-motion:
- loading: `scale-110 blur-2xl grayscale`
- loaded: `scale-100 blur-0 grayscale-0`
- transition comes from `transition-all` supplied by the **caller** — `ui/image` sets no transition class of its own, so callers that forget `transition-*` get an instant snap.
- `skipAnimation` disables the loading state entirely (used once, by `Footer` mobile logo).

**The two-provider split.** `srcI.includes("https://imagedelivery.net/")` (`fromCF`) means the URL is *already* a Cloudflare-transformed URL, so the component calls `cloudflareLoader` imperatively and passes `unoptimized={true}` (double-transform avoidance). Otherwise it passes `cloudflareLoader` as `loader` for any non-local URL.

**Brand content / config.** `PLACEHOLDER = "/images/metaBackground.jpg"`; default `quality` `75`; fallback width `"1200"`; the hardcoded `sizes` ladder. Also note `fill` is **derived** (`(!width && !height)`) even though `fill` was explicitly removed from the props type — so passing `fill` is impossible, and `width`/`height` are both forwarded even when `fill` is true (Next ignores them then).

**GENERALIZED version**

```tsx
export const IMAGE_CONFIG = {
  placeholder: "/images/placeholder.jpg",
  defaultQuality: 75,
  fallbackWidth: 1200,
  cdnHost: "https://imagedelivery.net",   // makes the provider check configurable
  transitions: "transition-all duration-700 ease-out",  // ← callers currently must remember
};

type ImageProps = CommonImageProps & {
  src?: unknown;
  alt?: string;
  skipAnimation?: boolean;
};

const Image = ({ … }: ImageProps) => {
  // Keep: readFile resolution, blur→sharp, media-query width, error fallback.
  // Change: placeholder/quality/width from IMAGE_CONFIG;
  //        add the transition class here instead of at every call site;
  //        use `alt={alt}` and let a lint rule enforce non-empty alt rather than `alt || ""`.
};
```

---

### 3.12 `src/components/ScrollStack.tsx` — 119 lines

**Props interface**

```ts
interface ScrollStackItem {
  thumbnail: { url: string };
  title: string;
  excerpt: string;
}

interface ScrollStackProps {
  items: ScrollStackItem[];
}
```

**Purpose.** The site's signature scroll effect: a series of full-bleed cards that stick and fan out as you scroll. Consumed once, by `WhyChooseUs`.

**FULL REAL SOURCE**

```tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "./ui/image"
import { Sun } from "lucide-react"

interface ScrollStackItem {
  thumbnail: { url: string }
  title: string
  excerpt: string
}

interface ScrollStackProps {
  items: ScrollStackItem[]
}

const DESKTOP_LAYER_GAP = 72
const MOBILE_LAYER_GAP = 40

function StackCard({
  item,
  index,
  total,
  gap,
}: {
  item: ScrollStackItem
  index: number
  total: number
  gap: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start 65%", "start 45%"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [120, index * gap])

  return (
    <motion.div
      ref={cardRef}
      style={{ y, zIndex: index + 1 }}
      className='sticky top-20 md:top-28 lg:top-32'
    >
      <div className='relative overflow-hidden rounded-[24px] md:rounded-[28px] shadow-2xl ring-1 ring-black/5 bg-black'>
        <Image
          src={item.thumbnail.url}
          alt={item.title}
          className='w-full h-[50vh] md:h-[60vh] lg:max-h-[620px] object-cover'
          width={1920}
          height={1080}
        />

        <div className='absolute top-0 left-0 w-full h-full bg-black/30'></div>

        <div className='absolute left-6 top-6 z-[1]'>
          <div className='flex items-center gap-2'>
            <div className='rounded-full border border-white backdrop-blur-sm text-white p-1 lg:p-2'>
              <Sun className='size-4 lg:size-5' />
            </div>

            <div className='rounded-full border border-white backdrop-blur-sm text-white px-2 lg:px-2 lg:py-1.5'>
              <span className='text-[10px] lg:text-xs font-roboto uppercase'>
                {item?.title || "HEALING OASIS HIDDEN AMONG THE DUNES"}
              </span>
            </div>
          </div>
        </div>

        <div className='absolute inset-x-0 bottom-0 p-4 md:p-6 lg:p-8 text-white'>
          <p className='text-sm md:text-base lg:text-lg font-roboto leading-5 lg:leading-6 text-white'>
            {item?.excerpt || "..."}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

const ScrollStack: React.FC<ScrollStackProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)")
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener?.("change", update)
      ; (mql as any).addListener?.(update)
    return () => {
      mql.removeEventListener?.("change", update)
        ; (mql as any).removeListener?.(update)
    }
  }, [])

  const gap = isMobile ? MOBILE_LAYER_GAP : DESKTOP_LAYER_GAP
  const heightPerItemVh = isMobile ? 70 : 80

  return (
    <div
      ref={containerRef}
      className='relative mb-24 md:mb-44'
      style={{ height: `${Math.max(items.length, 1) * heightPerItemVh}vh` }}
    >
      {items.map((item, index) => (
        <StackCard
          key={index}
          item={item}
          index={index}
          total={items.length}
          gap={gap}
        />
      ))}
    </div>
  )
}

export default ScrollStack
```

**The effect, precisely.** Each `StackCard` gets its own `useScroll({ target: cardRef, offset: ["start 65%", "start 45%"] })`. As the card travels through that 20%-of-viewport window, `scrollYProgress` goes 0→1 and `y` is transformed from `120` (pushed down) to `index * gap` (its final stacked offset). Because every card is `sticky` at the same `top-*` offset, they pile up at the top of the container; `zIndex: index + 1` makes later cards stack *above* earlier ones, and the container's explicit `height` (`items.length * 70|80` vh) creates the scroll runway.

**The `isMobile` detection.** `window.matchMedia("(max-width: 640px)")` with both the modern `addEventListener("change")` and the legacy `addListener` APIs, glued together with a stray leading semicolon (`; (mql as any).addListener?.(update)`). This is the only `matchMedia` usage in `src/components`; everywhere else uses `useMediaQuery` from `src/lib/use-media-query.tsx`.

**Unused parameters.** `StackCard` receives `total` and never uses it. `containerRef` is attached but never read.

**Defects.**
1. **`isMobile` defaults to `false`** and is only corrected in an effect, so the first client render (and SSR) always uses `DESKTOP_LAYER_GAP = 72` and `heightPerItemVh = 80`. Mobile users see a layout shift on hydration.
2. **Hardcoded English fallback string** `"HEALING OASIS HIDDEN AMONG THE DUNES"` at line 65 — English marketing copy baked into a component, shown whenever `item.title` is empty. It is not in `messages/en.json` or `messages/mn.json` and has no Mongolian counterpart.
3. `key={index}` on a CMS-driven list — use `item.thumbnail.url` or a real id.

**Styling.** `sticky top-20 md:top-28 lg:top-32`; card `rounded-[24px] md:rounded-[28px] shadow-2xl ring-1 ring-black/5 bg-black`; height `h-[50vh] md:h-[60vh] lg:max-h-[620px]`; scrim `bg-black/30`; badge pills `rounded-full border border-white backdrop-blur-sm`.

**GENERALIZED version**

```tsx
const SCROLL_STACK_CONFIG = {
  desktopLayerGapPx: 72,
  mobileLayerGapPx: 40,
  desktopItemHeightVh: 80,
  mobileItemHeightVh: 70,
  stickyTopClassName: "top-20 md:top-28 lg:top-32",
  cardOffsetRange: ["start 65%", "start 45%"],
  enterOffsetPx: 120,
} as const;

const ScrollStack = ({ items }: ScrollStackProps) => {
  // isMobile: initialise from a `useMediaQuery("(max-width: 640px)")` hook so SSR
  //           and first client render agree — no `useState(false)` + effect flash.
  // Empty-string fallbacks: render nothing instead of "HEALING OASIS …" / "...".
  // key: item.id ?? item.thumbnail.url
  // Add `prefers-reduced-motion` guard: fall back to a static non-fanned list.
};
```

---

### 3.14 `src/components/BannerSection.tsx` — 167 lines

**Props interface** (inline)

```tsx
{ isShow?: boolean; isContainer?: boolean }
```

**Purpose.** A "getting here" banner: CMS heading, a **lazily-mounted 3D-tour iframe**, three travel facts (location / airport / drive time), and a Google Maps directions link. The lazy-mount-then-destroy pattern is the interesting part.

**FULL REAL SOURCE**

```tsx
"use client";

import { Link } from "@/i18n/navigation";
import { useCmsPageDetail } from "@/sdk/queries/cms";
import { CarFront, MapPin, Plane, ArrowRight, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const BannerSection = ({
  isShow = true,
  isContainer = false,
}: {
  isShow?: boolean;
  isContainer?: boolean;
}) => {
  const params = useParams();
  const currentLocale = params.locale as string;
  const t = useTranslations("Getting");

  const { page, refetch } = useCmsPageDetail(
    "bannerdesctiption",
    currentLocale,
  );

  useEffect(() => {
    refetch();
  }, [currentLocale]);

  const [render3DLoaded, setRender3DLoaded] = useState(false);
  const iframeWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!render3DLoaded) return;

    const handleVisibility = () => {
      if (document.hidden) setRender3DLoaded(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio === 0) setRender3DLoaded(false);
      },
      { threshold: 0 }
    );
    if (iframeWrapperRef.current) observer.observe(iframeWrapperRef.current);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
    };
  }, [render3DLoaded]);

  const srcBanner3D =
    "https://share.d5render.com/user-hub/showreel/shortLink/z6Epvr";

  const data = [
    {
      icon: <MapPin />,
      title: (
        <p className="text-black font-roboto text-xs sm:text-[14px] not-italic font-normal leading-[16px] sm:leading-[18px]">
          {t("bulgan sum")} <br /> {t("south")}
        </p>
      ),
    },
    {
      icon: <Plane />,
      title: (
        <p className="text-black font-roboto text-xs sm:text-[14px] not-italic font-normal leading-[16px] sm:leading-[18px]">
          {t("Domestic")} <br /> {t("Chinghis Khaan")}
        </p>
      ),
    },
    {
      icon: <CarFront />,
      title: (
        <p className="text-black font-roboto text-xs sm:text-[14px] not-italic font-normal leading-[16px] sm:leading-[18px]">
          {t("Dalanzadgad")} <br /> {t("hours")}
        </p>
      ),
    },
  ];

  return (
    <div className={isContainer ? "container space-y-6" : "space-y-6"}>
      {isShow && (
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-normal leading-normal text-center text-black font-roboto lg:text-3xl">
            {page?.name || ""}
          </h2>
          <p className="mx-auto w-full text-xs font-normal leading-5 text-center text-black font-roboto lg:max-w-3xl lg:text-base">
            {page?.description || ""}
          </p>
        </div>
      )}

      <div>
        {render3DLoaded ? (
          <div ref={iframeWrapperRef} className="relative w-full h-[200px] md:h-[300px] lg:h-[550px]">
            <iframe
              src={srcBanner3D}
              title="Tegri Gobi 3D"
              className="w-full h-full rounded-[20px]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <button
              onClick={() => setRender3DLoaded(false)}
              className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setRender3DLoaded(true)}
            className="relative w-full h-[200px] md:h-[300px] lg:h-[550px] rounded-[20px] overflow-hidden group cursor-pointer"
            style={{ backgroundImage: "url('/images/banner.png')", backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-white/80 flex items-center justify-center backdrop-blur-sm bg-white/10 group-hover:bg-white/20 transition-all duration-300">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
              <span className="text-white font-roboto text-sm font-normal tracking-wide">
                {t("Load 3D View")}
              </span>
              <span className="text-white/70 font-roboto text-xs mt-1 text-center max-w-[280px] px-4">
                {t("3d performance warning")}
              </span>
            </div>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 justify-center items-center lg:items-center sm:justify-between sm:gap-6 pb-5">
        {data.map((data, index) => (
          <div
            key={index}
            className="w-full sm:w-auto lg:flex-1 flex items-center justify-center sm:justify-start gap-2 lg:gap-3 min-w-[220px]"
          >
            <div className="flex justify-center items-center w-6 h-6 sm:w-7 sm:h-7">
              {data.icon}
            </div>
            <div className="text-xs font-normal leading-4 text-center text-black font-roboto lg:text-sm sm:text-left">
              {data.title}
            </div>
          </div>
        ))}

        <Link
          href="https://www.google.com/maps/search/44.151772,+103.659412?entry=tts&g_ep=EgoyMDI1MDYwMS4wIPu8ASoASoASAFQAw%3D%3D&skid=6b6987a5-b618-49ef-a846-754d25d0f2b4"
          target="_blank"
          className="flex gap-2 justify-center items-center w-full sm:w-auto sm:justify-end sm:ml-auto lg:ml-0"
        >
          <span className="text-xs font-normal leading-4 text-black font-roboto lg:text-sm">
            {t("Get Directions")}
          </span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};
export default BannerSection;
```

> **Transcription note.** The `href` above has a mangled `g_ep` parameter. The real string is `https://www.google.com/maps/search/44.151772,+103.659412?entry=tts&g_ep=EgoyMDI1MDYwMS4wIPu8ASoASAFQAw%3D%3D&skid=6b6987a5-b618-49ef-a846-754d25d0f2b4` (line 154). Verify against the file before copying.

**The lazy-3D pattern — the most transferable idea in this component.**

```
state: render3DLoaded (false)
placeholder <button> with a CSS background-image poster + Play icon
  ↓ click
render3DLoaded = true  →  effect runs, mounts listeners:
    document "visibilitychange" → if document.hidden, setRender3DLoaded(false)
    IntersectionObserver(threshold: 0) on iframeWrapperRef
        → if entry.intersectionRatio === 0, setRender3DLoaded(false)
  ↓
<iframe> mounts; both listeners are torn down on unmount
  → manual close button also sets it false
```

The iframe is **never in the DOM until explicitly requested**, and it is **destroyed as soon as it leaves the viewport or the tab is hidden.** That is the correct way to embed a heavy third-party 3D viewer. The placeholder uses an inline `style={{ backgroundImage: "url('/images/banner.png')" }}` instead of the `ui/image` component or a Tailwind arbitrary background — bypassing both the blur-animation and the `remotePatterns` config.

**State / hooks.** `render3DLoaded: boolean`, `iframeWrapperRef`, `useCmsPageDetail("bannerdesctiption", locale)` (note the misspelling of "description"), plus 2 `useEffect`s.

**Brand content — all hardcoded.**

| Content | Value | Line |
|---|---|---|
| 3D-tour iframe URL | `https://share.d5render.com/user-hub/showreel/shortLink/z6Epvr` | 55-56 |
| iframe `title` | `"Tegri Gobi 3D"` | 103 |
| Poster image | `/images/banner.png` (inline style) | 120 |
| Maps directions URL | full Google Maps search URL with coordinates + `skid` | 154 |
| Fact copy keys | `t("bulgan sum")`, `t("Chinghis Khaan")`, `t("Dalanzadgad")` | 63, 71, 79 |

The place names *are* in messages (so they are translatable), but they are geographically specific to this resort and belong in config, not in a shared `Getting` namespace. The map URL embeds real GPS coordinates and a place UUID inline.

**GENERALIZED version**

```tsx
type BannerSectionProps = {
  isShow?: boolean;
  isContainer?: boolean;
  /** From config/CMS, never hardcoded. */
  virtualTourUrl?: string;
  posterSrc?: string;
  directionsUrl?: string;
  facts?: { icon: React.ReactNode; lines: [string, string] }[];
};

const BannerSection = ({ virtualTourUrl, posterSrc, directionsUrl, facts = [], ...rest }: BannerSectionProps) => {
  // Keep: lazy-mount + IntersectionObserver + visibilitychange teardown.
  // Change: poster via <Image src={posterSrc} className="…"/> instead of inline
  //         backgroundImage so it participates in the loader + placeholder system;
  //         iframe `title` from a message key;
  //         facts come from props/config rather than a local const.
  // Config keys: SITE.virtualTour.url, SITE.map.directionsUrl, SITE.locations.facts
};
```

---

### 3.15 `src/containers/auth/current-user.tsx` — 131 lines

**Props interface**

```ts
interface CurrentUserProps {
  isScrolled: boolean;
}
```

**Purpose.** The header's account widget. Three states: loading spinner, signed-in avatar dropdown, signed-out "Sign in" pill. It lives in `containers/` because it is app-level chrome rather than a page section, and it is the only file in `containers/` imported by another container (well — by `layout/`).

**FULL REAL SOURCE**

```tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/sdk/queries/auth"
import { Loader2Icon, LogOut, Briefcase, User } from "lucide-react"
import { Link, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { useLogout } from "@/sdk/mutations/auth"
import { useTranslations } from "next-intl"

interface CurrentUserProps {
  isScrolled: boolean
}

const CurrentUser = ({ isScrolled }: CurrentUserProps) => {
  const t = useTranslations("Header")

  const { currentUser, setLoading, loading } = useCurrentUser()
  const { logout } = useLogout()

  // Come back to wherever the user was (query string included, so in-progress
  // bookings keep their selection) instead of dropping them on the home page.
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const from = `${pathname}${search ? `?${search}` : ""}`
  const isAuthPage = /^\/(login|signup|company-signup|forgot-password|reset-password|verify)/.test(
    pathname,
  )
  const loginHref = isAuthPage
    ? "/login"
    : `/login?from=${encodeURIComponent(from)}`

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      setLoading(false)
    }
  }, [setLoading])

  if (loading)
    return (
      <div className='flex justify-center items-center w-9 h-9'>
        <Loader2Icon className='w-5 h-5 animate-spin' />
      </div>
    )

  if (currentUser) {
    const { firstName, avatar, lastName, username } = currentUser
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || username || "User"
    return (
      <div className='relative'>
        <Menubar className='p-0 bg-transparent border-none shadow-none' asChild>
          <MenubarMenu>
            <MenubarTrigger className='cursor-pointer p-0 border-none bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent'>
              <div className='relative group'>
                <Avatar className='w-8 h-8 ring-2 ring-transparent transition-all duration-200 sm:h-9 sm:w-9 lg:h-10 lg:w-10 group-hover:ring-primary/20'>
                  <AvatarImage src={avatar} alt={displayName} />
                  <AvatarFallback className='text-xs font-semibold bg-primary text-primary-foreground sm:text-sm'>
                    {(firstName || username || "U")[0].toUpperCase()}
                    {(lastName || "")[0]?.toUpperCase() || ""}
                  </AvatarFallback>
                </Avatar>
              </div>
            </MenubarTrigger>
            <MenubarContent className='p-2 mt-2 mr-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg sm:w-52 lg:w-56 xl:w-60 sm:mr-0'>
              <div className='px-2 py-2 mb-2 border-b border-gray-100 sm:px-3'>
                <p className='text-xs font-medium text-gray-900 truncate sm:text-sm'>
                  {displayName}
                </p>
                <p className='text-xs text-gray-500 truncate'>
                  {currentUser.email || "user@example.com"}
                </p>
              </div>

              <Link href={"/profile">
                <MenubarItem className='gap-2 px-2 py-2 rounded-md transition-colors cursor-pointer sm:gap-3 sm:px-3 hover:bg-gray-50'>
                  <User className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0' />
                  <span className='text-xs font-medium sm:text-sm'>
                    {t("Profile")}
                  </span>
                </MenubarItem>
              </Link>

              <MenubarSeparator className='my-1.5 sm:my-2 bg-gray-200' />

              <MenubarItem
                className='gap-2 px-2 py-2 text-red-600 rounded-md transition-colors cursor-pointer sm:gap-3 sm:px-3 hover:bg-red-50 hover:text-red-700'
                onClick={() => logout()}
              >
                <LogOut className='w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0' />
                <span className='text-xs font-medium sm:text-sm'>
                  {t("Log out")}
                </span>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    )
  }

  return (
    <Button
      asChild
      variant='link'
      className={`bg-transparent rounded-full px-3 sm:px-4 lg:px-5 xl:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200
      border border-white sm:border-0
      ${isScrolled ? "text-gray-900 border-gray-900" : "text-white border-white"}
    `}
    >
      <Link href={loginHref} className='no-underline hover:no-underline'>
        {t("SignIn")}
      </Link>
    </Button>
  )
}

export default CurrentUser
```

**Internal composition.** `ui/avatar`, `ui/button` (with `asChild`), `ui/menubar` (a Menubar used purely as a dropdown menu — the only consumer of `menubar.tsx`), `useCurrentUser`, `useLogout`.

**State / hooks / context.**
- **Jotai:** `useCurrentUser()` reads/writes `currentUserAtom` + `loadingUserAtom`. It is the only auth consumer.
- **`useEffect` + raw `sessionStorage.getItem("token")`** to short-circuit the loading state when nobody is signed in — the token store is read *outside* the Apollo/jotai layer, duplicating auth knowledge in a UI component.
- `usePathname` from `@/i18n/navigation` (locale-aware) + `useSearchParams` from `next/navigation` — **a mixed pair**, which works only because `next-intl`'s `usePathname` returns the un-prefixed path while `searchParams` is locale-agnostic.

**The `?from=` round-trip — a genuinely good pattern.** It builds `from` from pathname **plus the query string** (explicitly so an in-progress booking keeps its selections), skips the param when already on an auth page (no `/login?from=/login` loop), and `encodeURIComponent`s it. Note the target `/login` never reads `?from=` — nothing consumes it, so the round trip is half-implemented.

**Styling.** Three-step responsive avatar `w-8 h-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10`; ring highlight on hover `ring-2 ring-transparent … group-hover:ring-primary/20` (uses the `group` class here, correctly); menu width ladder `w-48 sm:w-52 lg:w-56 xl:w-60`; destructive row `text-red-600 hover:bg-red-50 hover:text-red-700`; signed-out pill has a **conflicting** `border border-white` (mobile) vs `sm:border-0`, plus `border-gray-900`/`border-white` swapped by `isScrolled` — so on mobile the unscrolled pill gets a white border on a transparent header and a gray border when scrolled, while desktop has no border at all.

**Defects.**
- **`<Link>` wrapping `<MenubarItem>`** (line 88) — a menu item is a `div` with a click handler, not an anchor; wrapping it in `Link` gives nested-interactive semantics and the link does not respond to the keyboard the way the menu does.
- `Briefcase` is imported but never used (leftover from a removed "My bookings" item).
- `currentUser.email || "user@example.com"` — a fake email shown when the API omits it.
- `"(firstName || username || "U")[0].toUpperCase()"` will throw if `firstName`/`username` is an empty string, since `""[0]` is `undefined`.
- The three-way state machine is `loading → signedIn → signedOut` via early returns, which is fine, but `loading` starts `true` globally, so **every** visitor sees a spinner in the header until `useCurrentUser` resolves.

**GENERALIZED version**

```tsx
interface CurrentUserProps {
  isScrolled: boolean;
  className?: string;
}

const CurrentUser = ({ isScrolled, className }: CurrentUserProps) => {
  const t = useTranslations("Header");
  const { currentUser, setLoading, loading } = useCurrentUser();
  const { logout } = useLogout();
  // Token check belongs in useCurrentUser / an auth provider, not in the UI component:
  //   useEffect(() => { if (!auth.isAuthenticated) setLoading(false) }, [auth]);
  // Render the profile row as a <MenubarItem asChild><Link/></MenubarItem>, not <Link><MenubarItem/>.
  // Fallback name/email: render empty strings, not "User" / "user@example.com".
  // Drop the unused Briefcase import; use `?.` when deriving initials.
  // Consume ?from= on the login page (containers/auth/login-form.tsx) to close the loop.
};
```

---

## 4. COMPOSITION RULES

### 4.1 `components/` vs `containers/` — the rule the reference actually follows

The reference has **no documented convention**; this is the emergent rule, derived from all 11 files in `src/containers`:

| Container file | Actually is | Fetch? | Passes props? | Rendering |
|---|---|---|---|---|
| `containers/config/currentConfig.tsx` | App-wide provider | Yes — `useQuery(queries.PmsBranchDetail)` → writes `currentConfigAtom` | No, only `children` | Full-screen gate: `<MainLoader/>` while loading, localized server-down screen on error (lines 25–37) |
| `containers/pricing/pricingPlans.tsx` | App-wide provider | Yes — `useQuery(cpPricingPlans)` + N× imperative `client.query()` in an effect → writes `accountDiscountsAtom`, `pricingPlanDetailsAtom` | No, only `children` | Pass-through `<>{children}</>` (line 119) |
| `containers/auth/current-user.tsx` | Chrome widget | Yes — `useCurrentUser()` (Jotai atom) | No (`isScrolled: boolean` from caller) | 3-state early-return: spinner / avatar menu / sign-in pill |
| `containers/auth/login-form.tsx` | Complete auth screen form | Yes — `useLogin` | No | Full form + inline zod schema |
| `containers/auth/register-form.tsx` | Complete auth screen form | Yes — OTP + terms flow | Yes — `mode: "customer" \| "company"` | Full form |
| `containers/auth/forgot-password-form.tsx` | Complete auth screen form | Yes | No | Full form |
| `containers/auth/reset-password-form.tsx` | Complete auth screen form | Yes, reads `?token=` | No | Full form |
| `containers/auth/verify.tsx` | Complete auth screen | Yes, reads `?email=&userId=` | No | Full screen |
| `containers/auth/auth-container.tsx` | Login⇄signup switcher | No | `initialView?` | **Dead — zero importers** |
| `containers/auth/private-route.tsx` | Client auth guard | No, reads `currentUserAtom` | No | **Dead — zero importers, never mounted** |
| `containers/auth/redirector.tsx` | Auth redirect helper | No | No | **Dead — zero importers** |

**The rule that emerges:**

> **`containers/` = app-scope stateful scaffolding — the two root providers, the header account widget, and the five complete auth form screens. Everything else belongs in `components/`.**

The boundary is **leaky in both directions**, and the leaks are worth naming explicitly:

- **Leak OUT of `containers/` → `components/`:** `containers/config/currentConfig.tsx:3` imports `components/ui/MainLoader`, so a container depends on a component. Acceptable, but it means `containers/` is not a "no-presentation" layer.
- **Leak INTO `containers/` from `app/`:** every auth form is rendered *directly* by a route file (`src/app/[locale]/(auth)/login/page.tsx:37` → `<LoginForm />`), with no page-body component in between. This is the one place where `containers/` substitutes for a `clientPages/` entry.
- **The real inconsistency:** `src/app/[locale]/booking/booking-layout.tsx` and `src/app/[locale]/booking/components/{BookingSteps,SelectedRoomsCard}.tsx` are layout chrome + a card, but they live in `app/`, not `components/`. They are then imported *by* `components/clientPages/bookingPages/*.tsx` (4 files) — **the dependency direction is inverted**: components reach up into `app/`. See AVOID in §7.
- **Two parallel "booking layout" concepts:** `app/[locale]/booking/booking-layout.tsx` (children-prop, room wizard, uses `BookingSteps`) vs `components/shared/BookingLayout.tsx` (form/onSubmit-prop, appointment wizard, uses `shared/forms/*`). Different props, different children, same name. See §7.

**What is NOT in `containers/`, despite being container-shaped:** all page bodies live in `components/clientPages/` (38 files). The `/activities/booking`, `/dining/booking`, `/spa-wellness/booking` routes render `components/clientPages/bookingPage/bookingPage.tsx` — an appointment wizard that never passes through `containers/` at all.

### 4.2 How containers fetch data and pass props

Three distinct patterns, none of them a shared abstraction:

**Pattern A — provider queries, publishes to a Jotai atom.** `containers/config/currentConfig.tsx:16-24`:

```tsx
const { data, loading, error } = useQuery(queries.PmsBranchDetail, {
  variables: { id: process.env.NEXT_PUBLIC_PMS_TOKEN },
  fetchPolicy: "cache-and-network",
});
useEffect(() => {
  if (data?.cpPmsBranchDetail) setCurrentConfig(data.cpPmsBranchDetail);
}, [data?.cpPmsBranchDetail, setCurrentConfig]);
```

Data is fetched **client-side** and pushed into a global atom; downstream components read the atom, never the provider. `containers/pricing/pricingPlans.tsx:29-117` does the same but adds a second phase: an effect that N+1-queries `cpPricingPlanDetail` per active plan id (`Promise.all(planKey.split(",").map(...))`) and reduces the results into `accountDiscounts`.

**Pattern B — client-side fetch, props down (the norm).** 41 route files under `src/app/[locale]/` import from `@/components/`, and **39 of them render a client page body with zero props.** Example `src/app/[locale]/page.tsx` in its entirety:

```tsx
import ClientHomePage from "@/components/clientPages/homePage/homePage";
export default function HomePage() { return <ClientHomePage />; }
```

The client page then fetches its own data: `homePage.tsx:21-22` calls `useCmsPageDetail("home", locale)` and `useCmsPosts()`. So the **page body is the data boundary, and it is always client-side.** This is the dominant pattern across `accommodation/page.tsx`, `tours/page.tsx`, `booking/page.tsx`, `tours/[id]/page.tsx`, etc.

**Pattern C — server fetch, props down (rare; 2 instances).**
1. `src/app/[locale]/forms/[slug]/page.tsx:24-42` — an `async` server component that awaits `getFormByCode(slug)`, renders a not-found branch server-side, then passes the result as a prop: `<FormsDetailPage form={form} />`.
2. `src/app/[locale]/(auth)/company-signup/page.tsx:27-44` — an `async` server component that awaits `cookies()` and passes a boolean: `<CompanySignupGate initialUnlocked={isUnlocked} />`.

**Everything else on the server side is metadata only.** `generateMetadata` is exported from 40 route files and is the *only* server-side data work in most of them, e.g. `src/app/[locale]/accommodation/[slug]/page.tsx:12` awaits `getCmsPostDetail(slug, locale)` purely to build `<title>`/`<meta>` — the rendered page never receives that data.

**Convention for props.** Server→client prop passing uses `generateMetadata` + a shared `IPageProps` type (`src/types`). Containers receive only presentation props (`isScrolled`, `mode`, `initialUnlocked`, `className`) and fetch everything else themselves.

### 4.3 How variants are implemented — two unrelated mechanisms

**Mechanism 1 — `cva` (`class-variance-authority`), used in exactly 3 files:**

| File | Line | Exported |
|---|---|---|
| `src/components/ui/button.tsx` | 7 | `buttonVariants` |
| `src/components/ui/badge.tsx` | 6 | `badgeVariants` |
| `src/components/ui/alert.tsx` | 6 | `alertVariants` |

`ui/button.tsx:7-36` declares 6 variants × 4 sizes and consumes them at line 53:

```tsx
className={cn(buttonVariants({ variant, size, className }))}
```

with `VariantProps<typeof buttonVariants>` merged into the props type (line 45) and `defaultVariants` at lines 31–34. It also exposes `asChild` via `@radix-ui/react-slot` (line 48), which is how `<Button asChild><Link/></Button>` works in `containers/auth/current-user.tsx`.

**Mechanism 2 — plain boolean/enum props with inline conditionals, used everywhere else.** There is no shared variant system for feature components. Actual call sites:

| Prop | Declared | Consumers |
|---|---|---|
| `showReserve` | `clientPages/VideoPageLayout.tsx:31` | `aboutUsPage.tsx:24` (`true`), `sustainabilityPage.tsx:25` (`false`); home/accommodation/tours use the `true` default |
| `isShow` / `isContainer` | `BannerSection.tsx:14-15` (inline type literal) | `homePage.tsx:43` (`isShow isContainer` both `true`), `aboutUsPage.tsx:34` (`isShow={false}`) |
| `hideCloseButton` / `fixedOpen` | `layout/Reserve.tsx:55-56` | `bookingPages/bookingPage.tsx:99` (`<Reserve hideCloseButton fixedOpen />`) |
| `showHeader` / `layout` | `NewsSection.tsx:20-21` | `src/app/[locale]/news/page.tsx:27` — `<NewsSection showHeader="true" layout="grid" />` |
| `activeTab` / `onTabChange` | `clientPages/toursPage/ToursHero.tsx` | `toursPage.tsx:14`, `useState("packages")` |

The boolean-prop branches are raw ternaries/`&&` in JSX, e.g. `BannerSection.tsx:86-87` (`isContainer ? "container space-y-6" : "space-y-6"` and `{isShow && (...)}`) and `VideoPageLayout.tsx:101` (`{showReserve && (...)}`). **Rule: `cva` is a `ui/`-primitive-only convention; feature components use ad-hoc booleans.**

**Anti-pattern worth naming:** `NewsSection.tsx:20` types `showHeader?: "false" | "true"` — a *string* union that reads like a boolean and is compared with `=== "false"` (line 126). `NewsSection` is the only component in the repo with this shape, and it is the sole call site (`news/page.tsx:27`), so it looks like a typo'd boolean.

### 4.4 The `cn()` helper

Defined once, `src/lib/utils.ts:18-20`:

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`clsx` resolves conditionals/falsy/arrays into a class string; `twMerge` (tailwind-merge) then resolves Tailwind conflicts so the *last* utility of the same specificity wins. `ClassValue` is imported as a type from `clsx` (line 2); `twMerge` from `tailwind-merge` (line 4).

**Usage is mandatory and consistent inside `ui/`** — `ui/button.tsx:53`, `ui/card.tsx`, `ui/dialog.tsx`, `ui/carousel.tsx`, `ui/tabs.tsx`, `ui/input.tsx`, `ui/textarea.tsx`, `ui/menubar.tsx`, `ui/sonner.tsx`, etc., all import `{ cn } from "@/lib/utils"`.

**Usage in feature components is inconsistent:**
- `cn` **with** the shadcn `className`-last idiom — `clientPages/DefaultPageLayout.tsx`, `clientPages/toursPage/tourDetailPage.tsx:11`, `booking/CancellationPolicy.tsx`, and the rest of `booking/`.
- **No `cn` at all, raw string concatenation** — `components/NewsSection.tsx` (line 214, the dot indicators), `components/Accommodation.tsx` (lines 130, 143), `components/layout/Reserve.tsx`, `containers/auth/current-user.tsx` (lines 104–106, a template-literal with a nested ternary). None of these three can be safely overridden by a caller's `className`, which is exactly why `NewsSection`'s dot classes are duplicated verbatim in `Accommodation.tsx` and `LodgeStays.tsx`.

The other four exports of `src/lib/utils.ts` used by components: `readFile` (line 46 — rewrites CMS `/read-file?key=` URLs onto `NEXT_PUBLIC_MAIN_API_DOMAIN`), `getIconByLabel` (line 84 — the EN/MN substring matcher), `getCurrencySymbol` (line 71), `getAttachmentUrl` (line 30).

### 4.5 Where the `"use client"` boundaries sit

**Verified counts:** of 196 `.tsx` files in `src/components`, **162 carry `"use client"` at line 1–3 and 34 do not.** All 11 `.tsx` files in `src/containers` carry it (verified individually). `src/app/[locale]/ApolloClient.tsx:1` carries it.

**The boundary is `src/app/[locale]/layout.tsx`.** The root layout is an `async` server component (line 49) that assembles the client stack top-down (lines 106–120):

```
NextIntlClientProvider   (next-intl client provider)
└── NuqsAdapter           nuqs → "nuqs/adapters/next/app"
    └── Apollo            src/app/[locale]/ApolloClient.tsx  ("use client")
        ├── CurrentConfigProvider    containers/config/currentConfig.tsx
        │   └── PricingPlansProvider containers/pricing/pricingPlans.tsx
        │       └── ConditionalLayout  components/layout/ConditionalLayout.tsx
        │           └── {children}       ← server page.tsx lands here
        └── (sibling) Toaster  components/ui/sonner.tsx
    └── (sibling) ErxesWidget  components/ErxesWidget.tsx
```

Everything **below** that point inherits the client bundle. There are exactly **3 islands of interactivity that stay server-side**: `generateMetadata` in every route file, `src/app/[locale]/(auth)/company-signup/page.tsx` (`cookies()`), and `src/app/[locale]/forms/[slug]/page.tsx` (`getFormByCode`).

**The 34 `.tsx` files without the directive fall into two groups — and the distinction matters:**

**(a) Direction-agnostic primitives (correct by omission).** shadcn-derived files where the directive is unnecessary because there are no hooks or event handlers: `ui/button.tsx`, `ui/card.tsx`, `ui/badge.tsx`, `ui/alert.tsx`, `ui/input.tsx`, `ui/textarea.tsx`, `ui/counter.tsx`, `ui/Icon.tsx`, `ui/Loader.tsx`, `ui/loading.tsx`, `ui/GridSkeleton.tsx`, `ui/SkeletonAppointment.tsx`, `ui/CustomImage.tsx`, `ui/password.tsx`, `ui/kibo-ui/video-player/index.tsx`, plus `layout/ReserveText.tsx`, `ReviewCard.tsx`, `merch/SectionHeading.tsx`, `fund/icons.tsx`, `spa-wellness/Stillness.tsx`, `dining/DiningTabs.tsx`, `dining/DiningAlaCarte.tsx`.

**(b) Files that are effectively client but undeclared (latent landmines).** These have **no directive but use hooks, Jotai, or Apollo** — they work only because every current importer is already a client component:

| File | Uses |
|---|---|
| `appointment/hooks/useAddDeal.tsx` | `useMutation` |
| `appointment/hooks/useBranches.tsx`, `useCategories.tsx`, `useDeals.tsx`, `useProducts.tsx`, `useUsers.tsx` | `useQuery` |
| `appointment/hooks/usePaymentModal.tsx` | `create<Store>` (Jotai) |
| `appointment/Info.tsx`, `appointment/time/TimeSlot.tsx` | hooks |
| `contact-us/Maps.tsx` | renders an `<iframe>` |
| `dining/GridImages.tsx`, `profile/components/bookingsCard.tsx` | state/handlers |

**A confirmed boundary violation exists:** `src/app/[locale]/booking/components/SelectedRoomsCard.tsx` has **no** `"use client"`, yet it is imported by `components/clientPages/bookingPages/bookingPage.tsx:23`. It imports `useAtomValue` from Jotai (Jotai hooks require a client component). It only builds because the importing client page makes it client. Same for `src/app/[locale]/booking/booking-layout.tsx` (no directive; uses `useEffect`, `useAtomValue`, `useRouter`) — imported by 4 client page bodies.

**Verified effective-client check:** every file in `src/app/` that has no `"use client"` imports **only** `"use client"`-bearing components or the 34 directive-less files above; the two group-(b) files reachable from a server file are `SelectedRoomsCard.tsx` (reached via the client `bookingPages/bookingPage.tsx`, not directly from a server file) and `fund/data.ts` (a pure `.ts` module of content strings, imported by `src/app/[locale]/fund/projects/[slug]/page.tsx` — legitimately server-safe).

### 4.6 Export and import style

**Default exports dominate the app layer.**

- **All 11 containers** export a default. Only `containers/auth/verify.tsx` additionally exports named (`export function Verify; export default Verify;`).
- **`components/clientPages/`** — 38 files, all default-only.
- **`components/layout/`** — 7 files, all default-only.
- **Root-level `src/components/*.tsx`** — 16 files, all default-only.

**Named exports dominate the feature/leaf layer.** Verified patterns:

| Folder | Export style | Files |
|---|---|---|
| `components/appointment/` | named only, no default (`export const useDeals = …`, `export const Info = …`, `export function AppointmentPicker(…)`) | `BackButton.tsx`, `HeaderAppointment.tsx`, `Info.tsx`, `Modal.tsx`, `products/{Category,CategoryForm,Product,ProductDetail,ProductForm}.tsx`, `time/{AppointmentPicker,AppointmentPickerDayRange,TimeSlot}.tsx`, all 8 `hooks/*` |
| `components/shared/forms/` | named only | all 6 files (`export const ConfirmForm`, `export const TimeForm`, …) |
| `components/common/` | named only | `privacy-terms-modal.tsx`, `success-popup.tsx`, `terms-modal.tsx` |
| `components/reserve/` | named functions | `date-picker.tsx` (`export function DatePicker`), `guest-counter.tsx`, `room-counter.tsx` |
| `components/ui/` | **shadcn convention**: `export { X, xVariants }` named, **zero** `export default` | 30 of 40 files |
| `components/ui/` | **local convention**: default export | `CustomImage.tsx`, `FourDotsLoader.tsx`, `GridSkeleton.tsx`, `Icon.tsx`, `image.tsx` (default + `export type CommonImageProps`), `Loader.tsx`, `MainLoader.tsx`, `responsive-test.tsx`, `SkeletonAppointment.tsx` |
| `components/ui/loading.tsx` | 4 named exports, no default | `LoadingIcon`, `LoadingWrapper`, `LoadingText` |

**So `ui/` is internally inconsistent** — 30 named-style vs 9 default-style — and a consumer must check per file. `ui/image.tsx` is the only one exporting both a default component and a named type.

**No barrel files.** `find` for `index.ts`/`index.tsx` under `src/components` and `src/containers` returns exactly one file — `src/components/ui/kibo-ui/video-player/index.tsx` — and that is a vendored `media-chrome` wrapper with real component exports, not a re-export barrel. **Every import in the codebase is a full deep path.**

**Import path style:**
- `@/` alias for everything cross-directory: `@/components/ui/card`, `@/containers/auth/login-form`, `@/sdk/queries/cms`, `@/store/reserve`, `@/lib/utils`, `@/i18n/navigation`, `@/types`.
- **Relative sibling imports** for files in the same folder: `homePage.tsx:12` (`from "../VideoPageLayout"`), `tourDetailPage.tsx:9-10` (`from "./TourItineraryAccordion"`), `BannerSection`'s `import Image from "./ui/image"` in `Accommodation.tsx`, and `Reserve.tsx` importing `./ReserveText`.
- **`@/app/…` imports from inside `components/`** — a layering violation, 5 occurrences (`bookingPages/{bookingPage,bookingConfirmPage,bookingDetailsPage,bookingPaymentPage}.tsx` → `@/app/[locale]/booking/booking-layout`; `bookingPage.tsx:23` → `@/app/[locale]/booking/components/SelectedRoomsCard`).
- **Locale-aware navigation only**: `Link`, `useRouter`, `usePathname` are imported from `@/i18n/navigation`, never from `next/link` / `next/navigation` — with one mixed exception, `containers/auth/current-user.tsx`, which takes `usePathname` from `@/i18n/navigation` (line 7) but `useSearchParams` from `next/navigation` (line 8). Plain `useParams` always comes from `next/navigation` (e.g. `NewsSection.tsx:17`, `BannerSection.tsx:8`).

---

## 5. REUSABILITY CLASSIFICATION

> **Every config key in the last column is PROPOSED.** The reference has **no feature-flag system**: there is no `features`/`flags` module, no `NEXT_PUBLIC_FEATURE_*` env var, and no runtime toggle anywhere in `src/`. Config is limited to `process.env.NEXT_PUBLIC_*` read directly at call sites. The keys below are therefore *design proposals for the rewrite*, not observations — every one is marked accordingly.

**Legend.** `CORE` = required by any hotel site built on this codebase. `OPTIONAL` = Tegri-Gobi-specific content or a third-party integration that a different hotel could drop. `CORE (conditionally)` = required, but only if the corresponding feature ships.

### 5.1 Root `src/components/*.tsx` (16 files)

| Component | Class | Reason | PROPOSED config key |
|---|---|---|---|
| `Accommodation.tsx` | **CORE** | Room list; joins CMS + PMS + pricing. The single most reused section (home + accommodation + lodge-stays) | — |
| `AccommodationList.tsx` | **CORE** | Home-page wrapper that adds a CMS heading around `Accommodation` | — |
| `WhyChooseUs.tsx` | **CORE** | Home hero section; only consumer of `ScrollStack` | — |
| `JourneySection.tsx` | **CORE** | Home section | — |
| `GallerySection.tsx` | **CORE** | Home section | — |
| `NewsSection.tsx` | **CORE** | Home section + standalone `/news` route | — |
| `MemoriesSection.tsx` | **CORE** | Home reviews carousel (Google Places via `api/google-reviews`) | `features.google_reviews` |
| `ReviewCard.tsx` | **CORE** | Testimonial card; `profile/components/ReviewSection.tsx` consumer | — |
| `SubscriptionSection.tsx` | OPTIONAL | Newsletter capture. **Commented out** at both call sites (`homePage.tsx:44`, `accommodationPage.tsx:73`) | `features.newsletter` |
| `BannerSection.tsx` | **CORE** (map/link) / OPTIONAL (3D tour) | "Getting here" block. The D5 iframe + GPS URL are resort-specific; the map/facts are not | `features.virtualTour.url`, `features.b3dUrl` |
| `ContentRenderer.tsx` | **CORE** | CMS rich-text renderer | — |
| `LanguageSwitch.tsx` | **CORE** | Locale switch, mounted by both headers | — |
| `ScrollStack.tsx` | **CORE** | Signature scroll effect, generic once copy is externalised | — |
| `LodgeStays.tsx` | **CORE** (conditionally) | Lodge/product list; only reached via `/lodge-stays` and `/accommodation` | `features.lodgeStays` |
| `LodgeStays.tsx` → `Layout` sibling | — | — | — |
| `SubscriptionSection` / `ErxesWidget.tsx` / `TrendActivitiesSection.tsx` | see 5.6 | — | — |
| `TrendActivitiesSection.tsx` | OPTIONAL / dead | **Zero importers.** Activity promo block, never wired | `features.dinoArea` |
| `ErxesWidget.tsx` | OPTIONAL / vendor | Third-party messenger; hardcoded vendor bundle URL. Mounted once at root (`app/[locale]/layout.tsx:119`) | `features.messenger` + `integrations.erxes.widgetUrl` |

### 5.2 Folder-level groups

| Folder | Files | Class | Reason | PROPOSED config key |
|---|---|---|---|---|
| `src/components/ui/` | 40 | **CORE** | shadcn primitive layer. 21 of 40 are actually imported; `CustomImage`, `date-time-picker`, `responsive-test`, `alert-dialog`, `alert`, `scroll-area`, `minimalist-time-slot`, `SkeletonAppointment`, `Counter`, `Loader`, `loading` are dead or unreferenced. Remove the dead set, keep the rest | — |
| `src/components/layout/` | 7 | **CORE** | App chrome + the universal booking bar. `MainVideo.tsx` is OPTIONAL/dead (commented out at its only call site in `VideoPageLayout.tsx`) | `features.heroVideo` (for `MainVideo`) |
| `src/components/clientPages/` | 38 | **CORE** | Page bodies. Two sub-classes below | per-page (see 5.3) |
| `src/components/booking/` | 15 | **CORE** | Room-checkout form fragments + `ReservationSummary` (largest file in the tree). `PaymentTdbDialog.tsx` is dead. `PayAtPropertyForm.tsx` (+ `ErxesFormModal.tsx`) renders only when pay-at-property is offered | `features.pay_at_property` (for `PayAtPropertyForm.tsx`) |
| `src/components/appointment/` | 37 | **CORE** (conditionally) | The spa/dining/activities appointment + payment engine. Only needed if appointment-based services ship | `features.appointmentBooking` |
| `src/components/profile/` | 7 | **CORE** | Account area (personal / security / bookings) | — |
| `src/components/reserve/` | 3 | **CORE** | `date-picker` + room/guest counters, consumed only by `layout/Reserve.tsx` | — |
| `src/components/shared/` | 7 | **CORE** | Appointment wizard layout + `forms/`. **`ConfirmForm.tsx`, `PaymentForm.tsx`, `UserInformationForm.tsx` have zero importers outside `shared/BookingLayout.tsx`** — they are reachable only through that one consumer, so "zero importers" is not "dead", but three of six forms serve a single call site | — |
| `src/components/about-us/` | 2 | **CORE** | `Greeting`, `OurService` | — |
| `src/components/contact-us/` | 3 | **CORE** | `ContactForm`, `FaqDatas`, `Maps` | `site.map.embedUrl` (for `Maps`) |
| `src/components/sustainability/` | 1 | **CORE** | ESG section, brand-differentiated | — |
| `src/components/auth/` | 1 | OPTIONAL | `CompanySignupGate.tsx` — B2B/company signup behind a cookie unlock (`(auth)/company-signup/page.tsx:10` `company_signup_unlocked`). Most consumer sites do not need it | `features.companySignup` |
| `src/components/authImages/` | 1 | OPTIONAL | Hardcoded CMS-fetched split-screen art for the auth layout | `features.authArtwork` |

### 5.3 `clientPages/` — per-feature classification

| Route area | Entry file(s) | Class | Reason | PROPOSED config key |
|---|---|---|---|---|
| Home | `homePage/homePage.tsx` | **CORE** | 8-section composition | — |
| Accommodation | `accommodationPage/{accommodationPage,accommodationDetailPage}.tsx` | **CORE** | The product this site sells | — |
| Layouts | `VideoPageLayout.tsx`, `DefaultPageLayout.tsx` | **CORE** | The two page shells (19 `DefaultPageLayout` importers) | — |
| News | `newsPage/newsDetailPage.tsx` | **CORE** | Standard CMS module | — |
| Auth screens | `formsPage/formsDetailPage.tsx` | **CORE** | Erxes lead forms — the only server-fetched page body | — |
| Static | `aboutUsPage`, `careersPage`, `contactUsPage`, `legalNoticePage`, `offersPage`, `profilePages/profileBookingDetailPage` | **CORE** | Standard brochure pages | — |
| **Tours** | `toursPage/{toursPage,tourDetailPage,TourBookingPage,TourCard,ToursList,ToursHero,TourItineraryAccordion,TourPricing,CreateOwnTripForm}.tsx` | **OPTIONAL** | 9 files + 3 routes. A `tms` SDK integration with its own payment track (`appointment/payment/tourPaymentPage.tsx`). A lodge that sells only rooms needs none of it | `features.tours` |
| **Lodge stays** | `lodgeStaysPage/lodgeStaysPage.tsx`, `accommodationPage/lodgeStaysDetailPage.tsx` | **OPTIONAL** | 2 routes duplicating the accommodation pages with inverted order (`lodgeStaysPage.tsx:48-71` vs `accommodationPage.tsx:48-71` are the same markup swapped) | `features.lodgeStays` |
| **Dino Fund / CSR** | `fundPage/{fundPage,fundProjectDetailPage}.tsx` + `fund/` (12 files) | **OPTIONAL** | 2 routes + `fund/data.ts` (615 lines of EN/MN prose). **But it leaks into CORE**: `fund/DinoFundCard.tsx` is imported by `clientPages/bookingPages/bookingPaymentPage.tsx:17`, so the checkout flow depends on it | `features.fund` |
| **Merch** | `merchPage/{merchPage,MerchBookingPage}.tsx` + `merch/` (4 files) | **OPTIONAL** | 2 routes; uses `MERCH_CATEGORY_ID` product-category constants. A pure hotel site would drop this entirely | `features.merch` |
| **Dining** | `diningPage/diningPage.tsx` + `dining/` (7 files) | **OPTIONAL** | 1 route; 3 of 7 (`GridImages`, `RootedDeep`, `DiningCoreButton`) are unreferenced | `features.dining` |
| **Spa & wellness** | `spaWellnessPage/spaWellnessPage.tsx` + `spa-wellness/` (4 files) | **OPTIONAL** | 1 route; `SpaAccordton.tsx` (sic — typo in filename) has zero importers | `features.spaWellness` |
| **Activities** | `activitiesPage/{activitiesPage,activitiesDetailPage}.tsx` + `activities/` (3 files) | **OPTIONAL** | 2 routes; driven by hardcoded `DINING_CATEGORY_IDS` | `features.activities` |
| **Appointment booking** | `bookingPage/bookingPage.tsx` (singular dir) | **CORE** (conditionally) | The shared booking page for `/activities/booking`, `/dining/booking`, `/spa-wellness/booking`. Needed iff any of those three ship | `features.appointmentBooking` |

### 5.4 `src/containers/` (11 files)

| Container | Class | Reason | PROPOSED config key |
|---|---|---|---|
| `config/currentConfig.tsx` | **CORE** | Root provider; gates the entire app on PMS branch config. Without it every price/room query lacks a branch id | — |
| `pricing/pricingPlans.tsx` | **CORE** | Root provider; resolves pricing-plan → product → `accountDiscounts` | — |
| `auth/current-user.tsx` | **CORE** | Header account widget | — |
| `auth/login-form.tsx` | **CORE** | — | — |
| `auth/register-form.tsx` | **CORE** | — | — |
| `auth/forgot-password-form.tsx` | **CORE** | — | — |
| `auth/reset-password-form.tsx` | **CORE** | — | — |
| `auth/verify.tsx` | **CORE** | OTP verification | — |
| `auth/auth-container.tsx` | OPTIONAL / **dead** | Sliding login⇄signup animation. Zero importers — the routes render `login-form`/`register-form` directly | `features.animatedAuthSwitcher` |
| `auth/private-route.tsx` | **CORE** / **dead** | The only auth guard in the codebase, never mounted. Routes like `/profile` are unprotected | `features.routeGuards` |
| `auth/redirector.tsx` | OPTIONAL / **dead** | Zero importers | — |

### 5.5 The 15 top components (cross-reference)

All 15 analysed in §3 classify as **CORE** except `layout/MainVideo.tsx` (dead) and the `BannerSection` 3D-tour half. None of the 15 is Tegri-Gobi-specific once brand copy is externalised.

### 5.6 Dead / zero-importer inventory (delete candidates)

| File | Importers | Class |
|---|---|---|
| `containers/auth/{auth-container,private-route,redirector}.tsx` | 0 | dead |
| `components/TrendActivitiesSection.tsx` | 0 | dead |
| `components/accommodation/ClientAccommodation.tsx` | 0 | dead (duplicate of `components/Accommodation.tsx`) |
| `components/ui/{CustomImage,date-time-picker,responsive-test,alert-dialog,alert,scroll-area,minimalist-time-slot,SkeletonAppointment,Counter}.tsx` | 0 | dead |
| `components/ui/Loader.tsx`, `components/ui/loading.tsx` | 0 | dead |
| `components/dining/{GridImages,RootedDeep,DiningCoreButton}.tsx` | 0 | dead |
| `components/spa-wellness/SpaAccordton.tsx` | 0 | dead |
| `components/common/{privacy-terms-gate,success-popup}.tsx` | 0 / commented | dead (`privacy-terms-gate` is imported at `app/[locale]/layout.tsx:17` but commented out at line 118) |
| `components/booking/payment/PaymentTdbDialog.tsx` | 0 | dead |
| `components/appointment/{Info,HeaderAppointment,Modal}.tsx`, `appointment/hooks/{useBranches,useUsers,usePaymentModal}.tsx`, `appointment/time/TimeSlot.tsx`, `appointment/products/CategoryForm.tsx` | 0 | dead (superceded by `shared/BookingLayout.tsx`) |
| `components/layout/MainVideo.tsx` | 0 (commented) | dead |
| `shared/forms/{ConfirmForm,PaymentForm,UserInformationForm}.tsx` | 1 each (via `shared/BookingLayout.tsx`) | live but single-consumer |

---

## 6. DEPENDENCY GRAPH

Read top-down: `src/app` (server routes) → `src/containers` (client providers) → `src/components` (client page bodies → sections → UI primitives). Arrows are verified `import` statements.

### 6.0 Shared shell — mounted once, wraps every route

```
src/app/[locale]/layout.tsx                      [server, async]
├── NextIntlClientProvider        messages/{locale}.json
├── NuqsAdapter                   nuqs/adapters/next/app
├── Apollo                        src/app/[locale]/ApolloClient.tsx  ["use client"]
│   ├── CurrentConfigProvider     containers/config/currentConfig.tsx
│   │   └── PricingPlansProvider  containers/pricing/pricingPlans.tsx
│   │       └── ConditionalLayout components/layout/ConditionalLayout.tsx
│   │           ├── Header            components/layout/Header.tsx
│   │           │   ├── useCmsMenus → getMenuTree (lib/menu.ts)
│   │           │   ├── CurrentUser    containers/auth/current-user.tsx
│   │           │   │   └── ui/{avatar,button,menubar}
│   │           │   └── LanguageSwitch components/LanguageSwitch.tsx
│   │           ├── SecondaryHeader    components/layout/SecondaryHeader.tsx
│   │           └── Footer             components/layout/Footer.tsx
│   └── Toaster                    components/ui/sonner.tsx
└── ErxesWidget                   components/ErxesWidget.tsx
```

`ConditionalLayout.tsx` picks **exactly one** of Header / SecondaryHeader / nothing by pathname, then renders Footer unconditionally and passes `{children}` through.

## 7. REPRODUCE vs AVOID RULES

### 7.1 REPRODUCE — the generator must copy these patterns exactly

**R1. The stacked-card hero scroll (`src/components/ScrollStack.tsx`).** Each card is `sticky top-20 md:top-28 lg:top-32` inside a container with an explicit `height: items.length * (isMobile ? 70 : 80)vh` (line 88), and each card runs its own `useScroll({ target: cardRef, offset: ["start 65%", "start 45%"] })` mapping to `y: useTransform(progress, [0,1], [120, index * gap])` with `gap = isMobile ? 40 : 72` and `style={{ zIndex: index + 1 }}`. Copy the three-part contract: **per-card `useScroll` target + a container-level explicit height + `zIndex = index + 1`.** Removing any one collapses the fan effect. Keep the config constants (`DESKTOP_LAYER_GAP`, `MOBILE_LAYER_GAP`, `SCROLL_STACK_CONFIG` in the generalized version) rather than inlining.

**R2. The floating booking bar (`src/components/layout/Reserve.tsx`).** Behaviour, in order:
- Two `DatePicker`s (check-in/check-out) + `room-counter.tsx` + `guest-counter.tsx`, all reading/writing Jotai `selectedRoomsAtom` / `roomGuestAssignmentsAtom`.
- Dismissal persisted in `localStorage` under key `reserve_open`, read in a **lazy `useState` initializer** with a `typeof window === "undefined"` guard (so SSR does not throw and does not flash the bar).
- `fixedOpen` prop forces open and suppresses both the close button and the collapse FAB (lines 75, 127, 143, 157, 162, 270).
- Validation through `react-hook-form` + `zodResolver(reserveFormSchema)` where the schema comes from the `useReserveSchemas()` **hook** so messages stay localized (not a static zod object).
- On submit, `router.push("/booking")` via `@/i18n/navigation` (locale-preserving).
- `MAX_PEOPLE_PER_ROOM` cap enforced in the guest counter.
**Copy the lazy-localStorage-initializer and the schema-as-hook technique exactly** — both are load-bearing for SSR and i18n.

**R3. The carousel ⇄ grid pair (`src/components/NewsSection.tsx:186-231`, duplicated verbatim in `src/components/Accommodation.tsx:290-330` and `src/components/LodgeStays.tsx`).** The exact shape to copy:
- `<div className="lg:hidden">` wrapping `<Carousel setApi={setApi} opts={{ loop: true }} plugins={[autoplayRef.current]}>` with `onMouseEnter/onMouseLeave/onTouchStart/onTouchEnd/onTouchCancel` all calling `autoplayRef.current?.stop?.()` / `?.play?.()`;
- dot indicators `<div className="flex gap-2 justify-center items-center mt-2">` with `h-1.5 rounded-full transition-all` + `active === i ? "w-6 bg-gray-400" : "w-2 bg-gray-400/30"`, rendered only when `items.length > 1`;
- a sibling `<div className="hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-3 lg:gap-6">` rendering the **same card component**;
- the `select`/`reInit` subscription in a `useEffect` keyed on `api`, with `onSelect()` called immediately so `active` is correct on first paint.
**The generator should emit this as one shared `<CarouselOrGrid items renderItem/>` primitive** — see AVOID A12 for why the copy-paste is currently a liability.

**R4. The header mobile drawer (`src/components/layout/Header.tsx:305-420`, mirrored in `src/components/layout/SecondaryHeader.tsx:169-240`).** Copy: `framer-motion` `AnimatePresence` keyed on an `isMenuOpen` boolean; the panel is `fixed top-0 right-0 bottom-0 z-[60] w-80 max-w-[85vw] bg-white h-dvh shadow-2xl border-l`; a close/header row plus a nav column and a footer row; **body scroll lock** while open; and a separate always-visible hamburger below `xl` because the desktop nav is `hidden … xl:flex`. Extract the duplicated markup into one component driven by a `variant: "transparent" | "solid"` prop rather than shipping two files.

**R5. The CMS image wrapper (`src/components/ui/image.tsx`).** Every CMS/PMS image URL in the codebase goes through it — 41 importers. Copy the whole contract:
- `readFile(value)` (`src/lib/utils.ts:46`) normalises CMS attachment values: accepts a string or `{ url }`, passes `data:`/`blob:` through untouched, rewrites any URL containing `/read-file?key=` onto `process.env.NEXT_PUBLIC_MAIN_API_DOMAIN`, and otherwise builds `NEXT_PUBLIC_MAIN_API_DOMAIN + "/read-file?key=" + encodeURIComponent(key)`.
- Low-res-then-sharp: `blurDataURL` from `readFile(thumbnail.url)` with `placeholder="blur"` and `blurDataURL`.
- Cloudflare loader: `loader={cloudflareLoader}` (`src/lib/image-loader.tsx`), with `https://imagedelivery.net/` as the default remote base (line 63).
- Aspect ratio owned by the **wrapper** (`w-full aspect-[5/2] overflow-hidden`) and `object-cover w-full h-full` on the image, so callers never fight `next/image` intrinsics.
- Fallback branch that swaps in `/images/metaBackground.jpg` when `src` is empty (line 10).
**Rule: no component may import `next/image` directly** — the only exception found is `src/app/[locale]/(auth)/login/page.tsx:7` and its siblings in the auth routes, which bypass the wrapper for the static logo.

**R6. The lazy-mount heavy embed (`src/components/BannerSection.tsx:35-51`).** Copy: `render3DLoaded` boolean state; placeholder `<button>` carrying a poster background + Play affordance; on click, mount the `<iframe>` **and** start two teardown listeners — `document "visibilitychange"` → `if (document.hidden) setRender3DLoaded(false)` and an `IntersectionObserver` with `{ threshold: 0 }` → `if (entry.intersectionRatio === 0) setRender3DLoaded(false)` — both removed on unmount. The third-party iframe is **never in the DOM until the user asks for it** and is destroyed the instant it scrolls away. Copy this verbatim for any embeds (video, maps, 3D tours, booking widgets).

**R7. The section-composition shell (`src/components/clientPages/VideoPageLayout.tsx` + `src/components/clientPages/DefaultPageLayout.tsx`).** Only two page shells exist. `VideoPageLayout` owns `min-h-screen` hero + Embla carousel or single image + `ReserveText` overlay + floating `Reserve` + `children` in **`space-y-10 lg:space-y-15`**; `DefaultPageLayout` owns `container relative mt-20 py-10 min-h-[50vh] lg:min-h-screen` for interiors. Every new page must pick one and never hand-roll a third shell.

**R8. `space-y-10 lg:space-y-15` is the canonical section rhythm.** It appears in `homePage.tsx:36`, `accommodationPage.tsx:48`, `lodgeStaysPage.tsx:48`, `aboutUsPage.tsx`. Use it verbatim; do not invent per-page spacing.

**R9. The three-tier pricing fallback (`src/components/Accommodation.tsx:147-152`).** `getRoomUnitPrice(correspondingRoom) || Number(item?.customFieldsMap?.rooms?.price) || 0` — live PMS price first, CMS-entered price as fallback, `0` as terminal. Keep the ordering and the `||` (not `??`) so a `0` live price falls through, matching the reference.

**R10. `cva` for primitives, boolean props for features (`src/components/ui/button.tsx:7-36`).** Copy the full pattern: a `xVariants = cva(base, { variants: {variant, size}, defaultVariants })` const, `VariantProps<typeof xVariants>` merged into the props type, consumed as `cn(xVariants({ variant, size, className }))` with `className` **last** so callers can override. `asChild` via `@radix-ui/react-slot` so `<Button asChild><Link/></Button>` works. Reproduce this **only** in `ui/` — feature components use inline booleans.

**R11. The provider-gate pattern (`src/containers/config/currentConfig.tsx:25-39`).** A root provider must be able to *block the entire app*: `<MainLoader text="" />` while loading, a localized `ServerOff` full-screen error state on failure, and `{children}` only on success. Copy this for any new global data dependency.

**R12. The `?from=` return-trip (`src/containers/auth/current-user.tsx:14-24`).** `from = pathname + (search ? "?" + search : "")`, a regex guard that skips the param when already on an auth page (`/^\/(login|signup|company-signup|forgot-password|reset-password|verify)/`), then `encodeURIComponent`. **Rule: the generator must also wire the consumer side** — the reference builds `?from=` but nothing reads it (see AVOID A9).

### 7.2 AVOID — defects, with the corrected rule stated

**Type-safety defects**

- **A1.** `profileBookingDetailPage.tsx` has **25 `: any`** (plus 4 more in `lodgeStaysDetailPage.tsx`, 5 in `booking/payment/payment-detail.tsx`, 5 in `appointment/payment/paymentPage.tsx`, 4 in `contact-us/ContactForm.tsx`, 4 in `appointment/hooks/useBookingSubmit.tsx`, 3 in `GallerySection.tsx`, 3 in `booking/ReservationSummaryWrapper.tsx`, 3 in `appointment/payment/tourPaymentDetail.tsx`). Tree totals: **72 `: any`, 32 `as any`, 0 `@ts-ignore`.** *Rule: no `any` and no `as any` in generated code. Type CMS responses at the SDK boundary (`src/sdk/queries/*.tsx`), then import the type. `(item as any).createdAt` in `NewsSection.tsx:100` and `(post as any)?.customFieldsData` in `src/lib/cms.ts:4,23,60` are the canonical examples of what not to emit.*
- **A2.** `contactUsPage.tsx:42` maps `contactData.map((item: any, index: number) => …)` over a literal array it just defined 28 lines above — the `any` is pure noise. *Rule: infer; annotate only at external boundaries.*
- **A3.** `src/components/appointment/payment/paymentPage.tsx` and `tourPaymentDetail.tsx` share a large `any`-typed payload. *Rule: extract one shared, properly-typed payment-view model.*

**React / correctness defects (collected from §3 "Defects")**

- **A4. `ScrollStack.tsx:69-81` — hydration layout shift.** `useState(false)` + `useEffect` correction means SSR and first client render always use the desktop `gap = 72` and `80vh`. *Corrected rule: derive the breakpoint with the existing `useMediaQuery` hook (`src/lib/use-media-query.tsx`) or a CSS custom property, so the server and client agree. Never branch layout on `window` inside an effect.*
- **A5. `ScrollStack.tsx:65,88` — `matchMedia` with a manual dual-API listener** (`mql.addEventListener?.("change", update); ; (mql as any).addListener?.(update)`). This is the only `matchMedia` usage in `src/components`; 30+ files already use `useMediaQuery`. *Corrected rule: use `src/lib/use-media-query.tsx` exclusively. Delete the hand-rolled listener and the `as any` cast.*
- **A6. `ScrollStack.tsx:65,78` — hardcoded English fallback copy** `"HEALING OASIS HIDDEN AMONG THE DUNES"` and `"..."`, absent from `messages/en.json` and `messages/mn.json`. *Corrected rule: when a prop is missing, render nothing. Never ship a marketing string as a JSX fallback.*
- **A7. `ScrollStack.tsx` — `total` prop is destructured and never used**; `containerRef` is attached and never read. *Corrected rule: no unused props, no write-only refs.*
- **A8. `Accommodation.tsx:196-211` — `window.innerWidth` read during render.** `getMaxVisible()` is called inside JSX, guarded by `typeof window === "undefined"`, and never re-evaluates on resize. *Corrected rule: express the 1/2/3-pill reveal in CSS breakpoints (`[&>*:nth-child(n+2)]:hidden lg:[&>*:nth-child(n+3)]:hidden …`) and keep the `+N` count in React state.*
- **A9. `Accommodation.tsx:135-247` — `<Link>` wraps a `<Card>` that contains a `<Button>`.** Nested interactive elements: a button inside an anchor is invalid HTML and breaks keyboard and screen-reader behaviour. *Corrected rule: make the whole card a single `<Link>`; render "See more" as a `<span>` styled like the button.*
- **A10. `Accommodation.tsx:122` and `NewsSection.tsx:84` — component defined inside the render body.** `AccommodationCard` / `NewsCard` are re-created on every parent render, so their `useTranslations` re-runs and React remounts the subtree. *Corrected rule: hoist card components to module scope and pass `item` as a prop.*
- **A11. `NewsSection.tsx:20` — `showHeader?: "false" | "true"`.** A string union that reads like a boolean; the two branches (lines 126–150 and 152–168) are 25 duplicated lines differing only by the "See All" link. *Corrected rule: type it `withSeeAll?: boolean` and render `{withSeeAll && <Link/>}` in one block.*
- **A12. The carousel⇄grid block is copy-pasted into 5 files** (`NewsSection.tsx`, `Accommodation.tsx`, `LodgeStays.tsx`, `MerchProductsCarousel.tsx`, `fund/FaqSection.tsx`) with diverging edits — `Accommodation.tsx` even got the grid-columns count wrong (`grid-cols-2` with no `lg:` prefix at line 328, while `NewsSection.tsx:226` has `lg:grid-cols-3`). *Corrected rule: one `<CarouselOrGrid items renderItem/>` primitive, imported everywhere. Do not copy this block.*
- **A13. `NewsSection.tsx:214` — `group-hover:translate-x-0.5` with no `group` ancestor.** The icon never moves. *Corrected rule: put `group` on the `<Link>` when you use a `group-hover:` child.*
- **A14. `NewsSection.tsx:97-102` — `formatDate` hardcodes `"mn-MN"`.** Dates render in Mongolian format regardless of locale. *Corrected rule: `useLocale()` from `next-intl` and pass it to `toLocaleDateString`.*
- **A15. `NewsSection.tsx:100` — `(item as any).createdAt || new Date().toISOString()`.** A missing date silently renders **today**, i.e. fabricated content. *Corrected rule: render nothing when the field is absent.*
- **A16. `NewsSection.tsx:106` — `item.excerpt.slice(0, 170)`** truncates mid-word with no ellipsis. *Corrected rule: truncate on a word boundary and append `…`, or let CSS `-webkit-line-clamp` handle it.*
- **A17. `NewsSection.tsx:236-244` — redundant ternary chain.** `loading` is already excluded twice in a three-branch `?:`. *Corrected rule: early-return the skeleton once, then branch once on `layout`.*
- **A18. `current-user.tsx:88` — `<Link>` wraps `<MenubarItem>`.** A menu item is a `div` with a click handler, not an anchor; wrapping it breaks menu keyboard semantics. *Corrected rule: `<MenubarItem asChild><Link/></MenubarItem>`, matching the `asChild` pattern already used in `ui/button.tsx:48`.*
- **A19. `current-user.tsx:10` — `Briefcase` imported but unused.** *Corrected rule: no unused imports; lint must be clean.*
- **A20. `current-user.tsx:78,88` — fake fallbacks** `"user@example.com"` and `"User"`, plus `(firstName || username || "U")[0].toUpperCase()` which **throws** on an empty string (`""[0]` is `undefined`). *Corrected rule: render empty strings; derive initials with `?.` and a `?? ""`.*
- **A21. `current-user.tsx:16-19` — raw `sessionStorage.getItem("token")` inside a UI component.** Auth state is read outside the Apollo/Jotai layer, duplicating the token store. *Corrected rule: expose `isAuthenticated` from `useCurrentUser` / an auth provider and branch on that.*
- **A22. `current-user.tsx:47` — `loading` starts `true` globally, so every visitor sees a header spinner** until `useCurrentUser` resolves. *Corrected rule: an unknown auth state must render the signed-out pill, not a spinner.*
- **A23. `layout/Reserve.tsx` — an `<h1>` inside the submit `<button>`** (the "Check Availability" label). A heading inside an interactive control breaks the document outline. *Corrected rule: `<span>` inside buttons, always.*
- **A24. `layout/Reserve.tsx` — invalid Tailwind classes** `max-auto` (not a real utility), plus `z-5` and `bottom-18` (non-existent in the default spacing scale — `z-5` should be `z-50`, `bottom-18` is not defined). *Corrected rule: only ship classes that exist in the compiled Tailwind theme; a typo silently produces no style.*
- **A25. `layout/Reserve.tsx` — unused imports** `LoadingIcon` and `currentStepAtom`. *Corrected rule: no unused imports.*
- **A26. `layout/Reserve.tsx` — `text-black` in `formLabelClass`** bypasses the semantic token layer. *Rule: use `text-foreground` / `text-muted-foreground` so a theme change propagates.*
- **A27. `layout/Header.tsx:307-310` — `py-14 h-16` on one row.** Contradictory vertical sizing (`py-14` = 3.5rem padding on a 4rem-tall box). *Corrected rule: size with padding OR fixed height, never both on the same axis.*
- **A28. `layout/Header.tsx` — `font-bodoni`** on the wordmark, but `src/app/[locale]/layout.tsx:20-32` loads only **Roboto** and **DM_Sans**. The class silently falls back to a system serif. *Corrected rule: only reference fonts that are actually loaded.*
- **A29. `layout/Header.tsx` — the drawer background is a hardcoded blue→purple gradient** with no token behind it. *Corrected rule: tokenise it or remove it.*
- **A30. `layout/Header.tsx` and `SecondaryHeader.tsx` — ~55% duplication.** Two 420/236-line files that are the same component with a different background. *Corrected rule: one `<SiteHeader variant="transparent" | "solid"/>`. Keep one, delete the other.*
- **A31. `layout/ConditionalLayout.tsx` — pathname string matching** (`pathname.includes(...)`) to choose chrome, with a hardcoded `/`-split locale strip. *Corrected rule: use the Next.js route-segment matcher or explicit route config, never substring matching on a URL.*
- **A32. `clientPages/VideoPageLayout.tsx` — `MainVideo` is commented out** but `MainVideo.tsx` and the whole vendored `ui/kibo-ui/video-player/index.tsx` (~120 lines) remain. *Corrected rule: delete unreferenced code, do not comment out imports.*
- **A33. `BannerSection.tsx:40` — CMS slug misspelled** `"bannerdesctiption"` (missing the `r`). Any content edit that "fixes" it in the CMS will silently blank the heading. *Corrected rule: correct the slug in the CMS and the code together, and centralise slugs as constants.*
- **A34. `BannerSection.tsx:120` — inline `style={{ backgroundImage: "url('/images/banner.png')" }}`** bypasses `ui/image` entirely, so the poster gets no blur placeholder, no loader and no `remotePatterns` handling. *Corrected rule: use `<Image>` for every image, including placeholders.*
- **A35. `shared/forms/*` — `ConfirmForm`, `PaymentForm`, `UserInformationForm` each have exactly one importer** (`shared/BookingLayout.tsx`). They are generalised six times for one call site. *Corrected rule: inline single-consumer form fragments or accept that the abstraction is premature.*

**Architecture / layering defects**

- **A36. Inverted layering — `components/` imports from `app/` (5 sites).** `clientPages/bookingPages/{bookingPage,bookingConfirmPage,bookingDetailsPage,bookingPaymentPage}.tsx` import `@/app/[locale]/booking/booking-layout`, and `bookingPage.tsx:23` imports `@/app/[locale]/booking/components/SelectedRoomsCard`. *Corrected rule: `app/` depends on `components/`; never the reverse. Move `booking-layout` and `SelectedRoomsCard` into `components/layout/`.*
- **A37. Two different components both named `BookingLayout`.** `app/[locale]/booking/booking-layout.tsx` takes `{children}` + renders `BookingSteps` (room wizard); `components/shared/BookingLayout.tsx` takes `{form, onSubmit, detail}` + renders `shared/forms/*` (appointment wizard). *Corrected rule: disambiguate — `RoomBookingLayout` vs `AppointmentBookingLayout`.*
- **A38. Two directories differing by one letter, both named `bookingPage`.** `clientPages/bookingPage/` (singular, 1 file, the appointment wizard used by `/activities/booking`, `/dining/booking`, `/spa-wellness/booking`) and `clientPages/bookingPages/` (plural, 4 files, the room wizard used by `/booking/**`). A one-character typo silently routes to the wrong wizard. *Corrected rule: one directory; name files for what they render.*
- **A39. `app/[locale]/booking/booking-layout.tsx` and `app/[locale]/booking/components/SelectedRoomsCard.tsx` have no `"use client"`** yet both use Jotai (`useAtomValue`) and `useEffect`. They build only because their importers are client. *Corrected rule: any file using hooks, Jotai or Apollo declares `"use client"` itself.*
- **A40. 13 files use hooks/Apollo/Jotai without the directive:** `appointment/hooks/{useAddDeal,useBranches,useCategories,useDeals,usePaymentModal,useProducts,useUsers}.tsx`, `appointment/{Info,time/TimeSlot}.tsx`, `contact-us/Maps.tsx`, `dining/GridImages.tsx`, `profile/components/bookingsCard.tsx`. *Corrected rule: same as A39.*
- **A41. `containers/auth/private-route.tsx` is never mounted.** The only auth guard in the codebase is dead, so `/profile`, `/booking/details` and `/booking/payment/*` are reachable while signed out. *Corrected rule: guard every authenticated route, server-side first, in the route file or layout.*
- **A42. `app/[locale]/(auth)/company-signup/page.tsx` gates on a client-writable cookie** (`company_signup_unlocked === "true"`, line 30). The value is set by `src/app/api/company-signup/unlock/route.ts` from a client-supplied access code, so the gate is advisory only. *Corrected rule: server-verify the code before issuing the cookie; treat the cookie as a hint, not authorisation.*
- **A43. `NuqsAdapter` is mounted at the root** (`app/[locale]/layout.tsx:107`) for what is a single booking-date query param. *Corrected rule: mount adapters at the narrowest subtree that needs them.*
- **A44. `NextIntlClientProvider` ships the full `messages/{locale}.json`** to every route including ones that use 2 keys. *Corrected rule: scope messages per route group.*
- **A45. Messages are imported twice** — server-side `await import(`../../../messages/${locale}.json`)` at `layout.tsx:62` and again through `NextIntlClientProvider`. *Corrected rule: import once.*
- **A46. 39 of 41 route files fetch data client-side** via Apollo; the server only builds metadata. `accommodation/[slug]/page.tsx:12` awaits `getCmsPostDetail` for the `<title>` and then the client refetches the same post. *Corrected rule: fetch once on the server and pass it down — the reference already does this correctly in `forms/[slug]/page.tsx:27,42`.*
- **A47. `generateMetadata` is commented out** on `booking/payment/[slug]/page.tsx:8-24`, so that route ships the layout's default title. *Corrected rule: no commented-out code in committed source.*
- **A48. `app/[locale]/layout.tsx` hardcodes GA4 and GTM ids** in three places (lines 69, 79, 90, 100). *Corrected rule: analytics ids belong in env/config.*
- **A49. Duplicate locale-refetch effects.** `refetch()` on `currentLocale` change is repeated in 14 files (`NewsSection.tsx:53-56`, `Accommodation.tsx:71-73`, `homePage.tsx:24-26`, `accommodationPage.tsx:34-38`, `lodgeStaysPage.tsx:34-38`, `BannerSection.tsx:19-21`, …). `accommodationPage.tsx` fires **three** refetches in one effect. *Corrected rule: key the Apollo cache by locale and let the query hook handle it; no manual refetch effect.*
- **A50. `useCmsPostsBySlug` / `useCmsPageDetail` take locale as a plain string** while `next-intl` already scopes by locale, so every call site must pass `params.locale as string` manually — 28 occurrences. *Corrected rule: read the locale inside the SDK hook via `useLocale()`.*

**E-commerce / generic-platform leftovers**

- **A51. The product-category model leaks into hotel UI.** `@/types/products` is imported by `clientPages/VideoPageLayout.tsx:9` (`IAttachment`), `activities/ActivitiesImages.tsx:14`, `spa-wellness/SpaImages.tsx:12`, `dining/GridImages.tsx:1`, `dining/DiningCoreButton.tsx:3`, `spa-wellness/SpaAccordton.tsx:12`, `activities/ActivitiesAccordion.tsx:20` (`IPoscProduct`). A hero image should not be typed as a shop product. *Corrected rule: hotel UI consumes CMS/media types, not commerce product types.*
- **A52. `src/sdk/queries/products` (`useChildProduct`) is used by 5 UI components** — `booking/ReservationSummary.tsx:26`, `booking/ReservationSummaryWrapper.tsx:14`, `profile/components/bookingsCard.tsx:13`, `clientPages/bookingPages/bookingPage.tsx:25`, `clientPages/profilePages/profileBookingDetailPage.tsx:23` — all to re-fetch the same product to display a price. *Corrected rule: the booking/deal payload already carries the price; do not round-trip through the catalogue query.*
- **A53. `dining/DiningAlaCarte.tsx` imports `ProductForm`** — a **product CRUD admin form** (`appointment/products/ProductForm.tsx`) — into a public dining page, plus the hardcoded `DINING_PRICING_CATEGORY_ID`. *Corrected rule: admin CRUD components and public pages must not share a tree; move `products/CategoryForm.tsx` and `ProductForm.tsx` out of `components/` into an admin surface.*
- **A54. `shared/BookingLayout.tsx:41` falls back to `<ProductDetail />`** — a product admin/detail view — as the default right-hand column of a customer booking form. *Corrected rule: pass a required `summary` node; never default to an admin component.*
- **A55. `appointment/products/category-utils.ts:10-18` hardcodes five erxes category ids** (`DINING_CATEGORY_ID`, `DINING_CATEGORY_IDS`, `DINING_PRICING_CATEGORY_ID`, `ACTIVITIES_CATEGORY_ID`, `SPA_CATEGORY_ID`) plus a four-entry `STALE_CATEGORY_IDS` migration map. These are tenant data. *Corrected rule: category ids come from config or the PMS, never from source.*
- **A56. `src/lib/cms.ts:19` hardcodes `ROOM_PRODUCT_FIELD_ID`** — a CMS custom-field id. *Corrected rule: field ids belong in CMS config exposed via the API, not in code.*
- **A57. `fund/data.ts` (615 lines) hardcodes all Dino Fund copy** in both EN and MN inline — 4 marketing paragraphs (lines 171, 253, 323, 338) plus 4 hex colour triples (lines 209-212, 227-228, 433-436, 451-452). *Corrected rule: long-form bilingual editorial content belongs in the CMS or `messages/*.json`, never in a `.ts` module.*
- **A58. `spa-wellness/SpaAccordton.tsx:23-24` and `activities/ActivitiesAccordion.tsx:23-24` each define an identical `formatPrice`** that hardcodes the `₮` symbol, while `src/lib/utils.ts:71` already exports `getCurrencySymbol`. *Corrected rule: one currency formatter, in `@/lib/utils`, locale-aware; never append a currency glyph as a literal.*

**Dead code (verified 0 importers) — do not generate**

- **A59. Confirmed dead:** `ui/{CustomImage,date-time-picker,responsive-test,alert-dialog,alert,scroll-area,minimalist-time-slot}.tsx`; `dining/{GridImages,RootedDeep,DiningCoreButton}.tsx`; `spa-wellness/SpaAccordton.tsx`; `TrendActivitiesSection.tsx`; `accommodation/ClientAccommodation.tsx` (a duplicate of `components/Accommodation.tsx`); `booking/payment/PaymentTdbDialog.tsx`; `booking/ConfirmButton.tsx`; `appointment/{Info,HeaderAppointment,Modal}.tsx`; `appointment/time/TimeSlot.tsx`; `appointment/hooks/{useBranches,useCategories,usePaymentModal,useProducts,useUsers}.tsx`; `appointment/products/CategoryForm.tsx`; `common/success-popup.tsx`; `merch/SectionHeading.tsx`; `containers/auth/{auth-container,private-route,redirector}.tsx`.
- **A60. Effectively dead (imported but every JSX use commented out):** `SubscriptionSection.tsx` — imported by `homePage.tsx:11`, `accommodationPage.tsx:5`, `lodgeStaysPage.tsx:5`, `aboutUsPage.tsx:6`, `newsDetailPage.tsx:10`, with all 5 render sites commented (`homePage.tsx:44`, `accommodationPage.tsx:73`, `lodgeStaysPage.tsx:73`, `aboutUsPage.tsx:35`, `newsDetailPage.tsx:157`). Also `common/privacy-terms-gate.tsx` (imported at `layout.tsx:17`, rendered at line 118 both commented) and `layout/MainVideo.tsx` (commented at its only call site in `VideoPageLayout.tsx`). *Rule: remove the import too.*
- **A61. Commented-out code as a feature flag.** 12+ sites use `{/* <X/> */}` to disable a feature. *Corrected rule: use a real boolean/config value — see the PROPOSED keys in §5.*
- **A62. `containers/auth/auth-container.tsx` duplicates the login/signup routes** and additionally hardcodes marketing copy (`"Mongolia's most…"`, `"Mongolia's premier luxury resort experience."`, `"Discover luxury in Mongolia's nature"`, lines 97, 168, 323) and two gallery images (`/images/gallery/terelj1.jpg`, `terelj15.jpg`, lines 59-60 and 292-293). All of it is dead. *Delete outright.*

**Naming defects**

- **A63. Three file-name conventions coexist.** PascalCase for components (~150 files), kebab-case for 25 non-`ui` files (`reserve/date-picker.tsx`, `booking/payment/payment-detail.tsx`, `containers/auth/login-form.tsx`, …), and lowerCamelCase for hook/context `.ts` modules (`bookingContext.ts`, `useFundContent.ts`). *Corrected rule: PascalCase for components, kebab-case for route-adjacent non-components, `camelCase.ts` for pure modules — and pick one per category.*
- **A64. `ui/` file casing is inconsistent and case-sensitive.** 30 kebab-case shadcn files (`button.tsx`, `alert-dialog.tsx`) coexist with 8 PascalCase locals (`GridSkeleton.tsx`, `CustomImage.tsx`, `FourDotsLoader.tsx`, `Icon.tsx`, `Loader.tsx`, `MainLoader.tsx`, `SkeletonAppointment.tsx`) plus one all-lowercase `responsive-test.tsx`. `MainLoader` alone has **17** importers, `Loader` 4, `Icon` 2, `GridSkeleton` 2, `FourDotsLoader` 2, `SkeletonAppointment` 2, `counter` 2 — all relying on exact-case paths. This breaks on macOS/Windows checkouts and on case-sensitive CI. *Corrected rule: one convention across `ui/`; if kebab-case wins, rename to `main-loader.tsx`, `grid-skeleton.tsx`, `four-dots-loader.tsx`, `icon.tsx`, `loader.tsx`, `skeleton-appointment.tsx` and delete `custom-image.tsx` and `responsive-test.tsx` outright.*
- **A65. Three spellings of the same component.** `Loader.tsx` (default `Loader`), `loading.tsx` (`LoadingIcon`/`LoadingWrapper`/`LoadingText`), `FourDotsLoader.tsx`, `GridSkeleton.tsx`, `SkeletonAppointment.tsx` — five loading components. *Corrected rule: one `<Skeleton/>`, one `<Spinner/>`, one `<LoadingOverlay/>`.*
- **A66. `spa-wellness/SpaAccordton.tsx`** — "Accordton" is a typo for "Accordion", and it matches `activities/ActivitiesAccordion.tsx` and `toursPage/TourItineraryAccordion.tsx`, which are spelled correctly. *Rule: fix on rename; also note the file is dead.*
- **A67. `shared/forms/` exports `InformationForm` and `UserInformationForm`** — two near-identical names for the same concept, and `InformationForm.tsx` is used only by `merchPage/MerchBookingPage.tsx` while `UserInformationForm.tsx` is used only by `shared/BookingLayout.tsx`. *Corrected rule: one `<GuestDetailsForm/>`.*
- **A68. `clientPages/*.tsx` uses lowerCamelCase page files** (`homePage.tsx`, `accommodationPage.tsx`) while every component inside them is PascalCase. *Rule: `home-page.tsx` or `HomePage.tsx`, consistently.*
- **A69. `dining/DiningAlaCarte.tsx`** should be `DiningÀLaCarte`/`DiningALaCarte`; `FundImage.tsx`, `FaqDatas.tsx` (plural noun for a singular object) and `MerchBookingPage.tsx` vs `merchPage.tsx` casing split the merch feature. *Rule: fix on rename.*

**Hardcoded values (cross-reference §8)**

- **A70.** `₮` literal in `Accommodation.tsx:159`, `spa-wellness/SpaAccordton.tsx:24`, `activities/ActivitiesAccordion.tsx:24`. *Rule: `getCurrencySymbol(currency, locale)`.*
- **A71.** `src/lib/utils.ts:71-81` `getCurrencySymbol` returns `"$"` for `MNT` when `locale === "en"` and `"₮"` for anything unrecognised (including `EUR`, `GBP`). MNT ≈ 3 500–4 000/USD, so the English locale shows a **40× wrong** figure with no decimal point. *Corrected rule: `Intl.NumberFormat(locale, { style: "currency", currency })`; never hand-map currency to glyph.*
- **A72.** `#DBDBDB` (23 occurrences, 14 of them in the 5 auth container files), `#4D4D4D`, `#CACACA`, `#EDEDED`, `#6B7280`, `#EA580C`, `#15803D`, `#F59E0B`, `#D33718`, `#1F2933`, `#F53B31`, `#EB144C`. `ui/Loader.tsx:13` hardcodes `#D33718` — the brand red — as a raw hex instead of `bg-primary`. *Rule: semantic tokens only (`primary`, `muted-foreground`, `border`).*
- **A73.** Hardcoded `/images/...` paths in **26 places across 20 files** — see §8 table.
- **A74.** Hardcoded third-party URLs — Erxes gateway/widget hosts, `d5render.com`, Google Maps embeds with GPS coordinates, Instagram/Facebook handles, a Google Drive brochure link, `erxes.mn` credit. See §8.
- **A75.** 28 CMS slugs hardcoded as string literals at call sites (`"accommodation"`, `"news"`, `"home"`, `"merch"`, `"gallery"`, `"whychooseus"`, `"desertjourney"`, `"sustainability"`, `"loginimages"`, `"faq"`, `"cancellation-policy"`, …), with `"bannerdesctiption"` misspelled. *Corrected rule: a single `CMS_SLUGS` constant module, validated against the CMS at build time.*
- **A76.** `erxes.mn` credit text and the `NEXT_PUBLIC_SAAS_DOMAIN`/PMS-token env reads are scattered across call sites rather than funnelled through one config module. *Rule: one `src/config/` with typed, validated accessors.*

### 7.3 Erratum to §5.6 (dead-code table)

While verifying §7 I re-ran the importer counts with a correct matcher (module path, extension-less, excluding the module itself) and **§5.6 over-declared 7 files as dead.** They are live:

| File | Real importers | Consumers |
|---|---|---|
| `components/ui/Loader.tsx` | **4** | `booking/payment/payment-detail.tsx:7`, `booking/payment/PaymentQrDialog.tsx:10`, `appointment/payment/tourPaymentDetail.tsx:7`, `profile/components/CancelBookingDialog.tsx:19` |
| `components/ui/loading.tsx` | **7** | all 5 auth containers (`login-form`, `register-form`, `forgot-password-form`, `reset-password-form`, `verify`), plus `profile/components/updatePassword.tsx`, `layout/Reserve.tsx` |
| `components/ui/counter.tsx` | **2** | `reserve/room-counter.tsx`, `reserve/guest-counter.tsx` |
| `components/ui/Icon.tsx` | **2** | `components/LodgeStays.tsx:15`, `clientPages/toursPage/TourItineraryAccordion.tsx:9` |
| `components/ui/FourDotsLoader.tsx` | **2** | `appointment/payment/paymentPage.tsx:15`, `appointment/payment/tourPaymentPage.tsx:7` |
| `components/ui/GridSkeleton.tsx` | **2** | `components/NewsSection.tsx:13`, `clientPages/spaWellnessPage/spaWellnessPage.tsx:9` |
| `components/ui/SkeletonAppointment.tsx` | **2** | `appointment/products/CategoryForm.tsx:7`, `appointment/products/ProductForm.tsx:8` |

`merch/SectionHeading.tsx` is genuinely dead (0 importers). A59–A62 above is the corrected list.

**Counting method.** Every importer count in this report — the §1.21 Consumers column and the §2.1 ranking — is the number of distinct **importing files**, resolved by import path and self-excluded, never import statements or call sites.

---

## 8. BRAND-SPECIFIC HARDCODING AUDIT

Every place a Tegri Gobi-specific value — text, link, image path, colour, or id — is written into component source instead of arriving from `messages/*.json`, a config module, or the CMS. **No secret values are reproduced below**; ids and tokens are named but their values are withheld where they are tenant credentials.

### 8.1 Brand text and English copy in components

| File | What is hardcoded | Should come from |
|---|---|---|
| `components/layout/Header.tsx:172, 331` | `alt="Tegri Gobi Resort"` (×2) | `messages/*.json` → `Header.logoAlt` |
| `components/layout/SecondaryHeader.tsx:90, 177` | `alt="Tegri Gobi Resort"` (×2) | same (or a shared header config) |
| `components/layout/Footer.tsx:62, 183` | `alt="Tegri Gobi logo"` (×2) | `messages` → `Footer.logoAlt` |
| `components/ScrollStack.tsx:65` | `"HEALING OASIS HIDDEN AMONG THE DUNES"` — English marketing copy, no MN counterpart | CMS field or `messages`; **see A6 — render nothing instead** |
| `components/BannerSection.tsx:103` | `title="Tegri Gobi 3D"` (iframe title) | `messages` → `Getting.tourTitle` |
| `components/booking/ErxesFormModal.tsx:683, 689` | `alt="Tegri Resort"` and the literal text `TEGRI RESORT` | CMS / `messages` |
| `components/clientPages/accommodationPage/lodgeStaysDetailPage.tsx:83` | `tourData?.startDate \|\| "MONGOLIA"` — a hardcoded country as a date fallback | `messages`; better, render nothing (**A15**) |
| `components/clientPages/contactUsPage/contactUsPage.tsx:18` | `t("Ömnögovi Province, South Gobi 21220, Mongolia")` — **a full postal address inside a `t()` call**, so it exists as a translation key rather than CMS content | CMS `contact` page / structured address config |
| `components/clientPages/contactUsPage/contactUsPage.tsx:23` | `"+976 77773331 +976 77773331"` — phone number hardcoded, **and duplicated within the same string** | CMS / config → `site.contact.phone` |
| `components/clientPages/contactUsPage/contactUsPage.tsx:28` | `"manager@tegritravel.mn"` | CMS / config → `site.contact.email` |
| `components/clientPages/diningPage/diningPage.tsx:67` | `bySubSlug["dining-at-tegri-gobi"]` — **the brand name is embedded in a CMS slug key** | `CMS_SLUGS` constant (**A75**) |
| `containers/auth/auth-container.tsx:97, 168, 323` | 3 marketing strings (`"…Mongolia's most…"`, `"Mongolia's premier luxury resort experience."`, `"Discover luxury in Mongolia's nature"`) | messages — **but the whole file is dead (A62), delete it** |
| `components/fund/data.ts:171, 253, 323, 338` | 4 long-form Dino Fund paragraphs, EN inline | CMS editorial content (**A57**) |
| `src/lib/utils.ts:84-151` | `getIconByLabel` embeds **Mongolian Cyrillic substrings** (`"шүршүүр"`, `"ариун"`, `"хүн"`, `"цонх"`, `"тэррас"`, `"систем"`, `"агааржуулагч"`) as amenity-matching keywords | a locale-keyed mapping in config, not a util |
| `components/appointment/products/category-utils.ts:52-75` | MN Cyrillic category keywords (`"шөл"`, `"үндсэн"`, `"амттан"`, `"ундаа"`, `"зууш"`) + the EN canonical order `["Appetizers","Soup","Main Course","Dessert","Drinks"]` | CMS category codes, not source |
| `components/NewsSection.tsx:97` | `"mn-MN"` hardcoded locale for date formatting | `useLocale()` (**A14**) |

### 8.2 Hardcoded external links and third-party hosts

| File | What is hardcoded | Should come from |
|---|---|---|
| `components/ErxesWidget.tsx:69` | `https://tegrigobinew.nextwidgets.erxes.io/messengerBundle.js` — the tenant's own Erxes subdomain in source | `NEXT_PUBLIC_WIDGET_URL` env (**A76**) |
| `components/authImages/images.tsx:86` | `https://tegrigobinew.next.erxes.io/gateway/read-file?key=${imageSrc}` — **hardcodes the tenant API host instead of using `readFile()`**, which exists in `src/lib/utils.ts:46` and already reads `NEXT_PUBLIC_MAIN_API_DOMAIN` | `readFile(imageSrc)` |
| `components/BannerSection.tsx:56` | `https://share.d5render.com/user-hub/showreel/shortLink/z6Epvr` — vendor tour URL | config → `features.virtualTour.url` (**§5**) |
| `components/BannerSection.tsx:154` | Google Maps search URL with **GPS coordinates `44.151772, 103.659412`** and a place UUID | config → `site.map.directionsUrl` |
| `components/contact-us/Maps.tsx:13` | Google Maps **embed** URL, same coordinates, plus a base64 `!2z…` place string | config → `site.map.embedUrl` |
| `components/contact-us/Maps.tsx:34` | Google Maps search URL, same coordinates + UUID | config → `site.map.searchUrl` (duplicate of `BannerSection.tsx:154`) |
| `components/layout/Footer.tsx:19` | `https://drive.google.com/file/d/1D9…/view?ts=…` — hosted brochure | config → `site.documents.brochure` |
| `components/layout/Footer.tsx:40` | `https://www.instagram.com/tegri_gobi_resort` | config → `site.social.instagram` |
| `components/layout/Footer.tsx:45` | `https://www.facebook.com/Tegrigobiresort` | config → `site.social.facebook` |
| `components/layout/Footer.tsx:50, 76, 77, 194, 195` | `mailto:manager@tegritravel.mn` + the visible address text, **5 times in one file** | config → `site.contact.email` (extract to one constant) |
| `components/layout/Footer.tsx:268` | `https://erxes.mn/` vendor credit link | config → `integrations.erxes.creditUrl` |
| `components/common/success-popup.tsx:53` | `https://mail.google.com` — **file is dead** (A59) | delete |
| `components/ui/image.tsx:63` | `https://imagedelivery.net/` — the Cloudflare Images base, correctly the only image host | keep as a config constant |
| `src/app/[locale]/layout.tsx:69, 79, 90, 100` | GA4 measurement id and GTM container id inlined in 4 places | `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` (**A48**) |

### 8.3 Hardcoded image paths — 26 occurrences across 20 files

| File (line) | Path | Should come from |
|---|---|---|
| `components/ui/image.tsx:10` | `/images/metaBackground.jpg` — the global image fallback | a `SITE_IMAGES.fallback` constant |
| `components/layout/Header.tsx:171, 330` | `/images/header-logo.png` (×2) | config → `SITE_IMAGES.logoLight` |
| `components/layout/SecondaryHeader.tsx:89, 176` | `/images/header-logo.png` (×2) | same (shared header config) |
| `components/layout/Footer.tsx:22` | `/images/logo-footer.png` + `/images/logo-footer-en.png` — **locale-conditional logo pair** | config → `SITE_IMAGES.footerLogo.{en,mn}` |
| `components/appointment/HeaderAppointment.tsx:11` | same pair — **dead file** (A59) | delete |
| `containers/auth/forgot-password-form.tsx:102`, `containers/auth/verify.tsx:52` | `/images/logo-login.png` | config → `SITE_IMAGES.authLogo` |
| `components/booking/ErxesFormModal.tsx:682` | `/images/header-logo.png` | config |
| `components/fund/DinoFundCard.tsx:52`, `DinoFundNote.tsx:37`, `ImpactSection.tsx:50` | `/images/dinofund.png` (×3) | CMS field or config |
| `components/clientPages/VideoPageLayout.tsx:88` | `/images/bg-home.png` — hero background | CMS page thumbnail |
| `components/booking/ReservationSummary.tsx:491`, `clientPages/profilePages/profileBookingDetailPage.tsx:490` | `/images/placeholder-room.jpg` (×2) | config → `SITE_IMAGES.roomPlaceholder` |
| `components/appointment/payment/paymentPage.tsx:123`, `appointment/products/ProductDetail.tsx:73`, `appointment/products/Product.tsx:42`, `clientPages/merchPage/MerchBookingPage.tsx:298`, `merch/MerchProductsCarousel.tsx:104` | `/images/metaBackground.jpg` (×5) | config (same constant as above) |
| `components/clientPages/VideoPageLayout.tsx:…` + `BannerSection.tsx:120` | `/images/banner.png` — the 3D-tour poster, inline-styled | CMS / config (**A34**) |
| `containers/auth/auth-container.tsx:59, 60, 292, 293` | `/images/gallery/terelj1.jpg`, `terelj15.jpg` (×4) — **dead file** | delete |

### 8.4 Hardcoded colours — 68 hex occurrences

| Colour | Count | Where | Should come from |
|---|---|---|---|
| `#DBDBDB` | 23 | 14 in the 5 auth containers (`register-form.tsx` ×10, `forgot-password-form.tsx` ×2, `login-form.tsx` ×2, `reset-password-form.tsx` ×2, `verify.tsx` ×1); `components/AccommodationList.tsx:64`; `accommodationDetailPage.tsx:357, 376`; `dining/DiningCoreButton.tsx:46` | `border` token |
| `#EDEDED` | 4 | `common/privacy-terms-modal.tsx:27, 120`; `common/terms-modal.tsx:23, 177` | `border` / `muted` token |
| `#4D4D4D` | 7 | `login-form.tsx:63, 173`; `register-form.tsx:165`; `verify.tsx:65, 105`; `forgot-password-form.tsx:115, 161` | `muted-foreground` token |
| `#CACACA` | 5 | `reserve/date-picker.tsx:55`; `reserve/guest-counter.tsx:89, 90`; `reserve/room-counter.tsx:60, 61` | `border` token |
| `#6B7280` | 2 | `forgot-password-form.tsx:59, 78` | `muted-foreground` token |
| `#EA580C`, `#15803D`, `#F59E0B` | 4 each | `fund/data.ts:209-212, 227-228, 433-436, 451-452` — Tailwind palette literals as **inline hex in a data module** | `fund` theme tokens / CMS (**A57**) |
| `#57534E`, `#D6D3D1`, `#E7E5E4`, `#EDEDEC` | 2 / 1 each | `fund/data.ts`; `fund/ImpactSection.tsx:14` (4 hex in one style object) | same |
| `#D33718` | 1 | `components/ui/Loader.tsx:13` — **the brand red as a raw hex on the brand's own spinner** | `bg-primary` (**A72**) |
| `#1F2933` | 1 | `clientPages/toursPage/TourCard.tsx:42` | `foreground` token |
| `#F53B31` | 1 | `booking/ErxesFormModal.tsx:236` | `destructive` token |
| `#EB144C` | 1 | `appointment/hooks/useBookingSubmit.tsx:68` — a payment-success green/red pair written as literals | `destructive`/`success` token |
| `#E5E5E5`, `#F5F5F5`, `#3A3A3A`, `#4F4B46` | 1 each | `about-us/OurService.tsx:67`; `common/success-popup.tsx:23, 37` (dead); `common/{privacy-terms,terms}-modal.tsx`; `shared/forms/InformationForm.tsx:52, 66` | tokens |

**Cross-cutting:** the codebase uses `text-black` (194 occurrences) vs `text-foreground` (12), and `text-black/70` opacity as the de-facto muted style. The token system exists in `src/app/globals.css` and `components/ui/button.tsx` uses it correctly — the feature layer simply does not. *Rule: `text-foreground` / `text-muted-foreground` / `border-border`, never raw hex or `text-black`.*

### 8.5 Hardcoded tenant ids

| File (line) | What is hardcoded | Should come from |
|---|---|---|
| `components/appointment/products/category-utils.ts:10-18` | 5 erxes **product-category ids** (`DINING_CATEGORY_ID`, a second id in `DINING_CATEGORY_IDS`, `DINING_PRICING_CATEGORY_ID`, `ACTIVITIES_CATEGORY_ID`, `SPA_CATEGORY_ID`) | PMS/config (**A55**) |
| `components/appointment/products/category-utils.ts:20-25` | `STALE_CATEGORY_IDS` — a 4-entry id→id **migration map** for renamed categories | a data migration, not source |
| `src/lib/cms.ts:19` | `ROOM_PRODUCT_FIELD_ID` — a CMS custom-field id (`field_…`) that maps an accommodation post to its bookable product | CMS field schema exposed by the API (**A56**) |
| `src/lib/cms.ts:40-47` | `NON_PRODUCT_KEYS` — the CMS custom-field key allow-list | CMS field schema |
| `components/contact-us/Maps.tsx:13, 34` + `BannerSection.tsx:154` | GPS coordinates **and** a Google place UUID in 3 URLs | config (**A74**) |
| `src/app/[locale]/(auth)/company-signup/page.tsx:10` | `COMPANY_SIGNUP_COOKIE = "company_signup_unlocked"` — not a secret, but a security-relevant constant defined in a route file | config, and server-verified (**A42**) |
| `components/booking/*`, `shared/forms/*` | Erxes **form ids** and a QPay pipeline/stage id are read from `process.env` at call sites rather than one config module | typed config (**A76**) |
| 28 CMS slugs | See **A75** | `CMS_SLUGS` constant module |

---

## Open Questions / Uncertainties

1. **`formatPrice` — who owns it?** It is **not** in `@/lib/utils`. It exists as two byte-identical local definitions, `components/spa-wellness/SpaAccordton.tsx:23-24` and `components/activities/ActivitiesAccordion.tsx:23-24`, both hardcoding `₮`:
   ```ts
   const formatPrice = (n?: number) =>
     typeof n === "number" ? `${n.toLocaleString()}₮` : "";
   ```
   Separately, `src/lib/utils.ts:71` exports `getCurrencySymbol(currency?, locale?)`, which is a *currency→glyph* mapper, not a price formatter. **Unresolved:** is `formatPrice` meant to live in `@/lib/utils` (and `getCurrencySymbol` be deleted as redundant), or should both live there as `formatPrice(amount, currency, locale)` + `getCurrencySymbol`? Given **A71** — `getCurrencySymbol` maps `MNT` to `"$"` in the `en` locale and returns `"₮"` for *any* unrecognised currency — I would delete it in favour of `Intl.NumberFormat`. Needs a decision before the rewrite.

2. **`isValidUrl` — it does not exist.** `grep -rn "isValidUrl" src/` returns **zero** matches; there is no such export in `src/lib/utils.ts` or anywhere else. If a validation of CMS attachment URLs is expected (e.g. before passing a CMS string to `next/image`, which throws on unconfigured remote hosts), it must be written from scratch. **Unresolved:** was it expected to exist, or is the concern hypothetical? Related: `src/lib/utils.ts:46` `readFile()` accepts any `http(s)://` string unchanged (line 58), so an attacker-controlled CMS field could point `<Image src>` at an arbitrary origin.

3. **The form primitive shape.** `components/ui/form.tsx` is a stock shadcn `<Form/>` (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `useFormField`) built on `react-hook-form` + `@hookform/resolvers/zod`. But there are **two incompatible form stacks** in the repo:
   - **Room checkout** (`clientPages/bookingPages/bookingDetailsPage.tsx:18`) uses `<Form/>` + `useBookingSchemas` (`src/lib/schema/booking`) + **hand-rolled** `<PersonalInfoForm/>`, `<CheckInTimeForm/>`, `<CancellationPolicy/>`, `<PayAtPropertyForm/>` in `components/booking/`.
   - **Appointment checkout** (`shared/BookingLayout.tsx:26-37`) uses the same `<Form/>` + `useAppointmentSchemas` (`src/lib/schema/appointment`) + the **generic** `shared/forms/{TimeForm,PaymentForm,RoomInformationForm,UserInformationForm,ConfirmForm}.tsx`, which take `{ form }` and render their own field rows.
   - **Auth** (`containers/auth/*.tsx`) uses **neither** — inline `useForm` + locally-constructed zod schemas, raw `<Input/>`, no `<Form/>` wrapper.
   **Unresolved:** should the rewrite keep three stacks, or converge on one? If one, does `<Form/>` stay a thin RHF binding (shadcn's intent) or become a schema-driven field renderer that removes the per-screen form components? This decision drives whether `components/booking/*Form.tsx` (15 files) and `components/shared/forms/*` (6 files) survive at all.

4. **`ui/` file casing.** 30 kebab-case shadcn files coexist with 8 PascalCase locals (`GridSkeleton`, `CustomImage`, `FourDotsLoader`, `Icon`, `Loader`, `MainLoader`, `SkeletonAppointment`) plus `responsive-test.tsx` and a `kibo-ui/` directory. This is not cosmetic: `MainLoader` has 17 importers, `Loader` 4, and `Icon`/`GridSkeleton`/`FourDotsLoader`/`SkeletonAppointment` 2 each, all via exact-case paths. **Unresolved:** kebab-case (shadcn convention, matches `alert-dialog.tsx`/`scroll-area.tsx`) or PascalCase (React component convention)? Whichever wins, `main-loader.tsx`, `grid-skeleton.tsx`, `four-dots-loader.tsx`, `icon.tsx`, `loader.tsx`, `skeleton-appointment.tsx` need renaming in a single atomic commit with no alias layer, and `custom-image.tsx` + `responsive-test.tsx` should just be deleted (**A59**). Also undecided: whether `ui/` keeps vendored third-party code (`kibo-ui/video-player/`, 120 lines, currently dead) under a `_vendor/` prefix.

5. **`/products` leftovers in Header and Footer.** I could not find any `/products` **route** in either file — grepping `cart|shop|store|bag|checkout|product|price|sale|discount|order` against `layout/Header.tsx`, `layout/SecondaryHeader.tsx` and `layout/Footer.tsx` returns only `border-*` class matches. What actually leaks in is the **commerce product model** and the **shared footer/header link blocks**:
   - `@/types/products` is imported by `clientPages/VideoPageLayout.tsx:9` (`IAttachment`) and `@/sdk/queries/products` (`useChildProduct`) by `booking/ReservationSummary.tsx:26`, `booking/ReservationSummaryWrapper.tsx:14`, `profile/components/bookingsCard.tsx:13`, `clientPages/bookingPages/bookingPage.tsx:25`, `clientPages/profilePages/profileBookingDetailPage.tsx:23`.
   - `Footer.tsx` re-implements its own two-column link arrays **inline** (`Footer.tsx:40`, `:45`, `:50`) rather than reading CMS menus the way `Header.tsx:40` does via `useCmsMenus` + `getMenuTree` — so any `/products`-style entry added to the CMS appears in the header and **silently not** in the footer.
   **Unresolved:** was the concern a literal `/products` link (not present), the `products` type/query imports (**A51**, **A52**), or the footer/footer menu divergence? The third is a real defect worth a rule: *both headers and the footer must consume the same CMS menu tree.*

6. **`PaymentType` — where does it live?** There is **no `PaymentType.tsx`** anywhere in `src/`. The concept exists twice, locally:
   - `components/booking/payment/payment-detail.tsx:30` — `type PaymentType = "full" | "half";`, plus a local `resolvePaymentType(dealDetail, typeParam)` (line 32) and `const DESCRIPTION: Record<PaymentType, string>` (line 55).
   - `components/appointment/hooks/useTourDeal.tsx:45` — `export type TourPaymentType = "prePayment" | "fullPayment";` (the only *exported* one).
   And a third vocabulary lives in the SDK: `src/sdk/graphql/sales/queries.ts:193` has a GraphQL query literally named `query PaymentTypes($pipelineId: String!)`.
   **Unresolved:** should `PaymentType` become a shared type in `src/types/` (or `src/lib/schema/`), and — harder — **can `"full" | "half"` and `"prePayment" | "fullPayment"` be unified?** The room track and the tour track use different vocabularies for what may be the same concept, and `shared/forms/PaymentForm.tsx` uses a third (`paymentType === "roomCharge"` per `shared/BookingLayout.tsx:29`). Until this is settled, no shared payment form is possible.

7. **Server-component classification — is `Maps.tsx` a real server component, or effectively client?** *(This is the question line 11 of this report refers to.)* `src/components/contact-us/Maps.tsx` has **no** `"use client"` directive, so by the module-directive rule it is the only `src/components` file that could render on the server. But it is imported by `src/components/clientPages/contactUsPage/contactUsPage.tsx:9`, which **is** `"use client"` — so it is bundled and rendered on the client, and the directive buys nothing. The reading key at line 11 asserts it is a "server component *candidate*" while conceding it "makes it client in practice". **Unresolved:** which is authoritative for this report — module directive or effective bundle position? This is not academic: **34** of 196 `src/components` `.tsx` files lack the directive, and 13 of those use hooks/Apollo/Jotai (**A40**), so the directive is *not* a reliable signal of server-renderability in this codebase. Proposed resolution: classify by **effective bundle position** (what the file actually does at runtime), and treat the missing directive on a hook-using file as a defect to be reported rather than as "server-compatible".

8. **The count discrepancy in the header of this report.** Line 5 originally claimed "232 `.tsx` + 6 `.ts`/`.d.ts` helpers". The verified figures are **196 `.tsx` + 17 `.ts`/`.d.ts` = 213 files** in `src/components`, plus **11 `.tsx`** in `src/containers` = **224** total; the 29 338 LOC figure is correct. **Unresolved:** whether "232" was a stale count from a different branch or a miscount; the corrected numbers are now in place at lines 5 and 11, but if a different counting convention was intended (e.g. counting directories, or including `.d.ts` twice) it should be stated.

9. **Is `clientPages/` the right home for page bodies?** Every route renders a `"use client"` page body from `components/clientPages/`, which means **no page renders on the server** except the two that fetch server-side (`forms/[slug]/page.tsx`, `(auth)/company-signup/page.tsx`). **Unresolved:** is this deliberate (uniform CMS-driven pages) or an inherited habit? If deliberate, the rewrite should codify "every route is client-rendered; server work is `generateMetadata` only" and stop paying for `loading.tsx`-less suspense boundaries. If not, migrating the top-traffic routes (home, accommodation) to server components with client islands would remove the need for `refetch()`-on-locale-change entirely (**A49**, **A50**) and let `ui/image` fetch with priority hints.

10. **Should the CMS slug vocabulary be validated at build time?** 28 slugs are hardcoded at call sites and at least one is misspelled (`"bannerdesctiption"`, **A33**). **Unresolved:** can the CMS be queried during the build to assert every slug in `CMS_SLUGS` resolves? If not, what is the acceptable failure mode — a blank section (current), or a build error?

11. **Two competing room-vs-lodge routes.** `/accommodation` and `/lodge-stays` render the **same two components in inverted order** with near-identical markup (`accommodationPage.tsx:48-71` vs `lodgeStaysPage.tsx:48-71`), and `/accommodation/[slug]` vs `/lodge-stays/[slug]` route to two different detail pages with overlapping content. **Unresolved:** is this two genuinely different products, or one product with a legacy URL? The answer determines whether `features.lodgeStays` (§5.3) is a real toggle or a delete.

12. **Appointment booking uses a third shared component name.** `shared/BookingLayout.tsx:5` imports `appointment/products/ProductDetail` as the default right-hand summary column (**A54**), and `shared/forms/` are consumed by both the appointment wizard and `MerchBookingPage.tsx`. **Unresolved:** is `shared/` meant to be cross-feature shared code, or appointment-specific code that happens to sit in `components/shared/`? If cross-feature, it needs a real interface contract; if appointment-specific, it should move under `components/appointment/`.

---

**End of TASK 03 report.**