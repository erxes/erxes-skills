# Ecommerce Coding Conventions

Follow these rules in every file.

---

## 1. Auth Token Storage

**Use `sessionStorage`, NOT `localStorage`.**

```typescript
// ЗӨВ
sessionStorage.setItem("token", token);
const token = sessionStorage.getItem("token");

// БУРУУ
localStorage.setItem("token", token);
```

- `sessionStorage` — tab хаагдахад устана
- `localStorage` — хэрэглэгч гарсны дараа ч хадгалагдана (security эрсдэлтэй)

---

## 2. Apollo Auth Link

**`client-auth-token` header-г request бүрт sessionStorage-аас уншина.**

```typescript
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== "undefined"
    ? sessionStorage.getItem("token") || ""
    : "";
  return {
    headers: {
      ...headers,
      "client-auth-token": token,
      "x-app-token": process.env.NEXT_PUBLIC_ERXES_CP_TOKEN || "",
      "erxes-pos-token": process.env.NEXT_PUBLIC_POS_TOKEN || "",
    },
  };
});
```

**ЧУХАЛ:** Login дараа `triggerRefetchUser(true)` дуудахын өмнө `sessionStorage.setItem("token", token)` хийсэн байх ёстой.

---

## 3. Token Types

| Token | Env Var | Header | Source |
|-------|---------|--------|--------|
| CP Token | `NEXT_PUBLIC_ERXES_CP_TOKEN` | `x-app-token` | Client Portal ID |
| Auth Token | — | `client-auth-token` | sessionStorage (login response) |
| POS Token | `NEXT_PUBLIC_POS_TOKEN` | `erxes-pos-token` | POS settings |

---

## 4. GraphQL File Organization

**Use `src/graphql/`, NOT `lib/graphql/`.**

```typescript
// ЗӨВ
import { GET_PRODUCTS } from "@/graphql/products";

// БУРУУ
import { GET_PRODUCTS } from "@/lib/graphql/products";
```

---

## 5. Jotai Store Rules

**Circular dependency байхгүй байх.**

```typescript
// ЗӨВ: order.store → cart.store (order.store нь cart.store-аас import хийхгүй)
// cart.store.ts
import { itemsAtom, cartTotalAtom } from "@/store/order.store";

// БУРУУ: order.store.ts дотор `import { something } from "./cart.store"` байж болохгүй
```

---

## 6. Locale-aware Navigation

**`next/link`-г биш `@/i18n/routing`-ийн `Link`-г ашиглана.**

```typescript
// ЗӨВ
import { Link } from "@/i18n/routing";

// БУРУУ
import Link from "next/link";
```

---

## 7. Server vs Client Components

| Component | Type | Why |
|-----------|------|-----|
| Header | Server | Categories from `getClient()` |
| Footer | Server | Menus from `getClient()` |
| CartDrawer | Client | Jotai state |
| ProductCard | Client | Add to cart interaction |
| Checkout | Client | Forms, payment state |

---

## 8. Image Handling

**Validate URLs before passing to Next.js `Image`.**

```typescript
export function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Usage
{isValidUrl(product.attachment?.url) ? (
  <Image src={product.attachment.url} ... />
) : (
  <div className="bg-gray-200" />
)}
```

---

## 9. Payment Flow

1. `/checkout` — delivery info бөглөж (`firstName`, `lastName`, `email`, `phone`, `address`, `description`), payment method сонгож, `cpOrdersAdd` дуудна → `activeOrderAtom`-д хадгална
2. `/verify` — `useCallback + setInterval(5000)` auto-polling — invoice үүссэний дараа 5 секунд тутамд `invoicesCheck` дуудна
3. "Төлбөр төлөх" товч — `invoiceCreate` → `paymentTransactionsAdd` хоёуланг нэг handler дотор дуудна → QR авна
4. QR харуулна (`txResult.transaction.response.qrData` эсвэл `details.qrData`)
5. `redirectUrl` байвал `window.location.href` ашиглан redirect хийнэ
6. "Төлөв шалгах" товч — `invoicesCheck` дуудна (auto-polling-тай зэрэгцэнэ)
7. `paymentStatus === "paid"` болмогц polling зогсоно, амжилтын UI харуулна

