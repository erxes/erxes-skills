# erxes Ecommerce + CMS — Mobile Agent Instructions (Expo)

You build and deploy **Expo (React Native)** ecommerce apps that are fully connected to both erxes POS (products, cart, payment), erxes CMS (pages, blog, navigation), and — optionally — erxes Messenger (real-time chat) and Firebase Cloud Messaging (push notifications).

Read these files as needed — do not skip them:

| File                                           | Read when                                                                                                                                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`setup.md`](setup.md)                         | Start of every new build                                                                                                                                                                                                    |
| [`conventions.md`](conventions.md)             | Before writing any code                                                                                                                                                                                                     |
| [`generate.md`](generate.md)                   | Step 4 — code generation                                                                                                                                                                                                    |
| [`reference.md`](reference.md)                 | GraphQL queries/mutations, env vars, checklist                                                                                                                                                                              |
| [`payment.md`](payment.md)                     | Checkout and payment implementation                                                                                                                                                                                         |
| [`connect-messenger.md`](connect-messenger.md) | Step 4.5 — connecting erxes Messenger (live chat) to the generated Expo app, or any time the user asks to "connect messenger", "add live chat", "connect erxes messenger", "add messenger SDK", or "set up erxes messenger" |
| [`notification.md`](notification.md)           | Step 4.6 — wiring up Firebase Cloud Messaging (push notifications), or any time the user asks to "add push notifications", "set up FCM", "connect firebase notifications", or "add notification.md"                         |

---

## Hard Gate

Do not run any shell commands (including environment checks like `node -v` /
`npm -v`), explore the repo, clone/init the Expo project, or write any file
until Step 0 is complete.

Do not generate any design directions, visual concepts, or frontend ideas
until Step 0 is complete.

Do not enter Step 3.5 design work until Step 0.5 (when the user requested UX
research) is complete and user-approved.

Do not enter Step 4 frontend/code generation until Step 3.5 is fully complete.

Do not enter Step 4.5 (Connect Messenger) or Step 4.6 (Connect Push
Notifications) until Step 4 is complete and the user has explicitly asked for
that integration.

Do not enter Step 5 (Seed CMS content) until Step 4 — and Step 4.5 / 4.6 if
triggered — are complete.

Do not enter Step 7 (Deploy) until Step 6 (Verify) passes with 0 errors.

**Step 0 is complete only when:**

- `store.config.json` exists
- `name`, `template_type`, `languages`, `tone` are collected (generic fields via `agents/setup.md`)
- `delivery_types`, `allow_guest`, `pos_token` are collected (`agents/ecommerce/setup.md`)
- `client_portal_id` is collected
- `design_strategy` is collected
- `ui_source` is collected
- `ui_source_ref` is collected
- `reference_url` is collected when `design_strategy` is `copy-site` or `improve-site`
- `competitor_urls` is collected when `design_strategy` is `beat-competitors`
- `enable_messenger` and `messenger_brand_code` are collected when the user has already asked for live chat
- `enable_push_notifications` and the required Firebase values are collected when the user has already asked for push notifications
- `.env` has the required erxes, CMS, and deployment values
- the CMS is created via `tsx scripts/erxes-cms.ts` (when `has_cms`) and the returned `_id` is saved into `store.config.json` and `.env` as `ERXES_CMS_ID`

A vague or generic trigger like "create me a mobile app" is not sufficient
input to proceed — it only starts Step 0. If any required field above is
missing:

- stop the conversation
- ask the user directly for the missing fields
- do not infer, default, guess, or silently continue past this point
- do not run shell commands, explore the repo, or write any file before the user has answered

**Step 0.5 is complete only when** (skip entirely if the user did not request UX research):

- `output/<slug>/ux-research.md` exists
- the UX research covers the required sections from `agents/ux-ui-researcher.md`
- the user explicitly approved the research or gave a direct instruction to proceed

**Step 3.5 is complete only when:**

