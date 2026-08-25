# Section C — Step 3 (Connect Messenger) — Mobile (Expo)

Use this file after the Expo frontend project exists in `output/<slug>/`.

It extends the main pipeline by connecting the generated Expo app to erxes Messenger — real-time chat, WebSocket subscription, and session-scoped Apollo client.

## When to use this file

Read this file when the user says:

- "connect messenger to mobile app"
- "connect erxes messenger"
- "add live chat to expo app"
- "set up erxes messenger"
- "add messenger SDK"

---

## 0. Agent Mission

When triggered by any of the intents above, run the full messenger integration pipeline without waiting for step-by-step instructions.

The agent reads the generated Expo project tree, sets up a dedicated Apollo client for messenger (separate from the CMS client), generates all required source files, and verifies the connection end to end.

---

## 1. Architecture Overview

```
ErxesApp
  src/
    messenger/
      core/
        apollo/          ← Messenger's own Apollo client
        components/      ← Chat UI components
        hooks/           ← useQuery / useMutation / useSubscription
        graphql/         ← Messenger query, mutation, subscription
        services/        ← API calls
        storage/         ← Session persistence
        types/           ← TypeScript types
        utils/           ← endpoints, helpers
      constants.ts
      context.ts
      ConversationDetail.tsx
      ErxesMessenger.tsx
      Widget.tsx
      index.ts
      messengerTheme.ts
    messengerConfig.ts
```

### Key Principle

Messenger uses its **own Apollo client, separate from the CMS Apollo client**:

|                  | CMS Client                        | Messenger Client                                  |
| ---------------- | --------------------------------- | ------------------------------------------------- |
| **Auth**         | `x-app-token` header (+ `client-auth-token` when logged in) | `credentials: 'include'` (cookie) |
| **Transport**    | HTTP only                         | HTTP + WebSocket                                  |
| **Subscription** | None                              | `graphql-ws`                                      |
| **File**         | `lib/apollo/client.ts`            | `src/messenger/core/apollo/createApolloClient.ts` |

---

## 2. Environment Setup

### 2.1 Required Files

`.env.local`

```env
EXPO_PUBLIC_ERXES_API_URL=https://dent.next.erxes.io/gateway/graphql
EXPO_PUBLIC_ERXES_BRAND_CODE=mRugDycpAY52Ds3fQ6oBI
```

How to get values:

- `EXPO_PUBLIC_ERXES_API_URL`: erxes Admin → Settings → General
- `EXPO_PUBLIC_ERXES_BRAND_CODE`: erxes Admin → Settings → Brands → code

### 2.2 Install Dependencies

```bash
npx expo install @apollo/client graphql graphql-ws
npm install @apollo/client graphql graphql-ws
```

---

## 3. Core Files

### 3.1 Endpoint Normalizer

`src/messenger/utils/endpoints.ts`

```typescript
export type NormalizedEndpoints = {
  httpUrl: string;
  wsUrl: string;
};

export function normalizeApiUrl(apiUrl: string): NormalizedEndpoints {
  const base = apiUrl.replace(/\/$/, "");
  const httpUrl = `${base}/graphql`;
  const wsUrl = base.replace(/^http/, "ws") + "/graphql";
  return { httpUrl, wsUrl };
}
```

### 3.2 Constants

`src/messenger/constants.ts`

```typescript
export const FALLBACK_SOCKET_URL = "ws://localhost:3000/graphql";
export const WS_RETRY_DELAY_MS = 3000;
```

### 3.3 Apollo Client (Messenger's own)

`src/messenger/core/apollo/createApolloClient.ts`

```typescript
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  type DefaultOptions,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

import { FALLBACK_SOCKET_URL, WS_RETRY_DELAY_MS } from "../constants";
import type { NormalizedEndpoints } from "../utils/endpoints";

export type CreateMessengerApolloClientOptions = {
  endpoints: NormalizedEndpoints;
};

const defaultOptions: DefaultOptions = {
  watchQuery: { fetchPolicy: "network-only" },
  query: { fetchPolicy: "network-only" },
};

export const createMessengerApolloClient = ({
  endpoints,
}: CreateMessengerApolloClientOptions): ApolloClient<unknown> => {
  // WebSocket link — used for subscriptions
  const wsLink = new GraphQLWsLink(
    createClient({
      url: endpoints.wsUrl || FALLBACK_SOCKET_URL,
      retryAttempts: 1000,
      retryWait: async () => {
        await new Promise<void>((resolve) =>
          setTimeout(() => resolve(), WS_RETRY_DELAY_MS),
        );
      },
    }),
  );

  // Error logging
  const errorLink = onError(({ networkError, graphQLErrors }) => {
    if (networkError) console.log("[messenger] network error", networkError);
    if (graphQLErrors) console.log("[messenger] graphQL errors", graphQLErrors);
  });

  // HTTP link — credentials: 'include' is REQUIRED (cookie-based session)
  const httpLink = new HttpLink({
    uri: endpoints.httpUrl,
    credentials: "include",
  });

  // Subscription → wsLink, everything else → httpLink
  const splitLink = ApolloLink.split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    ApolloLink.from([errorLink, httpLink]),
  );

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        UserDetailsType: { merge: true },
      },
    }),
    defaultOptions,
  });
};
```

### 3.4 Apollo Container

`src/messenger/core/apollo/ApolloContainer.tsx`

```typescript
import React, { useMemo } from 'react';
import { ApolloProvider } from '@apollo/client/react';

import { createMessengerApolloClient } from './createApolloClient';
import { normalizeApiUrl } from '../utils/endpoints';

type Props = {
  apiUrl: string;
  children: React.ReactNode;
};

const ApolloContainer = ({ apiUrl, children }: Props) => {
  const client = useMemo(() => {
    const endpoints = normalizeApiUrl(apiUrl);
    return createMessengerApolloClient({ endpoints });
  }, [apiUrl]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default ApolloContainer;
```

---

## 4. Agent Rules

1. The messenger Apollo client is **always separate** from the CMS client.
2. `credentials: 'include'` — never remove this.
3. WebSocket retry — `retryAttempts: 1000`, `retryWait: 3000ms`.
4. `EXPO_PUBLIC_` prefix — required for client-side env vars.
5. `normalizeApiUrl` — automatically converts `http` → `ws`, `https` → `wss`.
6. `useMemo` — the client is only recreated when `apiUrl` changes.
7. The host app's bearer token must **never** be passed to the Messenger client.

---

## 5. Verification

