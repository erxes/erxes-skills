# Ecommerce GraphQL Files

**IMPORTANT:** These files already exist in the cloned starter repo (`graphql/`). Do NOT recreate them. Import from the paths shown below.

> **Apollo Client v4:** `gql` stays importable from `"@apollo/client"`, but
> `useQuery` / `useMutation` / `ApolloProvider` must come from
> `"@apollo/client/react"` (see generate-core.md / generate-hooks.md).

---

## Auth GraphQL (`graphql/auth/`) — VERIFIED signatures

| File                                | Exports                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `queries/currentUser.ts`            | `CLIENT_PORTAL_CURRENT_USER`, `CURRENT_USER`                                                         |
| `mutations/loginWithCredentials.ts` | `CLIENT_PORTAL_USER_LOGIN_WITH_CREDENTIALS`, `LOGIN` — returns JSON scalar `{ token, refreshToken }` |
| `mutations/register.ts`             | `CLIENT_PORTAL_USER_REGISTER`, `REGISTER` — returns user object, no token                            |
| `mutations/password.ts`             | `FORGOT_PASSWORD`, `RESET_PASSWORD`, `CHANGE_PASSWORD`                                               |
| `mutations/index.ts`                | re-exports all mutations                                                                             |

**Password-mutation variable contracts (verified against the live gateway — older docs were wrong):**

```typescript
// FORGOT_PASSWORD — email ONLY. No clientPortalId argument (the gateway
// resolves the portal from x-app-token). Older docs passing
// `clientPortalId: process.env.EXPO_PUBLIC_ERXES_CP_TOKEN` fail validation.
mutation ClientPortalUserForgotPassword($email: String) {
  clientPortalUserForgotPassword(email: $email)
}

// RESET_PASSWORD — token + newPassword (no email, no password-confirm field)
mutation ClientPortalUserResetPassword($token: String!, $newPassword: String!) {
  clientPortalUserResetPassword(token: $token, newPassword: $newPassword)
}

// CHANGE_PASSWORD — currentPassword + newPassword (profile screen)
mutation ClientPortalUserChangePassword($currentPassword: String!, $newPassword: String!) {
  clientPortalUserChangePassword(currentPassword: $currentPassword, newPassword: $newPassword)
}
```

---

## Ecommerce GraphQL (`graphql/ecommerce/queries.ts`)

### Queries

