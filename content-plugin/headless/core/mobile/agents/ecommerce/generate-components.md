# Ecommerce Components (Mobile)

> **Design rule:** All `className` values below are reference only. Replace every one with project design tokens before writing the file.

---

## Design Binding — Read Before Writing ANY Component

**Hard gate:** Do not write any component until all 4 steps below are complete.

### Step 1 — Read `design-tokens.json`

Same token paths as web — extract and hold in context:

| Token path                          | Used for                 |
| ----------------------------------- | ------------------------ |
| `colors.semantic.background`        | screen background        |
| `colors.semantic.card`              | card surface             |
| `colors.semantic.primary`           | brand color, CTA buttons |
| `colors.semantic.primaryForeground` | text on primary buttons  |
| `colors.semantic.foreground`        | body text                |
| `colors.semantic.mutedForeground`   | helper text              |
| `colors.semantic.border`            | dividers, input borders  |
| `colors.semantic.destructive`       | error, delete actions    |
| `typography.families.display`       | headings font            |
| `typography.families.body`          | body font                |
| `radius`                            | border-radius scale      |
| `spacing.scale`                     | spacing rhythm           |

### Step 2 — Read `HANDOFF.md`

Same as web — confirm approved visual direction, motion level.

### Step 3 — Verify `tailwind.config.js`

NativeWind uses `tailwind.config.js` instead of `globals.css`. Verify token values are extended there:

```js
theme: {
  extend: {
    colors: {
      background: "<from token>",
      card: "<from token>",
      primary: { DEFAULT: "<from token>", foreground: "<from token>" },
      foreground: "<from token>",
      "muted-foreground": "<from token>",
      border: "<from token>",
      destructive: "<from token>",
    },
    borderRadius: {
      sm: "<from token>", md: "<from token>", xl: "<from token>",
    },
    fontFamily: {
      display: ["<from token>"],
      body: ["<from token>"],
    },
  },
},
```

### Step 4 — className Mapping

Same token mapping as web — apply via NativeWind `className` on RN components.

### Step 5 — Color Enforcement (architectural, not convention)

The semantic utility class must be the only convenient path to any theme
color, mirroring the web pipeline:

1. **className-reachable styling** → semantic classes ONLY (`bg-primary`,
   `text-accent`, `text-primary-foreground`, `rounded-card`). Arbitrary hex
   classes (`bg-[#D4AF37]`) and inline `style={{ color: "#…" }}` are forbidden.
2. **className-unreachable surfaces** (navigator theme options like
   `tabBarActiveTintColor`, native props like `placeholderTextColor` /
   `tintColor`, Reanimated animated styles) → `import { tokens } from
   "@/lib/tokens"` and pass `tokens.colors.semantic.*`. Never raw hex.
3. `lib/tokens.ts` and `tailwind.config.js` both derive from the same
   `design-tokens.json` (`generate-setup.md` → Token Wiring) — one source,
   zero drift.
4. **Exemption:** product swatch data (`colorOptions[].hex`) is product DATA,
   not theme styling.

---

## Layout Components

### `components/layout/Header.tsx`

```typescript
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartButton } from "./CartButton";
import { WishlistButton } from "./WishlistButton";
import { UserButton } from "./UserButton";
import { i18n } from "@/lib/i18n";

export function Header() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="w-full border-b border-border bg-background"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row h-14 items-center px-4">
        <Pressable
          onPress={() => router.push("/(tabs)")}
          className="flex-1 min-h-[44px] justify-center"
        >
          <Text className="font-bold text-foreground">{i18n.t("nav.brand")}</Text>
        </Pressable>
        <View className="flex-row items-center gap-2">
          <WishlistButton />
          <CartButton />
          <UserButton />
        </View>
      </View>
    </View>
  );
}
```

### `components/ui/CartButton.tsx`

`Sheet` sidebar байхгүй — `Modal` + slide-up bottom sheet ашиглана.