```typescript
// Basic connection check
import { getMainDefinition } from "@apollo/client/utilities";
import { normalizeApiUrl } from "./utils/endpoints";

const endpoints = normalizeApiUrl(process.env.EXPO_PUBLIC_ERXES_API_URL!);
console.log("HTTP:", endpoints.httpUrl);
console.log("WS:", endpoints.wsUrl);
```

Pass criteria (this section grows with subsequent files):

- [ ] `ApolloContainer` mounts without errors
- [ ] WebSocket connection is established
- [ ] `credentials: 'include'` header is sent

---

## 6. GraphQL Layer

`src/messenger/core/graphql/` contains **3 files**:

```
graphql/
  mutations.ts      ← connect, insertMessage, readMessages, saveBrowserInfo
  queries.ts        ← conversations list, conversation detail
  subscriptions.ts  ← new message, bot typing, admin message
```

### 6.1 Mutations

`src/messenger/core/graphql/mutations.ts`

**4 mutations:**

| Mutation                          | Purpose                     |
| --------------------------------- | --------------------------- |
| `connect`                         | Establish / restore session |
| `widgetsInsertMessage`            | Send a message              |
| `widgetsReadConversationMessages` | Mark messages as read       |
| `widgetsSaveBrowserInfo`          | Analytics ping (optional)   |

```typescript
import { gql } from "@apollo/client";

/** Establishes (or restores) the customer/visitor session. */
export const connect = gql`
  mutation connect(
    $integrationId: String!
    $visitorId: String
    $cachedCustomerId: String
    $email: String
    $isUser: Boolean
    $phone: String
    $code: String
    $data: JSON
    $companyData: JSON
  ) {
    widgetsMessengerConnect(
      integrationId: $integrationId
      visitorId: $visitorId
      cachedCustomerId: $cachedCustomerId
      email: $email
      isUser: $isUser
      phone: $phone
      code: $code
      data: $data
      companyData: $companyData
    ) {
      integrationId
      messengerData
      languageCode
      uiOptions
      customerId
      visitorId
      ticketConfig
      customer {
        _id
        firstName
        lastName
        phones
        emails
      }
    }
  }
`;

/** Sends a message. When conversationId is null the backend creates one. */
export const widgetsInsertMessage = gql`
  mutation WidgetsInsertMessage(
    $integrationId: String!
    $customerId: String
    $visitorId: String
    $conversationId: String
    $contentType: String
    $message: String
    $attachments: [AttachmentInput]
  ) {
    widgetsInsertMessage(
      integrationId: $integrationId
      customerId: $customerId
      visitorId: $visitorId
      conversationId: $conversationId
      contentType: $contentType
      message: $message
      attachments: $attachments
    ) {
      _id
      conversationId
      customerId
      user {
        _id
        details {
          avatar
          fullName
        }
      }
      content
      createdAt
      internal
      fromBot
      contentType
      attachments {
        url
        name
        size
        type
      }
    }
  }
`;

/** Marks operator messages in a conversation as read. */
export const widgetsReadConversationMessages = gql`
  mutation widgetsReadConversationMessages($conversationId: String) {
    widgetsReadConversationMessages(conversationId: $conversationId)
  }
`;

/** Optional analytics/presence ping. Safe to omit if not used. */
export const widgetsSaveBrowserInfo = gql`
  mutation widgetsSaveBrowserInfo(
    $customerId: String
    $visitorId: String
    $browserInfo: JSON!
  ) {
    widgetsSaveBrowserInfo(
      customerId: $customerId
      visitorId: $visitorId
      browserInfo: $browserInfo
    ) {
      _id
      conversationId
      customerId
      content
      createdAt
    }
  }
`;
```

### 6.2 Queries

`src/messenger/core/graphql/queries.ts`

**2 queries:**

| Query                       | Purpose                                |
| --------------------------- | -------------------------------------- |
| `widgetsConversations`      | Full conversation list + unread count  |
| `widgetsConversationDetail` | All messages for a single conversation |

```typescript
import { gql } from "@apollo/client";

export const widgetsConversations = gql`
  query widgetsConversations(
    $integrationId: String!
    $customerId: String
    $visitorId: String
  ) {
    widgetsConversations(
      integrationId: $integrationId
      customerId: $customerId
      visitorId: $visitorId
    ) {
      _id
      content
      createdAt
      participatedUsers {
        _id
        details {
          avatar
          fullName
          shortName
        }
      }
      messages {
        _id
        content
        createdAt
        customerId
        userId
        isCustomerRead
        fromBot
        botData
        user {
          _id
          details {
            avatar
            fullName
            shortName
          }
        }
      }
    }
  }
`;

export const widgetsConversationDetail = gql`
  query widgetsConversationDetail($_id: String, $integrationId: String!) {
    widgetsConversationDetail(_id: $_id, integrationId: $integrationId) {
      _id
      messages {
        _id
        conversationId
        customerId
        user {
          _id
          details {
            avatar
            fullName
            description
            location
            position
            shortName
          }
        }
        content
        createdAt
        internal
        fromBot
        contentType
        engageData {
          content
          kind
          sentAs
          messageId
          brandId
        }
        botData
        messengerAppData
        attachments {
          url
          name
          size
          type
        }
      }
      operatorStatus
      isOnline
      supporters {
        _id
        details {
          avatar
          fullName
          shortName
        }
      }
      participatedUsers {
        _id
        details {
          avatar
          fullName
          shortName
          description
          position
          location
        }
        links
      }
      persistentMenus
    }
  }
`;
```

### 6.3 Subscriptions

`src/messenger/core/graphql/subscriptions.ts`

**3 subscriptions:**

| Subscription                  | Purpose                         |
| ----------------------------- | ------------------------------- |
| `conversationMessageInserted` | New message in real time        |
| `conversationBotTypingStatus` | Bot typing indicator            |
| `adminMessageInserted`        | Operator message → unread count |

```typescript
import { gql } from "@apollo/client";

/** Fires for every new message — de-duplicate by _id before inserting into cache. */
export const conversationMessageInserted = gql`
  subscription conversationMessageInserted($_id: String!) {
    conversationMessageInserted(_id: $_id) {
      _id
      conversationId
      customerId
      userId
      isCustomerRead
      user {
        _id
        details {
          avatar
          fullName
          description
          location
          position
          shortName
        }
      }
      content
      createdAt
      internal
      fromBot
      contentType
      engageData {
        content
        kind
        sentAs
        messageId
        brandId
      }
      botData
      messengerAppData
      attachments {
        url
        name
        size
        type
      }
    }
  }