- 2 to 3 home-screen-only direction previews were created in Pencil at mobile viewport (390×844)
- each preview includes the full home screen with all selected or detected homepage sections in order
- preview exports were shown to the user
- the user selected one home screen option
- the selected option was expanded into the full Pencil design package (`design.pen`, `design.png`, `design-tokens.json`, `ui-libraries.json`, `HANDOFF.md`)
- the user was asked exactly: `do you wanna edit design before build frontend?`
- any requested design edits were applied and re-approved
- the user explicitly approved the final design package for build
- the design artifacts are real Pencil outputs, not placeholders or stub files
- all Pencil work stayed inside the exact approved `.pen` file path for this app

**Step 4 is complete only when:**

- all 17 files listed in Step 4's "Read these files IN ORDER" were read, including `generate-screens.md` and `generate-checkout.md` (never skipped)
- all files were written in the specified order, ending with `.env.local`
- `babel-preset-expo` and `babel.config.js` exist before any bundling is attempted
- env var names in `lib/apollo/client.ts` and `.env.local` match exactly (no silently-empty auth headers)

If any of those are missing, stop and complete them before moving to Step 4.5, 4.6, or Step 5.

---

## Shared Module Integration

The ecommerce pipeline REUSES modules from the generic `agents/` folder. Do not duplicate — read the shared files at the correct step.

### Shared Files (read at the specified step)

| File                         | When to Read                           | Purpose                                                                                 |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `agents/setup.md`            | Step 0 (if starting fresh)             | Generic setup collection — ask template type, languages, tone, design strategy, etc.    |
| `agents/pencil-design.md`    | Step 3.5                               | Pencil design tool usage, direction previews, design tokens                             |
| `agents/animations.md`       | Step 4 (before writing animation code) | Animation library implementations — Reanimated, Moti, Lottie, etc.                      |
| `agents/frontend.md`         | Step 4 (before code generation)        | Frontend build phases, token system, component architecture, zero-error build protocol  |
| `agents/ux-ui-researcher.md` | Step 0.75 (if user wants UX research)  | UX research document generation (optional for ecommerce)                                |
| `agents/conventions.md`      | Before writing ANY code                | Generic code conventions — React Native patterns, data fetching, NativeWind, TypeScript |

### Ecommerce-Specific Files (always read these)

| File                              | When to Read                     | Purpose                                                                                  |
| --------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents/ecommerce/setup.md`       | Step 0                           | Ecommerce-specific fields (delivery_types, allow_guest, pos_token)                       |
| `agents/ecommerce/conventions.md` | Before writing ANY code          | Ecommerce-specific conventions — auth tokens, Apollo headers, Jotai stores, payment flow |
| `agents/ecommerce/generate.md`    | Step 4                           | Ecommerce code generation — types, GraphQL, hooks, components, screens                   |
| `agents/ecommerce/reference.md`   | Step 4 + Step 5                  | GraphQL queries/mutations, env vars, payment flow checklist                              |
| `agents/ecommerce/payment.md`     | Step 4 (checkout implementation) | Payment implementation details                                                           |

### Optional Mobile Integration Files (read only when triggered)

| File                                    | When to Read                                                                                                        | Purpose                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agents/ecommerce/connect-messenger.md` | Step 4.5, after the Expo frontend project exists in `output/<slug>/`, and the user has asked to connect live chat   | Connects the generated Expo app to erxes Messenger — own Apollo client (HTTP + WebSocket), hooks, GraphQL layer, chat UI components, storage, and the public `<ErxesMessenger>` entry point                                                                                                                              |
| `agents/ecommerce/notification.md`      | Step 4.6, after the Expo frontend project exists in `output/<slug>/`, and the user has asked for push notifications | Wires up Firebase Cloud Messaging (FCM) end to end — Firebase config files, `app.json` plugins, iOS/Android prebuild config, `usePushNotifications` hook, `registerFcmToken` mutation, token refresh, and foreground/background/terminated notification handling, plus the client-portal backend token-registration flow |

### Routing from Generic Pipeline

