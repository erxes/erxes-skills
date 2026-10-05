# Hotel Core: Apollo Client, Providers, Root Layout

Bundles the shared runtime glue: how to consume the starter's Apollo client,
the i18n layout skeleton, providers, and the entry points for
`app/globals.css`.

---

## 1. Apollo — IMPORT FROM THE STARTER, DO NOT AUTHOR

The Apollo layer ships with the starter. **Do not create, rewrite, or "improve"
any file under `src/lib/apollo/`.** The starter's own `AGENTS.md` states: *"Do
not rewrite Apollo setup, auth logic, or payment flow."* Hotel work here is
limited to **importing** these modules correctly.

| Import | From | Use in |
|---|---|---|
| `getApolloClient()` | `@/lib/apollo/client` | client components (a **function**, not an instance) |
| `ApolloClientProvider` | `@/lib/apollo/provider` | `app/[locale]/layout.tsx` |
| `getServerApolloClient()` | `@/lib/apollo/server-client` | server components — **async, must be awaited** |
| `link` | `@/lib/apollo/links` | already composed; never rebuild it |

```typescript
// Server component — note the await
import { getServerApolloClient } from "@/lib/apollo/server-client";

export default async function Page() {
  const client = await getServerApolloClient();
  const { data } = await client.query({ query: CP_PAGES, variables: {} });
  // ...
}
```

> `getServerApolloClient()` lives at `@/lib/apollo/server-client` and returns a
> **Promise**. `const client = getServerApolloClient()` without `await` yields a
> Promise, and `client.query` then throws at runtime.

### What the starter already handles — do not duplicate

- **Endpoint**: `NEXT_PUBLIC_GRAPHQL_URL` on the client, `GRAPHQL_URL` falling
  back to `NEXT_PUBLIC_GRAPHQL_URL` on the server.
- **App token**: `x-app-token: NEXT_PUBLIC_ERXES_APP_TOKEN` (client) and
  `x-app-token: ERXES_APP_TOKEN` (server). The header name is `x-app-token` —
  never `erxes-app-token`.
- **Session token**: the starter reads `localStorage.getItem("token")` in the
  browser and the `token` cookie on the server, and sends it as
  `authorization: Bearer <token>`. Hotel code never touches this.
- **Cache**: the server client sets `fetchOptions: { cache: "no-store" }`.

### `clientPortalId` — do not send it

Do **not** add `clientPortalId` or `client-portal-id` as a header, and do **not**
pass `clientPortalId` as a GraphQL variable. `cpPages` and `cpMenus` accept no
such argument (`cpPages(language:)`, `cpMenus(language:, kind:, webId:)`).
All client-portal scoping comes from the `x-app-token` JWT payload. A
`clientPortalId` header is a silent no-op.

---

## 2. Providers

The starter already ships `ApolloClientProvider`. Update
`app/[locale]/layout.tsx` — do not create a competing `components/providers.tsx`.

```tsx
// app/[locale]/layout.tsx  (update, do not replace the starter layout)
import { ApolloClientProvider } from "@/lib/apollo/provider";
import { AuthProvider } from "@/lib/auth/AuthContext";

// inside the existing <NextIntlClientProvider>
<ApolloClientProvider>
  <AuthProvider>{children}</AuthProvider>
</ApolloClientProvider>
```

---

## 3. Root Layout

### `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "../globals.css";

export const metadata: Metadata = {
  title: "<site-name from hotel.config.json>",
  icons: "/icons/favicon.svg",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### `app/[locale]/layout.tsx`

```tsx
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>
      <Header />
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}
```

---

## 4. `app/globals.css`

Handled in `agents/frontend.md` Phase 7 + `generate-core.md` keep-alive contract: **`@theme inline`** must host the token values from `design-tokens.json`. Read `design-tokens.json` first (Design Binding gate, Step 1) — never invent tokens.

Pattern (hotel reference):

```css
@import "tailwindcss";

@theme inline {
  --color-primary: oklch(var(--primary)); /* mapped from design-tokens.json */
  --color-secondary: var(--secondary);
}

body {
  font-family: var(--font-sans, ui-sans-serif, system-ui);
}
```

> The `@theme inline` map is the single source of truth that turns approved tokens into the CSS the components consume. Do not bypass it with hardcoded hex values inside components.