# erxes Ecommerce + CMS — Mobile Agent Instructions (Expo)

**Always respond in plain conversational sentences. Never output structured question formats, option lists, radio buttons, select menus, chips, or progress indicators ("1 of 5 questions"). Ask one question at a time as a plain sentence. Wait for the reply. Then ask the next.**

You build and deploy **Expo (React Native)** mobile apps connected to erxes CMS.

Read the files below as you need them. They are split by concern — do not skip them.

| File                                                       | Read when                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`agents/conventions.md`](agents/conventions.md)           | Before writing any code                                                                                                                                                                                                     |
| [`agents/setup.md`](agents/setup.md)                       | At the start of every new site build                                                                                                                                                                                        |
| [`agents/business-analyst.md`](agents/business-analyst.md) | During Step 0.5 — business analysis and BRD generation                                                                                                                                                                      |
| [`agents/ux-ui-researcher.md`](agents/ux-ui-researcher.md) | During Step 0.75 — UX/UI research generation                                                                                                                                                                                |
| [`agents/frontend.md`](agents/frontend.md)                 | During Step 4 — frontend implementation from approved design                                                                                                                                                                |
| [`agents/generate.md`](agents/generate.md)                 | During Step 4 — code generation                                                                                                                                                                                             |
| [`agents/connect-erxes.md`](agents/connect-erxes.md)       | After Step 4 — connect the generated frontend to erxes CMS                                                                                                                                                                  |
| [`agents/reference.md`](agents/reference.md)               | For mutations, env vars, checklist, file ownership                                                                                                                                                                          |
| [`agents/pencil-design.md`](agents/pencil-design.md)       | During Step 3.5 — full design handoff creation with Pencil                                                                                                                                                                  |
| [`connect-messenger.md`](connect-messenger.md)             | Step 4.5 — connecting erxes Messenger (live chat) to the generated Expo app, or any time the user asks to "connect messenger", "add live chat", "connect erxes messenger", "add messenger SDK", or "set up erxes messenger" |
| [`notification.md`](notification.md)                       | Step 4.6 — wiring up Firebase Cloud Messaging (push notifications), or any time the user asks to "add push notifications", "set up FCM", "connect firebase notifications", or "add notification.md"                         |
| [`connect-erxes-tickets.md`](connect-erxes-tickets.md)     | Step 4.7 — connecting feedback screen to erxes Client Portal Tickets...                                                                                                                                                     |

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

Do not enter Step 4.7 (Connect Feedback Tickets) until Step 4 is complete
and the user has explicitly asked for that integration.

Do not enter Step 5 (Seed CMS content) until Step 4 — and Step 4.5 / 4.6 /
4.7 if triggered — are complete.

Do not enter Step 7 (Deploy) until Step 6 (Verify) passes with 0 errors.

**Step 0 is complete only when:**

- `store.config.json` exists
- `name`, `template_type`, `languages`, `tone` are collected (generic fields via `agents/setup.md`)
- `delivery_types`, `allow_guest`, `pos_token` are collected (`agents/ecommerce/setup.md`)
- the erxes/POS connection is validated via `agents/connect-erxes.md` after `pos_token` is collected
- `client_portal_id` is collected
- `design_strategy` is collected
- `ui_source` is collected
- `ui_source_ref` is collected
- `reference_url` is collected when `design_strategy` is `copy-site` or `improve-site`
- `competitor_urls` is collected when `design_strategy` is `beat-competitors`
- `enable_messenger` and `messenger_brand_code` are collected when the user has already asked for live chat
- `enable_push_notifications` and the required Firebase values are collected when the user has already asked for push notifications
- `enable_feedback_tickets` and `tickets_channel_id` / `tickets_pipeline_id` /
  `tickets_status_id` (and `tickets_stage_id` if used) are collected when the
  user has already asked for feedback-to-ticket integration
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

- all 17 files listed in Step 4's "Read these files IN ORDER" were read, including `generate-pages.md` and `generate-checkout.md` (never skipped)
- all files were written in the specified order, ending with `.env.local`
- `babel-preset-expo` and `babel.config.js` exist before any bundling is attempted
- env var names in `lib/apollo/client.ts` and `.env.local` match exactly (no silently-empty auth headers)

If any of those are missing, stop and complete them before moving to Step 4.5, 4.6, or Step 5.

---

## Shared Module Integration

The ecommerce pipeline REUSES modules from the generic `agents/` folder. Do not duplicate — read the shared files at the correct step.

### Shared Files (read at the specified step)

