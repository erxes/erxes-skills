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

## 4b. Internationalisation (i18n)

The starter uses **next-intl** with `app/[locale]/` routing. All pages live under `app/[locale]/`, not `app/`. Do this before writing any pages.

### Update `src/i18n/routing.ts`

Replace the hardcoded locales with the values from `site.config.json`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [/* languages array from site.config.json, e.g. ["mn", "en"] */],
  defaultLocale: /* language field from site.config.json, e.g. "mn" */,
});
```

### Update `src/app/[locale]/layout.tsx`

Update `generateStaticParams` to match the configured locales:

```typescript
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

### Generate `messages/<locale>.json` for each language

Create one file per language in `messages/`. These hold UI strings (labels, buttons, nav text) — **not** CMS content. Generate real translated text for the site's language and tone.

Example structure for a business site with `sections: ["hero", "about", "services", "contact"]`:
```json
{
  "nav": { "home": "Home", "about": "About", "services": "Services", "contact": "Contact" },
  "hero": { "cta": "Get Started", "learnMore": "Learn More" },
  "contact": { "submit": "Send Message", "namePlaceholder": "Your name", "emailPlaceholder": "Your email" },
  "footer": { "rights": "All rights reserved" }
}
```
Translate all values into the correct language for each file (e.g. `messages/mn.json` in Mongolian).

### Pass `locale` to all GraphQL queries

Every server component that calls `getClient().query()` must pass the locale as the `language` variable. Get it from route params:

```typescript
// In any page or server component under app/[locale]/
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const { data } = await getClient().query({
    query: GET_PAGES,
    variables: { language: locale },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
}
```

In `generateStaticParams` for dynamic routes, generate params for **every locale × every slug**:

```typescript
export async function generateStaticParams() {
  const results = await Promise.all(
    routing.locales.map(async (locale) => {
      const { data } = await getClient().query({
        query: GET_PAGES,
        variables: { language: locale },
      });
      return (data.cpPages ?? []).map((p: { slug: string }) => ({ locale, slug: p.slug }));
    })
  );
  return results.flat();
}
```

### Language switcher (only if `languages.length > 1`)

Add a `LanguageSwitcher` component to the Header. Use next-intl's `Link` and `usePathname` to build locale-prefixed links:

```typescript
"use client";
import { useLocale } from "next-intl";
// IMPORTANT: import Link and usePathname from @/i18n/routing — NOT from next/link or next/navigation
// next-intl's usePathname returns the path without the locale prefix
// next-intl's Link accepts a `locale` prop and handles the switch correctly
import { Link, usePathname } from "@/i18n/routing";

const LABELS: Record<string, string> = { en: "EN", mn: "МН", zh: "中", ru: "РУ", ko: "한", ja: "日" };

export function LanguageSwitcher({ locales }: { locales: string[] }) {
  const locale = useLocale();
  const pathname = usePathname(); // e.g. "/about" — no locale prefix

  return (
    <div className="flex gap-2 text-sm">
      {locales.map((l) => (
        <Link key={l} href={pathname} locale={l}
          className={l === locale ? "font-bold" : "opacity-60 hover:opacity-100"}>
          {LABELS[l] ?? l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
```

---

## 4c. Apollo Client files

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
- Server Component — fetch menu with `getClient().query(GET_HEADER_MENU, { variables: { language: locale } })`
- Logo/site name left, nav links right, hamburger on mobile (`"use client"` sub-component)
- Include `<LanguageSwitcher>` if `languages.length > 1`
- Tailwind classes matching `tone` and `color_hint`

**`components/Footer.tsx`**
- Server Component — fetch menu with `getClient().query(GET_FOOTER_MENU, { variables: { language: locale } })`
- Site name, nav links, copyright line

**`app/[locale]/layout.tsx`** — update the existing file, do not create `app/layout.tsx`:
```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import ApolloClientProvider from "@/lib/apollo/provider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ApolloClientProvider>
            <Header locale={locale} />
            <main>{children}</main>
            <Footer locale={locale} />
          </ApolloClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## 4d. Pages — one per menu item

All pages live under `app/[locale]/` — never under `app/` directly.

- `url: "/"` → `app/[locale]/page.tsx`
- `url: "/about"` → `app/[locale]/about/page.tsx`
- `url: "/contact"` → `app/[locale]/contact/page.tsx`

Each page receives `params: { locale: string }` and passes it as `language` to every query.

**Dynamic CMS page** `app/[locale]/[slug]/page.tsx`:
```typescript
import { getClient } from "@/lib/apollo-client";
import { GET_PAGE_BY_SLUG, GET_PAGES } from "@/lib/graphql/queries/cms";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const results = await Promise.all(
    routing.locales.map(async (locale) => {
      const { data } = await getClient().query({
        query: GET_PAGES,
        variables: { language: locale },
        context: { fetchOptions: { next: { revalidate: 60 } } },
      });
      return (data.cpPages ?? []).map((p: { slug: string }) => ({ locale, slug: p.slug }));
    })
  );
  return results.flat();
}