When `template_type = "ecommerce"` is selected in `agents/setup.md`:

1. **Stop following `agents/setup.md`** after collecting generic fields
2. **Switch to `agents/ecommerce/AGENTS.md`** immediately
3. **Continue ecommerce-specific setup** (delivery_types, allow_guest, pos_token)
4. **Skip generic business analysis** — ecommerce has its own content flow
5. **Skip generic UX research** — optional, user can request it
6. **Proceed directly to design (Step 3.5)** after setup complete

### File Reading Order for Ecommerce (Mobile)

```
Step 0:  agents/setup.md (generic fields)
         |
         agents/ecommerce/setup.md (ecommerce-specific fields)
         |
Step 0.5: [OPTIONAL] agents/ux-ui-researcher.md (if user wants UX research)
         |
Step 3.5: agents/pencil-design.md (design directions in Pencil)
         |
Step 4:  agents/ecommerce/generate.md (ecommerce code generation)
         agents/ecommerce/conventions.md (ecommerce conventions)
         agents/conventions.md (generic conventions)
         agents/frontend.md (frontend architecture)
         agents/animations.md (animation libraries — if motion level > 0)
         agents/ecommerce/reference.md (GraphQL reference)
         agents/ecommerce/payment.md (payment flow)
         |
Step 4.5: [OPTIONAL] agents/ecommerce/connect-messenger.md (only if user asked for live chat / erxes Messenger)
         |
Step 4.6: [OPTIONAL] agents/ecommerce/notification.md (only if user asked for push notifications / FCM)
         |
Step 5:  agents/ecommerce/reference.md (CMS seeding, env vars)
         |
Step 6-7: agents/ecommerce/reference.md (verify + deploy)
```

---

## Pipeline — New storefront (Mobile)

### Step 0 — Setup

See **Hard Gate** above — do not proceed past this step until every required field is collected and `store.config.json` is written.

**If coming from generic pipeline (`agents/setup.md`):**

- Generic fields already collected in `site.config.json`
- Rename `site.config.json` → `store.config.json`
- Read `agents/ecommerce/setup.md` and ask ONLY missing ecommerce-specific fields:
  - `delivery_types`
  - `allow_guest`
  - `pos_token`
- If the user has already mentioned wanting live chat / erxes Messenger, also record `enable_messenger: true` and ask for `messenger_brand_code` (erxes Admin → Settings → Brands → code)
- If the user has already mentioned wanting push notifications, also record `enable_push_notifications: true` and ask for the required Firebase values: app name, iOS bundle identifier, Android package name, Firebase project ID, iOS target name, and backend GraphQL endpoint (see `notification.md` → "Required Values To Fill")

**If starting fresh:**

- Read `agents/setup.md` first — collect generic fields (name, template_type, languages, tone, etc.)
- When `template_type = "ecommerce"`, switch to this file
- Then read `agents/ecommerce/setup.md` — collect ecommerce-specific fields

**After all fields collected:**

- Write `store.config.json`
- Update `.env`
- Create CMS with `tsx scripts/erxes-cms.ts`
- Save returned `_id` as `ERXES_CMS_ID`

### Step 1 — Read config

Read `store.config.json`. Derive:

- `slug` = name lowercased, spaces → hyphens
- `has_delivery` = `delivery_types` includes `"delivery"`
- `has_auth` = `allow_guest` is false
- `has_cms` = `cms_sections` is non-empty and not `["none"]`
- `has_blog` = `cms_sections` includes `"blog"`
- `has_contact` = `sections` includes `"contact"` or `cms_sections` includes `"contact"`
- `has_messenger` = `enable_messenger` is true, OR the user has separately asked to "connect messenger" / "add live chat" / "connect erxes messenger" / "add messenger SDK" / "set up erxes messenger"
- `has_push_notifications` = `enable_push_notifications` is true, OR the user has separately asked to "add push notifications" / "set up FCM" / "connect firebase notifications"

**Section-to-screen rule:**

