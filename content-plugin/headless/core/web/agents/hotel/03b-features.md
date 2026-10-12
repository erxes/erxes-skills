# TASK 03b — Feature Components

> Extracted from `03-components.md`; the layouts/shell half is [03a-layouts.md](03a-layouts.md). Read only the spec file for the current phase.

---

### 1.5 `src/components/about-us` — 2

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `about-us/Greeting.tsx` | About-us intro block. | C | — | `aboutUsPage.tsx` | **CORE** |
| `about-us/OurService.tsx` | Services cards (`#4D4D4D` hardcoded). | C | — | `aboutUsPage.tsx` | **CORE** |

### 1.6 `src/components/activities` — 3

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `activities/ActivitiesHero.tsx` | Activities hero carousel with pill tabs. | C | — | `activitiesPage.tsx` | **CORE** |
| `activities/ActivitiesImages.tsx` | Activities image strip. | C | — | `activitiesPage.tsx` | **CORE** |
| `activities/ActivitiesAccordion.tsx` | Activities accordion in a `Card`. | C | — | `activitiesPage.tsx` | **CORE** |

### 1.7 `src/components/accommodation` — 1

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `accommodation/ClientAccommodation.tsx` | Near-duplicate of `components/Accommodation.tsx`. **Dead** — zero importers. | C | `interface RoomInformation` | *(none)* | **OPTIONAL / dead** |

### 1.8 `src/components/appointment` — 37 files

Split into `graphql/` (raw documents), `hooks/`, `products/`, `time/`, `payment/`, and 5 root files.

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `appointment/bookingContext.ts` | **The polymorphism map.** `CONTEXT_CONFIG: Record<BookingContext, …>` with per-context pipelineId, chargedFor, paymentRoute, returnPath. 5 contexts. | S | — | 5 booking pages | **CORE** |
| `appointment/Modal.tsx` | Booking modal with a back button. | C | `interface ModalProps` | `PayAtPropertyForm.tsx` | **CORE** |
| `appointment/BackButton.tsx` | Named-export back nav. | C | — | `Modal.tsx` | **CORE** |
| `appointment/Info.tsx` | Info display block. **Dead.** | S | `interface InfoProps` | *(none)* | **OPTIONAL / dead** |
| `appointment/HeaderAppointment.tsx` | Appointment header. **Dead.** | C | — | *(none)* | **OPTIONAL / dead** |
| `appointment/types/index.d.ts` | Appointment ambient types. | S | — | — | **CORE** |
| `appointment/hooks/useBookingSubmit.tsx` | The appointment submit orchestrator (deal → customer → invoice → navigate). | C | `interface UseBookingSubmitParams` | `bookingPage.tsx`, `MerchBookingPage.tsx` | **CORE** |
| `appointment/hooks/useAddDeal.tsx` | Deal creation via zustand. | S (no directive) | — | `bookingDetailsPage.tsx`, `useTourDeal.tsx`, `useBookingSubmit.tsx` | **CORE** |
| `appointment/hooks/useTourDeal.tsx` | Tour-specific deal lifecycle. | C | — | `TourBookingPage.tsx`, `tourPaymentDetail.tsx` | **OPTIONAL** |
| `appointment/hooks/useDeals.tsx` | Deal list; hardcoded `NEXT_PUBLIC_APPROVED_STAGE_ID`. | S | `interface IDealsData` | `TimeForm.tsx` | **CORE** |
| `appointment/hooks/useProducts.tsx` | Products query wrapper. | S | — | `Info.tsx`, `ProductDetail.tsx` | **CORE** |
| `appointment/hooks/useCategories.tsx` | Product categories; hardcoded `PARENT_CATEGORY_ID`. | S | — | `CategoryForm.tsx` | **CORE** |
| `appointment/hooks/useBranches.tsx` | Branch list. **Dead.** | S | `interface IData` | *(none)* | **OPTIONAL / dead** |
| `appointment/hooks/useUsers.tsx` | Users list. **Dead.** | S | `interface IData` | *(none)* | **OPTIONAL / dead** |
| `appointment/hooks/usePaymentModal.tsx` | zustand store for the payment modal. **Dead.** | S | `interface QpayUrl` | *(none)* | **OPTIONAL / dead** |
| `appointment/products/ProductDetail.tsx` | Sticky booking-summary card: reads `?productId` via nuqs, `name.split("$$")` for locale. | C | — (named + default export) | `shared/BookingLayout.tsx` | **CORE** |
| `appointment/products/Product.tsx` | Product list row. | C | `interface ProductProps` | `ProductForm.tsx` | **CORE** |
| `appointment/products/ProductForm.tsx` | Product editor. | C | `type ProductFormProps` | `DiningAlaCarte.tsx` | **CORE** |
| `appointment/products/Category.tsx` | Category chip. | C | `interface ProductProps` | `CategoryForm.tsx` | **CORE** |
| `appointment/products/CategoryForm.tsx` | Category editor. **Dead.** | C | — | *(none)* | **OPTIONAL / dead** |
| `appointment/products/category-utils.ts` | `DINING_CATEGORY_IDS`, `parseCategoryIds`. | S | — | `diningPage.tsx` | **CORE** |
| `appointment/time/AppointmentPickerDayRange.tsx` | Day-range picker. | C | `interface AppointmentPickerForDayRangeProps` | `TimeForm.tsx` | **CORE** |
| `appointment/time/AppointmentPicker.tsx` | Single-date appointment picker. | C | `type AppointmentPickerProps` | `TimeForm.tsx` | **CORE** |
| `appointment/time/TimeSlot.tsx` | Time-slot grid. **Dead.** | S | `interface TimeSlotProps` | *(none)* | **OPTIONAL / dead** |
| `appointment/payment/paymentPage.tsx` | Appointment payment page (4 routes). | C | — | 4 × `*/payment/[slug]/page.tsx` | **CORE** |
| `appointment/payment/tourPaymentPage.tsx` | Tour payment page. | C | — | `tours/payment/[slug]/page.tsx` | **OPTIONAL** |
| `appointment/payment/tourPaymentDetail.tsx` | 495-line tour payment detail. | C | — | `tourPaymentPage.tsx` | **OPTIONAL** |
| `appointment/graphql/mutations/addDeal.ts` | `addDealsMutation` — `cpDealsAdd`, 10 variables, returns `{productsData, _id, number}`. | S | — | `hooks/useAddDeal.tsx:2` (that hook has 0 importers) | **CORE / dead** |
| `appointment/graphql/mutations/customerAdd.ts` | `customersAddMutation` — `customersAdd`, 24 variables, 45-field customer selection set (incl. `owner{}`, `getTags{}`, `emailValidationStatus`). | S | — | *(none)* | **OPTIONAL / dead** |
| `appointment/graphql/mutations/dealsRemove.ts` | `removeDealMutation` — `dealsRemove($_id)`, returns `_id` only. | S | — | *(none)* | **OPTIONAL / dead** |
| `appointment/graphql/mutations/editDeal.ts` | `editDealsMutation` — `cpDealsEdit`, 21 variables incl. `paymentsData`, `proccessId`, `aboveItemId`, `branchIds`; returns `_id` only. | S | — | *(none)* | **OPTIONAL / dead** |
| `appointment/graphql/mutations/invoice.ts` | Five exports: `ADD_TRANSACTION` (`paymentTransactionsAdd`), `invoiceCreateMutation` (`cpInvoiceCreate`), `invoicesCheckMutation` (`cpInvoicesCheck`), `transactionUpdatedSubscription`, `invoiceUpdatedSubscription`. | S | — | `appointment/payment/paymentPage.tsx:18` — `invoicesCheckMutation` **only**; the other 4 exports have 0 importers | **CORE** |
| `appointment/graphql/queries/branches.ts` | `branchQuery` — `cpPmsBranchList`, returns the full branch config (`pipelineConfig`, `roomCategories`, `checkintime`, `checkouttime`, `checkinamount`, `erxesAppToken`). | S | — | `hooks/useBranches.tsx:2` (0 importers) | **CORE / dead** |
| `appointment/graphql/queries/deal.ts` | `dealsQuery` — `cpDeals` aliased to `deals`, 11 filters, returns `{list[]}` with `products[]`, `customers[]`, `tags[]`, `paymentsData`; plus `dealDetailQuery` (stage only). | S | — | `hooks/useDeals.tsx:2` — `dealsQuery` only (0 importers); `dealDetailQuery` unused | **CORE / dead** |
| `appointment/graphql/queries/productCategories.ts` | `categoryQuery` — `cpProductCategories(parentId, status)` → `_id, code, name, productCount`. | S | — | `hooks/useCategories.tsx:2` (0 importers) | **CORE / dead** |
| `appointment/graphql/queries/products.ts` | `productsQuery` — `cpProducts`, 15 filters → `unitPrice`, `uom`, `category{}`, `attachment{}`. | S | — | `hooks/useProducts.tsx:2` (0 importers) | **CORE / dead** |
| `appointment/graphql/queries/users.ts` | `usersQuery` — `users`, 13 filters → `_id, username, details{avatar, fullName}`. | S | — | `hooks/useUsers.tsx:2` (0 importers) | **CORE / dead** |

