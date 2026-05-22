# Reference

## Section type → component map (current boilerplate)

| Type key | Component | Template |
|---|---|---|
| `hero` | `HeroSection` | all |
| `imageText` | `AboutSection` | all |
| `tours` | `ToursSection` | tour |
| `rooms` | `RoomsSection` | hotel |
| `products` | `ProductsSection` | ecommerce |
| `productCategories` | `ProductCategoriesSection` | ecommerce |
| `lastViewedProducts` | `LastViewedProductsSection` | ecommerce |
| `bookingForm` | `BookingFormSection` | tour, hotel |
| `carousel` | `CarouselSection` | ecommerce |
| `banner` | `BannerSection` | ecommerce, business |
| `gallery` | `GallerySection` | all |
| `cmsPosts` | `CmsPostsSection` | business |
| `form` | `FormSection` | business |
| `contact` | `ContactSection` | all |
| `text` | `TextSection` | all |
| `youtube` | `YoutubeSection` | all |

---

## GraphQL queries by template

### ecommerce
| Query | File | Use |
|---|---|---|
| `cpPoscProducts` | `graphql/products/queries.ts` | Product list |
| `cpPoscProductCategories` | `graphql/products/queries.ts` | Category list |
| `cpPoscProductDetail` | `graphql/products/queries.ts` | Single product |
| `cpLastViewedItems` | `graphql/order/queries.ts` | Last viewed products |

### tour
| Query | File | Use |
|---|---|---|
| `cpBmToursGroupDetail` | `graphql/tms/queries.ts` | Tour list / detail |
| `cpBmsOrders` | `graphql/tms/queries.ts` | Booking history |

### hotel
| Query | File | Use |
|---|---|---|
| `products` | `graphql/pms/rooms/queries.ts` | Room list |

### all templates
| Query | File | Use |
|---|---|---|
| `cpFormDetail` | `graphql/queries.ts` | Contact / booking form |
| `cpCmsPosts` | `graphql/cms/queries.ts` | Blog / news posts |
| `clientPortalCurrentUser` | `graphql/auth/` | Current user |

---

## initData paths

| Template | homePageSections | menuData |
|---|---|---|
| ecommerce | `apps/web-builder/src/initData/ecommerce/homePageSections.json` | `apps/web-builder/src/initData/ecommerce/menuData.json` |
| tour | `apps/web-builder/src/initData/tour/homePageSections.json` | `apps/web-builder/src/initData/tour/menuData.json` |
| hotel | `apps/web-builder/src/initData/hotel/homePageSections.json` | `apps/web-builder/src/initData/hotel/menuData.json` |
| business | — | — |

---

## File ownership

### Touch freely
- `app/_components/sections/*.tsx`
- `app/_components/sections/index.ts`
- `components/common/*.tsx`
- `lib/renderSections.tsx`
- `app/page.tsx`
- `tailwind.config.ts`
- `public/`

### Never touch
- `lib/client.ts`
- `hooks/`
- `graphql/`
- `app/checkout/`, `app/cart/`, `app/auth/`, `app/profile/`
- `app/_components/ClientShell.tsx`
