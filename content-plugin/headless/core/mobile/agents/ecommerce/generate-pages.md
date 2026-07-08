# Ecommerce Pages — Mobile (Expo / React Native)

> **Design rule:** Page logic (data fetching, state, mutations, routing) is authoritative. All `className` values are NativeWind reference only — apply your design tokens. For checkout and confirmation pages, see `generate-checkout.md`.

---

## Design Binding — Read Before Writing ANY Screen

**Hard gate:** Do not write any screen until the steps in `generate-components.md` Design Binding section are complete (design-tokens.json read, HANDOFF.md read, global styles verified).

### Screen-level design rules

- Every screen layout must use the spacing rhythm from `design-tokens.json` → `spacing.layout`
- Section backgrounds must alternate using `colors.semantic.background` and `colors.semantic.card` per the HANDOFF.md section plan
- Screen headings must use `typography.families.display` font
- Body text must use `typography.families.body` font
- All interactive states (pressed, focused) must use the token-mapped colors — do not hardcode hex values
- If `motion.motionLevel` > 0 in `design-tokens.json`, apply entrance animations from `motion.variants` using `react-native-reanimated`

### Web → Mobile conversion rules

| Web (Next.js)                       | Mobile (Expo)                                                         |
| ----------------------------------- | --------------------------------------------------------------------- |
| `div`, `section`, `main`            | `View`                                                                |
| `p`, `span`, `h1`–`h6`              | `Text`                                                                |
| `img` / `next/image`                | `Image` from `react-native`                                           |
| `button`                            | `TouchableOpacity` or `Pressable`                                     |
| `input`, `textarea`                 | `TextInput`                                                           |
| `form` + `onSubmit`                 | `View` + `TouchableOpacity` button                                    |
| `Link href="/path"`                 | `router.push('/path')` via `expo-router`                              |
| `useRouter` from next               | `useRouter` from `expo-router`                                        |
| `usePathname` from next             | `usePathname` from `expo-router`                                      |
| `className="..."`                   | `className="..."` via NativeWind or `style={styles.x}` via StyleSheet |
| `dangerouslySetInnerHTML`           | `react-native-render-html`                                            |
| `sessionStorage`                    | `AsyncStorage` from `@react-native-async-storage/async-storage`       |
| `confirm(...)`                      | `Alert.alert(...)` from `react-native`                                |
| Page-level `async` server component | `useEffect` + `useQuery` hook                                         |
| `getTranslations()` server          | `useTranslation()` from `react-i18next`                               |

### Per-screen design source

Before writing each screen, check `HANDOFF.md` section **1. Frontend Build Map** for that screen's layout notes. If HANDOFF.md has specific guidance for a screen (e.g. hero layout, product grid columns, checkout panel split), follow it exactly.

| Screen           | Check HANDOFF.md for                                    |
| ---------------- | ------------------------------------------------------- |
| Home             | hero layout, section order, featured grid columns       |
| Products         | filter bar position, grid columns, card style           |
| Product Detail   | image gallery layout, info panel layout, review section |
| Cart             | line item layout, summary panel position                |
| Checkout         | form fields order, delivery fields, payment selector    |
| Login / Register | form card width, layout                                 |
| Profile          | tab nav style, content layout                           |
| Orders           | list item style, status badge colors                    |
| Wishlist         | grid columns, card remove action placement              |

---

## Home Screen (`app/index.tsx`)

Fetches `poscProducts` on mount via `useProducts()`. Renders hero section + featured products horizontal scroll + full product grid + "View All" link.

```typescript
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts, setProductsCache } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isMn = i18n.language === 'mn';
  const { products, loading } = useProducts();

  useEffect(() => {
    if (products.length > 0) setProductsCache(products);
  }, [products]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={tokens.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-bold text-foreground mb-1">{t('metadata.title')}</Text>
        <Text className="text-muted text-base">{t('metadata.description')}</Text>
      </View>

      {/* Featured — horizontal scroll */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center px-5 mb-3">
          <Text className="text-foreground text-base font-semibold">{t('home.featured')}</Text>
          <TouchableOpacity onPress={() => router.push('/products')}>
            <Text className="text-primary text-sm">{isMn ? 'Бүгд' : 'See All'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {products.slice(0, 8).map((product) => (
            <View key={product._id} className="w-44 mr-3">
              <ProductCard product={product} onPress={() => router.push(`/product/${product._id}`)} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* All products grid */}
      <View className="px-5 mb-8">
        <Text className="text-foreground text-base font-semibold mb-3">
          {isMn ? 'Бүх бараа' : 'All Products'}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {products.map((product) => (
            <View key={product._id} className="w-[48%]">
              <ProductCard product={product} onPress={() => router.push(`/product/${product._id}`)} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
```