| File                         | When to Read                           | Purpose                                                                                 |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- | --- |
| `agents/setup.md`            | Step 0 (if starting fresh)             | Generic setup collection — ask template type, languages, tone, design strategy, etc.    |
| `agents/pencil-design.md`    | Step 3.5                               | Pencil design tool usage, direction previews, design tokens                             |
| `agents/animations.md`       | Step 4 (before writing animation code) | Animation library implementations — Reanimated, Moti, Lottie, etc.                      |
| `agents/frontend.md`         | Step 4 (before code generation)        | Frontend build phases, token system, component architecture, zero-error build protocol  |
| `agents/ux-ui-researcher.md` | Step 0.5 (if user wants UX research)   | UX research document generation (optional for ecommerce)                                |     |
| `agents/conventions.md`      | Before writing ANY code                | Generic code conventions — React Native patterns, data fetching, NativeWind, TypeScript |

## Pipeline — New storefront (Mobile)

### Step 0 — Setup

Read [`agents/setup.md`](agents/setup.md). Collect all config fields, write `site.config.json` and `.env`, create the CMS with `tsx scripts/erxes-cms.ts`, save the returned `_id` into `site.config.json` and `.env` as `ERXES_CMS_ID`, then wait for confirmation.

**Ecommerce routing:** If `template_type` is `"ecommerce"`, stop this pipeline immediately after Step 0 setup collection and switch to [`agents/ecommerce/AGENTS.md`](agents/ecommerce/AGENTS.md). Do not continue the generic pipeline steps below.

### Step 0.5 — Business Analysis

Read [`agents/business-analyst.md`](agents/business-analyst.md). Generate or validate `output/<slug>/business-requirements.md` from `site.config.json`, optional user-provided BRD input, and a plain-chat interview. Do not proceed to UX research or design until the user confirms the BRD is acceptable.

### Step 0.75 — UX/UI Research

Read [`agents/ux-ui-researcher.md`](agents/ux-ui-researcher.md). Generate or validate `output/<slug>/ux-research.md` from `output/<slug>/business-requirements.md`, `site.config.json`, optional user-provided UX research, and a plain-chat interview. Do not proceed to Step 3.5 until the user confirms the UX research is acceptable.

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
- `has_feedback_tickets` = `enable_feedback_tickets` is true, OR the user has separately asked to "connect feedback to tickets" / "send feedback as a ticket" / "add feedback tickets"

**Section-to-screen rule:**

- The home screen should include the selected sections as landing sections
- Every selected section should also become a standalone screen/route unless purely decorative
- Use the same section names and slugs consistently across home screen composition, CMS pages, and bottom tab / drawer navigation

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

Run the scaffold script:

```bash
tsx scripts/clone.ts "<store-name>"
```

`clone.ts` internally runs `create-expo-app@latest output/<slug> --template default@sdk-55`
and creates the project in `output/<slug>/`. **If `output/<slug>/` already exists, `clone.ts` skips scaffolding and reuses it — do not run `create-expo-app` manually afterward.**

If `clone.ts` does not exist or fails, fall back to running manually:

```bash
npx create-expo-app@latest output/<slug> --template default@sdk-55
```

**CRITICAL:** Mobile ecommerce uses Expo, not Next.js.

Required packages to install after init:
...

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

**CRITICAL — never let two conflicting project structures coexist.**

This project uses the Expo Router `app/` directory as the single source of
truth for routing and screens. A generic `src/` directory (containing its
own routes, screens, or app-level structure) must NEVER exist alongside
`app/` in the same project. The only permitted `src/` subtree is
`src/messenger/` (and only when Messenger is connected, per
`connect-messenger.md`) — nothing else belongs under `src/`.

If `clone.ts` or any starter template produces a `src/` directory with
anything beyond `src/messenger/`, treat this as a structural conflict:
stop, inspect both trees, and either merge the needed content into `app/`
and delete the rest of `src/`, or ask the user which structure to keep.
Never leave both trees populated "just in case."

**CRITICAL — never copy agent/tooling files into the generated app.**

The following must NEVER appear inside `output/<slug>/`:

- `AGENTS.md`, `CLAUDE.md`, or any other agent-instruction file
- `.claude/` or any other agent-config directory
- `scripts/` (the `tsx scripts/*.ts` tooling used in Steps 2, 5, 7 lives at
  the project root — e.g. `mobile/scripts/` — and is invoked FROM there
  against `output/<slug>/`; it is never copied into the output app itself)

If `clone.ts` or any copy step pulls these in from the working directory,
delete them immediately after cloning, before any other Step 3 work.

**CRITICAL — verify no duplicated/nested output path.**

