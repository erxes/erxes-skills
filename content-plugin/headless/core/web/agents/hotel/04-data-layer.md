# TASK 04 — Data Layer: starter `src/graphql/*` + `@/lib/apollo/*`, `src/store`, `src/types`, hooks, auth

**Scope.** `src/graphql`, `src/lib`, `src/store`, `src/types`, every custom hook under `src/`, codegen configuration, the Apollo/GraphQL setup, the middleware parts that touch auth/tokens, and the dead `src/components/appointment/graphql/*` duplicates identified in TASK 03. Read-only analysis; no project file was modified. All values in §11 are **redacted** — names and types only.

> **TARGET LAYOUT (FIXED) — generate against the starter, not `src/sdk/*`.**
> The starter that `scripts/clone.ts` produces already ships the data layer; extend it, do not rebuild it:
> - **Documents:** `src/graphql/hotel/queries/{rooms,booking,index}.ts`, `src/graphql/hotel/mutations/{booking,index}.ts`; shared `src/graphql/auth/**` + `src/graphql/cms/**` reused as-is.
> - **Shared payment ops:** `src/graphql/ecommerce/{queries,mutations}/payment.ts`.
> - **Apollo clients:** `@/lib/apollo/client.ts` (browser factory), `@/lib/apollo/provider.tsx` (provider), `@/lib/apollo/server-client.ts` (RSC/server).
> - **Canonical payment ops (starter names, use these):** `invoiceCreate` (const `INVOICE_CREATE`), `invoicesCheck` (**mutation**, const `INVOICES_CHECK`), `paymentTransactionsAdd` (const `PAYMENT_TRANSACTIONS_ADD`), `cpPayments` (const `CP_PAYMENTS`), `invoiceUpdated`/`transactionUpdated` subscriptions. The `cpInvoiceCreate` / `cpInvoicesCheck` / `cpInvoices` names used below are **Tegri Gobi reference names — do not use them.**
> - **Never author** `src/sdk/getClient.tsx`, `src/sdk/graphql/*`, `src/sdk/queries/*`, `src/sdk/hooks/*`, `src/sdk/mutations/*`, or `src/app/[locale]/ApolloClient.tsx`. Every such path in this file is the **Tegri Gobi reference project — reference only, do not copy.**

---

## TABLE OF CONTENTS

