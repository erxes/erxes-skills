# GraphQL Reference — Ecommerce

All queries and mutations used in the ecommerce storefront, written as `gql`
tagged exports (Apollo Client).

---

## Auth

```ts
import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query ClientPortalCurrentUser {
    clientPortalCurrentUser {
      _id
      firstName
      lastName
      avatar
      erxesCustomerId
      phone
      email
    }
  }
`;

export const CURRENT_CONFIG = gql`
  query CurrentConfig {
    currentConfig {
      erxesAppToken
      paymentIds
      deliveryConfig
      name
      description
      pdomain
      isCheckRemainder
      branchId
      initialCategoryIds
      uiOptions {
        logo
        colors
        favIcon
      }
    }
  }
`;

export const LOGIN = gql`
  mutation ClientPortalUserLoginWithCredentials(
    $email: String
    $password: String
  ) {
    clientPortalUserLoginWithCredentials(email: $email, password: $password)
  }
`;
// Returns: JSON scalar (object with `token` and `refreshToken`)
// Usage: Login form

export const REGISTER = gql`
  mutation ClientPortalUserRegister(
    $email: String
    $userType: CPUserType
    $password: String
    $code: String
    $firstName: String
    $lastName: String
    $phone: String
  ) {
    clientPortalUserRegister(
      email: $email
      userType: $userType
      password: $password
      code: $code
      firstName: $firstName
      lastName: $lastName
      phone: $phone
    ) {
      clientPortalId
      _id
      email
      type
      erxesCustomerId
      erxesCompanyId
    }
  }
`;

export const LOGOUT = gql`
  mutation ClientPortalLogout {
    clientPortalLogout
  }
`;

export const EDIT_USER = gql`
  mutation ClientPortalUsersEdit(
    $_id: String!
    $email: String
    $firstName: String
    $lastName: String
    $phone: String
    $type: String
    $companyName: String
    $companyRegistrationNumber: String
    $password: String
    $avatar: String
  ) {
    clientPortalUsersEdit(
      _id: $_id
      email: $email
      firstName: $firstName
      lastName: $lastName
      phone: $phone
      type: $type
      companyName: $companyName
      companyRegistrationNumber: $companyRegistrationNumber
      password: $password
      avatar: $avatar
    ) {
      _id
    }
  }
`;
```

---

## Products

```ts
import { gql } from "@apollo/client";

// Replaces the old `poscProducts` query — now uses `cpPoscProducts`
export const POSC_PRODUCTS = gql`
  query CpPoscProducts(
    $categoryId: String
    $searchValue: String
    $tags: [String]
    $page: Int
    $perPage: Int
    $branchId: String
    $minPrice: Float
    $maxPrice: Float
    $isSimilarity: Boolean = true
  ) {
    cpPoscProducts(
      categoryId: $categoryId
      searchValue: $searchValue
      tags: $tags
      page: $page
      perPage: $perPage
      branchId: $branchId
      minPrice: $minPrice
      maxPrice: $maxPrice
      isSimilarity: $isSimilarity
    ) {
      _id
      name
      code
      description
      unitPrice
      savedRemainder
      isCheckRem
      categoryId
      tagIds
      attachment {
        url
      }
      attachmentMore {
        url
      }
      remainder
    }
  }
`;

export const PRODUCTS_TOTAL_COUNT = gql`
  query PoscProductsTotalCount(
    $categoryId: String
    $type: String
    $searchValue: String
    $groupedSimilarity: String
    $isKiosk: Boolean
  ) {
    poscProductsTotalCount(
      categoryId: $categoryId
      type: $type
      searchValue: $searchValue
      groupedSimilarity: $groupedSimilarity
      isKiosk: $isKiosk
    )
  }
`;

export const POSC_PRODUCT_CATEGORIES = gql`
  query PoscProductCategories(
    $parentId: String
    $searchValue: String
    $excludeEmpty: Boolean
    $meta: String
    $page: Int
    $perPage: Int
    $sortField: String
    $sortDirection: Int
  ) {
    poscProductCategories(
      parentId: $parentId
      searchValue: $searchValue
      excludeEmpty: $excludeEmpty
      meta: $meta
      page: $page
      perPage: $perPage
      sortField: $sortField
      sortDirection: $sortDirection
    ) {
      _id
      name
      code
      order
      parentId
      attachment {
        url
      }
    }
  }
`;

