# Ecommerce Pages

> **Design rule:** Page logic (data fetching, state, mutations, routing) is authoritative. All `className` values are mak-ecommerce reference only — apply your design tokens. For checkout and verify pages, see `generate-checkout.md`.

---

## Design Binding — Read Before Writing ANY Page

**Hard gate:** Do not write any page until the steps in `generate-components.md` Design Binding section are complete (design-tokens.json read, HANDOFF.md read, globals.css verified).

### Page-level design rules

- Every page layout must use the spacing rhythm from `design-tokens.json` → `spacing.layout`
- Section backgrounds must alternate using `colors.semantic.background` and `colors.semantic.card` per the HANDOFF.md section plan
- Page headings must use `typography.families.display` font
- Body text must use `typography.families.body` font
- All interactive states (hover, focus, active) must use the token-mapped colors — do not hardcode hex values
- If `motion.motionLevel` > 0 in `design-tokens.json`, apply entrance animations from `motion.variants` to page sections

### Per-page design source

Before writing each page, check `HANDOFF.md` section **1. Frontend Build Map** for that page's layout notes. If HANDOFF.md has specific guidance for a page (e.g. hero layout, product grid columns, checkout panel split), follow it exactly.

| Page | Check HANDOFF.md for |
|---|---|
| Homepage | hero layout, section order, featured grid columns |
| Products | filter sidebar position, grid columns, card style |
| Product detail | image gallery layout, info panel layout, review section |
| Cart | line item layout, summary panel position |
| Checkout | form/summary split, delivery fields order, payment selector style |
| Login / Register | form card width, centered vs split layout |
| Profile | sidebar nav style, content panel layout |
| Orders | list item style, status badge colors |
| Wishlist | grid columns, card remove action placement |

---

## Homepage (`app/[locale]/page.tsx`) — Server

Fetches `poscProducts` (page: 1, perPage: 8). Renders hero section + featured products grid + "View All" link to `/products`.

```typescript
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getApolloClient } from "@/lib/apollo/client";
import { POSC_PRODUCTS } from "@/graphql/ecommerce/queries/product";
import { ProductCard } from "@/components/product/ProductCard";

export default async function HomePage() {
  const t = await getTranslations();
  const client = getApolloClient();

  const { data } = await client.query({
    query: POSC_PRODUCTS,
    variables: { page: 1, perPage: 8 },
  });

  const products = data?.poscProducts || [];

  return (
    <div className="container py-8">
      {/* Hero section */}
      <section className="mb-12">
        <h1>{t("metadata.title")}</h1>
        <p>{t("metadata.description")}</p>
      </section>

      {/* Featured products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2>Featured Products</h2>
          <Link href="/products">{t("common.viewAll")}</Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## Products List (`app/[locale]/products/page.tsx`) — Client

State: `searchValue`, `selectedCategory`, `page`. Uses `useProducts` + `useProductCategories` hooks. Renders category filter bar + product grid + pagination.

```typescript
"use client";