- [1. BACKEND IDENTIFICATION](#1-backend-identification)
- [2. DATA CLIENT SETUP](#2-data-client-setup)
- [3. CODEGEN](#3-codegen)
- [4. OPERATIONS CATALOG](#4-operations-catalog)
- [5. HOOKS](#5-hooks)
- [6. STATE (`src/store`)](#6-state-srcstore)
- [7. TYPES (`src/types`)](#7-types-srctypes)
- [8. SERVER vs CLIENT FETCHING](#8-server-vs-client-fetching)
- [9. API CONTRACT](#9-api-contract)
- [10. REPRODUCE vs AVOID RULES](#10-reproduce-vs-avoid-rules)
- [11. BRAND-SPECIFIC HARDCODING AUDIT](#11-brand-specific-hardcoding-audit)
- [Open Questions / Uncertainties](#open-questions--uncertainties)

---

## 1. BACKEND IDENTIFICATION

### Verdict

**The backend is erxes SaaS** — specifically an erxes **client-portal + PMS + CMS + POS + TMS** stack, reached through erxes' `gateway` GraphQL endpoint on a tenant-hosted erxes instance. It is *not* a custom API and it is *not* a headless CMS; the CMS, commerce, CRM, payments and booking pipelines are all erxes modules.

There is no SDK dependency on erxes in `package.json` — the integration is raw GraphQL over a `gql` tag. The only HTTP-layer dependency is `@apollo/client@^3.13.9`.

### Evidence

| # | Evidence | Cite |
|---|---|---|
| 1 | The API base is an erxes tenant host: `NEXT_PUBLIC_SAAS_DOMAIN` points at an erxes SaaS instance, and `NEXT_PUBLIC_MAIN_API_DOMAIN` is that same host plus `/gateway`. GraphQL is then appended → `<tenant>/gateway/graphql`. | `next.config.ts:6-7`, `src/app/[locale]/ApolloClient.tsx:21`, `src/sdk/getClient.tsx:7` |
| 2 | Operation names use erxes' client-portal prefix `clientPortal*` (22 occurrences) and the `Cp*` / `cp*` casing used by erxes' client-portal schema: `clientPortalUserLoginWithCredentials`, `clientPortalCurrentUser`, `clientPortalRefreshToken`, `CpDealsAdd`, `cpPmsBranchList`, `cpWidgetSaveLead`. | `src/sdk/graphql/auth/mutations.ts`, `src/sdk/graphql/sales/mutations.ts`, `src/sdk/graphql/config/queries.ts`, `src/sdk/graphql/forms/mutations.ts` |
| 3 | Entity names are erxes entities: `deals`, `cpDealDetail`, `salesPipelineDetail`, `salesPipelineLabels`, `salesStages`, `customers`, `productCategories`, `knowledgeBaseArticles`, `cpMenus`, `cpPages`, `cpPost`, `cpTags`, `invoices`, `payments`. | `src/sdk/graphql/sales/queries.ts`, `src/sdk/graphql/cms/queries.ts`, `src/sdk/graphql/payments/queries.ts` |
| 4 | Auth is erxes' **client portal** (site visitors), not erxes' internal `userId` auth. The JWT sent as `x-app-token` carries `clientPortalId` in its payload, and the per-user token is sent as `client-auth-token`. | `src/app/[locale]/ApolloClient.tsx:50-61`, `next.config.ts:8-9` |
| 5 | A second erxes-only header is sent on every request: `erxes-pos-token` (a POS-specific token), whose value is **hardcoded in source**, not from env. | `src/app/[locale]/ApolloClient.tsx:57` |
| 6 | The greeting config and branch model come from erxes' **PMS** module: `pmsBranchList`, `cpPmsBranchDetail`, `roomCategories`, `checkintime`, `checkouttime`. | `src/sdk/graphql/config/queries.ts`, `src/sdk/graphql/rooms/queries.ts`, `src/containers/config/currentConfig.tsx` |
| 7 | Tours come from erxes' **TMS** module: `cpBmsBranchList`, `cpBmsTours`, `cpBmsTourDetail`, `cpBmsItineraryDetail`, `cpBmsOrderAdd`. `BMS` = erxes booking-management. | `src/sdk/graphql/tms/queries.ts`, `src/sdk/graphql/tms/mutations.ts` |
| 8 | Booking state is an erxes **sales board pipeline**: `cpSalesBoards`, `cpSalesPipelines`, `cpSalesStages`, `cpSalesPipelineLabels`, `pipelineId`, `stageId`, `boardId`. | `src/sdk/graphql/sales/queries.ts` |
| 9 | Contact/tour forms are erxes **widgets**: `CpFormDetail`, `CpWidgetsSaveLead`, `formId`. | `src/sdk/graphql/forms/*`, `src/components/contact-us/ContactForm.tsx` |
| 10 | Uploaded media is served by erxes' `read-file` gateway route. | `src/lib/utils.ts:19`, `:43-65` |
| 11 | 35 files under `src/` contain the string `erxes`, including component names `ErxesFormModal`, `ErxesWidget`, `ErxesLogoIcon`, and constants `ERXES_SASS`, `ERXES_API_URL`. | whole-tree grep |

### erxes-specific concepts used — **names only**

Every erxes-specific identifier the data layer touches. Values are in `next.config.ts:6-20` and in the header literal at `src/app/[locale]/ApolloClient.tsx:57`; they are intentionally **not reproduced here** (see §11).

**Identity / auth**

| Concept | Type | Read at |
|---|---|---|
| `NEXT_PUBLIC_ERXES_APP_TOKEN` | JWT containing `clientPortalId` — sent as `x-app-token` | `ApolloClient.tsx:56`, `sdk/getClient.tsx:14`, `sdk/mutations/auth.tsx:18` (indirectly) |
| `NEXT_PUBLIC_CP_ID` | erxes client-portal id | `sdk/queries/cms.tsx:75`, `:88`; `sdk/mutations/auth.tsx:18` |
| `NEXT_PUBLIC_PMS_TOKEN` | erxes PMS API token, used as a **query variable** (`{ id: <pmsToken> }`) | `sdk/queries/rooms.tsx:19`, `:31`; `containers/config/currentConfig.tsx:17` |
| `NEXT_PUBLIC_BRANCH_ID` | erxes branch id | `sdk/hooks/useRoomPricing.tsx:51` |
| `NEXT_PUBLIC_TMS_BRANCH_ID` | erxes TMS/BMS branch id | `sdk/queries/tms.tsx:18`, `:82` |
| `NEXT_PUBLIC_ERXES_API_URL` | erxes REST base for the OAuth refresh route — **referenced but never defined** | `lib/utils.ts:203` (**dead code**) |
| `erxes-app-token` / `erxesAppToken` | branch-level erxes app token, selected from `cpPmsBranchList` | `appointment/graphql/queries/branches.ts` (**dead duplicate**), `sdk/graphql/config/queries.ts` |
| `clientPortalId` | GraphQL variable, per-operation | `sdk/queries/cms.tsx:75,88`; `sdk/graphql/auth/mutations.ts` |
| `client-auth-token` | request header carrying the per-user JWT | `ApolloClient.tsx:58` |
| `erxes-pos-token` | request header, POS token, **hardcoded literal** | `ApolloClient.tsx:57` |
| `x-app-token` | request header carrying the client-portal JWT | `ApolloClient.tsx:56`, `sdk/getClient.tsx:14` |
| `sessionStorage` keys `token`, `refreshToken`, `refetchToken` | per-user JWT pair (note the `refetchToken` alias) | `ApolloClient.tsx:41-47,78-84`, `sdk/mutations/auth.tsx:62-64,180-182,229-231` |
| `integrationId` | erxes integration on a customer record | `appointment/graphql/mutations/customerAdd.ts` (**dead duplicate**) |

**Sales / pipeline (booking = a deal on a pipeline)**

| Concept | Type | Cite |
|---|---|---|
| `NEXT_PUBLIC_PMS_PIPELINE_ID` | erxes sales pipeline id (exposed via `NEXT_PUBLIC_PMS_PIPELINE_ID` in `env`, inlined for the client) | `next.config.ts:13` |
| `NEXT_PUBLIC_REQUEST_STAGE_ID` | pipeline stage — booking requested | `next.config.ts:14` |
| `NEXT_PUBLIC_PENDING_STAGE_ID` | pipeline stage — pending | `next.config.ts:15` |
| `NEXT_PUBLIC_PAID_STAGE_ID` | pipeline stage — paid | `next.config.ts:16` |
| `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID` | pipeline stage — pay at property | `next.config.ts:17` |
| `pipelineId` / `stageId` / `boardId` | GraphQL variables | `sdk/graphql/sales/queries.ts` (81 / 27 / 16 occurrences tree-wide) |
| `salesPipelineDetail`, `salesPipelineLabels`, `salesStages` | erxes sales entities | `sdk/graphql/sales/queries.ts` |
| `productsData`, `paymentsData`, `customFieldsData` | erxes `JSON` scalars on a deal | `sdk/graphql/sales/mutations.ts` |
| `conformityEdit` | erxes customer↔deal conformity mutation | `sdk/graphql/sales/mutations.ts` |
| `labelIds` / `tagIds` | erxes label/tag sets | `sdk/graphql/sales/mutations.ts` |
| `posChooseConfig` | erxes POS config mutation | `sdk/graphql/auth/mutations.ts` |

**CMS / forms / media**

| Concept | Type | Cite |
|---|---|---|
| `clientPortalId` | CMS operation variable (tenant scoping) | `sdk/queries/cms.tsx:75,88` |
| `cpMenus` / `cpPages` / `cpPost` / `cpTags` / `cpCategories` | erxes CMS entities | `sdk/graphql/cms/queries.ts` |
| `formId` | erxes widget form id (17 occurrences) | `sdk/graphql/forms/*`, `PayAtPropertyForm.tsx:14`, `CreateOwnTripForm.tsx:15` |
| `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` | env name for a widget form id — **undefined**, falls back to a literal | `components/booking/PayAtPropertyForm.tsx:14` |
| `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID` | env name for a widget form id — **undefined**, falls back to a literal | `components/clientPages/toursPage/CreateOwnTripForm.tsx:15` |
| `cpWidgetsSaveLead` / `cpFormDetail` | erxes lead-capture ops | `sdk/graphql/forms/mutations.ts`, `forms/queries.ts` |
| `read-file` gateway route + `ERXES_SASS` path segment | media | `lib/utils.ts:19-20,43-65` |
| `customFieldsData` | CMS custom-field JSON | `lib/cms.ts`, `sdk/graphql/cms/queries.ts` |
| `contentType` / `contentTypeId` | erxes polymorphic ref (invoice, ticket) | `sdk/graphql/payments/*` |

**Other erxes modules in use**

| Module | Operations | Cite |
|---|---|---|
| **Payments** | `cpInvoiceCreate`, `cpInvoicesCheck`, `cpInvoices`, `cpPayments`, `invoiceDetail`, `paymentTransactionsAdd` — **reference names**; starter uses `invoiceCreate`, `invoicesCheck` (mutation), `paymentTransactionsAdd`, `cpPayments` | `sdk/graphql/payments/*` |
| **POS** | `poscProducts`, `poscProductDetail`, `poscProductCategories` | `sdk/graphql/pos/queries.ts` |
| **KB** | `knowledgeBaseArticles`, `knowledgeBaseCategories` | `sdk/graphql/kb/queries.ts` |
| **Reviews / tickets** | `cpCreateTicket`, `cpGetTickets` | `sdk/graphql/reviews/*` |
| **Pricing** | `cpPricingPlans`, `cpPricingPlanDetail` | `sdk/graphql/pricing/queries.ts` |
| **Customers** | `customersMain`, `customersAdd` | `sdk/graphql/customers/*` |
| **Config / PMS** | `pmsBranchList`, `cpPmsBranchDetail` | `sdk/graphql/config/queries.ts` |
| **Social login** | `clientPortalFacebookAuthentication`, `clientPortalGoogleAuthentication`, `clientPortalLoginWithSocialPay` | `sdk/graphql/auth/mutations.ts` |
| **Google Places** | `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACE_ID` (non-erxes but tenant config) | `next.config.ts:19-20` |

### Operation census

Counted by parsing every `gql` document under `src/` (regex on `query|mutation|subscription` + operation name, with the selection set extracted by brace matching): **99 operation documents** — 56 `query`, 41 `mutation`, 2 `subscription`.

| Location | Documents | Composition |
|---|---|---|
| `src/sdk/graphql/**` | **81** | 49 queries, 32 mutations |
| `src/components/appointment/graphql/**` | **15** | 6 queries, 7 mutations, 2 subscriptions — **dead** (§3.4) |
| `components/booking/payment/payment-detail.tsx` | 2 | inline queries, live |
| `components/contact-us/ContactForm.tsx` | 2 | 1 query + 1 mutation, live, duplicating `sdk/graphql/forms/*` |
| `containers/auth/current-user.tsx` | 1 | inline query, live |
| `app/[locale]/ApolloClient.tsx` | 1 | `ClientPortalRefreshToken` mutation, live |
| **Total** | **99** | |

Counting only **distinct** `(kind, operationName)` pairs there are **85** — **14 documents repeat an operation name** already defined elsewhere in `src/`. The 14 are listed with their duplicate partners in §4. The largest cluster is the dead `appointment/graphql/` tree colliding with `sdk/graphql/`.

---

## 2. DATA CLIENT SETUP

### 2.1 Client library and version

| Item | Value | Cite |
|---|---|---|
| Client | `@apollo/client` `^3.13.9` | `package.json:5` |
| Router | Next.js `15.4.10`, App Router | `package.json:46` |
| React | `19.1.0` | `package.json:48` |
| GraphQL SDL | `graphql` `^16.11.0` | `package.json:40` |
| Subscriptions | `graphql-ws` `^6.0.6` | `package.json:41` |
| SSR integration | `@apollo/experimental-nextjs-app-support` `^0.12.3` — **declared but never imported anywhere in `src/`** | `package.json:6`; whole-tree grep = 0 hits |
| Cache | `InMemoryCache`, default policies (no typePolicies, no possibleTypes) | `ApolloClient.tsx:146`, `sdk/getClient.tsx:23` |
| Fetch | Apollo's built-in `fetch`; no custom `fetch` anywhere in the data layer | `sdk/getClient.tsx:8` |

**There are two independent Apollo clients, plus a third unused factory.** The default export of `ApolloClient.tsx` and its named `client` are what the app actually uses; `sdk/getClient.tsx` builds a separate `ssrMode: true` client used only by the 8 `await`-style SDK functions.

> **DO NOT AUTHOR any of this.** The generator uses the starter's `@/lib/apollo/{client.ts,provider.tsx,server-client.ts}` — a browser factory + a React provider + an RSC client. The two-client Tegri Gobi setup below (and its `wsLink`/`errorLink`/hardcoded `erxes-pos-token` header) is **reference only, do not copy**.

### 2.2 Client creation

#### Browser/global client — REFERENCE ONLY, do not copy (`src/app/[locale]/ApolloClient.tsx`, 163 lines)

```tsx
"use client";

import { ReactNode } from "react";
import {
  ApolloLink,
  ApolloClient,
  FetchResult,
  HttpLink,
  InMemoryCache,
  ApolloProvider,
  gql,
  split,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition, Observable } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const httpLink: any = new HttpLink({
  uri: `${process.env.NEXT_PUBLIC_MAIN_API_DOMAIN}/graphql`,
  credentials: "include",
});

const REFRESH_TOKEN = gql`
  mutation ClientPortalRefreshToken($refreshToken: String!) {
    clientPortalRefreshToken: clientPortalUserRefreshToken(
      refreshToken: $refreshToken
    )
  }
`;

const isRefreshRequest = (operation: { operationName?: string }) =>
  operation.operationName === "ClientPortalRefreshToken";

const getOperationToken = (operation: { operationName?: string }) => {
  if (typeof window === "undefined") return "";

  if (isRefreshRequest(operation)) {
    return (
      sessionStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refetchToken") ||
      ""
    );
  }

  return sessionStorage.getItem("token") || "";
};

const authLink = setContext((operation, { headers }) => {
  const token = getOperationToken(operation);

  return {
    headers: {
      ...headers,
      "x-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN,
      "erxes-pos-token": "kud5j2RRoQxus1gN5xUzEyhwPLn8h0DT",
      ...(token ? { "client-auth-token": token } : {}),
    },
  };
});

const refreshAccessToken = async () => {
  const refreshToken =
    sessionStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refetchToken") ||
    "";

  if (!refreshToken) return "";

  try {
    const response = await client.mutate({
      mutation: REFRESH_TOKEN,
      variables: { refreshToken },
    });
    const token = response.data?.clientPortalRefreshToken || "";

    if (token) sessionStorage.setItem("token", token);

    return token;
  } catch (error) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refetchToken");
    throw error;
  }
};

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  const shouldRefresh = graphQLErrors?.some(
    (error) =>
      error.message === "token expired" ||
      error.extensions?.code === "SUBREQUEST_HTTP_ERROR",
  );

  if (!shouldRefresh || isRefreshRequest(operation)) return;

  return new Observable<FetchResult>((observer) => {
    void (async () => {
      try {
        const token = await refreshAccessToken();

        if (!token) throw new Error("Your session has expired");

        forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
      } catch (error) {
        observer.error(error);
      }
    })();
  });
});

const wsLink: any =
  typeof window !== "undefined"
    ? new GraphQLWsLink(
        createClient({
          url: process.env.NEXT_PUBLIC_MAIN_SUBS_DOMAIN || "",
        }),
      )
    : null;

const httpLinkWithMiddleware = authLink.concat(httpLink);

type Definintion = {
  kind: string;
  operation?: string;
};
const splitLink =
  typeof window !== "undefined"
    ? split(
        ({ query }) => {
          const { kind, operation }: Definintion = getMainDefinition(query);
          return kind === "OperationDefinition" && operation === "subscription";
        },
        wsLink,
        httpLinkWithMiddleware,
      )
    : httpLinkWithMiddleware;

export const client = new ApolloClient({
  ssrMode: typeof window === "undefined",
  cache: new InMemoryCache(),
  link: ApolloLink.from([errorLink, splitLink]),
});

export function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      fetch,
    }),
    cache: new InMemoryCache(),
  });
}

const Apollo = ({ children }: { children: ReactNode }) => (
  <ApolloProvider client={client}>{children}</ApolloProvider>
);

export default Apollo;
```

> **Redaction note.** Line 57 contains a literal `erxes-pos-token` value. It is reproduced above only because this file is cited as the reference implementation and the consumer agent needs to see *that a header is sent unconditionally*; the value itself is a secret and must be replaced with an env var (rule A21). Treat the printed string as `[REDACTED — erxes POS token]` if you are copying this report into a shared artifact.

#### Server client — REFERENCE ONLY, do not copy (`src/sdk/getClient.tsx`, 25 lines). The starter's equivalent is `@/lib/apollo/server-client.ts`.

```tsx
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

export function getClient() {
  const httpLink = new HttpLink({
    uri: `${process.env.NEXT_PUBLIC_MAIN_API_DOMAIN}/graphql`,
    fetch,
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        "x-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN,
        "Cache-Control": "no-cache",
      },
    };
  });

  return new ApolloClient({
    ssrMode: true,
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}
```

**Differences between the two clients**

| Property | `ApolloClient.tsx` `client` | `sdk/getClient.tsx` `getClient()` |
|---|---|---|
| Lifetime | module singleton | **new client on every call** → new cache every call, no dedup |
| `ssrMode` | `typeof window === "undefined"` | always `true` |
| `credentials` | `"include"` (sends cookies) | omitted (browser default) |
| `x-app-token` | yes | yes |
| `erxes-pos-token` | yes, hardcoded | **absent** |
| `client-auth-token` | yes, from `sessionStorage` | **absent** — server client is anonymous |
| `Cache-Control` | absent | `no-cache` |
| `errorLink` (token refresh) | yes | **absent** |
| `splitLink` / WS | yes | **absent** |
| `uri` | `<MAIN_API_DOMAIN>/graphql` | same |

**Consequence:** the 8 SDK functions that call `await getClient().query(...)` run **without an identity token**. They send only `x-app-token` (the portal-level JWT) and rely on the erxes operations being publicly readable for an anonymous portal session. They also have no `errorLink`, so a 401 in one of those calls is never refreshed — it is surfaced straight to the caller.

### 2.3 Link chain

```
errorLink  →  splitLink  →  [ wsLink | authLink → httpLink ]
   ^                             ^                       ^
   |                             |                       |
 token refresh             subscriptions            `x-app-token`,
 on "token expired"        only when                 `erxes-pos-token`,
 or SUBREQUEST_HTTP_ERROR  window exists             `client-auth-token`
```

Cite: `ApolloClient.tsx:89` (`errorLink`), `:132-142` (`splitLink`), `:50` (`authLink`), `:20` (`httpLink`), `:147` (`ApolloLink.from([errorLink, splitLink])`).

**Observations**

- `httpLink` and `wsLink` are annotated `: any` (`ApolloClient.tsx:20`, `:117`).
- `splitLink` degrades to `httpLinkWithMiddleware` during SSR, so `wsLink` is `null` on the server but still passed to `split()` only in the browser branch — correct.
- `errorLink` is chained **outside** `splitLink`, so a refresh attempt also covers WS operations.
- `refreshAccessToken` (`:63`) closes over `client` before `client` is initialised (TDZ). It is only *called* from `errorLink` after module evaluation, so it works — but it is a temporal dead zone waiting to bite if anything invokes it eagerly.

### 2.4 Auth header handling and token storage

**Three mutually incompatible token mechanisms exist.**

| # | Store | Keys | Written by | Read by | Live? |
|---|---|---|---|---|---|
| 1 | `sessionStorage` | `token`, `refreshToken`, `refetchToken` | `sdk/mutations/auth.tsx:62-64` | `ApolloClient.tsx:41-47,65-67` (auth header + refresh), `containers/auth/current-user.tsx:45` | **YES — the real one** |
| 2 | `localStorage` | `access_token`, `refresh_token`, `token_expiry` | `lib/utils.ts:177-180` (`saveTokens`) | `lib/utils.ts:159,166,186` | **NO — zero consumers outside `lib/utils.ts`** |
| 3 | HTTP cookie | `company_signup_unlocked` | `app/api/company-signup/unlock/route.ts:18` | `app/[locale]/(auth)/company-signup/page.tsx:29` | yes, but advisory only (see TASK 03 A42) |

`ApolloClient.tsx:50-61` — the header assembly:

| Header | Source | Always sent? |
|---|---|---|
| `x-app-token` | `NEXT_PUBLIC_ERXES_APP_TOKEN` (inlined by Next) | yes |
| `erxes-pos-token` | **literal in source** | yes |
| `client-auth-token` | `sessionStorage.token` | only when present |

**Refresh flow** (`ApolloClient.tsx:63-115`): `errorLink` inspects `graphQLErrors` for `message === "token expired"` **or** `extensions.code === "SUBREQUEST_HTTP_ERROR"`; on match it calls `refreshAccessToken()`, which mutates `ClientPortalRefreshToken`, stores the new `token`, and re-forwards the original operation. On failure it clears all three `sessionStorage` keys and errors the observer with `"Your session has expired"`.

**Defects in this flow**

1. `sessionStorage` is **per-tab**. A user opening the site in a second tab is signed out in that tab, even though the first tab is signed in. It also dies on tab close, so there is no persistent session at all.
2. `refetchToken` (`ApolloClient.tsx:42`, `:66`, `:84`; `sdk/mutations/auth.tsx:64,182,231`) is a typo-alias of `refreshToken`. Both are written with the same value and both are read as fallbacks. It exists purely to satisfy two spellings.
3. Refresh detection is by **string equality on `error.message`** (`:92`) — locale- or version-fragile.
4. `SUBREQUEST_HTTP_ERROR` is erxes' gateway's generic error; the client will attempt a token refresh for *any* gateway-side HTTP failure, not only auth failures.
5. There is no single-flight guard: concurrent 401s each trigger their own refresh mutation.
6. `Cache-Control: no-cache` is set only on `getClient()`, not the main client, so the two paths have different cache semantics against the same endpoint.

### 2.5 Endpoint config

| Purpose | Expression | Defined? | Cite |
|---|---|---|---|
| GraphQL HTTP | `${NEXT_PUBLIC_MAIN_API_DOMAIN}/graphql` | yes (`next.config.ts:7`) | `ApolloClient.tsx:21`, `sdk/getClient.tsx:7` |
| GraphQL WS | `NEXT_PUBLIC_MAIN_SUBS_DOMAIN \|\| ""` | **NO — undefined anywhere** → `createClient({url: ""})` | `ApolloClient.tsx:121` |
| erxes SaaS root | `NEXT_PUBLIC_SAAS_DOMAIN` | yes (`next.config.ts:6`) | used by widget/media code |
| erxes REST OAuth | `${NEXT_PUBLIC_ERXES_API_URL}/oauth/refresh` | **NO — undefined** | `lib/utils.ts:203` (**dead**) |
| Media read | `${NEXT_PUBLIC_MAIN_API_DOMAIN}/read-file?key=` | yes | `lib/utils.ts:19,43-65` |
| Image CDN | `https://imagedelivery.net/` | hardcoded | `components/ui/image.tsx:63`, `src/lib/image-loader.tsx` |
| Legacy media | `https://local.omz.mn/gateway/read-file?key=` | **hardcoded foreign dev host** | `lib/utils.ts:155` (`readFileSchedule`, dead) |

All `NEXT_PUBLIC_*` values are **inlined into the browser bundle at build time** by `next.config.ts`'s `env:` block — there is no runtime secret and no `.env` file in the repo (`.gitignore` excludes `.env*`).

### 2.6 Locale handling in requests

**Locale is never sent to the backend.** Verified:

- `src/middleware.ts` (7 lines) is `createMiddleware(routing)` from `next-intl` plus a `config.matcher` that excludes `api`, `trpc`, `_next`, `_vercel`, and any path containing a dot. It does **no** auth or token work — it only negotiates locale.
- `src/i18n/request.ts` resolves `requestLocale` → `routing.locales` (`['en','mn']`) → `defaultLocale` (`'en'`), then loads `messages/${locale}.json`. Nothing is attached to a request header or GraphQL variable.
- Grep for `locale` under `src/sdk/` returns exactly one hit, and it is an import (`sdk/mutations/auth.tsx:3`), not a request field.
- There is no `accept-language`, no `x-locale`, and no locale variable in any of the 99 operations.

**Consequence for §8:** every translated piece of content (CMS posts, product names, tour names, KB articles) must be either fetched per-locale by a **different query variable** (e.g. `language`, `slug`, `parentId`) or returned once with all translations inline. Some TMS operations do the latter: `cpBmsTours` returns a `translations` field (`sdk/graphql/tms/queries.ts`). Most CMS operations do not — they take a `slug` that the caller must supply per locale (`sdk/queries/cms.tsx:75,88`), which is why `refetch()`-on-locale-change is repeated in 14 components (TASK 03 A49).

---

## 3. CODEGEN

### 3.1 Verdict

**There is no GraphQL code generator.** The data layer is 100% hand-written.

| Check | Result |
|---|---|
| `codegen.yml` / `codegen.ts` / `codegen.cjs` / `graphql.config.*` | **not present** (root and tree search) |
| `@graphql-codegen/*` in `package.json` | **absent** (deps and devDeps) |
| `graphql-codegen` npm script | **absent** — scripts are only `dev`, `build`, `start`, `lint` |
| `.graphql` / `.gql` documents on disk | **0 files** |
| `__generated__/` directories | **0** |
| `*.generated.ts` / `graphql.ts` outputs | **0** |
| `gql` template tags in `.ts` files | present — all documents live in `.ts` files |

Verdict matches `01-architecture.md:66` ("Data layer — GraphQL only, hand-written, **no codegen**").

### 3.2 Where the documents live

| Location | `gql` documents | Role |
|---|---|---|
| `src/sdk/graphql/<domain>/{queries,mutations}.ts` | **81** (49 queries + 32 mutations) | the real, live schema documents, grouped by erxes module |
| `src/sdk/graphql/<domain>/index.ts` | 0 | barrel: `export { default as queries } from "./queries"` + `mutations` |
| `src/components/appointment/graphql/{queries,mutations}/*.ts` | **15** (6 queries + 7 mutations + 2 subscriptions) | **dead duplicates** — see §3.4 |
| `src/app/[locale]/ApolloClient.tsx` | 1 (`ClientPortalRefreshToken`) | auth refresh, inline |
| `src/components/contact-us/ContactForm.tsx` | 2 (`CpFormDetail`, `CpWidgetsSaveLead`) | inline, duplicating `sdk/graphql/forms/*` |
| `src/components/booking/payment/payment-detail.tsx` | 2 | inline, live |
| `src/containers/auth/current-user.tsx` | 1 | inline, live |
| **Total** | **99** | |

Per-domain document counts inside `src/sdk/graphql/`: `auth` 15 mutations + 4 queries, `sales` 9 + 10, `cms` 8 queries, `rooms` 4, `tms` 4 + 2, `config` 2, `payments` 2 + 3, `pos` 3, `pricing` 2, `products` 2, `customers` 2 + 1, `kb` 2, `forms` 1 + 3, `reviews` 1 + 1.

Note: `src/sdk/graphql/{cms,config,kb,pos,pricing,products,rooms}/mutations.ts` are **7 empty files** containing only an empty `export default {}`-style stub (0 `gql` tags). They exist to satisfy the barrel shape, not because those modules have no mutations.

### 3.3 Which files are generated vs hand-written

| File class | Generated? |
|---|---|
| Everything under `src/sdk/graphql/**` | hand-written |
| Everything under `src/sdk/{queries,mutations,hooks}/*.tsx` | hand-written |
| `src/types/*.ts` | hand-written (no `Pick<>` from a schema, no `Maybe<>`) |
| `src/store/*.ts` | hand-written |
| Any `.ts` in this repo | hand-written — nothing is emitted by a tool |

Because there is no generator, **there is no compile-time link between the documents and the server schema**. A renamed or removed field compiles cleanly and fails at runtime. That is the single largest structural risk in this data layer.

### 3.4 `src/sdk/graphql/` vs the dead `appointment/graphql/*` — which is the source of truth

**`src/sdk/graphql/` is the source of truth.** `src/components/appointment/graphql/` is a stale, orphaned copy.

| Test | `src/sdk/graphql/*` | `src/components/appointment/graphql/*` |
|---|---|---|
| Document count | **81** (49q+32m) across 21 files | **15** (6q+7m+2s) across 10 files |
| Modules | 14 erxes domains: `auth`, `cms`, `config`, `customers`, `forms`, `kb`, `payments`, `pos`, `pricing`, `products`, `reviews`, `rooms`, `sales`, `tms` | only `mutations/{addDeal,customerAdd,dealsRemove,editDeal,invoice}.ts` and `queries/{branches,deal,productCategories,products,users}.ts` |
| Reachable? | imported by `src/sdk/queries/*`, `src/sdk/mutations/*`, `src/sdk/hooks/*`, and 7 component/container files (§4) | 9 of the 10 files have **0 importers or are reachable only through dead hooks**; only `mutations/invoice.ts` → `invoicesCheckMutation` is live (imported at `components/appointment/payment/paymentPage.tsx:18`) |
| Duplicates the SDK? | n/a | **yes, all 10** — same operation names, same root fields |
| Under `src/components/`? | no | **yes** — documents live inside the UI tree |

Concrete duplication pairs (same root field defined twice):

| Duplicate in `appointment/graphql/` | Real definition in `sdk/graphql/` |
|---|---|
| `mutations/addDeal.ts` → `CpDealsAdd` → `cpDealsAdd` | `sales/mutations.ts:25` → `cpDealsAdd` |
| `mutations/editDeal.ts` → `CpDealsEdit` → `cpDealsEdit` | `sales/mutations.ts:35`, `:91` → `cpDealsEdit` |
| `queries/deal.ts` → `CpDeals` → `cpDeals` | `sales/queries.ts:43` → `cpDeals` |
| `queries/productCategories.ts` → `cpProductCategories` | `products/queries.ts:4` → `cpProductCategories` |
| `queries/products.ts` → `cpProducts` | `products/queries.ts:19` **and** `rooms/queries.ts:11,118` (three copies of `cpProducts` in total) |
| `queries/branches.ts` → `CpPmsBranchList` → `cpPmsBranchList` | `config/queries.ts` → `pmsBranchList` / `cpPmsBranchDetail` |
| `mutations/invoice.ts` → `CpInvoiceCreate`, `CpInvoicesCheck` | `payments/mutations.ts` → `cpInvoiceCreate`, `cpInvoicesCheck` |
| `mutations/customerAdd.ts` → `customersAdd` | `customers/mutations.ts` → `customersAdd` |
| `queries/users.ts` → `users` | **no SDK counterpart** (only copy) |
| `mutations/dealsRemove.ts` → `dealsRemove` | **no SDK counterpart** (only copy) |

**Which is authoritative for schema shape?** The SDK copy: it is the layer the whole live data path imports (`src/sdk/queries/*`, `src/sdk/mutations/*`, `src/sdk/hooks/*`, plus 7 direct component/container imports), while the duplicate tree is imported by essentially nobody. But note the divergence: `appointment/graphql/queries/products.ts` selects `uom` and `attachment{}`, while `sdk/graphql/products/queries.ts:19` selects a different field set — so the two are **not** interchangeable, and deleting the duplicate would silently change behaviour for its one live consumer.

Also note `sales/mutations.ts` contains **two definitions of the same operation name** `cpSalesPipelineLabelsAdd` (both `CpDealsAdd*` and `CpTagsAdd*` blocks), and `rooms/queries.ts` contains two `rooms` queries and two `cpProducts` queries. With no codegen there is nothing to catch this.

### 3.5 The four-layer call convention

```
src/sdk/graphql/<domain>/queries.ts     ← gql document, default-exported
        ↓  (imported as `queries` via <domain>/index.ts)
src/sdk/queries/<domain>.tsx            ← async function or useQuery/useMutation wrapper
        ↓
src/sdk/hooks/<useSomething>.tsx        ← optional domain hook (5 files only)
        ↓
component / page / container            ← "use client" by default
```

| Layer | Files | LOC |
|---|---|---|
| `sdk/graphql/**` documents | 41 | 2 440 |
| `sdk/queries/*.tsx` | 15 | 1 513 |
| `sdk/mutations/*.tsx` | 8 | 517 |
| `sdk/hooks/*.tsx` | 5 | 580 |
| `sdk/getClient.tsx` | 1 | 25 |
| **total** | 70 | **5 075** |

Three call shapes are used inside `sdk/queries`:

1. **async/await + `getClient()`** — server-safe, 8 call sites: `queries/cms.tsx:61`, `forms.tsx:21,33,71`, `kb.tsx:7,19`, `sales.tsx:151`, `tms.tsx:77`.
2. **`useQuery` against the singleton `client`** — client-only, the rest.
3. **`useMutation` in `sdk/mutations/*`** — always against the singleton.

`src/sdk/queries/rooms.tsx` mixes both in one file (see §8).


---

## 4. OPERATIONS CATALOG

### 4.1 How this catalog was built

Every `gql` document under `src/` was parsed with a brace-matching extractor (operation header regex `\b(query|mutation|subscription)\s+NAME` + balanced-brace scan), then cross-referenced against a module-resolution import graph built from every `import`/`from` specifier in `src/`. For each operation the **export key** was resolved — the const the document is assigned to, and the key it is published under in that module's `export default { ... }` object — and then every reachable file was scanned for that key used as `queries.<key>` / `mutations.<key>` / `<alias>.<key>` / `import { <key> }` / `mutation: <key>`.

Legend for the **Consumed by** column:

- A path ending in `(self)` means the document is defined *and* used inside the same file (inline `gql` in a component or in `ApolloClient.tsx`).
- `+N` after a path means `N` further files also reference that key.
- Rows marked **`DEAD`** have **zero** reference anywhere in `src/` — not in a barrel, not in a wrapper, not in a component.
- **Return shape** `scalar` means the root field has no sub-selection set (the server returns a scalar); `object (N sel.)` means `N` top-level fields were selected.

**Headline: 99 operation documents — 56 queries, 41 mutations, 2 subscriptions. 74 are reachable from at least one component; 25 are dead.**

### 4.2 Master table (all 99 operations)

| # | Op | Kind | File | Variables | Selected fields (top level) | Return shape | Consumed by |
|---:|---|---|---|---|---|---|---|
| 1 | `ClientPortalConfirmInvitation` | mutation | `sdk/graphql/auth/mutations.ts` | $token:String | _id, clientPortalId | object (2 sel.) | sdk/mutations/verify.tsx |
| 2 | `ClientPortalFacebookAuthentication` | mutation | `sdk/graphql/auth/mutations.ts` | $clientPortalId:String!, $accessToken:String! | clientPortalId, accessToken | object (2 sel.) | sdk/mutations/auth.tsx |
| 3 | `ClientPortalGoogleAuthentication` | mutation | `sdk/graphql/auth/mutations.ts` | $clientPortalId:String!, $code:String! | clientPortalId, code | object (2 sel.) | sdk/mutations/auth.tsx |
| 4 | `ClientPortalUserLoginWithCredentials` | mutation | `sdk/graphql/auth/mutations.ts` | $email:String, $phone:String, $password:String | — | scalar | sdk/mutations/auth.tsx |
| 5 | `ClientPortalUserRegister` | mutation | `sdk/graphql/auth/mutations.ts` | $phone:String, $email:String, $username:String, $password:String, $firstName:String, $lastName:String, $userType:CPUserType, $code:String, $propertiesData:JSON | phone, email, username, password, firstName, lastName +23 | object (29 sel.) | sdk/mutations/auth.tsx |
| 6 | `ClientPortalUserRequestOTP` | mutation | `sdk/graphql/auth/mutations.ts` | $identifier:String! | — | scalar | sdk/mutations/auth.tsx |
| 7 | `ClientPortalUserResetPassword` | mutation | `sdk/graphql/auth/mutations.ts` | $newPassword:String!, $token:String | — | scalar | sdk/mutations/auth.tsx |
| 8 | `ClientPortalUserVerify` | mutation | `sdk/graphql/auth/mutations.ts` | $code:String!, $email:String, $userId:String | clientPortalId, code, companyName, companyRegistrationNumber, email, erxesCustomerId +2 | object (8 sel.) | sdk/mutations/auth.tsx |
| 9 | `PosChooseConfig **DEAD**` | mutation | `sdk/graphql/auth/mutations.ts` | $token:String! | — | scalar |  |
| 10 | `changePhone **DEAD**` | mutation | `sdk/graphql/auth/mutations.ts` | $_id:String!, $phone:String | _id | object (1 sel.) |  |
| 11 | `clientPortalLoginWithSocialPay **DEAD**` | mutation | `sdk/graphql/auth/mutations.ts` | $clientPortalId:String!, $token:String! | clientPortalId, token | object (2 sel.) |  |
| 12 | `clientPortalUserChangePassword` | mutation | `sdk/graphql/auth/mutations.ts` | $currentPassword:String!, $newPassword:String! | currentPassword, newPassword, _id | object (3 sel.) | sdk/mutations/auth.tsx |
| 13 | `clientPortalUserEdit` | mutation | `sdk/graphql/auth/mutations.ts` | $email:String, $firstName:String, $lastName:String, $phone:String, $username:String, $avatar:String | email, firstName, lastName, phone, username, avatar +1 | object (7 sel.) | sdk/mutations/auth.tsx |
| 14 | `clientPortalUserForgotPassword` | mutation | `sdk/graphql/auth/mutations.ts` | $identifier:String! | — | scalar | sdk/mutations/auth.tsx |
| 15 | `sendVerificationCode **DEAD**` | mutation | `sdk/graphql/auth/mutations.ts` | $phone:String! | — | scalar |  |
| 16 | `CurrentConfig **DEAD**` | query | `sdk/graphql/auth/queries.ts` | — | erxesAppToken, paymentIds, deliveryConfig, name, description, pdomain +4 | object (10 sel.) |  |
| 17 | `UserDetail` | query | `sdk/graphql/auth/queries.ts` | — | isEmailVerified, isPhoneVerified | object (2 sel.) | sdk/queries/auth.tsx |
| 18 | `branchDetail **DEAD**` | query | `sdk/graphql/auth/queries.ts` | $id:String! | _id, title, address, phoneNumber, email, links +2 | object (8 sel.) |  |
| 19 | `clientPortalCurrentUser` | query | `sdk/graphql/auth/queries.ts` | — | _id, firstName, lastName, avatar, erxesCustomerId, erxesCompanyId +4 | object (10 sel.) | sdk/queries/auth.tsx |
| 20 | `CpCategories` | query | `sdk/graphql/cms/queries.ts` | $clientPortalId:String, $language:String, $status:CategoryStatus, $limit:Int | clientPortalId, language, status, limit, totalCount, list | object (6 sel.) | sdk/queries/cms.tsx |
| 21 | `CpCategories` | query | `sdk/graphql/cms/queries.ts` | $clientPortalId:String, $language:String, $status:CategoryStatus, $limit:Int | clientPortalId, language, status, limit, totalCount, list | object (6 sel.) | sdk/queries/cms.tsx |
| 22 | `CpCmsMenuList` | query | `sdk/graphql/cms/queries.ts` | $type:String, $searchValue:String, $parentId:String, $excludeIds:Boolean, $isGroup:Boolean, $instanceId:String, $includeWorkspaceTags:Boolean | type, searchValue, parentId, ids, excludeIds, isGroup +11 | object (17 sel.) | sdk/queries/cms.tsx |
| 23 | `CpMenus` | query | `sdk/graphql/cms/queries.ts` | $language:String, $kind:String, $webId:String | _id, label, url, order, kind, parentId +4 | object (10 sel.) | sdk/queries/cms.tsx |
| 24 | `CpPages **DEAD**` | query | `sdk/graphql/cms/queries.ts` | $language:String | _id, clientPortalId, name, description, coverImage, type +9 | object (15 sel.) |  |
| 25 | `CpPost` | query | `sdk/graphql/cms/queries.ts` | $id:String, $slug:String, $language:String, $clientPortalId:String | _id, slug, language, clientPortalId, type, webId +29 | object (35 sel.) | sdk/queries/cms.tsx |
| 26 | `CpPosts` | query | `sdk/graphql/cms/queries.ts` | $language:String, $sortField:String, $sortDirection:String, $status:PostStatus, $limit:Int, $featured:Boolean | language, categoryIds, tagIds, sortField, sortDirection, status +21 | object (27 sel.) | sdk/queries/cms.tsx |
| 27 | `PageList` | query | `sdk/graphql/cms/queries.ts` | $language:String, $limit:Int, $cursor:String, $direction:CURSOR_DIRECTION | language, limit, cursor, direction, totalCount, pageInfo +2 | object (8 sel.) | sdk/queries/cms.tsx |
| 28 | `PmsBranchList **DEAD**` | query | `sdk/graphql/config/queries.ts` | $page:Int, $perPage:Int | _id, createdAt, userId, name, description, user1Ids +19 | object (25 sel.) |  |
| 29 | `cpPmsBranchDetail` | query | `sdk/graphql/config/queries.ts` | $id:String! | _id, createdAt, userId, user, name, description +19 | object (25 sel.) | containers/config/currentConfig.tsx, sdk/queries/rooms.tsx |
| 30 | `ClientPortalUserRegister` | mutation | `sdk/graphql/customers/mutations.ts` | $firstName:String, $lastName:String, $username:String, $code:String, $email:String, $phone:String, $userType:CPUserType, $propertiesData:JSON, $password:String | firstName, lastName, username, code, email, phone +13 | object (19 sel.) | sdk/mutations/customers.tsx |
| 31 | `customersAdd **DEAD**` | mutation | `sdk/graphql/customers/mutations.ts` | $firstName:String, $lastName:String, $primaryEmail:String, $primaryPhone:String | firstName, lastName, primaryEmail, primaryPhone, _id | object (5 sel.) |  |
| 32 | `customers` | query | `sdk/graphql/customers/queries.ts` | $searchValue:String | list, totalCount | object (2 sel.) | sdk/queries/customers.tsx |
| 33 | `CpWidgetsSaveLead` | mutation | `sdk/graphql/forms/mutations.ts` | $formId:String!, $browserInfo:JSON!, $cachedCustomerId:String | formId, submissions, browserInfo, cachedCustomerId, status, errors +2 | object (8 sel.) | sdk/mutations/forms.tsx, sdk/queries/forms.tsx |
| 34 | `CpFormDetail` | query | `sdk/graphql/forms/queries.ts` | $id:String! | _id, name, title, description, buttonText, numberOfPages +2 | object (8 sel.) | sdk/queries/forms.tsx |
| 35 | `CpForms` | query | `sdk/graphql/forms/queries.ts` | $type:String, $channelId:String | list, totalCount | object (2 sel.) | sdk/queries/forms.tsx |
| 36 | `brands **DEAD**` | query | `sdk/graphql/forms/queries.ts` | $page:Int, $perPage:Int, $searchValue:String | _id, code, name, description | object (4 sel.) |  |
| 37 | `KnowledgeBaseArticles` | query | `sdk/graphql/kb/queries.ts` | $page:Int, $perPage:Int | page, perPage, categoryIds, _id, code, title +7 | object (13 sel.) | sdk/queries/kb.tsx |
| 38 | `knowledgeBaseCategories` | query | `sdk/graphql/kb/queries.ts` | $page:Int, $perPage:Int | _id, code, title | object (3 sel.) | sdk/queries/kb.tsx |
| 39 | `CpInvoiceCreate` | mutation | `sdk/graphql/payments/mutations.ts` | $input:InvoiceInput! | _id, amount, contentType, contentTypeId, customerId, invoiceNumber +4 | object (10 sel.) | sdk/mutations/payments.tsx |
| 40 | `CpInvoicesCheck` | mutation | `sdk/graphql/payments/mutations.ts` | $id:String! | — | scalar | sdk/mutations/payments.tsx |
| 41 | `CpInvoices` | query | `sdk/graphql/payments/queries.ts` | $contentType:String, $contentTypeId:String | list | object (1 sel.) | components/appointment/payment/tourPaymentDetail.tsx, components/booking/payment/payment-detail.tsx +1 |
| 42 | `CpPayments` | query | `sdk/graphql/payments/queries.ts` | $status:String, $kind:String | _id, name, kind, status, sendEmailOnPayment | object (5 sel.) | sdk/queries/payments.tsx |
| 43 | `InvoiceDetail` | query | `sdk/graphql/payments/queries.ts` | $id:String! | _id, invoiceNumber, amount, remainingAmount, phone, email +10 | object (16 sel.) | components/appointment/payment/tourPaymentDetail.tsx, components/booking/payment/payment-detail.tsx +1 |
| 44 | `PoscProductCategories` | query | `sdk/graphql/pos/queries.ts` | $status:String, $page:Int, $perPage:Int, $sortField:String, $sortDirection:Int | ids, status, page, perPage, sortField, sortDirection +7 | object (13 sel.) | sdk/queries/pos.tsx |
| 45 | `PoscProductDetail` | query | `sdk/graphql/pos/queries.ts` | $id:String | _id, name, unitPrice, uom, discount, discounts +14 | object (20 sel.) | sdk/queries/pos.tsx |
| 46 | `PoscProducts` | query | `sdk/graphql/pos/queries.ts` | $categoryId:String, $perPage:Int, $page:Int, $sortField:String, $sortDirection:Int | categoryId, perPage, page, sortField, sortDirection, ids +17 | object (23 sel.) | sdk/queries/pos.tsx |
| 47 | `CpPricingPlanDetail` | query | `sdk/graphql/pricing/queries.ts` | $id:String | productsBundle, segments, vendors, tags, tagsExcluded, productIds +1 | object (7 sel.) | containers/pricing/pricingPlans.tsx, sdk/queries/pricing.tsx |
| 48 | `CpPricingPlans` | query | `sdk/graphql/pricing/queries.ts` | $status:String, $priority:String, $branchId:String, $departmentId:String, $productId:String, $date:Date, $findOne:Boolean, $isQuantityEnabled:Boolean, $isPriceEnabled:Boolean, $page:Int, $perPage:Int | status, priority, branchId, departmentId, productId, date +5 | object (11 sel.) | containers/pricing/pricingPlans.tsx, sdk/queries/pricing.tsx |
| 49 | `cpProductCategories` | query | `sdk/graphql/products/queries.ts` | $parentId:String | _id, code, name, order, description, attachment | object (6 sel.) | sdk/queries/products.tsx |
| 50 | `cpProducts` | query | `sdk/graphql/products/queries.ts` | $perPage:Int, $page:Int | _id, name, type, code, status, unitPrice +8 | object (14 sel.) | sdk/queries/products.tsx |
| 51 | `CpCreateTicket` | mutation | `sdk/graphql/reviews/mutations.ts` | $name:String!, $channelId:String!, $pipelineId:String!, $statusId:String!, $description:String, $propertiesData:JSON | name, channelId, pipelineId, statusId, description, propertiesData +3 | object (9 sel.) | sdk/mutations/reviews.tsx |
| 52 | `CpGetTickets` | query | `sdk/graphql/reviews/queries.ts` | $filter:ICpTicketFilter | _id, name, description, propertiesData, createdBy, createdAt | object (6 sel.) | sdk/queries/reviews.tsx |
| 53 | `cpPmsCheckRooms **DEAD**` | query | `sdk/graphql/rooms/queries.ts` | $pipelineId:String!, $endDate:Date, $startDate:Date | pipelineId, endDate, startDate, ids, skipStageIds, _id +12 | object (18 sel.) |  |
| 54 | `roomCategories` | query | `sdk/graphql/rooms/queries.ts` | $parentId:String | _id, code, name, order, description, attachment | object (6 sel.) | sdk/queries/rooms.tsx |
| 55 | `rooms` | query | `sdk/graphql/rooms/queries.ts` | $pipelineId:String, $boardId:String, $perPage:Int, $page:Int | pipelineId, boardId, categoryIds, perPage, page, _id +14 | object (20 sel.) | sdk/queries/rooms.tsx |
| 56 | `rooms **DEAD**` | query | `sdk/graphql/rooms/queries.ts` | $categoryId:String, $perPage:Int, $page:Int | _id, name, type, code, status, unitPrice +6 | object (12 sel.) |  |
| 57 | `CpDealsAdd` | mutation | `sdk/graphql/sales/mutations.ts` | — | _id | object (1 sel.) | sdk/hooks/useAddDeal.tsx |
| 58 | `CpDealsAddPayment **DEAD**` | mutation | `sdk/graphql/sales/mutations.ts` | $id:String!, $proccessId:String, $paymentsData:JSON, $stageId:String | _id, proccessId, paymentsData, stageId | object (4 sel.) |  |
| 59 | `CpDealsChange` | mutation | `sdk/graphql/sales/mutations.ts` | $itemId:String!, $destinationStageId:String!, $sourceStageId:String | itemId, destinationStageId, sourceStageId, _id, name | object (5 sel.) | sdk/mutations/sales.tsx |
| 60 | `CpDealsCreateProductsData` | mutation | `sdk/graphql/sales/mutations.ts` | $processId:String, $dealId:String, $docs:JSON | processId, dealId, docs | object (3 sel.) | sdk/mutations/sales.tsx |
| 61 | `CpDealsEdit` | mutation | `sdk/graphql/sales/mutations.ts` | $id:String! | _id, tagIds | object (2 sel.) | sdk/mutations/sales.tsx |
| 62 | `CpTagsAdd` | mutation | `sdk/graphql/sales/mutations.ts` | $name:String!, $type:String!, $colorCode:String, $parentId:String | name, type, colorCode, parentId, _id, __typename | object (6 sel.) | sdk/mutations/sales.tsx |
| 63 | `conformityEdit **DEAD**` | mutation | `sdk/graphql/sales/mutations.ts` | $mainType:String, $mainTypeId:String, $relType:String | mainType, mainTypeId, relType, relTypeIds, success | object (5 sel.) |  |
| 64 | `cpSalesPipelineLabelsAdd **DEAD**` | mutation | `sdk/graphql/sales/mutations.ts` | $name:String!, $colorCode:String!, $pipelineId:String! | name, colorCode, pipelineId, _id, createdBy, createdAt | object (6 sel.) |  |
| 65 | `cpSalesPipelineLabelsAdd` | mutation | `sdk/graphql/sales/mutations.ts` | $name:String!, $colorCode:String!, $pipelineId:String! | name, colorCode, pipelineId, _id, __typename | object (5 sel.) | sdk/mutations/sales.tsx |
| 66 | `AddExtraService **DEAD**` | query | `sdk/graphql/sales/queries.ts` | $pipelineId:String! | addExtraService | object (1 sel.) |  |
| 67 | `CpDealDetail` | query | `sdk/graphql/sales/queries.ts` | $id:String!, $clientPortalCard:Boolean | _id, name, description, paymentsData, tagIds, number +10 | object (16 sel.) | sdk/queries/auth.tsx, sdk/queries/sales.tsx |
| 68 | `CpDeals` | query | `sdk/graphql/sales/queries.ts` | $stageId:String, $pipelineId:String, $number:String, $startDate:String, $endDate:String | stageId, productIds, pipelineId, number, customerIds, companyIds +5 | object (11 sel.) | components/shared/forms/RoomInformationForm.tsx, sdk/queries/auth.tsx |
| 69 | `CpPmsRooms` | query | `sdk/graphql/sales/queries.ts` | $pipelineId:String!, $endDate:Date, $startDate:Date | pipelineId, endDate, startDate, skipStageIds, _id, name +2 | object (8 sel.) | sdk/queries/rooms.tsx |
| 70 | `CpSalesBoards` | query | `sdk/graphql/sales/queries.ts` | — | _id, name, type | object (3 sel.) | sdk/queries/sales.tsx |
| 71 | `CpSalesPipelines` | query | `sdk/graphql/sales/queries.ts` | $boardId:String, $isAll:Boolean | list | object (1 sel.) | sdk/queries/sales.tsx |
| 72 | `CpSalesStages` | query | `sdk/graphql/sales/queries.ts` | $isAll:Boolean | _id, name, code | object (3 sel.) | sdk/queries/sales.tsx |
| 73 | `PaymentTypes **DEAD**` | query | `sdk/graphql/sales/queries.ts` | $pipelineId:String! | paymentTypes | object (1 sel.) |  |
| 74 | `cpSalesPipelineLabels` | query | `sdk/graphql/sales/queries.ts` | $pipelineId:String | _id, name, colorCode | object (3 sel.) | sdk/queries/sales.tsx |
| 75 | `cpTags` | query | `sdk/graphql/sales/queries.ts` | $type:String, $searchValue:String, $parentId:String, $excludeIds:Boolean | type, searchValue, parentId, ids, excludeIds, _id +7 | object (13 sel.) | sdk/queries/sales.tsx |
| 76 | `CpBmsOrderAdd` | mutation | `sdk/graphql/tms/mutations.ts` | $order:BmsOrderInput | _id, additionalCustomers, amount, branchId, createdAt, customerId +6 | object (12 sel.) | sdk/mutations/tms.tsx |
| 77 | `CpBmsOrderEdit` | mutation | `sdk/graphql/tms/mutations.ts` | $id:String!, $order:BmsOrderInput | _id, additionalCustomers, amount, branchId, createdAt, customerId +6 | object (12 sel.) | sdk/mutations/tms.tsx |
| 78 | `CpBmsBranchList` | query | `sdk/graphql/tms/queries.ts` | $limit:Int, $cursor:String, $cursorMode:CURSOR_MODE, $direction:CURSOR_DIRECTION, $orderBy:JSON, $sortMode:String | limit, cursor, cursorMode, direction, orderBy, sortMode +3 | object (9 sel.) | sdk/queries/tms.tsx |
| 79 | `CpBmsItineraryDetail` | query | `sdk/graphql/tms/queries.ts` | $_id:String!, $language:String | _id, branchId, language, name, content, duration +3 | object (9 sel.) | sdk/queries/tms.tsx |
| 80 | `CpBmsTourDetail` | query | `sdk/graphql/tms/queries.ts` | $_id:String!, $branchId:String, $language:String, $translationsLanguage2:String | _id, branchId, language, name, refNumber, groupCode +22 | object (28 sel.) | sdk/queries/tms.tsx |
| 81 | `CpBmsTours` | query | `sdk/graphql/tms/queries.ts` | $branchId:String, $webId:String, $status:String, $name:String, $language:String, $innerDate:Date, $startDate1:Date, $startDate2:Date, $endDate1:Date, $endDate2:Date, $date_status:DATE_STATUS, $limit:Int, $cursor:String, $cursorMode:CURSOR_MODE, $direction:CURSOR_DIRECTION, $orderBy:JSON, $sortMode:String | branchId, webId, status, categoryIds, tags, name +16 | object (22 sel.) | sdk/queries/tms.tsx |
| 82 | `CpDealsAdd` | mutation | `appointment/graphql/mutations/addDeal.ts` | $name:String!, $productsData:JSON, $stageId:String, $startDate:Date, $closeDate:Date, $description:String | name, productsData, customerIds, stageId, startDate, closeDate +6 | object (12 sel.) | components/appointment/hooks/useAddDeal.tsx |
| 83 | `CpDealsEdit **DEAD**` | mutation | `appointment/graphql/mutations/editDeal.ts` | $_id:String!, $name:String, $productsData:JSON, $paymentsData:JSON, $parentId:String, $proccessId:String, $aboveItemId:String, $stageId:String, $startDate:Date, $closeDate:Date, $description:String, $order:Int, $reminderMinute:Int, $isComplete:Boolean, $status:String, $priority:String, $customFieldsData:JSON | _id, name, productsData, paymentsData, parentId, proccessId +16 | object (22 sel.) |  |
| 84 | `CpInvoiceCreate **DEAD**` | mutation | `appointment/graphql/mutations/invoice.ts` | $input:InvoiceInput! | _id, amount, contentType, contentTypeId, currency, customerId +4 | object (10 sel.) |  |
| 85 | `CpInvoicesCheck` | mutation | `appointment/graphql/mutations/invoice.ts` | $id:String! | — | scalar | components/appointment/payment/paymentPage.tsx |
| 86 | `PaymentTransactionsAdd **DEAD**` | mutation | `appointment/graphql/mutations/invoice.ts` | $input:PaymentTransactionInput! | _id, response | object (2 sel.) |  |
| 87 | `customersAdd **DEAD**` | mutation | `appointment/graphql/mutations/customerAdd.ts` | $state:String, $avatar:String, $firstName:String, $lastName:String, $middleName:String, $sex:Int, $birthDate:Date, $primaryEmail:String, $primaryPhone:String, $ownerId:String, $position:String, $department:String, $leadStatus:String, $hasAuthority:String, $description:String, $isSubscribed:String, $links:JSON, $customFieldsData:JSON, $code:String, $emailValidationStatus:String, $phoneValidationStatus:String | state, avatar, firstName, lastName, middleName, sex +33 | object (39 sel.) |  |
| 88 | `dealsRemove **DEAD**` | mutation | `appointment/graphql/mutations/dealsRemove.ts` | $_id:String! | _id, __typename | object (2 sel.) |  |
| 89 | `CpDeals` | query | `appointment/graphql/queries/deal.ts` | $stageId:String, $pipelineId:String, $number:String, $startDate:String, $endDate:String, $noSkipArchive:Boolean | stageId, productIds, pipelineId, number, customerIds, companyIds +6 | object (12 sel.) | components/appointment/hooks/useDeals.tsx |
| 90 | `CpPmsBranchList` | query | `appointment/graphql/queries/branches.ts` | $page:Int, $perPage:Int, $sortField:String, $sortDirection:Int | page, perPage, sortField, sortDirection, _id, createdAt +24 | object (30 sel.) | components/appointment/hooks/useBranches.tsx |
| 91 | `cpProductCategories` | query | `appointment/graphql/queries/productCategories.ts` | $parentId:String, $status:String | _id, code, name, productCount | object (4 sel.) | components/appointment/hooks/useCategories.tsx |
| 92 | `cpProducts` | query | `appointment/graphql/queries/products.ts` | $type:String, $tag:String, $status:String, $searchValue:String, $vendorId:String, $brand:String, $perPage:Int, $page:Int, $excludeIds:Boolean, $pipelineId:String, $boardId:String, $segment:String, $segmentData:String | type, categoryIds, tag, status, searchValue, vendorId +19 | object (25 sel.) | components/appointment/hooks/useProducts.tsx |
| 93 | `dealDetail **DEAD**` | query | `appointment/graphql/queries/deal.ts` | $_id:String! | stage | object (1 sel.) |  |
| 94 | `users` | query | `appointment/graphql/queries/users.ts` | $page:Int, $perPage:Int, $status:String, $excludeIds:Boolean, $searchValue:String, $isActive:Boolean, $unitId:String, $isAssignee:Boolean, $branchId:String, $segment:String, $segmentData:String | page, perPage, status, excludeIds, searchValue, isActive +8 | object (14 sel.) | components/appointment/hooks/useUsers.tsx |
| 95 | `invoiceUpdated **DEAD**` | subscription | `appointment/graphql/mutations/invoice.ts` | $_id:String! | — | scalar |  |
| 96 | `transactionUpdated **DEAD**` | subscription | `appointment/graphql/mutations/invoice.ts` | $invoiceId:String! | — | scalar |  |
| 97 | `ClientPortalRefreshToken` | mutation | `app/[locale]/ApolloClient.tsx` | $refreshToken:String! | refreshToken | object (1 sel.) | app/[locale]/ApolloClient.tsx (self) |
| 98 | `CpWidgetsSaveLead` | mutation | `components/contact-us/ContactForm.tsx` | $formId:String!, $browserInfo:JSON!, $cachedCustomerId:String | formId, submissions, browserInfo, cachedCustomerId, status, conversationId +2 | object (8 sel.) | components/contact-us/ContactForm.tsx (self) |
| 99 | `CpFormDetail` | query | `components/contact-us/ContactForm.tsx` | $id:String! | _id, fields | object (2 sel.) | components/contact-us/ContactForm.tsx (self) |
### 4.3 The operations that matter — full source

These are the documents that carry the product. Full, unabridged text.

#### 4.3.1 Login — `sdk/graphql/auth/mutations.ts`

Exported under key `login`; consumed by `sdk/mutations/auth.tsx` → `useLogin` → 8 files.

```graphql
mutation ClientPortalUserLoginWithCredentials($email: String, $phone: String, $password: String) {
  clientPortalUserLoginWithCredentials(email: $email, phone: $phone, password: $password)
}
```

Note the **shape**: no selection set at all. The server returns a `String` *or* an object — `useLogin` normalises both in `normalizeLoginResponse` (`sdk/mutations/auth.tsx:29-34`), which is why that function has to accept `string | ILoginData | null | undefined`. This is a server-side type ambiguity leaking into the client.

#### 4.3.2 Current user — `sdk/graphql/auth/queries.ts`

Exported under key `currentUser`; consumed by `useCurrentUser` (`sdk/queries/auth.tsx:16`) → 15 files.

```graphql
query clientPortalCurrentUser {
    clientPortalCurrentUser {
      _id
      firstName
      lastName
      avatar
      erxesCustomerId
      erxesCompanyId
      code
      phone
      email
      username
    }
  }
```

This is the query that populates `currentUserAtom`. Note there is a **second query with the same root field** in the same file:

```graphql
query UserDetail {
    clientPortalCurrentUser {
      _id
      firstName
      lastName
    }
  }
```

`UserDetail` fetches the *same* root field as `clientPortalCurrentUser` with a *smaller* selection set. Both are live. See §11 A-37.

#### 4.3.3 Branch/config bootstrap — `sdk/graphql/config/queries.ts`

Exported under key `cpPmsBranchDetail`; consumed by `containers/config/currentConfig.tsx:16` and `sdk/queries/rooms.tsx:18,30`.

```graphql
query cpPmsBranchDetail($id: String!) {
    cpPmsBranchDetail(_id: $id) {
      _id
      createdAt
      userId
      user {
        _id
        isOwner
        details {
          fullName
          avatar
        }
      }
      name
      description
      user1Ids
      user2Ids
      user3Ids
      user4Ids
      user5Ids
      paymentIds
      paymentTypes
      departmentId
      token
      erxesAppToken
      permissionConfig
      uiOptions
      pipelineConfig
      extraProductCategories
      roomCategories
      time
      discount
      checkintime
      checkouttime
    }
  }
```

**This is the single most sensitive document in the app.** It requests `token` and `erxesAppToken` and stores the whole object — including `token` — into `currentConfigAtom`, which is then read from anywhere. See §11 A-38 and the Open Questions.

#### 4.3.4 Create a deal (booking) — `sdk/graphql/sales/mutations.ts`

Exported under key `cpDealsAdd`; consumed by `sdk/hooks/useAddDeal.tsx` → `sdk/mutations/sales.tsx` → 7 files.

```graphql
mutation CpDealsAdd(${commonFields} $customerIds: [String] $companyIds: [String] $labelIds: [String], $tagIds: [String]) {
    cpDealsAdd(${commonParams} customerIds: $customerIds companyIds: $companyIds labelIds: $labelIds, tagIds: $tagIds) {
      _id
    }
  }
```

**`${commonFields}` and `${commonParams}` are JavaScript template-literal interpolations, not GraphQL fragments.** The constants are declared earlier in the same file:

- `commonFields` — the variable declarations shared by every deal mutation.
- `commonParams` — the matching argument list.

So the actual document text Apollo sends is *generated at module load* and is not what you see in the file. This is the one place where a hand-written document is not a literal. It also means the two declarations must stay in sync with each other by hand — there is no compiler check.

The mutation returns only `_id`.

#### 4.3.5 Create an invoice — `sdk/graphql/payments/mutations.ts`

Exported under key `invoiceCreate`; consumed by `useInvoiceCreate` (`sdk/mutations/payments.tsx`) → `components/appointment/payment/paymentPage.tsx`, `tourPaymentDetail.tsx`, `components/booking/payment/payment-detail.tsx`.

```graphql
mutation CpInvoiceCreate($input: InvoiceInput!) {
    cpInvoiceCreate(input: $input) {
      _id
      amount
      contentType
      contentTypeId
      customerId
      invoiceNumber
      paymentIds
      transactions {
        amount
        _id
        invoiceId
        paymentId
        paymentKind
        status
        response
      }
      status
      currency
    }
  }
```

The `response` field inside `transactions` is the raw gateway response — see §9 for how far that travels into the UI.

#### 4.3.6 Rooms (available inventory) — `sdk/graphql/rooms/queries.ts`

Exported under key `rooms`; consumed by `useRooms` (`sdk/queries/rooms.tsx:44`) → 9 files.

```graphql
query rooms(
    $pipelineId: String
    $boardId: String
    $categoryIds: [String]
    $perPage: Int
    $page: Int
  ) {
    cpProducts(
      pipelineId: $pipelineId
      boardId: $boardId
      categoryIds: $categoryIds
      perPage: $perPage
      page: $page
    ) {
      _id
      name
      type
      code
      status
      unitPrice
      currency
      categoryId
      category {
        _id
        code
        name
        order
        description
      }
      uom
      description
      attachment {
        url
        name
        size
        type
      }
      attachmentMore {
        url
        name
        size
        type
      }
      discount
      discounts
    }
  }
```

There is a **second document in the same file with the same operation name** `rooms` (binding `Products`, key `Products`) that selects 12 of these same 20 fields minus `currency`, `discount`, `discounts`. It is **dead** — nothing references `queries.Products`. See §4.5.

#### 4.3.7 CMS posts (every listing page) — `sdk/graphql/cms/queries.ts`

Exported under key `CmsPosts`; consumed by `useCmsPosts` (`sdk/queries/cms.tsx:16`) → 47 files.

```graphql
query CpPosts(
    $language: String
    $categoryIds: [String]
    $tagIds: [String]
    $sortField: String
    $sortDirection: String
    $status: PostStatus
    $limit: Int
    $featured: Boolean
  ) {
    cpPosts(
      language: $language
      categoryIds: $categoryIds
      tagIds: $tagIds
      sortField: $sortField
      sortDirection: $sortDirection
      status: $status
      limit: $limit
      featured: $featured
    ) {
      title
      _id
      clientPortalId
      count
      categoryIds
      categories {
        _id
        name
        slug
      }
      tagIds
      slug
      status
      publishedDate
      createdAt
      excerpt
      content
      thumbnail {
        name
        url
      }
      images {
        name
        url
      }
      attachments {
        name
        url
      }
      translations {
        language
        title
        _id
        content
        customFieldsData
        excerpt
      }
      videoUrl
      customFieldsData
      customFieldsMap
      pdfAttachment {
        pages {
          name
          url
        }
        pdf {
          name
          url
        }
      }
      documents {
        name
        url
      }
    }
  }
```

27 top-level fields including `content` (the full post body) — fetched for *every* post in *every* listing, because `useCmsPosts` is on the critical path of 47 files. `customFieldsData` and `customFieldsMap` are untyped `JSON` blobs from the server.

#### 4.3.8 Deal detail — `sdk/graphql/sales/queries.ts`

Exported under key `dealDetail`; consumed by `useDealDetail` (`sdk/queries/sales.tsx`) and `useAuthDealDetail` (`sdk/queries/auth.tsx`) → 20 files.

```graphql
query CpDealDetail($id: String!, $clientPortalCard: Boolean) {
    cpDealDetail(_id: $id, clientPortalCard: $clientPortalCard) {
      _id
      name
      description
      paymentsData
      tagIds
      number
      amount
      unUsedAmount
      stage {
        _id
        name
        code
      }
      tags {
        _id
        name
        type
        colorCode
      }
      customers {
        _id
        lastName
        firstName
        primaryPhone
        primaryEmail
      }
      labels {
        _id
        name
      }
      productsData
      propertiesData
      paymentsData
      createdAt
      products {
        _id
        name
        unitPrice
        uom
        categoryId
        propertiesData
        type
        attachment {
          url
          name
        }
      }
    }
  }
```

`paymentsData` is selected **twice** at the same level (duplicate field in one selection set). GraphQL allows it and merges the results, so it is harmless — but it is a sign this document was edited by copy-paste.

#### 4.3.9 Tours (TMS) — `sdk/graphql/tms/queries.ts`

Exported under key `TOURS_QUERY`; consumed by `useTmsTours` (`sdk/queries/tms.tsx`) → 8 files.

```graphql
query CpBmsTours(
    $branchId: String
    $webId: String
    $status: String
    $categoryIds: [String]
    $tags: [String]
    $name: String
    $language: String
    $innerDate: Date
    $startDate1: Date
    $startDate2: Date
    $endDate1: Date
    $endDate2: Date
    $date_status: DATE_STATUS
    $limit: Int
    $cursor: String
    $cursorMode: CURSOR_MODE
    $direction: CURSOR_DIRECTION
    $orderBy: JSON
    $sortMode: String
  ) {
    cpBmsTours(
      branchId: $branchId
      webId: $webId
      status: $status
      categoryIds: $categoryIds
      tags: $tags
      name: $name
      language: $language
      innerDate: $innerDate
      startDate1: $startDate1
      startDate2: $startDate2
      endDate1: $endDate1
      endDate2: $endDate2
      date_status: $date_status
      limit: $limit
      cursor: $cursor
      cursorMode: $cursorMode
      direction: $direction
      orderBy: $orderBy
      sortMode: $sortMode
    ) {
      list {
        _id
        name
        refNumber
        groupCode
        startDate
        endDate
        duration
        cost
        status
        imageThumbnail
        images
        itineraryId
        dateType
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
```

19 variables, cursor pagination, custom enums (`DATE_STATUS`, `CURSOR_MODE`, `CURSOR_DIRECTION`) and a `JSON`-typed `orderBy`. This is the most "server-shaped" document in the repo — the client passes through server query parameters verbatim.

### 4.4 Dead operations (25)

Zero references anywhere in `src/` after resolving export keys, barrels, and wrappers.

| # | Operation | Kind | File | Export key | Why it is dead |
|---:|---|---|---|---|---|
| 1 | `customersAdd` | mutation | `appointment/graphql/mutations/customerAdd.ts` | `customersAddMutation` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 2 | `dealsRemove` | mutation | `appointment/graphql/mutations/dealsRemove.ts` | `removeDealMutation` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 3 | `CpDealsEdit` | mutation | `appointment/graphql/mutations/editDeal.ts` | `editDealsMutation` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 4 | `PaymentTransactionsAdd` | mutation | `appointment/graphql/mutations/invoice.ts` | `ADD_TRANSACTION` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 5 | `CpInvoiceCreate` | mutation | `appointment/graphql/mutations/invoice.ts` | `invoiceCreateMutation` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 6 | `transactionUpdated` | subscription | `appointment/graphql/mutations/invoice.ts` | `transactionUpdatedSubscription` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 7 | `invoiceUpdated` | subscription | `appointment/graphql/mutations/invoice.ts` | `invoiceUpdatedSubscription` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 8 | `dealDetail` | query | `appointment/graphql/queries/deal.ts` | `dealDetailQuery` | orphaned copy of the `sdk/graphql/sales` document; no hook or page references this file || 9 | `sendVerificationCode` | mutation | `sdk/graphql/auth/mutations.ts` | `getCode` | — || 10 | `changePhone` | mutation | `sdk/graphql/auth/mutations.ts` | `changePhone` | — || 11 | `PosChooseConfig` | mutation | `sdk/graphql/auth/mutations.ts` | `posChooseConfig` | — || 12 | `clientPortalLoginWithSocialPay` | mutation | `sdk/graphql/auth/mutations.ts` | `socialPayLogin` | — || 13 | `CurrentConfig` | query | `sdk/graphql/auth/queries.ts` | `currentConfig` | — || 14 | `branchDetail` | query | `sdk/graphql/auth/queries.ts` | `branchDetail` | — || 15 | `CpPages` | query | `sdk/graphql/cms/queries.ts` | `CmsPages` | — || 16 | `PmsBranchList` | query | `sdk/graphql/config/queries.ts` | `PmsBranchList` | — || 17 | `customersAdd` | mutation | `sdk/graphql/customers/mutations.ts` | `addCustomer` | — || 18 | `brands` | query | `sdk/graphql/forms/queries.ts` | `brands` | — || 19 | `cpPmsCheckRooms` | query | `sdk/graphql/rooms/queries.ts` | `checkRooms` | — || 20 | `rooms` | query | `sdk/graphql/rooms/queries.ts` | `Products` | — || 21 | `cpSalesPipelineLabelsAdd` | mutation | `sdk/graphql/sales/mutations.ts` | `changeLabel` | — || 22 | `conformityEdit` | mutation | `sdk/graphql/sales/mutations.ts` | `conformityEdit` | — || 23 | `CpDealsAddPayment` | mutation | `sdk/graphql/sales/mutations.ts` | `addPayment` | — || 24 | `PaymentTypes` | query | `sdk/graphql/sales/queries.ts` | `paymentTypes` | — || 25 | `AddExtraService` | query | `sdk/graphql/sales/queries.ts` | `addExtraService` | — |
Manual notes on the dead set:

1. **`components/appointment/graphql/{mutations/customerAdd,mutations/dealsRemove,mutations/editDeal}.ts`** — three whole files whose exports are never imported. Their sibling `mutations/addDeal.ts` *is* used (`useAddDeal`), and `mutations/invoice.ts` is partly used (`CpInvoicesCheck` by `paymentPage.tsx:18`). So the tree is *partially* live, which makes it the most dangerous kind of dead code: it looks load-bearing.
2. **`components/contact-us/ContactForm.tsx`** declares `WIDGETS_SAVE_LEAD` and `GET_FORM_DETAIL` and *does* use them (`useQuery(GET_FORM_DETAIL, ...)`, `useMutation(WIDGETS_SAVE_LEAD)`), but both **duplicate live operations in `sdk/graphql/forms/`** with the same operation names. They are redundant, not unused — they ship two copies of the same document to the browser. Flagged as dead *duplicate definitions* in §3.4 and catalogued as duplicates in §4.5.
3. **`app/[locale]/ApolloClient.tsx`** declares `ClientPortalRefreshToken` (binding `REFRESH_TOKEN`) and uses it at `ApolloClient.tsx:73` as `mutation: REFRESH_TOKEN`. It is live and unique to that file — no duplicate exists in `sdk/graphql/`.
4. **`sdk/graphql/auth/mutations.ts` — 4 dead of 15.** `getCode`, `changePhone`, `posChooseConfig`, `socialPayLogin` are wired into the default export object but nothing calls them. `changePhone`'s root field is `clientPortalUsersEdit` (plural `Users`), i.e. it edits *another* user — reading the document makes the intent unclear, which may be why it was abandoned.
5. **`sdk/graphql/rooms/queries.ts` — 2 dead of 4.** `checkRooms` (op `cpPmsCheckRooms`) was superseded: `useCheckRooms` now calls `salesQueries.pmsRooms` (`sdk/queries/rooms.tsx:119`) instead. `Products` (second `query rooms`) is a trimmed duplicate of the live `rooms`.
6. **`sdk/graphql/sales` — 3 dead mutations and 2 dead queries.** `changeLabel` (op `cpSalesPipelineLabelsAdd`) duplicates a *live* document of the same operation name under key `addLabel` in the same file; `addPayment` (op `CpDealsAddPayment`) has root field `cpDealsEdit`, i.e. it is a second mutation that silently reuses the deal-edit resolver.
7. **`sdk/graphql/cms/queries.ts` `CpPages`, `config/queries.ts` `PmsBranchList`, `forms/queries.ts` `brands`, `customers/mutations.ts` `addCustomer`, `auth/queries.ts` `currentConfig` + `branchDetail`** — all published in their barrel, all reachable through `sdk/queries/*`, but the specific key is never read. These are the classic "dead key in a live file" case, which no linter catches.
8. **Dead-but-referenced: `ClientPortalConfirmInvitation`.** Its export key `confirmInvitation` *is* referenced — from `sdk/mutations/verify.tsx:10` — so it is **not** counted in the 25. But its only referrer is `useConfirmInvitation`, which nobody imports. Transitively it is dead. The same is true of every key exported by `sdk/hooks/useAccountDiscounts.tsx`. A naive import-graph walk reports these as live; only a render/call-rooted walk finds them. **Treat the honest figure as 25 statically-dead documents, plus at least 1 transitively-dead one (`confirmInvitation`) whose referrer is itself on the never-imported list in §5.3.**

### 4.5 Duplicate operation names (14 pairs)

99 documents → 85 distinct `(kind, operationName)` pairs → **14 names are declared twice**.

| # | Operation | Declaration A | Declaration B | Which one is live |
|---:|---|---|---|---|
| 1 | `CpDealsAdd` (mutation) | `sdk/graphql/sales/mutations.ts` (key `cpDealsAdd`) | `components/appointment/graphql/mutations/addDeal.ts` (key `addDealsMutation`) | **Both ship** — `cpDealsAdd` by `src/sdk/hooks/useAddDeal.tsx` (default export → `bookingDetailsPage.tsx:20`), `addDealsMutation` by `src/components/appointment/hooks/useAddDeal.tsx` (→ `useBookingSubmit.tsx`). **There are two different hooks both named `useAddDeal`.** |
| 2 | `CpDealsEdit` (mutation) | `sdk/graphql/sales/mutations.ts` | `components/appointment/graphql/mutations/editDeal.ts` | **A only** — the appointment copy's `editDealsMutation` is never imported. |
| 3 | `CpDeals` (query) | `sdk/graphql/sales/queries.ts` (key `deals`) | `components/appointment/graphql/queries/deal.ts` (key `dealsQuery`) | **Both ship** — `dealsQuery` by `useDeals.tsx:15`, `deals` by `RoomInformationForm.tsx` and `sdk/queries/auth.tsx`. |
| 4 | `customersAdd` (mutation) | `sdk/graphql/customers/mutations.ts` (key `addCustomer`) | `components/appointment/graphql/mutations/customerAdd.ts` (key `customersAddMutation`) | **Neither.** Both keys are referenced by nothing. |
| 5 | `ClientPortalUserRegister` (mutation) | `sdk/graphql/auth/mutations.ts` | `sdk/graphql/customers/mutations.ts` | **Both live** — `createUser` (auth) and `addCpUser` (customers) are *different* documents with the *same* operation name. |
| 6 | `CpWidgetsSaveLead` (mutation) | `sdk/graphql/forms/mutations.ts` | `components/contact-us/ContactForm.tsx` | **Both live** — `useCpWidgetsSaveLead` and the inline `WIDGETS_SAVE_LEAD`. |
| 7 | `CpFormDetail` (query) | `sdk/graphql/forms/queries.ts` | `components/contact-us/ContactForm.tsx` | **Both live** — `useCpFormDetail` and the inline `GET_FORM_DETAIL`. |
| 8 | `cpProductCategories` (query) | `sdk/graphql/products/queries.ts` (key `productCategories`) | `components/appointment/graphql/queries/productCategories.ts` (key `categoryQuery`) | **Both ship** — `productCategories` by `sdk/queries/products.tsx:8`, `categoryQuery` by `useCategories.tsx:5`. |
| 9 | `cpProducts` (query) | `sdk/graphql/products/queries.ts` (key `products`) | `components/appointment/graphql/queries/products.ts` (key `productsQuery`) | **Both ship** — `products` by `sdk/queries/products.tsx:20,48`, `productsQuery` by `useProducts.tsx:26`. |
| 10 | `rooms` (query) | `sdk/graphql/rooms/queries.ts` (key `rooms`) | `sdk/graphql/rooms/queries.ts` (key `Products`) | **A** — same file, same operation name, two documents. |
| 11 | `cpSalesPipelineLabelsAdd` (mutation) | `sdk/graphql/sales/mutations.ts` (key `addLabel`) | `sdk/graphql/sales/mutations.ts` (key `changeLabel`) | **A** — same file, same operation name, two documents. |
| 12 | `CpInvoiceCreate` (mutation) | `sdk/graphql/payments/mutations.ts` | `components/appointment/graphql/mutations/invoice.ts` | **A** — `invoiceCreateMutation` in the appointment copy is never imported. |
| 13 | `CpInvoicesCheck` (mutation) | `sdk/graphql/payments/mutations.ts` | `components/appointment/graphql/mutations/invoice.ts` | **B** — `paymentPage.tsx:18` imports `invoicesCheckMutation` from the appointment copy. The `sdk` copy's `checkInvoice` is also live. **Both ship.** |
| 14 | `CpCategories` (query) | `sdk/graphql/cms/queries.ts` (key `CmsCategories`) | `sdk/graphql/cms/queries.ts` (key `CmsCategory`) | **Both live** — two documents, same operation name, different keys, in one file. |

**Consequence:** because there is no codegen and no schema check (§3), nothing enforces that a duplicate name has the *same* selection set. Rows 5, 6, 7, 14 are pairs where the two copies can silently drift.


---

## 5. HOOKS

### 5.1 What counts as a "data hook" here

There is no `src/hooks/` directory (contradicting the placeholder path in `.analysis/01-architecture.md:66` if it implies one exists). Custom hooks live in **five** places, and they are not interchangeable:

| Location | Count | Role |
|---|---:|---|
| `src/sdk/queries/*.tsx` | 14 files | query wrappers: one file per erxes domain, `useQuery` + normalisation |
| `src/sdk/mutations/*.tsx` | 8 files | mutation wrappers: `useMutation` + toast + redirect |
| `src/sdk/hooks/*.tsx` | 3 files | **domain logic**, not transport — pricing, discounts |
| `src/components/appointment/hooks/*.tsx` | 9 files | booking-flow orchestration |
| `src/lib/schema/*/[index].tsx`, `src/lib/hooks`, `src/lib/use-media-query.tsx` | 5 files | zod schema factories and non-data UI hooks |

**99 exported `use*` hooks across 39 files.**

### 5.2 Inventory

| File | LOC | Exported hooks | Consumers |
|---|---:|---|---:|
| `sdk/mutations/auth.tsx` | 260 | `useLogin`, `useGoogleLogin`, `useFacebookLogin`, `useRegister`, `useUserEdit`, `useForgotPassword`, `useChangePassword`, `useResetPassword`, `useRequestOtp`, `useVerifyOtp`, `useLogout` | 8 |
| `sdk/queries/cms.tsx` | 266 | `useCmsPosts`, `useCmsPostDetail`, `useCmsMenus`, `useCmsCategories`, `useCmsPostsByCategoryIds`, `useCmsPostsBySlug`, `useCmsPostsByCategory`, `useDiningPosts`, `useCmsPages`, `useCmsPageDetail` | 47 |
| `sdk/queries/sales.tsx` | 160 | `usePipelineId`, `useStages`, `useStagesAppointment`, `useStageActivities`, `useSalesStages`, `useTags`, `useLabels`, `useDealDetail` | 20 |
| `sdk/mutations/sales.tsx` | 75 | `useLabelAdd`, `useAddTag`, `useAddPrePaymentTag`, `useChangeStage`, `useDealEdit`, `useCreateDealProductsData` | 7 |
| `sdk/queries/rooms.tsx` | 205 | `useRoomCategoryIds`, `usePmsDepartmentId`, `useRoomCategories`, `useCheckRooms`, `useResultRooms` | 9 |
| `sdk/queries/auth.tsx` | 111 | `useCurrentUser`, `useUserDetail`, `useUserBookings`, `useBookingDetail` | 15 |
| `sdk/queries/pos.tsx` | 131 | `usePoscProducts`, `usePoscProductDetail`, `usePoscProductCategories`, `usePoscProductsByCategories` | 6 |
| `sdk/queries/pricing.tsx` | 72 | `usePricingPlan`, `usePricingPlanDetail`, `useActivePricingPlans`, `usePricingPlansByCategory` | 3 |
| `sdk/queries/products.tsx` | 94 | `useProductCategories`, `useProducts`, `useChildProducts`, `useChildProduct` | 7 |
| `sdk/queries/tms.tsx` | 90 | `useTmsBranches`, `useTmsTours`, `useTmsTourDetail`, `useTmsItineraryDetail` | 8 |
| `components/appointment/hooks/useTourDeal.tsx` | 128 | `useTourStages`, `useTourDealAdd`, `useTourStageChange` | 2 |
| `sdk/queries/payments.tsx` | 38 | `usePayments`, `useInvoiceIdByDealId`, `useInvoiceDetail` | 3 |
| `sdk/queries/reviews.tsx` | 126 | `useExistingReviewForBooking`, `usePublicReviews`, `useGoogleReviews` | 2 |
| `sdk/hooks/usePlanPrice.tsx` | 45 | `useProductPricingPlan`, `usePlanPrice` | 5 |
| `sdk/mutations/payments.tsx` | 76 | `useInvoiceCreate`, `useCheckInvoice` | 2 |
| `sdk/mutations/tms.tsx` | 22 | `useBmsOrderAdd`, `useBmsOrderEdit` | 2 |
| `sdk/queries/kb.tsx` | 78 | `useKbCategories`, `useKbArticles` | 1 |
| `components/appointment/hooks/useAddDeal.tsx` | 18 | `useAddDeal` | 2 |
| `components/appointment/hooks/useBookingSubmit.tsx` | 274 | `useBookingSubmit` | 2 |
| `components/appointment/hooks/useBranches.tsx` | 21 | `useBranches` | 0 |
| `components/appointment/hooks/useCategories.tsx` | 17 | `useCategories` | 1 |
| `components/appointment/hooks/useDeals.tsx` | 30 | `useDeals` | 1 |
| `components/appointment/hooks/usePaymentModal.tsx` | 48 | `usePaymentModal` | 0 |
| `components/appointment/hooks/useProducts.tsx` | 32 | `useProducts` | 2 |
| `components/appointment/hooks/useUsers.tsx` | 19 | `useUsers` | 0 |
| `lib/hooks/useFooterVisibility.ts` | 31 | `useFooterVisibility` | 1 |
| `lib/schema/appointment/index.tsx` | 109 | `useAppointmentSchemas` | 3 |
| `lib/schema/booking/index.tsx` | 25 | `useBookingSchemas` | 2 |
| `lib/schema/reserve/index.tsx` | 19 | `useReserveSchemas` | 2 |
| `lib/use-media-query.tsx` | 19 | `useMediaQuery` | 1 |
| `sdk/hooks/useAccountDiscounts.tsx` | 50 | `useAccountDiscounts` | 0 |
| `sdk/hooks/useRoomPricing.tsx` | 106 | `useRoomPricing` | 7 |
| `sdk/mutations/customers.tsx` | 42 | `useAddCpUser` | 3 |
| `sdk/mutations/forms.tsx` | 9 | `useCpWidgetsSaveLead` | 2 |
| `sdk/mutations/reviews.tsx` | 7 | `useCreateReviewTicket` | 1 |
| `sdk/mutations/verify.tsx` | 26 | `useConfirmInvitation` | 0 |
| `sdk/queries/customers.tsx` | 32 | `useFindCustomer` | 3 |
| `sdk/queries/forms.tsx` | 110 | `useCpFormDetail` | 3 |
| `store/index.tsx` | 22 | `useSelectAtom` | 0 |
Consumers = number of distinct files that import the hook (directory-import aliases resolved).

### 5.3 Never imported (6)

| Hook | File | LOC | Status |
|---|---|---:|---|
| `useBranches` | `components/appointment/hooks/useBranches.tsx` | 19 | queries `branches.ts` from the dead `appointment/graphql` tree; the branch data it needs is already provided by `useTmsBranches` (`sdk/queries/tms.tsx`) |
| `useUsers` | `components/appointment/hooks/useUsers.tsx` | 17 | queries `users.ts`; the app loads users through `clientPortalCurrentUser` instead |
| `usePaymentModal` | `components/appointment/hooks/usePaymentModal.tsx` | 16 | the **only zustand store in the app** (§6.5); declared, never opened |
| `useConfirmInvitation` | `sdk/mutations/verify.tsx` | 26 | the file's **only** export, and it is never imported. Its underlying `mutations.confirmInvitation` is referenced *only from inside this dead hook* — so **both the hook and the mutation are dead**, even though §4.2 lists `ClientPortalConfirmInvitation` as having a consumer. |
| `useAccountDiscounts` | `sdk/hooks/useAccountDiscounts.tsx` | 50 | has a `export default` as well as a named export; both unused — discounts are read from `pricingPlanDetailsAtom` instead |
| `useSelectAtom` | `store/index.tsx` | 8 | exported from the providers file; nobody calls it |

Note that this is the trap a bundle-level dead-code pass will misclassify: `sdk/mutations/verify.tsx` *does* import a live document (`mutations.confirmInvitation`) and *does* call `useMutation`, so a reachability scan rooted at the module graph marks it live. Only a scan rooted at **what the app actually renders or calls** finds that nothing ever calls `useConfirmInvitation`. The same shape applies to `sdk/hooks/useAccountDiscounts.tsx`, which imports three live things. See §4.4 note 8.

### 5.4 The hooks that matter — full source

#### 5.4.1 `useCurrentUser` — `src/sdk/queries/auth.tsx:16-52`

The user identity. Every authenticated page depends on it. Full source:

```ts
export const useCurrentUser = (onCompleted?: (data: any) => void) => {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const [loading, setLoading] = useAtom(loadingUserAtom);
  const [refetchUser, setRefetchUser] = useAtom(refetchCurrentUserAtom);

  const { data, refetch } = useQuery(queries.currentUser, {
    onError(error) {
      setLoading(false);
      if (error.message === "token expired") {
        return sessionStorage.removeItem("token");
      }
      if (error.message === "User is not logged in") {
        onCompleted && onCompleted(null);
        return setCurrentUser(null);
      }
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (data) {
      const { clientPortalCurrentUser } = data;
      setCurrentUser(clientPortalCurrentUser);
      setLoading(false);
      onCompleted && onCompleted(clientPortalCurrentUser);
    }
  }, [data]);

  useEffect(() => {
    if (refetchUser) {
      refetch();
      setRefetchUser(false);
    }
  }, [refetchUser]);

  return { currentUser, loading, setLoading };
};
```

Defects visible in 37 lines:

- **Auth state is inferred from a human-readable error string.** `error.message === "token expired"` and `=== "User is not logged in"` are server prose. Any copy change on the server silently disables the branch. There is no `extensions.code` check.
- **A failed token only clears `sessionStorage` — it does not clear the refresh tokens** (`refreshToken`/`refetchToken` are separate keys, §2.4), so a subsequent request can still attempt a refresh with stale material.
- `onCompleted` is called inside `useEffect` with `[data]` only; if the caller passes a new closure each render the effect does not re-run, and a stale closure captures stale state.
- The query has **no `fetchPolicy`** — Apollo's default `cache-first` applies, so `refetchCurrentUserAtom` is the *only* way to force a network round-trip, which is why `refetchUser` exists at all.
- `setLoading` is returned to callers, letting any component flip the global loading flag.

#### 5.4.2 `useLogin` + `useLoginCallback` — `src/sdk/mutations/auth.tsx:36-93`

The token-writing path. Full source:

```ts
const useLoginCallback = () => {
  const router = useRouter();
  const from = useSearchParams().get("from");
  const triggerRefetchUser = useSetAtom(refetchCurrentUserAtom);
  const setLoadingUser = useSetAtom(loadingUserAtom);
  const { currentUser } = useCurrentUser();
  const showWelcomeToast = useRef(false);

  const t = useTranslations("commonToastMessages");

  useEffect(() => {
    if (currentUser && showWelcomeToast.current) {
      const userName = currentUser.firstName ? ` ${currentUser.firstName}` : "";
      toast.success(t("welcome", { name: userName }), {
        description: t("welcomeDesc"),
      });
      showWelcomeToast.current = false;
    }
  }, [currentUser, t]);

  return {
    loginCallback: (
      { token, refreshToken, refetchToken }: ILoginData,
      callback?: () => void,
    ) => {
      if (token) {
        const nextRefreshToken = refreshToken || refetchToken || "";

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("refreshToken", nextRefreshToken);
        sessionStorage.setItem("refetchToken", nextRefreshToken);
        triggerRefetchUser(true);
        setLoadingUser(true);
        showWelcomeToast.current = true;

        router.push(from ? from : "/");
        !!callback && callback();
      }
    },
  };
};

export const useLogin = (onCompleted?: () => void) => {
  const { loginCallback } = useLoginCallback();
  const t = useTranslations("commonToastMessages");

  const [login, { loading, error }] = useMutation(mutations.login, {
    onCompleted: ({ clientPortalUserLoginWithCredentials }) => {
      loginCallback(
        normalizeLoginResponse(clientPortalUserLoginWithCredentials),
        onCompleted,
      );
    },
    onError: createErrorHandler(t),
  });

  return { login, loading, error };
};
```

Defects:

- **`sessionStorage.setItem("refreshToken", nextRefreshToken)` and `sessionStorage.setItem("refetchToken", nextRefreshToken)` write the *same* value to two keys.** One of the two names is dead weight; the refresh link in §2 reads `refreshToken`, and `refetchToken` is written but (per §2.5) only ever read back by the OAuth helpers in `lib/utils.ts` — which are themselves unused. So there are effectively two redundant copies of the refresh secret in `sessionStorage`.
- **Tokens are written to `sessionStorage`, not `localStorage`** — so a refresh of the tab survives, but a new tab does not. This is a deliberate choice (§2) but it is not documented anywhere.
- `loginCallback` is recreated on every render and captured by `useMutation`'s `onCompleted` — Apollo keeps the *first* `onCompleted` it was given unless the options object changes identity, so `from` (the post-login redirect) is read from the closure at the time `useLogin` first ran.
- `if (token)` means a **successful login response with no token is silently swallowed** — no error, no toast, no state change. The user sees nothing.
- `useLoginCallback` calls `useCurrentUser()`, which runs `queries.currentUser` — so **the login form issues a current-user query before login has completed**.

#### 5.4.3 `usePipelineId` — `src/sdk/queries/sales.tsx:7-33`

The root of the whole sales/board hierarchy. Full source:

```ts
const PMS_BOARD_NAME = "PMS board";
const PMS_PIPELINE_NAME = "PMS";

export const usePipelineId = () => {
  const { data: boardsData, loading: boardsLoading } = useQuery(
    queries.boards,
  );

  const boards = boardsData?.cpSalesBoards ?? [];
  const boardId = boards.find(
    (board: { name: string }) => board.name === PMS_BOARD_NAME,
  )?._id;

  const { data: pipelinesData, loading: pipelinesLoading } = useQuery(
    queries.pipelines,
    {
      variables: { boardId, isAll: true },
      skip: !boardId,
    },
  );

  const pipelines = pipelinesData?.cpSalesPipelines?.list ?? [];
  const pipelineId = pipelines.find(
    (pipeline: { name: string }) => pipeline.name === PMS_PIPELINE_NAME,
  )?._id;

  return {
    boardId,
    pipelineId,
    loading: boardsLoading || pipelinesLoading,
  };
};
```

**This is the single hardest-coupled hook in the application.** It is imported by **20 files**.

- **It discovers ids by matching display strings.** `board.name === "PMS board"` and `pipeline.name === "PMS"` — exact, case-sensitive, English. If an operator renames the board in the erxes admin, or translates it, **every booking flow silently stops resolving an id**, and because `skip: !boardId` only skips the second query, `pipelineId` becomes `undefined` and every downstream query runs with `pipelineId: undefined` rather than failing loudly.
- Two hardcoded literals are not in `env` (§11 A-39).
- **No caching of its own result** — every one of the 20 importers runs two `useQuery` calls. Apollo's cache deduplicates identical in-flight queries, but the `find` over the arrays runs in every component.
- It returns `loading` but **not `error`** — a 403 or a network failure on `cpSalesBoards` yields `boards = []`, `boardId = undefined`, and the page renders as if there simply were no rooms.

#### 5.4.4 `useRoomPricing` — `src/sdk/hooks/useRoomPricing.tsx:17-75`

The pricing entry point (7 importers). First 60 lines:

```ts
export const useRoomPricing = () => {
  const { startDate } = useAtomValue(reserveAtom);
  const { currentUser } = useCurrentUser();
  const { rooms: allRoomProducts, loading: roomsLoading } = useRooms();
  const { pricingPlans: listedPlans, loading: plansLoading } =
    useActivePricingPlans();
  const detailedPlans = useAtomValue(pricingPlanDetailsAtom);
  const { departmentId, loading: departmentLoading } = usePmsDepartmentId();

  const planById = useMemo(() => {
    const map = new Map<string, IPricingPlan>(
      listedPlans.map((plan) => [plan._id, plan]),
    );

    for (const plan of detailedPlans) map.set(plan._id, plan);

    return map;
  }, [listedPlans, detailedPlans]);

  const roomById = useMemo(
    () => new Map(allRoomProducts.map((room) => [room._id, room])),
    [allRoomProducts],
  );

  const context = useMemo(
    () => ({
      date: startDate ? new Date(startDate) : undefined,
      companyId: currentUser?.erxesCompanyId,
      customerId: currentUser?.erxesCustomerId,
      departmentId,
      branchId: process.env.NEXT_PUBLIC_BRANCH_ID || undefined,
    }),
    [startDate, currentUser, departmentId],
  );
```

This hook is the **fan-in point of the data layer**: it simultaneously reads the Jotai reserve atom, the Apollo current-user query, the Apollo rooms query, the Apollo pricing query, a Jotai pricing atom (which is itself filled by another Apollo query), and the Apollo branch query. Six sources, one memo. It is also the one hook that calls `process.env.NEXT_PUBLIC_BRANCH_ID` — an env var whose presence was not verified in §11.

Its sibling `src/sdk/hooks/usePlanPrice.tsx` is the pure-function counterpart and is the **best-written file in the data layer** — documented, total, no network:

```ts
export const applyPricingPlan = (
  unitPrice?: number,
  plan?: IPricingPlan | null,
) => {
  if (!plan || typeof unitPrice !== "number") return unitPrice;

  const discounted =
    plan.type === "percentage"
      ? unitPrice * (1 - plan.value / 100)
      : unitPrice - plan.value;

  return Math.max(0, discounted);
};
```

`Math.max(0, …)` floors a discount that exceeds the price at zero rather than producing a negative price. This is the pattern the rest of the layer should follow.

#### 5.4.5 `useBookingSubmit` — `src/components/appointment/hooks/useBookingSubmit.tsx:30-55`

The write path. Header:

```ts
export const useBookingSubmit = ({
  context,
  products,
  productId,
  currentUser,
  defaultValues,
  resetForm,
  quantity = 1,
}: UseBookingSubmitParams) => {
  const t = useTranslations("Appointment");
  const router = useRouter();
  const { addDeal } = useAddDeal();
  const config = CONTEXT_CONFIG[context];
  const { stages } = useSalesStages(config.pipelineId);
  const { labels } = useLabels();
  const { tags } = useTags();
  const { handleFindCustomer } = useFindCustomer();
  const { handleAddCpUser } = useAddCpUser();
  const { addLabel } = useLabelAdd();
  const { addPrePaymentTag } = useAddPrePaymentTag();
  const { handleCreateProductsData } = useCreateDealProductsData();
```

**Eleven hooks in one component** — four reads and seven writes. This is the composition root for "submit a booking": it must find or create the customer, create the deal, attach products, attach labels and pre-payment tags, then navigate. Note `config.pipelineId` comes from a *local* `CONTEXT_CONFIG` map (§11 A-40 — a second, hardcoded source of pipeline ids that coexists with `usePipelineId`'s runtime discovery).

`products: any[]` and `currentUser: any` are `any` — see §7.4.

### 5.5 Cross-cutting hook defects

| # | Defect | Where |
|---:|---|---|
| 1 | **Every query wrapper re-implements normalisation.** `data?.cpPosts || []`, `(data?.cpCategories?.list || [])`, `data?.cpPmsRooms ?? []`, `data?.cpSalesBoards ?? []` — the optional-chain-and-default idiom is written by hand ~60 times, and the *field name* (`cpPosts`, `list`, `?? []` vs `|| []`) differs per file. | all `sdk/queries/*.tsx` |
| 2 | **`?? []` and `|| []` are mixed.** `||` treats `0`, `""`, and `null` the same; `??` does not. For arrays the visible difference is nil, but the inconsistency shows the idiom was never standardised. | `sdk/queries/sales.tsx:28` vs `cms.tsx:19` |
| 3 | **`fetchPolicy` is set inconsistently.** `useCmsPosts` uses `fetchPolicy: "no-cache"`, `useCurrentUser` uses the default, `useCheckRooms` uses `"no-cache"`, `useRoomCategories` uses nothing. There is no project rule. | §5.4, `sdk/queries/*` |
| 4 | **`notifyOnNetworkStatusChange: true` only in `useCmsPosts`.** Elsewhere a refetch leaves `loading` false, so refetch spinners appear on some pages and not others. | `sdk/queries/cms.tsx:18` |
| 5 | **Loading is merged ad hoc.** `loading: loading || loadingCategoryIds`, `loading: roomsLoading || plansLoading || departmentLoading` — every hook invents its own combination, and hooks that *don't* merge (like `usePipelineId`) report partial loading. | §5.4.3 |
| 6 | **Errors are mostly discarded.** `useQuery` results destructure only `{ data, loading, refetch }` in nearly every wrapper; `error` is dropped, so a failed query renders as an empty list with no error state. `useCurrentUser` is the sole exception and it switches on `error.message`. | all `sdk/queries/*.tsx` |
| 7 | **`useMutation` errors go to `createErrorHandler(t)` (toast) but not to state**, so a form cannot disable its submit button on failure. | `sdk/mutations/*.tsx` |
| 8 | **Six hooks are dead** (§5.3), including the app's only zustand store. | — |


---

## 6. STATE

### 6.1 Verdict

**Client state is Jotai and almost nothing else.** Five module files, **63 lines total**, plus a 22-line providers file. There is no Redux, no MobX, no React Query, no context store of your own. The three `createContext` calls in the repo are all inside `src/components/ui/{form,carousel}.tsx` — shadcn/ui primitives, unrelated to data.

| Store | Library | Files | LOC | Verdict |
|---|---|---:|---:|---|
| `src/store/*.ts` | Jotai `atom` / `atomWithStorage` | 5 | **63** | the real client state |
| `src/store/index.tsx` | Jotai `Provider` + Apollo `Provider` | 1 | 22 | composition root only |
| `src/components/appointment/hooks/usePaymentModal.tsx` | zustand | 1 | 16 | **dead** — never imported (§5.3) |
| React Context | — | 3 | — | shadcn/ui form + carousel only |
| Apollo `InMemoryCache` | `@apollo/client` | 2 clients | — | the *other* half of client state (§6.6) |
| Web storage | — | — | 51 read/write sites | the third half (§6.7) |

26 of the 39 hook files import from `jotai`.

### 6.2 Full source — every store file

The entire Jotai store, unabridged. This is the whole of §6.2 in 85 lines including the provider.

**`src/store/auth.ts` (8 lines)**

```ts
import { IUser } from "@/types/auth";
import { atom } from "jotai";

export const currentUserAtom = atom<IUser | null>(null);

export const loadingUserAtom = atom<boolean>(true);

export const refetchCurrentUserAtom = atom<boolean>(false);
```

**`src/store/config.ts` (4 lines)**

```ts
import { IConfig } from "@/types/config";
import { atom } from "jotai";

export const currentConfigAtom = atom<IConfig | null>(null);
```

**`src/store/pricing.ts` (8 lines)**

```ts
import { atom } from "jotai";
import { IAccountDiscount, IPricingPlan } from "@/types/pricing";

export const pricingPlanDetailsAtom = atom<IPricingPlan[]>([]);

export const accountDiscountsAtom = atom<IAccountDiscount[]>([]);

export const loadingAccountDiscountsAtom = atom<boolean>(false);
```

**`src/store/reserve.ts` (21 lines)** — the booking wizard's state; the only store with a default-value constant and the only one using `atomWithStorage`.

```ts
import { IProduct } from "@/types/products";
import { IReserve, IRoomGuestAssignment } from "@/types/reserve";
import { addDays } from "date-fns";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { toCalendarDay } from "@/lib/date";

export const reserveAtomDefaultValues: IReserve = {
  startDate: toCalendarDay(new Date()),
  endDate: toCalendarDay(addDays(new Date(), 1)),
  roomCount: 0,
  guests: { adult: 0, child: 0, pet: false },
};

export const reserveAtom = atom<IReserve>(reserveAtomDefaultValues);
export const selectedRoomsAtom = atom<IProduct[]>([]);
export const roomGuestAssignmentsAtom = atom<IRoomGuestAssignment[]>([]);

export const dealIdAtom = atomWithStorage<string | null>("dealId", null);

export const currentStepAtom = atom<number>(1);
```

**`src/store/index.tsx` (22 lines)** — providers, and one exported helper nobody uses.

```tsx
"use client";

import { type Atom, Provider as JotaiProvider, useAtomValue } from "jotai";
import ApolloProvider from "@/app/[locale]/ApolloClient";
import { selectAtom } from "jotai/utils";

export function useSelectAtom(
  anAtom: Atom<unknown>,
  keyFn: (v: unknown, prevSlice?: unknown) => unknown
) {
  return useAtomValue(selectAtom(anAtom, keyFn));
}

const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <JotaiProvider>
      <ApolloProvider>{children}</ApolloProvider>
    </JotaiProvider>
  );
};

export default Providers;
```

`useSelectAtom` is **dead** (§5.3). Note the nesting order: `JotaiProvider` *wraps* `ApolloProvider`, and `ApolloProvider` is the default export of `app/[locale]/ApolloClient.tsx` — i.e. the Apollo client module doubles as a React provider component. That is why the Apollo file must be a `.tsx` with `"use client"`.

### 6.3 Atom inventory (12 atoms across 4 files)

| Atom | Type | File | Written by | Read by |
|---|---|---|---|---|
| `currentUserAtom` | `IUser \| null` | `store/auth.ts:4` | `useCurrentUser`, `useLogin`-path, `useLogout` | 15+ files |
| `loadingUserAtom` | `boolean` (init `true`) | `store/auth.ts:6` | `useCurrentUser`, `useLoginCallback` | auth screens |
| `refetchCurrentUserAtom` | `boolean` (refetch *trigger*, not a value) | `store/auth.ts:8` | `useLoginCallback`, `useLogout`, token refresh | `useCurrentUser` effect |
| `currentConfigAtom` | `IConfig \| null` | `store/config.ts:4` | `containers/config/currentConfig.tsx:13` | booking pages, `useRoomPricing` chain |
| `pricingPlanDetailsAtom` | `IPricingPlan[]` | `store/pricing.ts:4` | pricing detail fetcher | `useRoomPricing` |
| `accountDiscountsAtom` | `IAccountDiscount[]` | `store/pricing.ts:6` | `useAccountDiscounts` (**dead hook**) | — |
| `loadingAccountDiscountsAtom` | `boolean` | `store/pricing.ts:8` | same dead hook | — |
| `reserveAtom` | `IReserve` (dates + guests) | `store/reserve.ts:15` | `components/layout/Reserve.tsx` | `useRoomPricing`, `useResultRooms`, pricing |
| `selectedRoomsAtom` | `IProduct[]` | `store/reserve.ts:16` | room picker | `useCheckRooms` |
| `roomGuestAssignmentsAtom` | `IRoomGuestAssignment[]` | `store/reserve.ts:17` | room/guest assignment UI | summary |
| `dealIdAtom` | `string \| null`, **persisted to `localStorage` under key `dealId`** | `store/reserve.ts:19` | booking submit | resume flow |
| `currentStepAtom` | `number` (init `1`) | `store/reserve.ts:21` | wizard navigation | wizard |

Defects:

1. **`refetchCurrentUserAtom` is a boolean used as a signalling channel**, not as state. Its entire protocol is "set `true` → effect sees it → calls `refetch()` → sets `false`". If two components set it `true` in the same tick, only one refetch happens and the second setter's `false` can clear it before the effect runs. A Jotai `atom` holding a counter, or `atomWithReset`, would be the idiomatic fix.
2. **`loadingUserAtom` initialises to `true` globally.** Until `useCurrentUser` resolves, *every* consumer of `currentUserAtom` sees loading — including on public pages that never asked for the user.
3. **Two atoms are owned by a dead hook** (`accountDiscountsAtom`, `loadingAccountDiscountsAtom`) — dead state that still occupies the store surface.
4. **`dealIdAtom` is the only persisted atom** and it uses `atomWithStorage` → `localStorage`, while the auth tokens use `sessionStorage` (§6.7). Two different persistence lifetimes with no comment explaining why a booking id survives a new tab but a token does not.
5. **No derived/read-only atoms.** Every consumer recomputes. `useRoomPricing` memoises `planById` locally instead of exposing an atom.

### 6.4 Contexts

Only three, all shadcn/ui:

| Context | File | Purpose |
|---|---|---|
| `FormFieldContext` | `components/ui/form.tsx` | label/error/description for one field |
| `FormItemContext` | `components/ui/form.tsx` | field id |
| `CarouselContext` | `components/ui/carousel.tsx` | embla carousel API |

**There is no application-level React Context.** Data flows through Jotai + Apollo only. This is a good, uniform architecture — the cost is that §6.3's 12 atoms are the *entire* vocabulary available for shared state, which is why `useBookingSubmit` (§5.4.5) takes eleven hooks instead of reading a store.

### 6.5 zustand

`package.json:65` declares `"zustand": "^5.0.7"` and exactly one file uses it:

```ts
// src/components/appointment/hooks/usePaymentModal.tsx
import { create } from "zustand";
```

That file is **never imported** (§5.3). The only `create()` in the app is dead code carrying a live dependency.

### 6.6 Apollo cache — the state you do not see

Both clients construct `new InMemoryCache()` with **no configuration**: no `typePolicies`, no `keyFields`, no `merge` functions. Consequences:

- **Objects are identified by `id`/`_id` by default.** erxes returns `_id` almost everywhere, which Apollo accepts as the default key. Where a type has *no* `_id` in the selection set (e.g. `CpSalesPipelines` returns `{ list { ... } }`, `cpProducts` returns `_id` but `cpCategories` returns only `{ _id name slug }`) the object is stored under an *implicit* path key and will not deduplicate across queries.
- **`fetchPolicy` differences mean two caches.** Files using `"no-cache"` (§5.5 row 3) read nothing and write nothing; files using the default read from and write to the same cache. A field updated by a `no-cache` query will not be reflected in a `cache-first` query on the same type — this is a live source of "the list didn't update after I booked" bugs.
- **No cache mutation after writes.** `useAddDeal`, `useLabelAdd`, `useCpWidgetsSaveLead` etc. never call `cache.modify` or `update`. After a successful mutation the only refresh mechanisms are `refetchQueries` (not used), a page navigation, or `refetchCurrentUserAtom` for the user specifically.
- **`apollo3-cache-persist` / `persistCache` is not present**, so the cache dies on reload. That is consistent with `sessionStorage` tokens (§2.4) — the app treats itself as ephemeral.

### 6.7 Web storage — the state outside React

51 storage read/write sites across 16 files. Three distinct stores, three different lifetimes:

| Store | Keys | Writers | Readers | Lifetime |
|---|---|---|---|---|
| `sessionStorage` | `token`, `refreshToken`, `refetchToken` | `sdk/mutations/auth.tsx:62-64`, `ApolloClient.tsx:78` | `ApolloClient.tsx:41-47,65-66`, `containers/auth/current-user.tsx:45` | **tab** |
| `sessionStorage` | `PAY_AT_PROPERTY_CONFIRMATION_KEY`, booking-details payload | `bookingDetailsPage.tsx:98`, `bookingConfirmPage.tsx:40` | `bookingConfirmPage.tsx:40` | **tab** |
| `localStorage` | `access_token`, `refresh_token`, `token_expiry` | `lib/utils.ts:177-180` | `lib/utils.ts:159,166,186` | **— all dead (§2.6)** |
| `localStorage` | `cachedCustomerId` | `sdk/queries/forms.tsx:101`, `ContactForm.tsx:162`, `CreateOwnTripForm.tsx:88` | `forms.tsx:85`, `ContactForm.tsx:157`, `ErxesFormModal.tsx:311`, `CreateOwnTripForm.tsx:65` | **device** |
| `localStorage` | `customerId` | `ErxesFormModal.tsx:346` | `ErxesFormModal.tsx:310` | **device** |
| `localStorage` | `TDB_RETURN_KEY` (TDB payment return) | `payment-detail.tsx:388`, `tourPaymentDetail.tsx:335` | `payment-detail.tsx:82`, `tourPaymentDetail.tsx:50` | **device** |
| `localStorage` | `dealId` (via `atomWithStorage`) | `store/reserve.ts:19` | same | **device** |
| `localStorage` | `LS_KEY_RESERVE_OPEN`, privacy-gate flag | `layout/Reserve.tsx:129`, `privacy-terms-gate.tsx:24` | `Reserve.tsx:78`, `privacy-terms-gate.tsx:15` | **device** |

Notable:

- **`cachedCustomerId` and `customerId` are two different keys for the same concept** and `ErxesFormModal.tsx:310-311` reads both with `||`, i.e. it prefers `customerId` but falls back to `cachedCustomerId`. Nothing ever writes `cachedCustomerId` and `customerId` in the same file.
- **The erxes customer id is persisted in `localStorage` in plaintext** and is sent as a variable on `CpWidgetsSaveLead` (`cachedCustomerId`, §4). Any script running on the origin can read it and reuse it.
- **The dead OAuth helpers in `lib/utils.ts:159-230` write `access_token`/`refresh_token` to `localStorage`** while the live path writes `token`/`refreshToken` to `sessionStorage` — if someone ever "fixes" a bug by enabling those helpers, two competing token stores appear simultaneously.
- `document.cookie` is **never** written by application code; the only cookie in the system is next-intl's locale cookie set by middleware (§2.7).


---

## 7. TYPES

### 7.1 Inventory

`src/types/` is **15 files, 716 lines**. Hand-written, one file per erxes domain, no codegen, no `*.graphql` → `*.ts` step (§3).

| File | LOC | Exports | Drives |
|---|---:|---|---|
| `types/pricing.ts` | 118 | `IPricingRule`, `IPricingRepeatValue`, `IPricingRepeatRule`, `IPricingPlan`, `IAccountDiscount`, … | `useRoomPricing`, `usePlanPrice`, `pricingPlanDetailsAtom` |
| `types/sales.ts` | 89 | `IDeal`, `IDealDetail`, `IDealProduct`, `IStage`, `ITag`, `ILabel`, `IPaymentData` | every booking/deal hook, `sdk/queries/{sales,auth}.tsx` |
| `types/tms.ts` | 116 | `BmTour`, `BmTourDetail`, `Itinerary`, … | `sdk/queries/tms.tsx` |
| `types/cms.ts` | 81 | `ICmsPost`, `ICmsPage`, `ICmsMenu`, `ICmsPostCategory`, `IResultRoomPost` | `sdk/queries/cms.tsx` (47 consumers) |
| `types/products.ts` | 76 | `IProduct`, `IProductCategory`, `IAttachment`, `IPoscProduct` | rooms, pos, pricing, reservations |
| `types/forms.ts` | 66 | `IForm`, `IFormSubmission`, … | `sdk/queries/forms.tsx` |
| `types/config.ts` | 33 | `IUiOptions`, `IConfig` | `currentConfigAtom` |
| `types/payments.ts` | 31 | `IInvoice`, `IPayment`, … | `sdk/queries/payments.tsx` |
| `types/kb.ts` | 25 | `IKbArticle`, `IKbCategory` | `sdk/queries/kb.tsx` |
| `types/reserve.ts` | 18 | `IReserve`, `IGuests`, `IRoomGuestAssignment` | `reserveAtom` |
| `types/rooms.ts` | 16 | `IRoomCategory`, `IReservationSummary` | reservation summary |
| `types/tours.ts` | 16 | `BmTour` (a **second, incompatible** `BmTour`) | see §7.4 item 3 |
| `types/auth.ts` | 14 | `CustomerType`, `IUser` | `currentUserAtom` |
| `types/index.ts` | 10 | `IPageProps`, `CommonParams` | Next.js page props |
| `types/customers.ts` | 7 | `ICustomer` | deal customers |

### 7.2 Full source — the load-bearing types

**`src/types/auth.ts` (14 lines)** — the type behind `currentUserAtom`, i.e. the type of "who is logged in" for the entire app:

```ts
export type CustomerType = "" | "user" | "company";

export interface IUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  erxesCustomerId?: string;
  erxesCompanyId?: string;
  phone?: string;
  email?: string;
  username?: string;
  code?: string;
}
```

Compare with the selection set of `query clientPortalCurrentUser` (§4.3.2): `_id, firstName, lastName, avatar, erxesCustomerId, erxesCompanyId, code, phone, email, username` — **ten fields, ten properties, an exact match.** This is the one place in the codebase where a hand-written type demonstrably tracks its query. `code` is last in the interface and last in the document; `CustomerType` is never part of `IUser`.

**`src/types/reserve.ts` (18 lines)** — the booking wizard state:

```ts
export interface IReserve {
  startDate: Date;
  endDate: Date;
  roomCount: number;
  guests: IGuests;
}

export interface IGuests {
  adult: number;
  child: number;
  pet?: boolean;
}

export interface IRoomGuestAssignment {
  roomId: string;
  adult: number;
  child: number;
}
```

Note `startDate: Date` — but `reserveAtomDefaultValues` builds it with `toCalendarDay(new Date())`, and `useRoomPricing` immediately does `new Date(startDate)` (§5.4.4), which is a no-op only if it already *is* a `Date`. The type says `Date`, the calendar library may hand back a `CalendarDate`. Nothing enforces it.

**`src/types/config.ts` (33 lines)** — the type of everything in `currentConfigAtom`, and the type that carries a secret:

```ts
export interface IUiOptions {
  colors: {
    primary: string;
    secondary: string;
    third: string;
  };
  logo: string;
}

export interface IConfig {
  _id: string;
  name: string;
  userId: string;
  uiOptions: IUiOptions;
  token: string;
  departmentId: string;
  description: string;
  erxesAppToken: string;
  extraProductCategories: string[];
  roomCategories: string[];
  paymentIds: string[];
  pipelineConfig: {
    boardId: string;
    pipelineId: string;
  };
  checkintime?: string;
  checkouttime?: string;
  user1Ids: string[];
  user2Ids: string[];
  user3Ids: string[];
  user4Ids: string[];
  user5Ids: string[];
}
```

`token: string` and `erxesAppToken: string` are **non-optional** on a type held in a Jotai atom readable from any component. The type system is *telling* you these are always present — see §11 A-38 and the Open Questions.

**`src/types/index.ts` (10 lines)** — the only two types shared by every page:

```ts
import { QueryOptions } from "@apollo/client";

export interface IPageProps {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface CommonParams {
  variables?: QueryOptions["variables"];
}
```

`params`/`searchParams` are `Promise<…>` — this is the Next.js 15 async-params signature, confirming the app is on the App Router version where route params are awaited (consistent with §1 of the architecture report).

`CommonParams` is the closest thing the repo has to a **typed variables helper**, and it is nearly useless: `QueryOptions["variables"]` is `OperationVariables`, i.e. `Record<string, any>`. It adds no type safety to any call site.

### 7.3 The type gaps

| # | Gap | Evidence |
|---:|---|---|
| 1 | **No type for any GraphQL response.** Not one `useQuery<…>` is parameterised except `useQuery<{ cpProducts: IProduct[] }>` (`sdk/queries/rooms.tsx:45`) and `useQuery<{ cpPmsBranchDetail: … }>` (`sdk/queries/rooms.tsx:18`). Everywhere else `data` is `any`, so `data?.cpPosts` is unchecked against the document in §4.3.7. | 2 parameterised `useQuery` in the whole repo |
| 2 | **`any` is permitted repo-wide.** `@typescript-eslint/no-explicit-any` is `"off"` in *both* `eslint.config.mjs:17` and `.eslintrc.json:8`. 26 `: any` / `as any` / `any[]` occurrences in `src/types`, `src/sdk`, `src/store` alone; `products: any[]` and `currentUser: any` appear in `useBookingSubmit`'s signature (§5.4.5). | §5.5, ESLint configs |
| 3 | **Two incompatible `BmTour` declarations.** `types/tms.ts` (116 lines) exports a `BmTour`; `types/tours.ts` (16 lines) exports a *different* `BmTour` with `itinerary: any`, `images: string[]`, `imageThumbnail: string`. `types/tours.ts` imports nothing and declares its interface **without `export` on the `interface` keyword**, re-exporting via `export type { BmTour }`. Whether a given file gets the rich or the `any`-laden one depends on which path it imports. | `types/tms.ts` vs `types/tours.ts` |
| 4 | **`IProduct` does not model `discount` / `discounts`** even though the live `rooms` query selects both (§4.3.6). The pricing hook works around this with `Pick<IProduct, "_id" \| "unitPrice" \| "discounts">` (`sdk/hooks/useRoomPricing.tsx:14`) — so `discounts` *is* in `IProduct` but `discount` is not, and neither is validated. | `types/products.ts`, `useRoomPricing.tsx:14` |
| 5 | **`paymentTypes` is selected in three documents** (`config/queries.ts:17,62`, `sales/queries.ts:195`, `appointment/branches.ts:57`) and appears on `IConfig` as `paymentIds: string[]` — but the *field actually fetched* is `paymentTypes`, a different name. The type and the query disagree. | `types/config.ts` vs §4.3.3 |
| 6 | **Server enums are typed as `string`.** `IPricingPlan.type: string`, `IPricingRule.type: string`, `IStage`/`ITag` colour fields — while the documents already *know* the enum (`PostStatus`, `DATE_STATUS`, `CURSOR_MODE` in §4.3.9). No `as const` unions anywhere in `src/types`. | all of §7.1 |
| 7 | **`customFieldsData` / `customFieldsMap` / `propertiesData` / `paymentsData` are untyped.** They are `JSON` on the server and `any` in the types (`IDeal.productsData?: any[]`, `paymentsData?: any[]`), yet they are the fields the pricing and payment logic actually reads. | `types/sales.ts:8,15` |
| 8 | **No `UNVERIFIED` marker exists in `src/types`.** Since there is no schema (§3), *every* field name in this section is asserted from reading documents and consumers — none of it was checked against the erxes schema. Treat all of §7 as `UNVERIFIED` against the server. | — |

### 7.4 What is typed well

Credit where due, because §7.3 is harsh:

- `IUser` ↔ `clientPortalCurrentUser` selection set is an exact, verifiable match (§7.2).
- `IReserve` / `IGuests` / `IRoomGuestAssignment` are small, total, and used consistently — the reserve store (§6.2) is the cleanest slice of the data layer.
- `types/rooms.ts` **composes** rather than duplicates: `IRoomCategory extends IProductCategory`, `IReservationSummary` reuses `IGuests` and `IProduct`. This is the right instinct.
- `IPageProps` correctly models async route params.
- `applyPricingPlan`'s `PricedProduct = Pick`-style structural type (§5.4.4) shows the codebase *can* express narrow types when someone bothers.



---

## 8. SERVER vs CLIENT FETCHING

### 8.1 The split, in one table

| Layer | Component type | How it fetches | Count |
|---|---|---|---:|
| Route pages `src/app/**/page.tsx` | **Server Components** (0 of 45 contain `"use client"`) | `generateMetadata` → `getCmsPostDetail()` → `getClient()` → one GraphQL query | **45 pages, 4 of which actually fetch** |
| Everything under `src/components`, `src/containers` | Client Components (180 files carry `"use client"`) | `useQuery` / `useMutation` on the singleton client | 180 |
| API routes `src/app/api/**/route.ts` | Node route handlers | raw `fetch()` to an external host | 2 |
| Middleware `src/middleware.ts` | Edge | **no fetching, no auth** — `next-intl` only, 7 lines | 1 |
| Plain async functions in `src/sdk/queries/*.tsx` | callable from either side | `getClient()` (server) or the module-level singleton | 8 call sites |

**There is no `getServerSideProps`, no `getStaticProps`, no `use server`, no server action, no `revalidatePath`, and no `fetch()` inside any page body.** The *only* server-side GraphQL traffic in the entire application is `generateMetadata`.

### 8.2 The metadata path — full source

This is the one place the server talks to erxes. `src/app/[locale]/accommodation/[slug]/page.tsx` in full:

```tsx
import ClientAccommodationDetailPage from "@/components/clientPages/accommodationPage/accommodationDetailPage"
import useMetadata from "@/lib/hooks/useMetadata"
import { getCmsPostDetail } from "@/sdk/queries/cms"
import { IPageProps } from "@/types"
import { Metadata } from "next"

export async function generateMetadata({
  params,
}: IPageProps): Promise<Metadata> {
  const { locale, slug } = await params

  const { post } = await getCmsPostDetail(slug, locale)
  const { title, excerpt } = post || {}

  const { metadata } = await useMetadata(title, excerpt, locale)

  return {
    ...metadata,
  }
}

const AccommodationDetailPage = () => {
  return <ClientAccommodationDetailPage />
}

export default AccommodationDetailPage
```

And the function it calls, `src/sdk/queries/cms.tsx:61-70`:

```ts
export const getCmsPostDetail = async (id: string, language: string) => {
  const client = getClient();
  const { data, loading } = await client.query({
    query: queries.CmsPostDetail,
    variables: { id, language },
  });

  const post: ICmsPost = data?.cpPost || ({} as ICmsPost);

  return { post, loading };
};
```

Observations:

1. **The page fetches the post twice.** `generateMetadata` fetches it server-side; `ClientAccommodationDetailPage` then fetches it again client-side with `useCmsPostDetail`. There is no `React.cache()` de-duplication, no passing of the server result down as a prop. Two round trips per detail page view.
2. **`useMetadata` is an `async function` whose name starts with `use`** (`src/lib/hooks/useMetadata.ts:1`). It is not a hook — it calls no hooks, and it is awaited. It exists only so the file name looks conventional. ESLint's `rules-of-hooks` is `off` (`.eslintrc.json`, `eslint.config.mjs`), which is the only reason this does not produce an error on all 45 pages.
3. **`getCmsPostDetail` has no `.catch()` on 3 of its 4 call sites.** `fund/projects/[slug]/page.tsx:13` does `.catch(() => ({ post: ... }))`; `accommodation`, `activities`, `news` do not. If erxes is down or the slug is bad, those three pages throw during metadata generation and the whole route 500s — while `fund` degrades gracefully. Inconsistent.
4. **`getClient()` is the *server* client** (`src/sdk/getClient.tsx`) and reads `NEXT_PUBLIC_ERXES_APP_TOKEN` / `NEXT_PUBLIC_MAIN_API_DOMAIN` at call time. It is called from 8 places, all inside `src/sdk/queries/*.tsx` as *plain async functions* — which means those functions are isomorphic by accident: they work on the server only if the caller is a server component, and on the client only if `typeof window` matters (it does not — both clients point at the same URI).

### 8.3 Everything else is client-side

- **No prefetching.** `link prefetching` is Next.js defaults only. The data layer never warms a query before navigation.
- **No streaming / Suspense around data.** `loading.tsx` files exist for routing but no `useSuspenseQuery`.
- **The very first paint of every page is empty-then-filled.** Since page bodies render a client component that immediately calls `useQuery`, the server HTML contains no product/post data. Search crawlers that do not execute JS see an empty `<main>`; only the `generateMetadata` title/description is server-rendered.
- **Auth is resolved on the client.** `containers/auth/current-user.tsx:45` does `if (!sessionStorage.getItem("token"))` — a synchronous `sessionStorage` read during render, which is why that file must be a client component and why the server can never know who the user is. The server therefore cannot do per-user SSR at all; §9's "who can call what" is a purely client-side concern.

### 8.4 The two API routes

| Route | Method | Purpose | Feature flag | Caching |
|---|---|---|---|---|
| `src/app/api/google-reviews/route.ts` | `GET` | proxies Google Places, normalises reviews | `features.google_reviews` | `export const revalidate = 86400` + `next: { revalidate }` — **the only cached fetch in the repo** |
| `src/app/api/company-signup/unlock/route.ts` | `POST` | sets the `company_signup_unlocked` cookie (§2) | `features.company_accounts` | none |

`google-reviews` is a genuine server fetch with a hardcoded fallback `PLACE_ID` (`route.ts:3`) and an API key read from `process.env.GOOGLE_MAPS_API_KEY` (server-only, correctly *not* `NEXT_PUBLIC_`). It is the best-behaved file in the data layer: it checks the key, warns, and returns `{ reviews: [] }` instead of throwing.

### 8.5 Middleware

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|.*\..*).*)'
};
```

**There is no auth middleware.** No token check, no session cookie, no redirect to `/login`, no route protection of any kind. The matcher excludes `api`, `_next`, `_vercel`, and any path containing a dot. Every route — including `/profile`, `/booking/payment/*`, `/booking/details` — is publicly reachable at the HTML level and relies entirely on the client to (a) notice the absence of a token and (b) redirect. That is the design; it is documented here so it is not mistaken for a gap introduced by this analysis.

---

## 9. API CONTRACT

### 9.1 Transport

| Item | Value |
|---|---|
| Protocol | HTTPS GraphQL over HTTP |
| URI | `` `${process.env.NEXT_PUBLIC_MAIN_API_DOMAIN}/graphql` `` — `ApolloClient.tsx:21` (browser) and `getClient.tsx:6` (server) |
| Subscriptions URI | `` `${process.env.NEXT_PUBLIC_MAIN_SUBS_DOMAIN \|\| ""}/graphql"` `` — `ApolloClient.tsx:121`. **`NEXT_PUBLIC_MAIN_SUBS_DOMAIN` is not defined in `next.config.ts`, so the effective WS url is `"/graphql"` — subscriptions cannot connect.** |
| Auth header (browser) | `authorization: "Bearer <token>"` from `sessionStorage.token` — `ApolloClient.tsx:48-53` |
| Auth header (server) | `authorization: "Bearer <NEXT_PUBLIC_ERXES_APP_TOKEN>"` — `getClient.tsx:12-15` |
| App header | `x-app-token: <NEXT_PUBLIC_ERXES_APP_TOKEN>` — `ApolloClient.tsx:56`, `getClient.tsx:14` |
| Customer identity | `x-customer-id: <erxesCustomerId>` when set — `ApolloClient.tsx:59-62` |
| Locale | **never sent** (§2.6) |
| Content type | `application/json` (Apollo default) |
| File upload | `POST ${NEXT_PUBLIC_MAIN_API_DOMAIN}/upload-file?kind=main` with `FormData` and **`credentials: "include"`** — `lib/upload.ts:16-20`. The rest of the app is bearer-authenticated and never sends cookies, so this credential flag is either vestigial or relying on a cookie this app does not set. |
| File read | `${NEXT_PUBLIC_MAIN_API_DOMAIN}/gateway/read-file?key=…` rewritten by `lib/utils.ts:55,61` |
| Token refresh | `POST ${NEXT_PUBLIC_ERXES_API_URL}/oauth/refresh` — `lib/utils.ts:202-204`. **`NEXT_PUBLIC_ERXES_API_URL` is undefined** and this function has no callers → dead (§2.6). The live refresh is the GraphQL `ClientPortalRefreshToken` mutation at `ApolloClient.tsx:73`. |
| Error policy | `"all"` on the browser client (`ApolloClient.tsx:29`) — GraphQL errors are delivered to `onError` alongside partial data |

**Two different refresh mechanisms exist**, one dead REST call and one live GraphQL mutation, and the live one is chosen by an `operation.operationName === "ClientPortalRefreshToken"` guard at `ApolloClient.tsx:34` so that refreshing does not recurse.

### 9.2 Which operation serves which screen

| Screen (route) | Reads | Writes |
|---|---|---|
| `/` home | `CmsPosts`, `CmsMenus`, `CmsCategories`, `CpSalesBoards`+`CpSalesPipelines` (via `usePipelineId`) | — |
| `/accommodation`, `/activities`, `/news`, `/dining`, `/lodge-stays` | `CmsPosts`, `CmsPostDetail`, `CmsPostDetail` again in `generateMetadata` | — |
| `/accommodation/[slug]` detail | `CmsPostDetail`, `CpProducts` (`rooms`), `CpPricingPlans`, `CpPmsBranchDetail` | — |
| `/booking` wizard (steps 1…n) | `CpProducts`, `CpProductCategories`, `CpPmsBranchDetail`, `CpSalesStages`, `CpDeals`, `CpSalesPipelines` | `CpDealsAdd`, `customersAdd`, `ClientPortalUserRegister`, `cpSalesPipelineLabelsAdd`, `cpTagsAdd`, `CpDealsCreateProductsData` |
| `/booking/details` | `CpDealDetail`, `CpInvoices`, `InvoiceDetail`, `CpPricingPlanDetail` | `CpInvoiceCreate` |
| `/booking/payment/[slug]`, `/tours/payment/…`, `/activities/payment/…`, `/dining/payment/…`, `/merch/payment/…` | `InvoiceDetail`, `CpInvoices` | `CpInvoiceCreate`, `CpInvoicesCheck` |
| `/tours`, `/tours/[id]` | `CpBmsTours`, `CpBmsTourDetail`, `CpBmsItineraryDetail`, `CpBmsBranchList` | `CpBmsOrderAdd`, `CpBmsOrderEdit` |
| `/forms/[slug]` | `CpFormDetail`, `CpForms` | `CpWidgetsSaveLead` |
| `/contact-us` | `CpFormDetail` (inline copy) | `CpWidgetsSaveLead` (inline copy) |
| `/(auth)/login` | `clientPortalCurrentUser` (before login!) | `ClientPortalUserLoginWithCredentials`, `ClientPortalGoogleAuthentication`, `ClientPortalFacebookAuthentication` |
| `/(auth)/signup` | — | `ClientPortalUserRegister`, `sendVerificationCode` (**dead**) |
| `/(auth)/verify` | — | `ClientPortalUserVerify` |
| `/(auth)/forgot-password`, `/reset-password` | — | `clientPortalUserForgotPassword`, `ClientPortalUserResetPassword` |
| `/profile` | `clientPortalCurrentUser`, `UserDetail`, `CpGetTickets`, `CpPricingPlans` | `clientPortalUserEdit`, `clientPortalUserChangePassword`, `CpCreateTicket` |
| `/careers` | `knowledgeBaseArticles`, `knowledgeBaseCategories` | — |
| every authenticated screen | `clientPortalCurrentUser` → `currentUserAtom` | `ClientPortalRefreshToken` on 401 |

### 9.3 Response shapes you must expect

| Operation | Shape | Gotcha |
|---|---|---|
| `ClientPortalUserLoginWithCredentials` | `String` **or** `{ token, refreshToken, refetchToken }` **or** `null` | must be normalised — `normalizeLoginResponse` (`sdk/mutations/auth.tsx:29`) |
| `CpDealsAdd` | `{ _id }` only | everything else must be refetched |
| `CpSalesPipelines` | `{ list: [...] }` | nested `list` — unlike `cpSalesStages` which returns a bare array |
| `CpSalesStages` | `[...]` | bare array — **same hierarchy, different envelope** |
| `CpBmsTours` | `{ list, totalCount, pageInfo }` | cursor pagination, unlike everything else which is offset |
| `CpPages` (dead) / `PageList` | `{ pages: [...] }` | third envelope style |
| `CpProducts` (in `rooms`) | `[...]` | bare array |
| `clientPortalCurrentUser` | object or `null` | `null` when logged out — must be handled, not thrown |
| `cpInvoicesCheck` | scalar (no selection set) | return type unknown without a schema → **UNVERIFIED** |
| `cpInvoiceCreate` | object incl. `transactions[].response` | `response` is the raw gateway payload — see §10 A-58 |

### 9.4 Pagination — three incompatible schemes

| Scheme | Used by | Evidence |
|---|---|---|
| Offset (`perPage`, `page`) | `rooms`, `poscProducts`, `CpPosts` | `sdk/graphql/rooms/queries.ts`, `pos/queries.ts` |
| Cursor (`cursor`, `cursorMode`, `direction`, `pageInfo`) | `CpBmsTours` | §4.3.9 |
| None (fetch all) | `CpSalesStages`, `CpSalesPipelines`, `CmsMenus`, `CmsCategories`, `cpTags` | `limit: 100` hardcoded in `useCmsCategories` (`sdk/queries/cms.tsx:87`) |

There is no shared pagination helper.

### 9.5 What the client is trusted with

- `NEXT_PUBLIC_ERXES_APP_TOKEN` (the `x-app-token`) and `NEXT_PUBLIC_PMS_TOKEN` are shipped to the browser. `NEXT_PUBLIC_PMS_TOKEN` is additionally passed **as a GraphQL variable named `id`** (`sdk/queries/rooms.tsx:19,31`, `containers/config/currentConfig.tsx:17`) — i.e. it is used both as a header token and as a record id, depending on the call.
- `cpPmsBranchDetail` returns `token` and `erxesAppToken` into `currentConfigAtom` (§4.3.3).
- `customerId` / `cachedCustomerId` persist in `localStorage` (§6.7).

**There is no client-only secret in this app.** Anything with `NEXT_PUBLIC_` is public by construction. §11 lists names only; values are redacted.

---

## 10. REPRODUCE vs AVOID RULES

### REPRODUCE — do this, exactly as the codebase already does it

| # | Rule | Evidence |
|---:|---|---|
| R1 | **Define every GraphQL document once in `src/sdk/graphql/<domain>/`, export it from that domain's `index.ts`, and consume it only through `src/sdk/queries/<domain>.tsx` or `src/sdk/mutations/<domain>.tsx`.** Never open `gql` in a component. | `sdk/graphql/cms/index.ts` → `sdk/queries/cms.tsx` → 47 components |
| R2 | **Name the file after the erxes module**, and give the domain directory both a `queries.ts` and a `mutations.ts` even if one is an empty stub — barrels must stay uniform. | 14 domains, `auth`…`tms` |
| R3 | **Use the two-client split as-is**: `getClient()` inside an `async` function, the module singleton inside a hook. Do not introduce a third client. | `sdk/getClient.tsx:4`, `app/[locale]/ApolloClient.tsx:21` |
| R4 | **Read the current user from `currentUserAtom`, never from a local copy of the query result.** The atom is the single source of truth. | `store/auth.ts:4`, consumed by 15+ files |
| R5 | **Signal "refetch the user" with `refetchCurrentUserAtom`, not with a manual `client.refetchQueries()`.** Every existing logout/login path does this. | `sdk/mutations/auth.tsx:59`, `ApolloClient.tsx:80` |
| R6 | **Write tokens to `sessionStorage` under exactly `token` / `refreshToken` / `refetchToken`, and read them through `getToken()`/`getRefreshToken()` in `ApolloClient.tsx`.** | `sdk/mutations/auth.tsx:62-64`, `ApolloClient.tsx:41-47` |
| R7 | **Guard the refresh mutation by `operation.operationName`, not by URL or path.** This is what stops refresh recursion. | `ApolloClient.tsx:34` |
| R8 | **Set `errorPolicy: "all"`** so GraphQL errors reach `onError` instead of being thrown as network errors. | `ApolloClient.tsx:29` |
| R9 | **Normalise a scalar-or-object login response through a single helper** rather than reading `data.token` directly. | `normalizeLoginResponse`, `sdk/mutations/auth.tsx:29-34` |
| R10 | **Route all mutation errors through `createErrorHandler(t)`** with `useTranslations` so the message is localised. | `sdk/mutations/*.tsx` |
| R11 | **Keep zod schema factories in `src/lib/schema/<flow>/index.tsx` and export the derived type from a sibling `types.ts`** — `AppointmentFormT = ReturnType<typeof useAppointmentSchemas>[...]`. | `lib/schema/booking/types.ts:5` |
| R12 | **Express pricing as pure functions next to the hook that uses them**, and floor the result at zero. | `applyPricingPlan`, `sdk/hooks/usePlanPrice.tsx:10-20` |
| R13 | **Read shared booking state from `reserveAtom` / `selectedRoomsAtom` / `currentStepAtom`, not from component state**, so the wizard can be resumed. | `store/reserve.ts:15-21` |
| R14 | **Persist only `dealId` across sessions**; everything else stays in memory. | `store/reserve.ts:19` |
| R15 | **Do server fetching only in `generateMetadata`**, using `await params` for locale/slug. | 45 pages |
| R16 | **Use the route handler + `revalidate` pattern for third-party APIs**, with a key check and an empty fallback rather than a throw. | `app/api/google-reviews/route.ts:3-33` |
| R17 | **Keep `middleware.ts` limited to `next-intl`.** Auth lives in `containers/auth/current-user.tsx`. | `src/middleware.ts` |
| R18 | **Type a hand-written interface against the exact selection set when the shape is stable** — `IUser` ↔ `clientPortalCurrentUser` is the model. | `types/auth.ts` ↔ §4.3.2 |
| R19 | **Compose types instead of duplicating them**: `IRoomCategory extends IProductCategory`, `IReservationSummary` reuses `IGuests`. | `types/rooms.ts` |
| R20 | **Await `params` before using `slug`/`locale`** (Next 15 async params). | `types/index.ts:4` |

### AVOID — never do this

| # | Rule | Evidence |
|---:|---|---|
| A1 | **Do not add codegen "later" without also deleting `src/components/appointment/graphql/`.** Two copies exist only because nothing generates the truth. | §3.4 |
| A2 | **Do not define an operation name twice.** 14 names are already duplicated (§4.5) and nothing checks the two copies agree. | §4.5 |
| A3 | **Do not import from `@/components/appointment/graphql/*` in new code.** Only `paymentPage.tsx:18` and four appointment hooks still do. | §3.4 |
| A4 | **Do not create a third token store.** `sessionStorage` (live), `localStorage` (dead OAuth helpers), cookie (`company_signup_unlocked`) already coexist. | §2.4, §6.7 |
| A5 | **Do not read or write `access_token` / `refresh_token` / `token_expiry`.** The functions that do are dead; enabling them creates a second, conflicting store. | `lib/utils.ts:159-230` |
| A6 | **Do not rely on `error.message` text to branch auth logic.** `"token expired"` and `"User is not logged in"` are server prose. | `sdk/queries/auth.tsx:24-30` |
| A7 | **Do not assume `sessionStorage.removeItem("token")` logs the user out.** It leaves `refreshToken` and `refetchToken` behind. | `sdk/queries/auth.tsx:24` |
| A8 | **Do not swallow a login response that has no token.** `if (token)` currently does nothing at all in that case. | `sdk/mutations/auth.tsx:54` |
| A9 | **Do not discover board/pipeline ids by comparing display names.** `"PMS board"` and `"PMS"` are exact, case-sensitive, English. | `sdk/queries/sales.tsx:6-7,16,29` |
| A10 | **Do not pass `pipelineId: undefined` downstream without failing.** `usePipelineId` returns no `error`, so a broken board silently yields empty rooms. | `sdk/queries/sales.tsx:30-33` |
| A11 | **Do not hardcode a second source of pipeline ids.** `CONTEXT_CONFIG[context].pipelineId` in `useBookingSubmit` competes with `usePipelineId`. | `useBookingSubmit.tsx:41` |
| A12 | **Do not use `TERMINAL_STAGE_CODES` from a literal list without checking it against the board.** `["canceled", "checkedout"]` are code strings from the server. | `sdk/queries/rooms.tsx:15` |
| A13 | **Do not use `fetchPolicy: "no-cache"` on a query whose result another query reads.** Mixed policies mean two caches that do not see each other's writes. | §6.6, `sdk/queries/cms.tsx:18` |
| A14 | **Do not mutate the cache by hand after a write** — there are no `cache.modify` calls today; adding one inconsistently is worse than refetching. | §6.6 |
| A15 | **Do not drop `error` from `useQuery` destructuring in a new wrapper.** It is already the dominant bug (§5.5 row 6); do not extend it. | all `sdk/queries/*.tsx` |
| A16 | **Do not name a plain async function with a `use` prefix.** `useMetadata` is not a hook. | `lib/hooks/useMetadata.ts:1` |
| A17 | **Do not call `generateMetadata` fetch without `.catch()`.** 3 of 4 sites lack it and will 500 the route. | §8.2 note 3 |
| A18 | **Do not fetch the same document twice on one page.** Detail pages fetch in `generateMetadata` and again client-side. | §8.2 note 1 |
| A19 | **Do not put a secret in `NEXT_PUBLIC_*`.** It is compiled into the bundle. | §9.5 |
| A20 | **Do not pass a token as a GraphQL `id` variable.** `NEXT_PUBLIC_PMS_TOKEN` is used both ways. | `sdk/queries/rooms.tsx:19` |
| A21 | **Do not write `credentials: "include"` on `uploadFile`** — the app authenticates with a bearer header and sets no auth cookie. | `lib/upload.ts:19` |
| A22 | **Do not call `NEXT_PUBLIC_ERXES_API_URL`.** It is undefined and the caller is dead; the live refresh is the GraphQL mutation. | `lib/utils.ts:202` |
| A23 | **Do not point subscriptions at `NEXT_PUBLIC_MAIN_SUBS_DOMAIN`.** It is undefined, so the ws url resolves to `"/graphql"` and cannot work. | `ApolloClient.tsx:121` |
| A24 | **Do not use `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` or `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID` expecting them to be set** — both fall back to literals. | §11 |
| A25 | **Do not add a `document.cookie` write.** The app never sets one; middleware owns the locale cookie. | §6.7 |
| A26 | **Do not read `localStorage.customerId` without also reading `cachedCustomerId`.** Two keys hold the same concept and one is the fallback. | `ErxesFormModal.tsx:310-311` |
| A27 | **Do not persist a customer id in `localStorage` in a new place** — there are already two keys plus `dealId`. | §6.7 |
| A28 | **Do not use zustand.** Its only use in the repo is a dead store; adding a second state library breaks the Jotai-only rule. | `usePaymentModal.tsx` |
| A29 | **Do not add a React Context for app state.** The three existing ones are shadcn/ui primitives. | `components/ui/{form,carousel}.tsx` |
| A30 | **Do not initialise a global loading atom to `true` and never reset it on error.** `loadingUserAtom` does exactly that. | `store/auth.ts:6` |
| A31 | **Do not use a boolean atom as an event channel.** `refetchCurrentUserAtom` loses updates when two setters race. | `store/auth.ts:8` |
| A32 | **Do not add `atomWithStorage` for anything except a resume id.** Auth deliberately lives in `sessionStorage`, not in Jotai. | `store/reserve.ts:19` |
| A33 | **Do not type a response as `any`.** `no-explicit-any` is off in both ESLint configs, so nothing will stop you. | `.eslintrc.json:8`, `eslint.config.mjs:17` |
| A34 | **Do not add a second `BmTour`.** `types/tms.ts` and `types/tours.ts` already disagree. | §7.3 item 3 |
| A35 | **Do not use `CommonParams` as if it were typed.** `QueryOptions["variables"]` is `Record<string, any>`. | `types/index.ts:9-11` |
| A36 | **Do not select `content` on a list query.** `CpPosts` fetches full post bodies for every item in a 47-file hot path. | §4.3.7 |
| A37 | **Do not add a second query against the same root field with a smaller selection.** `UserDetail` and `clientPortalCurrentUser` both hit `clientPortalCurrentUser`. | §4.3.2 |
| A38 | **Do not extend `IConfig` with another credential**, and do not treat `token` / `erxesAppToken` as safe to read from any component. | `types/config.ts` |
| A39 | **Do not hardcode board/pipeline/category display names or ids in new code** — use the env names already declared (§11) or a server-provided field. | §11 |
| A40 | **Do not add a `CONTEXT_CONFIG`-style local id map.** | `useBookingSubmit.tsx:41` |
| A41 | **Do not use `${commonFields}` / `${commonParams}` template interpolation in a new document.** Only `CpDealsAdd` does it and it defeats any document-level tooling. | §4.3.4 |
| A42 | **Do not select the same field twice in one selection set.** `CpDealDetail` selects `paymentsData` twice. | §4.3.8 |
| A43 | **Do not write a raw `fetch()` to an erxes host from a component.** Use the client or `getClient()`. | §8.4 |
| A44 | **Do not return `loading` without `error` from a new query hook.** `usePipelineId` is the cautionary example. | §5.4.3 |
| A45 | **Do not let a hook both read and write the same atom without `useAtom`.** Splitting `useAtomValue` + `useSetAtom` hides the coupling. | `useCurrentUser` uses `useAtom` correctly |
| A46 | **Do not import `client` from `ApolloClient` inside a component.** `sdk/mutations/auth.tsx:3` does it to run `client.mutate` outside React — that is the only acceptable use. | `sdk/mutations/auth.tsx:3` |
| A47 | **Do not assume `data?.x || []` and `data?.x ?? []` behave the same.** They are mixed across wrappers. | §5.5 row 2 |
| A48 | **Do not skip `notifyOnNetworkStatusChange` in a refetching UI.** Only `useCmsPosts` sets it, which is why refetch spinners are inconsistent. | `sdk/queries/cms.tsx:18` |
| A49 | **Do not put a GraphQL error toast inside `useQuery.onError` and also inside `createErrorHandler`.** `useCurrentUser` does both patterns. | `sdk/queries/auth.tsx:23-32` |
| A50 | **Do not return `setLoading` from a query hook.** Letting callers flip global loading is how `loadingUserAtom` gets stuck. | `sdk/queries/auth.tsx:52` |
| A51 | **Do not name a file `use<X>.tsx` if it exports a component.** `sdk/hooks/useErxesForm.tsx` exports `ErxesForm`. | `useErxesForm.tsx:3` |
| A52 | **Do not add an operation to a barrel that nothing reads.** 7 keys are dead *inside* live files and no linter can see them. | §4.4 note 7 |
| A53 | **Do not mark a module live just because it imports live things.** `sdk/mutations/verify.tsx` is dead despite importing a live document. | §5.3 |
| A54 | **Do not add a dead `atomWithStorage` key** — `accountDiscountsAtom` is already owned by a dead hook. | `store/pricing.ts:6` |
| A55 | **Do not fetch with `language \|\| "mn"` as a default** while `routing.defaultLocale` is `'en'`. The data layer and the router disagree about the default language. | `sdk/queries/cms.tsx:244` vs `i18n/routing.ts` |
| A56 | **Do not rely on `revalidate` being set anywhere except `google-reviews`.** It is the only cached fetch. | §8.4 |
| A57 | **Do not add a `getServerSideProps`.** This is an App Router project; there is no Pages Router file in `src/`. | §8.1 |
| A58 | **Do not render `transactions[].response` verbatim.** It is the raw gateway payload from `cpInvoiceCreate`. | §4.3.5 |
| A59 | **Do not `JSON.parse` `localStorage` without the `safeJsonParse` helper** — `payment-detail.tsx` and `tourPaymentDetail.tsx` both do it correctly; copy them. | `payment-detail.tsx:82` |
| A60 | **Do not introduce a cache persistence library.** Both clients are ephemeral by design, matching `sessionStorage` tokens. | §6.6 |

---

## 11. BRAND-SPECIFIC HARDCODING AUDIT

**Rule followed: names and types only. Every value is redacted.**

### 11.1 Environment variables

#### Defined in `next.config.ts` (values inlined into the client bundle)

| Name | Type | Used by | Note |
|---|---|---|---|
| `NEXT_PUBLIC_SAAS_DOMAIN` | url | `useErxesForm.tsx:24` | widget bundle origin |
| `NEXT_PUBLIC_MAIN_API_DOMAIN` | url | `ApolloClient.tsx:21`, `getClient.tsx:6`, `upload.ts:15`, `utils.ts:55,61` | graphql + uploads + read-file |
| `NEXT_PUBLIC_ERXES_APP_TOKEN` | string (secret-ish) | `ApolloClient.tsx:56`, `getClient.tsx:14` | `x-app-token` header — **public** |
| `NEXT_PUBLIC_PMS_TOKEN` | string (secret-ish) | `rooms.tsx:19,31`, `currentConfig.tsx:17` | used as a GraphQL **`id` variable** — **public** |
| `NEXT_PUBLIC_BRANCH_ID` | id | `useRoomPricing.tsx:51` | |
| `NEXT_PUBLIC_CP_ID` | id | `mutations/auth.tsx:26`, many queries as `clientPortalId` | |
| `NEXT_PUBLIC_TMS_BRANCH_ID` | id | `tms.tsx:18,82` | |
| `NEXT_PUBLIC_ERXES_API_URL` | url | `utils.ts:203` | **undefined; caller dead** (§9.1) |
| `NEXT_PUBLIC_MAIN_SUBS_DOMAIN` | url | `ApolloClient.tsx:121` | **undefined; subscriptions broken** (§9.1) |
| `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` | id | pay-at-property flow | **undefined; falls back to a literal** |
| `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID` | id | tour packages form | **undefined; falls back to a literal** |
| `GOOGLE_MAPS_API_KEY` | secret (server) | `api/google-reviews/route.ts` | correctly **not** `NEXT_PUBLIC_` |

#### Read from `process.env` but **not** declared in `next.config.ts`

| Name | Type | Used by | Note |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` (server-side only — do **not** prefix with `NEXT_PUBLIC_`) / `GOOGLE_PLACE_ID` | string | `api/google-reviews/route.ts:3`, `places.googleapis.com` call | `PLACE_ID` has a **hardcoded ObjectId fallback** |
| `NEXT_PUBLIC_APPROVED_STAGE_ID` | id | `useDeals.tsx:19` | server-side env only — but read in a client component, so it must be exposed to the client to work at all |
| `NEXT_PUBLIC_PENDING_STAGE_ID` | id | `useAddDeal.tsx:23` | same concern |
| `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID` | id | pay-at-property | same concern |
| `CAR_CATEGORY_ID` | id | `TimeForm.tsx:98,100` | |
| `PC_CATEGORY_ID` | id | `TimeForm.tsx:126` | |
| `PARENT_CATEGORY_ID` | id | `useCategories.tsx:8` | |
| `NEXT_PUBLIC_BRANCH_ID` | id | `useRoomPricing.tsx:51` | declared in config, but read with `\|\| undefined` |
| `NODE_ENV` | enum | build only | |

> **`NEXT_PUBLIC_APPROVED_STAGE_ID`, `NEXT_PUBLIC_PENDING_STAGE_ID`, `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID`, `CAR_CATEGORY_ID`, `PC_CATEGORY_ID`, `PARENT_CATEGORY_ID` are read via `process.env.X` without the `NEXT_PUBLIC_` prefix from files that are `"use client"`.** In Next.js these are **not** available in the browser unless they are prefixed or inlined at build time. Whether they currently resolve is **UNVERIFIED** — see Open Questions.

### 11.2 Hardcoded brand literals in source

| # | File:line | Literal (value redacted) | Category | Severity |
|---:|---|---|---|---|
| 1 | `lib/utils.ts:154` | `https://local.omz.mn/gateway/read-file?key=` | **foreign host** — a *different* developer's domain, inside `readFileSchedule` | high (dead code, but present) |
| 2 | `components/authImages/images.tsx:86` | `https://<tenant>.next.erxes.io/gateway/read-file?key=` | tenant read-file host, not derived from `NEXT_PUBLIC_MAIN_API_DOMAIN` | high |
| 3 | `components/ErxesWidget.tsx:69` | `https://<tenant>.nextwidgets.erxes.io/messengerBundle.js` | widget host, hardcoded | high |
| 4 | `sdk/queries/tms.tsx:18` | `<ObjectId>` as the final `\|\|` fallback for `TMS_BRANCH_ID` | **duplicated literal** — same value as `next.config.ts`, so removing the config entry does not remove it | high |
| 5 | `api/google-reviews/route.ts:3` | `<place-id>` as fallback for `GOOGLE_PLACE_ID` | Google Place id | medium |
| 6 | `app/[locale]/layout.tsx:69,79` | analytics measurement id | analytics | medium |
| 7 | `app/[locale]/layout.tsx:90,100` | tag-manager container id | analytics | medium |
| 8 | `components/layout/Footer.tsx:45` | `https://www.facebook.com/<page>` | brand social | medium |
| 9 | `components/layout/Footer.tsx:40` | `https://www.instagram.com/<handle>` | brand social | medium |
| 10 | `sdk/queries/sales.tsx:6` | `"PMS board"` | **display-string coupling** | high |
| 11 | `sdk/queries/sales.tsx:7` | `"PMS"` | **display-string coupling** | high |
| 12 | `sdk/queries/rooms.tsx:15` | `["canceled", "checkedout"]` | server stage codes | medium |
| 13 | `sdk/queries/cms.tsx:8` | `dining-photos`, `dining-at-tegri-gobi`, `discover-more`, `culinary-experiences` | **brand-specific CMS slugs** as `DINING_SUB_SLUGS` | high for rebrand |
| 14 | `components/BannerSection.tsx:103` | `"Tegri Gobi 3D"` | brand string in a banner title | medium |
| 15 | `components/layout/Header.tsx:172,331`, `SecondaryHeader.tsx:90,177` | brand alt text | a11y string | low |
| 16 | `components/layout/Footer.tsx:62,183` | brand logo alt text | a11y string | low |
| 17 | `components/clientPages/activitiesPage/activitiesDetailPage.tsx:95` | `"ACTIVITIES AT TEGRI GOBI"` | **brand string that should be an i18n key** | medium |
| 18 | `components/fund/data.ts:338` | brand name inside marketing copy | copy | low |
| 19 | `components/layout/Footer.tsx:22`, `HeaderAppointment.tsx:11` | `/images/logo-footer-en.png` vs `/images/logo-footer.png` | locale-branched asset path, not an i18n key | medium |
| 20 | `lib/schema/*` | — | none found | — |

### 11.3 Hardcoded non-brand configuration

| # | File:line | Literal | Why it matters |
|---:|---|---|---|
| 21 | `sdk/queries/rooms.tsx:47` | `perPage: 500` | room list page size |
| 22 | `sdk/queries/cms.tsx:87` | `limit: 100` | category page size |
| 23 | `lib/upload.ts:4` | `MAX_BYTES = 20 * 1024 * 1024` | upload cap |
| 24 | `sdk/queries/pos.tsx` | allowed category ids | POS visibility |
| 25 | `app/[locale]/layout.tsx` | OG image dimensions `1920 × 1080`, `/images/metaBackground.jpg` | metadata default (also in `lib/hooks/useMetadata.ts:5`) |

### 11.4 Summary for a rebrand / multi-tenant fork

To move this app to a different erxes tenant or a different brand you would have to touch, at minimum:

1. `next.config.ts` — all `NEXT_PUBLIC_*` values (12 names, values redacted above).
2. **Nine hardcoded literal sites** (rows 1–5, 10, 11, 13, 20) that do *not* come from env at all.
3. **The TMS branch id literal at `sdk/queries/tms.tsx:18`**, which will silently keep pointing at the old tenant even after `next.config.ts` is updated.
4. Analytics ids (rows 6–7) and social URLs (rows 8–9).
5. Brand copy and alt text (rows 14–19), of which row 13 (`DINING_SUB_SLUGS`) is the only one that will cause a **runtime** failure rather than a cosmetic one.
6. `messages/en.json` and `messages/mn.json`.

Nothing in `src/types/` or `src/store/` is brand-specific. The data layer's brand coupling is concentrated in `sdk/queries/sales.tsx`, `sdk/queries/tms.tsx`, `sdk/queries/cms.tsx`, and `lib/utils.ts`.


---

## Open Questions / Uncertainties

These are the things this analysis **could not** determine from the source alone. Every one is flagged rather than guessed.

**Schema and codegen**

1. **No schema was available.** There is no `.graphql`, no introspection result, no codegen config (§3). Every "return shape" in §4.2 and every type field in §7 is asserted from reading *documents and consumers*, not from the erxes schema. Treat the whole of §4.2's "Return shape" column and §7 as `UNVERIFIED` against the server.
2. **Scalar-returning operations have unknown types.** The 10 documents with no selection set (§4.1) — e.g. `ClientPortalUserLoginWithCredentials`, `cpInvoicesCheck`, `sendVerificationCode`, `posChooseConfig` — return *something* the client normalises by hand. Whether that is `String`, `JSON`, or a union is unknown.
3. **`NEXT_PUBLIC_ERXES_APP_TOKEN` and `NEXT_PUBLIC_PMS_TOKEN` have unknown authority.** Can a holder of `x-app-token` read *any* tenant's data? That is a property of the erxes deployment, not of this repo.

**Environment variables read but not declared**

4. **Do `NEXT_PUBLIC_APPROVED_STAGE_ID`, `NEXT_PUBLIC_PENDING_STAGE_ID`, `NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID`, `CAR_CATEGORY_ID`, `PC_CATEGORY_ID`, `PARENT_CATEGORY_ID` actually reach the browser?** They are read as `process.env.X` (no `NEXT_PUBLIC_` prefix) from files that are client components (`useDeals.tsx:19`, `useAddDeal.tsx:23`, `TimeForm.tsx:98,126`, `useCategories.tsx:8`). Next.js only exposes `NEXT_PUBLIC_*` (or build-inlined values) to the client. If these resolve to `undefined` today, `stageId: undefined` is being sent on every deal query and the bug is invisible because the server may ignore it. **Could not be verified without running the build.**
5. **Are `NEXT_PUBLIC_PAY_AT_PROPERTY_FORM_ID` and `NEXT_PUBLIC_TOUR_PACKAGES_FORM_ID` meant to be set?** §11 says they fall back to literals; whether the fallback is the *intended* production value or a leftover from development is unknown.
6. **Does `NEXT_PUBLIC_BRANCH_ID` ever resolve?** It is declared in `next.config.ts` and read at `useRoomPricing.tsx:51` with `|| undefined`. If unset, `context.branchId` is `undefined` and pricing runs without branch scoping.

**Auth and tokens**

7. **Is `IConfig.token` the same secret as `NEXT_PUBLIC_ERXES_APP_TOKEN`, or a per-branch token?** `cpPmsBranchDetail` returns `token` and `erxesAppToken` (§4.3.3) and both are stored in `currentConfigAtom`. No consumer of `currentConfig.token` was found in this analysis — but a string field on a widely-read atom is exactly where an accidental `fetch` header would be added later. **Needs a follow-up grep for `.token` reads from `currentConfigAtom`.**
8. **Which refresh token name does the server actually emit — `refreshToken` or `refetchToken`?** `loginCallback` accepts both and writes both (§5.4.2), and `ApolloClient.tsx:41-42` reads both with `||`. That tolerance implies the server has changed the name at least once. Whether it still does is unknown.
9. **Why are tokens in `sessionStorage` rather than an httpOnly cookie?** The choice is consistent, but no comment explains it. An httpOnly cookie would also make `credentials: "include"` on `uploadFile` (§9.1) meaningful.
10. **What does `clientPortalUserVerify` do with a `code` variable** (`types/auth.ts` has `code?: string` on `IUser`, and `ClientPortalUserVerify` takes `$code`)? The relationship between `code`, OTP, and the session is not visible from the client.

**Data-flow ambiguity**

11. **Does `useAddDeal` (sdk) and `useAddDeal` (appointment) ever run in the same tree?** Both are live (§4.5 row 1). If `bookingDetailsPage` and `useBookingSubmit` render simultaneously, two different mutations with the same operation name fire. **Not checked at runtime.**
12. **Is `CpDealsCreateProductsData` idempotent?** The booking submit path calls `useCreateDealProductsData` after `useAddDeal` (§5.4.5); a double-submit would create two product attachments. No guard is visible.
13. **What fills `accountDiscountsAtom`?** `useAccountDiscounts` is the only writer and it is never imported (§5.3). Either the feature was abandoned or another writer exists that was not found. **Residual uncertainty — the atom may be reachable through a dynamic import not visible to static analysis.**
14. **Is `dealId` (`atomWithStorage`, §6.3) ever cleared?** A stale id persisting in `localStorage` across sessions could resume an old booking. Not verified.
15. **Are `customFieldsData` / `customFieldsMap` / `propertiesData` / `paymentsData` read by any logic that depends on a specific key?** They are typed `any` (§7.3 item 7) so no type error would surface if the server renamed a key.

**Server vs client**

16. **How many of the 45 detail pages 500 when erxes is unreachable?** Only `fund/projects/[slug]` has `.catch()` on its metadata fetch (§8.2 note 3). The other three were identified; the other 41 pages do not fetch at all — but a page that *starts* fetching later would inherit the failure mode.
17. **Is there any SEO requirement that the page body be server-rendered?** §8.3 concludes crawlers see an empty `<main>`. If that is acceptable it is a design decision; if not, it is a gap. **Cannot be judged from the repo.**
18. **Does `useMetadata` being async cause Next to await it correctly in all 45 pages?** It is called with `await` everywhere it appears (4 sites found for `getCmsPostDetail`); the other 41 pages call it with literal strings. Whether Next's metadata types accept a `Promise` returned from an async function that is *not* a hook is untested here.

**Subscriptions**

19. **Are the two subscriptions ever registered?** `transactionUpdated` and `invoiceUpdated` live in the dead `appointment/graphql/mutations/invoice.ts` (§4.4). Their sibling `invoicesCheckMutation` from the same file *is* imported by `paymentPage.tsx:18`. So the subscription documents exist in a half-live file and `NEXT_PUBLIC_MAIN_SUBS_DOMAIN` is undefined (§9.1). **Net: no working real-time path exists**, but the exact intent is unclear — is polling (`CpInvoicesCheck`) the intended replacement, or a stopgap?

**Internationalisation**

20. **Which is the default content language?** `i18n/routing.ts` sets `defaultLocale: 'en'`, but `sdk/queries/cms.tsx:244` defaults `language: language || "mn"`, and `date.ts:28,37` branches on `locale === "mn"`. Data and router disagree. **§10 A55** flags this; which one is "right" is a product question.

**Build and tooling**

21. **Which package manager is authoritative?** `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock` are all present (noted in TASK context). This analysis did not verify which one CI uses.
22. **Do the two ESLint configs disagree?** `.eslintrc.json` and `eslint.config.mjs` both exist with overlapping rules (`no-explicit-any` off in both). Which one ESLint actually loads depends on the ESLint version and was not executed here.
23. **Is `@apollo/experimental-nextjs-app_support` actually imported anywhere?** It is a declared dependency that §11 of the architecture report and §2.1 here treat as unused, but a dynamic import would evade static grep. **Not verified at bundle level.**

**Security-adjacent, for completeness**

24. **Is exposing `NEXT_PUBLIC_PMS_TOKEN` as a GraphQL `id` variable (§9.1, §11.1) intentional?** It may be a public record id rather than a secret despite its name. The name says "token", the usage says "id". **Cannot resolve from source.**
25. **Should `localStorage.customerId` / `cachedCustomerId` be revocable?** §6.7 notes they persist in plaintext. Whether the server validates them on every submit is a backend question.

---

