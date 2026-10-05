# Hotel TypeScript Types

Define shared interfaces in `types/cms.ts` (CMS entities) and `types/hotel.ts`
(rooms/bookings/invoice state). Only the fields below are gateway-verified — extend
any interface by inspecting real query payloads (`cpPages`, `cpPosts`, `cpMenus`,
`cpPmsRooms`, `cpDealDetail`), never by guessing field names.

## `types/cms.ts`

```typescript
// Fields proven against the live CP gateway (see agents/connect-erxes.md verify query)
export interface IPage {
  _id: string;
  name: string;
  title?: string; // some CMS rows expose title instead of name
  slug: string;
  description?: string;
  content: string; // HTML
  status?: "published" | "draft" | "archived";
  meta?: Record<string, unknown>;
}

export interface IPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string; // HTML
  status?: "published" | "draft" | "archived";
  publishedDate?: string;
  categoryIds?: string[];
  featuredImage?: { url?: string };
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
}

export type MenuKind = "header" | "footer";

export interface IMenuItem {
  _id: string;
  label: string;
  url: string;
  order: number;
  kind: MenuKind;
}
```

## `types/hotel.ts`

```typescript
// cpPmsRooms — room card data returned by the PMS pipeline
export interface IRoom {
  _id: string;
  name?: string;
  description?: string;
  price?: number; // per night
  attachment?: { url?: string };
  // add room-specific fields (guestCount, size, bedType, amenities) as they
  // appear in the real payload — never invent field names
}

// cpPmsCheckRooms — availability result per room
export interface IRoomAvailability {
  _id: string;
  available: boolean;
}

// cpDeals / cpDealDetail — a booking is a deal in the erxes pipeline
export interface IBooking {
  _id: string;
  name?: string;
  stageId?: string;
  startDate?: string; // check-in
  closeDate?: string; // check-out
  description?: string; // special requests
  status?: BookingStatus;
  productsData?: Array<{
    productId?: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
  }>;
  paymentsData?: unknown;
}

export type BookingStatus = "new" | "pending" | "confirmed" | "paid" | "cancelled";

// Guest info collected on the room detail booking form
export interface IGuestInput {
  guestName: string;
  email: string;
  phone: string;
  note?: string;
  country?: string;
}

// Booking summary carried between room → confirm → verify via query params
export interface IBookingParams {
  dealId?: string;
  invoiceId?: string;
  nights?: number;
  amount?: number;
  roomName?: string;
}

// cpInvoiceCreate / cpInvoicesCheck
export interface IInvoice {
  _id: string;
  status?: string;
  redirectUri?: string;
}
```

## Rules

1. Erxes uses MongoDB ObjectIds — always `_id`, never `id`.
2. HTML content arrives as a string — render with `dangerouslySetInnerHTML` /
   the project's HTML renderer, never as JSX.
3. When a screen needs a field not listed here, run the query once against the
   gateway, read the actual payload shape, then add the field to the interface —
   do not invent names from memory.
4. Never re-declare these interfaces inline in pages/components — import them
   from `types/`.
5. Room pricing is per night. Compute the stay total with `calcNights(checkIn, checkOut) * room.price`
   (see `generate-setup.md` → `lib/utils.ts`) — the booking flow must never hardcode
   `nights * 100` from the reference page pattern.