`;

/** Bot typing indicator — payload may be boolean or { typing } object. */
export const conversationBotTypingStatus = gql`
  subscription conversationBotTypingStatus($_id: String!) {
    conversationBotTypingStatus(_id: $_id)
  }
`;

/** Customer-wide signal — use to refresh unread counts. */
export const adminMessageInserted = gql`
  subscription conversationAdminMessageInserted($customerId: String) {
    conversationAdminMessageInserted(customerId: $customerId) {
      unreadCount
    }
  }
`;
```

### 6.4 GraphQL Layer — Agent Rules

1. Always call the `connect` mutation first before any query or subscription.
2. Sending `conversationId: null` tells the backend to create a new conversation.
3. Deduplicate all subscription messages by `_id` before inserting into cache.
4. `conversationBotTypingStatus` payload may be `boolean` or `{ typing: boolean }` — normalize both.
5. Use `adminMessageInserted` only for refreshing unread counts, not for other purposes.
6. `widgetsSaveBrowserInfo` is optional — only call it when analytics are needed.

---

## 7. Hooks

`src/messenger/core/hooks/` contains 7 hooks. Each hook has a single responsibility.

```
hooks/
  useAdminMessageSubscription.ts   ← customer-wide operator message signal
  useConnect.ts                    ← session connect mutation (runs once)
  useConversationDetail.ts         ← single thread: query + subscribe + send
  useConversationsList.ts          ← conversation list + unread count
  useMessengerIdentity.ts          ← resolve cached identity from storage
  useReadMarker.ts                 ← mark conversation as read
  useTypingStatus.ts               ← bot typing indicator per conversation
```

### Hook Responsibility Map

| Hook                          | Reads from            | Writes to                  | Subscription                  |
| ----------------------------- | --------------------- | -------------------------- | ----------------------------- |
| `useAdminMessageSubscription` | Apollo client         | —                          | `adminMessageInserted`        |
| `useConnect`                  | AsyncStorage          | AsyncStorage               | —                             |
| `useConversationDetail`       | Apollo + AsyncStorage | AsyncStorage + local state | `conversationMessageInserted` |
| `useConversationsList`        | Apollo                | local state                | `conversationMessageInserted` |
| `useMessengerIdentity`        | AsyncStorage          | AsyncStorage               | —                             |
| `useReadMarker`               | —                     | Apollo mutation            | —                             |
| `useTypingStatus`             | Apollo client         | local state                | `conversationBotTypingStatus` |

---

### 7.1 `useAdminMessageSubscription`

Subscribes to the customer-wide operator message signal. Use this to refresh unread counts and forward incoming messages to the host app.

```typescript
useAdminMessageSubscription({
  customerId, // string | null — skips when null
  onMessage, // optional: (message: ErxesMessage) => void
  onRefresh, // required: called on every incoming message
});
```

Key behaviors:

- Skips subscription when `customerId` is null
- Uses `client.subscribe()` directly (not `useSubscription`) for fine-grained control
- Always calls `onRefresh()` on every payload regardless of `onMessage`

---

### 7.2 `useConnect`

Runs the `widgetsMessengerConnect` mutation **once per mount**. Persists the returned `customerId` to AsyncStorage when it changes.

```typescript
const { result, integrationId, loading, error } = useConnect({
  brandId, // integrationId from erxes brand
  connection, // { cachedCustomerId, visitorId }
  customer, // { email, phone, firstName, lastName }
  onConnectionUpdate, // called when customerId changes
  enabled, // gate — set false until identity is ready
});
```

Key behaviors:

- `hasRun` ref prevents double-firing in StrictMode
- Does **not** depend on `connection` in the effect — avoids re-firing on every customer update
- Persists `customerId` to AsyncStorage (best-effort, errors swallowed)

---

### 7.3 `useConversationDetail`

Queries and subscribes to a single conversation thread. Drives `ConversationDetail`.

```typescript
const { messages, sending, detail, isInitialLoading, send } =
  useConversationDetail({
    conversationId, // string | null
    integrationId,
    customerId,
    visitorId,
    onRead, // (id: string) => void — called when operator message arrives
  });
```

Key behaviors:

- Filters out `internal: true` messages
- Deduplicates incoming subscription messages by `_id`
- Hydrates `user.details` from `participatedUsers` when subscription payload is missing details
- On send: persists new `conversationId` to AsyncStorage if the backend created a new conversation
- `isInitialLoading` is true only when loading + conversationId exists + no messages yet

**Send flow:**

```
user types → send(text, attachments)
  → widgetsInsertMessage mutation
  → new conversationId? → AsyncStorage.setItem + refetch()
  → insert message into local state (deduplicated)
```

---

### 7.4 `useConversationsList`

Queries the full conversation list and subscribes to new messages on every conversation.

```typescript
const { conversations, refetch, subscribeToMore } = useConversationsList({
  enabled, // false until identity is ready
  integrationId,
  customerId,
  visitorId,
});
```

Key behaviors:

- Skips query when `enabled` is false or `integrationId` is missing
- Subscribes to `conversationMessageInserted` for **every** conversation in the list
- When a subscription message arrives for an unknown conversation → calls `refetch()`
- Deduplicates messages with `dedupeById` before updating cache

**Unread count helper:**

```typescript
import { countUnreadMessages } from "./useConversationsList";

const unread = countUnreadMessages(conversations);
// Counts operator messages where isCustomerRead === false
```

---

### 7.5 `useMessengerIdentity`

Resolves cached customer / visitor identity from AsyncStorage before the messenger mounts.

```typescript
const { ready, connection, cachedConversationId } =
  useMessengerIdentity(startNewConversation);
```

Returns:

- `ready: false` while AsyncStorage is being read — gate all other hooks on this
- `connection.cachedCustomerId` — existing customer id or null
- `connection.visitorId` — generated ObjectId-like string for guests
- `cachedConversationId` — last conversation id or null

When `startNewConversation` is true:

- Removes `conversationId` from AsyncStorage
- Returns `cachedConversationId: ''` (empty string signals "start fresh")

**Standalone hook for host apps:**

```typescript
const [customerId, setCustomerId] = useCachedCustomerId();
// Use to seed identity from a host user model
```

---

### 7.6 `useReadMarker`

Returns a stable callback that marks a conversation as read.

```typescript
const markRead = useReadMarker(onAfterMark);

await markRead(conversationId); // call on open or when operator message arrives
```

Key behaviors:

