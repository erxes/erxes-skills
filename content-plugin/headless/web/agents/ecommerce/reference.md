# GraphQL Reference — Ecommerce

All queries and mutations used in the ecommerce storefront.

---

## Auth

### Queries

**`clientPortalCurrentUser`**
```graphql
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
```

**`currentConfig`**
```graphql
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
```

### Mutations

**`clientPortalUserLoginWithCredentials`**
```graphql
mutation ClientPortalUserLoginWithCredentials($email: String, $password: String) {
  clientPortalUserLoginWithCredentials(email: $email, password: $password)
}
```
- Returns: JSON scalar (object with `token` and `refreshToken`)
- Usage: Login form

**`clientPortalUserRegister`**
```graphql
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
```

**`clientPortalLogout`**
```graphql
mutation ClientPortalLogout {
  clientPortalLogout
}
```

**`clientPortalUsersEdit`**
```graphql
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
```

---

## Products

### Queries

**`poscProducts`**
```graphql
query PoscProducts(
  $searchValue: String
  $type: String
  $categoryId: String
  $page: Int
  $perPage: Int
  $isKiosk: Boolean
  $groupedSimilarity: String
  $sortField: String
  $sortDirection: Int
) {
  poscProducts(
    searchValue: $searchValue
    categoryId: $categoryId
    type: $type
    page: $page
    perPage: $perPage
    isKiosk: $isKiosk
    groupedSimilarity: $groupedSimilarity
    sortField: $sortField
    sortDirection: $sortDirection
  ) {
    _id
    name
    code
    unitPrice
    hasSimilarity
    attachment {
      url
    }
  }
}
```

**`poscProductsTotalCount`**
```graphql
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
```

**`poscProductCategories`**
```graphql
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
```

**`poscProductDetail`**
```graphql
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
```

**`poscProductSimilarities`**
```graphql
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
```

**`cpProductReviews`**
```graphql
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
```

---

## Orders

### Queries

**`cpFullOrders` (current cart)**
```graphql
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
```

**`orderDetail` (visitor cart)**
```graphql
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
```

**`cpFullOrders` (order history)**
```graphql
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
```

**`cpOrderDetail`**
```graphql
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
```

### Mutations

**`cpOrdersAdd`**
```graphql
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
```

**`cpOrdersEdit`**
```graphql
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
```

**`cpOrdersCancel`**
```graphql
mutation CpOrdersCancel($_id: String!) {
  cpOrdersCancel(_id: $_id)
}
```

**`cpOrderChangeSaleStatus`**
```graphql
mutation CpOrderChangeSaleStatus($_id: String!, $saleStatus: String) {
  cpOrderChangeSaleStatus(_id: $_id, saleStatus: $saleStatus) {
    _id
  }
}
```

---

## Payment

### Queries

**`cpPayments`**
```graphql
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
```

### Mutations

**`invoiceCreate`**
```graphql
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
```

**`invoicesCheck`**
```graphql
mutation InvoicesCheck($id: String!) {
  invoicesCheck(_id: $id)
}
```
- Returns: String (`"paid"`, `"pending"`, `"failed"`, `"cancelled"`)

**`paymentTransactionsAdd`**
```graphql
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
```

---

## CMS

### Queries

**`cpMenus`**
```graphql
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
```

**`cpPageDetail`**
```graphql
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
```

**`cpPosts`**
```graphql
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
```

**`cpPostDetail`**
```graphql
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
```

---

## Wishlist

### Queries

**`cpWishlist`**
```graphql
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
```

### Mutations

**`cpWishlistAdd`**
```graphql
mutation CpWishlistAdd($productId: String!, $customerId: String!) {
  cpWishlistAdd(productId: $productId, customerId: $customerId) {
    _id
    productId
    name
    unitPrice
  }
}
```

**`cpWishlistRemove`**
```graphql
mutation CpWishlistRemove($_id: String!) {
  cpWishlistRemove(_id: $_id)
}
```

---

## Environment Variables

| Variable | Source | Header | Usage |
|----------|--------|--------|-------|
| `NEXT_PUBLIC_ERXES_API_URL` | Setup | — | GraphQL endpoint |
| `NEXT_PUBLIC_ERXES_CP_TOKEN` | Client Portal | `x-app-token` | Client portal ID |
| `NEXT_PUBLIC_POS_TOKEN` | POS Config | `erxes-pos-token` | POS token |
| `NEXT_PUBLIC_POS_TOKEN` | POS settings | cookie | POS config |
| `NEXT_PUBLIC_MAIN_API_DOMAIN` | Derived from API URL | — | CORS / images |
| `NEXT_PUBLIC_STORE_NAME` | store.config.json | — | Site title |
| `NEXT_PUBLIC_SITE_URL` | Deploy target | — | Metadata |
| `NEXT_PUBLIC_CMS_ID` | Created by script | — | CMS queries |
| `NEXT_PUBLIC_CP_ID` | Client Portal ID | — | Order mutations |

---

## Checklist

- [ ] All GraphQL files in `src/graphql/`
- [ ] Auth token in `sessionStorage` (not localStorage)
- [ ] Apollo `authLink` reads sessionStorage per request
- [ ] `client-auth-token` header for authenticated requests
- [ ] `x-app-token` = `NEXT_PUBLIC_ERXES_CP_TOKEN` (client portal ID)
- [ ] `erxes-pos-token` = `NEXT_PUBLIC_POS_TOKEN` (POS token)
- [ ] POS token in cookie header
- [ ] `useCreateInvoice` accepts destructured params
- [ ] `usePaymentPoller` is no-op
- [ ] `handleCreateInvoice({ paymentIds: [p._id] })` for method override
- [ ] Checkout waits for order `_id` before navigating to `/verify`
- [ ] `useOrderCUD` patches `_id` into `activeOrder` after `cpOrdersAdd`
- [ ] CartDrawer redirects guest to `/login` with `redirectAfterLogin`
- [ ] `useLogin` checks `redirectAfterLogin` after success
- [ ] `Link` and `useRouter` from `@/i18n/routing`
- [ ] `useCurrentUser` with `fetchPolicy: "network-only"`
- [ ] Login handler handles both string and object token responses
- [ ] Token saved BEFORE `triggerRefetchUser(true)`
- [ ] No circular dependency between `order.store` and `cart.store`
- [ ] `app/layout.tsx` only returns children
- [ ] `app/[locale]/layout.tsx` has html/body, Header, Footer
- [ ] UI components created manually (no shadcn init)
- [ ] Image URLs validated with `isValidUrl`
