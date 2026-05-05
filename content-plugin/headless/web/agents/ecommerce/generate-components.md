# Ecommerce Components

> **Design rule:** All `className` values below are mak-ecommerce reference only. Replace every one with project design tokens before writing the file.

---

## Layout Components

### `components/layout/Header.tsx` (Server)

```typescript
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CartButton } from "./CartButton";
import { WishlistButton } from "./WishlistButton";
import { UserButton } from "./UserButton";

export default async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">{t("brand")}</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">{t("home")}</Link>
            <Link href="/products" className="text-foreground hover:text-primary transition-colors">{t("products")}</Link>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors">{t("about")}</Link>
            <Link href="/blog" className="text-foreground hover:text-primary transition-colors">{t("blog")}</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <WishlistButton />
          <CartButton />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
```

### `components/layout/CartButton.tsx` (Client)

```typescript
"use client";

import { useAtom } from "jotai";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { cartItemsAtom, cartCountAtom, cartTotalAtom } from "@/store/cart.store";
import { currentUserAtom } from "@/store/auth.store";
import { formatPrice, isValidUrl } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function CartButton() {
  const [count] = useAtom(cartCountAtom);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="relative p-2 text-white hover:text-primary transition-colors"
          aria-label="Сагс"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Сагс</SheetTitle>
        </SheetHeader>
        <CartItems />
      </SheetContent>
    </Sheet>
  );
}

function CartItems() {
  const [cartItems, setCartItems] = useAtom(cartItemsAtom);
  const [total] = useAtom(cartTotalAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const router = useRouter();

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, count: Math.max(0, item.count + delta) }
            : item
        )
        .filter((item) => item.count > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleCheckout = () => {
    if (!currentUser) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      router.push("/login");
    } else {
      router.push("/checkout");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground mb-4"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        <p className="text-muted-foreground">Сагс хоосон байна</p>
        <SheetClose asChild>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Бараа үзэх
          </Link>
        </SheetClose>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-4">
        {cartItems.map((item) => (
          <div
            key={item.productId}
            className="flex gap-3 rounded-xl border border-border bg-secondary p-3"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
              {item.productImgUrl && isValidUrl(item.productImgUrl) ? (
                <Image
                  src={item.productImgUrl}
                  alt={item.productName || ""}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl">📦</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.productName || "Бараа"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.unitPrice || 0)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-foreground hover:bg-secondary"
                >
                  −
                </button>
                <span className="text-sm font-medium text-foreground w-6 text-center">
                  {item.count}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded border border-border bg-card text-foreground hover:bg-secondary"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="ml-auto text-xs text-destructive hover:underline"
                >
                  Устгах
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Нийт</span>
          <span className="text-lg font-bold text-foreground">
            {formatPrice(total)}
          </span>
        </div>
        <SheetClose asChild>
          <button
            onClick={handleCheckout}
            className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Захиалах
          </button>
        </SheetClose>
      </div>
    </div>
  );
}
```

### `components/layout/WishlistButton.tsx` (Client)

```typescript
"use client";

import { useAtom } from "jotai";
import { Link } from "@/i18n/routing";
import { wishlistCountAtom } from "@/store/wishlist.store";

export function WishlistButton() {
  const [count] = useAtom(wishlistCountAtom);

  return (
    <Link href="/wishlist" className="relative ...">
      {/* heart icon SVG */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 ...">
          {count}
        </span>
      )}
    </Link>
  );
}
```

### `components/layout/UserButton.tsx` (Client)

```typescript
"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { currentUserAtom } from "@/store/auth.store";
import { useCurrentUser, useLogout } from "@/hooks/auth";

export function UserButton() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const { currentUser: fetchedUser, loading } = useCurrentUser();
  const { logout } = useLogout();

  useEffect(() => {
    if (fetchedUser) setCurrentUser(fetchedUser);
  }, [fetchedUser, setCurrentUser]);

  if (loading) return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />;

  if (!currentUser) {
    return <Link href="/login" className="...">Login</Link>;
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className="...">
        {/* user icon SVG */}
      </Link>
      <button onClick={logout} className="...">
        {/* logout icon SVG */}
      </button>
    </div>
  );
}
```

### `components/layout/Footer.tsx` (Server)

```typescript
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function Footer() {
  const t = await getTranslations("nav");

  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        {/* 3-column grid: brand, quick links, contact */}
        {/* links: home, products, about */}
        {/* copyright */}
      </div>
    </footer>
  );
}
```

---

## Product Components

