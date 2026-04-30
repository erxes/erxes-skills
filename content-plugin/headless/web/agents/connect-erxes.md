# Connect erxes

Use this file after the frontend project exists in `output/<slug>/`.

It extends the main pipeline by connecting the generated Next.js site to erxes CMS, generating GraphQL integration, seeding CMS content, and verifying the result end to end.

## When to use this file

Read this file when the user says:

- "connect this static site to erxes"
- "seed CMS data from my frontend"
- "make my static site a headless CMS frontend"
- "set up erxes content"
- "convert static site to CMS"

In the main site-build pipeline, read this file immediately after Step 4 frontend generation is complete.

## Combined mode with the main agent

When this file is used from the root `AGENTS.md` pipeline:

- start from the generated project in `output/<slug>/`
- reuse `site.config.json`, `HANDOFF.md`, `design-tokens.json`, and `ui-libraries.json`
- reuse `ERXES_CMS_ID` from Step 0 when it already exists
- do not rerun design, clone, or starter setup steps
- fingerprint the generated project before mutating erxes or editing frontend files
- merge GraphQL and Apollo changes into the generated frontend instead of replacing unrelated UI work
- seed content for every language in `site.config.json`
- run verification query plus `pnpm build` before deployment

If `ERXES_CMS_ID` is missing, create the CMS first. If it already exists, do not create a duplicate CMS.

---

## 0. Agent Mission

When triggered by any of the intents above, run the full integration pipeline in this file without waiting for step-by-step instructions.

The agent reads the generated frontend tree, infers the content model, decides the CMS structure, executes CMS mutations in dependency order, generates all required Next.js source files, and runs verification.

---

## 1. Project Fingerprinting

Before writing any code or calling any mutation, scan the generated project and answer every question in this section.

### 1.1 File Tree Scan

```bash
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.html" \
  -o -name "*.json" -o -name "*.md" -o -name "*.mdx" \) \
  | grep -v node_modules | grep -v .next | head -120
```

### 1.2 Project Type Decision Table

| Signal found in project | Detected project type | Primary content model |
|---|---|---|
| `portfolio`, `projects[]`, `case-study` routes or data | Portfolio | CustomPostType `project` + Pages: Home, About, Contact |
| `products[]`, `price`, `cart`, `shop` routes or data | E-commerce / Product site | CustomPostType `product` + Pages: Home, Shop, About, Contact |
| `jobs[]`, `careers`, `apply` routes or data | Careers / Job board | CustomPostType `job` + Pages: Home, Careers, About, Contact |
| `events[]`, `schedule`, `speakers` routes or data | Events site | CustomPostType `event` + Pages: Home, Events, About, Contact |
| `team[]`, `members[]`, `bios` routes or data | Agency / Team site | CustomPostType `teamMember` + Pages: Home, About, Team, Contact |
| `blog`, `posts[]`, `articles[]` routes or data | Blog / News | Posts + Category `Blog` + Pages: Home, Blog, About, Contact |
| `docs`, `guides[]`, `tutorials[]` routes or data | Documentation site | Posts + Category `Docs` + Pages: Home, Docs, About |
| `news`, `press`, `releases[]` routes or data | News / Media | Posts + Categories: News, Press + Pages: Home, News, About, Contact |
| General marketing, no repeatable content | Branding / Marketing | Pages only: Home, About, Services, Pricing, Contact |
| `testimonials[]`, `reviews[]` routes or data | Add CustomPostType `testimonial` to any of the above | |
| `faq[]`, `accordion` data | Add Page `FAQ` to any of the above | |

Pick one primary type and stack any extra types from the last two rows when those signals also exist.

### 1.3 Route to CMS Entity Mapping

| Discovered route / file | Maps to |
|---|---|
| `/`, `index.*`, `home.*` | Page `slug: home` |
| `/about`, `about.*` | Page `slug: about` |
| `/contact`, `contact.*` | Page `slug: contact` |
| `/services`, `services.*` | Page `slug: services` |
| `/pricing`, `pricing.*` | Page `slug: pricing` |
| `/faq`, `faq.*` | Page `slug: faq` |
| `/terms`, `/privacy` | Page `slug: terms` / `slug: privacy` |
| `/blog`, `/news` archive | Category + header menu archive link |
| `/blog/[slug]`, `/news/[slug]` | Posts |
| `/projects/[slug]` | CustomPostType `code: project` |
| `/products/[slug]` | CustomPostType `code: product` |
| `/jobs/[slug]` | CustomPostType `code: job` |
| `/events/[slug]` | CustomPostType `code: event` |
| `/team/[slug]` | CustomPostType `code: teamMember` |

