# Section C — Step 1 (Generate Code)

Write all files directly into `output/<slug>/`.

## Starter inventory — read before writing anything

The cloned starter already contains these. **Import from them — do not recreate.**

| Already exists | Import / usage |
| -------------- | -------------- |
| Apollo client + provider | `@/lib/apollo/client`, `@/lib/apollo/server-client`, `@/lib/apollo/provider` |
| Auth context + hook | `import { AuthProvider, useAuth } from "@/lib/auth/AuthContext"` — **only for `has_auth = true` (ecommerce / tour / hotel)** |
| Protected route wrapper | `import RequireAuth from "@/lib/auth/RequireAuth"` — **only for `has_auth = true`** |
| Payment hook | `import { useInvoice } from "@/lib/hooks/useInvoice"` — **only for `has_auth = true`** |
| Image component | `import Image from "@/components/common/Image"` — **always use this, never `<img>` or `next/image`** |
| Loader / EmptyState / Pagination | `@/components/common/Loader`, `EmptyState`, `Pagination` |
| All GraphQL operations + types | `@/graphql/auth/*`, `@/graphql/cms/*`, `@/graphql/ecommerce/*`, `@/graphql/hotel/*`, `@/graphql/tour/*` |
| i18n routing | `@/i18n/routing` — only update `locales` + `defaultLocale`, never rewrite the file |
| Root locale layout | `src/app/[locale]/layout.tsx` — update it, do not replace it |

For `has_auth = true` (ecommerce / tour / hotel) only: add `<AuthProvider>` inside `<ApolloClientProvider>` in the locale layout. **Do not add `AuthProvider` for `business` sites.**

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

## 4d. Pages

All pages live under `app/[locale]/` — never under `app/` directly. Each page receives `params: { locale: string }` and passes it as `language` to every query.

### Page type decision tree

| Section | Page type | Route |
| ------- | --------- | ----- |
| `about`, `services`, `team`, `gallery`, `pricing`, `portfolio`, `testimonials`, `faq` | CMS content → `[slug]/page.tsx` | `/about`, `/services`, etc. |
| `contact` | Dedicated page with form | `contact/page.tsx` |
| `blog` | Listing + detail | `blog/page.tsx`, `blog/[slug]/page.tsx` |
| `menu` (restaurant) | Dedicated page | `menu/page.tsx` |
| Homepage | Compose selected section components | `page.tsx` |

**Rule:** The homepage composes all selected sections as a landing page. Every section also gets its own standalone page route — reuse the same section component, adapt layout depth as needed.

---

### Homepage `app/[locale]/page.tsx` — Server Component

```tsx
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { CP_PAGES } from "@/graphql/cms/queries/page";
// Import each section component
import HeroSection from "@/components/sections/Hero";
import AboutSection from "@/components/sections/About";
// ... other sections

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const client = await getServerApolloClient();
  const { data } = await client.query({
    query: CP_PAGES,
    variables: { language: locale },
  });
  const pages = data?.cpPages ?? [];
  const getPage = (slug: string) => pages.find((p: { slug: string }) => p.slug === slug);

  return (
    <main>
      <HeroSection />
      <AboutSection page={getPage("about")} />
      {/* render each selected section */}
    </main>
  );
}
```

---

### CMS content pages — `app/[locale]/[slug]/page.tsx`

Used for: about, services, team, gallery, pricing, portfolio, testimonials, faq.

```tsx
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { CP_PAGE_DETAIL, CP_PAGES } from "@/graphql/cms/queries/page";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const results = await Promise.all(
    routing.locales.map(async (locale) => {
      const client = await getServerApolloClient();
      const { data } = await client.query({ query: CP_PAGES, variables: { language: locale } });
      return (data?.cpPages ?? []).map((p: { slug: string }) => ({ locale, slug: p.slug }));
    })
  );
  return results.flat();
}

export default async function CmsPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const client = await getServerApolloClient();
  const { data } = await client.query({ query: CP_PAGE_DETAIL, variables: { slug, language: locale } });
  if (!data?.cpPageDetail) notFound();
  const page = data.cpPageDetail;
  return (
    <main>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content ?? "" }} />
    </main>
  );
}
```

---

### Contact page — `app/[locale]/contact/page.tsx`

Dedicated page — fetches CMS content for intro text, renders a contact form client component.

```tsx
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { CP_PAGE_DETAIL } from "@/graphql/cms/queries/page";
import ContactForm from "@/components/sections/ContactForm";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const client = await getServerApolloClient();
  const { data } = await client.query({ query: CP_PAGE_DETAIL, variables: { slug: "contact", language: locale } });
  const page = data?.cpPageDetail;
  return (
    <main>
      {page && <div dangerouslySetInnerHTML={{ __html: page.content ?? "" }} />}
      <ContactForm locale={locale} />
    </main>
  );
}
```