---

## Products List Screen (`app/products.tsx`)

State: `searchValue`, `selectedCategory`, `page`. Uses `useProducts` + `useProductCategories` hooks. Renders search bar + category filter chips + product grid + pagination.

```typescript
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProducts, useProductCategories } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default function ProductsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { products, loading } = useProducts({ categoryId: selectedCategory, page, perPage: 20, searchValue: searchValue || undefined });
  const { categories } = useProductCategories();

  return (
    <View className="flex-1 bg-background">
      {/* Search bar */}
      <View className="px-4 pt-4 pb-2">
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
          placeholder={t('common.search')}
          placeholderTextColor={tokens.colors.muted}
          value={searchValue}
          onChangeText={setSearchValue}
        />
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3">
        <TouchableOpacity
          className={`mr-2 px-4 py-2 rounded-full border ${!selectedCategory ? 'bg-primary border-primary' : 'border-border'}`}
          onPress={() => setSelectedCategory(undefined)}
        >
          <Text className={!selectedCategory ? 'text-primary-foreground' : 'text-muted'}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            className={`mr-2 px-4 py-2 rounded-full border ${selectedCategory === cat._id ? 'bg-primary border-primary' : 'border-border'}`}
            onPress={() => setSelectedCategory(cat._id)}
          >
            <Text className={selectedCategory === cat._id ? 'text-primary-foreground' : 'text-muted'}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product grid */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View className="flex-1">
              <ProductCard product={item} onPress={() => router.push(`/product/${item._id}`)} />
            </View>
          )}
          ListFooterComponent={() => (
            <View className="flex-row justify-center gap-3 mt-4 pb-8">
              <TouchableOpacity
                className="px-6 py-2 border border-border rounded-xl"
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <Text className="text-foreground">{t('common.prev')}</Text>
              </TouchableOpacity>
              <View className="px-4 py-2">
                <Text className="text-muted">{page}</Text>
              </View>
              <TouchableOpacity
                className="px-6 py-2 border border-border rounded-xl"
                onPress={() => setPage((p) => p + 1)}
                disabled={products.length < 20}
              >
                <Text className="text-foreground">{t('common.next')}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
```

---

## Product Detail Screen (`app/product/[id].tsx`)

Complex screen: product image + add-to-cart + wishlist toggle + review CRUD. Uses `useLocalSearchParams` for route params.

Key patterns:

- `useLocalSearchParams` replaces `params: Promise<{ id }>` — no async unwrap needed
- `addToCart`: upserts count in cart store
- `addToWishlist`: calls `CP_WISHLIST_ADD` if logged in
- Reviews: `CP_PRODUCT_REVIEWS` query + add/update/remove mutations
- `Alert.alert` replaces `confirm()`
- `react-native-render-html` renders HTML description

