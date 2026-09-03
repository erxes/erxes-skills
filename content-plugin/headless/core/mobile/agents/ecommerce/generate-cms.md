# Ecommerce CMS Screens + Review System (Mobile)

> **Design rule:** Logic below is authoritative. All `className` values are reference only — apply your design tokens.
>
> **i18n rule:** All static UI copy (labels, buttons, empty states, error text) MUST use `i18n.t("key")` from `@/lib/i18n` — never hardcode Mongolian or English strings directly in JSX. Add every new key to BOTH `messages/mn.json` and `messages/en.json` before using it. Only CMS-sourced dynamic content (`page.name`, `post.title`, `post.content`, review `content` typed by users, etc.) may render as raw strings.
>
> **CMS-content language rule (two separate mechanisms — never conflate them):**
> 1. Static UI strings → `messages/*.json` + `i18n.t()` (client-side only).
> 2. CMS content (pages/posts) → seeded by `erxes-pages.ts` / `erxes-posts.ts` as ONE RECORD PER LANGUAGE via the gateway's native per-language records; the app fetches it with a `language` variable on every `cpPages` / `cpPosts` / `cpPost` call. NEVER copy CMS content into `messages/*.json`, NEVER store or translate it locally, and NEVER omit the `language` variable. Subscribe to `localeAtom` (not the static `i18n.locale` property) in query variables so switching language refetches CMS content in the selected language.

---

## Required i18n keys

Add these to `messages/mn.json` and `messages/en.json` before generating the screens below.

```json
// messages/mn.json (additions)
{
  "review": {
    "title": "Сэтгэгдэл",
    "placeholder": "Сэтгэгдэл бичих...",
    "add": "Нэмэх",
    "save": "Хадгалах",
    "cancel": "Болих",
    "edit": "Засах",
    "remove": "Устгах",
    "empty": "Одоогоор сэтгэгдэл байхгүй байна."
  },
  "cms": {
    "pageNotFound": "Хуудас олдсонгүй",
    "blogTitle": "Блог",
    "blogEmpty": "Нийтлэл байхгүй байна.",
    "postNotFound": "Нийтлэл олдсонгүй"
  }
}
```

```json
// messages/en.json (additions)
{
  "review": {
    "title": "Reviews",
    "placeholder": "Write a review...",
    "add": "Add",
    "save": "Save",
    "cancel": "Cancel",
    "edit": "Edit",
    "remove": "Remove",
    "empty": "No reviews yet."
  },
  "cms": {
    "pageNotFound": "Page not found",
    "blogTitle": "Blog",
    "blogEmpty": "No posts yet.",
    "postNotFound": "Post not found"
  }
}
```

---

## Review Hook (`hooks/review.ts`)

No changes — this file has no UI copy, only data logic. Keep as-is.

```typescript
// Apollo Client v4: hooks come from "@apollo/client/react" — NOT "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { CP_PRODUCT_REVIEWS } from "graphql/ecommerce/queries/productReview";
import {
  CP_PRODUCT_REVIEW_ADD,
  PRODUCT_REVIEW_UPDATE,
  PRODUCT_REVIEW_REMOVE,
} from "graphql/ecommerce/mutations/productReview";

export function useProductReviews(productId: string) {
  const { data, loading, error, refetch } = useQuery(CP_PRODUCT_REVIEWS, {
    variables: { productId },
    skip: !productId,
    fetchPolicy: "cache-and-network",
  });
  return {
    reviews: (data as any)?.cpProductReviews || [],
    loading,
    error,
    refetch,
  };
}

export function useReviewCUD(productId: string) {
  const [addMutation, { loading: addLoading }] = useMutation(
    CP_PRODUCT_REVIEW_ADD,
  );
  const [updateMutation, { loading: updateLoading }] = useMutation(
    PRODUCT_REVIEW_UPDATE,
  );
  const [removeMutation, { loading: removeLoading }] = useMutation(
    PRODUCT_REVIEW_REMOVE,
  );

  const addReview = useCallback(
    async (params: { rating: number; content?: string }) => {
      const { data } = await addMutation({
        variables: {
          productId,
          rating: params.rating,
          content: params.content || "",
        },
      });
      return { success: !!(data as any)?.cpProductReviewAdd };
    },
    [addMutation, productId],
  );

  const updateReview = useCallback(
    async (reviewId: string, params: { rating?: number; content?: string }) => {
      const { data } = await updateMutation({
        variables: { _id: reviewId, ...params },
      });
      return { success: !!(data as any)?.cpProductReviewUpdate };
    },
    [updateMutation],
  );

  const removeReview = useCallback(
    async (reviewId: string) => {
      const { data } = await removeMutation({ variables: { _id: reviewId } });
      return { success: !!(data as any)?.cpProductReviewRemove };
    },
    [removeMutation],
  );

  return {
    addReview,
    updateReview,
    removeReview,
    loading: addLoading || updateLoading || removeLoading,
  };
}
```

---

