# Step 4.7 — Connect erxes — Feedback → Client Portal Ticket (Mobile / Expo)

**Skip this step if `has_feedback_tickets` is false.**

Run this step only after the Expo frontend project exists in `output/<slug>/`
(i.e., after Step 4), the same way Step 4.5 (Messenger) and Step 4.6 (Push
Notifications) are gated. It reuses the erxes app/client-portal credentials
already written to `.env.local` — it does not repeat CMS setup from
`connect-erxes.md`.

It adds a **Feedback → Ticket** flow: an authenticated user submits feedback
from the app, and the app creates a ticket in erxes Client Portal (`cp*`
Tickets API) instead of, or in addition to, sending a plain notification.

## When to use this file

Trigger it whenever the user says any of:

- "feedback явуулбал ticket үүсгэ"
- "submit feedback as a support ticket"
- "in-app feedback to erxes ticket"
- "connect feedback screen to erxes tickets"

> **This file must be registered in `AGENTS.md` as Step 4.7**, the same way
> Messenger (4.5) and Push Notifications (4.6) are — see the integration
> patch at the bottom of this file. Do not treat this as a standalone file
> the agent discovers on its own; without the `AGENTS.md` wiring it will
> never be read at the right point in the pipeline.

---

## 0. Agent Mission

When triggered, run the full pipeline without waiting for step-by-step
instructions:

1. Confirm `channelId` / `pipelineId` / `statusId` (and optional
   `stageId`) are available in config — collect from the user if missing
   (see §1 for where to find them in erxes Admin).