export const POSC_PRODUCT_DETAIL = gql`
  query ProductDetail($_id: String) {
    poscProductDetail(_id: $_id) {
      _id
      name
      description
      code
      type
      createdAt
      unitPrice
      remainder
      hasSimilarity
      category {
        order
        name
        _id
      }
      attachment {
        url
      }
      attachmentMore {
        url
      }
    }
  }
`;

export const PRODUCT_SIMILARITIES = gql`
  query PoscProductSimilarities($id: String!, $groupedSimilarity: String) {
    poscProductSimilarities(_id: $id, groupedSimilarity: $groupedSimilarity) {
      products {
        _id
        name
        description
        code
        type
        createdAt
        unitPrice
        remainder
        category {
          order
          name
          _id
        }
        attachment {
          url
        }
        attachmentMore {
          url
        }
        customFieldsData
      }
      groups {
        fieldId
        title
      }
    }
  }
`;

export const PRODUCT_REVIEWS = gql`
  query CpProductReviews(
    $productIds: [String]
    $customerId: String
    $page: Int
    $perPage: Int
  ) {
    cpProductReviews(
      productIds: $productIds
      customerId: $customerId
      page: $page
      perPage: $perPage
    ) {
      _id
      productId
      customerId
      review
      description
      info
    }
  }
`;
```

---

## Orders

```ts
import { gql } from "@apollo/client";

// Current cart (logged-in customer)
export const CURRENT_ORDER = gql`
  query CurrentOrder(
    $customerId: String
    $saleStatus: String
    $perPage: Int
    $sortField: String
    $sortDirection: Int
    $statuses: [String]
  ) {
    cpFullOrders(
      customerId: $customerId
      saleStatus: $saleStatus
      perPage: $perPage
      sortField: $sortField
      sortDirection: $sortDirection
      statuses: $statuses
    ) {
      _id
      deliveryInfo
      description
      billType
      registerNumber
      items {
        _id
        unitPrice
        orderId
        productName
        count
        productId
        isPackage
        isTake
        status
        productImgUrl
        discountAmount
        discountPercent
        bonusCount
      }
    }
  }
`;

// Visitor (guest) cart
export const ACTIVE_ORDER_DETAIL = gql`
  query ActiveOrderDetail($id: String, $customerId: String) {
    orderDetail(_id: $id, customerId: $customerId) {
      _id
      deliveryInfo
      description
      billType
      registerNumber
      items {
        _id
        unitPrice
        orderId
        productName
        count
        productId
        isPackage
        isTake
        status
        productImgUrl
        discountAmount
        discountPercent
        bonusCount
      }
    }
  }
`;

// Order history
export const FULL_ORDERS = gql`
  query FullOrders(
    $statuses: [String]
    $perPage: Int
    $sortField: String
    $sortDirection: Int
    $saleStatus: String
  ) {
    cpFullOrders(
      statuses: $statuses
      perPage: $perPage
      sortField: $sortField
      sortDirection: $sortDirection
      saleStatus: $saleStatus
    ) {
      _id
      createdAt
      paidDate
      status
      totalAmount
      number
      items {
        productName
        productImgUrl
      }
    }
  }
`;

export const CP_ORDER_DETAIL = gql`
  query CpOrderDetail($id: String!, $customerId: String!) {
    cpOrderDetail(_id: $id, customerId: $customerId) {
      _id
      createdAt
      modifiedAt
      number
      status
      paidDate
      mobileAmount
      totalAmount
      slotCode
      registerNumber
      customerId
      printedEbarimt
      billType
      billId
      origin
      type
      deliveryInfo
      description
      items {
        _id
        unitPrice
        orderId
        productName
        count
        productId
        isPackage
        isTake
        status
        productImgUrl
        discountAmount
        discountPercent
        bonusCount
      }
      customer {
        firstName
        lastName
        primaryEmail
        primaryPhone
        code
      }
      user {
        _id
        primaryPhone
        firstName
        primaryEmail
        lastName
      }
      putResponses {
        totalAmount
        customerTin
        customerName
        id
        qrData
        lottery
      }
    }
  }
`;