```typescript
import { useState } from "react";
import {
  View, Text, Pressable, Modal, FlatList,
  SafeAreaView, ScrollView,
} from "react-native";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";
import { useAtom } from "jotai";
import { useRouter } from "expo-router";
import { cartItemsAtom, cartCountAtom, cartTotalAtom } from "store/cart.store";
import { currentUserAtom } from "store/auth.store";
import { formatPrice, isValidUrl } from "@/lib/utils";

export function CartButton() {
  const [count] = useAtom(cartCountAtom);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="relative p-2 min-h-[44px] min-w-[44px] items-center justify-center"
        accessibilityLabel="Сагс"
      >
        {/* cart icon — use SVG or icon library */}
        <Text className="text-foreground">🛒</Text>
        {count > 0 && (
          <View className="absolute top-0 right-0 h-4 w-4 items-center justify-center rounded-full bg-primary">
            <Text className="text-[10px] text-primary-foreground font-bold">{count}</Text>
          </View>
        )}
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-lg font-semibold">Сагс</Text>
            <Pressable
              onPress={() => setOpen(false)}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <Text className="text-muted-foreground text-xl">✕</Text>
            </Pressable>
          </View>
          <CartItems onClose={() => setOpen(false)} />
        </SafeAreaView>
      </Modal>
    </>
  );
}

function CartItems({ onClose }: { onClose: () => void }) {
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

  const handleCheckout = async () => {
    onClose();
    if (!currentUser) {
      await SecureStore.setItemAsync("redirectAfterLogin", "/checkout");
      router.push("/(auth)/login");
    } else {
      router.push("/checkout");
    }
  };

  if (cartItems.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-4xl mb-4">🛒</Text>
        <Text className="text-muted-foreground">Сагс хоосон байна</Text>
        <Pressable
          onPress={() => { onClose(); router.push("/(tabs)/products"); }}
          className="mt-4 rounded-xl bg-primary px-6 py-3 min-h-[44px] items-center"
        >
          <Text className="text-primary-foreground font-medium">Бараа үзэх</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.productId}
        contentContainerClassName="p-4 gap-3"
        renderItem={({ item }) => (
          <View className="flex-row gap-3 rounded-xl border border-border bg-card p-3">
            <View className="h-16 w-16 rounded-lg bg-muted items-center justify-center overflow-hidden">
              {item.productImgUrl && isValidUrl(item.productImgUrl) ? (
                <Image
                  source={{ uri: item.productImgUrl }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                />
              ) : <Text className="text-xl">📦</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium" numberOfLines={1}>
                {item.productName || "Бараа"}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {formatPrice(item.unitPrice || 0)}
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Pressable
                  onPress={() => updateQuantity(item.productId, -1)}
                  className="h-7 w-7 items-center justify-center rounded border border-border bg-background"
                >
                  <Text>−</Text>
                </Pressable>
                <Text className="text-sm font-medium w-6 text-center">{item.count}</Text>
                <Pressable
                  onPress={() => updateQuantity(item.productId, 1)}
                  className="h-7 w-7 items-center justify-center rounded border border-border bg-background"
                >
                  <Text>+</Text>
                </Pressable>
                <Pressable
                  onPress={() => removeItem(item.productId)}
                  className="ml-auto min-h-[44px] px-2 justify-center"
                >
                  <Text className="text-xs text-destructive">Устгах</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View className="p-4 border-t border-border gap-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-muted-foreground">Нийт</Text>
          <Text className="text-lg font-bold">{formatPrice(total)}</Text>
        </View>
        <Pressable
          onPress={handleCheckout}
          className="rounded-xl bg-primary py-4 items-center min-h-[44px]"
        >
          <Text className="text-primary-foreground font-semibold">Захиалах</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

### `components/ui/WishlistButton.tsx`

```typescript
import { useAtom } from "jotai";
import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { wishlistCountAtom } from "store/wishlist.store";

export function WishlistButton() {
  const [count] = useAtom(wishlistCountAtom);
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/wishlist")}
      className="relative p-2 min-h-[44px] min-w-[44px] items-center justify-center"
    >
      <Text className="text-foreground">🤍</Text>
      {count > 0 && (
        <View className="absolute top-0 right-0 h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Text className="text-[10px] text-primary-foreground font-bold">{count}</Text>
        </View>
      )}
    </Pressable>
  );
}
```

### `components/layout/UserButton.tsx`

```typescript
import { useAtom } from "jotai";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { currentUserAtom } from "store/auth.store";
import { useCurrentUser, useLogout } from "hooks/auth";

export function UserButton() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const { currentUser: fetchedUser, loading } = useCurrentUser();
  const { logout } = useLogout();
  const router = useRouter();

  useEffect(() => {
    if (fetchedUser) setCurrentUser(fetchedUser);
  }, [fetchedUser, setCurrentUser]);

  if (loading) return <View className="h-9 w-9 rounded-full bg-muted" />;

  if (!currentUser) {
    return (
      <Pressable
        onPress={() => router.push("/(auth)/login")}
        className="min-h-[44px] px-3 justify-center"
      >
        <Text className="text-sm font-medium">Нэвтрэх</Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-1">
      <Pressable
        onPress={() => router.push("/(tabs)/profile")}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
      >
        <Text>👤</Text>
      </Pressable>
      <Pressable
        onPress={logout}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
      >
        <Text className="text-sm text-destructive">Гарах</Text>
      </Pressable>
    </View>
  );
}
```

### `components/layout/Footer.tsx`

```typescript
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { i18n } from "@/lib/i18n";

