# Ecommerce i18n Setup

Next.js 15 App Router uses `next-intl` with a `[locale]` dynamic segment.
Supported locales: `"mn"` (default), `"en"`.

---

## `i18n/routing.ts`

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["mn", "en"],
  defaultLocale: "mn",
});
```

---

## `i18n/request.ts`

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

---

## `middleware.ts`

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

---

## `messages/mn.json`

```json
{
  "metadata": {
    "title": "Дэлгүүр",
    "description": "Онлайн худалдааны платформ"
  },
  "common": {
    "loading": "Ачаалж байна...",
    "error": "Алдаа гарлаа",
    "save": "Хадгалах",
    "cancel": "Болих",
    "delete": "Устгах",
    "edit": "Засах",
    "add": "Нэмэх",
    "close": "Хаах",
    "back": "Буцах",
    "next": "Дараах",
    "submit": "Илгээх",
    "confirm": "Баталгаажуулах",
    "search": "Хайх",
    "viewAll": "Бүгдийг харах",
    "noData": "Мэдээлэл байхгүй байна",
    "success": "Амжилттай",
    "failed": "Амжилтгүй"
  },
  "auth": {
    "login": "Нэвтрэх",
    "logout": "Гарах",
    "register": "Бүртгүүлэх",
    "email": "И-мэйл",
    "password": "Нууц үг",
    "firstName": "Нэр",
    "lastName": "Овог",
    "phone": "Утасны дугаар",
    "forgotPassword": "Нууц үгээ мартсан уу?",
    "resetPassword": "Нууц үг сэргээх",
    "changePassword": "Нууц үг солих",
    "currentPassword": "Одоогийн нууц үг",
    "newPassword": "Шинэ нууц үг",
    "confirmPassword": "Нууц үг давтах",
    "loginSuccess": "Амжилттай нэвтэрлээ",
    "logoutSuccess": "Амжилттай гарлаа",
    "registerSuccess": "Амжилттай бүртгэгдлээ",
    "noAccount": "Бүртгэл байхгүй юу?",
    "hasAccount": "Бүртгэл байна уу?"
  },
  "product": {
    "title": "Бүтээгдэхүүн",
    "products": "Бүтээгдэхүүнүүд",
    "category": "Ангилал",
    "categories": "Ангилалууд",
    "price": "Үнэ",
    "description": "Тайлбар",
    "addToCart": "Сагсанд нэмэх",
    "addToWishlist": "Хүслийн жагсаалтад нэмэх",
    "removeFromWishlist": "Хүслийн жагсаалтаас хасах",
    "outOfStock": "Дууссан",
    "inStock": "Байгаа",
    "relatedProducts": "Ижил төстэй бүтээгдэхүүн",
    "noProducts": "Бүтээгдэхүүн байхгүй байна",
    "searchPlaceholder": "Бүтээгдэхүүн хайх...",
    "allCategories": "Бүх ангилал"
  },
  "cart": {
    "title": "Сагс",
    "empty": "Сагс хоосон байна",
    "total": "Нийт дүн",
    "quantity": "Тоо ширхэг",
    "remove": "Хасах",
    "clear": "Цэвэрлэх",
    "checkout": "Худалдан авах",
    "continueShopping": "Дэлгүүрлэлт үргэлжлүүлэх",
    "itemCount": "{count} бараа"
  },
  "checkout": {
    "title": "Захиалга оруулах",
    "deliveryInfo": "Хүргэлтийн мэдээлэл",
    "firstName": "Нэр",
    "lastName": "Овог",
    "email": "И-мэйл",
    "phone": "Утас",
    "address": "Хаяг",
    "description": "Нэмэлт тайлбар",
    "paymentMethod": "Төлбөрийн арга",
    "placeOrder": "Захиалга өгөх",
    "orderSummary": "Захиалгын хураангуй",
    "subtotal": "Дэд нийлбэр",
    "deliveryFee": "Хүргэлтийн төлбөр",
    "total": "Нийт"
  },
  "payment": {
    "title": "Төлбөр",
    "status": "Төлбөрийн төлөв",
    "pending": "Хүлээгдэж байна",
    "paid": "Төлөгдсөн",
    "failed": "Амжилтгүй",
    "cancelled": "Цуцлагдсан",
    "verify": "Төлбөр шалгах",
    "qrCode": "QR код",
    "scanQr": "QR кодыг уншуулна уу",
    "checkStatus": "Төлбөр шалгах",
    "waitingPayment": "Төлбөр хүлээж байна...",
    "paymentSuccess": "Төлбөр амжилттай",
    "paymentFailed": "Төлбөр амжилтгүй",
    "selectPayment": "Төлбөрийн арга сонгох"
  },
  "order": {
    "title": "Захиалга",
    "orders": "Захиалгууд",
    "orderDetail": "Захиалгын дэлгэрэнгүй",
    "orderId": "Захиалгын дугаар",
    "status": "Төлөв",
    "createdAt": "Үүсгэсэн огноо",
    "totalAmount": "Нийт дүн",
    "items": "Барааны жагсаалт",
    "noOrders": "Захиалга байхгүй байна",
    "cancel": "Захиалга цуцлах",
    "pending": "Хүлээгдэж байна",
    "done": "Дууссан",
    "new": "Шинэ"
  },
  "wishlist": {
    "title": "Хүслийн жагсаалт",
    "empty": "Хүслийн жагсаалт хоосон байна",
    "remove": "Хасах"
  },
  "profile": {
    "title": "Профайл",
    "myOrders": "Миний захиалгууд",
    "myWishlist": "Хүслийн жагсаалт",
    "settings": "Тохиргоо",
    "personalInfo": "Хувийн мэдээлэл",
    "editProfile": "Профайл засах"
  },
  "review": {
    "title": "Сэтгэгдэл",
    "add": "Сэтгэгдэл нэмэх",
    "edit": "Засах",
    "delete": "Устгах",
    "rating": "Үнэлгээ",
    "content": "Сэтгэгдэл",
    "noReviews": "Одоогоор сэтгэгдэл байхгүй байна",
    "placeholder": "Сэтгэгдэл бичих...",
    "loginRequired": "Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү"
  },
  "blog": {
    "title": "Блог",
    "readMore": "Дэлгэрэнгүй унших",
    "noPosts": "Нийтлэл байхгүй байна",
    "publishedAt": "Нийтлэгдсэн"
  },
  "about": {
    "title": "Бидний тухай"
  },
  "nav": {
    "home": "Нүүр",
    "products": "Бүтээгдэхүүн",
    "blog": "Блог",
    "about": "Бидний тухай",
    "cart": "Сагс",
    "wishlist": "Хүслийн жагсаалт",
    "profile": "Профайл",
    "orders": "Захиалгууд"
  },
  "footer": {
    "rights": "Бүх эрх хуулиар хамгаалагдсан"
  },
  "error": {
    "notFound": "Хуудас олдсонгүй",
    "serverError": "Сервер алдаа",
    "tryAgain": "Дахин оролдох"
  }
}
```

---

## `messages/en.json`

```json
{
  "metadata": {
    "title": "Store",
    "description": "Online shopping platform"
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "submit": "Submit",
    "confirm": "Confirm",
    "search": "Search",
    "viewAll": "View All",
    "noData": "No data available",
    "success": "Success",
    "failed": "Failed"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "register": "Register",
    "email": "Email",
    "password": "Password",
    "firstName": "First name",
    "lastName": "Last name",
    "phone": "Phone number",
    "forgotPassword": "Forgot password?",
    "resetPassword": "Reset password",
    "changePassword": "Change password",
    "currentPassword": "Current password",
    "newPassword": "New password",
    "confirmPassword": "Confirm password",
    "loginSuccess": "Logged in successfully",
    "logoutSuccess": "Logged out successfully",
    "registerSuccess": "Registered successfully",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?"
  },
  "product": {
    "title": "Product",
    "products": "Products",
    "category": "Category",
    "categories": "Categories",
    "price": "Price",
    "description": "Description",
    "addToCart": "Add to cart",
    "addToWishlist": "Add to wishlist",
    "removeFromWishlist": "Remove from wishlist",
    "outOfStock": "Out of stock",
    "inStock": "In stock",
    "relatedProducts": "Related products",
    "noProducts": "No products found",
    "searchPlaceholder": "Search products...",
    "allCategories": "All categories"
  },
  "cart": {
    "title": "Cart",
    "empty": "Your cart is empty",
    "total": "Total",
    "quantity": "Quantity",
    "remove": "Remove",
    "clear": "Clear",
    "checkout": "Checkout",
    "continueShopping": "Continue shopping",
    "itemCount": "{count} items"
  },
  "checkout": {
    "title": "Checkout",
    "deliveryInfo": "Delivery information",
    "firstName": "First name",
    "lastName": "Last name",
    "email": "Email",
    "phone": "Phone",
    "address": "Address",
    "description": "Additional notes",
    "paymentMethod": "Payment method",
    "placeOrder": "Place order",
    "orderSummary": "Order summary",
    "subtotal": "Subtotal",
    "deliveryFee": "Delivery fee",
    "total": "Total"
  },
  "payment": {
    "title": "Payment",
    "status": "Payment status",
    "pending": "Pending",
    "paid": "Paid",
    "failed": "Failed",
    "cancelled": "Cancelled",
    "verify": "Verify payment",
    "qrCode": "QR code",
    "scanQr": "Scan QR code",
    "checkStatus": "Check status",
    "waitingPayment": "Waiting for payment...",
    "paymentSuccess": "Payment successful",
    "paymentFailed": "Payment failed",
    "selectPayment": "Select payment method"
  },
  "order": {
    "title": "Order",
    "orders": "Orders",
    "orderDetail": "Order detail",
    "orderId": "Order ID",
    "status": "Status",
    "createdAt": "Created at",
    "totalAmount": "Total amount",
    "items": "Items",
    "noOrders": "No orders found",
    "cancel": "Cancel order",
    "pending": "Pending",
    "done": "Done",
    "new": "New"
  },
  "wishlist": {
    "title": "Wishlist",
    "empty": "Your wishlist is empty",
    "remove": "Remove"
  },
  "profile": {
    "title": "Profile",
    "myOrders": "My orders",
    "myWishlist": "Wishlist",
    "settings": "Settings",
    "personalInfo": "Personal information",
    "editProfile": "Edit profile"
  },
  "review": {
    "title": "Reviews",
    "add": "Add review",
    "edit": "Edit",
    "delete": "Delete",
    "rating": "Rating",
    "content": "Review",
    "noReviews": "No reviews yet",
    "placeholder": "Write your review...",
    "loginRequired": "Please log in to leave a review"
  },
  "blog": {
    "title": "Blog",
    "readMore": "Read more",
    "noPosts": "No posts available",
    "publishedAt": "Published"
  },
  "about": {
    "title": "About us"
  },
  "nav": {
    "home": "Home",
    "products": "Products",
    "blog": "Blog",
    "about": "About",
    "cart": "Cart",
    "wishlist": "Wishlist",
    "profile": "Profile",
    "orders": "Orders"
  },
  "footer": {
    "rights": "All rights reserved"
  },
  "error": {
    "notFound": "Page not found",
    "serverError": "Server error",
    "tryAgain": "Try again"
  }
}
```