> **Duplicated data layer.** All 10 documents re-declare operations that `src/sdk/graphql/` already defines independently: `sales/mutations.ts:25,91` (`cpDealsAdd`, `cpDealsEdit`), `sales/queries.ts:43` (`cpDeals`), `products/queries.ts:4,19` (`cpProductCategories`, `cpProducts`), `rooms/queries.ts:11,118` (`cpProducts`), `payments/mutations.ts:5` (`cpInvoiceCreate`), `sdk/hooks/useAddDeal.tsx:47` (`cpDealsAdd`). Nine of these ten files have **0 importers or are reachable only through dead hooks**; only `invoicesCheckMutation` is live. Consolidate to `src/sdk/` and delete the `appointment/graphql/` tree.

### 1.9 `src/components/auth`, `src/components/authImages` — 2

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `auth/CompanySignupGate.tsx` | Company-signup access-code gate; POSTs `/api/company-signup/unlock`. | C | — | `company-signup/page.tsx` | **OPTIONAL** (B2B) |
| `authImages/images.tsx` | Auth-page right-panel image carousel, CMS-driven (`"loginimages"` slug). | C | — | `app/[locale]/(auth)/layout.tsx` | **CORE** |

### 1.12 `src/components/contact-us` — 3

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `contact-us/ContactForm.tsx` | 314-line contact form with terms consent. | C | — | `contactUsPage.tsx` | **CORE** |
| `contact-us/FaqDatas.tsx` | FAQ accordion; renders `<div id="faq">` target. | C | — | `contactUsPage.tsx` | **CORE** |
| `contact-us/Maps.tsx` | Hardcoded Google Maps embed iframe + directions link. **S** — no `"use client"`; renders fine as a server component. | S | — | `contactUsPage.tsx` | **CORE** |

### 1.13 `src/components/dining` — 7

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `dining/DiningTabs.tsx` | Pill tab bar, exports `DINING_TAB_KEYS` + `DiningTab`. | S | `interface DiningTabsProps` | `diningPage.tsx` | **CORE** |
| `dining/DiningOverviewSection.tsx` | Dining overview. | C | — | `diningPage.tsx` | **CORE** |
| `dining/CulinaryExperiencesSection.tsx` | Experiences tab body. | C | — | `diningPage.tsx` | **CORE** |
| `dining/DiningAlaCarte.tsx` | À-la-carte tab body. | S | `interface DiningAlaCarteProps` | `diningPage.tsx` | **CORE** |
| `dining/GridImages.tsx` | Image grid + carousel. **Dead** (its own child `DiningOverviewSection` duplicates the role). | S | `interface GridImagesProps` | *(none)* | **OPTIONAL / dead** |
| `dining/RootedDeep.tsx` | "Rooted Deep" strip. **Dead.** | C | — | *(none)* | **OPTIONAL / dead** |
| `dining/DiningCoreButton.tsx` | CTA cluster. **Dead.** | C | `interface CoreButtonsProps` | *(none)* | **OPTIONAL / dead** |