### 1.4 Custom Field Decision Table

Add a `CustomFieldGroup` whenever a page or custom post type needs structured data beyond title plus content.

| Content has | CustomFieldGroup | Fields |
|---|---|---|
| Any page or post | `seo` | `seoTitle (text)`, `seoDescription (textarea)`, `ogImage (text)` |
| Hero section | `hero` | `heroHeading (text)`, `heroSubtitle (textarea)`, `heroCTALabel (text)`, `heroCTAUrl (text)` |
| Product | `productMeta` | `price (number)`, `currency (text)`, `sku (text)`, `inStock (checkbox)` |
| Job | `jobMeta` | `location (text)`, `type (text)`, `department (text)`, `applyUrl (text)` |
| Event | `eventMeta` | `startDate (date)`, `endDate (date)`, `venue (text)`, `ticketUrl (text)` |
| Project / Portfolio | `projectMeta` | `client (text)`, `year (text)`, `stack (text)`, `liveUrl (text)`, `repoUrl (text)` |
| Team member | `teamMeta` | `role (text)`, `linkedinUrl (text)`, `twitterUrl (text)`, `avatarUrl (text)` |
| Testimonial | `testimonialMeta` | `author (text)`, `company (text)`, `avatarUrl (text)`, `rating (number)` |

---

## 2. Environment Setup

### 2.1 Required Files

`.env.local`

```env
ERXES_API_URL=https://your-erxes-domain.com/graphql
ERXES_APP_TOKEN=your_erxes_app_token_here
NEXT_PUBLIC_ERXES_API_URL=https://your-erxes-domain.com/graphql
NEXT_PUBLIC_ERXES_APP_TOKEN=your_erxes_app_token_here
CLIENT_PORTAL_TOKEN=your_client_portal_token_here
```

How to get tokens:

- `ERXES_APP_TOKEN`: erxes Admin -> Settings -> App Store -> Create App -> copy token
- `CLIENT_PORTAL_TOKEN`: erxes Admin -> Client Portal -> select portal -> copy token

### 2.2 Install Dependencies

```bash
pnpm add @apollo/client @apollo/client-integration-nextjs graphql
```

Keep the cloned starter's existing `next`, `react`, and `react-dom` versions unchanged while adding Apollo packages. Do not upgrade the framework stack as part of erxes integration.

### 2.3 Connection Points

| Purpose | Endpoint | Header |
|---|---|---|
| Frontend queries (SSR/Client) | `ERXES_API_URL` | `erxes-app-token` |
| CMS seed mutations | `ERXES_API_URL` | `x-app-token: CLIENT_PORTAL_TOKEN` |
| Client Components | `NEXT_PUBLIC_ERXES_API_URL` | `erxes-app-token` |

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
    "description": "Headless CMS for <ProjectName> static frontend.",
    "content": "Pages, posts, navigation, categories, tags, and custom types.",
    "language": "en",
    "languages": ["en"],
    "postUrlField": "slug"
  }
}
```

Store `CMS_ID`.

### Step 2 - Create Custom Post Types

Run one mutation per detected custom type and skip it for pure blog, docs, news, or simple marketing sites.

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
      { "name": "seoDescription", "label": "SEO Description", "type": "textarea" },
      { "name": "ogImage", "label": "OG Image URL", "type": "text" }
    ]
  }
}
```

### Step 4 - Create Categories

Create at least one category per content stream.

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

Always create a base tag set and extend it with project-specific tags.

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

| Tag | Slug | Color |
|---|---|---|
| Featured | `featured` | `#f59e0b` |
| Guide | `guide` | `#16a34a` |
| Announcement | `announcement` | `#2563eb` |
| Tutorial | `tutorial` | `#7c3aed` |

### Step 6 - Create Pages

Create one page per discovered static route and one homepage entry that matches the generated layout.

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

Create seed posts or custom-type entries that satisfy the detected project type.

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

Minimum seed content:

