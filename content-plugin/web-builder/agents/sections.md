# Section Building Guide

## Section types by template

### ecommerce
| Section type key | Component to build/customise | contentType | GraphQL query |
|---|---|---|---|
| `hero` | `HeroSection` | `ecommerce:hero` | — (static config) |
| `products` | `ProductsSection` | `ecommerce:products` | `cpPoscProducts` |
| `productCategories` | `ProductCategoriesSection` | `ecommerce:categories` | `cpPoscProductCategories` |
| `lastViewedProducts` | `LastViewedProductsSection` | `ecommerce:lastViewed` | `cpLastViewedItems` |
| `banner` | `BannerSection` | `ecommerce:banner` | — (static config) |
| `carousel` | `CarouselSection` | `ecommerce:carousel` | `cpPoscProducts` |
| `contact` | `ContactSection` | `ecommerce:contact` | `cpFormDetail` |

### tour
| Section type key | Component to build/customise | contentType | GraphQL query |
|---|---|---|---|
| `hero` | `HeroSection` | `imageText` | — (static config) |
| `imageText` | `AboutSection` | `imageText` | — (static config) |
| `tours` | `ToursSection` | `bms:tours` | `cpBmToursGroupDetail` (from `graphql/tms/queries.ts`) |
| `bookingForm` | `BookingFormSection` | `bms:booking` | — (form config) |
| `gallery` | `GallerySection` | `tour:gallery` | — (static config) |
| `contact` | `ContactSection` | `tour:contact` | `cpFormDetail` |

### hotel
| Section type key | Component to build/customise | contentType | GraphQL query |
|---|---|---|---|
| `hero` | `HeroSection` | `imageText` | — (static config) |
| `imageText` | `AboutSection` | `imageText` | — (static config) |
| `rooms` | `RoomsSection` | `bms:rooms` | `products` (from `graphql/pms/rooms/queries.ts`) |
| `bookingForm` | `BookingFormSection` | `bms:booking` | — (form config) |
| `gallery` | `GallerySection` | `hotel:gallery` | — (static config) |
| `contact` | `ContactSection` | `hotel:contact` | `cpFormDetail` |

### business
| Section type key | Component to build/customise | contentType | GraphQL query |
|---|---|---|---|
| `hero` | `HeroSection` | `imageText` | — (static config) |
| `imageText` | `AboutSection` | `imageText` | — (static config) |
| `cmsPosts` | `CmsPostsSection` | `cms:posts` | `cpCmsPosts` (from `graphql/cms/queries.ts`) |
| `gallery` | `GallerySection` | `business:gallery` | — (static config) |
| `form` | `FormSection` | `business:form` | `cpFormDetail` |
| `contact` | `ContactSection` | `business:contact` | `cpFormDetail` |
| `banner` | `BannerSection` | `business:banner` | — (static config) |

---

## How to build a section component

### Minimum component shape

```tsx
"use client"; // only if the section uses hooks or browser APIs

import { Section } from "../../../types/sections";

const MySection = ({ section }: { section: Section }) => {
  const { title, description, primaryCta, primaryCtaUrl } = section.config || {};

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* your UI here */}
      </div>
    </section>
  );
};

export default MySection;
```

### Section component rules
- Always destructure from `section.config` — never hardcode content
- If the section fetches data (products, tours, rooms), use `useQuery` with the correct query from `graphql/`
- Never add `"use client"` unless you use hooks or event handlers — prefer Server Components
- Use `next/image <Image>` for all images
- Use `next/link <Link>` for all internal links

### Registering a new section

1. Add export to `app/_components/sections/index.ts`:
```ts
import MySection from "./MySection";

export const sectionComponents = {
  // ...existing
  myType: MySection,
};
```

2. Add type to `lib/renderSections.tsx`:
```ts
type KnownSectionType =
  | "hero"
  | "imageText"
  // ...existing
  | "myType"; // add here
```

---

## initData format

Each entry in `homePageSections.json`:

```json
{
  "type": "myType",
  "content": "Short label",
  "contentType": "template:myType",
  "name": "My Section Name",
  "order": 0,
  "config": {
    "title": "Real headline copy",
    "description": "Real supporting copy.",
    "primaryCta": "Call to action",
    "primaryCtaUrl": "/page",
    "image": {
      "file": { "name": "hero.jpg", "size": 0, "type": "image/jpeg" },
      "initUrl": "https://images.unsplash.com/photo-XXXXXXXXXX?q=80&w=1200&auto=format&fit=crop"
    }
  }
}
```

Rules:
- `type` must exactly match the key in `sectionComponents`
- `initUrl` must be a real Unsplash URL — never a local `/images/` path
- `config` must contain real copy, not placeholders
