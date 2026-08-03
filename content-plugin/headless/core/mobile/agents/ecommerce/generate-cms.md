# Ecommerce CMS Screens + Review System (Mobile)

> **Design rule:** Logic below is authoritative. All `className` values are reference only — apply your design tokens.

---

## Review Hook (`hooks/review.ts`)

```typescript
import { useMutation, useQuery } from "@apollo/client";
import { useCallback } from "react";
import { CP_PRODUCT_REVIEWS } from "@/graphql/ecommerce/queries/productReview";
import {
  CP_PRODUCT_REVIEW_ADD,
  PRODUCT_REVIEW_UPDATE,
  PRODUCT_REVIEW_REMOVE,
} from "@/graphql/ecommerce/mutations/productReview";

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

```typescript
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useProductReviews, useReviewCUD } from "@/hooks/review";

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
      <Text className="text-xl font-semibold">Сэтгэгдэл</Text>

      {/* Add review — logged-in users only */}
      {currentUser && (
        <View className="gap-3 rounded-xl border p-4">
          <StarRating value={rating} onChange={setRating} />
          <TextInput
            placeholder="Сэтгэгдэл бичих..."
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
            <Text className="text-white font-semibold">Нэмэх</Text>
          </Pressable>
        </View>
      )}

      {/* Review list */}
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
                    <Text className="text-white font-semibold">Хадгалах</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingId(null)}
                    className="flex-1 rounded-xl border border-border p-3 items-center min-h-[44px]"
                  >
                    <Text className="font-medium">Болих</Text>
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
                      <Text className="text-sm">Засах</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemove(review._id)}
                      className="rounded-lg bg-red-100 px-3 py-2 min-h-[44px] items-center justify-center"
                    >
                      <Text className="text-sm text-red-700">Устгах</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
        {reviews.length === 0 && (
          <Text className="text-sm text-muted-foreground">
            Одоогоор сэтгэгдэл байхгүй байна.
          </Text>
        )}
      </View>
    </View>
  );
}
```

---

## About Screen (`app/about.tsx`)

```typescript
import { ScrollView, Text, ActivityIndicator, View } from "react-native";
import { useWindowDimensions } from "react-native";
import { useQuery } from "@apollo/client/react";
import RenderHtml from "react-native-render-html";
import { CP_PAGES } from "@/graphql/cms/queries/page";
import { i18n } from "@/lib/i18n";

export default function AboutScreen() {
  const { width } = useWindowDimensions();
  const { data, loading } = useQuery(CP_PAGES, {
    variables: { language: i18n.locale },
  });

  if (loading) return <ActivityIndicator className="flex-1 mt-8" />;

  const page = (data?.cpPages || []).find((p: any) => p.slug === "about");
  if (!page) return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-muted-foreground">Хуудас олдсонгүй</Text>
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

```typescript
import { FlatList, Text, Pressable, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "expo-router";
import { CP_POSTS } from "@/graphql/cms/queries/post";
import { i18n } from "@/lib/i18n";

export default function BlogScreen() {
  const router = useRouter();
  const { data, loading } = useQuery(CP_POSTS, {
    variables: { status: "published", limit: 20, language: i18n.locale },
  });
  const posts = data?.cpPosts || [];

  if (loading) return <ActivityIndicator className="flex-1 mt-8" />;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      contentContainerClassName="p-4 gap-6"
      ListHeaderComponent={<Text className="text-3xl font-bold mb-2">Блог</Text>}
      ListEmptyComponent={
        <Text className="text-center text-muted-foreground">Нийтлэл байхгүй байна.</Text>
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
                {new Date(post.publishedDate).toLocaleDateString("mn-MN")}
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

```typescript
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useWindowDimensions } from "react-native";
import { useQuery } from "@apollo/client/react";
import { useLocalSearchParams } from "expo-router";
import RenderHtml from "react-native-render-html";
import { CP_POST } from "@/graphql/cms/queries/post";
import { i18n } from "@/lib/i18n";

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { data, loading } = useQuery(CP_POST, {
    variables: { slug, language: i18n.locale },
    skip: !slug,
  });

  if (loading) return <ActivityIndicator className="flex-1 mt-8" />;

  const post = data?.cpPost;
  if (!post) return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-muted-foreground">Нийтлэл олдсонгүй</Text>
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
            {new Date(post.publishedDate).toLocaleDateString("mn-MN")}
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