- No-ops when `id` is null or undefined
- Calls `onAfterMark()` after successful mutation
- Errors are logged and swallowed — never throws

---

### 7.7 `useTypingStatus`

Subscribes to bot typing status per conversation. Subscriptions are **kept alive** across conversation switches.

```typescript
const isTyping = useTypingStatus(conversationId);
// true → show typing indicator
```

Key behaviors:

- Opens one subscription per `conversationId` — never tears down on switch
- Tears down **all** subscriptions on component unmount
- Normalizes payload: accepts `boolean`, `{ typing: boolean }`, or any truthy value
- Errors set typing to `false` for that conversation

---

### 7.8 Hook Composition Order

Mount hooks in this order inside `Widget`:

```
1. useMessengerIdentity()        → ready, connection, cachedConversationId
         ↓ (gate all below on ready === true)
2. useConnect()                  → result, integrationId
         ↓
3. useConversationsList()        → conversations, unread count
4. useAdminMessageSubscription() → refresh list on operator message
         ↓ (when a conversation is selected)
5. useConversationDetail()       → messages, send
6. useReadMarker()               → mark as read on open
7. useTypingStatus()             → bot typing indicator
```

---

### 7.9 Hook Agent Rules

1. Always gate `useConnect`, `useConversationsList`, and `useAdminMessageSubscription` on `identity.ready`.
2. Pass `visitorId` only when `customerId` is null — never send both.
3. `useConversationDetail.send()` is already guarded by `sendingRef` — do not add extra debounce.
4. `useTypingStatus` subscriptions persist across switches intentionally — do not move inside `ConversationDetail`.
5. `useMessengerIdentity` with `startNewConversation: true` clears only `conversationId`, never `cachedCustomerId`.
6. `countUnreadMessages` is a pure function — safe to call on every render.

_Continues with: `services/`, `storage/`, `types/`, `utils/`, `context.ts`, `Widget.tsx`, `ErxesMessenger.tsx`_

---

## 8. Components

`src/messenger/core/components/` contains 9 UI components. All are pure presentational — they receive props and/or read from `MessengerContext`, never call mutations directly.

```
components/
  Attachment.tsx        ← image grid + file cards + fullscreen preview
  Avatar.tsx            ← operator avatar: image or initials fallback
  DateSeparator.tsx     ← hairline rule with centered date label
  Icons.tsx             ← inline SVG icons (no icon library required)
  InputTools.tsx        ← chat composer: text input + attach + send + menu
  Message.tsx           ← single chat row (outgoing / bot / operator)
  PersistentMenu.tsx    ← quick-reply panel above composer
  TypingIndicator.tsx   ← animated bot typing dots
  WelcomeMessage.tsx    ← brand bubble shown at top of new conversation
```

---

### 8.1 `Attachment`

Renders mixed image + file attachments from a message.

```typescript
<Attachment attachments={item.attachments} />
```

Image grid layout rules:

| Count | Layout                                         |
| ----- | ---------------------------------------------- |
| 1     | Full `COL_WIDTH` square                        |
| 2     | Two equal halves                               |
| 3     | Three equal thirds                             |
| 4     | Four equal quarters                            |
| 5+    | First 4 visible, overlay shows `+N` on the 4th |

File cards open via `Linking.openURL`. Images open in a fullscreen `Modal` with pinch-to-zoom `ScrollView`.

Key utilities used:

- `getAttachmentUrl(url, subDomain)` — resolves CDN URL
- `isImageAttachment(att)` — checks `type` then file extension
- `formatSize(bytes)` — formats B / KB / MB

---

### 8.2 `Avatar`

Shows operator avatar image or initials fallback on a brand-colored circle.

```typescript
<Avatar user={item.user} bgColor={bgColor} size={32} name={fallbackName} />
```

- Reads `subDomain` from `MessengerContext`
- Falls back to `FirstLast` initials when no avatar URL exists
- Uses `cache: 'force-cache'` on the image source

---

### 8.3 `DateSeparator`

Centered date label with hairline rules on each side. Adapts to light/dark `backgroundColor` from context.

```typescript
<DateSeparator label="Today" />
```

---

### 8.4 `Icons`

Six inline icons drawn with plain `View`s and `react-native-svg`. No icon library dependency.

| Export           | Used by                                         |
| ---------------- | ----------------------------------------------- |
| `BrainIcon`      | Bot avatar, `TypingIndicator`, `WelcomeMessage` |
| `BackIcon`       | Attachment fullscreen close                     |
| `SendIcon`       | `InputTools` send button                        |
| `CloseIcon`      | Attachment strip remove tile                    |
| `AttachmentIcon` | `InputTools` attach button                      |
| `MenuIcon`       | `InputTools` persistent menu toggle             |

All icons accept `color` and `size` props.

Required dependency:

```bash
npx expo install react-native-svg
```

---

### 8.5 `InputTools`

Chat composer bar: `[attach] [text input] [send] [menu]` inside a rounded pill. Attachment strip renders above the pill when files are queued.

```typescript
<InputTools
  onSend={(text, attachments) => send(text, attachments)}
  bgColor={bgColor}
  textColor={textColor}
  backgroundColor={backgroundColor}
  subDomain={subDomain}
  sending={sending}
  persistentMenus={detail?.persistentMenus}
  placeholder="Reply..."
/>
```

Key behaviors:

- `isImagePickerAvailable()` — hides attach button when no picker is installed
- `isDarkColor(backgroundColor)` — switches composer pill to dark variant
- Upload runs serially per file; errors show a 3.5 s toast then clear
- `canSend` requires non-empty text or at least one attachment and no active upload
- `handleSend` clears input and attachments after firing `onSend`
- Multiline `TextInput` grows up to `maxHeight: 120`
- iOS bottom padding uses `spacing.xl`; Android uses `spacing.sm`

---

### 8.6 `Message`

Single chat row. Distinguishes three sender types:

| Condition                 | Variant             | Alignment               |
| ------------------------- | ------------------- | ----------------------- |
| `item.customerId` present | Outgoing (customer) | Right                   |
| `item.fromBot === true`   | Bot                 | Left + BrainIcon avatar |
| Otherwise                 | Operator            | Left + Avatar           |

```typescript
<Message
  item={message}
  bgColor={bgColor}
  textColor={textColor}
  backgroundColor={backgroundColor}
  isFirstInGroup={true}
  isLastInGroup={true}
/>
```

Grouping props:

- `isFirstInGroup` — shows sender name and top margin
- `isLastInGroup` — shows avatar and timestamp