- The home screen should include the selected sections as landing sections
- Every selected section should also become a standalone screen/route unless purely decorative
- Use the same section names and slugs consistently across home screen composition, CMS screens, and bottom tab / drawer navigation

### Step 2 — Create CMS

**Skip this step if `has_cms` is false.**

```bash
tsx scripts/erxes-cms.ts
```

Calls `cpContentCreateCMS` with `{ name, description, languages, defaultLanguage, clientPortalId }` from `store.config.json`.

- `clientPortalId` comes from the `client_portal_id` field collected in setup
- This links the CMS to the correct client portal in erxes

Saves returned `_id` into:

- `store.config.json` as `erxes_cms_id`
- `.env` as `ERXES_CMS_ID`
- `output/<slug>/.env.local` as both `ERXES_CMS_ID` and `EXPO_PUBLIC_CMS_ID`

### Step 3 — Initialize Expo project

```bash
tsx scripts/clone.ts "<store-name>"
```

Creates the Expo project in `output/<slug>/`. Skips if already exists.

**CRITICAL:** Mobile ecommerce uses Expo, not Next.js.

```bash
npx create-expo-app@latest output/<slug> --template default@sdk-55
```

Required packages to install after init:

```bash
cd output/<slug>
npx expo install expo-router apollo-client @apollo/client graphql jotai nativewind tailwindcss
npx expo install expo-secure-store expo-constants expo-linking expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
npx expo install babel-preset-expo
```

**CRITICAL — `babel.config.js` must always be created at this step, before any bundling is attempted.** Metro fails with `Cannot find module 'babel-preset-expo'` if this file is missing or the package above was skipped. Create it immediately after the installs above (do not defer this to a later step or leave it to be added only if bundling fails):

```javascript
// output/<slug>/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
```

Before running, ensure `.env` has the correct configuration for Expo.

> **Web → Mobile mapping:**
>
> - `next/navigation` → `expo-router` (`useRouter`, `useLocalSearchParams`, `Link`)
> - `pages/` or `app/` directory (Next.js) → `app/` directory (Expo Router)
> - CSS Modules / Tailwind → NativeWind (`className` on React Native components)
> - `<div>`, `<p>`, `<img>` → `<View>`, `<Text>`, `<Image>` from `react-native`
> - `layout.tsx` → `app/_layout.tsx` (Expo Router root layout)
> - API Routes → Expo API Routes (`app/api/` or separate backend)

### Step 3.5 — UI design source

Read `ui_source`, `ui_source_ref`, `design_strategy`, `reference_url`, and `competitor_urls` from `store.config.json`.

See **Hard Gate** above — do not enter this step until Step 0 (and Step 0.5, if triggered) is complete.

**Design strategy controls the approach:**

- `from-scratch` — new app, no existing design to preserve
- `copy-site` — replicate an existing site/app as faithfully as possible
- `improve-site` — use an existing design as the base, then elevate it
- `brand-first` — build from a brand guide, Figma system, or locked visual identity
- `beat-competitors` — audit competitor references and design to stand out

**Mobile design considerations (always apply):**

- Design for touch targets (minimum 44×44pt)
- Bottom tab navigation or drawer navigation — choose based on section count
- Safe area insets (notch, home indicator) must be handled
- Gestures (swipe back, pull-to-refresh) should feel native
- iOS and Android platform conventions where they differ

**`words`** — user described the look in text:
Read [`agents/pencil-design.md`](../pencil-design.md). Use `ui_source_ref` as the creative brief. Produce the full design package:

- First create 2–3 home screen direction previews in Pencil (mobile viewport: 390×844)
- Save them as real preview artifacts:
  - `output/<slug>/designs/homescreen-directions.pen`
  - `output/<slug>/designs/homescreen-option-a.png`
  - `output/<slug>/designs/homescreen-option-b.png`
  - `output/<slug>/designs/homescreen-option-c.png` (when a third option exists)
