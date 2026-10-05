# Code Conventions

Follow these in every file you write.

## React / Next.js
- **Prefer Server Components** — every page and component is a Server Component by default
- Only add `"use client"` when you truly need browser APIs or React hooks (`useState`, `useEffect`, event handlers)
- **Page components are `async`** — fetch data directly inside them, never use `useQuery` in pages
- Use `<Link href="...">` for all internal navigation — never `<a href="...">`
- Use `next/image` `<Image>` for all images — never `<img>`
- Use `next/font` for fonts — never import fonts from a CDN in CSS
- Keep `"use client"` components small and leaf-level — never wrap a whole page in `"use client"`
- **Do not upgrade the starter's framework stack** — never change `next`, `react`, `react-dom`, Tailwind major versions, or scaffold a new app when working inside `output/<slug>/`
- **Never use `@latest` for framework-affecting tools inside the cloned starter** — that includes `create-next-app`, `shadcn`, and any command that can rewrite config based on a newer Next.js release

## Data fetching from erxes
- **Server Components**: use `getClient().query(...)` directly — no hooks
- **Client Components** (interactive only): use Apollo `useQuery`
- Always include `context: { fetchOptions: { next: { revalidate: 60 } } }` in every `getClient().query()` call
- Always use `_id` (not `id`) in all GraphQL selections
- **Never manually pass `clientPortalId` in `cp*` query or mutation variables** — the Apollo link layer injects it automatically (ecommerce `cmsLink` → variables; hotel `authLink` → headers), and server clients set it directly (`client-portal-id` header). Passing it by hand for a `cp*` operation duplicates the link injection and is not supported. Exceptions where the input explicitly requires it: CMS creation (`cpContentCreateCMS`) and non-`cp` auth mutations (`clientPortalUserLoginWithCredentials`, `clientPortalUserForgotPassword`, etc.) that resolve the portal from it.

## Tailwind CSS
- Match `color_hint` from config as the primary color throughout
- Match `tone` from config:
  - `formal` → clean spacing, muted colors, serif-friendly classes
  - `casual` → rounded corners, bright accents, relaxed spacing
  - `modern` → dark backgrounds, sharp edges, bold typography
  - `traditional` → warm tones, conservative layout
  - `playful` → gradients, large rounded, vibrant colors
- Mobile-first — all layouts must be responsive

## TypeScript
- Never use `any` — use proper types or `unknown` with narrowing
- Never use `id` — erxes always returns `_id` (MongoDB ObjectId)

## Styling
- Never hardcode hex colors — use CSS variables (`var(--color-accent)`) or Tailwind token classes
- No inline styles — Tailwind classes only

## Content
- Never write lorem ipsum — all placeholder content must be real text in the site's language
- No hardcoded text — all copy comes from erxes CMS or config language

## File structure
- Components in `components/` — one file per component, PascalCase
- Run `pnpm build` after generating all files — fix all TypeScript and ESLint errors before reporting done
