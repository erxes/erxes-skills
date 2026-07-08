# Section C — Step 2 (Connect erxes) — Mobile (Expo)

Use this file after the Expo frontend project exists in `output/<slug>/`.

It extends the main pipeline by connecting the generated Expo app to erxes CMS, generating GraphQL integration, seeding CMS content, and verifying the result end to end.

## When to use this file

Read this file when the user says:

- "connect this static app to erxes"
- "seed CMS data from my mobile frontend"
- "make my static Expo app a headless CMS frontend"
- "set up erxes content"
- "convert static app to CMS"

In the main mobile build pipeline, read this file immediately after Section C — Step 1 (frontend generation) is complete.

## Combined mode with the main agent

When this file is used from the root `AGENTS.md` pipeline:

- start from the generated project in `output/<slug>/`
- reuse `store.config.json`, `HANDOFF.md`, `design-tokens.json`, and `ui-libraries.json`
- reuse `ERXES_CMS_ID` from Step 0 when it already exists
- do not rerun design, clone, or starter setup steps
- fingerprint the generated project before mutating erxes or editing frontend files
- merge GraphQL and Apollo changes into the generated frontend instead of replacing unrelated UI work
- seed content for every language in `store.config.json`
- run verification query plus `npx expo export` before deployment

If `ERXES_CMS_ID` is missing, create the CMS first. If it already exists, do not create a duplicate CMS.

---

## 0. Agent Mission

When triggered by any of the intents above, run the full integration pipeline in this file without waiting for step-by-step instructions.

The agent reads the generated Expo project tree, infers the content model, decides the CMS structure, executes CMS mutations in dependency order, generates all required Expo source files, and runs verification.

---

## 1. Project Fingerprinting

Before writing any code or calling any mutation, scan the generated project and answer every question in this section.

### 1.1 File Tree Scan

```bash
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" \) \
  | grep -v node_modules | grep -v .expo | grep -v .next | head -120
```

### 1.2 Project Type Decision Table

| Signal found in project                                 | Detected project type                                | Primary content model                                               |
| ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `portfolio`, `projects[]`, `case-study` screens or data | Portfolio                                            | CustomPostType `project` + Pages: Home, About, Contact              |
| `products[]`, `price`, `cart`, `shop` screens or data   | E-commerce / Product app                             | CustomPostType `product` + Pages: Home, Shop, About, Contact        |
| `jobs[]`, `careers`, `apply` screens or data            | Careers / Job board                                  | CustomPostType `job` + Pages: Home, Careers, About, Contact         |
| `events[]`, `schedule`, `speakers` screens or data      | Events app                                           | CustomPostType `event` + Pages: Home, Events, About, Contact        |
| `team[]`, `members[]`, `bios` screens or data           | Agency / Team app                                    | CustomPostType `teamMember` + Pages: Home, About, Team, Contact     |
| `blog`, `posts[]`, `articles[]` screens or data         | Blog / News                                          | Posts + Category `Blog` + Pages: Home, Blog, About, Contact         |
| `docs`, `guides[]`, `tutorials[]` screens or data       | Documentation app                                    | Posts + Category `Docs` + Pages: Home, Docs, About                  |
| `news`, `press`, `releases[]` screens or data           | News / Media                                         | Posts + Categories: News, Press + Pages: Home, News, About, Contact |
| General marketing, no repeatable content                | Branding / Marketing                                 | Pages only: Home, About, Services, Pricing, Contact                 |
| `testimonials[]`, `reviews[]` screens or data           | Add CustomPostType `testimonial` to any of the above |                                                                     |
| `faq[]`, `accordion` data                               | Add Page `FAQ` to any of the above                   |                                                                     |

Pick one primary type and stack any extra types from the last two rows when those signals also exist.

### 1.3 Screen to CMS Entity Mapping

| Discovered screen / file                     | Maps to                              |
| -------------------------------------------- | ------------------------------------ |
| `app/(tabs)/index.tsx`, `home.*`             | Page `slug: home`                    |
| `app/about.tsx`                              | Page `slug: about`                   |
| `app/contact.tsx`                            | Page `slug: contact`                 |
| `app/services.tsx`                           | Page `slug: services`                |
| `app/pricing.tsx`                            | Page `slug: pricing`                 |
| `app/faq.tsx`                                | Page `slug: faq`                     |
| `app/terms.tsx`, `app/privacy.tsx`           | Page `slug: terms` / `slug: privacy` |
| `app/blog/index.tsx`, `app/news/index.tsx`   | Category + bottom tab archive link   |
| `app/blog/[slug].tsx`, `app/news/[slug].tsx` | Posts                                |
| `app/(tabs)/products/[id].tsx`               | CustomPostType `code: product`       |
| `app/projects/[slug].tsx`                    | CustomPostType `code: project`       |
| `app/jobs/[slug].tsx`                        | CustomPostType `code: job`           |
| `app/events/[slug].tsx`                      | CustomPostType `code: event`         |
| `app/team/[slug].tsx`                        | CustomPostType `code: teamMember`    |