- Show those previews to the user and get a choice
- Only after the user selects one option, expand that chosen direction into:
  - `output/<slug>/designs/design.pen`
  - `output/<slug>/designs/design.png`
  - `output/<slug>/design-tokens.json`
  - `output/<slug>/ui-libraries.json`
  - `output/<slug>/HANDOFF.md`
- After the full screen design is ready, ask exactly: `do you wanna edit design before build frontend?`
- Apply requested edits and repeat until the user explicitly approves

**`pencil`**, **`screenshot`**, **`website`** — same flow as web version but:

- All previews use mobile viewport (390×844)
- Extract mobile-specific patterns (bottom nav, cards, modals)

### Step 4 — Generate code

See **Hard Gate** above — do not enter Step 4 until Step 3.5 is fully complete.

**CRITICAL: Read these files IN ORDER before writing code:**

1. `agents/ecommerce/generate.md` — table of contents, design agnosticism rules, build checklist
2. `agents/ecommerce/generate-setup.md` — dependencies, utils, constants, env, app.config.ts
3. `agents/ecommerce/generate-types.md` — TypeScript interfaces
4. `agents/ecommerce/generate-i18n.md` — i18n routing, locale config, messages JSON
5. `agents/ecommerce/generate-core.md` — Apollo Client, Jotai stores, app layouts
6. `agents/ecommerce/generate-graphql.md` — GraphQL file map (do NOT recreate starter files)
7. `agents/ecommerce/generate-hooks.md` — auth, order, payment, query hooks
8. `agents/ecommerce/generate-components.md` — layout + product components (React Native)
9. `agents/ecommerce/generate-screens.md` — home, products, **login**, **register**, **profile**, **orders**, **wishlist**, cart
10. `agents/ecommerce/generate-checkout.md` — **checkout** + **verify** screens
11. `agents/ecommerce/generate-cms.md` — review system, CMS screens (about, blog) — read when `has_cms` is true
12. `agents/ecommerce/conventions.md` — ecommerce conventions (auth tokens, Apollo headers, Jotai stores, payment flow)
13. `agents/conventions.md` — generic conventions (React Native patterns)
14. `agents/frontend.md` — frontend architecture, token system, build phases
15. `agents/animations.md` — animation libraries (if motion level > 0)
16. `agents/ecommerce/reference.md` — GraphQL queries/mutations
17. `agents/ecommerce/payment.md` — payment flow implementation

**Do NOT skip generate-screens.md or generate-checkout.md.** These files define the auth, profile, orders, wishlist, checkout, and verify screens. Skipping them produces a static app without the ecommerce flow.

**Then write files in this order:**

