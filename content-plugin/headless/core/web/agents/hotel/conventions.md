# Hotel Coding Conventions

Domain-specific rules for hotel files only. Generic rules live in `agents/conventions.md`. Do not repeat generic rules here.

## 1. Auth Token Model

- **`x-app-token` = `NEXT_PUBLIC_ERXES_APP_TOKEN` — NOT `NEXT_PUBLIC_ERXES_CP_TOKEN`** (ecommerce name, missing in hotel).
- **No POS token** — no `erxes-pos-token` header, no `NEXT_PUBLIC_POS_TOKEN`. Payments use the erxes gateway (`NEXT_PUBLIC_PAYMENT_IDS`).
- When `has_auth`: the **starter** owns the session token — `localStorage.getItem("token")` in the browser, the `token` cookie on the server, sent as `authorization: Bearer <token>`. Hotel code never reads or writes it. Import the starter's auth hooks from `@/lib/auth/hooks`; do not author a hotel token store.

## 2. No Cart / No delivery_types

- Hotel has **no cart and no delivery types** — booking replaces both.
- Room-detail form → `cpDealsAdd` creates a **deal**, not an order; `productsData` = `[{ productId: <room._id>, quantity: 1, unitPrice, amount }]`.
- No `activeOrderAtom` / `cartItemsAtom` / `deliveryInfoAtom`. Booking state is URL-driven (`dealId`, `nights`, `amount` query params).

## 3. Availability Form — Hard Rule

- The homepage availability form **must NOT call the API directly** — it redirects to `/rooms?checkIn&checkOut&guests`, and the rooms page reads those params and queries `cpPmsRooms` / `cpPmsCheckRooms`.

## 4. Deal-Based Payment Flow

- Flow: `cpDealsAdd (BOOKING_STAGE_ID) -> invoiceCreate -> QR (invoice.transactions) -> invoicesCheck (Boolean) -> cpDealsEdit (PAID_STAGE_ID)`.
- **One payment path only.** The starter's `invoiceCreate` selects `transactions`; there is no redirect field. See §5.
- Invoice `contentType` `"sales:deals"`, `contentTypeId` = deal `_id`. Amount = room price × nights via `calcNights()` — never the `nights * 100` placeholder.
- Deposits: invoice for `full × depositPercent`; display cancellation-policy copy (design brief / FAQ) — no silent auto-fee.

## 5. `invoicesCheck` is a MUTATION returning a Boolean

- Same in hotel and ecommerce — it is a mutation, not a query. Variable is `$id: String!`, field is `invoicesCheck(_id: $id)`.
- It returns a plain **Boolean**: `true` = paid, `false` = not paid. There is no status string, no `{ _id, status, resolvedAt }` object, and no `cpInvoicesCheck` field anywhere in the starter.
- Prefer the starter's `useInvoice().check(invoiceId)` over calling it directly.
- **UNVERIFIED — not to be implemented:** no `redirectUrl` / `redirectUri` anywhere in the starter's invoice surface. Do not send `redirectUri`, do not branch on a redirect field. Payment is QR / `transactions`-based.

## 6. Apollo, auth, and payment are starter-owned — import, never author

- **Never create or rewrite** anything under `src/lib/apollo/`, the auth store, or `src/lib/hooks/useInvoice.ts`. The starter's own rule is "do not rewrite Apollo setup, auth logic, or payment flow."
- Import instead: `getApolloClient()` from `@/lib/apollo/client`, `ApolloClientProvider` from `@/lib/apollo/provider`, `getServerApolloClient()` from `@/lib/apollo/server-client` (**async — always `await`**), `useInvoice` from `@/lib/hooks/useInvoice`.
- **Never send `clientPortalId` or `client-portal-id`** as a header, and never pass `clientPortalId` as a GraphQL variable. `cpPages` / `cpMenus` accept no such argument. All portal scoping comes from the `x-app-token` JWT — a `clientPortalId` header is a silent no-op.
- The header name is `x-app-token`, not `erxes-app-token`.

## 7. Config Checks

- `cms_sections` — build ONLY those CMS pages (`blog` only when `has_blog`); `allow_guest` false → `has_auth` → login/register/forgot-password pages exist, booking requires auth.
- Seeded menu items must carry `kind` (`"header"` / `"footer"`) or `cpMenus(kind)` won't return them.
- **Seed JSON is a strict subset.** Pages take only `section`, `name`, `slug`, `description`, `content`, `translations`. `title`, `lang`, `status`, and `meta` are **ignored** by `scripts/erxes-pages.ts` — in particular there is **no SEO meta support** in the seed scripts.
- Use `_id` everywhere (books/rooms/invoice) — never `id`.