HTML rendering: bot messages and operator HTML use `react-native-render-html` via the internal `RenderHTML` memo component. Links open with `Linking.openURL`.

Dark mode: `isDarkColor(backgroundColor)` flips bubble and text colors to dark variants.

---

### 8.7 `PersistentMenu`

Quick-reply panel shown above `InputTools` when the menu toggle is pressed.

```typescript
<PersistentMenu
  items={detail?.persistentMenus}
  onSendText={(text) => send(text, [])}
/>
```

Item behavior:

- `type: 'link'` → `Linking.openURL(item.link)`
- `type: 'button'` (or any other) → `onSendText(item.text)`

`persistentMenus` comes from `widgetsConversationDetail.persistentMenus`.

---

### 8.8 `TypingIndicator`

Animated three-dot indicator shown while the bot is typing. Reads `backgroundColor` and `bgColor` from `MessengerContext`.

```typescript
{isTyping && <TypingIndicator />}
```

Animation: each dot runs an independent `Animated.loop` with staggered delay (0 ms, 150 ms, 300 ms), translating up 4 px and fading in.

---

### 8.9 `WelcomeMessage`

Brand bubble shown at the top of every new conversation.

```typescript
<WelcomeMessage content={connectResult?.messengerData?.welcomeMessage} />
```

Avatar priority:

1. `logoUrl` from context (resolved from `uiOptions`)
2. `logoSource` from context (host-provided `ImageSourcePropType`)
3. `BrainIcon` fallback on brand-colored circle

Renders nothing when `content` is empty or undefined.

---

### 8.10 Component Agent Rules

1. Never call mutations inside components — delegate to hook callbacks (`onSend`, `onRead`).
2. Always read `subDomain` from `MessengerContext` for `getAttachmentUrl` calls.
3. `isDarkColor` is duplicated across components intentionally — each component is self-contained.
4. `RenderHTML` is memoized — do not unwrap the memo.
5. `InputTools` upload is best-effort — errors are displayed and swallowed, never thrown.
6. `Message` grouping props must be computed by the parent list, not inside `Message`.
7. `WelcomeMessage` must always be the first item in the conversation scroll view.
8. `TypingIndicator` must be placed after the last message and before `InputTools`.

_Continues with: `services/`, `storage/`, `types/`, `utils/`, `context.ts`, `Widget.tsx`, `ErxesMessenger.tsx`_

---

## 9. Services

`src/messenger/core/services/upload.ts` — file upload pipeline for the chat composer.

### 9.1 Overview

```
pickImages()
  → expo-image-picker  (if installed)
  → react-native-image-picker  (fallback)
  → returns PickedFile[]
        ↓
isAllowedImageFile()  — filter to PNG/JPG only
        ↓
uploadFile()
  → POST {gateway}/upload-file?kind=main&maxHeight=0&maxWidth=0
  → credentials: 'include'
  → returns UploadedAttachment { url (file key), name, type, size }
        ↓
getAttachmentUrl(key, subDomain)
  → GET {gateway}/read-file?key=...
```

### 9.2 Image Picker Strategy

Both pickers are resolved lazily via `require()` inside try/catch — Metro treats them as optional dependencies. The attach button in `InputTools` hides automatically when neither is installed.

| Picker                      | Detection                              |
| --------------------------- | -------------------------------------- |
| `expo-image-picker`         | `expo.launchImageLibraryAsync` present |
| `react-native-image-picker` | `rn.launchImageLibrary` present        |

```typescript
// Check availability before rendering attach button
import { isImagePickerAvailable } from "../services/upload";

const canAttach = isImagePickerAvailable(); // false when neither picker is installed
```

### 9.3 Allowed File Types

Upload validation (images only):

```typescript
// Allowed MIME types
["image/jpeg", "image/png"][
  // Allowed extensions (fallback when MIME type is missing)
  ("jpg", "jpeg", "png")
];

// Error shown to user when validation fails
unsupportedImageUploadMessage = "Only PNG and JPG images can be uploaded.";
```

`EXTENSION_MIME_MAP` covers 25+ file types for file card display even though upload is limited to images.

### 9.4 `uploadFile` Options

```typescript
uploadFile(file, subDomain, {
  url?: string;           // override upload endpoint
  kind?: string;          // default: 'main'
  userId?: string;        // adds userId header when provided
  responseType?: 'text' | 'json';  // default: 'text'
  maxHeight?: number;     // default: 0 (no resize)
  maxWidth?: number;      // default: 0 (no resize)
  extraFormData?: Array<{ key: string; value: string }>;
});
```

### 9.5 Service Agent Rules

1. Always filter with `isAllowedImageFile` before calling `uploadFile` — the upload endpoint enforces the same check server-side.
2. Upload runs **serially** per file — do not parallelize with `Promise.all`.
3. `uploadFile` throws on non-OK response or empty key — always wrap in try/catch.
4. The returned `url` field is a **file key**, not a full URL — pass it through `getAttachmentUrl(key, subDomain)` before rendering.
5. `credentials: 'include'` is required on the upload fetch — same as the GraphQL HTTP link.

---

## 10. Storage

`src/messenger/core/storage/keys.ts`

Two keys persisted via `AsyncStorage`:

| Key                | Value                           | Purpose                      |
| ------------------ | ------------------------------- | ---------------------------- |
| `cachedCustomerId` | JSON-stringified string or null | Reconnect returning customer |
| `conversationId`   | Plain string                    | Resume last conversation     |

```typescript
import { MESSENGER_STORAGE_KEYS } from "../storage/keys";

MESSENGER_STORAGE_KEYS.cachedCustomerId; // 'cachedCustomerId'
MESSENGER_STORAGE_KEYS.conversationId; // 'conversationId'
```

### 10.1 Clearing Storage on Logout

Call `clearMessengerStorage` on user logout or account switch to prevent the next user from inheriting the previous session:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearMessengerStorage } from "../storage/keys";

await clearMessengerStorage(AsyncStorage);
```

`clearMessengerStorage` accepts any `MessengerStore`-compatible object:

```typescript
type MessengerStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};
```

### 10.2 Storage Agent Rules

1. Always JSON-stringify `cachedCustomerId` on write — always `JSON.parse` on read.
2. `conversationId` is stored as a plain string — no JSON wrapping.
3. All storage reads are best-effort — catch errors and return null.
4. Call `clearMessengerStorage` on logout — never clear only one key.

---

## 11. Types

Two type files — host code depends only on `public.ts`.

```
types/
  internal.ts   ← widget wiring, query shapes, upload types (do not import in host code)
  public.ts     ← all types the host app needs