export function Footer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-border bg-background px-4 py-6"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      {/* 3-column grid: brand, quick links, contact */}
      <Text className="text-xs text-muted-foreground text-center mt-4">
        © {new Date().getFullYear()} — {i18n.t("footer.rights")}
      </Text>
    </View>
  );
}
```

---

## Product Components

### `components/products/ProductCard.tsx`

```typescript
import { useAtom } from "jotai";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMutation } from "@apollo/client/react";
import { cartItemsAtom } from "@/store/cart.store";
import { wishlistItemsAtom } from "@/store/wishlist.store";
import { CP_WISHLIST_ADD } from "@/graphql/ecommerce/mutations/wishlist";
import { currentUserAtom } from "@/store/auth.store";
import { formatPrice, isValidUrl } from "@/lib/utils";
import { Product } from "../types";

interface ProductCardProps { product: Product; }

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [, setCartItems] = useAtom(cartItemsAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [wishlistItems, setWishlistItems] = useAtom(wishlistItemsAtom);
  const [addWishlistMutation] = useMutation(CP_WISHLIST_ADD);

  const addToCart = () => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) return prev.map((item) =>
        item.productId === product._id ? { ...item, count: item.count + 1 } : item
      );
      return [...prev, {
        productId: product._id, count: 1,
        unitPrice: product.unitPrice || 0,
        productName: product.name,
        productImgUrl: product.attachment?.url,
      }];
    });
  };

  const isWishlisted = wishlistItems.some((item) => item.productId === product._id);

  const toggleWishlist = async () => {
    if (isWishlisted) {
      setWishlistItems((prev) => prev.filter((item) => item.productId !== product._id));
      return;
    }
    if (currentUser?._id) {
      await addWishlistMutation({ variables: { productId: product._id, customerId: currentUser._id } });
    }
    setWishlistItems((prev) => {
      if (prev.find((item) => item.productId === product._id)) return prev;
      return [...prev, {
        productId: product._id, productName: product.name,
        unitPrice: product.unitPrice, productImgUrl: product.attachment?.url,
      }];
    });
  };

  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <Pressable onPress={() => router.push(`/(tabs)/products/${product._id}`)}>
        <View className="aspect-square bg-muted items-center justify-center">
          {product.attachment?.url && isValidUrl(product.attachment.url) ? (
            <Image
              source={{ uri: product.attachment.url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : <Text className="text-4xl">📦</Text>}
        </View>
      </Pressable>

      <Pressable
        onPress={toggleWishlist}
        className="absolute top-3 right-3 min-h-[44px] min-w-[44px] items-center justify-center"
        accessibilityLabel={isWishlisted ? "Хүслийн жагсаалтаас хасах" : "Хүслийн жагсаалтад нэмэх"}
      >
        <Text className={isWishlisted ? "text-red-500 text-xl" : "text-gray-300 text-xl"}>
          {isWishlisted ? "❤️" : "🤍"}
        </Text>
      </Pressable>

      <View className="p-3">
        <Pressable onPress={() => router.push(`/(tabs)/products/${product._id}`)}>
          <Text className="font-medium" numberOfLines={2}>{product.name || "Бараа"}</Text>
        </Pressable>
        <Text className="mt-1 text-lg font-bold text-primary">
          {formatPrice(product.unitPrice || 0)}
        </Text>
        <Pressable
          onPress={addToCart}
          className="mt-3 rounded-xl bg-primary py-3 items-center min-h-[44px]"
        >
          <Text className="text-primary-foreground font-semibold text-sm">Сагсанд нэмэх</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

---

### `components/products/ProductFilterBar.tsx`

```typescript
import { ScrollView, Pressable, Text } from "react-native";
import { useProductCategories } from "../hooks/useProductFilters";

export function ProductFilterBar() {
  const { categories, categoriesLoading, activeCategoryId, setActiveCategoryId } =
    useProductCategories();

  if (categoriesLoading && categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 py-2"
      contentContainerStyle={{ gap: 8 }}
    >
      <Pressable
        onPress={() => setActiveCategoryId(undefined)}
        className={`px-4 py-2 rounded-full min-h-[44px] justify-center ${
          activeCategoryId === undefined ? "bg-primary" : "bg-muted"
        }`}
      >
        <Text
          className={
            activeCategoryId === undefined
              ? "text-primary-foreground font-semibold"
              : "text-foreground"
          }
        >
          Бүгд
        </Text>
      </Pressable>

      {categories.map((cat) => (
        <Pressable
          key={cat._id}
          onPress={() => setActiveCategoryId(cat._id)}
          className={`px-4 py-2 rounded-full min-h-[44px] justify-center ${
            activeCategoryId === cat._id ? "bg-primary" : "bg-muted"
          }`}
        >
          <Text
            className={
              activeCategoryId === cat._id
                ? "text-primary-foreground font-semibold"
                : "text-foreground"
            }
          >
            {cat.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

---

### `components/products/ProductList.tsx`

```typescript
import { FlatList, ActivityIndicator, View } from "react-native";
import { useProducts } from "../hooks/useProducts";
import { ProductCard } from "./ProductCard";

export function ProductList() {
  const { products, loading, activeCategoryId } = useProducts();

  if (loading && products.length === 0) {
    return (
      <View className="py-10 items-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      key={activeCategoryId ?? "all"}
      keyExtractor={(item) => item._id}
      numColumns={2}
      contentContainerStyle={{ gap: 12, padding: 12 }}
      columnWrapperStyle={{ gap: 12 }}
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  );
}
```

---

> **Ашиглалт:**
>
> ```tsx
> import { ProductFilterBar } from "@/components/products/ProductFilterBar";
> import { ProductList } from "@/components/products/ProductList";
>
> <ProductFilterBar />
> <ProductList />
> ```
>
> `activeCategoryIdAtom` хоёр component-д хуваалцагдана (`useProductFilters` дотор colocate).
> Query/hook хэсгийн spec — `generate-graphql.md`, `generate-hooks.md`.

---

### `components/payment/PaymentType.tsx`

```typescript
import { useAtom } from "jotai";
import { View, Text, Pressable } from "react-native";
import { selectedPaymentAtom } from "store/payment.store";
import { IPayment } from "types/payment.types";

interface PaymentTypeProps { payments: IPayment[]; }

export function PaymentType({ payments }: PaymentTypeProps) {
  const [selected, setSelected] = useAtom(selectedPaymentAtom);

  return (
    <View className="gap-3">
      <Text className="font-medium">Төлбөрийн хэлбэр сонгох</Text>
      <View className="gap-3">
        {payments.map((payment) => (
          <Pressable
            key={payment._id}
            onPress={() => setSelected(payment)}
            className={`flex-row items-center gap-3 rounded-xl border p-4 min-h-[44px] ${
              selected?._id === payment._id
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            {/* radio circle */}
            <View className={`h-4 w-4 rounded-full border-2 items-center justify-center ${
              selected?._id === payment._id ? "border-primary" : "border-border"
            }`}>
              {selected?._id === payment._id && (
                <View className="h-2 w-2 rounded-full bg-primary" />
              )}
            </View>
            <View>
              <Text className="font-medium">{payment.name}</Text>
              <Text className="text-sm text-muted-foreground">{payment.kind}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

---

## UI Primitives

Web-ийн HTML-based `shadcn` components байхгүй — RN primitives ашиглана.
`button.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `form.tsx`, `sheet.tsx` файлуудыг үүсгэхгүй.

Оронд нь эдгээрийг шууд ашиглана:

| Web component     | Mobile equivalent                                             |
| ----------------- | ------------------------------------------------------------- |
| `<Button>`        | `<Pressable>` + `<Text>` with NativeWind className            |
| `<Input>`         | `<TextInput>` with NativeWind className                       |
| `<Label>`         | `<Text className="text-sm font-medium">`                      |
| `<Textarea>`      | `<TextInput multiline numberOfLines={3}>`                     |
| `<Form>`          | `<View>` wrapper                                              |
| `<Sheet>` (Radix) | `<Modal animationType="slide" presentationStyle="pageSheet">` |

Хэрэв reusable primitive хэрэгтэй бол `components/ui/` доор энгийн RN wrapper бичнэ:

```typescript
// components/ui/Button.tsx
import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

interface ButtonProps extends PressableProps {
  variant?: "default" | "outline" | "destructive" | "ghost";
  children: React.ReactNode;
  className?: string;
}

export function Button({ variant = "default", children, className, ...props }: ButtonProps) {
  const base = "rounded-xl items-center justify-center min-h-[44px] px-4";
  const variants = {
    default: "bg-primary",
    outline: "border border-border",
    destructive: "bg-destructive",
    ghost: "",
  };
  const textVariants = {
    default: "text-primary-foreground font-semibold",
    outline: "text-foreground font-medium",
    destructive: "text-white font-semibold",
    ghost: "text-foreground",
  };
  return (
    <Pressable className={cn(base, variants[variant], className)} {...props}>
      <Text className={textVariants[variant]}>{children}</Text>
    </Pressable>
  );
}
```