export const CP_ORDERS_ADD = gql`
  mutation CpOrdersAdd(
    $items: [OrderItemInput]
    $totalAmount: Float!
    $type: String!
    $customerId: String
    $customerType: String
    $registerNumber: String
    $billType: String
    $origin: String
    $dueDate: Date
    $branchId: String
    $deliveryInfo: JSON
    $description: String
    $saleStatus: String
  ) {
    cpOrdersAdd(
      items: $items
      totalAmount: $totalAmount
      type: $type
      customerId: $customerId
      customerType: $customerType
      registerNumber: $registerNumber
      billType: $billType
      origin: $origin
      dueDate: $dueDate
      branchId: $branchId
      deliveryInfo: $deliveryInfo
      description: $description
      saleStatus: $saleStatus
    ) {
      _id
    }
  }
`;

export const CP_ORDERS_EDIT = gql`
  mutation CpOrdersEdit(
    $_id: String!
    $items: [OrderItemInput]
    $totalAmount: Float!
    $type: String!
    $customerId: String
    $customerType: String
    $registerNumber: String
    $billType: String
    $origin: String
    $dueDate: Date
    $branchId: String
    $deliveryInfo: JSON
    $description: String
    $saleStatus: String
  ) {
    cpOrdersEdit(
      _id: $_id
      items: $items
      totalAmount: $totalAmount
      type: $type
      customerId: $customerId
      customerType: $customerType
      registerNumber: $registerNumber
      billType: $billType
      origin: $origin
      dueDate: $dueDate
      branchId: $branchId
      deliveryInfo: $deliveryInfo
      description: $description
      saleStatus: $saleStatus
    ) {
      _id
      status
    }
  }
`;

// VERIFIED: the gateway exposes the cancel field as `ordersRemove` — there is
// NO `cpOrdersCancel` field. The export name stays CP_ORDERS_CANCEL for hook
// compatibility, but the document must alias the real field.
export const CP_ORDERS_CANCEL = gql`
  mutation OrdersRemove($_id: String!) {
    ordersRemove(_id: $_id)
  }
`;

export const CP_ORDER_CHANGE_SALE_STATUS = gql`
  mutation CpOrderChangeSaleStatus($_id: String!, $saleStatus: String) {
    cpOrderChangeSaleStatus(_id: $_id, saleStatus: $saleStatus) {
      _id
    }
  }
`;
```

---

## Payment

```ts
import { gql } from "@apollo/client";

export const CP_PAYMENTS = gql`
  query CpPayments {
    cpPayments {
      _id
      name
      kind
      status
      config
      createdAt
    }
  }
`;

export const INVOICE_CREATE = gql`
  mutation InvoiceCreate($input: InvoiceInput!) {
    invoiceCreate(input: $input) {
      _id
      invoiceNumber
      amount
      remainingAmount
      phone
      email
      description
      status
      data
      contentTypeId
      transactions {
        _id
        paymentId
        paymentKind
        status
        details
        response
      }
    }
  }
`;

// Returns: String ("paid", "pending", "failed", "cancelled")
// VERIFIED: parameter name is `id` — writing invoicesCheck(_id:) fails validation
export const INVOICES_CHECK = gql`
  mutation InvoicesCheck($id: String!) {
    invoicesCheck(id: $id)
  }
`;

export const PAYMENT_TRANSACTIONS_ADD = gql`
  mutation PaymentTransactionsAdd($input: PaymentTransactionInput!) {
    paymentTransactionsAdd(input: $input) {
      _id
      amount
      invoiceId
      paymentId
      paymentKind
      status
      response
      details
    }
  }
`;
```

---

## CMS

```ts
import { gql } from "@apollo/client";

export const CP_MENUS = gql`
  query CpMenus($id: String) {
    cpMenus(_id: $id) {
      _id
      name
      items {
        _id
        name
        link
        order
        icon
        items {
          _id
          name
          link
          order
          icon
        }
      }
    }
  }
`;