### 1.4 Custom Field Decision Table

Add a `CustomFieldGroup` whenever a screen or custom post type needs structured data beyond title plus content.

| Content has         | CustomFieldGroup  | Fields                                                                                      |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| Any page or post    | `seo`             | `seoTitle (text)`, `seoDescription (textarea)`, `ogImage (text)`                            |
| Hero section        | `hero`            | `heroHeading (text)`, `heroSubtitle (textarea)`, `heroCTALabel (text)`, `heroCTAUrl (text)` |
| Product             | `productMeta`     | `price (number)`, `currency (text)`, `sku (text)`, `inStock (checkbox)`                     |
| Job                 | `jobMeta`         | `location (text)`, `type (text)`, `department (text)`, `applyUrl (text)`                    |
| Event               | `eventMeta`       | `startDate (date)`, `endDate (date)`, `venue (text)`, `ticketUrl (text)`                    |
| Project / Portfolio | `projectMeta`     | `client (text)`, `year (text)`, `stack (text)`, `liveUrl (text)`, `repoUrl (text)`          |
| Team member         | `teamMeta`        | `role (text)`, `linkedinUrl (text)`, `twitterUrl (text)`, `avatarUrl (text)`                |
| Testimonial         | `testimonialMeta` | `author (text)`, `company (text)`, `avatarUrl (text)`, `rating (number)`                    |

---

## 2. Environment Setup

### 2.1 Required Files

`.env.local`

```env
# ─── Server-side only (Node.js seed scripts — never exposed to the app) ───
ERXES_API_URL=https://dent.next.erxes.io/gateway/graphql
ERXES_APP_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRQb3J0YWxJZCI6Ik9ZZkhlSVd2VENQQ2E0SjBLUjhGMiIsImlhdCI6MTc4MDk3ODU0N30.TW1umhOGO3I92uyedmMfUOpUh4cNmOStegz6ng3yUAg"
ERXES_POS_TOKEN="dFhsNNfym9wDdoKIHU7s3b8Ip3iNhjQG"

# ─── Client-side (Expo app — runs on device, EXPO_PUBLIC_ prefix required) ───
EXPO_PUBLIC_ERXES_API_URL=https://dent.next.erxes.io/gateway/graphql
EXPO_PUBLIC_ERXES_APP_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRQb3J0YWxJZCI6Ik9ZZkhlSVd2VENQQ2E0SjBLUjhGMiIsImlhdCI6MTc4MDk3ODU0N30.TW1umhOGO3I92uyedmMfUOpUh4cNmOStegz6ng3yUAg"
EXPO_PUBLIC_ERXES_BRAND_CODE=mRugDycpAY52Ds3fQ6oBI
```

> **Why two sets of variables?**
>
> - `ERXES_*` (no prefix) — used by Node.js seed scripts only. Never bundled into the app.
> - `EXPO_PUBLIC_*` — bundled into the Expo app and readable on the device. Required for all client-side API calls (`useQuery`, `useMutation`, Apollo Client).
> - Variables without `EXPO_PUBLIC_` are **invisible** to the Expo app at runtime even if they exist in `.env.local`.

How to get tokens:

- `ERXES_APP_TOKEN` / `EXPO_PUBLIC_ERXES_APP_TOKEN`: erxes Admin → Settings → App Tokens → Create App → copy token
- `ERXES_POS_TOKEN`: erxes Admin → POS → Settings → copy token
- `EXPO_PUBLIC_ERXES_BRAND_CODE`: erxes Admin → Settings → Channels → (your channel) → Integrations → erxes Messenger → Integration ID

### 2.2 Install Dependencies

```bash
npx expo install @apollo/client graphql
npm install @apollo/client graphql
```

### 2.3 Apollo Client Setup (client-side)

`lib/apollo-client.ts`

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

let client: ApolloClient<unknown> | null = null;

