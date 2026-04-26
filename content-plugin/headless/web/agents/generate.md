# Step 4 — Generate Code

Write all files directly into `output/<slug>/`.

---

## 4a. Mock data layer (`lib/mock/`)

Build with placeholder data first so the site works without a live erxes connection.
The mock layer and the real GraphQL layer must have **identical export signatures**.

**`lib/mock/index.ts`** — never change these signatures:
```typescript
// Replaced by lib/graphql/index.ts after CMS is seeded
export { getPages, getPageBySlug } from "./pages";
export { getPosts, getPostBySlug, getFeaturedPost } from "./posts";
export { getCategories } from "./categories";
export { getHeaderMenu, getFooterMenu } from "./menus";
```

All mock content must be real text in the site's language — no lorem ipsum.

---

## 4b. Apollo Client files

**`lib/apollo-client.ts`** — Server-side:
```typescript
import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_ERXES_ENDPOINT,
      headers: {
        "erxes-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN ?? "",
      },
    }),
  });
});
```

**`lib/apollo-wrapper.tsx`** — Client-side provider:
```typescript
"use client";
import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloNextAppProvider } from "@apollo/client-integration-nextjs";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_ERXES_ENDPOINT,
      headers: {
        "erxes-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN ?? "",
      },
    }),
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
```

---

## 4c. Layout — Header, Footer, Root

**`components/Header.tsx`**
- Server Component — use `getClient().query(GET_HEADER_MENU)` directly
- Logo/site name left, nav links right, hamburger on mobile (`"use client"` sub-component)
- Tailwind classes matching `tone` and `color_hint`

**`components/Footer.tsx`**
- Server Component — use `getClient().query(GET_FOOTER_MENU)`
- Site name, nav links, copyright line

**`app/layout.tsx`**:
```tsx
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="...">
      <body>
        <ApolloWrapper>
          <Header />
          <main>{children}</main>
          <Footer />
        </ApolloWrapper>
      </body>
    </html>
  );
}
```

---

## 4d. Pages — one per menu item

Generate a Next.js page for **each menu item** based on its `url`:
- `url: "/"` → `app/page.tsx`
- `url: "/about"` → `app/about/page.tsx`
- `url: "/contact"` → `app/contact/page.tsx`

Each page imports and renders its matching section component.

**Dynamic CMS page** `app/[slug]/page.tsx`:
```typescript
import { getClient } from "@/lib/apollo-client";
import { GET_PAGE_BY_SLUG, GET_PAGES } from "@/lib/graphql/queries/cms";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const { data } = await getClient().query({
    query: GET_PAGES,
    variables: { language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  return (data.cpPages ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const { data } = await getClient().query({
    query: GET_PAGE_BY_SLUG,
    variables: { slug: params.slug, language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  if (!data.cpPageDetail) notFound();
  return (
    <main>
      <div dangerouslySetInnerHTML={{ __html: data.cpPageDetail.content ?? "" }} />
    </main>
  );
}
```

**Dynamic blog post** `app/blog/[slug]/page.tsx`:
```typescript
import { getClient } from "@/lib/apollo-client";
import { GET_POST_BY_SLUG, GET_POSTS } from "@/lib/graphql/queries/cms";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const { data } = await getClient().query({
    query: GET_POSTS,
    variables: { language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  return (data.cpPosts ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { data } = await getClient().query({
    query: GET_POST_BY_SLUG,
    variables: { slug: params.slug, language: "en" },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  if (!data.cpPostDetail) notFound();
  const post = data.cpPostDetail;
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
    </article>
  );
}
```

---

## 4e. Section components

One component per section in `sections`:
- Path: `components/<SectionName>.tsx`
- Server Components — use `getClient().query()` to fetch content
- Tailwind CSS matching `tone` and `color_hint`
- All UI text in the config language

---

## 4f. TypeScript types (`types/cms.ts`)

```typescript
export interface Media {
  readonly url: string;
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface Category {
  readonly _id: string;
  readonly name: string;
  readonly code: string;
  readonly description?: string;
  readonly order?: number;
}

export interface Tag {
  readonly _id: string;
  readonly name: string;
  readonly colorCode?: string;
}

export type PostStatus = "published" | "draft" | "archived";

export interface Post {
  readonly _id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly content?: string;
  readonly status: PostStatus;
  readonly publishedDate?: string;
  readonly category?: Category;
  readonly categoryIds?: readonly string[];
  readonly tags?: readonly Tag[];
  readonly tagIds?: readonly string[];
  readonly featuredImage?: Media;
  readonly featured?: boolean;
}

export interface NavItem {
  readonly _id: string;
  readonly label: string;
  readonly url: string;
  readonly order: number;
  readonly target?: string;
}

export interface CmsPage {
  readonly _id: string;
  readonly name: string;
  readonly slug: string;
  readonly content?: string;
  readonly pageItems?: ReadonlyArray<{
    readonly _id: string;
    readonly name: string;
    readonly type: string;
    readonly content?: string;
    readonly order: number;
  }>;
}
```

---

## 4g. Motion components (motion level ≥ 1)

**`hooks/useReducedMotion.ts`**:
```typescript
"use client";
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefersReduced;
}
```

**`components/motion/FadeIn.tsx`**:
```typescript
"use client";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  once?: boolean;
}

const directionVariants = {
  up:    { hidden: { opacity: 0, y: 24 },  visible: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -16 }, visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 24 },  visible: { opacity: 1, x: 0 } },
  none:  { hidden: { opacity: 0 },          visible: { opacity: 1 } },
} as const;

export function FadeIn({ children, delay = 0, direction = "up", className, once = true }: FadeInProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: once, threshold: 0.1 });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={directionVariants[direction]}
      transition={{ duration: prefersReduced ? 0 : 0.4, delay: prefersReduced ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

---

## 4h. GraphQL query library (`lib/graphql/queries/cms.ts`)

```typescript
import { gql } from "@apollo/client";

export const GET_PAGES = gql`
  query CpPages($language: String) {
    cpPages(language: $language) {
      _id name slug status content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_PAGE_BY_SLUG = gql`
  query CpPageBySlug($slug: String!, $language: String) {
    cpPageDetail(slug: $slug, language: $language) {
      _id name slug status content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_POSTS = gql`
  query CpPosts($language: String, $categoryId: String, $page: Int, $perPage: Int) {
    cpPosts(language: $language, status: published, categoryId: $categoryId, page: $page, perPage: $perPage) {
      _id title slug excerpt content featured publishedDate categoryIds tagIds
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query CpPostBySlug($slug: String!, $language: String) {
    cpPostDetail(slug: $slug, language: $language) {
      _id title slug content excerpt featured publishedDate categoryIds tagIds
    }
  }
`;

export const GET_CATEGORIES = gql`
  query CpCategories($language: String) {
    cpCategories(language: $language) {
      list { _id name slug description }
    }
  }
`;

export const GET_TAGS = gql`
  query CpTags($language: String) {
    cpCmsTags(language: $language) {
      tags { _id name slug colorCode }
    }
  }
`;

export const GET_HEADER_MENU = gql`
  query CpHeaderMenu($language: String) {
    cpMenus(language: $language, kind: "header") {
      _id label url order target contentType contentTypeId
    }
  }
`;

export const GET_FOOTER_MENU = gql`
  query CpFooterMenu($language: String) {
    cpMenus(language: $language, kind: "footer") {
      _id label url order target
    }
  }
`;
```

> Use `cpCmsMenus` if `cpMenus` is not available — check the starter's existing Apollo setup first.
