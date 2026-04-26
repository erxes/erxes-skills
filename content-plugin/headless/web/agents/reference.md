# Reference

## erxes mutations

All mutations require the `x-app-token` header. Do not put `clientPortalId` in page/post/menu mutations. Exception: `cpContentCreateCMS` may include `clientPortalId` when creating the CMS.

| Mutation | Input type | Use for |
|---|---|---|
| `cpContentCreateCMS` | `ContentCMSInput` | Create CMS config (run once, returns CMS_ID) |
| `cpCmsPagesAdd` | `PageInput` | CMS pages |
| `cpCmsPostsAdd` | `PostInput` | Blog posts |
| `cpCmsCategoriesAdd` | `PostCategoryInput` | Blog categories |
| `cpCmsTagsAdd` | `PostTagInput` | Tags |
| `cpCmsAddMenu` | `MenuItemInput` | Navigation menu items |
| `cpCmsCustomPostTypesAdd` | `CustomPostTypeInput` | Custom types (product, project, job, event) |

Menu `kind` values: `"header"` · `"footer"` · `"link"` (fallback)

---

## Key env vars

| Var | Purpose |
|---|---|
| `ERXES_ENDPOINT` | erxes GraphQL endpoint |
| `ERXES_APP_TOKEN` | erxes app token (`x-app-token` header for mutations) |
| `ERXES_CLIENT_PORTAL_ID` | Client portal id used during CMS creation |
| `ERXES_CMS_ID` | CMS id returned by `cpContentCreateCMS` |
| `ERXES_LANGUAGE` | Default language (`en`, `mn`, etc.) |
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope — clones starter, pushes generated sites |
| `GITHUB_USERNAME` | GitHub username — generated sites pushed as private repos here |
| `STARTER_REPO_URL` | GitHub URL of the erxes-web-starter repo |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `NEXT_PUBLIC_MOTION_LEVEL` | 0–4 — controls which animation libraries are mounted |
| `NEXT_PUBLIC_VISUAL_DIRECTION` | e.g. `glass-future`, `editorial-luxury` |
| `REVALIDATE_SECRET` | Secret for ISR on-demand revalidation (`/api/revalidate`) |

---

## File ownership rules

| Files | Owner | Rule |
|---|---|---|
| `lib/mock/` | Frontend build | Never modify after creation |
| `lib/mock/index.ts` exports | Frontend build | **Never change signatures** — `lib/graphql/` must match exactly |
| `lib/graphql/` | CMS seeding (Step 5) | Created after mutations; replaces mock at runtime |
| `lib/apollo-client.ts` | CMS seeding | Server Apollo client |
| `lib/apollo-wrapper.tsx` | CMS seeding | Client Apollo provider |
| `components/**` | Frontend build | Never overwritten by CMS seeding |
| `types/cms.ts` | Frontend build | Shared — neither layer modifies after creation |
| `next.config.mjs` | Deploy | Rewritten by `next-config-writer.ts` before every deploy |

---

## Production readiness checklist

### CMS Data
- [ ] All sections have a corresponding Page in erxes
- [ ] Blog posts created and categorized (if `has_blog`)
- [ ] Header and footer menu wired in correct order

### Frontend Code
- [ ] `lib/apollo-client.ts` uses `registerApolloClient`
- [ ] `lib/apollo-wrapper.tsx` is `"use client"` and wraps root layout
- [ ] `generateStaticParams` implemented on all `[slug]/page.tsx` routes
- [ ] All `getClient().query()` calls include `revalidate` in context
- [ ] `_id` (not `id`) in all GraphQL selections
- [ ] No hardcoded API URLs — all use `process.env.NEXT_PUBLIC_*`
- [ ] `next build` outputs 0 TypeScript errors

### Environment
- [ ] `.env` is in `.gitignore`
- [ ] `NEXT_PUBLIC_ERXES_ENDPOINT`, `NEXT_PUBLIC_ERXES_APP_TOKEN`, `NEXT_PUBLIC_ERXES_CMS_ID` set in `next.config.mjs`

---

## Project structure

```
scripts/
  clone.ts          tsx scripts/clone.ts "<site-name>"
  erxes-pages.ts    tsx scripts/erxes-pages.ts output/pages.json
  erxes-posts.ts    tsx scripts/erxes-posts.ts output/posts.json
  erxes-menu.ts     tsx scripts/erxes-menu.ts output/menu.json
  deploy.ts         tsx scripts/deploy.ts "<site-name>"
lib/                utility functions (clone, mutate, deploy, github push)
agents/             instruction files read by OpenCode
output/             generated sites (gitignored)
site.config.json    filled in during setup (gitignored)
.env                secrets (gitignored)
```
