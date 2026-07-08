# Ecommerce CMS Pages + Review System

> **Design rule:** Logic below is authoritative. All `className` values are reference only — apply your design tokens.

---

## Review Hook (`src/hooks/review.ts`)

Uses graphql from starter repo: `src/graphql/ecommerce/queries/productReview.ts` and `src/graphql/ecommerce/mutations/productReview.ts`.

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
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
  const [addMutation, { loading: addLoading }] = useMutation(CP_PRODUCT_REVIEW_ADD);
  const [updateMutation, { loading: updateLoading }] = useMutation(PRODUCT_REVIEW_UPDATE);
  const [removeMutation, { loading: removeLoading }] = useMutation(PRODUCT_REVIEW_REMOVE);

  const addReview = useCallback(
    async (params: { rating: number; content?: string }) => {
      const { data } = await addMutation({
        variables: { productId, rating: params.rating, content: params.content || "" },
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

Used inside the product detail page. Receives `productId` + `currentUser`. Supports add/edit/delete.

```typescript
"use client";

import { useState } from "react";
import { useProductReviews, useReviewCUD } from "@/hooks/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={star <= value ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </button>
      ))}
    </div>
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
    if (result.success) {
      setRating(5);
      setContent("");
      refetch();
    }
  };

  const handleEdit = (review: any) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditContent(review.content || "");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const result = await updateReview(editingId, { rating: editRating, content: editContent });
    if (result.success) {
      setEditingId(null);
      refetch();
    }
  };

  const handleRemove = async (reviewId: string) => {
    const result = await removeReview(reviewId);
    if (result.success) refetch();
  };

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-xl font-semibold">Сэтгэгдэл</h3>

      {/* Add review form — only for logged-in users */}
      {currentUser && (
        <div className="space-y-3 rounded-xl border p-4">
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            placeholder="Сэтгэгдэл бичих..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={loading}>
            Нэмэх
          </Button>
        </div>
      )}

      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review._id} className="rounded-xl border p-4">
            {editingId === review._id ? (
              <div className="space-y-2">
                <StarRating value={editRating} onChange={setEditRating} />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleUpdate} disabled={loading}>
                    Хадгалах
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    Болих
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <StarRating value={review.rating} readOnly />
                <p className="mt-1 text-sm">{review.content}</p>
                {currentUser?._id === review.customerId && (
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(review)}>
                      Засах
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(review._id)}
                    >
                      Устгах
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">Одоогоор сэтгэгдэл байхгүй байна.</p>
        )}
      </div>
    </div>
  );
}
```

---

## About Page (`app/[locale]/about/page.tsx`) — Server

Fetches `cpPages` (all pages), filters for slug `"about"`. Renders `page.content` as HTML.
No single-page-by-slug query exists — filter the array client-side after `cpPages`.

```typescript
import { notFound } from "next/navigation";
import { getApolloClient } from "@/lib/apollo/server-client";
import { CP_PAGES } from "@/graphql/cms/queries/page";

export default async function AboutPage() {
  const client = getApolloClient();

  const { data } = await client.query({
    query: CP_PAGES,
    variables: {},
  });

  const page = (data?.cpPages || []).find((p: any) => p.slug === "about");
  if (!page) notFound();

  return (
    <div className="container py-12">
      <h1 className="mb-6 text-3xl font-bold">{page.name}</h1>
      {page.content && (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}
    </div>
  );
}
```

---

## Blog List (`app/[locale]/blog/page.tsx`) — Server

Fetches `cpPosts` (status: "published"). Renders post cards with title, excerpt, date, and link to detail.

```typescript
import { Link } from "@/i18n/routing";
import { getApolloClient } from "@/lib/apollo/server-client";
import { CP_POSTS } from "@/graphql/cms/queries/post";

export default async function BlogPage() {
  const client = getApolloClient();

  const { data } = await client.query({
    query: CP_POSTS,
    variables: { status: "published", limit: 20 },
  });

  const posts = data?.cpPosts || [];

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold">Блог</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post: any) => (
          <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
            <article className="rounded-xl border p-5 transition-shadow hover:shadow-md">
              {post.featuredImage?.url && (
                <img
                  src={post.featuredImage.url}
                  alt={post.title}
                  className="mb-4 h-48 w-full rounded-lg object-cover"
                />
              )}
              <h2 className="text-lg font-semibold group-hover:underline">{post.title}</h2>
              {post.excerpt && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              )}
              {post.publishedDate && (
                <time className="mt-3 block text-xs text-muted-foreground">
                  {new Date(post.publishedDate).toLocaleDateString("mn-MN")}
                </time>
              )}
            </article>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">Нийтлэл байхгүй байна.</p>
        )}
      </div>
    </div>
  );
}
```

---

## Blog Detail (`app/[locale]/blog/[slug]/page.tsx`) — Server

Fetches `cpPost` by slug using `CP_POST`. Calls `notFound()` if missing.

```typescript
import { notFound } from "next/navigation";
import { getApolloClient } from "@/lib/apollo/server-client";
import { CP_POST } from "@/graphql/cms/queries/post";

interface Props {
  params: { slug: string; locale: string };
}

export default async function BlogDetailPage({ params }: Props) {
  const client = getApolloClient();

  const { data } = await client.query({
    query: CP_POST,
    variables: { slug: params.slug },
  });

  const post = data?.cpPost;
  if (!post) notFound();

  return (
    <article className="container py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        {post.publishedDate && (
          <time className="mt-2 block text-sm text-muted-foreground">
            {new Date(post.publishedDate).toLocaleDateString("mn-MN")}
          </time>
        )}
        {post.featuredImage?.url && (
          <img
            src={post.featuredImage.url}
            alt={post.title}
            className="mt-6 h-72 w-full rounded-2xl object-cover"
          />
        )}
      </header>

      {post.content && (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}
    </article>
  );
}
```
