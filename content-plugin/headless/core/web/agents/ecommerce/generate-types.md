# Ecommerce TypeScript Types

Define shared interfaces in `types/cms.ts` (CMS entities) and `types/commerce.ts`
(cart/order/user state). Only the fields below are gateway-verified — extend any
interface by inspecting real query payloads (`cpPages`, `cpPosts`, `cpMenus`,
`cpCategories`), never by guessing field names.

## `types/cms.ts`

```typescript
// Fields proven against the live CP gateway (see agents/connect-erxes.md verify query)
export interface IPage {
  _id: string;
  title: string;
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

## `types/commerce.ts`

```typescript
export interface ICartItem {
  productId: string;
  name: string;
  unitPrice: number;
  count: number;
  imageUrl?: string;
}

export interface IUser {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
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