import { useState } from "react";
import { useProducts, useProductCategories } from "@/hooks/queries";
import { ProductCard } from "@/components/product/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { products, loading } = useProducts({ categoryId: selectedCategory, page, perPage: 20, searchValue: searchValue || undefined });
  const { categories } = useProductCategories();

  return (
    <div className="container py-8">
      {/* Search input */}
      <Input placeholder="Хайх..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(undefined)}>Бүгд</Button>
        {categories.map((cat: { _id: string; name?: string }) => (
          <Button key={cat._id} variant={selectedCategory === cat._id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat._id)}>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Product grid with loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-xl border bg-card p-4 animate-pulse"><div className="aspect-square bg-muted rounded-lg mb-4" /></div>)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product: any) => <ProductCard key={product._id} product={product} />)}
          </div>
          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Өмнөх</Button>
            <span className="flex items-center px-4">{page} хуудас</span>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={products.length < 20}>Дараах</Button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Product Detail (`app/[locale]/products/[id]/page.tsx`) — Client

Complex page: product detail + add-to-cart + wishlist toggle + review CRUD.

Key patterns:
- `params` is `Promise<{ id: string }>` in Next.js 15 — resolve with `useEffect`
- `addToCart`: upserts count in `cartItemsAtom`
- `addToWishlist`: calls `CP_WISHLIST_ADD` if logged in, always updates `wishlistItemsAtom`
- Reviews: `CP_PRODUCT_REVIEWS` query + `CP_PRODUCT_REVIEW_ADD`/`UPDATE`/`REMOVE` mutations
- `myReview`: find by `customerId === currentUser._id`; pre-populate form if found
- `avgRating`: average of all review scores
- `StarRating` component: interactive (for form) or static (for display), hover state

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useQuery, useMutation } from "@apollo/client/react";
import { cartItemsAtom } from "@/store/cart.store";
import { wishlistItemsAtom } from "@/store/wishlist.store";
import { currentUserAtom } from "@/store/auth.store";
import { useProductDetail } from "@/hooks/queries";
import { formatPrice, isValidUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CP_WISHLIST_ADD } from "@/graphql/ecommerce/mutations/wishlist";
import { CP_PRODUCT_REVIEW_ADD, PRODUCT_REVIEW_UPDATE, PRODUCT_REVIEW_REMOVE } from "@/graphql/ecommerce/mutations/productReview";
import { CP_PRODUCT_REVIEWS, CpProductReviewsData } from "@/graphql/ecommerce/queries/productReview";

// StarRating: interactive (onRate + hover) or static
function StarRating({ rating, onRate, interactive = false, size = 20 }: { rating: number; onRate?: (r: number) => void; interactive?: boolean; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive ? star <= (hover || rating) : star <= rating;
        return (
          <button key={star} type="button" disabled={!interactive}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F97316" : "none"} stroke="#F97316" strokeWidth={1.5}>
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => { params.then((p) => setProductId(p.id)); }, [params]);

  const { product, loading } = useProductDetail(productId);
  const [, setCartItems] = useAtom(cartItemsAtom);
  const [, setWishlistItems] = useAtom(wishlistItemsAtom);
  const [currentUser] = useAtom(currentUserAtom);

  const [addWishlistMutation] = useMutation(CP_WISHLIST_ADD);
  const [addReview] = useMutation(CP_PRODUCT_REVIEW_ADD);
  const [updateReview] = useMutation(PRODUCT_REVIEW_UPDATE);
  const [removeReview] = useMutation(PRODUCT_REVIEW_REMOVE);

  const { data: reviewsData, refetch: refetchReviews } = useQuery<CpProductReviewsData>(CP_PRODUCT_REVIEWS, {
    variables: { productIds: productId ? [productId] : [], page: 1, perPage: 50 },
    skip: !productId,
    fetchPolicy: "cache-and-network",
  });

  const reviews = reviewsData?.cpProductReviews || [];
  const myReview = currentUser ? reviews.find((r) => r.customerId === currentUser._id) : null;
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.review || 0), 0) / reviews.length : 0;

  useEffect(() => {
    if (myReview) { setReviewRating(myReview.review || 0); setReviewText(myReview.description || ""); setEditingReviewId(myReview._id); }
    else { setReviewRating(0); setReviewText(""); setEditingReviewId(null); }
  }, [myReview]);

  const addToCart = () => {
    if (!product) return;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) return prev.map((i) => i.productId === product._id ? { ...i, count: i.count + quantity } : i);
      return [...prev, { productId: product._id, count: quantity, unitPrice: product.unitPrice || 0, productName: product.name, productImgUrl: product.attachment?.url }];
    });
  };

  const addToWishlist = async () => {
    if (!product) return;
    if (currentUser?._id) await addWishlistMutation({ variables: { productId: product._id, customerId: currentUser._id } });
    setWishlistItems((prev) => {
      if (prev.find((item) => item.productId === product._id)) return prev;
      return [...prev, { productId: product._id, productName: product.name, unitPrice: product.unitPrice, productImgUrl: product.attachment?.url }];
    });
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !productId || reviewRating === 0) return;
    if (editingReviewId) {
      await updateReview({ variables: { _id: editingReviewId, productId, customerId: currentUser._id, review: reviewRating, description: reviewText } });
    } else {
      await addReview({ variables: { productId, customerId: currentUser._id, review: reviewRating, description: reviewText } });
    }
    await refetchReviews();
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Сэтгэгдлийг устгах уу?")) return;
    await removeReview({ variables: { _id: reviewId } });
    await refetchReviews();
    setReviewRating(0); setReviewText(""); setEditingReviewId(null);
  };

  if (loading || !productId) return <div className="container py-8"><div className="animate-pulse ..."></div></div>;
  if (!product) return <div className="container py-8"><p>Бараа олдсонгүй</p><Button onClick={() => router.push("/products")}>Бараа руу буцах</Button></div>;

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product image */}
        <div className="rounded-xl bg-muted ...">
          {product.attachment?.url && isValidUrl(product.attachment.url) ? (
            <Image src={product.attachment.url} alt={product.name || ""} width={600} height={600} className="h-full w-full object-cover" />
          ) : <span className="text-6xl">📦</span>}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <h1>{product.name}</h1>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-primary">{formatPrice(product.unitPrice || 0)}</p>
            <StarRating rating={Math.round(avgRating)} size={16} />
            <span>({reviews.length})</span>
          </div>

          {/* Quantity counter */}
          <div className="flex items-center gap-4">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>

          <Button onClick={addToCart} className="w-full">Сагсанд нэмэх ({quantity} ширхэг)</Button>
          <Button variant="outline" onClick={addToWishlist} className="w-full">Хадгалах</Button>

          {product.description && <p>{product.description}</p>}
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-12 border-t pt-10">
        <h2>Сэтгэгдлүүд ({reviews.length})</h2>

        {currentUser ? (
          <div className="mt-6 ...">
            <StarRating rating={reviewRating} onRate={setReviewRating} interactive size={28} />
            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Таны сэтгэгдэл..." rows={3} />
            <Button onClick={handleSubmitReview} disabled={reviewRating === 0}>{editingReviewId ? "Шинэчлэх" : "Илгээх"}</Button>
            {editingReviewId && <Button variant="outline" onClick={() => { setReviewRating(0); setReviewText(""); setEditingReviewId(null); }}>Цуцлах</Button>}
          </div>
        ) : (
          <p>Сэтгэгдэл бичихийн тулд <Link href="/login">нэвтэрнэ үү</Link></p>
        )}

        {/* Review list */}
        {reviews.map((review) => (
          <div key={review._id} className="...">
            <StarRating rating={review.review || 0} size={14} />
            {review.customerId === currentUser?._id && (
              <>
                <button onClick={() => { setReviewRating(review.review || 0); setReviewText(review.description || ""); setEditingReviewId(review._id); }}>Засах</button>
                <button onClick={() => handleDeleteReview(review._id)}>Устгах</button>
              </>
            )}
            {review.description && <p>{review.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Login (`app/[locale]/login/page.tsx`) — Client

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useLogin } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations();
  const { login, loading } = useLogin();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    const result = await login(data);
    if (!result.success) setError(t("auth.invalidCredentials"));
  };

  return (
    <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h1>{t("auth.loginTitle")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>{t("auth.email")}</Label><Input type="email" {...register("email")} />{errors.email && <p>{errors.email.message}</p>}</div>
          <div><Label>{t("auth.password")}</Label><Input type="password" {...register("password")} />{errors.password && <p>{errors.password.message}</p>}</div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? t("common.loading") : t("auth.loginTitle")}</Button>
        </form>
        <div className="text-center text-sm">
          <Link href="/forgot-password">{t("auth.forgotPassword")}</Link>
        </div>
        <div className="text-center text-sm">
          Don&apos;t have an account? <Link href="/register">{t("auth.registerTitle")}</Link>
        </div>
      </div>
    </div>
  );
}
```

---

## Profile (`app/[locale]/profile/page.tsx`) — Client

Auth guard: redirect to `/login` if not logged in. Sidebar nav with Profile / Orders / Wishlist links.

```typescript
"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { currentUserAtom } from "@/store/auth.store";
import { useCurrentUser, useLogout } from "@/hooks/auth";

const navItems = [
  { label: "Профайл", href: "/profile" },
  { label: "Захиалгууд", href: "/orders" },
  { label: "Хадгалсан", href: "/wishlist" },
];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const { currentUser: fetchedUser, loading } = useCurrentUser();
  const { logout } = useLogout();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { if (fetchedUser) setCurrentUser(fetchedUser); }, [fetchedUser, setCurrentUser]);
  useEffect(() => { if (!loading && !currentUser) router.push("/login"); }, [loading, currentUser, router]);

  if (loading) return <div className="container py-8"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  if (!currentUser) return null;

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-4">
            <p>{currentUser.firstName || currentUser.email}</p>
            <p>{currentUser.email}</p>
            <nav className="space-y-1 mt-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={pathname === item.href ? "active-style" : "default-style"}>
                  {item.label}
                </Link>
              ))}
              <button onClick={logout} className="text-destructive ...">Гарах</button>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <div className="lg:col-span-3">
          <h1>Профайл</h1>
          <div className="mt-6 space-y-4 rounded-lg border p-6">
            <div><label>Имэйл</label><p>{currentUser.email}</p></div>
            {currentUser.firstName && <div><label>Нэр</label><p>{currentUser.firstName} {currentUser.lastName}</p></div>}
            {currentUser.phone && <div><label>Утас</label><p>{currentUser.phone}</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Orders (`app/[locale]/orders/page.tsx`) — Client

Auth guard. Uses `useOrders(currentUser?._id)`. Shows order list with status + total + date. Links to `/orders/[id]`.

```typescript
"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { currentUserAtom } from "@/store/auth.store";
import { useOrders } from "@/hooks/order";
import { formatPrice } from "@/lib/utils";

export default function OrdersPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const { orders, loading } = useOrders(currentUser?._id);

  useEffect(() => { if (!currentUser) router.push("/login"); }, [currentUser, router]);
  if (!currentUser) return null;

  return (
    <div className="container py-8">
      <h1>Захиалгууд</h1>
      {loading ? (
        <div className="mt-6 space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Захиалга байхгүй байна</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order: any) => (
            <Link key={order._id} href={`/orders/${order._id}`} className="block rounded-lg border p-4 hover:bg-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order #{order._id.slice(-6)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(order.totalAmount)}</p>
                  <p className="text-sm capitalize text-muted-foreground">{order.status}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Wishlist (`app/[locale]/wishlist/page.tsx`) — Client

Requires login (show login prompt if guest). Fetches `CP_WISHLIST` by `customerId`. Remove with `CP_WISHLIST_REMOVE` + refetch.

```typescript
"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { useMutation, useQuery } from "@apollo/client/react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { currentUserAtom } from "@/store/auth.store";
import { CP_WISHLIST } from "@/graphql/ecommerce/queries/wishlist";
import { CP_WISHLIST_REMOVE } from "@/graphql/ecommerce/mutations/wishlist";
import { Button } from "@/components/ui/button";
import { formatPrice, isValidUrl } from "@/lib/utils";

export default function WishlistPage() {
  const [currentUser] = useAtom(currentUserAtom);
  const [removingId, setRemovingId] = useState("");

  const { data, loading, refetch } = useQuery(CP_WISHLIST, {
    variables: { customerId: currentUser?._id || "" },
    skip: !currentUser?._id,
    fetchPolicy: "network-only",
  });

  const [removeMutation] = useMutation(CP_WISHLIST_REMOVE);
  const wishlist = (data as any)?.cpWishlist || [];

  const handleRemove = async (_id: string) => {
    setRemovingId(_id);
    try { await removeMutation({ variables: { _id } }); refetch(); }
    finally { setRemovingId(""); }
  };

  if (!currentUser) return (
    <div className="container py-16 text-center">
      <h1>Хадгалсан бараа</h1>
      <p>Харахын тулд нэвтэрнэ үү</p>
      <Link href="/login"><Button>Нэвтрэх</Button></Link>
    </div>
  );

  return (
    <div className="container py-8">
      <h1>Хадгалсан бараа <span>{wishlist.length} бараа</span></h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <p>Хадгалсан бараа байхгүй</p>
          <Link href="/products"><Button variant="outline">Бараа үзэх</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item: any) => (
            <div key={item._id} className="rounded-xl border overflow-hidden">
              <Link href={`/products/${item.productId}`}>
                <div className="aspect-square bg-muted">
                  {item.product?.attachment?.url && isValidUrl(item.product.attachment.url) ? (
                    <Image src={item.product.attachment.url} alt={item.product?.name || ""} width={400} height={400} className="h-full w-full object-cover" />
                  ) : <span className="text-4xl">📦</span>}
                </div>
              </Link>
              <div className="p-4">
                <h3>{item.product?.name || "Бараа"}</h3>
                <p>{formatPrice(item.product?.unitPrice || 0)}</p>
                <div className="flex gap-2 mt-4">
                  <Link href={`/products/${item.productId}`} className="flex-1"><Button variant="outline" className="w-full" size="sm">Дэлгэрэнгүй</Button></Link>
                  <Button variant="outline" size="sm" className="border-destructive text-destructive" onClick={() => handleRemove(item._id)} disabled={removingId === item._id}>🗑</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Cart (`app/[locale]/cart/page.tsx`) — Client

Same logic as CartDrawer but full page. Guest checkout → save `redirectAfterLogin` to sessionStorage + redirect to `/login`.

```typescript
"use client";

import { useAtom } from "jotai";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { cartItemsAtom, cartTotalAtom } from "@/store/cart.store";
import { currentUserAtom } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { formatPrice, isValidUrl } from "@/lib/utils";

export default function CartPage() {
  const [items, setItems] = useAtom(cartItemsAtom);
  const [total] = useAtom(cartTotalAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();

  const removeItem = (productId: string) => setItems((prev) => prev.filter((item) => item.productId !== productId));
  const updateQuantity = (productId: string, count: number) => {
    if (count <= 0) { removeItem(productId); return; }
    setItems((prev) => prev.map((item) => item.productId === productId ? { ...item, count } : item));
  };
  const handleCheckout = () => {
    if (!currentUser) { sessionStorage.setItem("redirectAfterLogin", "/checkout"); router.push("/login"); return; }
    router.push("/checkout");
  };

  if (items.length === 0) return (
    <div className="container py-8">
      <h1>Cart</h1>
      <p>Your cart is empty</p>
      <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
    </div>
  );

  return (
    <div className="container py-8">
      <h1>Cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 rounded-lg border p-4">
              {/* product image with isValidUrl check */}
              <div className="flex-1">
                <p>{item.productName}</p>
                <p>{formatPrice(item.unitPrice)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQuantity(item.productId, item.count - 1)}>-</button>
                  <span>{item.count}</span>
                  <button onClick={() => updateQuantity(item.productId, item.count + 1)}>+</button>
                  <button onClick={() => removeItem(item.productId)} className="ml-auto text-sm text-destructive">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="rounded-lg border p-6">
            <h2>Order Summary</h2>
            <div className="mt-4">
              <div className="flex justify-between">Total<span>{formatPrice(total)}</span></div>
            </div>
            <Button onClick={handleCheckout} className="mt-6 w-full">Checkout</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```