### 1.14 `src/components/fund` — 12 — all OPTIONAL (Dino Fund)

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `fund/FundHero.tsx` | Fund hero. | C | — | `fundPage.tsx` | **OPTIONAL** (fund) |
| `fund/ImpactSection.tsx` | Impact stats. | C | — | `fundPage.tsx` | **OPTIONAL** (fund) |
| `fund/ProjectsSection.tsx` | Project cards. | C | — | `fundPage.tsx` | **OPTIONAL** (fund) |
| `fund/FaqSection.tsx` | Fund FAQ accordion. | C | — | `fundPage.tsx` | **OPTIONAL** (fund) |
| `fund/FundImage.tsx` | Fund image primitive. | C | — | 5 files | **OPTIONAL** (fund) |
| `fund/DinoFundCard.tsx` | Donation card. | C | — | `bookingPaymentPage.tsx` | **OPTIONAL** (fund) |
| `fund/DinoFundNote.tsx` | Donation footnote. | C | — | `ReservationSummary.tsx` | **OPTIONAL** (fund) |
| `fund/icons.tsx` | Fund SVG icon set. | S | — | 3 files | **OPTIONAL** (fund) |
| `fund/data.ts` | **615 lines** of hardcoded fund copy (EN + MN). | S | — | `useFundContent.ts` | **OPTIONAL** (fund) |
| `fund/cms.ts` | CMS field mapping for fund. | S | — | `useFundContent.ts` | **OPTIONAL** (fund) |
| `fund/useFundContent.ts` | Content resolution hook (CMS → fallback to `data.ts`). | S | — | `fundPage.tsx` | **OPTIONAL** (fund) |
| `fund/useSectionHash.ts` | Scroll-spy hook. | S | — | `fundPage.tsx` | **OPTIONAL** (fund) |

### 1.15 `src/components/merch` — 4 — all OPTIONAL

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `merch/MerchHero.tsx` | Merch hero carousel. | C | — | `merchPage.tsx` | **OPTIONAL** (merch) |
| `merch/FeaturedMerch.tsx` | Featured products grid. | C | — | `merchPage.tsx` | **OPTIONAL** (merch) |
| `merch/MerchProductsCarousel.tsx` | All-products carousel; hardcoded `MERCH_CATEGORY_ID`. | C | — | `merchPage.tsx` | **OPTIONAL** (merch) |
| `merch/SectionHeading.tsx` | Centered heading with an **unused `eyebrow` prop**. | S | `interface SectionHeadingProps { eyebrow, title, className? }` | 2 merch files | **OPTIONAL** (merch) |

### 1.16 `src/components/profile` — 7

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `profile/personal.tsx` | Profile personal-info tab. | C | — | `profile/page.tsx` | **CORE** (account) |
| `profile/security.tsx` | Password + 2FA-ish tab (uses `Badge`). | C | — | `profile/page.tsx` | **CORE** (account) |
| `profile/bookings.tsx` | Booking-history tab. | C | — | `profile/page.tsx` | **CORE** (account) |
| `profile/components/bookingsCard.tsx` | 421-line booking card + `CancelBookingDialog`. | S | `type BookingsCardProps` | `bookings.tsx` | **CORE** (account) |
| `profile/components/CancelBookingDialog.tsx` | Cancel confirm + refund note. | C | — | `bookingsCard.tsx` | **CORE** (account) |
| `profile/components/ReviewSection.tsx` | Write a review for a past stay. | C | `type ReviewSectionProps` | `profileBookingDetailPage.tsx` | **CORE** (reviews) |
| `profile/components/updatePassword.tsx` | Change-password form. | C | — | `security.tsx` | **CORE** (account) |

### 1.19 `src/components/spa-wellness` — 4

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `spa-wellness/Stillness.tsx` | Page title + description block. | S | `{ title, description }` (inline) | `spaWellnessPage.tsx` | **CORE** |
| `spa-wellness/SpaImages.tsx` | Spa image carousel. | C | — | `spaWellnessPage.tsx` | **CORE** |
| `spa-wellness/SpaContent.tsx` | `Card` wrapper for `SpaAccordion`. | C | — | `spaWellnessPage.tsx` | **CORE** |
| `spa-wellness/SpaAccordton.tsx` | Spa accordion. **Note the typo in the filename** (`Accordton`). | C | — | `SpaContent.tsx` | **CORE** |

### 1.20 `src/components/sustainability` — 1

| Path | Purpose | S/C | Props | Used by | Class |
|---|---|---|---|---|---|
| `sustainability/SustainabilitySection.tsx` | Alternating image-carousel + `ContentRenderer` rows; has 3 optional callbacks to push hero content upward. | C | `type Props { onTextChange?, onTitleChange?, onImageChange? }` | `sustainabilityPage.tsx` | **CORE** |

### 3.11 `src/components/Accommodation.tsx` — 285 lines

**Props interface**

```ts
type AccommodationProps = {
  perPage?: number;
};
```

**Purpose.** The room-card list. Mobile = one-per-view autoplaying carousel with dot indicators; desktop = 2-column grid. It is the join point between **CMS content** (room name, excerpt, thumbnail, amenities) and **PMS data** (live price per room), which is why it imports from three different subsystems.

**FULL REAL SOURCE**

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "./ui/image";
import { getIconByLabel } from "@/lib/utils";
import { getRoomProductId } from "@/lib/cms";
import { useParams } from "next/navigation";
import { useCmsPostsBySlug } from "@/sdk/queries/cms";
import useRooms from "@/sdk/queries/rooms";
import { useRoomPricing } from "@/sdk/hooks/useRoomPricing";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { ICmsPost } from "@/types/cms";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface RoomInformation {
  icon: React.ReactNode | string;
  label: string;
}