| File                       | Exports                                                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queries/product.ts`       | `POSC_PRODUCTS`, `POSC_PRODUCT_DETAIL`, `POSC_PRODUCT_CATEGORIES`        | Types: `Product`, `ProductCategory`, `Attachment`. `POSC_PRODUCTS` variables include `categoryId` for dynamic category filtering — pass `undefined` for all products, or a category `_id` to filter. `POSC_PRODUCT_CATEGORIES` accepts `excludeEmpty: true` to hide categories with zero products; new categories auto-appear once a product is assigned, no frontend changes needed. |
| `queries/wishlist.ts`      | `CP_WISH`, `CP_WISHLIST`                                                 | `CP_WISH` filters by productIds; `CP_WISHLIST` returns full list + product detail                                                                                                                                                                                                                                                                                                     |
| `queries/order.ts`         | `FULL_ORDERS` (alias `ORDERS`), `CP_ORDER_DETAIL` (alias `ORDER_DETAIL`) | Data fields: `cpFullOrders`, `cpOrderDetail`                                                                                                                                                                                                                                                                                                                                          |
| `queries/payment.ts`       | `CP_PAYMENTS` (aliases: `PAYMENTS`, `PAYMENT_DETAIL`)                    | Data field: `cpPayments`                                                                                                                                                                                                                                                                                                                                                              |
| `queries/productReview.ts` | `CP_PRODUCT_REVIEWS`                                                     | Types: `ProductReview`, `CpProductReviewsData`, `CpProductReviewsVariables`                                                                                                                                                                                                                                                                                                           |

### Mutations

| File                         | Exports                                                                                                         | Notes                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `mutations/wishlist.ts`      | `CP_WISHLIST_ADD`, `CP_WISHLIST_REMOVE`, `CP_WISHLIST_UPDATE`                                                   |                                                                                           |
| `mutations/order.ts`         | `CP_ORDERS_ADD` (alias `ORDERS_ADD`), `CP_ORDERS_CANCEL` (alias `ORDERS_REMOVE`)                                | **CP_ORDERS_CANCEL caveat:** the gateway exposes the field as `ordersRemove` (NOT `cpOrdersCancel`). The document must alias it: `mutation OrdersRemove($_id: String!) { ordersRemove(_id: $_id) }`. Writing a bare `cpOrdersCancel(...)` field fails with "Cannot query field". |
| `mutations/payment.ts`       | `INVOICE_CREATE` (alias `CREATE_INVOICE`), `INVOICES_CHECK` (alias `CHECK_INVOICE`), `PAYMENT_TRANSACTIONS_ADD` | `invoicesCheck` uses **`useMutation`** NOT `useQuery`; parameter name is `id` (not `_id`): `mutation InvoicesCheck($id: String!) { invoicesCheck(id: $id) }`. Returns a status String ("paid"/"pending"/"failed"/"cancelled"). |
| `mutations/productReview.ts` | `CP_PRODUCT_REVIEW_ADD`, `PRODUCT_REVIEW_UPDATE`, `PRODUCT_REVIEW_REMOVE`                                       |                                                                                           |

> **Dynamic category filtering:** `POSC_PRODUCT_CATEGORIES` (`excludeEmpty: true`) болон
> `POSC_PRODUCTS` (`categoryId` variable) хоёрыг хослуулан ашиглавал шинэ category болон
> product админ талаас нэмэгдэх бүрд frontend код өөрчлөлтгүйгээр автоматаар filter bar
> болон product list-д тусгагдана. Дэлгэрэнгүй hook implementation — `generate-hooks.md`
> `useProductCategories()` / `useFilteredProducts()`.

---

## CMS GraphQL (`graphql/cms/`)

### Queries

| File                        | Exports                                                       | Data field                                                | Notes                                                       |
| --------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `queries/page.ts`           | `CP_PAGES`, `CP_PAGE_LIST`                                    | `cpPages`, `cpPageList`                                   | No single-page-by-slug query — filter `cpPages` client-side. **Caveats:** only `language` (+`status`) args are accepted — NO pagination/slug/cmsId params; results capped at ~20; on shared portals seeded pages may exist (mutations return `_id`s) yet never appear in the list. See generate-cms.md "cpPages caveats". |
| `queries/post.ts`           | `CP_POST`, `CP_POSTS`, `CP_POST_LIST`, `CP_MOST_VIEWED_POSTS` | `cpPost`, `cpPosts`, `cpPostList`                         | `CP_POST` accepts `{ slug }` for detail lookup              |
| `queries/category.ts`       | `CP_CATEGORIES`                                               | `cpCategories` — returns `{ list, totalCount, pageInfo }` |                                                             |
| `queries/menu.ts`           | `CP_MENUS`, `CP_CMS_MENU_LIST`                                | `cpMenus`, `cpCmsMenuList`                                |                                                             |
| `queries/tag.ts`            | `CP_CMS_TAGS`                                                 | `cpCmsTags` — returns `{ tags, totalCount, pageInfo }`    |                                                             |
| `queries/customPostType.ts` | `CP_CUSTOM_POST_TYPES`, `CP_CUSTOM_FIELD_GROUPS`              | `cpCustomPostTypes`, `cpCustomFieldGroups`                |                                                             |

### Mutations

| File                    | Exports                 | Data field           |
| ----------------------- | ----------------------- | -------------------- |
| `mutations/post.ts`     | `CP_CMS_POSTS_ADD`      | `cpCmsPostsAdd`      |
| `mutations/page.ts`     | `CP_CMS_PAGES_ADD`      | `cpCmsPagesAdd`      |
| `mutations/category.ts` | `CP_CMS_CATEGORIES_ADD` | `cpCmsCategoriesAdd` |
| `mutations/menu.ts`     | `CP_CMS_ADD_MENU`       | `cpCmsAddMenu`       |
| `mutations/tag.ts`      | `CP_CMS_TAGS_ADD`       | `cpCmsTagsAdd`       |

### Key types (exported from query files)

| Type                             | From                  |
| -------------------------------- | --------------------- |
| `Page`, `PageList`, `PageItem`   | `queries/page.ts`     |
| `Post`, `PostList`, `PostStatus` | `queries/post.ts`     |
| `PostCategory`                   | `queries/category.ts` |
| `MenuItem`                       | `queries/menu.ts`     |
| `PostTag`                        | `queries/tag.ts`      |

---

## Import examples

```typescript
// Auth
import { CURRENT_USER } from "graphql/auth/queries/currentUser";
import { LOGIN, REGISTER, FORGOT_PASSWORD } from "graphql/auth/mutations";

// Products
import {
  POSC_PRODUCTS,
  POSC_PRODUCT_DETAIL,
  POSC_PRODUCT_CATEGORIES,
} from "graphql/ecommerce/queries/product";
import type { Product } from "graphql/ecommerce/queries/product";

// Orders
import { ORDERS, ORDER_DETAIL } from "graphql/ecommerce/queries/order";
import { ORDERS_ADD, ORDERS_REMOVE } from "graphql/ecommerce/mutations/order";

// Payment
import { PAYMENTS } from "graphql/ecommerce/queries/payment";
import {
  CREATE_INVOICE,
  CHECK_INVOICE,
  PAYMENT_TRANSACTIONS_ADD,
} from "graphql/ecommerce/mutations/payment";

// Wishlist
import { CP_WISHLIST } from "graphql/ecommerce/queries/wishlist";
import {
  CP_WISHLIST_ADD,
  CP_WISHLIST_REMOVE,
} from "graphql/ecommerce/mutations/wishlist";

// Reviews
import { CP_PRODUCT_REVIEWS } from "graphql/ecommerce/queries/productReview";
import {
  CP_PRODUCT_REVIEW_ADD,
  PRODUCT_REVIEW_UPDATE,
  PRODUCT_REVIEW_REMOVE,
} from "graphql/ecommerce/mutations/productReview";

// CMS — pages
import { CP_PAGES, CP_PAGE_LIST } from "graphql/cms/queries/page";
// CMS — posts
import { CP_POST, CP_POSTS, CP_POST_LIST } from "graphql/cms/queries/post";
// CMS — categories
import { CP_CATEGORIES } from "graphql/cms/queries/category";
// CMS — menus
import { CP_MENUS } from "graphql/cms/queries/menu";
// CMS — tags
import { CP_CMS_TAGS } from "graphql/cms/queries/tag";
```