```

### 11.1 Public Types (`types/public.ts`)

| Type                      | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `ErxesMessengerConfig`    | `apiUrl` + `brandId` — minimum required to connect                           |
| `ErxesMessengerProps`     | Full props for `<ErxesMessenger>`                                            |
| `ErxesMessengerHandle`    | Imperative ref: `openConversation`, `startNewConversation`                   |
| `ErxesCustomerIdentity`   | Optional customer fields passed on connect                                   |
| `ErxesMessengerTheme`     | Color overrides: `primaryColor`, `primaryForegroundColor`, `backgroundColor` |
| `ErxesMessengerCallbacks` | Host callbacks: `onUnreadCountChange`, `onNewMessage`, etc.                  |
| `ErxesMessage`            | Single message shape from GraphQL                                            |
| `ErxesConversation`       | Conversation with messages array                                             |
| `ErxesAttachment`         | File attachment: `url`, `name`, `size`, `type`                               |
| `ErxesUser`               | Operator/bot user with `details`                                             |
| `ErxesConnectResult`      | Response from `widgetsMessengerConnect` mutation                             |
| `ErxesPersistentMenuItem` | `{ type, text, link }` menu item                                             |

### 11.2 Key Internal Types (`types/internal.ts`)

| Type                            | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `MessengerContextValue`         | Full React context shape shared across all components    |
| `WidgetProps`                   | All props passed into `<Widget>` from `<ErxesMessenger>` |
| `CustomerConnection`            | `{ cachedCustomerId, visitorId }` pair                   |
| `ChatRow`                       | Discriminated union: `welcome` / `date` / `message`      |
| `PickedFile`                    | Normalized file from image picker                        |
| `UploadedAttachment`            | Result of `uploadFile`                                   |
| `ConnectMutationResult`         | Apollo result shape for connect mutation                 |
| `ConversationDetailQueryResult` | Apollo result shape for detail query                     |
| `InsertMessageResult`           | Apollo result shape for insert message mutation          |

### 11.3 `apiUrl` Normalization

`normalizeApiUrl` accepts three formats:

```typescript
normalizeApiUrl("example.erxes.io");
// → { subDomain: 'example.erxes.io',
//     httpUrl: 'https://example.erxes.io/gateway/graphql',
//     wsUrl: 'wss://example.erxes.io/gateway/graphql' }

normalizeApiUrl("https://example.erxes.io/gateway");
// → same result

normalizeApiUrl("https://example.erxes.io/gateway/graphql");
// → same result
```

### 11.4 Type Agent Rules

1. Host code imports from `types/public.ts` only — never from `types/internal.ts`.
2. Use `_id` everywhere — never `id`.
3. `ErxesMessengerHandle` ref methods are the only imperative API — never access internal state directly.

---

## 12. Utils

```
utils/
  bot.ts         ← bot message detection and HTML extraction
  endpoints.ts   ← URL normalization and file URL helpers
  messages.ts    ← chat row building, date grouping, message grouping
  objectId.ts    ← guest visitorId generator
  stripHtml.ts   ← HTML tag and entity stripper
```

### 12.1 `bot.ts`

```typescript
isBotMessage(message); // true when message.fromBot === true
isOperatorMessage(message); // true when not customer and not bot
getBotMessageHtml(message); // extracts HTML from botData or falls back to content
```

`botData` normalization handles three backend shapes:

- `Array` of `{ text?, content? }` objects
- JSON string (parsed then treated as array)
- Single object

### 12.2 `endpoints.ts`

```typescript
normalizeApiUrl(input)
// Resolves bare host / partial / full URL → { subDomain, httpUrl, wsUrl }

getAttachmentUrl(value, subDomain)
// Absolute URL → returned as-is
// File key     → 'https://{subDomain}/gateway/read-file?key={encoded}'
// null/undefined → undefined

getFileUploadUrl(subDomain, kind?, maxHeight?, maxWidth?)
// → 'https://{subDomain}/gateway/upload-file?kind=main&maxHeight=0&maxWidth=0'

getFileDownloadUrl(subDomain, key)
// → 'https://{subDomain}/gateway/read-file?key={encoded}'
```

### 12.3 `messages.ts`

```typescript
buildChatRows(chronologicalMessages, welcomeContent?)
// Returns ChatRow[] with date separators and grouping flags
// Filters internal messages
// Prepends welcome bubble when welcomeContent is provided

formatMessageDate(dateKey)  // 'Today' | 'Yesterday' | 'MMM D, YYYY'
getDateKey(date)            // 'YYYY-MM-DD'
```

**Grouping logic** — two messages are in the same group when:

- Same date key
- Within 5-minute window (`MESSAGE_GROUP_TIME_WINDOW`)
- Same sender type (both bot, both same operator `_id`, or both same customer)

### 12.4 `objectId.ts`

```typescript
createObjectIdLikeString();
// 24-char lowercase hex: 4-byte timestamp + 8 random bytes
// Used only for guest visitorId
// Requires react-native-get-random-values polyfill at app entry
```

### 12.5 `stripHtml.ts`

```typescript
stripHtml(html, { withoutCut?: boolean, maxLength?: number })
// Strips tags and numeric entities
// Default max: 70 chars (for list previews)
// withoutCut: true → no truncation (used in Message to check hasContent)
```

### 12.6 Utils Agent Rules

1. Always call `normalizeApiUrl` once at client creation — never in render loops.
2. `getAttachmentUrl` returns `undefined` for empty values — guard before passing to `Image.source`.
3. `buildChatRows` expects messages **oldest-first** — reverse if coming from an inverted FlatList.
4. `createObjectIdLikeString` requires `react-native-get-random-values` imported at app entry.
5. `getBotMessageHtml` never throws — always returns a string (may be empty).

_Continues with: `context.ts`, `Widget.tsx`, `ErxesMessenger.tsx`_

---

## 13. Context

`src/messenger/core/context.ts` — internal React context shared by `Widget`, `ConversationDetail`, and all child components.

```typescript
import { createContext } from "react";
import type { MessengerContextValue } from "./types/internal";