```typescript
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useProductDetail } from '@/lib/products';
import { formatPriceMnt, formatPriceUsd } from '@/lib/utils';
import { CP_WISHLIST_ADD } from '@/graphql/mutations/wishlist';
import { CP_PRODUCT_REVIEW_ADD, PRODUCT_REVIEW_UPDATE, PRODUCT_REVIEW_REMOVE } from '@/graphql/mutations/productReview';
import { CP_PRODUCT_REVIEWS } from '@/graphql/queries/productReview';
import StarRating from '@/components/StarRating';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const { product, loading } = useProductDetail(id);
  const { addItem } = useCartStore();
  const { currentUser } = useAuthStore();

  const [addWishlistMutation] = useMutation(CP_WISHLIST_ADD);
  const [addReview] = useMutation(CP_PRODUCT_REVIEW_ADD);
  const [updateReview] = useMutation(PRODUCT_REVIEW_UPDATE);
  const [removeReview] = useMutation(PRODUCT_REVIEW_REMOVE);

  const { data: reviewsData, refetch: refetchReviews } = useQuery(CP_PRODUCT_REVIEWS, {
    variables: { productIds: id ? [id] : [], page: 1, perPage: 50 },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const reviews = reviewsData?.cpProductReviews || [];
  const myReview = currentUser ? reviews.find((r: any) => r.customerId === currentUser._id) : null;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + (r.review || 0), 0) / reviews.length
    : 0;

  useEffect(() => {
    if (myReview) {
      setReviewRating(myReview.review || 0);
      setReviewText(myReview.description || '');
      setEditingReviewId(myReview._id);
    } else {
      setReviewRating(0);
      setReviewText('');
      setEditingReviewId(null);
    }
  }, [myReview]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product._id,
      count: quantity,
      unitPrice: product.unitPrice || 0,
      productName: product.name,
      productImgUrl: product.attachment?.url,
    });
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    if (currentUser?._id) {
      await addWishlistMutation({ variables: { productId: product._id, customerId: currentUser._id } });
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !id || reviewRating === 0) return;
    if (editingReviewId) {
      await updateReview({ variables: { _id: editingReviewId, productId: id, customerId: currentUser._id, review: reviewRating, description: reviewText } });
    } else {
      await addReview({ variables: { productId: id, customerId: currentUser._id, review: reviewRating, description: reviewText } });
    }
    await refetchReviews();
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      t('review.deleteTitle'),
      t('review.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await removeReview({ variables: { _id: reviewId } });
            await refetchReviews();
            setReviewRating(0);
            setReviewText('');
            setEditingReviewId(null);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={tokens.colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-lg mb-4">{t('product.notFound')}</Text>
        <TouchableOpacity className="bg-primary rounded-xl px-6 py-3" onPress={() => router.back()}>
          <Text className="text-primary-foreground font-semibold">{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Product image */}
      {product.attachment?.url ? (
        <Image
          source={{ uri: product.attachment.url }}
          className="w-full aspect-square"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full aspect-square bg-surface items-center justify-center">
          <Text className="text-6xl">👟</Text>
        </View>
      )}

      {/* Product info */}
      <View className="px-5 pt-5 pb-4">
        <Text className="text-2xl font-bold text-foreground mb-2">{product.name}</Text>

        {/* Price + rating */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-primary">{formatPriceMnt(product.unitPrice || 0)}</Text>
            <Text className="text-muted text-sm">{formatPriceUsd(product.unitPrice || 0)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <StarRating rating={Math.round(avgRating)} size={16} />
            <Text className="text-muted text-sm">({reviews.length})</Text>
          </View>
        </View>

        {/* Quantity stepper */}
        <View className="flex-row items-center gap-4 mb-5">
          <TouchableOpacity
            className="w-10 h-10 bg-surface border border-border rounded-full items-center justify-center"
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text className="text-foreground text-lg">−</Text>
          </TouchableOpacity>
          <Text className="text-foreground text-lg font-semibold w-8 text-center">{quantity}</Text>
          <TouchableOpacity
            className="w-10 h-10 bg-surface border border-border rounded-full items-center justify-center"
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Text className="text-foreground text-lg">+</Text>
          </TouchableOpacity>
        </View>

        {/* CTA buttons */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-3"
          onPress={handleAddToCart}
        >
          <Text className="text-primary-foreground font-bold text-base">
            {t('product.addToCart')} ({quantity})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-primary rounded-xl py-4 items-center"
          onPress={handleAddToWishlist}
        >
          <Text className="text-primary font-semibold text-base">{t('product.save')}</Text>
        </TouchableOpacity>

        {/* Description */}
        {product.description ? (
          <View className="mt-5 pt-5 border-t border-border">
            <Text className="text-foreground text-sm leading-6">{product.description}</Text>
          </View>
        ) : null}
      </View>

      {/* Reviews */}
      <View className="px-5 pt-4 pb-10 border-t border-border">
        <Text className="text-foreground text-lg font-bold mb-4">
          {t('review.title')} ({reviews.length})
        </Text>

        {currentUser ? (
          <View className="bg-surface rounded-xl p-4 mb-5 border border-border">
            <StarRating rating={reviewRating} onRate={setReviewRating} interactive size={28} />
            <TextInput
              className="mt-3 border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder={t('review.placeholder')}
              placeholderTextColor={tokens.colors.muted}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center ${reviewRating === 0 ? 'bg-surface border border-border' : 'bg-primary'}`}
                onPress={handleSubmitReview}
                disabled={reviewRating === 0}
              >
                <Text className={reviewRating === 0 ? 'text-muted' : 'text-primary-foreground font-semibold'}>
                  {editingReviewId ? t('review.update') : t('review.submit')}
                </Text>
              </TouchableOpacity>
              {editingReviewId && (
                <TouchableOpacity
                  className="px-5 py-3 border border-border rounded-xl items-center"
                  onPress={() => { setReviewRating(0); setReviewText(''); setEditingReviewId(null); }}
                >
                  <Text className="text-muted">{t('common.cancel')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push('/login')} className="mb-4">
            <Text className="text-primary text-sm">{t('review.loginPrompt')}</Text>
          </TouchableOpacity>
        )}

        {reviews.map((review: any) => (
          <View key={review._id} className="py-3 border-b border-border">
            <View className="flex-row items-center justify-between mb-1">
              <StarRating rating={review.review || 0} size={14} />
              {review.customerId === currentUser?._id && (
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => {
                    setReviewRating(review.review || 0);
                    setReviewText(review.description || '');
                    setEditingReviewId(review._id);
                  }}>
                    <Text className="text-primary text-xs">{t('common.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteReview(review._id)}>
                    <Text className="text-danger text-xs">{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {review.description && (
              <Text className="text-muted text-sm mt-1">{review.description}</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
```

---

## Login Screen (`app/login.tsx`)

```typescript
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLogin } from '@/hooks/auth';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, loading } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError(t('auth.fillAll')); return; }
    setError('');
    const result = await login({ email, password });
    if (!result.success) {
      setError(t('auth.invalidCredentials'));
    } else {
      router.replace('/profile');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-foreground mb-8">{t('auth.loginTitle')}</Text>

        <View className="gap-4">
          <View>
            <Text className="text-muted text-sm mb-1">{t('auth.email')}</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="email@example.com"
              placeholderTextColor={tokens.colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-muted text-sm mb-1">{t('auth.password')}</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="••••••••"
              placeholderTextColor={tokens.colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text className="text-danger text-sm">{error}</Text> : null}

          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center mt-2"
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={tokens.colors.primaryForeground} />
              : <Text className="text-primary-foreground font-bold text-base">{t('auth.loginTitle')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text className="text-primary text-sm text-center">{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center gap-1">
            <Text className="text-muted text-sm">{t('auth.noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text className="text-primary text-sm font-semibold">{t('auth.registerTitle')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

---

## Profile Screen (`app/profile.tsx`)

Auth guard: redirect to `/login` if not logged in. Tab nav with Profile / Orders / Wishlist.

```typescript
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { useCurrentUser, useLogout } from '@/hooks/auth';

const navItems = [
  { labelKey: 'profile.title', route: '/profile' },
  { labelKey: 'orders.title', route: '/orders' },
  { labelKey: 'wishlist.title', route: '/wishlist' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, setCurrentUser } = useAuthStore();
  const { currentUser: fetchedUser, loading } = useCurrentUser();
  const { logout } = useLogout();

  useEffect(() => { if (fetchedUser) setCurrentUser(fetchedUser); }, [fetchedUser]);
  useEffect(() => { if (!loading && !currentUser) router.replace('/login'); }, [loading, currentUser]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={tokens.colors.primary} />
      </View>
    );
  }
  if (!currentUser) return null;

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Tab nav */}
      <View className="flex-row border-b border-border px-4 pt-4">
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            className={`mr-4 pb-3 ${pathname === item.route ? 'border-b-2 border-primary' : ''}`}
            onPress={() => router.push(item.route as any)}
          >
            <Text className={pathname === item.route ? 'text-primary font-semibold' : 'text-muted'}>
              {t(item.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User info */}
      <View className="px-5 py-6 gap-4">
        <View className="bg-surface rounded-xl border border-border p-5 gap-3">
          <View>
            <Text className="text-muted text-xs mb-1">{t('auth.email')}</Text>
            <Text className="text-foreground font-medium">{currentUser.email}</Text>
          </View>
          {currentUser.firstName && (
            <View>
              <Text className="text-muted text-xs mb-1">{t('profile.name')}</Text>
              <Text className="text-foreground font-medium">{currentUser.firstName} {currentUser.lastName}</Text>
            </View>
          )}
          {currentUser.phone && (
            <View>
              <Text className="text-muted text-xs mb-1">{t('profile.phone')}</Text>
              <Text className="text-foreground font-medium">{currentUser.phone}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          className="border border-danger rounded-xl py-4 items-center"
          onPress={logout}
        >
          <Text className="text-danger font-semibold">{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

---

## Orders Screen (`app/orders.tsx`)

Auth guard. Uses `useOrders(currentUser?._id)`. Shows order list with status badge + total + date. Navigates to `/orders/[id]`.

```typescript
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { useOrders } from '@/hooks/order';
import { formatPriceMnt } from '@/lib/utils';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const { orders, loading } = useOrders(currentUser?._id);

  useEffect(() => { if (!currentUser) router.replace('/login'); }, [currentUser]);
  if (!currentUser) return null;

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={tokens.colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={orders}
        keyExtractor={(item: any) => item._id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={() => (
          <Text className="text-foreground text-xl font-bold mb-2">{t('orders.title')}</Text>
        )}
        ListEmptyComponent={() => (
          <View className="items-center py-20">
            <Text className="text-muted">{t('orders.empty')}</Text>
          </View>
        )}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            className="bg-surface border border-border rounded-xl p-4"
            onPress={() => router.push(`/orders/${item._id}`)}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground font-semibold">
                  #{item._id.slice(-6).toUpperCase()}
                </Text>
                <Text className="text-muted text-xs mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-primary font-bold">{formatPriceMnt(item.totalAmount)}</Text>
                <View className="mt-1 px-2 py-0.5 bg-primary/10 rounded-full">
                  <Text className="text-primary text-xs capitalize">{item.status}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

---

## Wishlist Screen (`app/wishlist.tsx`)

Login prompt if guest. Fetches `CP_WISHLIST` by `customerId`. Remove with `CP_WISHLIST_REMOVE` + refetch.

```typescript
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { CP_WISHLIST } from '@/graphql/queries/wishlist';
import { CP_WISHLIST_REMOVE } from '@/graphql/mutations/wishlist';
import { formatPriceMnt } from '@/lib/utils';

export default function WishlistScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [removingId, setRemovingId] = useState('');

  const { data, loading, refetch } = useQuery(CP_WISHLIST, {
    variables: { customerId: currentUser?._id || '' },
    skip: !currentUser?._id,
    fetchPolicy: 'network-only',
  });
  const [removeMutation] = useMutation(CP_WISHLIST_REMOVE);
  const wishlist = (data as any)?.cpWishlist || [];

  const handleRemove = async (_id: string) => {
    setRemovingId(_id);
    try { await removeMutation({ variables: { _id } }); refetch(); }
    finally { setRemovingId(''); }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-xl font-bold mb-2">{t('wishlist.title')}</Text>
        <Text className="text-muted mb-6">{t('wishlist.loginPrompt')}</Text>
        <TouchableOpacity className="bg-primary rounded-xl px-8 py-3" onPress={() => router.push('/login')}>
          <Text className="text-primary-foreground font-bold">{t('auth.loginTitle')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={tokens.colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={wishlist}
        numColumns={2}
        keyExtractor={(item: any) => item._id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        ListHeaderComponent={() => (
          <Text className="text-foreground text-xl font-bold mb-2">
            {t('wishlist.title')} ({wishlist.length})
          </Text>
        )}
        ListEmptyComponent={() => (
          <View className="items-center py-20 gap-4">
            <Text className="text-muted">{t('wishlist.empty')}</Text>
            <TouchableOpacity className="border border-primary rounded-xl px-6 py-3" onPress={() => router.push('/products')}>
              <Text className="text-primary">{t('common.browseProducts')}</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }: { item: any }) => (
          <View className="flex-1 bg-surface border border-border rounded-xl overflow-hidden">
            <TouchableOpacity onPress={() => router.push(`/product/${item.productId}`)}>
              {item.product?.attachment?.url ? (
                <Image
                  source={{ uri: item.product.attachment.url }}
                  className="w-full aspect-square"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full aspect-square bg-background items-center justify-center">
                  <Text className="text-4xl">👟</Text>
                </View>
              )}
            </TouchableOpacity>
            <View className="p-3 gap-2">
              <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                {item.product?.name || t('product.unnamed')}
              </Text>
              <Text className="text-primary font-bold text-sm">
                {formatPriceMnt(item.product?.unitPrice || 0)}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 border border-border rounded-lg py-2 items-center"
                  onPress={() => router.push(`/product/${item.productId}`)}
                >
                  <Text className="text-foreground text-xs">{t('common.detail')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-9 h-9 border border-danger rounded-lg items-center justify-center"
                  onPress={() => handleRemove(item._id)}
                  disabled={removingId === item._id}
                >
                  <Text className="text-danger text-sm">🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}
```

---

## Cart Screen (`app/cart.tsx`)

Guest checkout supported — no login required for cart. Uses cart store directly.

```typescript
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCartStore, cartTotal } from '@/stores/cart';
import { formatPriceMnt } from '@/lib/utils';

export default function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, removeItem, updateCount } = useCartStore();
  const total = cartTotal(items);

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-4xl mb-4">🛒</Text>
        <Text className="text-foreground text-xl font-bold mb-2">{t('cart.empty')}</Text>
        <TouchableOpacity className="bg-primary rounded-xl px-8 py-3 mt-4" onPress={() => router.push('/products')}>
          <Text className="text-primary-foreground font-bold">{t('cart.continueShopping')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-foreground text-xl font-bold mb-4">{t('cart.title')}</Text>

        {items.map((item) => (
          <View key={item.productId} className="flex-row bg-surface border border-border rounded-xl p-3 mb-3 gap-3">
            {item.productImgUrl ? (
              <Image source={{ uri: item.productImgUrl }} className="w-20 h-20 rounded-lg" resizeMode="cover" />
            ) : (
              <View className="w-20 h-20 bg-background rounded-lg items-center justify-center">
                <Text className="text-3xl">👟</Text>
              </View>
            )}
            <View className="flex-1 justify-between">
              <Text className="text-foreground font-semibold text-sm" numberOfLines={2}>{item.productName}</Text>
              <Text className="text-primary font-bold">{formatPriceMnt(item.unitPrice)}</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    className="w-7 h-7 bg-background border border-border rounded-full items-center justify-center"
                    onPress={() => updateCount(item.productId, item.count - 1)}
                  >
                    <Text className="text-foreground">−</Text>
                  </TouchableOpacity>
                  <Text className="text-foreground font-semibold">{item.count}</Text>
                  <TouchableOpacity
                    className="w-7 h-7 bg-background border border-border rounded-full items-center justify-center"
                    onPress={() => updateCount(item.productId, item.count + 1)}
                  >
                    <Text className="text-foreground">+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.productId)}>
                  <Text className="text-danger text-xs">{t('common.remove')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Order summary + checkout */}
      <View className="px-4 py-4 border-t border-border bg-surface">
        <View className="flex-row justify-between mb-3">
          <Text className="text-muted">{t('cart.total')}</Text>
          <Text className="text-foreground font-bold text-lg">{formatPriceMnt(total)}</Text>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={() => router.push('/checkout')}
        >
          <Text className="text-primary-foreground font-bold text-base">{t('cart.checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## Agent Rules

1. Never use `div`, `section`, `form`, or `button` HTML elements — always use `View`, `TouchableOpacity`, `Pressable`.
2. Never use `dangerouslySetInnerHTML` — use `react-native-render-html` for HTML content.
3. Never use `sessionStorage` or `localStorage` — use `AsyncStorage` from `@react-native-async-storage/async-storage`.
4. Never use `confirm()` — use `Alert.alert()` with confirm/cancel buttons.
5. Never use `Link` from Next.js or `next/image` — use `router.push()` and `Image` from `react-native`.
6. Always use `useLocalSearchParams` for route params — never `params: Promise<{ id }>`.
7. Always use `KeyboardAvoidingView` with `Platform.OS === 'ios' ? 'padding' : 'height'` for forms.
8. Always use `FlatList` for long lists — never `ScrollView` with `map` for large datasets.
9. Gate auth-required screens with `useEffect` redirect to `/login` when `currentUser` is null.
10. `sessionStorage.setItem('redirectAfterLogin', ...)` → `AsyncStorage.setItem('redirectAfterLogin', ...)`.
11. Always include `showsVerticalScrollIndicator={false}` on `ScrollView` components.
12. Price must display in both MNT (`₮`) and USD (`$`) formats using `formatPriceMnt` and `formatPriceUsd`.