## Review Component (`components/review/ReviewList.tsx`)

**Changed:** every hardcoded Mongolian string replaced with `i18n.t()`.

```typescript
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useProductReviews, useReviewCUD } from "hooks/review";
import { i18n } from "@/lib/i18n";

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          disabled={readOnly}
          onPress={() => onChange?.(star)}
          className="min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <Text className={star <= value ? "text-yellow-400 text-xl" : "text-gray-300 text-xl"}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ReviewList({
  productId,
  currentUser,
}: {
  productId: string;
  currentUser: any;
}) {
  const { reviews, refetch } = useProductReviews(productId);
  const { addReview, updateReview, removeReview, loading } = useReviewCUD(productId);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");

  const handleAdd = async () => {
    const result = await addReview({ rating, content });
    if (result.success) { setRating(5); setContent(""); refetch(); }
  };

  const handleEdit = (review: any) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditContent(review.content || "");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const result = await updateReview(editingId, { rating: editRating, content: editContent });
    if (result.success) { setEditingId(null); refetch(); }
  };

  const handleRemove = async (reviewId: string) => {
    const result = await removeReview(reviewId);
    if (result.success) refetch();
  };

  return (
    <View className="mt-8 gap-6">
      <Text className="text-xl font-semibold">{i18n.t("review.title")}</Text>

      {/* Add review — logged-in users only */}
      {currentUser && (
        <View className="gap-3 rounded-xl border p-4">
          <StarRating value={rating} onChange={setRating} />
          <TextInput
            placeholder={i18n.t("review.placeholder")}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={3}
            className="rounded-lg border border-border bg-background px-3 py-2 min-h-[80px]"
          />
          <Pressable
            onPress={handleAdd}
            disabled={loading}
            className="rounded-xl bg-primary p-3 items-center min-h-[44px]"
          >
            <Text className="text-white font-semibold">{i18n.t("review.add")}</Text>
          </Pressable>
        </View>
      )}

      {/* Review list — review.content itself is user-authored, not translated */}
      <View className="gap-4">
        {reviews.map((review: any) => (
          <View key={review._id} className="rounded-xl border p-4">
            {editingId === review._id ? (
              <View className="gap-2">
                <StarRating value={editRating} onChange={setEditRating} />
                <TextInput
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  numberOfLines={3}
                  className="rounded-lg border border-border bg-background px-3 py-2 min-h-[80px]"
                />
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleUpdate}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-primary p-3 items-center min-h-[44px]"
                  >
                    <Text className="text-white font-semibold">{i18n.t("review.save")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingId(null)}
                    className="flex-1 rounded-xl border border-border p-3 items-center min-h-[44px]"
                  >
                    <Text className="font-medium">{i18n.t("review.cancel")}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <StarRating value={review.rating} readOnly />
                <Text className="mt-1 text-sm">{review.content}</Text>
                {currentUser?._id === review.customerId && (
                  <View className="mt-2 flex-row gap-2">
                    <Pressable
                      onPress={() => handleEdit(review)}
                      className="rounded-lg border border-border px-3 py-2 min-h-[44px] items-center justify-center"
                    >
                      <Text className="text-sm">{i18n.t("review.edit")}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemove(review._id)}
                      className="rounded-lg bg-red-100 px-3 py-2 min-h-[44px] items-center justify-center"
                    >
                      <Text className="text-sm text-red-700">{i18n.t("review.remove")}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
        {reviews.length === 0 && (
          <Text className="text-sm text-muted-foreground">
            {i18n.t("review.empty")}
          </Text>
        )}
      </View>
    </View>
  );
}
```

---

## About Screen (`app/about.tsx`)

### ⚠️ cpPages caveats (verified against the live gateway — read before using CP_PAGES)

1. **No pagination arguments.** `cpPages` accepts ONLY `language`
   (+ `status`). Passing `perPage`, `page`, `limit`, `slug`, or `cmsId` fails
   GraphQL validation with "Unknown argument" — there is NO way to page
   through or filter server-side, and **no single-page-by-slug query exists**.
2. **Hard result cap (~20 items).** The gateway returns at most ~20 pages per
   query regardless of how many exist.
3. **Shared-portal scope issue.** One client portal can host several sites'
   CMS content. Seeding mutations (`cpCmsPagesAdd`) succeed and return real
   `_id`s even when the new pages will never surface in `cpPages`, because an
   unrelated site's older content fills the ~20-item window. Symptom: the app's
   About screen shows "page not found" although the content exists.

   **Agent rules:**
   - Seed CMS content EARLY, then immediately verify with a `cpPages(language)`
     query that every seeded slug is visible in the returned list. If a seeded
     page does not appear, STOP retrying the mutation (it already succeeded) —
     report the portal-scope caveat to the user instead: the fix is a dedicated
     client portal / separate CMS, or backend pagination support, not more seeding.
   - Never "fix" this client-side by looping queries — there are no query
     arguments to vary.
4. Filter client-side by `slug` after fetch: `(data?.cpPages || []).find(p => p.slug === "about")`.