const MessengerContext = createContext<MessengerContextValue | null>(null);
export default MessengerContext;
```

Populated by `Widget` and never imported by host code. Components read it via `useContext(MessengerContext)`.

### Context Value Shape

| Field                  | Type                  | Source                                                                       |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `customerId`           | `string \| null`      | `connection.cachedCustomerId`                                                |
| `visitorId`            | `string \| null`      | `connection.visitorId`                                                       |
| `bgColor`              | `string`              | Resolved from host override → `uiOptions.primary.DEFAULT` → theme default    |
| `textColor`            | `string`              | Resolved from host override → `uiOptions.primary.foreground` → theme default |
| `backgroundColor`      | `string`              | Resolved from host override → `uiOptions.backgroundColor` → theme default    |
| `logoUrl`              | `string \| undefined` | `getAttachmentUrl(uiOptions.logo, subDomain)`                                |
| `logoSource`           | `ImageSourcePropType` | Host-provided fallback                                                       |
| `integrationId`        | `string`              | From `useConnect` result                                                     |
| `conversationId`       | `string \| null`      | Widget state                                                                 |
| `setConversationId`    | `fn`                  | Widget state setter                                                          |
| `totalUnreadCount`     | `number`              | `countUnreadMessages(conversations)`                                         |
| `markConversationRead` | `fn`                  | `useReadMarker` callback                                                     |
| `subDomain`            | `string`              | From `normalizeApiUrl`                                                       |

---

## 14. Theme

`src/messenger/core/messengerTheme.ts` — shared visual tokens. Brand color is overridden at runtime from `uiOptions`; values here are fallbacks only.

### Color Tokens

| Token               | Default   | Purpose                                 |
| ------------------- | --------- | --------------------------------------- |
| `primary`           | `#5629b6` | Brand color — overridden by `uiOptions` |
| `primaryForeground` | `#FFFFFF` | Text on primary color                   |
| `background`        | `#F4F5F7` | Chat screen background                  |
| `surface`           | `#FFFFFF` | Cards, file tiles                       |
| `incomingBubble`    | `#FFFFFF` | Operator/bot message bubble             |
| `outgoingBubble`    | `#5629b6` | Customer message bubble                 |
| `incomingText`      | `#27272A` | Operator/bot message text               |
| `outgoingText`      | `#FFFFFF` | Customer message text                   |
| `inputBackground`   | `#FFFFFF` | Composer pill background                |
| `danger`            | `#EF4444` | Error toast, delete actions             |
| `online`            | `#31C859` | Online status indicator                 |

### Spacing Scale

```
xs: 4   sm: 8   md: 12   lg: 16   xl: 20   xxl: 24
```

### Border Radius

```
sm: 8   md: 12   lg: 16   xl: 20
bubble: 18   tail: 6   pill: 999
```

### Shadow Presets

| Preset            | Used by                           |
| ----------------- | --------------------------------- |
| `shadow.card`     | File cards, persistent menu panel |
| `shadow.bubble`   | Message bubbles                   |
| `shadow.floating` | Floating launcher button          |

---

## 15. Widget

`src/messenger/core/Widget.tsx` — the internal component that wires all hooks together and provides the `MessengerContext`.

### Responsibility

```
ErxesMessenger
  └── ApolloContainer   (messenger Apollo client)
        └── Widget      (hooks + context + routing)
              └── MessengerContext.Provider
                    └── ConversationDetail
```

### Hook Wiring Inside Widget

```
useConnect()                    → result, integrationId
useConversationsList()          → conversations
useReadMarker()                 → markConversationRead
useAdminMessageSubscription()   → refresh on operator message
useMutation(widgetsSaveBrowserInfo)  → optional analytics ping
```

### Theme Resolution Order

```
1. Host prop (primaryColor / primaryForegroundColor / backgroundColor)
2. Backend uiOptions (uiOptions.primary.DEFAULT / .foreground / .backgroundColor)
3. messengerTheme defaults
```

### Imperative Handle (`ref`)

```typescript
const messengerRef = useRef<ErxesMessengerHandle>(null);

// Open a specific conversation
messengerRef.current?.openConversation(conversationId);

// Start a fresh conversation
messengerRef.current?.startNewConversation();
```

Both methods persist the change to `AsyncStorage` before updating state.

### Floating Launcher Mode

When `show === true` (launcher is visible), `Widget` renders only the floating button:

- Shows `logoUrl` → `logoSource` → `BrainIcon` fallback
- Unread badge appears when `totalUnreadCount > 0` (capped at `99+`)
- Tapping calls `setShow(false)` to open the chat

### Rendering Logic

```
show === true   → floating launcher button only
show === false  → MessengerContext.Provider + ConversationDetail
                  (when conversationId !== null OR startNewConversation)
```

Returns `null` when `integrationId` is not yet resolved.

---

## 16. ErxesMessenger

`src/messenger/core/ErxesMessenger.tsx` — public entry point. The only component host code imports.

### Usage

```typescript
import ErxesMessenger from './messenger/ErxesMessenger';
import type { ErxesMessengerHandle } from './messenger/types/public';

const ref = useRef<ErxesMessengerHandle>(null);

<ErxesMessenger
  ref={ref}
  config={{
    apiUrl: 'example.erxes.io',
    brandId: 'YOUR_BRAND_ID',
  }}
  customer={{
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
  }}
  theme={{
    primaryColor: '#5629b6',
    primaryForegroundColor: '#FFFFFF',
    backgroundColor: '#F4F5F7',
  }}
  callbacks={{
    onUnreadCountChange: (count) => setUnreadBadge(count),
    onNewMessage: (message) => showPushNotification(message),
  }}
/>
```

### Mount Sequence

```
1. import 'react-native-get-random-values'   (polyfill — top of file)
2. useMessengerIdentity()                    (read AsyncStorage)
3. ready === true?
   → normalizeApiUrl(config.apiUrl)          (derive subDomain)
   → <ApolloContainer apiUrl={config.apiUrl}>
       → <Widget ... />
```

Returns `null` until `ready === true` and identity has at least one of `cachedCustomerId` or `visitorId`.

### Props Reference

| Prop                          | Required | Default | Description                               |
| ----------------------------- | -------- | ------- | ----------------------------------------- |
| `config.apiUrl`               | ✅       | —       | Erxes gateway URL (bare host or full URL) |
| `config.brandId`              | ✅       | —       | Messenger integration id                  |
| `customer`                    | —        | `{}`    | Customer identity fields                  |
| `theme`                       | —        | —       | Color overrides                           |
| `callbacks`                   | —        | —       | Host event callbacks                      |
| `conversationId`              | —        | —       | Open a specific conversation on mount     |
| `startNewConversation`        | —        | `false` | Force a fresh conversation                |
| `showWidget`                  | —        | `false` | Render as floating launcher               |
| `hideConversationHeader`      | —        | `false` | Hide built-in chat header                 |
| `disableKeyboardAvoidingView` | —        | `false` | Disable built-in KAV                      |
| `onBack`                      | —        | —       | Called on back button tap                 |
| `logoSource`                  | —        | —       | Brand logo fallback                       |
| `avatarSource`                | —        | —       | Operator avatar fallback                  |