### `components/product/ProductCard.tsx` (Client)

Key behavior: add to cart (upserts count), toggle wishlist (calls `CP_WISHLIST_ADD` if logged in + updates atom).

```typescript
"use client";

import { useAtom } from "jotai";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useMutation } from "@apollo/client/react";
import { cartItemsAtom } from "@/store/cart.store";
import { currentUserAtom } from "@/store/auth.store";
import { wishlistItemsAtom } from "@/store/wishlist.store";
import { formatPrice, isValidUrl } from "@/lib/utils";
import { Product } from "@/graphql/ecommerce/queries/product";
import { CP_WISHLIST_ADD } from "@/graphql/ecommerce/mutations/wishlist";

interface ProductCardProps { product: Product; }

export function ProductCard({ product }: ProductCardProps) {
  const [, setCartItems] = useAtom(cartItemsAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [wishlistItems, setWishlistItems] = useAtom(wishlistItemsAtom);
  const [addWishlistMutation] = useMutation(CP_WISHLIST_ADD);

  const addToCart = () => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) return prev.map((item) => item.productId === product._id ? { ...item, count: item.count + 1 } : item);
      return [...prev, { productId: product._id, count: 1, unitPrice: product.unitPrice || 0, productName: product.name, productImgUrl: product.attachment?.url }];
    });
  };

  const isWishlisted = wishlistItems.some((item) => item.productId === product._id);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isWishlisted) { setWishlistItems((prev) => prev.filter((item) => item.productId !== product._id)); return; }
    if (currentUser?._id) await addWishlistMutation({ variables: { productId: product._id, customerId: currentUser._id } });
    setWishlistItems((prev) => {
      if (prev.find((item) => item.productId === product._id)) return prev;
      return [...prev, { productId: product._id, productName: product.name, unitPrice: product.unitPrice, productImgUrl: product.attachment?.url }];
    });
  };

  return (
    <div className="group rounded-xl border ...">
      <div className="relative">
        <Link href={`/products/${product._id}`} className="block">
          <div className="aspect-square bg-muted ...">
            {product.attachment?.url && isValidUrl(product.attachment.url) ? (
              <Image src={product.attachment.url} alt={product.name || ""} width={400} height={400} className="h-full w-full object-cover ..." />
            ) : <span className="text-4xl">📦</span>}
          </div>
        </Link>
        <button onClick={toggleWishlist} className="absolute top-3 right-3 ..." aria-label={isWishlisted ? "Remove" : "Save"}>
          {/* heart SVG — fill={isWishlisted ? "currentColor" : "none"} */}
        </button>
      </div>
      <div className="p-4">
        <Link href={`/products/${product._id}`}><h3 className="...">{product.name || "Бараа"}</h3></Link>
        <p className="mt-1 text-lg font-bold text-primary">{formatPrice(product.unitPrice || 0)}</p>
        <button onClick={addToCart} className="mt-3 w-full ...">Сагсанд нэмэх</button>
      </div>
    </div>
  );
}
```

### `components/payment/PaymentType.tsx`

```typescript
"use client";

import { useAtom } from "jotai";
import { selectedPaymentAtom } from "@/store/payment.store";
import { IPayment } from "@/types/payment.types";

interface PaymentTypeProps { payments: IPayment[]; }

export function PaymentType({ payments }: PaymentTypeProps) {
  const [selected, setSelected] = useAtom(selectedPaymentAtom);

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Төлбөрийн хэлбэр сонгох</h3>
      <div className="grid gap-3">
        {payments.map((payment) => (
          <button
            key={payment._id}
            onClick={() => setSelected(payment)}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${selected?._id === payment._id ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
          >
            {/* radio circle */}
            <div>
              <p className="font-medium">{payment.name}</p>
              <p className="text-sm text-muted-foreground">{payment.kind}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## UI Components (Hand-rolled, no shadcn init)

### `components/ui/button.tsx`

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### `components/ui/input.tsx`

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

### `components/ui/label.tsx`

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
```

### `components/ui/textarea.tsx`

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
```

### `components/ui/form.tsx`

```typescript
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

const Form = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
  ({ className, ...props }, ref) => <form ref={ref} className={cn("space-y-6", className)} {...props} />
);
Form.displayName = "Form";

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> { label?: string; error?: string; }

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, label, error, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
);
FormItem.displayName = "FormItem";

export { Form, FormItem };
```

### `components/ui/sheet.tsx`

```typescript
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-card p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md",
      },
    },
    defaultVariants: { side: "right" },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose,
  SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
};
```