**`cpOrderChangeSaleStatus` дуудахгүй — энгийн flow.**
**Route: `/verify` (ID байхгүй) — `activeOrderAtom`-аас order уншина.**
**`currentUser` байвал `customerId: currentUser._id, customerType: "customer"` — үгүй бол `"empty"` / `"visitor"`.**

---

## 10. i18n Rules

**Every user-facing string MUST use `t("key")`. Zero exceptions.**

```tsx
// ЗӨВ — server component
const t = await getTranslations();
<h1>{t("wishlist.title")}</h1>

// ЗӨВ — client component
const t = useTranslations();
<button>{t("product.addToCart")}</button>

// БУРУУ — hardcoded text
<h1>Хадгалсан бараа</h1>
<button>Add to Cart</button>
```

Key naming convention: `section.key` — e.g. `product.addToCart`, `cart.empty`, `order.submitOrder`

---

## 11. Build Checklist

- [ ] `middleware.ts` project root-д байна
- [ ] `app/layout.tsx` — зөвхөн `return children` байна (html/body байхгүй)
- [ ] `app/[locale]/layout.tsx` — html/body, Header, Footer энд байна
- [ ] `store/order.store.ts` нь `cart.store`-аас import хийхгүй
- [ ] `Link`, `useRouter` нь `@/i18n/routing`-аас байна (`next/link` биш)
- [ ] `useCurrentUser` — `fetchPolicy: "network-only"`, `triggerRefetchUser: () => refetch()` (setTrigger биш)
- [ ] Login: mutation нэр `clientPortalUserLoginWithCredentials`, variables: `{ email, password }` (clientPortalId байхгүй)
- [ ] Login response: `raw?.token` + `raw?.refreshToken` — хоёуланг sessionStorage-д хадгална
- [ ] Token хадгалсны ДАРАА `triggerRefetchUser()` дуудна
- [ ] Register: mutation нэр `clientPortalUserRegister`, flat variables, token буцаахгүй — user object буцаана
- [ ] Logout: `sessionStorage.removeItem("token")` + `removeItem("refreshToken")`, `setCurrentUser(null)`, redirect "/"
- [ ] Apollo `authLink`: `x-app-token` = `NEXT_PUBLIC_ERXES_CP_TOKEN` (client portal ID), `erxes-pos-token` = `NEXT_PUBLIC_POS_TOKEN` (POS token)
- [ ] `/verify` auto-polling: `useCallback` + `useEffect` + `setInterval(5000)` — invoice үүссэний дараа идэвхждэг, `paymentStatus === "paid"` болмогц `clearInterval`
- [ ] `useCreateInvoice` — destructured params (`paymentIds`, `amount`, `description`, `contentType`, `contentTypeId`, `customerId`, `customerType`)
- [ ] `/verify` — `invoiceCreate` + `paymentTransactionsAdd` хоёуланг нэг handler дотор дуудна
- [ ] QR: `txResult.transaction?.response?.qrData` → `details?.qrData` → invoice transactions fallback
- [ ] `redirectUrl` байвал `window.location.href` ашигла
- [ ] Checkout `router.push("/verify")` — ID байхгүй flat route
- [ ] `useOrderCUD` — `activeOrderAtom`-д `{ ...order, totalAmount: calculatedTotal }` хадгална
- [ ] `orderTotalAtom` — `activeOrder.totalAmount || 0` derived atom
- [ ] CartDrawer checks `currentUser` — redirects to `/login` with `redirectAfterLogin` if guest
- [ ] `useLogin` checks `sessionStorage.getItem("redirectAfterLogin")` after successful login
- [ ] CMS pages — зөвхөн `cms_sections`-д байгаа page-ийг үүсгэсэн
- [ ] `shadcn@latest init` NOT run — UI components created manually
- [ ] `pnpm build` 0 алдаатай
