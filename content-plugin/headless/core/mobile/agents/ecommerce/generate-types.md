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

## `types/products.types.ts`

```typescript
export interface IProduct {
  _id: string;
  name: string;
  code: string;
  description?: string;
  unitPrice: number;
  savedRemainder?: number;
  isCheckRem?: boolean;
  categoryId?: string;
  tagIds?: string[];
  attachment?: { url: string };
  attachmentMore?: Array<{ url: string }>;
  remainder?: number;
  // WARNING: the POS schema does NOT guarantee sizes/colors fields.
  // Verified against the live gateway: POSC_PRODUCT_DETAIL typically returns
  // NO variant data at all. These fields are optional and MUST fall back to
  // DEFAULT_SIZES / DEFAULT_COLORS constants in the UI (generate-pages.md).
  sizes?: string[];
  colors?: Array<{ label: string; value: string; hex: string }>;
}

export interface ICategory {
  _id: string;
  name: string;
  code: string;
  parentId?: string;
  order?: string;
  attachment?: { url: string };
}

export interface IWishlistItem {
  _id: string;
  productId: string;
  customerId: string;
}
```

---

## `types/orders.types.ts`

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
  selectedSize?: string;
  selectedColor?: string;
}
```

**Agent rule:** `selectedSize` болон `selectedColor` нь **optional** боловч цаг ямагт `ICartItem`-ийн default хэлбэрт орсон байх ёстой. Cart type, cart context (`store/cart.store.ts`), эсвэл AsyncStorage/SecureStore cart persistence-ийг үүсгэдэг ямар ч generator эдгээр 2 field-ийг эхнээсээ агуулна — `generate-pages.md`-ийн Product Detail screen feature-ийг хүлээж дараа нь retrofit хийхгүй.

**Product variant rule (size/color):** `IProduct.sizes` / `IProduct.colors` нь
POS schema-д **баталгаажсан талбар биш** — ихэнх product-д огт ирхгүй. Product
Detail screen дээр заавал доорх fallback constants-ийг ашигла:

```typescript
const DEFAULT_SIZES = ["38", "39", "40", "41"];
const DEFAULT_COLORS = [
  { label: "Brown", value: "brown", hex: "#8B5E3C" },
  { label: "Black", value: "black", hex: "#1A1A1A" },
  { label: "White", value: "white", hex: "#F5F5F5" },
];

// ЗӨВ — product талбар ирвэл ашигла, ирэхгүй бол fallback
const sizes: string[] = product?.sizes?.length ? product.sizes : DEFAULT_SIZES;
const colors = product?.colors?.length ? product.colors : DEFAULT_COLORS;

// БУРУУ — `product.sizes` байхгүй тул хоосон array, size сонгох боломжгүй
const sizes = product?.sizes ?? [];
```

> Хэрэв product-д size/color байхгүй бол cart-ын `selectedSize`/`selectedColor`
> field-үүд fallback утгаар орно — cart дэх бусад item-үүдэд алдаа үүсгэхгүй.

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