| Project type | Minimum |
|---|---|
| Blog | 2 posts |
| Portfolio | 2 `project` entries |
| E-commerce | 3 `product` entries |
| Job board | 2 `job` entries |
| Events | 2 `event` entries |
| Agency / Team | 3 `teamMember` entries and 2 `testimonial` entries |
| Documentation | 2 posts |

### Step 8 - Add Translations

When multiple languages exist, add translations for every entity required by the site.

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

Wire header and footer menu items to the created pages or archive routes.

---

## 4. Next.js Source Files to Generate

After CMS entities exist, generate or merge these frontend files into `output/<slug>/`.

### 4.1 Apollo Client

`lib/apollo-client.ts`

```typescript
import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.ERXES_API_URL,
      headers: {
        "x-app-token": process.env.ERXES_APP_TOKEN ?? "",
      },
    }),
  });
});
```

### 4.2 Apollo Wrapper

`lib/apollo-wrapper.tsx`

```typescript
"use client";

import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloNextAppProvider } from "@apollo/client-integration-nextjs";

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_ERXES_API_URL,
      headers: {
        "x-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN ?? "",
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

### 4.3 Root Layout

`app/layout.tsx`

Wrap the app in `ApolloWrapper` and keep all existing layout UI intact.

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

### 4.5 Dynamic Page Route

Create or merge `app/[slug]/page.tsx` so it:

- calls `GET_PAGES` in `generateStaticParams`
- calls `GET_PAGE_BY_SLUG` in the page component
- uses `notFound()` when the CMS page is missing
- includes `revalidate` in query context

### 4.6 Dynamic Post Route

Create or merge the appropriate archive and detail route for posts or custom post types, such as `app/blog/[slug]/page.tsx`.

### 4.7 Navigation

Create or merge `components/Navigation.tsx` and `components/Footer.tsx` so header and footer menus render from `cpMenus`.

---

## 5. File Structure

The connected site should follow this structure after integration:

```text
app/
  layout.tsx
  page.tsx
  [slug]/
    page.tsx
  blog/
    page.tsx
    [slug]/
      page.tsx
components/
  Navigation.tsx
  Footer.tsx
lib/
  apollo-client.ts
  apollo-wrapper.tsx
  graphql/
    queries/
      cms.ts
    mutations/
      cms.ts
.env.local
```

Add equivalent route folders for custom post types when the content model requires them.

---

## 6. Verification

Run this query after mutations and file generation:

```graphql
query VerifyStaticSiteCMS($language: String) {
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
- `generateStaticParams` returns non-empty arrays for all dynamic CMS routes
- `pnpm build` completes with zero errors

---

## 7. Production Readiness Checklist

### CMS Data

- [ ] CMS config exists
- [ ] All detected custom post types exist
- [ ] SEO field group exists
- [ ] All discovered routes map to Pages
- [ ] All discovered content items map to Posts or custom entries
- [ ] Categories exist and are used
- [ ] Tags exist and are used
- [ ] Header menu is ordered correctly
- [ ] Footer menu is wired correctly

### Frontend Code

- [ ] `lib/apollo-client.ts` uses `registerApolloClient`
- [ ] `lib/apollo-wrapper.tsx` is a client component
- [ ] `app/layout.tsx` wraps children in `ApolloWrapper`
- [ ] header and footer menu queries render in navigation components
- [ ] `generateStaticParams` exists for every dynamic CMS route
- [ ] `dangerouslySetInnerHTML` only receives sanitized CMS HTML
- [ ] all `getClient().query()` calls include `revalidate`
- [ ] no hardcoded API URLs remain
- [ ] `_id` is used in GraphQL selections
- [ ] `pnpm build` passes

### Environment

- [ ] `.env.local` has erxes URLs and tokens
- [ ] `.env.local` is ignored by git
- [ ] deployment platform env vars are set

---

## 8. Agent Rules

1. Scan before acting.
2. Keep mutation dependency order strict.
3. Store every returned `_id`.
4. Never send `clientPortalId` unless the creation endpoint explicitly requires it.
5. Never hardcode API URLs.
6. Use `_id`, not `id`.
7. Server Components use `getClient()`.
8. Merge changes instead of overwriting unrelated frontend code.
9. Meet the minimum seed content for the detected content model.
10. Verify last and report pass or fail for each criterion.