export function getApolloClient() {
  if (client) return client;
  client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: `${process.env.EXPO_PUBLIC_ERXES_API_URL}`,
      headers: {
        "erxes-app-token": process.env.EXPO_PUBLIC_ERXES_APP_TOKEN ?? "",
      },
    }),
  });
  return client;
}
```

### 2.4 Connection Points

| Purpose                 | Variable                       | Used by         | Header                         |
| ----------------------- | ------------------------------ | --------------- | ------------------------------ |
| Screen queries (client) | `EXPO_PUBLIC_ERXES_API_URL`    | Expo app        | `erxes-app-token`              |
| Screen queries (client) | `EXPO_PUBLIC_ERXES_APP_TOKEN`  | Expo app        | `erxes-app-token`              |
| Messenger widget        | `EXPO_PUBLIC_ERXES_BRAND_CODE` | Expo app        | (cookie session)               |
| CMS seed mutations      | `ERXES_API_URL`                | Node.js scripts | `x-app-token: ERXES_APP_TOKEN` |
| POS mutations           | `ERXES_API_URL`                | Node.js scripts | `x-app-token: ERXES_POS_TOKEN` |

---

## 3. CMS Mutation Pipeline

Execute mutations in this order and store all returned `_id` values.

```text
Step 1  cpContentCreateCMS         -> CMS_ID
Step 2  cpCmsCustomPostTypesAdd    -> CUSTOM_TYPE_IDs
Step 3  cpCmsCustomFieldGroupsAdd  -> FIELD_GROUP_IDs
Step 4  cpCmsCategoriesAdd         -> CATEGORY_IDs
Step 5  cpCmsTagsAdd               -> TAG_IDs
Step 6  cpCmsPagesAdd              -> PAGE_IDs
Step 7  cpCmsPostsAdd              -> POST_IDs
Step 8  cpCmsAddTranslation        -> optional
Step 9  cpCmsAddMenu               -> MENU_IDs
```

All mutations post to `${ERXES_API_URL}` with `x-app-token: ${CLIENT_PORTAL_TOKEN}`.

Never send `clientPortalId` in variables except when creating the CMS in systems that explicitly require it.

### Step 1 - Create CMS Config

Skip this step when `ERXES_CMS_ID` already exists from the main pipeline.

```graphql
mutation CpContentCreateCMS($input: ContentCMSInput) {
  cpContentCreateCMS(input: $input) {
    _id
    clientPortalId
    name
    description
    language
    languages
    postUrlField
  }
}
```

Variables:

```json
{
  "input": {
    "name": "<ProjectName> CMS",
    "description": "Headless CMS for <ProjectName> Expo mobile app.",
    "content": "Pages, posts, navigation, categories, tags, and custom types.",
    "language": "en",
    "languages": ["en"],
    "postUrlField": "slug"
  }
}
```

Store `CMS_ID`.

### Step 2 - Create Custom Post Types

Run one mutation per detected custom type and skip it for pure blog, docs, news, or simple marketing apps.

```graphql
mutation CpCmsCustomPostTypesAdd($input: CustomPostTypeInput!) {
  cpCmsCustomPostTypesAdd(input: $input) {
    _id
    code
    label
    pluralLabel
  }
}
```

Reserved codes: `page`, `post`, `category`.

### Step 3 - Create Custom Field Groups

Always create `seo`. Create `hero` and any type-specific groups that match the discovered content model.

```graphql
mutation CpCmsCustomFieldGroupsAdd($input: CustomFieldGroupInput!) {
  cpCmsCustomFieldGroupsAdd(input: $input) {
    _id
    label
    code
    fields
  }
}
```

SEO example:

```json
{
  "input": {
    "label": "SEO",
    "code": "seo",
    "order": 1,
    "fields": [
      { "name": "seoTitle", "label": "SEO Title", "type": "text" },
      {
        "name": "seoDescription",
        "label": "SEO Description",
        "type": "textarea"
      },
      { "name": "ogImage", "label": "OG Image URL", "type": "text" }
    ]
  }
}
```

### Step 4 - Create Categories

```graphql
mutation CpCmsCategoriesAdd($input: PostCategoryInput!) {
  cpCmsCategoriesAdd(input: $input) {
    _id
    name
    slug
  }
}
```

### Step 5 - Create Tags

```graphql
mutation CpCmsTagsAdd($input: PostTagInput!) {
  cpCmsTagsAdd(input: $input) {
    _id
    name
    slug
  }
}
```

Base tags:

| Tag          | Slug           | Color     |
| ------------ | -------------- | --------- |
| Featured     | `featured`     | `#f59e0b` |
| Guide        | `guide`        | `#16a34a` |
| Announcement | `announcement` | `#2563eb` |
| Tutorial     | `tutorial`     | `#7c3aed` |