2. Confirm the feedback flow is gated behind an authenticated `CPUser`
   session (per this project's requirement — no anonymous ticket creation).
3. Generate the feedback screen, mutation, and submit handler in the Expo
   project using the verified `cpCreateTicket` mutation from §1.
4. Verify end to end (§6).

---

## 1. Verified Schema — `cpCreateTicket`

Confirmed via introspection against the live erxes instance. Do not
substitute a different mutation name — this is the real, callable mutation
under the `EXPO_PUBLIC_ERXES_APP_TOKEN` client-portal token.

```graphql
mutation CpCreateTicket(
  $name: String!
  $channelId: String!
  $pipelineId: String!
  $statusId: String!
  $description: String
  $stageId: String
  $priority: Int
  $labelIds: [String]
  $tagIds: [String]
  $startDate: Date
  $targetDate: Date
  $assigneeId: String
  $state: String
  $propertiesData: JSON
  $attachments: [AttachmentInput]
  $companyIds: [String]
  $customerFieldData: JSON
) {
  cpCreateTicket(
    name: $name
    channelId: $channelId
    pipelineId: $pipelineId
    statusId: $statusId
    description: $description
    stageId: $stageId
    priority: $priority
    labelIds: $labelIds
    tagIds: $tagIds
    startDate: $startDate
    targetDate: $targetDate
    assigneeId: $assigneeId
    state: $state
    propertiesData: $propertiesData
    attachments: $attachments
    companyIds: $companyIds
    customerFieldData: $customerFieldData
  ) {
    _id
    name
    description
    pipelineId
    statusId
    priority
    createdAt
    number
  }
}
```

Notes:

- **No `customerId`/`cpUserId` argument** — the backend resolves the
  authenticated `CPUser` from the `erxes-app-token` session automatically,
  confirming §2's auth-gating is sufficient with no extra user-reference
  field to pass.
- **Required (non-nullable):** `name`, `channelId`, `pipelineId`,
  `statusId`. All four must resolve to real IDs before calling this
  mutation, or the request fails at the GraphQL layer.
- `stageId` is **optional** (not required, contrary to the earlier
  placeholder assumption).
- Only select the response fields the app actually renders. The full
  type also exposes nested fields (`status { }`, `assignee { }`,
  `attachments { }`) that need their own sub-selections if ever used —
  leave them out unless the confirmation UI needs them.

### Getting `channelId`, `pipelineId`, `statusId`, `stageId`

Fixed per project, collected once during setup — not end-user input:

| Value        | Where to find it                                                            |
| ------------ | --------------------------------------------------------------------------- |
| `channelId`  | erxes Admin → Tickets → Settings → Channels                                 |
| `pipelineId` | erxes Admin → Tickets → (channel) → Pipelines                               |
| `statusId`   | erxes Admin → Tickets → (pipeline) → Statuses (pick the intake/default one) |
| `stageId`    | erxes Admin → Tickets → (pipeline) → Stages (optional)                      |

---

## 2. Prerequisite: Authenticated CPUser Only

Feedback tickets are created **only for logged-in users**. This mirrors the
auth-gating already used for FCM registration in `notification.md`
(`usePushNotifications` keyed on the auth `token`), so reuse the same
session/auth provider instead of building a second one.

- If no session token is present, the Feedback screen shows a
  "нэвтэрч орсны дараа feedback илгээх боломжтой" state (or routes to
  login) — the mutation must never fire without an authenticated `CPUser`.
- Do not add an anonymous/guest submission path unless explicitly requested
  later — this is a deliberate scope limit, not an oversight.

---

## 3. Environment

Add to `.env.local` (alongside the existing erxes vars from
`connect-erxes.md` §2.1):

```env
# Client-side (Expo app)
EXPO_PUBLIC_ERXES_TICKETS_CHANNEL_ID=<channelId from erxes admin>
EXPO_PUBLIC_ERXES_TICKETS_PIPELINE_ID=<pipelineId from erxes admin>
EXPO_PUBLIC_ERXES_TICKETS_STATUS_ID=<statusId from erxes admin>
EXPO_PUBLIC_ERXES_TICKETS_STAGE_ID=<stageId from erxes admin — optional>
```

Reuse `EXPO_PUBLIC_ERXES_API_URL` and `EXPO_PUBLIC_ERXES_APP_TOKEN` already
set up for the CMS connection — do not duplicate them.

---

## 4. GraphQL Mutation

Create `lib/graphql/mutations/tickets.ts`:

```typescript
import { gql } from "@apollo/client";

export const CP_CREATE_TICKET = gql`
  mutation CpCreateTicket(
    $name: String!
    $channelId: String!
    $pipelineId: String!
    $statusId: String!
    $description: String
    $stageId: String
  ) {
    cpCreateTicket(
      name: $name
      channelId: $channelId
      pipelineId: $pipelineId
      statusId: $statusId
      description: $description
      stageId: $stageId
    ) {
      _id
      name
      description
      createdAt
      number
    }
  }
`;
```

Only the arguments this flow actually uses are included above
(`name`, `channelId`, `pipelineId`, `statusId`, `description`, `stageId`).
The full mutation supports additional optional arguments (`priority`,
`labelIds`, `tagIds`, `assigneeId`, etc. — see §1) that can be added later
if the feedback form grows more fields.

---

## 5. Submit Handler (client-side)

`src/lib/feedbackTicket.ts` — follow the same best-effort, non-blocking,
no-sensitive-logging pattern as `registerFcmToken` in `notification.md`:

```ts
import { apolloClient } from "@/lib/apollo-client";
import { CP_CREATE_TICKET } from "@/lib/graphql/mutations/tickets";

export async function submitFeedbackAsTicket(
  title: string,
  description: string,
): Promise<{ success: boolean }> {
  try {
    await apolloClient.mutate({
      mutation: CP_CREATE_TICKET,
      variables: {
        name: title,
        description,
        channelId: process.env.EXPO_PUBLIC_ERXES_TICKETS_CHANNEL_ID,
        pipelineId: process.env.EXPO_PUBLIC_ERXES_TICKETS_PIPELINE_ID,
        statusId: process.env.EXPO_PUBLIC_ERXES_TICKETS_STATUS_ID,
        stageId: process.env.EXPO_PUBLIC_ERXES_TICKETS_STAGE_ID,
      },
    });
    return { success: true };
  } catch (e) {
    console.warn("[feedback] failed to create ticket:", e);
    return { success: false };
  }
}
```

`submitFeedbackAsTicket` must only be called from a screen/route that is
already gated on an authenticated session (see §2) — do not re-check auth
inside this function; keep auth-gating at the screen/navigation level, same
separation of concerns used elsewhere in this project.

### Feedback Screen

`app/feedback.tsx`

```tsx
import { useState } from "react";
import { View, TextInput, Button, Text, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/useAuth"; // reuse existing session hook
import { submitFeedbackAsTicket } from "@/lib/feedbackTicket";

export default function FeedbackScreen() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );

  if (!token) {
    return <Text>Feedback илгээхийн тулд эхлээд нэвтэрнэ үү.</Text>;
  }

  const onSubmit = async () => {
    setStatus("loading");
    const result = await submitFeedbackAsTicket(title, description);
    setStatus(result.success ? "sent" : "error");
  };

  return (
    <View>
      <TextInput placeholder="Гарчиг" value={title} onChangeText={setTitle} />
      <TextInput
        placeholder="Тайлбар"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button
        title="Илгээх"
        onPress={onSubmit}
        disabled={status === "loading"}
      />
      {status === "loading" && <ActivityIndicator />}
      {status === "sent" && <Text>Илгээгдлээ. Баярлалаа!</Text>}
      {status === "error" && (
        <Text>Илгээхэд алдаа гарлаа. Дахин оролдоно уу.</Text>
      )}
    </View>
  );
}
```

---

## 6. Verification

1. Confirm `EXPO_PUBLIC_ERXES_TICKETS_CHANNEL_ID`, `_PIPELINE_ID`,
   `_STATUS_ID` are set to real IDs from erxes Admin (see §1 table) — a
   missing or wrong ID fails the mutation's non-nullable arguments.
2. Submit feedback while logged out → confirm the screen blocks submission
   and no mutation fires (check network log).
3. Submit feedback while logged in → confirm a ticket appears in erxes
   Admin → Tickets → (configured channel/pipeline), with the correct
   `name`/`description`, and that it is attributed to the submitting
   `CPUser` (not anonymous), confirming the session-based resolution
   noted in §1.
4. Confirm no auth token or user PII is printed in client-side logs
   (`console.warn` logs the error object only, matching the pattern in
   `notification.md`).
5. `npx expo export` completes with zero errors.

Pass criteria:

- [ ] Ticket created via the flow appears in erxes Admin under the correct channel/pipeline
- [ ] The created ticket is attributed to the authenticated CPUser
- [ ] Anonymous users cannot trigger ticket creation
- [ ] Submission is best-effort/non-blocking (network failure shows an error state, never crashes)
- [ ] No sensitive values logged
- [ ] `npx expo export` passes

---

## 7. Agent Rules

1. Use `cpCreateTicket` exactly as specified in §1 — do not substitute a
   different mutation name or add a `customerId`/`cpUserId` argument that
   doesn't exist on this schema.
2. Never allow ticket creation without an authenticated `CPUser` session.
3. Reuse the existing Apollo client / auth hook — do not create a second
   Apollo instance or a parallel auth mechanism.
4. Keep this flow best-effort: a failed ticket submission must show the
   user an error state, never crash the app or block navigation.
5. Never log tokens, ticket IDs tied to PII, or full request payloads —
   log error objects/counts only.
6. Use `_id` in all GraphQL selections, consistent with `connect-erxes.md`.
7. If `channelId` / `pipelineId` / `statusId` are missing from config,
   stop and ask the user for them (erxes Admin → Tickets → Settings) —
   never guess or leave them empty, since all three are non-nullable.

---

## Files Modified

- `.env.local` — `EXPO_PUBLIC_ERXES_TICKETS_CHANNEL_ID`, `_PIPELINE_ID`, `_STATUS_ID`, `_STAGE_ID`
- `lib/graphql/mutations/tickets.ts` — **new**, `CP_CREATE_TICKET`
- `src/lib/feedbackTicket.ts` — **new**, `submitFeedbackAsTicket()`
- `app/feedback.tsx` — **new**, feedback form gated on auth session

---

## AGENTS.md Integration Patch (required — apply these six edits)

This file follows the exact same registration pattern as
`connect-messenger.md` (4.5) and `notification.md` (4.6). Apply all six
edits below to `agents/ecommerce/AGENTS.md`, or the agent will never invoke
this file at the right point in the pipeline.

**1. File table** — add a row after the `notification.md` row:

```
| [`connect-erxes-tickets.md`](connect-erxes-tickets.md) | Step 4.7 — connecting feedback screen to erxes Client Portal Tickets, or any time the user asks to "connect feedback to tickets", "send feedback as a ticket", or "add feedback tickets" |
```

**2. Hard Gate** — add alongside the existing 4.5/4.6 gate line:

```
Do not enter Step 4.7 (Connect Feedback Tickets) until Step 4 is complete
and the user has explicitly asked for that integration.
```

And add its own Step 0 completeness bullet next to
`enable_push_notifications`:

```
- `enable_feedback_tickets` and `tickets_board_id` / `tickets_pipeline_id` /
  `tickets_stage_id` are collected when the user has already asked for
  feedback-to-ticket integration
```

**3. Step 1 — derived config** — add next to `has_push_notifications`:

```
- `has_feedback_tickets` = `enable_feedback_tickets` is true, OR the user
  has separately asked to "connect feedback to tickets" / "send feedback
  as a ticket"
```

**4. New pipeline section** — insert **Step 4.7** immediately after Step
4.6's content, using the same shape (trigger phrases → read file → run
pipeline → verify checklist) as Step 4.6 already uses for
`notification.md`.

**5. Step 6 — Verify** — add alongside the `has_push_notifications`
checklist block:

```
**If `has_feedback_tickets` is true**, additionally confirm the checklist
from `connect-erxes-tickets.md` §6 before considering Step 6 complete:

- Introspected `cp*` ticket mutation name/fields match the implementation
- Anonymous users cannot trigger ticket creation
- A submitted ticket appears in the correct erxes board/pipeline/stage
```

**6. "Pipeline — Updating an existing app"** — add a bullet next to the
Messenger/push-notification shortcuts:

```
- "connect feedback to tickets" / "add feedback tickets" → jump directly
  to Step 4.7 and `agents/ecommerce/connect-erxes-tickets.md` rather than
  re-running the full pipeline
```

---

## reference.md Patch

Add this confirmed row to the erxes mutations table in `reference.md`
(no direct input type — `cpCreateTicket` takes flat arguments, not a
single `Input` object, unlike the CMS mutations in that table):

```
| `cpCreateTicket` | flat args (see connect-erxes-tickets.md §1) | Feedback → Client Portal ticket |
```