const parseInformationString = (
  informationString: string,
): RoomInformation[] => {
  if (!informationString || typeof informationString !== "string") {
    return [];
  }

  return informationString
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((label) => {
      const IconComponent = getIconByLabel(label);
      return {
        icon: <IconComponent className="w-4 h-4" />,
        label: label,
      };
    });
};

type AccommodationProps = {
  perPage?: number;
};

const Accommodation = ({ perPage }: AccommodationProps) => {
  const params = useParams();
  const currentLocale = params.locale as string;
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [active, setActive] = useState(0);

  const { rooms, loading: roomsLoading } = useRooms();
  const { getRoomUnitPrice } = useRoomPricing();

  const {
    posts: accommodation,
    loading: postsLoading,
    refetch,
  } = useCmsPostsBySlug("accommodation", {
    language: currentLocale,
  });

  useEffect(() => {
    refetch();
  }, [currentLocale]);

  const limitedAccommodation = useMemo(
    () => (perPage ? accommodation.slice(0, perPage) : accommodation),
    [accommodation, perPage],
  );

  const isLoading = roomsLoading || postsLoading;

  const autoplayRef = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActive(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 w-full lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`rounded-3xl p-3 lg:p-5 space-y-3 animate-pulse ${i === 1 ? "hidden lg:block" : ""}`}
          >
            <div className="w-full aspect-[5/2] rounded-2xl bg-gray-200" />
            <div className="space-y-2">
              <div className="w-2/3 h-4 bg-gray-200 rounded" />
              <div className="w-full h-3 bg-gray-200 rounded" />
              <div className="w-5/6 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const AccommodationCard = ({ item }: { item: ICmsPost }) => {
    const t = useTranslations("Accommodation");

    return (
      <Card className="p-3 h-full rounded-3xl lg:p-5">
        <div className="flex flex-col space-y-3 h-full">
          <Link href={`/accommodation/${item._id}`}>
            <div className="w-full aspect-[5/2] overflow-hidden">
              <Image
                width={1920}
                height={1080}
                src={item?.thumbnail?.url}
                alt={item.title}
                className="object-cover w-full h-full rounded-2xl"
              />
            </div>

            <CardContent className="flex flex-col flex-1 justify-between">
              <div className="space-y-3 mt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium leading-normal text-black uppercase font-roboto lg:text-lg">
                    {item.title}
                  </h3>
                  {(() => {
                    const productId = getRoomProductId(item);
                    const correspondingRoom = rooms.find(
                      (room) => productId === room._id,
                    );

                    const basePriceMnt =
                      getRoomUnitPrice(correspondingRoom) ||
                      Number(item?.customFieldsMap?.rooms?.price) ||
                      0;

                    return (
                      <span className="text-base font-medium leading-normal text-black font-roboto lg:text-lg">
                        {basePriceMnt.toLocaleString()}₮{" "}
                        <span className="font-normal text-xs lg:text-base text-gray-500">
                          {t("per night")} / {t("per person")}
                        </span>
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs font-normal leading-relaxed text-black opacity-80 font-dm-sans lg:text-base">
                  {item.excerpt?.split(" ").slice(0, 26).join(" ")}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const information =
                      item?.customFieldsMap?.rooms?.information;

                    if (!information) return null;

                    const parsedInformation =
                      typeof information === "string"
                        ? parseInformationString(information)
                        : (information as RoomInformation[]);

                    const getMaxVisible = () => {
                      if (typeof window === "undefined") return 3;
                      if (window.innerWidth < 640) return 1;
                      if (window.innerWidth < 1024) return 2;
                      return 3;
                    };

                    const maxVisible = getMaxVisible();
                    const visibleItems = parsedInformation.slice(0, maxVisible);
                    const remainingCount =
                      parsedInformation.length - maxVisible;

                    return (
                      <>
                        {visibleItems.map(
                          (info: RoomInformation, index: number) => (
                            <div
                              key={index}
                              className="border rounded-full flex p-1.5 lg:p-2 justify-center items-center gap-2.5 backdrop-blur-md"
                            >
                              <div>{info.icon}</div>

                              <span className="text-xs font-normal leading-normal text-black font-roboto lg:text-sm">
                                {info.label}
                              </span>
                            </div>
                          ),
                        )}

                        {remainingCount > 0 && (
                          <div className="border rounded-full flex p-1.5 lg:p-2 justify-center items-center gap-2.5 backdrop-blur-md">
                            <Plus className="w-4 h-4" />

                            <span className="text-xs font-normal leading-normal text-black font-roboto lg:text-sm">
                              {remainingCount}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <Button variant="outline" size="lg">
                  {t("See more")}
                </Button>
              </div>
            </CardContent>
          </Link>
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full">
      <div className="lg:hidden">
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          plugins={[autoplayRef.current]}
          className="w-full"
          onMouseEnter={() => autoplayRef.current?.stop?.()}
          onMouseLeave={() => autoplayRef.current?.play?.()}
          onTouchStart={() => autoplayRef.current?.stop?.()}
          onTouchEnd={() => autoplayResidue?.play?.()}
          onTouchCancel={() => autoplayRef.current?.play?.()}
        >
          <CarouselContent>
            {limitedAccommodation.map((item: ICmsPost) => (
              <CarouselItem key={item._id} className="basis-full">
                <AccommodationCard item={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {limitedAccommodation.length > 1 && (
          <div className="flex gap-2 justify-center items-center mt-2">
            {limitedAccommodation.map((_: ICmsPost, i: number) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  active === i ? "w-6 bg-gray-400" : "w-2 bg-gray-400/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hidden grid-cols-2 gap-6 lg:grid">
        {limitedAccommodation.map((item: ICmsPost) => (
          <AccommodationCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Accommodation;
```

> **Correction on line `onTouchEnd`.** The real source reads `onTouchEnd={() => autoplayRef.current?.play?.()}` (line 250). The `autoplayResidue` above is a transcription slip on my part — the file is `onTouchEnd={() => autoplayRef.current?.play?.()}`. Verified against the file; treat the earlier block as authoritative for every other line.

**Composition.** `ui/card`, `ui/carousel` + `Autoplay`, `ui/image`, `ui/button`, `getIconByLabel`, `getRoomProductId`, `ICmsPost`. The card itself is an **inner component function defined inside the render body** (line 122), so it is re-created and its `useTranslations` is re-run on every parent render.

**Three data sources joined.**

| Source | Hook | Supplies |
|---|---|---|
| CMS | `useCmsPostsBySlug("accommodation", { language })` | title, excerpt, thumbnail, `customFieldsMap.rooms.{price,information}` |
| PMS | `useRooms()` | room products (`_id`, name) |
| Pricing | `useRoomPricing().getRoomUnitPrice(room)` | live unit price |

The join key is `getRoomProductId(item)` from `src/lib/cms.ts`, which reads a hardcoded CMS custom-field id. Price resolution has a three-step fallback: `getRoomUnitPrice(correspondingRoom) || Number(customFieldsMap.rooms.price) || 0`.

**State / hooks.** `api: CarouselApi | null`, `active: number`, `autoplayRef`, plus 3 `useEffect`s (locale refetch, Embla `select`/`reInit` subscription, none for the card).

**The amenities-pill logic — copy this idea, fix the implementation.** CMS stores amenities as a **comma-separated string** in one custom field. `parseInformationString` splits on `,`, trims, and maps each label through `getIconByLabel` (a fuzzy substring matcher covering English and Mongolian terms — `m²`/`size`→`VectorSquare`, `guest`/`хүн`→`Users`, `wifi`→`Wifi`, `shower`/`шүршүүр`→`ShowerHead`, `bath`/`ариун`→`Bath`, `terrace`/`тэррас`→`TreePine`, `smart`/`систем`→`Zap`, `air`/`агааржуулагч`→`Wind`, `stargazing`/`window`/`цонх`→`Eye`, fallback `Plus`). It then shows the first 1/2/3 pills and collapses the rest into a `+N` pill.

**Three defects here:**
1. `getMaxVisible()` calls `window.innerWidth` **during render**, outside any effect or `useMediaQuery` — it breaks SSR (there is no `window` on the server, hence the `typeof window === "undefined"` fallback) and it will not re-render on resize.
2. `<Link>` wraps the whole card **including** the `<Button>` "See more". Nested interactive elements.
3. The `₮` currency symbol is a hardcoded literal in JSX; `src/lib/utils.ts` already has `getCurrencySymbol(currency, locale)`.

**Styling.** Card `p-3 lg:p-5 rounded-3xl`; image wrapper `aspect-[5/2]` + `rounded-2xl`; title `text-base lg:text-lg uppercase font-medium text-black font-roboto`; excerpt `text-xs lg:text-base font-dm-sans opacity-80` (the only place DM Sans is used on a card); pills `border rounded-full p-1.5 lg:p-2 gap-2.5 backdrop-blur-md`.

**GENERALIZED version**

```tsx
type AccommodationProps = {
  perPage?: number;
  heading?: { title: string; description: string };  // ← currently duplicated in 3 parents
  currency?: string;
};

const Accommodation = ({ perPage, heading, currency = "MNT" }: AccommodationProps) => {
  // Pills: replace getMaxVisible() with a CSS-only reveal so it is SSR-safe
  //        and resize-reactive:
  //   <div className="flex [&>*:nth-child(n+2)]:hidden lg:[&>*:nth-child(n+3)]:hidden …">
  //   plus a "+N" pill whose count comes from React state, not a DOM measurement.
  // Price: use `getCurrencySymbol(currency, locale)` instead of a literal "₮".
  // Card:  make the whole card a <Link>, and render "See more" as a <span>
  //        styled like the button, not a nested <Button>.
  // Move AccommodationCard out of the render body into a top-level component.
};
```

---

### 3.13 `src/components/NewsSection.tsx` — 221 lines

**Props interface**

```ts
interface NewsSectionProps {
  showHeader?: "false" | "true";
  layout?: "carousel" | "grid";
}
```

**Purpose.** News/blog cards, with a `carousel`-on-mobile / grid-on-desktop layout and a variant that forces a pure grid. This is the **canonical carousel⇄grid swap** in the codebase, and it is duplicated verbatim in `Accommodation.tsx` and `LodgeStays.tsx`.

**FULL REAL SOURCE**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "./ui/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCmsPageDetail,
  useCmsPostsBySlug,
} from "@/sdk/queries/cms";
import { ICmsPost } from "@/types/cms";
import GridSkeleton from "@/components/ui/GridSkeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useParams } from "next/navigation";

interface NewsSectionProps {
  showHeader?: "false" | "true";
  layout?: "carousel" | "grid";
}

const NewsSection = ({
  showHeader = "false",
  layout = "carousel",
}: NewsSectionProps) => {
  const t = useTranslations("News");
  const params = useParams();
  const currentLocale = params.locale as string;

  const [api, setApi] = useState<CarouselApi | null>(null);
  const [active, setActive] = useState(0);

  const {
    posts: news,
    loading,
    refetch,
  } = useCmsPostsBySlug("news", {
    language: currentLocale,
  });

  const { page, refetch: newsRefetch } = useCmsPageDetail(
    "newssection",
    currentLocale,
  );

  useEffect(() => {
    refetch();
    newsRefetch();
  }, [currentLocale]);

  const autoplayRef = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActive(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const NewsCard = ({ item }: { item: ICmsPost }) => (
    <Link href={`/news/${item._id}`}>
      <article className="space-y-3">
        <Image
          src={item?.thumbnail?.url}
          alt={item.title}
          width={1920}
          height={1080}
          className="object-cover rounded-2xl h-[200px] lg:h-[300px] w-full"
        />

        <div className="space-y-2">
          <div className="flex overflow-hidden gap-2 items-center text-xs font-normal leading-normal truncate text-black/70 font-roboto lg:text-sm">
            {item?.tags &&
              Array.isArray(item?.tags) &&
              item?.tags.length > 0 && (
                <>
                  <span className="font-medium">{item?.tags[0]?.name}</span>
                  <span>•</span>
                </>
              )}
            {formatDate((item as any).createdAt || new Date().toISOString())}
          </div>

          <h3 className="text-base font-normal leading-normal text-black font-roboto lg:text-lg">
            {item.title}
          </h3>

          <p className="overflow-hidden text-xs font-normal leading-normal text-black/70 font-roboto">
            {item.excerpt.slice(0, 170)}
          </p>
        </div>
      </article>
    </Link>
  );

  return (
    <section className="container">
      {showHeader === "false" ? (
        <>
          <div className="mb-4 lg:mb-10">
            <h1 className="text-2xl not-italic font-normal leading-normal text-black font-roboto lg:text-3xl">
              {page?.name || ""}
            </h1>

            <div className="flex justify-between items-center mt-3">
              <p className="font-roboto text-xs lg:text-base font-normal leading-5 text-black max-w-[320px] md:max-w-3xl lg:max-w-full">
                {page?.description || ""}
              </p>

              <Link
                href="/news"
                className="flex justify-center items-center gap-2.5 font-roboto text-sm lg:text-base font-normal leading-normal text-black"
              >
                {t("See All")}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 lg:mb-10">
            <h1 className="text-2xl not-italic font-normal leading-normal text-black font-roboto lg:text-3xl">
              {page?.name || ""}
            </h1>

            <div className="flex justify-between items-center mt-3">
              <p className="font-roboto text-xs lg:text-base font-normal leading-5 text-black max-w-[320px] md:max-w-3xl lg:max-w-full">
                {page?.description || ""}
              </p>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="mb-8">
          <GridSkeleton mobileSingle={true} />
        </div>
      )}

      {!loading && layout === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {news.map((item: ICmsPost) => (
            <NewsCard key={item._id} item={item} />
          ))}
        </div>
      ) : !loading ? (
        <>
          <div className="lg:hidden">
            <Carousel
              setApi={setApi}
              opts={{ loop: true }}
              plugins={[autoplayRef.current]}
              className="w-full"
              onMouseEnter={() => autoplayRef.current?.stop?.()}
              onMouseLeave={() => autoplayRef.current?.play?.()}
              onTouchStart={() => autoplayRef.current?.stop?.()}
              onTouchEnd={() => autoplayRef.current?.play?.()}
              onTouchCancel={() => autoplayRef.current?.play?.()}
            >
              <CarouselContent>
                {news.map((item: ICmsPost) => (
                  <CarouselItem key={item._id} className="basis-full">
                    <NewsCard item={item} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {news.length > 1 && (
              <div className="flex gap-2 justify-center items-center mt-2">
                {news.map((_: ICmsPost, i: number) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      active === i ? "w-6 bg-gray-400" : "w-2 bg-gray-400/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-3 lg:gap-6">
            {news.map((item: ICmsPost) => (
              <NewsCard key={item._id} item={item} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};

export default NewsSection;
```

**Composition.** `ui/image`, `ui/carousel` + `Autoplay`, `ui/GridSkeleton`, locale-aware `Link`, `ICmsPost`, `useTranslations("News")`.

**The carousel⇄grid pattern (verbatim in 3 files).**

```tsx
<div className="lg:hidden">
  <Carousel setApi={setApi} opts={{ loop: true }} plugins={[autoplayRef.current]}
    className="w-full"
    onMouseEnter={() => autoplayRef.current?.stop?.()}
    onMouseLeave={() => autoplayRef.current?.play?.()}
    onTouchStart={() => autoplayRef.current?.stop?.()}
    onTouchEnd={() => autoplayRef.current?.play?.()}
    onTouchCancel={() => autoplayRef.current?.play?.()}
  >
    <CarouselContent>{items.map(i => <CarouselItem key={i._id} className="basis-full"><Card item={i}/></CarouselItem>)}</CarouselContent>
  </Carousel>
  {items.length > 1 && (
    <div className="flex gap-2 justify-center items-center mt-2">
      {items.map((_, i) => <span key={i}
        className={`h-1.5 rounded-full transition-all ${active === i ? "w-6 bg-gray-400" : "w-2 bg-gray-400/30"}`} />)}
    </div>
  )}
</div>

<div className="hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-3 lg:gap-6">
  {items.map(i => <Card key={i._id} item={i} />)}
</div>
```

**Defects.**
1. `showHeader?: "false" | "true"` is typed as a **string union of the literals `"false"` and `"true"`**, then compared with `showHeader === "false"`. It reads like a boolean but is not one, and the two branches differ only by the presence of the "See All" link — a 25-line duplicated block for a single conditional element.
2. `formatDate` hardcodes `"mn-MN"` — every news date renders in Mongolian numerals/format regardless of the active locale. (See AVOID #20.)
3. `(item as any).createdAt || new Date().toISOString()` — silently substitutes *today* when the field is missing, so a card can display a fabricated date.
4. `item.excerpt.slice(0, 170)` cuts mid-word with no ellipsis.
5. The "See All" link has `group-hover:translate-x-0.5` on the icon but **no `group` class on any ancestor** — the hover never fires.
6. `NewsCard` is defined inside the render body again (line 84).
7. The ternary chain `loading && …` / `!loading && layout === "grid" ? … : !loading ? … : null` is redundant; `loading` is already excluded twice.

**Brand content.** The `ArrowRight`, the `See All` label and `page.name`/`page.description` come from messages/CMS. The `?` separators and the `mn-MN` locale do not.

**GENERALIZED version**

```tsx
type NewsSectionProps = {
  /** Whether to render the "See all" affordance. */
  withSeeAll?: boolean;
  layout?: "carousel" | "grid";
  perPage?: number;
  hrefBase?: string;   // ← "/news"
};

const NewsSection = ({ withSeeAll = true, layout = "carousel", perPage, hrefBase = "/news" }: NewsSectionProps) => {
  const locale = useLocale();            // ← instead of hardcoding "mn-MN"
  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale, {
    year: "numeric", month: "long", day: "numeric",
  });

  // Header: one block, `{withSeeAll && <Link/>}` — not two duplicated blocks.
  // Card:  move to a top-level `<NewsCard item={item}/>` component.
  // Dates: render nothing when `createdAt` is absent rather than falling back to today.
  // Extract `<CarouselOrGrid items renderItem/>` — it is duplicated 5× in this repo.
};
```

---

### 6.1 `/` — Home

```
src/app/[locale]/page.tsx                                    [server]  generateMetadata omitted; 5-line wrapper
└── ClientHomePage            components/clientPages/homePage/homePage.tsx   ["use client"]
    │   useCmsPageDetail("home", locale) · useCmsPosts()
    └── VideoPageLayout        components/clientPages/VideoPageLayout.tsx
        ├── ReserveText        components/layout/ReserveText.tsx              [no directive]
        ├── ui/carousel (Embla) + ui/image
        └── Reserve            components/layout/Reserve.tsx                  ← floating booking bar
            ├── reserve/date-picker.tsx  → ui/minimalist-calendar, ui/popover, ui/calendar
            ├── reserve/room-counter.tsx  → ui/counter
            └── reserve/guest-counter.tsx → ui/counter
    └── <div class="space-y-10 lg:space-y-15">            ← the single spacing primitive
        ├── WhyChooseUs           components/WhyChooseUs.tsx        → ScrollStack.tsx
        ├── AccommodationList     components/AccommodationList.tsx  → Accommodation.tsx
        │                                                    → ui/{card,carousel,button,image}
        ├── JourneySection        components/JourneySection.tsx
        ├── GallerySection        components/GallerySection.tsx
        ├── NewsSection           components/NewsSection.tsx       → ui/carousel, ui/GridSkeleton, ui/image
        ├── MemoriesSection       components/MemoriesSection.tsx
        ├── BannerSection         components/BannerSection.tsx     [isShow isContainer]  ← 3D iframe, lazy
        └── (SubscriptionSection commented out, homePage.tsx:44)
```

### 6.2 `/accommodation` and `/accommodation/[slug]`

```
src/app/[locale]/accommodation/page.tsx                       [server]
│   generateMetadata → getTranslations("Metadata") + useMetadata
└── ClientAccommodationPage   components/clientPages/accommodationPage/accommodationPage.tsx
    │   useCmsPageDetail("accommodationsection" | "accommodation" | "lodgestays", locale)
    └── VideoPageLayout  components/clientPages/VideoPageLayout.tsx
        ├── <div class="space-y-10 lg:space-y-15 container">
        │   ├── <h1> + <p>  ← heading block repeated twice verbatim (lines 50-57 and 62-69)
        │   ├── Accommodation   components/Accommodation.tsx
        │   │     useCmsPostsBySlug("accommodation") + useRooms() + useRoomPricing()
        │   │     join via getRoomProductId (lib/cms) · getIconByLabel (lib/utils)
        │   │     └── ui/{card,carousel,button,image}
        │   └── LodgeStays       components/LodgeStays.tsx
        └── Reserve (via VideoPageLayout)

src/app/[locale]/accommodation/[slug]/page.tsx                [server]
│   generateMetadata → getCmsPostDetail(slug, locale)         ← server fetch, metadata only
└── ClientAccommodationDetailPage
        components/clientPages/accommodationPage/accommodationDetailPage.tsx
        └── DefaultPageLayout  components/clientPages/DefaultPageLayout.tsx
            └── room gallery + amenities pills + price + related rooms
```

`/lodge-stays` and `/lodge-stays/[slug]` render `clientPages/lodgeStaysPage/lodgeStaysPage.tsx` and `clientPages/accommodationPage/lodgeStaysDetailPage.tsx` — the **same two sections in inverted order** (`lodgeStaysPage.tsx:48-71` vs `accommodationPage.tsx:48-71`).

### 6.3 `/booking/**` — room checkout (the CORE track)

```
src/app/[locale]/booking/page.tsx                             [server]
│   generateMetadata → Metadata.bookingRooms*
└── ClientBookingRoomsPage   components/clientPages/bookingPages/bookingPage.tsx   (plURAL dir)
    │   useResultRooms() · useChildProduct() · useRoomPricing()
    │   jotai: selectedRoomsAtom, roomGuestAssignmentsAtom, currentStepAtom,
    │          reserveAtom, dealIdAtom  (@/store/reserve)
    └── BookingLayout       src/app/[locale]/booking/booking-layout.tsx        ← from app/, not components/
        │   jotai: selectedRoomsAtom, currentStepAtom · useEffect → router.push("/booking") if empty
        └── BookingSteps   src/app/[locale]/booking/components/BookingSteps.tsx
    ├── Reserve           components/layout/Reserve.tsx   [hideCloseButton fixedOpen]
    ├── SelectedRoomsCard src/app/[locale]/booking/components/SelectedRoomsCard.tsx   ← app/ again
    └── ui/{button,card,image} · MainLoader
```

Step 2 — details:

```
src/app/[locale]/booking/details/page.tsx                     [server]
└── ClientBookingDetailsPage  components/clientPages/bookingPages/bookingDetailsPage.tsx
    ├── BookingLayout          (same app/-side layout)
    ├── ui/form               components/ui/form.tsx           ← react-hook-form + zodResolver
    │   useBookingSchemas (lib/schema/booking) · useAddDeal · useDealEdit · useStages
    │   jotai: currentStepAtom, dealIdAtom · currentConfigAtom
    ├── PersonalInfoForm      components/booking/PersonalInfoForm.tsx
    ├── CheckInTimeForm       components/booking/CheckInTimeForm.tsx
    │     └── shared/forms/TimeForm.tsx                        ← SHARED with tours
    ├── CancellationPolicy    components/booking/CancellationPolicy.tsx
    ├── PayAtPropertyForm     components/booking/PayAtPropertyForm.tsx
    └── ReservationSummaryWrapper  components/booking/ReservationSummaryWrapper.tsx
        └── ReservationSummary      components/booking/ReservationSummary.tsx   ← 819 lines, largest file
```

Step 3 — payment:

```
src/app/[locale]/booking/payment/[slug]/page.tsx               [server]
│   generateMetadata COMMENTED OUT (lines 8-24)
└── ClientBookingPaymentPage  components/clientPages/bookingPages/bookingPaymentPage.tsx
    ├── BookingLayout          (same app/-side layout)
    ├── PaymentDetail          components/booking/payment/payment-detail.tsx
    ├── ReservationSummaryWrapper → ReservationSummary
    └── DinoFundCard           components/fund/DinoFundCard.tsx   ← ★ FUND LEAKS INTO CORE CHECKOUT
        └── ui/card · fund/data.ts
```

Step 4 — confirm: `src/app/[locale]/booking/confirm/page.tsx` → `bookingConfirmPage.tsx` → `BookingLayout` + `ui/button` only.

**Parallel payment pages, shared by 4 routes** (this is the `appointment` tree):

```
activities/payment/[slug]/page.tsx ┐
dining/payment/[slug]/page.tsx     ├→ components/appointment/payment/paymentPage.tsx
spa-wellness/payment/[slug]/page.tsx ┤
merch/payment/[slug]/page.tsx     ┘
tours/payment/[slug]/page.tsx       → components/appointment/payment/tourPaymentPage.tsx
```

**Parallel appointment-checkout track**, shared by 3 routes — note the *singular* folder:

```
src/app/[locale]/activities/booking/page.tsx    ┐
src/app/[locale]/dining/booking/page.tsx       ├→ components/clientPages/bookingPage/bookingPage.tsx   (SINGULAR dir)
src/app/[locale]/spa-wellness/booking/page.tsx ┘        104 lines
    │   useQueryState (nuqs) · useForm + zodResolver
    │   useAppointmentSchemas (lib/schema/appointment) · useCurrentUser · usePoscProductDetail
    │   useBookingSubmit  components/appointment/hooks/useBookingSubmit.tsx
    ├── DefaultPageLayout   components/clientPages/DefaultPageLayout.tsx
    └── BookingLayout       components/shared/BookingLayout.tsx     ← DIFFERENT from the app/ one
        ├── ui/form
        ├── shared/forms/TimeForm.tsx
        ├── shared/forms/PaymentForm.tsx
        ├── shared/forms/RoomInformationForm.tsx   ← only when paymentType === "roomCharge"
        ├── shared/forms/UserInformationForm.tsx   ← otherwise
        ├── shared/forms/ConfirmForm.tsx
        └── appointment/products/ProductDetail.tsx  (sticky right column)
```

### 6.4 `/tours/**`

```
src/app/[locale]/tours/page.tsx                                [server]
│   generateMetadata → Metadata.tours*
└── ClientToursPage   components/clientPages/toursPage/toursPage.tsx   ["use client"]
    ├── ToursHero     components/clientPages/toursPage/ToursHero.tsx
    │                     [activeTab onTabChange]          ← hero owns the pill tab bar
    └── ui/tabs (Radix)  value={activeTab} useState("packages")
        ├── TabsContent "packages" → ToursList    components/clientPages/toursPage/ToursList.tsx
        │                            └── TourCard  components/clientPages/toursPage/TourCard.tsx
        └── TabsContent "custom"   → CreateOwnTripForm
                                   components/clientPages/toursPage/CreateOwnTripForm.tsx
                                       └── shared/forms/TimeForm.tsx      ← SHARED with booking


src/app/[locale]/tours/[id]/page.tsx                          [server]
│   generateMetadata → getTmsTourDetail(id)   ← tms SDK, server-side
└── ClientTourDetailPage   components/clientPages/toursPage/tourDetailPage.tsx
    │   useTmsTourDetail (client re-fetch of the same data)
    │   getTourImageSrc (lib/tms) · formatShortDate (lib/date) · cn, getAttachmentUrl, readFile
    ├── TourItineraryAccordion  components/clientPages/toursPage/TourItineraryAccordion.tsx
    ├── TourPricing             components/clientPages/toursPage/TourPricing.tsx
    └── ui/{button,image} · MainLoader


src/app/[locale]/tours/booking/page.tsx                        [server]
└── ClientTourBookingPage  components/clientPages/toursPage/TourBookingPage.tsx
    └── (own booking/payment UI; parallel to the room track, not shared with it)


src/app/[locale]/tours/payment/[slug]/page.tsx                 [server]
└── components/appointment/payment/tourPaymentPage.tsx          ← shared appointment payment tree
```

### 6.5 Two routes that invert the normal direction

Both are server components that compose **sections directly**, bypassing `clientPages/` entirely:

```
src/app/[locale]/news/page.tsx                    [server]
└── DefaultPageLayout  components/clientPages/DefaultPageLayout.tsx
    └── NewsSection    components/NewsSection.tsx   [showHeader="true" layout="grid"]

src/app/[locale]/profile/page.tsx                  [server, async]   awaits searchParams.tab
└── DefaultPageLayout
    └── ui/tabs (Radix)  defaultValue={activeTab}
        ├── profile/personal.tsx
        ├── profile/security.tsx
        └── profile/bookings.tsx → components/profile/components/bookingsCard.tsx

src/app/[locale]/(auth)/layout.tsx                [server]
└── components/authImages/images.tsx              ← brand art, no client wrapper

src/app/[locale]/(auth)/company-signup/page.tsx   [server, async]  awaits cookies()
└── components/auth/CompanySignupGate.tsx         [initialUnlocked={boolean}]
    └── containers/auth/register-form.tsx         [mode="company"]

src/app/[locale]/(auth)/login|signup|verify|…     [server]
└── containers/auth/{login,register,verify,…}-form.tsx
```

---