After `tsx scripts/clone.ts "<store-name>"`, confirm the project lives at
exactly `output/<slug>/` — not `output/<slug>/<slug>/`. If clone.ts (or
`create-expo-app`) creates a nested duplicate folder with the same name,
flatten it immediately: move the inner folder's contents up one level and
delete the empty wrapper, before proceeding to Step 3.5.

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

Apply it like this:

- Ask the `design_strategy` explicitly for every `ui_source` before proceeding
- If `design_strategy` is `copy-site` or `improve-site`, use `reference_url` from config when present
- If `design_strategy` is `beat-competitors`, use `competitor_urls` from config when present
- Then read [`agents/pencil-design.md`](agents/pencil-design.md) and use that strategy to control whether the design should be faithful, improved, brand-led, or differentiated

---

**`words`** — user described the look in text:
Read [`agents/pencil-design.md`](agents/pencil-design.md). Use `ui_source_ref` as the creative brief. Produce the full design package:

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
- Follow with a free-form request for page-specific edits in the user's own words. Do not present preset edit options. The user should answer with the page they want to change and what should change, such as color, section order, spacing, or component treatment.
- Do not require the agent to separately present or re-show the design if the user can review it directly in Pencil
- Apply requested design edits in the same Pencil project, re-export the updated design artifacts when needed, and ask the same free-form design edit question again
- Repeat this edit-review loop until the user explicitly says the design is approved or gives a direct build instruction such as `it's okay`, `looks good`, or `build frontend`
- Then continue

**`pencil`** — user has an existing `.pen` file
Read [`agents/pencil-design.md`](agents/pencil-design.md). Open the file at the path in `ui_source_ref` using the Pencil MCP tools. Use it as the base homepage direction, create full-homepage options in Pencil first, export preview images, show the user the choices, then after approval expand the chosen direction into the full design package listed above.

**`figma`** — user provided a Figma link or exported assets
Read [`agents/pencil-design.md`](agents/pencil-design.md). Use the Figma URL or image paths in `ui_source_ref` as visual reference. Reconstruct full-homepage direction previews in Pencil first, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

**`screenshot`** — user uploaded screenshots
Read [`agents/pencil-design.md`](agents/pencil-design.md). Read the image files listed in `ui_source_ref`. Extract layout, sections, colors, and component patterns, rebuild full-homepage direction previews in Pencil first, export preview images, get a user choice, then expand the selected direction into the full design package listed above.

---

**If `required_sections` is empty or `"design"` in `site.config.json`:**
After analyzing the UI source above, identify which sections are present in the design layout. Map them to valid section names (`about`, `services`, `blog`, `contact`, `gallery`, `pricing`, `team`, `testimonials`, `faq`, `menu`, `portfolio`). Write the detected sections back into `site.config.json` as `required_sections` before continuing to Step 4. Show the detected list to the user and ask for confirmation.

Section-to-page rule:

- The homepage should include the selected sections as landing sections
- Every selected section should also become a standalone page/route unless the section is purely decorative
- Use the same section names and slugs consistently across homepage composition, CMS pages, and navigation

**If `ui_source` is `pencil`, `figma`, or `screenshot`**
Extract the dominant primary color from the design and write it back into `site.config.json` as `color_hint` (e.g. `"forest-green"`, `"navy"`, `"warm-orange"`). Do not ask the user for it.

After handling the UI source, lock motion level (0–5) and present 3 visual directions from this table before any full design or frontend work. Do not skip this step unless the user already provided both the motion level and the exact chosen direction in the same request.

| Direction        | Concept                           | Extra libraries               |
| ---------------- | --------------------------------- | ----------------------------- |
| Glass Future     | Dark surfaces, translucent panels | framer-motion, Lenis          |
| Neon Brutalist   | Raw grid, high-contrast, neon     | framer-motion, react-scramble |
| Editorial Luxury | Magazine hierarchy, whitespace    | framer-motion, Lenis          |
| Morphic Soft     | Soft gradients, rounded, 3D feel  | framer-motion                 |
| Data Precision   | Info density, monospace accents   | framer-motion                 |
| Organic Texture  | Noise textures, natural palette   | framer-motion, Lenis          |
| Mongolian Modern | Ulzii motifs, Cyrillic-first      | framer-motion                 |
| Midnight Cinema  | Full dark, film-poster, immersive | framer-motion, Lenis, GSAP    |
| Swiss Grid       | Strict grid, typography as hero   | minimal                       |
| Aurora Gradient  | Iridescent gradients, mesh bg     | framer-motion, Lenis          |

### Step 4 — Generate code