### Step 6 - Create Pages

```graphql
mutation CpCmsPagesAdd($input: PageInput!) {
  cpCmsPagesAdd(input: $input) {
    _id
    name
    slug
    status
  }
}
```

Every page uses `type: "static"` and `status: "published"`.

### Step 7 - Create Posts

Minimum seed content:

| Project type  | Minimum                                            |
| ------------- | -------------------------------------------------- |
| Blog          | 2 posts                                            |
| Portfolio     | 2 `project` entries                                |
| E-commerce    | 3 `product` entries                                |
| Job board     | 2 `job` entries                                    |
| Events        | 2 `event` entries                                  |
| Agency / Team | 3 `teamMember` entries and 2 `testimonial` entries |
| Documentation | 2 posts                                            |

```graphql
mutation CpCmsPostsAdd($input: PostInput!) {
  cpCmsPostsAdd(input: $input) {
    _id
    title
    slug
    status
    categoryIds
    tagIds
  }
}
```

### Step 8 - Add Translations

```graphql
mutation CpCmsAddTranslation($input: TranslationInput!) {
  cpCmsAddTranslation(input: $input) {
    _id
    objectId
    language
    type
    title
  }
}
```

Allowed `type` values: `post`, `page`, `category`, `tag`, `menu`.

### Step 9 - Create Menus

```graphql
mutation CpCmsAddMenu($input: MenuItemInput!) {
  cpCmsAddMenu(input: $input) {
    _id
    kind
    label
    url
    order
  }
}
```

Wire bottom tab and drawer menu items to the created pages or archive routes.

---

## 4. Expo Source Files to Generate

After CMS entities exist, generate or merge these files into `output/<slug>/`.

### 4.1 Apollo Client

`lib/apollo-client.ts`

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

// Singleton — reuse across screens
let client: ApolloClient<unknown> | null = null;

export function getApolloClient() {
  if (client) return client;
  client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.EXPO_PUBLIC_ERXES_API_URL,
      headers: {
        "erxes-app-token": process.env.EXPO_PUBLIC_ERXES_APP_TOKEN ?? "",
      },
    }),
  });
  return client;
}
```

### 4.2 Apollo Provider

`lib/apollo-provider.tsx`

```tsx
"use client";
import { ApolloProvider } from "@apollo/client";
import { getApolloClient } from "./apollo-client";

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>;
}
```

### 4.3 Root Layout

`app/_layout.tsx`

Wrap the app in `ApolloWrapper` and keep all existing layout (fonts, safe area, navigation) intact:

```tsx
import { ApolloWrapper } from "@/lib/apollo-provider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApolloWrapper>{children}</ApolloWrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### 4.4 GraphQL Query Library

Create or extend `lib/graphql/queries/cms.ts` with page, post, category, tag, header menu, and footer menu queries.

Required query families:

- `GET_PAGES`
- `GET_PAGE_BY_SLUG`
- `GET_POSTS`
- `GET_POST_BY_SLUG`
- `GET_CATEGORIES`
- `GET_TAGS`
- `GET_HEADER_MENU`
- `GET_FOOTER_MENU`

Example:

```typescript
import { gql } from "@apollo/client";

export const GET_POSTS = gql`
  query GetPosts($language: String) {
    cpPosts(language: $language, status: published) {
      _id
      title
      slug
      description
      categoryIds
      tagIds
      createdAt
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: String!, $language: String) {
    cpPost(slug: $slug, language: $language) {
      _id
      title
      slug
      content
      description
      categoryIds
      tagIds
      createdAt
    }
  }
`;

export const GET_HEADER_MENU = gql`
  query GetHeaderMenu($language: String) {
    cpMenus(language: $language, kind: "header") {
      _id
      label
      url
      order
    }
  }
`;
```

### 4.5 Dynamic Screen — Post Detail

`app/blog/[slug].tsx`

```tsx
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@apollo/client";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { GET_POST_BY_SLUG } from "@/lib/graphql/queries/cms";

export default function PostDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, loading, error } = useQuery(GET_POST_BY_SLUG, {
    variables: { slug, language: "en" },
  });

  if (loading) return <ActivityIndicator />;
  if (error || !data?.cpPost) return <Text>Олдсонгүй</Text>;

  const post = data.cpPost;
  return (
    <ScrollView>
      <View>
        <Text>{post.title}</Text>
        {/* Render post.content as HTML via react-native-render-html */}
      </View>
    </ScrollView>
  );
}
```

> **Анхаар:** `dangerouslySetInnerHTML` React Native-д байхгүй.
> CMS HTML контентийг `react-native-render-html` ашиглан рендер хийнэ:
>
> ```bash
> npx expo install react-native-render-html
> ```

### 4.6 Navigation

`components/layout/TabBar.tsx` — bottom tab меню `cpMenus` GraphQL query-с авна.
`components/layout/DrawerNav.tsx` — drawer навигаци хэрэгтэй бол.

---

## 5. File Structure

```text
app/
  _layout.tsx              ← ApolloWrapper + GestureHandlerRootView
  (tabs)/
    _layout.tsx
    index.tsx
    products/
      index.tsx
      [id].tsx
  blog/
    index.tsx
    [slug].tsx
  about.tsx
  contact.tsx
  faq.tsx

components/
  layout/
    TabBar.tsx
    DrawerNav.tsx

lib/
  apollo-client.ts         ← singleton ApolloClient (EXPO_PUBLIC_* env)
  apollo-provider.tsx      ← ApolloProvider wrapper
  graphql/
    queries/
      cms.ts
    mutations/
      cms.ts

.env.local
```

Custom post type screens нэмэх шаардлагатай бол дээрх бүтцэд тохирох folder нэмнэ.

---

## 6. Verification

Run this query after mutations and file generation:

```graphql
query VerifyMobileCMS($language: String) {
  cpPages(language: $language) {
    _id
    name
    slug
    status
  }
  cpPosts(language: $language, status: published) {
    _id
    title
    slug
    categoryIds
    tagIds
  }
  cpCategories(language: $language) {
    list {
      _id
      name
      slug
    }
  }
  cpCmsTags(language: $language) {
    tags {
      _id
      name
      slug
    }
  }
  header: cpMenus(language: $language, kind: "header") {
    _id
    label
    url
    order
  }
  footer: cpMenus(language: $language, kind: "footer") {
    _id
    label
    url
    order
  }
}
```

Variables:

```json
{ "language": "en" }
```

Pass criteria:

- `cpPages` returns required pages
- `cpPosts` returns the required seed content when the model includes posts
- `cpCategories.list` returns at least one category when categories are expected
- `cpCmsTags.tags` returns at least two tags
- header returns at least two ordered items
- footer returns at least one item
- `npx expo export` completes with zero errors
- `npx expo-doctor` all checks pass

---

## 7. Production Readiness Checklist

### CMS Data

- [ ] CMS config exists
- [ ] All detected custom post types exist
- [ ] SEO field group exists
- [ ] All discovered screens map to Pages
- [ ] All discovered content items map to Posts or custom entries
- [ ] Categories exist and are used
- [ ] Tags exist and are used
- [ ] Header/tab menu is ordered correctly
- [ ] Footer menu is wired correctly

### Frontend Code

- [ ] `lib/apollo-client.ts` uses singleton pattern (not `registerApolloClient`)
- [ ] `lib/apollo-provider.tsx` is a client component with `ApolloProvider`
- [ ] `app/_layout.tsx` wraps children in `ApolloWrapper`
- [ ] `GestureHandlerRootView` is the outermost wrapper in `_layout.tsx`
- [ ] Tab / drawer menu queries render from `cpMenus`
- [ ] `useLocalSearchParams` used for dynamic screen params (not `useParams`)
- [ ] CMS HTML rendered via `react-native-render-html` (not `dangerouslySetInnerHTML`)
- [ ] No hardcoded API URLs remain
- [ ] `EXPO_PUBLIC_*` used for client-side env vars (not `NEXT_PUBLIC_*`)
- [ ] `_id` used in all GraphQL selections
- [ ] `npx expo export` passes

### Environment

- [ ] `.env.local` has erxes URLs and tokens with `EXPO_PUBLIC_` prefix
- [ ] `.env.local` is ignored by git
- [ ] EAS environment variables are set for build

---

## 8. Agent Rules

1. Scan before acting.
2. Keep mutation dependency order strict.
3. Store every returned `_id`.
4. Never send `clientPortalId` unless the creation endpoint explicitly requires it.
5. Never hardcode API URLs — always use `EXPO_PUBLIC_*` env vars.
6. Use `_id`, not `id`.
7. Use `useQuery` / `useMutation` from `@apollo/client` in screens.
8. Merge changes instead of overwriting unrelated frontend code.
9. Meet the minimum seed content for the detected content model.
10. Use `react-native-render-html` for CMS HTML content — never `dangerouslySetInnerHTML`.
11. Verify last and report pass or fail for each criterion.