1. Dependencies install
2. Types (`types/`)
3. Apollo client + provider
4. Jotai store (`store/`)
5. GraphQL (`graphql/`)
6. Root layout: `app/_layout.tsx` + Providers
7. Tab/Stack navigation: `app/(tabs)/_layout.tsx` or drawer layout
8. Auth screens: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`
9. Ecommerce screens: `app/(tabs)/index.tsx` (home), `app/(tabs)/products/index.tsx`, `app/(tabs)/products/[id].tsx`, `app/cart.tsx`
10. Profile + account screens: `app/(tabs)/profile/index.tsx`, `app/orders/index.tsx`, `app/orders/[id].tsx`, `app/wishlist.tsx`
11. Checkout + payment: `app/checkout.tsx`, `app/verify.tsx`
12. CMS screens: `app/about.tsx`, `app/contact.tsx`, `app/blog/index.tsx`, `app/faq.tsx` — only sections listed in `cms_sections`
13. Navigation components: `components/layout/TabBar.tsx`, `components/layout/Header.tsx`
14. `.env.local`

**React Native component rules:**

- Use `<View>`, `<Text>`, `<ScrollView>`, `<FlatList>`, `<Pressable>` — never HTML elements
- Use `StyleSheet.create()` or NativeWind `className` for styling
- Use `expo-image` for optimized images instead of `<img>`
- Use `expo-router` `<Link>` and `useRouter()` for navigation
- All touch targets minimum 44×44pt
- Handle keyboard avoiding with `KeyboardAvoidingView`

### Step 4.5 — Connect Messenger (optional, live chat)

**Skip this step if `has_messenger` is false.**

Run this step only after the Expo frontend project exists in `output/<slug>/` (i.e., after Step 4). Trigger it whenever the user says any of:

- "connect messenger to mobile app"
- "connect erxes messenger"
- "add live chat to expo app"
- "set up erxes messenger"
- "add messenger SDK"

Read [`agents/ecommerce/connect-messenger.md`](connect-messenger.md) in full and run its pipeline without waiting for step-by-step instructions:

1. Scan the generated Expo project tree under `src/messenger/` before generating any file.
2. Set up the **Messenger's own Apollo client** — always separate from the CMS Apollo client (`lib/apollo-client.ts`). Messenger uses `credentials: 'include'` (cookie session) plus a `graphql-ws` split link for subscriptions; the CMS client uses the `erxes-app-token` header over HTTP only. Never merge the two clients and never pass the host app's bearer token to the Messenger client.
3. Add required env vars to `.env.local`:
   ```env
   EXPO_PUBLIC_ERXES_API_URL=<erxes gateway URL>
   EXPO_PUBLIC_ERXES_BRAND_CODE=<erxes brand/integration code>
   ```
4. Install dependencies:
   ```bash
   npx expo install @apollo/client graphql graphql-ws
   npx expo install @react-native-async-storage/async-storage
   npx expo install react-native-svg
   npx expo install react-native-get-random-values
   npx expo install react-native-render-html
   # Optional — attach button hides automatically when neither is installed
   npx expo install expo-image-picker
   ```
5. Generate the full `src/messenger/` tree exactly as specified in `connect-messenger.md` §17 (Apollo client/container, GraphQL mutations/queries/subscriptions, 7 hooks, 9 UI components, upload service, storage keys, public/internal types, utils, context, theme, `Widget.tsx`, `ErxesMessenger.tsx`, `index.ts`) plus `src/messengerConfig.ts` at the host level.
6. Mount `<ErxesMessenger>` (the only component host code should import) from wherever the store wants live chat exposed — typically the home screen or a persistent floating launcher (`showWidget`) — using `config.apiUrl` and `config.brandId` from `messengerConfig.ts` / `.env.local`.
7. Apply all messenger agent rules from `connect-messenger.md` §20, in particular:
   - `credentials: 'include'` on both the HTTP link and the upload fetch — never remove
   - `react-native-get-random-values` must be the first import in `ErxesMessenger.tsx`
   - Gate all hooks on `identity.ready`; never call `useConnect` or `useConversationsList` before identity resolves
   - Pass `visitorId` only when `customerId` is null — never send both
   - Host code imports only from `src/messenger/types/public.ts`, never `types/internal.ts`
   - Call `clearMessengerStorage` on logout — never clear only one key
8. Verify against `connect-messenger.md` §19 (Connection, Identity, Chat, UI, Environment checklists) before moving on.

### Step 4.6 — Connect Push Notifications (optional, Firebase/FCM)

**Skip this step if `has_push_notifications` is false.**

Run this step only after the Expo frontend project exists in `output/<slug>/` (i.e., after Step 4). Trigger it whenever the user says any of:

- "add push notifications"
- "set up FCM"
- "connect firebase notifications"
- "add notification.md"

Read [`agents/ecommerce/notification.md`](notification.md) in full and follow its pipeline exactly, substituting the project's own values for every placeholder:

| Placeholder              | Fill from                                                     |
| ------------------------ | ------------------------------------------------------------- |
| `<APP_NAME>`             | `store.config.json` → `name`                                  |
| `<IOS_BUNDLE_ID>`        | collected in Step 0 (or `app.json` → `ios.bundleIdentifier`)  |
| `<ANDROID_PACKAGE_NAME>` | collected in Step 0 (or `app.json` → `android.package`)       |
| `<FIREBASE_PROJECT_ID>`  | collected in Step 0                                           |
| `<IOS_TARGET_NAME>`      | collected in Step 0 (usually equals `<APP_NAME>`)             |
| `<BACKEND_GRAPHQL_URL>`  | `store.config.json` / `.env` → erxes gateway GraphQL endpoint |

1. **Firebase config files** — obtain `GoogleService-Info.plist` and `google-services.json` for `<FIREBASE_PROJECT_ID>` from the Firebase Console and commit both at the repo root (`output/<slug>/GoogleService-Info.plist`, `output/<slug>/google-services.json`). These are the source of truth; native `ios/` and `android/` files are generated from them via `expo prebuild` and must never be hand-edited directly.
2. **`app.json` wiring** — set `ios.bundleIdentifier`, `ios.googleServicesFile`, `android.package`, `android.googleServicesFile`, `ios.entitlements` (`aps-environment`), `ios.infoPlist.UIBackgroundModes: ["remote-notification"]`, and `android.permissions` (`POST_NOTIFICATIONS`), per `notification.md` → "Firebase Configuration".
3. **Install dependencies:**
   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/messaging expo-build-properties
   ```
   Add the three plugins to `app.json` → `plugins`: `@react-native-firebase/app`, `@react-native-firebase/messaging`, and `["expo-build-properties", { "ios": { "useFrameworks": "static" } }]`.
