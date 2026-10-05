# Hotel CMS Pages + Menu Binding

> **Design rule:** Logic below is authoritative. All `className` values are reference only — apply your design tokens. There is no hotel product-review system (rooms are not POS products); guest testimonials render from a CMS page/content section, not a review CRUD.

Only build pages whose section is in `hotel.config.json` → `cms_sections`.

---

## 1. About / Faq / Amenities / Gallery / Offers pages — Server

Fetches `cpPages`, filters by slug, renders `content` as HTML. No single-page-by-slug query exists — filter the array after `cpPages`.

```typescript
import { notFound } from "next/navigation";
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { CP_PAGES } from "@/graphql/cms/queries"; // from starter

export default async function AboutPage() {
  const client = await getServerApolloClient();

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

Generic section page builder — reuse the same shape for `about`, `faq`, `amenities`, `gallery`, `offers` by swapping the `slug` and the route name. Keep one copy per slug (duplicate layouts are fine; no shared page-registry abstraction unless the starter already has one).

`getServerApolloClient` import path is `@/lib/apollo/server-client` for hotel (see `generate-core.md`) and the call is **async** — always `await getServerApolloClient()`; match the seed content slugs exactly — `observed_routes` from `source-observation.md` first for non-`words` sources, then `faq`, `amenities`, `gallery`, `offers` per `hotel.config.json`/`design-brief`.

---

## 2. Contact page — Server + client form

Server component fetches the `contact` CMS page content, embeds the starter's client contact form (name/email/message) that relays via the starter's contact mutation (`src/graphql/cms/` from the erxes-web-starter). Restyle with tokens; keep field structure and validation.

---

## 3. Blog List (`app/[locale]/blog/page.tsx`) — Server, only if `has_blog`

Same as the ecommerce pattern (`agents/ecommerce/generate-cms.md`), bound to starter's `CP_POSTS`:

```typescript
import { Link } from "@/i18n/routing";
import { getServerApolloClient } from "@/lib/apollo/server-client";
import { CP_POSTS } from "@/graphql/cms/queries"; // from starter

export default async function BlogPage() {
  const client = await getServerApolloClient();

  const { data } = await client.query({
    query: CP_POSTS,
    variables: { status: "published", limit: 20 },
  });

  const posts = data?.cpPosts || [];

  // Deduplicate by slug — repeated seeding can leave duplicate rows in the CMS.
  const uniquePosts = Array.from(
    new Map((posts as any[]).map((post: any) => [post.slug, post])).values()
  );

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold">Блог</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {uniquePosts.map((post: any) => (
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

## 4. Blog Detail (`app/[locale]/blog/[slug]/page.tsx`) — Server, only if `has_blog`

Fetch `cpPosts`, pick the most recently created record matching the slug (dedupe), `notFound()` if missing. Static export: `generateStaticParams` must return every locale × unique published post slug via a direct gateway `fetch` (it cannot call `cookies()`/`headers()`), mirroring the ecommerce `generate-cms.md` detail example — the only change is the app-token env name (`ERXES_APP_TOKEN`, or `NEXT_PUBLIC_ERXES_APP_TOKEN` outside static export) and the settings key (`pipelineId` is not needed here). Do **not** send a `client-portal-id` header — portal scoping comes from the `x-app-token` JWT.

```typescript
export async function generateStaticParams() {
  const uri = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
  const res = await fetch(uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-token": process.env.ERXES_APP_TOKEN || "",
    },
    body: JSON.stringify({
      query: `{ cpPosts(status: "published", limit: 200) { slug } }`,
    }),
  });
  const json = await res.json();
  const slugs = Array.from(new Set((json?.data?.cpPosts || []).map((p: any) => p.slug)));
  return (process.env.NEXT_PUBLIC_LANGUAGES?.split(",") ?? ["mn"]).flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}
```

---

## 5. Header/Footer nav — Menu binding

Covered in `generate-components.md`. Menu queries use `cpMenus(language, kind)` — no CMS id is passed and no portal header is sent; scoping comes from the `x-app-token` JWT; fall back to `[Home, Rooms, About, Contact]` when empty. Menu kinds (`"header"` / `"footer"`) come from the design-brief Phase 4.5 field map; nav labels come from `observed_copy.nav` when the source exposed them.

---

## Rules

1. Only build pages whose section is in `cms_sections`. `blog` only when `has_blog`.
2. Render CMS HTML with `dangerouslySetInnerHTML` (never as JSX).
3. Deduplicate by slug on list and detail; pick most-recent on detail.
4. Header/footer menu items must carry a `kind` (`"header"` or `"footer"`) in the seeded `menu.json` (see hotel `AGENTS.md` Step 5c) or they won't appear in `cpMenus`.
5. Slugs identical across languages (`about` stays `about`) so `/mn/about` and `/en/about` map to the same page.
6. `_id` everywhere, never `id`.