### `apiUrl` Accepted Formats

```
'example.erxes.io'
'https://example.erxes.io/gateway'
'https://example.erxes.io/gateway/graphql'
```

All three resolve to the same `subDomain`, `httpUrl`, and `wsUrl`.

---

## 17. Full File Structure

```
src/
  messenger/
    core/
      apollo/
        ApolloContainer.tsx       ← ApolloProvider wrapper (per-messenger client)
        createApolloClient.ts     ← HTTP + WebSocket split link, cookie session
      components/
        Attachment.tsx            ← image grid + file cards + fullscreen preview
        Avatar.tsx                ← operator avatar or initials fallback
        DateSeparator.tsx         ← hairline rule with date label
        Icons.tsx                 ← BrainIcon, BackIcon, SendIcon, CloseIcon, AttachmentIcon, MenuIcon
        InputTools.tsx            ← chat composer: attach + input + send + menu
        Message.tsx               ← single chat row (outgoing / bot / operator)
        PersistentMenu.tsx        ← quick-reply panel
        TypingIndicator.tsx       ← animated bot typing dots
        WelcomeMessage.tsx        ← brand bubble at top of conversation
      graphql/
        mutations.ts              ← connect, insertMessage, readMessages, saveBrowserInfo
        queries.ts                ← widgetsConversations, widgetsConversationDetail
        subscriptions.ts          ← messageInserted, botTypingStatus, adminMessageInserted
      hooks/
        useAdminMessageSubscription.ts
        useConnect.ts
        useConversationDetail.ts
        useConversationsList.ts
        useMessengerIdentity.ts
        useReadMarker.ts
        useTypingStatus.ts
      services/
        upload.ts                 ← image picker + file upload pipeline
      storage/
        keys.ts                   ← MESSENGER_STORAGE_KEYS, clearMessengerStorage
      types/
        internal.ts               ← MessengerContextValue, WidgetProps, ChatRow, upload types
        public.ts                 ← ErxesMessengerProps, ErxesMessage, ErxesConversation, etc.
      utils/
        bot.ts                    ← isBotMessage, isOperatorMessage, getBotMessageHtml
        endpoints.ts              ← normalizeApiUrl, getAttachmentUrl, getFileUploadUrl
        messages.ts                ← buildChatRows, formatMessageDate, sameGroup
        objectId.ts                ← createObjectIdLikeString (guest visitorId)
        stripHtml.ts                ← stripHtml
      constants.ts                ← FALLBACK_SOCKET_URL, WS_RETRY_DELAY_MS
      context.ts                  ← MessengerContext (createContext)
      ConversationDetail.tsx      ← full conversation screen
      ErxesMessenger.tsx          ← public entry point
      messengerTheme.ts           ← color tokens, spacing, radius, shadows
      Widget.tsx                  ← hook wiring + context provider + routing
      index.ts                    ← public exports
  messengerConfig.ts              ← host-level config (apiUrl, brandId)
```

---

## 18. Required Dependencies

```bash
npx expo install @apollo/client graphql graphql-ws
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-svg
npx expo install react-native-get-random-values
npx expo install react-native-render-html

# Optional — attach button hides automatically when neither is installed
npx expo install expo-image-picker
# or
npm install react-native-image-picker
```

---

## 19. Verification Checklist

### Connection

- [ ] `config.apiUrl` resolves to correct `httpUrl` and `wsUrl` via `normalizeApiUrl`
- [ ] `config.brandId` matches an integration in erxes Admin → Integrations
- [ ] `widgetsMessengerConnect` mutation succeeds and returns `customerId`
- [ ] WebSocket connection established (check `[messenger] network error` logs)

### Identity

- [ ] Returning user: `cachedCustomerId` read from AsyncStorage on mount
- [ ] Guest user: `visitorId` generated via `createObjectIdLikeString`
- [ ] Logout: `clearMessengerStorage(AsyncStorage)` clears both keys

### Chat

- [ ] `widgetsConversations` query returns conversation list
- [ ] `widgetsConversationDetail` query returns messages
- [ ] `conversationMessageInserted` subscription fires on new message
- [ ] `widgetsInsertMessage` mutation sends message successfully
- [ ] `widgetsReadConversationMessages` marks conversation as read

### UI

- [ ] `WelcomeMessage` renders at top of new conversation
- [ ] `TypingIndicator` appears when bot is typing
- [ ] `InputTools` attach button visible when image picker is installed
- [ ] Image attachments open in fullscreen modal
- [ ] File attachments open via `Linking.openURL`
- [ ] Unread badge shows correct count on launcher

### Environment

- [ ] `react-native-get-random-values` imported at app entry (before any UUID generation)
- [ ] `.env` has `EXPO_PUBLIC_ERXES_API_URL` and `EXPO_PUBLIC_ERXES_BRAND_CODE`
- [ ] `npx expo export` completes with zero errors

---

## 20. Agent Rules

1. **Scan before acting** — read `src/messenger/` tree before generating any file.
2. **Never import `types/internal.ts` in host code** — use `types/public.ts` only.
3. **Messenger Apollo client is always separate** from the CMS client — never merge them.
4. **`credentials: 'include'`** on both the HTTP link and the upload fetch — never remove.
5. **`react-native-get-random-values`** must be the first import in `ErxesMessenger.tsx`.
6. **Gate all hooks on `identity.ready`** — never call `useConnect` or `useConversationsList` before identity resolves.
7. **Pass `visitorId` only when `customerId` is null** — never send both.
8. **`useTypingStatus` subscriptions persist across conversation switches** — do not move inside `ConversationDetail`.
9. **`buildChatRows` expects oldest-first messages** — reverse before passing from an inverted FlatList.
10. **Call `clearMessengerStorage` on logout** — never clear only one key.
11. **`getAttachmentUrl` returns `undefined` for empty values** — always guard before rendering.
12. **Theme resolution order**: host prop → `uiOptions` → `messengerTheme` defaults.
13. **`startNewConversation` is consumed once per mount** — use a changing nonce prop to start another fresh chat.
14. **Verify last** — confirm mutation success, subscription firing, and `npx expo export` before reporting done.