`ContactForm` is a `"use client"` component with name, email, message fields. On submit, call `cpFormsSubmit` or your CRM mutation.

---

### Blog listing — `app/[locale]/blog/page.tsx`

```tsx
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { CP_POSTS } from "@/graphql/cms/queries/post";
import { Link } from "@/i18n/routing";

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const client = await getServerApolloClient();
  const { data } = await client.query({ query: CP_POSTS, variables: { language: locale } });
  const posts = data?.cpPosts ?? [];
  return (
    <main>
      <h1>Blog</h1>
      <ul>
        {posts.map((post: { _id: string; slug?: string; title?: string; excerpt?: string }) => (
          <li key={post._id}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            <p>{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### Blog detail — `app/[locale]/blog/[slug]/page.tsx`

```tsx
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { CP_POST_DETAIL, CP_POSTS } from "@/graphql/cms/queries/post";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const results = await Promise.all(
    routing.locales.map(async (locale) => {
      const client = await getServerApolloClient();
      const { data } = await client.query({ query: CP_POSTS, variables: { language: locale } });
      return (data?.cpPosts ?? []).map((p: { slug: string }) => ({ locale, slug: p.slug }));
    })
  );
  return results.flat();
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const client = await getServerApolloClient();
  const { data } = await client.query({ query: CP_POST_DETAIL, variables: { slug, language: locale } });
  if (!data?.cpPostDetail) notFound();
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

## 4f. Auth (`has_auth` — ecommerce / tour / hotel only)

**Skip this section entirely if `site_type` is `business`.** Do not add `AuthProvider`, auth pages, or `RequireAuth` to business sites.

`AuthProvider`, `useAuth`, and `RequireAuth` are pre-built in the starter — do not recreate them.

### Layout — add `AuthProvider`

In `app/[locale]/layout.tsx`, wrap children with `AuthProvider` inside `ApolloClientProvider`:

```tsx
import { AuthProvider } from "@/lib/auth/AuthContext";
// ...
<ApolloClientProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ApolloClientProvider>
```

### Pages to generate

| Route | File | Purpose |
|---|---|---|
| `/login` | `app/[locale]/login/page.tsx` | Email/phone + password login |
| `/register` | `app/[locale]/register/page.tsx` | New account registration |
| `/forgot-password` | `app/[locale]/forgot-password/page.tsx` | Request reset link/OTP |
| `/reset-password` | `app/[locale]/reset-password/page.tsx` | Set new password |
| `/verify` | `app/[locale]/verify/page.tsx` | OTP/email verification after register |
| `/account` | `app/[locale]/account/page.tsx` | Protected — user profile |

### Login page pattern

```tsx
"use client";
import { useMutation } from "@apollo/client";
import { CLIENT_PORTAL_USER_LOGIN_WITH_CREDENTIALS } from "@/graphql/auth/mutations/loginWithCredentials";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMutation, { loading, error }] = useMutation(CLIENT_PORTAL_USER_LOGIN_WITH_CREDENTIALS);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { data } = await loginMutation({
      variables: { email: form.get("email"), password: form.get("password") },
    });
    const token = data?.clientPortalUserLoginWithCredentials?.token;
    if (token) {
      login(token);
      router.push("/account");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {error && <p>{error.message}</p>}
      <button type="submit" disabled={loading}>Log in</button>
    </form>
  );
}
```

Follow the same pattern for register, forgot-password, reset-password, and verify using the corresponding mutations from `@/graphql/auth/mutations/`.

### Protected pages

Wrap `/account` (and any other protected page) with the pre-built `RequireAuth`:

```tsx
import RequireAuth from "@/lib/auth/RequireAuth";

export default function AccountPage() {
  return <RequireAuth><AccountContent /></RequireAuth>;
}
```

### Header auth button

```tsx
"use client";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";

export function AuthButton() {
  const { user, logout, loading } = useAuth();
  if (loading) return null;
  if (user) return <button onClick={logout}>Log out</button>;
  return <Link href="/login">Log in</Link>;
}
```

### Rules
- All auth forms are `"use client"` — they use mutations and state
- All UI text must be in the site's language — use `messages/<locale>.json` for auth labels

---

## 4g. Section components

One component per section in `sections`:
- Path: `components/<SectionName>.tsx`
- Server Components — use `getClient().query()` to fetch content
- Tailwind CSS matching `tone` and `color_hint`
- All UI text in the config language
- All images via `import Image from "@/components/common/Image"` — never `<img>` or `next/image` directly

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