export const CP_PAGE_DETAIL = gql`
  query CpPageDetail($slug: String, $lang: String) {
    cpPageDetail(slug: $slug, lang: $lang) {
      _id
      title
      slug
      content
      description
      sections {
        _id
        type
        content
        items {
          _id
          title
          content
          image
          link
        }
      }
    }
  }
`;

export const CP_POSTS = gql`
  query CpPosts($page: Int, $perPage: Int, $lang: String) {
    cpPosts(page: $page, perPage: $perPage, lang: $lang) {
      _id
      title
      slug
      description
      thumbnail
      publishedDate
      categories {
        _id
        name
        slug
      }
    }
  }
`;

export const CP_POST_DETAIL = gql`
  query CpPostDetail($slug: String, $lang: String) {
    cpPostDetail(slug: $slug, lang: $lang) {
      _id
      title
      slug
      content
      description
      thumbnail
      publishedDate
      categories {
        _id
        name
        slug
      }
      author {
        _id
        firstName
        lastName
      }
    }
  }
`;
```

---

## Wishlist

```ts
import { gql } from "@apollo/client";

export const CP_WISHLIST = gql`
  query CpWishlist($customerId: String!) {
    cpWishlist(customerId: $customerId) {
      _id
      productId
      name
      unitPrice
      attachment {
        url
      }
    }
  }
`;

export const CP_WISHLIST_ADD = gql`
  mutation CpWishlistAdd($productId: String!, $customerId: String!) {
    cpWishlistAdd(productId: $productId, customerId: $customerId) {
      _id
      productId
      name
      unitPrice
    }
  }
`;

export const CP_WISHLIST_REMOVE = gql`
  mutation CpWishlistRemove($_id: String!) {
    cpWishlistRemove(_id: $_id)
  }
`;
```

---

## Environment Variables

| Variable                          | Source               | Header            | Usage            |
| --------------------------------- | -------------------- | ----------------- | ---------------- |
| `EXPO_PUBLIC_ERXES_API_URL`       | Setup                | —                 | GraphQL endpoint |
| `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN` | Client Portal        | `x-app-token`     | Client portal JWT (legacy name `EXPO_PUBLIC_ERXES_CP_TOKEN` / `NEXT_PUBLIC_*` is OBSOLETE — never use) |
| `EXPO_PUBLIC_POS_TOKEN`           | POS Config           | `erxes-pos-token` | POS token        |
| `EXPO_PUBLIC_CLIENT_PORTAL_ID`    | Client Portal ID     | —                 | Order/CMS mutations |
| `ERXES_CMS_ID` / `EXPO_PUBLIC_CMS_ID` | Created by script | —                | CMS queries      |

---

## Checklist

- [ ] All GraphQL files in `graphql/`
- [ ] Auth token in `SecureStore` (expo-secure-store — NOT `sessionStorage`)
- [ ] Apollo `authLink` reads SecureStore per request (`async setContext`)
- [ ] `client-auth-token` header for authenticated requests
- [ ] `x-app-token` = `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN` (client portal JWT)
- [ ] `erxes-pos-token` = `EXPO_PUBLIC_POS_TOKEN` (POS token)
- [ ] `useCreateInvoice` accepts destructured params
- [ ] Checkout waits for order `_id` before navigating to `/verify`
- [ ] `useOrderCUD` stores `{ ...order, totalAmount }` into `activeOrderAtom` after `cpOrdersAdd`
- [ ] CartDrawer redirects guest to `/(auth)/login` with `redirectAfterLogin`
- [ ] `useLogin` checks `redirectAfterLogin` after success
- [ ] `Link` and `useRouter` from `expo-router`
- [ ] `useCurrentUser` with `fetchPolicy: "network-only"`
- [ ] Login response is a JSON scalar: read `raw?.token` + `raw?.refreshToken`
- [ ] Token saved BEFORE `triggerRefetchUser()`
- [ ] No circular dependency between `order.store` and `cart.store`
- [ ] `app/_layout.tsx` is the single root layout (Expo Router — no `html`/`body`, no `[locale]` layout)
- [ ] UI components created manually (no shadcn init)
- [ ] Image URLs validated with `isValidUrl`