4. **Generate the committed application files** exactly as specified in `notification.md` → "Files Modified → React Native Application":
   - `src/constants/config.ts` — add the `deviceId` storage key
   - `src/utils/deviceId.ts` — **new**, `getOrCreateDeviceId()`
   - `src/graphql/notificationsQL.ts` — **new**, `clientPortalUserAddFcmToken` mutation against `<BACKEND_GRAPHQL_URL>`
   - `src/lib/push.ts` — **new**, module-scope background handler, `ensureNotificationPermission()`, `getFcmToken()`, `registerFcmToken()`
   - `src/hooks/usePushNotifications.ts` — **new**, foreground/background/terminated listeners, `onTokenRefresh`, permission + token registration, keyed on the auth session token
   - `app/_layout.tsx` — mount `usePushNotifications(token)` in the root layout so it runs on both first login and session-restore/app-startup for already-authenticated users
5. **Run prebuild** after `app.json` and the Firebase config files are in place:
   ```bash
   npx expo prebuild --platform ios
   npx expo prebuild --platform android
   npx pod-install
   ```
6. Apply the key behavioral rules from `notification.md`, in particular:
   - Registration is **best-effort and non-blocking** — permission denial or a failed mutation must never block login or crash the app; wrap in `try/catch`
   - Existing (already logged-in) users register their token on **app startup / session restore**, not only on the login event — do not gate registration on a login-only trigger
   - Send the same persisted `deviceId` on every call so the backend can dedupe per device
   - Never log the FCM token or any Firebase config values — only log failure counts/messages
   - `resolveRoute()` reads `data.route ?? data.url` and falls back to `/notification` when tapping a push
7. Verify against `notification.md` → "Verification Checklist" (Firebase initialization, permission prompts, token generation, backend registration, push delivery in foreground/background/terminated states, token refresh on reinstall, Android 13+ permission handling) before moving on.

### Step 5 — Seed CMS content

**Skip this step if `has_cms` is false.**

Seed content for every language in `store.config.json`. Use real translated text — no placeholders.

**Generate content JSON files first, then run scripts.**

#### 5a. Screens/Pages (`output/pages.json`)

For each section in `cms_sections` (except "none"), generate a page object per language:

```json
[
  {
    "slug": "about",
    "lang": "mn",
    "title": "Бидний тухай",
    "description": "<store-specific 1-2 sentence description>",
    "content": "<HTML with real info about the store — no lorem ipsum>",
    "status": "published",
    "meta": { "title": "Бидний тухай", "description": "...", "keywords": "..." }
  },
  {
    "slug": "about",
    "lang": "en",
    "title": "About Us",
    "description": "...",
    "content": "...",
    "status": "published",
    "meta": { "title": "About Us", "description": "...", "keywords": "..." }
  }
]
```