**Changed:** `"Хуудас олдсонгүй"` → `i18n.t("cms.pageNotFound")`. `page.name` / `page.content` stay raw — they come from the CMS already resolved for `i18n.locale`.

```typescript
import { ScrollView, Text, ActivityIndicator, View } from "react-native";
import { useWindowDimensions } from "react-native";
import { useQuery } from "@apollo/client/react";
import RenderHtml from "react-native-render-html";
import { useAtomValue } from "jotai";
import { CP_PAGES } from "graphql/cms/queries/page";
import { localeAtom } from "@/store/locale";

export default function AboutScreen() {
  const { width } = useWindowDimensions();
  const locale = useAtomValue(localeAtom);
  const { data, loading } = useQuery(CP_PAGES, {
    variables: { language: locale },
  });

  if (loading) return <ActivityIndicator className="flex-1 mt-8" />;

  const page = (data?.cpPages || []).find((p: any) => p.slug === "about");
  if (!page) return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-muted-foreground">{i18n.t("cms.pageNotFound")}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-3xl font-bold mb-6">{page.name}</Text>
      {page.content && (
        <RenderHtml contentWidth={width - 32} source={{ html: page.content }} />
      )}
    </ScrollView>
  );
}
```

---

## Blog List (`app/blog/index.tsx`)

**Changed:** `"Блог"` → `i18n.t("cms.blogTitle")`, `"Нийтлэл байхгүй байна."` → `i18n.t("cms.blogEmpty")`, `toLocaleDateString("mn-MN")` → locale-aware via `i18n.locale`.

```typescript
import { FlatList, Text, Pressable, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { CP_POSTS } from "graphql/cms/queries/post";
import { localeAtom } from "@/store/locale";

export default function BlogScreen() {
  const router = useRouter();
  const locale = useAtomValue(localeAtom);
  const { data, loading } = useQuery(CP_POSTS, {
    variables: { status: "published", limit: 20, language: locale },
  });
  const posts = data?.cpPosts || [];

  if (loading) return <ActivityIndicator className="flex-1 mt-8" />;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      contentContainerClassName="p-4 gap-6"
      ListHeaderComponent={<Text className="text-3xl font-bold mb-2">{i18n.t("cms.blogTitle")}</Text>}
      ListEmptyComponent={
        <Text className="text-center text-muted-foreground">{i18n.t("cms.blogEmpty")}</Text>
      }
      renderItem={({ item: post }) => (
        <Pressable
          onPress={() => router.push(`/blog/${post.slug}`)}
          className="rounded-xl border overflow-hidden"
        >
          {post.featuredImage?.url && (
            <Image
              source={{ uri: post.featuredImage.url }}
              style={{ width: "100%", height: 192 }}
              contentFit="cover"
            />
          )}
          <View className="p-4">
            <Text className="text-lg font-semibold">{post.title}</Text>
            {post.excerpt && (
              <Text className="mt-2 text-sm text-muted-foreground" numberOfLines={2}>
                {post.excerpt}
              </Text>
            )}
            {post.publishedDate && (
              <Text className="mt-3 text-xs text-muted-foreground">
                {new Date(post.publishedDate).toLocaleDateString(
                  i18n.locale === "en" ? "en-US" : "mn-MN",
                )}
              </Text>
            )}
          </View>
        </Pressable>
      )}
    />
  );
}
```

---

## Blog Detail (`app/blog/[slug].tsx`)

**Changed:** `"Нийтлэл олдсонгүй"` → `i18n.t("cms.postNotFound")`, date locale made dynamic.

```typescript
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useWindowDimensions } from "react-native";
import { useQuery } from "@apollo/client/react";
import { useLocalSearchParams } from "expo-router";
import RenderHtml from "react-native-render-html";
import { useAtomValue } from "jotai";
import { CP_POST } from "graphql/cms/queries/post";
import { localeAtom } from "@/store/locale";

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const locale = useAtomValue(localeAtom);
  const { data, loading } = useQuery(CP_POST, {
    variables: { slug, language: locale },
    skip: !slug,
  });

  if (loading) return <ActivityIndicator className="flex-1 mt-8" />;

  const post = data?.cpPost;
  if (!post) return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-muted-foreground">{i18n.t("cms.postNotFound")}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1">
      {post.featuredImage?.url && (
        <Image
          source={{ uri: post.featuredImage.url }}
          style={{ width: "100%", height: 288 }}
          contentFit="cover"
        />
      )}
      <View className="p-4">
        <Text className="text-3xl font-bold">{post.title}</Text>
        {post.publishedDate && (
          <Text className="mt-2 text-sm text-muted-foreground">
            {new Date(post.publishedDate).toLocaleDateString(
              i18n.locale === "en" ? "en-US" : "mn-MN",
            )}
          </Text>
        )}
        {post.content && (
          <View className="mt-6">
            <RenderHtml contentWidth={width - 32} source={{ html: post.content }} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```