export default async function CmsPage({ params }: { params: { locale: string; slug: string } }) {
  const { locale, slug } = await params;
  const { data } = await getClient().query({
    query: GET_PAGE_BY_SLUG,
    variables: { slug, language: locale },
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

**Dynamic blog post** `app/[locale]/blog/[slug]/page.tsx`:
```typescript
import { getClient } from "@/lib/apollo-client";
import { GET_POST_BY_SLUG, GET_POSTS } from "@/lib/graphql/queries/cms";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const results = await Promise.all(
    routing.locales.map(async (locale) => {
      const { data } = await getClient().query({
        query: GET_POSTS,
        variables: { language: locale },
        context: { fetchOptions: { next: { revalidate: 60 } } },
      });
      return (data.cpPosts ?? []).map((p: { slug: string }) => ({ locale, slug: p.slug }));
    })
  );
  return results.flat();
}

export default async function PostPage({ params }: { params: { locale: string; slug: string } }) {
  const { locale, slug } = await params;
  const { data } = await getClient().query({
    query: GET_POST_BY_SLUG,
    variables: { slug, language: locale },
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

## 4e. SEO & Open Graph metadata

Every page must export `generateMetadata`. Use Next.js `Metadata` type — never add raw `<meta>` tags.

### Root layout — `metadataBase`

Add to `app/[locale]/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"),
};
```

### Static pages (home, about, services, contact, etc.)

Each `app/[locale]/<section>/page.tsx` exports a static `metadata` object. Write real copy — not placeholders.

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | <Site Name>",
  description: "One sentence about what this page covers.",
  openGraph: {
    title: "About Us | <Site Name>",
    description: "One sentence about what this page covers.",
    type: "website",
  },
  twitter: { card: "summary" },
};
```

### Dynamic CMS page — `app/[locale]/[slug]/page.tsx`

Add `generateMetadata` above the default export. It fetches the same page the component renders, so Next.js deduplicates the request:

```typescript
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { locale: string; slug: string } }
): Promise<Metadata> {
  const { locale, slug } = await params;
  const { data } = await getClient().query({
    query: GET_PAGE_BY_SLUG,
    variables: { slug, language: locale },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  const page = data.cpPageDetail;
  if (!page) return {};
  return {
    title: page.name,
    description: page.description ?? undefined,
    openGraph: {
      title: page.name,
      description: page.description ?? undefined,
      type: "website",
    },
    twitter: { card: "summary" },
  };
}
```

### Dynamic blog post — `app/[locale]/blog/[slug]/page.tsx`

```typescript
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { locale: string; slug: string } }
): Promise<Metadata> {
  const { locale, slug } = await params;
  const { data } = await getClient().query({
    query: GET_POST_BY_SLUG,
    variables: { slug, language: locale },
    context: { fetchOptions: { next: { revalidate: 60 } } },
  });
  const post = data.cpPostDetail;
  if (!post) return {};
  const ogImages = post.featuredImage?.url ? [{ url: post.featuredImage.url }] : [];
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.publishedDate ?? undefined,
      images: ogImages,
    },
    twitter: {
      card: ogImages.length ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.featuredImage?.url ? [post.featuredImage.url] : [],
    },
  };
}
```

---

## 4f. Section components

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
  readonly featuredImage?: Media;
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
  readonly description?: string;
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
      _id name slug status description content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_PAGE_BY_SLUG = gql`
  query CpPageBySlug($slug: String!, $language: String) {
    cpPageDetail(slug: $slug, language: $language) {
      _id name slug status description content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_POSTS = gql`
  query CpPosts($language: String, $categoryId: String, $page: Int, $perPage: Int) {
    cpPosts(language: $language, status: published, categoryId: $categoryId, page: $page, perPage: $perPage) {
      _id title slug excerpt content featured publishedDate categoryIds tagIds
      featuredImage { url altText }
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query CpPostBySlug($slug: String!, $language: String) {
    cpPostDetail(slug: $slug, language: $language) {
      _id title slug content excerpt featured publishedDate categoryIds tagIds
      featuredImage { url altText }
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