```bash
tsx scripts/erxes-pages.ts output/pages.json
```

#### 5b. Blog posts (`output/posts.json`) — only if `has_blog`

Generate 3 starter posts in each language:

```json
[
  {
    "lang": "mn",
    "title": "...",
    "slug": "first-post",
    "description": "...",
    "content": "<HTML — at least 3 paragraphs>",
    "status": "published",
    "publishedDate": "<today's ISO date>"
  }
]
```

```bash
tsx scripts/erxes-posts.ts output/posts.json
```

#### 5c. Navigation menu (`output/menu.json`)

Generate two menus — `Main Navigation` (bottom tabs / drawer) and `Footer` — with links appropriate to the store's `cms_sections`:

```json
[
  {
    "name": "Main Navigation",
    "items": [
      { "name": "Нүүр", "link": "/", "order": 1 },
      { "name": "Бараа", "link": "/products", "order": 2 },
      { "name": "Блог", "link": "/blog", "order": 3 },
      { "name": "Бидний тухай", "link": "/about", "order": 4 }
    ]
  },
  {
    "name": "Footer",
    "items": [
      { "name": "Бидний тухай", "link": "/about", "order": 1 },
      { "name": "Холбоо барих", "link": "/contact", "order": 2 },
      { "name": "Нийтлэл", "link": "/blog", "order": 3 }
    ]
  }
]
```

Only include links for screens that exist in `cms_sections`.

```bash
tsx scripts/erxes-menu.ts output/menu.json
```

### Step 6 — Verify

Before bundling, confirm `babel.config.js` exists and `babel-preset-expo` is in `package.json` dependencies (added in Step 3) — a missing preset causes `Cannot find module 'babel-preset-expo'` at bundle time and must be fixed at Step 3, not patched here.

```bash
cd output/<slug> && npx expo export
```

Fix all TypeScript and ESLint errors. Also run:

```bash
npx expo-doctor
```

Build must succeed with 0 errors before deploying.

**If `has_messenger` is true**, additionally confirm the messenger checklist from `connect-messenger.md` §19 before considering Step 6 complete:

- Messenger connect mutation succeeds and returns `customerId`
- WebSocket connection established (no `[messenger] network error` logs)
- `widgetsConversations` / `widgetsConversationDetail` return data and `conversationMessageInserted` fires on a new message

**If `has_push_notifications` is true**, additionally confirm the checklist from `notification.md` → "Verification Checklist" before considering Step 6 complete:

- App launches with no `No Firebase App '[DEFAULT]'` crash
- `messaging().getToken()` resolves a token and `clientPortalUserAddFcmToken` registers it with `{ deviceId, token, platform }`
- A test push from the Firebase Console is received in foreground (in-app toast), background (system tray), and terminated (tray + correct route on tap) states
- Android 13+ shows the `POST_NOTIFICATIONS` prompt; no prompt on Android ≤12

### Step 7 — Deploy

Read `deploy_target` from `store.config.json`.

**`eas` (recommended — iOS + Android):**

```bash
eas build --platform all
eas submit --platform all
```

**`expo-go` (development/preview):**

```bash
npx expo start --tunnel
```

**`web` (PWA via Expo):**

```bash
npx eas-cli deploy
```

**`github`:**

```bash
tsx scripts/github-push.ts "<store-name>"
```

---

## Pipeline — Updating an existing app

1. Read `store.config.json`
2. Read relevant files in `output/<slug>/`
3. Make only the targeted changes:
   - "connect messenger" / "add live chat" → jump directly to Step 4.5 and `agents/ecommerce/connect-messenger.md`
   - "add push notifications" / "set up FCM" → jump directly to Step 4.6 and `agents/ecommerce/notification.md`
     rather than re-running the full pipeline
4. Redeploy: `eas build --platform all`
