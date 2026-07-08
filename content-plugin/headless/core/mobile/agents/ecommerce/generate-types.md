# Ecommerce TypeScript Types

## `types/auth.types.ts`

```typescript
export interface IUser {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isOwner?: boolean;
}

export interface ILoginResponse {
  token: string;
  user: IUser;
}

export interface IRegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IForgotPasswordInput {
  email: string;
}

export interface IResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface IChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
```

---

## `types/product.types.ts`

```typescript
export interface IProduct {
  _id: string;
  name: string;
  description?: string;
  unitPrice: number;
  categoryId?: string;
  attachment?: { url: string };
  attachmentMore?: Array<{ url: string }>;
  code: string;
  sku?: string;
  customFieldsData?: Record<string, any>;
  tagIds?: string[];
}

export interface ICategory {
  _id: string;
  name: string;
  parentId?: string;
  order?: string;
  metaDescription?: string;
}

export interface IWishlistItem {
  _id: string;
  productId: string;
  customerId: string;
}
```

---

## `types/order.types.ts`

```typescript
export interface IOrder {
  _id: string;
  items: IOrderItem[];
  totalAmount: number;
  status: string;
  customerId?: string;
  customerType?: string;
  createdAt?: string;
  paidDate?: string;
  billType?: string;
  registerNumber?: string;
  deliveryInfo?: IDeliveryInfo;
}

export interface IOrderItem {
  _id: string;
  productId: string;
  count: number;
  unitPrice: number;
  discountAmount?: number;
  bonusCount?: number;
  productName?: string;
}

export interface IDeliveryInfo {
  address?: string;
  description?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  street?: string;
  detail?: string;
  coordinate?: { longitude: number; latitude: number };
  hasSubtraction?: boolean;
  subtraction?: number;
}

export interface ICartItem {
  productId: string;
  count: number;
  unitPrice: number;
  productName?: string;
  productImgUrl?: string;
}
```

---

## `types/payment.types.ts`

```typescript
export interface IPayment {
  _id: string;
  name: string;
  kind: string;
  status?: string;
  config?: Record<string, any>;
}

export interface IPaymentConfig {
  paymentIds: string[];
  amount: number;
  description?: string;
  callbackUrl?: string;
}

export interface IInvoice {
  _id: string;
  amount: number;
  status: string;
  paymentId: string;
  apiResponse?: Record<string, any>;
  redirectUrl?: string;
}

export interface IPaymentType {
  _id: string;
  title: string;
  type: string;
  icon?: string;
}
```

---

## `types/cms.types.ts`

```typescript
export interface IPage {
  _id: string;
  name: string;
  slug: string;
  content?: string;
  description?: string;
  status?: string;
}

export interface IPost {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  featuredImage?: { url: string };
  author?: string;
  tagIds?: string[];
  status?: string;
  publishedDate?: string;
}

export interface ICategoryPost {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  order?: string;
}
```

---

## `types/review.types.ts`

```typescript
export interface IReview {
  _id: string;
  productId: string;
  customerId: string;
  rating: number;
  content?: string;
  createdAt?: string;
}

export interface ICreateReviewInput {
  productId: string;
  rating: number;
  content?: string;
}
```
