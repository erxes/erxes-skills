# Reference — Mobile (Expo Go)

## erxes mutations

All mutations require the `x-app-token` header. Do not put `clientPortalId` in page/post/menu mutations. Exception: `cpContentCreateCMS` may include `clientPortalId` when creating the CMS.

_(Unchanged from web — the erxes GraphQL API is backend-agnostic and identical regardless of client platform.)_

| Mutation                  | Input type            | Use for                                      |
| ------------------------- | --------------------- | -------------------------------------------- |
| `cpContentCreateCMS`      | `ContentCMSInput`     | Create CMS config (run once, returns CMS_ID) |
| `cpCmsPagesAdd`           | `PageInput`           | CMS pages                                    |
| `cpCmsPostsAdd`           | `PostInput`           | Blog posts                                   |
| `cpCmsCategoriesAdd`      | `PostCategoryInput`   | Blog categories                              |
| `cpCmsTagsAdd`            | `PostTagInput`        | Tags                                         |
| `cpCmsAddMenu`            | `MenuItemInput`       | Navigation menu items                        |
| `cpCmsCustomPostTypesAdd` | `CustomPostTypeInput` | Custom types (product, project, job, event)  |

Menu `kind` values: `"header"` · `"footer"` · `"link"` (fallback) — on mobile, `"footer"` items typically render as a drawer/more-menu rather than a footer bar; `"header"` items map to the tab bar or top nav.

---

## Key env vars

| Var                            | Purpose                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ERXES_ENDPOINT`               | erxes GraphQL endpoint                                                                                                                                       |
| `ERXES_APP_TOKEN`              | erxes app token (`x-app-token` header for mutations)                                                                                                         |
| `ERXES_CLIENT_PORTAL_ID`       | Client portal id used during CMS creation                                                                                                                    |
| `ERXES_CMS_ID`                 | CMS id returned by `cpContentCreateCMS`                                                                                                                      |
| `ERXES_LANGUAGE`               | Default language (`en`, `mn`, etc.)                                                                                                                          |
| `GITHUB_TOKEN`                 | GitHub PAT with `repo` scope — clones starter, pushes generated apps                                                                                         |
| `GITHUB_USERNAME`              | GitHub username — generated apps pushed as private repos here                                                                                                |
| `STARTER_REPO_URL`             | GitHub URL of the erxes-mobile-starter repo                                                                                                                  |
| `EAS_TOKEN`                    | Expo Application Services access token (replaces `VERCEL_TOKEN`)                                                                                             |
| `EAS_PROJECT_ID`               | EAS project ID (replaces `VERCEL_ORG_ID`)                                                                                                                    |
| `EXPO_PUBLIC_MOTION_LEVEL`     | 0–4 — controls which animation libraries are mounted (replaces `NEXT_PUBLIC_MOTION_LEVEL`)                                                                   |
| `EXPO_PUBLIC_VISUAL_DIRECTION` | e.g. `glass-future`, `editorial-luxury` (replaces `NEXT_PUBLIC_VISUAL_DIRECTION`)                                                                            |
| ~~`REVALIDATE_SECRET`~~        | **Dropped** — ISR/on-demand revalidation is a Next.js web concept with no mobile equivalent; Apollo's normal cache + `fetchPolicy` handles freshness instead |

> Note: any client-exposed var must use the `EXPO_PUBLIC_` prefix, not `NEXT_PUBLIC_` — Expo only inlines vars with that exact prefix into the bundled app.

---

## File ownership rules

| Files                                 | Owner                | Rule                                                                                                                           |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `lib/mock/`                           | Frontend build       | Never modify after creation                                                                                                    |
| `lib/mock/index.ts` exports           | Frontend build       | **Never change signatures** — `lib/graphql/` must match exactly                                                                |
| `lib/graphql/`                        | CMS seeding (Step 5) | Created after mutations; replaces mock at runtime                                                                              |
| `lib/apollo/client.ts`                | CMS seeding          | Single shared Apollo client instance — setup ONLY, no feature queries/mutations here (those live in `graphql/<domain>/`)        |
| `components/layout/ApolloWrapper.tsx` | CMS seeding          | Apollo `<ApolloProvider>` wrapping the root layout — no `"use client"` directive needed, everything is client-side             |
| `components/**`                       | Frontend build       | Never overwritten by CMS seeding                                                                                               |
| `types/cms.ts`                        | Frontend build       | Shared — neither layer modifies after creation                                                                                 |
| `app.config.ts`                       | Deploy               | Rewritten by `app-config-writer.ts` before every EAS build (replaces `next.config.mjs`)                                        |
| `eas.json`                            | Deploy               | Build/submit profiles rewritten by the same deploy step                                                                        |

---

## Production readiness checklist

### CMS Data

- [ ] All sections have a corresponding Page in erxes
- [ ] Blog posts created and categorized (if `has_blog`)
- [ ] Header and footer menu wired in correct order

### Frontend Code

- [ ] `lib/apollo/client.ts` instantiates a single `ApolloClient` (no `registerApolloClient` — that API is Next.js RSC-only)
- [ ] `components/layout/ApolloWrapper.tsx` wraps the root `app/_layout.tsx` with `<ApolloProvider>`
- [ ] Feature GraphQL operations live only in `graphql/<domain>/queries|mutations` (auth, cms, ecommerce) — never mixed into a shared/global file
- [ ] ~~`generateStaticParams`~~ — **not applicable**; Expo Router resolves dynamic `[slug].tsx` routes at runtime, no static param generation step exists
- [ ] All `useQuery()` calls set an explicit `fetchPolicy` (e.g. `cache-and-network`) instead of a `revalidate` context
- [ ] `_id` (not `id`) in all GraphQL selections
- [ ] No hardcoded API URLs — all use `process.env.EXPO_PUBLIC_*`
- [ ] `npx tsc --noEmit` outputs 0 TypeScript errors, and `eas build --profile preview --local` (or `expo export`) completes cleanly

### Environment

- [ ] `.env` is in `.gitignore`
- [ ] `EXPO_PUBLIC_ERXES_ENDPOINT`, `EXPO_PUBLIC_CLIENT_PORTAL_TOKEN`, `EXPO_PUBLIC_CMS_ID` set in `eas.json` build profile `env` blocks

---

## Project structure

```
scripts/
  clone.ts          tsx scripts/clone.ts "<app-name>"
  erxes-pages.ts    tsx scripts/erxes-pages.ts output/pages.json
  erxes-posts.ts    tsx scripts/erxes-posts.ts output/posts.json
  erxes-menu.ts     tsx scripts/erxes-menu.ts output/menu.json
  deploy.ts         tsx scripts/deploy.ts "<app-name>"        (GitHub + EAS Build/Update)
  github-push.ts    tsx scripts/github-push.ts "<app-name>"  (GitHub only)
lib/                utility functions (clone, mutate, deploy, github push)
agents/             instruction files read by OpenCode
output/             generated apps (gitignored)
store.config.json    filled in during setup (gitignored)
.env                secrets (gitignored)
```
