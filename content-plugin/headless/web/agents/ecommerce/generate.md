# Ecommerce Next.js Code Generation Guide

## 0. Design Agnosticism — READ FIRST

This guide is split into focused sub-files. **When building a new storefront, read ALL sub-files in the order listed below before writing any code.** Do not skip any sub-file — every one maps to required pages or features.

| Order | File | Contents | Required |
|-------|------|----------|----------|
| 1 | `generate-setup.md` | Dependencies, utils, constants, env, next.config | Always |
| 2 | `generate-types.md` | TypeScript interfaces | Always |
| 3 | `generate-i18n.md` | i18n routing, request, middleware, messages JSON | Always |
| 4 | `generate-core.md` | Apollo Client, Jotai stores, app layouts | Always |
| 5 | `generate-graphql.md` | GraphQL file map (starter repo — do NOT recreate) | Always |
| 6 | `generate-hooks.md` | SDK hooks (auth, order, payment, queries) | Always |
| 7 | `generate-components.md` | Layout + product components, hand-rolled UI | Always |
| 8 | `generate-pages.md` | Homepage, products, **login**, **profile**, **orders**, **wishlist**, cart | Always |
| 9 | `generate-checkout.md` | **Checkout** + **verify** pages | Always |
| 10 | `generate-cms.md` | Review system, CMS pages (about, blog) | When `has_cms` is true |

**Hard gate:** Do not write any page files until you have read the corresponding sub-file. Generating pages without reading the sub-file produces incomplete, static pages missing auth guards, payment flow, and dynamic data fetching.

---

### Logic layer — follow exactly, do NOT change
- GraphQL queries, mutations, types
- Jotai atoms and store structure
- Hooks (data fetching, mutations, side effects)
- State management patterns
- Apollo client setup
- Auth token flow
- Payment flow sequence

### UI layer — replace with the approved design
- **All Tailwind classNames in the sub-files are from the mak-ecommerce reference project.**
- They are **examples only** — do NOT copy them into the new project.
- Before writing any component, read `design-tokens.json` and `HANDOFF.md` from the approved Pencil design.
- Map every className to the project's design system:

| Reference className | Replace with |
|---|---|
| `bg-card`, `bg-background` | Design token surface colors |
| `border-border` | Design token border color |
| `text-primary`, `text-foreground` | Design token text colors |
| `rounded-xl`, `rounded-2xl` | Design token border-radius scale |
| `shadow-sm`, `shadow-xl` | Design token shadow scale |
| `lg:grid-cols-2`, `lg:grid-cols-3` | Keep layout structure, adjust breakpoints if needed |
| `space-y-4`, `gap-6` | Design token spacing scale |

### Component structure — keep, style differently
Every page and component structure (state, hooks, JSX tree shape) must be preserved. Only the `className` props change.

### Shadcn/ui components
Keep all `Button`, `Input`, `Label`, `Sheet`, `SheetContent` etc. component imports. Only pass different `className` or `variant` props if the design requires it.

---

## Build Checklist

### Design token checks (run before writing any component)
- [ ] `design-tokens.json` уншсан — color, radius, shadow, spacing утгуудыг тогтоосон
- [ ] `HANDOFF.md` уншсан — approved design option тодорхой болсон
- [ ] generate sub-files-ийн жишээ className-уудыг design tokens-оор солисон
- [ ] `globals.css`-д CSS variables (`--color-primary`, `--radius-card` гэх мэт) тодорхойлсон
- [ ] shadcn/ui components (`Button`, `Input`, `Sheet` гэх мэт) design system-тэй нийцүүлсэн

### Logic checks
- [ ] Auth token stored in `sessionStorage` (NOT `localStorage`)
- [ ] Apollo `authLink` reads `sessionStorage` per request
- [ ] `client-auth-token` header used for auth
- [ ] `x-app-token` = `NEXT_PUBLIC_ERXES_CP_TOKEN` (client portal ID)
- [ ] `erxes-pos-token` = `NEXT_PUBLIC_POS_TOKEN` (POS token)
- [ ] POS token in cookie: `pos-config-token`
- [ ] `useCreateInvoice` accepts destructured params (not `IOrder` object)
- [ ] `/verify` auto-polling: `useCallback` + `useEffect` + `setInterval(5000)` идэвхтэй, `paymentStatus === "paid"` болмогц зогсдог
- [ ] `handleCreateInvoice` — `invoiceCreate` + `paymentTransactionsAdd` нэг handler дотор, `paymentStatus` state шинэчилдэг
- [ ] Checkout `deliveryInfo` — `firstName`, `lastName`, `email`, `phone`, `address`, `description` бүгдийг дамжуулдаг
- [ ] `useOrderCUD` patches `_id` into `activeOrder` immediately after `cpOrdersAdd` success
- [ ] `CartDrawer` checks `currentUser` — redirects to `/login` with `redirectAfterLogin` if guest
- [ ] `useLogin` checks `sessionStorage.getItem("redirectAfterLogin")` after successful login
- [ ] `Link` and `useRouter` from `@/i18n/routing` (NOT `next/link`)
- [ ] `useCurrentUser` `fetchPolicy: "network-only"`
- [ ] Login handler: `typeof raw === "string" ? raw : raw?.token`
- [ ] Token saved to `sessionStorage` BEFORE `triggerRefetchUser(true)`
- [ ] `store/order.store.ts` does NOT import from `cart.store.ts`
- [ ] `app/layout.tsx` only returns `children` (no `html`/`body`)
- [ ] `app/[locale]/layout.tsx` has `html`/`body`, `Header`, `Footer`
- [ ] `shadcn@latest init` is NOT run — components created manually
- [ ] Image URLs validated with `isValidUrl` before passing to Next.js `Image`
- [ ] `next.config.mjs`-д `images.remotePatterns` дотор erxes hostname бүртгэгдсэн