Read [`agents/frontend.md`](agents/frontend.md) and [`agents/generate.md`](agents/generate.md). Use `design-tokens.json`, `ui-libraries.json`, and `HANDOFF.md` from Step 3.5. Write all files into `output/<slug>/`.

Before Step 4 starts, verify all of these:

- homepage preview artifacts exist and are real Pencil exports
- each preview represents the full homepage section flow, not a partial hero or cropped concept
- the user already selected one homepage option
- `design.pen` and `design.png` were exported from the approved Pencil design
- `HANDOFF.md` records the approved homepage option and preview files
- the full designed pages were available for user review in the approved Pencil file after expansion from the chosen homepage option
- the user was asked `do you wanna edit design before build frontend?`
- any requested page-level design changes were applied and the final design was explicitly approved
- `source-audit.json` exists when the source was a website being copied or improved
- the Pencil file path used during design matches the approved site path and no unrelated `.pen` project was modified

### Step 4.5 — Connect Messenger (optional, live chat)

**Skip this step if `has_messenger` is false.**

Run this step only after the Expo frontend project exists in `output/<slug>/` (i.e., after Step 4). Trigger it whenever the user says any of:

- "connect messenger to mobile app"
- "connect erxes messenger"
- "add live chat to expo app"
- "set up erxes messenger"
- "add messenger SDK"

Read [`agents/connect-messenger.md`](connect-messenger.md) in full and run its pipeline without waiting for step-by-step instructions:

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

### Step 4.7 — Connect Feedback Tickets (optional, erxes Client Portal)

**Skip this step if `has_feedback_tickets` is false.**

Run this step only after the Expo frontend project exists in `output/<slug>/` (i.e., after Step 4). Trigger it whenever the user says any of:

- "connect feedback to tickets"
- "send feedback as a ticket"
- "add feedback tickets"
- "in-app feedback to erxes ticket"

Read [`agents/ecommerce/connect-erxes-tickets.md`](connect-erxes-tickets.md) in full and follow its pipeline exactly, substituting the project's own values for every placeholder:

| Placeholder                             | Fill from                                            |
| --------------------------------------- | ---------------------------------------------------- |
| `EXPO_PUBLIC_ERXES_TICKETS_CHANNEL_ID`  | collected in Step 0 as `tickets_channel_id`          |
| `EXPO_PUBLIC_ERXES_TICKETS_PIPELINE_ID` | collected in Step 0 as `tickets_pipeline_id`         |
| `EXPO_PUBLIC_ERXES_TICKETS_STATUS_ID`   | collected in Step 0 as `tickets_status_id`           |
| `EXPO_PUBLIC_ERXES_TICKETS_STAGE_ID`    | collected in Step 0 as `tickets_stage_id` (optional) |

1. **Env vars** — add the four `EXPO_PUBLIC_ERXES_TICKETS_*` values to `.env.local`, per `connect-erxes-tickets.md` §3. Reuse the existing `EXPO_PUBLIC_ERXES_API_URL` and `EXPO_PUBLIC_ERXES_APP_TOKEN` from the CMS connection — do not duplicate them.
2. **Auth gating** — confirm the feedback flow reuses the project's existing auth/session hook and blocks submission entirely when no `CPUser` session is present, per `connect-erxes-tickets.md` §2. Never add an anonymous submission path.
3. **Generate the committed application files** exactly as specified in `connect-erxes-tickets.md` → "Files Modified":
   - `lib/graphql/mutations/tickets.ts` — **new**, `CP_CREATE_TICKET` mutation
   - `src/lib/feedbackTicket.ts` — **new**, `submitFeedbackAsTicket()` — best-effort, non-blocking, matching the `registerFcmToken` pattern from `notification.md`
   - `app/feedback.tsx` — **new**, feedback form gated on auth session
4. Apply the key behavioral rules from `connect-erxes-tickets.md` §7, in particular:
   - Use `cpCreateTicket` exactly as specified — do not substitute a different mutation name or add a nonexistent `customerId`/`cpUserId` argument
   - `channelId`, `pipelineId`, `statusId` are non-nullable — if any are missing from config, stop and ask the user rather than guessing
   - Never log tokens, ticket IDs tied to PII, or full request payloads
5. Verify against `connect-erxes-tickets.md` §6 (Verification) before moving on:
   - Submitting while logged out blocks the mutation entirely
   - Submitting while logged in creates a ticket visible in erxes Admin under the correct channel/pipeline, attributed to the submitting CPUser
   - `npx expo export` completes with zero errors

### Step 5 — Seed CMS content

Read [`agents/connect-erxes.md`](agents/connect-erxes.md) after the frontend project exists in `output/<slug>/`.

Use it in combined mode with this pipeline:

- fingerprint the generated site before mutations or code edits
- reuse `site.config.json`, `HANDOFF.md`, `design-tokens.json`, and `ui-libraries.json`
- reuse `ERXES_CMS_ID` from Step 0 when it already exists, and only create a CMS if it is missing
- merge Apollo, GraphQL, route, and navigation changes into the generated Next.js project without overwriting unrelated frontend code
- install Apollo and GraphQL dependencies required for erxes integration
- generate or update the frontend GraphQL layer, dynamic CMS routes, and shared navigation components
- keep all `getClient().query()` calls on `revalidate`
- run `pnpm build` in `output/<slug>/` before deployment

### Step 6 — Verify

Seed content for **every language** in `languages` from `site.config.json`. Generate real translated content — not placeholders — for each locale.

Use the approved design handoff and CMS field map from `HANDOFF.md` plus the content-model decisions from [`agents/connect-erxes.md`](agents/connect-erxes.md) to shape page, post, menu, category, tag, and optional custom-type content while keeping mutation dependency order intact.

CMS page model:

- Seed content so homepage sections can be rendered on `/`
- Also create dedicated CMS pages for each selected section slug such as `/about`, `/services`, `/contact`
- Keep the homepage summary content and standalone page content aligned in tone and structure

Mutation order (always follow this):

```
cpContentCreateCMS or reuse existing CMS_ID → cpCmsCustomPostTypesAdd when needed → cpCmsCustomFieldGroupsAdd when needed → cpCmsCategoriesAdd → cpCmsTagsAdd → cpCmsPagesAdd → cpCmsPostsAdd → cpCmsAddTranslation when needed → cpCmsAddMenu
```

Generate a single content file per type with all languages included using the `translations` field. Run each script **once** — the mutation creates all language versions in a single call.

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

**If `has_feedback_tickets` is true**, additionally confirm the checklist from `connect-erxes-tickets.md` §6 before considering Step 6 complete:

- Submitting feedback while logged out does not fire the `cpCreateTicket` mutation
- Submitting feedback while logged in creates a ticket visible in erxes Admin under the correct channel/pipeline, attributed to the submitting CPUser
- No auth token or user PII is printed in client-side logs
- `npx expo export` completes with zero errors

**Content file format** — primary language is the first in `languages`, all others go in `translations`:

```json
// pages.json
[
  {
    "section": "about",
    "name": "Бидний тухай",
    "slug": "about",
    "description": "...",
    "content": "...",
    "translations": [
      { "language": "en", "title": "About Us", "content": "..." }
    ]
  }
]

// posts.json
[
  {
    "title": "Монгол гарчиг",
    "slug": "post-slug",
    "excerpt": "...",
    "content": "...",
    "translations": [
      { "language": "en", "title": "English Title", "excerpt": "...", "content": "..." }
    ]
  }
]

// menu.json — `kind` is required on every item
[
  { "label": "Нүүр", "url": "/", "order": 1, "kind": "header",
    "translations": [{ "language": "en", "title": "Home" }] },
  { "label": "Бидний тухай", "url": "/about", "order": 2, "kind": "header",
    "translations": [{ "language": "en", "title": "About" }] },
  { "label": "Нүүр", "url": "/", "order": 1, "kind": "footer",
    "translations": [{ "language": "en", "title": "Home" }] }
]
```

**Content rules:**

- Primary content (`name`/`title`/`content`) — write in the default language (first in `languages`)
- `translations` array — one entry per additional language with translated text
- Slugs: **identical across all languages** — `about` stays `about` so `/mn/about` and `/en/about` map to the same page
- Menu items **must include `"kind"`** — `"header"` or `"footer"`. Items without `kind` won't appear in navigation queries.
- `erxes-cms.ts` runs once only — the CMS itself is shared across all languages

## Verify CMS data

Run the verify query from [`agents/connect-erxes.md`](agents/connect-erxes.md) for each language in `languages`. All must pass before deploying. Also require `pnpm build` in `output/<slug>/` to pass.

```graphql
query Verify($language: String) {
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

Pass per language: pages exist, posts exist (if `has_blog`), header has ≥ 2 items, footer has ≥ 1 item.

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
   - "connect messenger" / "add live chat" → jump directly to Step 4.5 and `agents/connect-messenger.md`
   - "add push notifications" / "set up FCM" → jump directly to Step 4.6 and `agents/ecommerce/notification.md`
   - "connect feedback to tickets" / "add feedback tickets" → jump directly to Step 4.7 and `agents/ecommerce/connect-erxes-tickets.md`
     rather than re-running the full pipeline
4. Redeploy: `eas build --platform all`
