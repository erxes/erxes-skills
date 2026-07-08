# Firebase Push Notification Setup

End-to-end documentation of a Firebase Cloud Messaging (FCM) implementation in a
React Native / Expo app and its integration with an Erxes-style client-portal
backend. This guide is **project-agnostic** — replace the placeholders below with
your own values.

---

## Required Values To Fill

Before following this guide, fill in:

- App name: `<APP_NAME>` — _Example: `Acme`_
- iOS bundle identifier: `<IOS_BUNDLE_ID>` — _Example: `com.company.app`_
- Android package name: `<ANDROID_PACKAGE_NAME>` — _Example: `com.company.app`_
- Firebase project ID: `<FIREBASE_PROJECT_ID>` — _Example: `acme-12ab3`_
- iOS target name: `<IOS_TARGET_NAME>` — _Example: `Acme` (the Xcode target / `ios/<IOS_TARGET_NAME>/` folder)_
- Backend GraphQL endpoint: `<BACKEND_GRAPHQL_URL>` — _Example: `https://api.company.com/graphql`_

> Throughout this document, any `<PLACEHOLDER>` should be replaced with the values
> above. Lines prefixed with `Example:` are illustrative only.

---

## Overview

The notification system spans three layers:

```
┌──────────────────────────┐     registerFcmToken      ┌────────────────────────────┐
│  React Native app (Expo)  │ ─────(GraphQL mutation)──► │   Backend (core-api)       │
│                           │   clientPortalUserAddFcm…  │                            │
│ • @react-native-firebase  │                            │ • CPUser.fcmTokens[]       │
│ • permission + token      │ ◄──── clientPortal ─────── │ • CPNotifications (saved)  │
│ • foreground/bg/open      │      Notifications query   │ • firebaseService → FCM    │
└───────────┬───────────────┘                            └─────────────┬──────────────┘
            │                                                           │
            │              Firebase Cloud Messaging (FCM)               │
            └──────────────◄ APNs (iOS) / FCM (Android) ◄───────────────┘
```

- **React Native app** — requests notification permission, obtains the FCM
  token, registers it with the backend, and handles incoming messages in every
  app state (foreground, background, terminated).
- **Firebase Cloud Messaging** — delivers pushes to the device (via APNs on iOS).
- **Backend token registration** — `clientPortalUserAddFcmToken` stores the
  device token on the authenticated user (`CPUser`).
- **Client Portal notifications** — when the backend sends a notification it both
  **persists** a notification record (shown in the app's notification screen)
  **and** pushes it to the user's registered devices.
- **iOS and Android** — both platforms are configured through `app.json` + Expo
  config plugins (the Expo _prebuild_ workflow).

| Value            | Placeholder              |
| ---------------- | ------------------------ |
| Firebase project | `<FIREBASE_PROJECT_ID>`  |
| iOS bundle id    | `<IOS_BUNDLE_ID>`        |
| Android package  | `<ANDROID_PACKAGE_NAME>` |
| iOS Xcode target | `<IOS_TARGET_NAME>`      |

> **Source of truth:** `/ios` and `/android` are _generated_ directories (typically
> listed in `.gitignore`). All native configuration is declared in `app.json` and
> applied by config plugins during `npx expo prebuild`. Do not hand-edit native
> files as the canonical config — edit `app.json` and re-run prebuild.

---

## Firebase Configuration

Download the two Firebase config files from the Firebase Console for project
`<FIREBASE_PROJECT_ID>` and commit them at the **repo root** so prebuild is
reproducible; they are also copied into the native projects:

| File    | Committed source of truth    | Native location                                  |
| ------- | ---------------------------- | ------------------------------------------------ |
| iOS     | `./GoogleService-Info.plist` | `ios/<IOS_TARGET_NAME>/GoogleService-Info.plist` |
| Android | `./google-services.json`     | `android/app/google-services.json`               |

`app.json` references the root copies:

```json
{
  "expo": {
    "name": "<APP_NAME>",
    "ios": {
      "bundleIdentifier": "<IOS_BUNDLE_ID>",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "<ANDROID_PACKAGE_NAME>",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### iOS

- **`GoogleService-Info.plist`** placed at
  `ios/<IOS_TARGET_NAME>/GoogleService-Info.plist` and referenced from `app.json`
  (`ios.googleServicesFile`). The plist's `BUNDLE_ID` must equal `<IOS_BUNDLE_ID>`.
- **Added to the Xcode target** — the `@react-native-firebase/app` config plugin
  adds the plist as a build resource of the `<IOS_TARGET_NAME>` target during
  prebuild (verifiable in `ios/<IOS_TARGET_NAME>.xcodeproj/project.pbxproj`).
- **Firebase initialization** — `ios/<IOS_TARGET_NAME>/AppDelegate.swift`:
  ```swift
  import FirebaseCore
  // ...
  // @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions
  FirebaseApp.configure()
  // @generated end
  ```
  injected before `factory.startReactNative(...)`.
- **Push Notifications capability** — `ios/<IOS_TARGET_NAME>/<IOS_TARGET_NAME>.entitlements`:
  ```xml
  <key>aps-environment</key>
  <string>production</string>
  ```
  declared via `ios.entitlements` in `app.json`. _(Use `development` for debug
  builds against the APNs sandbox if needed.)_
- **Background Modes → Remote notifications** — `ios/<IOS_TARGET_NAME>/Info.plist`:
  ```xml
  <key>UIBackgroundModes</key>
  <array><string>remote-notification</string></array>
  ```
  declared via `ios.infoPlist.UIBackgroundModes` in `app.json`.
- **APNs configuration** — React Native Firebase keeps APNs method swizzling
  enabled, so the APNs token is forwarded to FCM automatically (no manual
  `didRegisterForRemoteNotifications` code). As a safeguard, `getFcmToken()`
  calls `messaging().registerDeviceForRemoteMessages()` on iOS before requesting
  the token.
- **Static frameworks** — `ios/Podfile.properties.json` sets
  `"ios.useFrameworks": "static"` (required by the Firebase iOS SDK), declared via
  the `expo-build-properties` plugin.
- **Required Info.plist settings** — `UIBackgroundModes` (above), plus any
  existing app keys (encryption flag, permission usage strings) are preserved by
  prebuild.

### Android

- **`google-services.json`** — download for package `<ANDROID_PACKAGE_NAME>`,
  rename to `google-services.json` (if your download is suffixed, e.g.
  `google-services (1).json`), and place it at **`android/app/google-services.json`**
  (plus committed at `./google-services.json`).
- **Gradle — project level** (`android/build.gradle`):
  ```groovy
  classpath 'com.google.gms:google-services:4.4.1'   // Example version
  ```
- **Google Services plugin — app level** (`android/app/build.gradle`):
  ```groovy
  apply plugin: 'com.google.gms.google-services'
  ```
- **Application id** (`android/app/build.gradle`):
  ```groovy
  applicationId '<ANDROID_PACKAGE_NAME>'   // must match google-services.json package_name
  ```
  > If the generated `applicationId` is stale and does **not** match the
  > `package_name` in `google-services.json`, the build fails with _"No matching
  > client found for package name"_. Set `android.package` in `app.json` to
  > `<ANDROID_PACKAGE_NAME>` and re-run prebuild so they align.
- **Firebase Messaging** — the messaging service and the `firebase-messaging`
  dependency are pulled in automatically by autolinking of
  `@react-native-firebase/messaging`; no manual `implementation` line needed.
- **AndroidManifest** (`android/app/src/main/AndroidManifest.xml`):
  ```xml
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  ```
- **Android 13+ `POST_NOTIFICATIONS`** — declared via `android.permissions` in
  `app.json`; the runtime prompt is requested from JS (see _Notification
  Permission Flow_). On Android 12 and below no runtime prompt is shown.

---

## Installed Dependencies

| Package                            | Version (example) | Why it is required                                                                                                               |
| ---------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `@react-native-firebase/app`       | `^24.x`           | Core Firebase SDK + config plugin (injects `FirebaseApp.configure()`, wires `GoogleService-Info.plist` / `google-services.json`) |
| `@react-native-firebase/messaging` | `^24.x`           | FCM APIs: permission, token, `onMessage`, `onTokenRefresh`, background handler, notification-open events                         |
| `expo-build-properties`            | `~1.x`            | Sets iOS `useFrameworks: "static"`, required by the Firebase iOS SDK pods                                                        |

Installation (Expo-aligned versions for your SDK, also auto-adds the config plugins):

```bash
npx expo install @react-native-firebase/app @react-native-firebase/messaging expo-build-properties
```

`app.json` `plugins` after install:

```jsonc
"@react-native-firebase/app",
"@react-native-firebase/messaging",
["expo-build-properties", { "ios": { "useFrameworks": "static" } }]
```

---

## Notification Permission Flow

Implemented in `src/lib/push.ts` (`ensureNotificationPermission`, `getFcmToken`)
and orchestrated by `src/hooks/usePushNotifications.ts`, which is mounted once in
the root layout (`app/_layout.tsx`) and gated on the auth session token.

### First Login

1. **Permission check** — `messaging().hasPermission()` reports current status.
2. **Permission request** — if not already authorized, `messaging().requestPermission()`
   shows the system prompt (iOS) / `POST_NOTIFICATIONS` prompt (Android 13+).
3. **FCM token generation** — `getFcmToken()` (on iOS, first
   `registerDeviceForRemoteMessages()`, then `getToken()`).
4. **Backend registration** — `registerFcmToken(token)` calls the
   `clientPortalUserAddFcmToken` mutation.

The flow is wrapped in `try/catch`: a denied permission or failure **never blocks
login** and never crashes the app.

### Existing Logged-In Users

**Why login-only is insufficient:** users who signed in _before_ push support
shipped never fired a "login" event, so they would have no registered token and
never receive pushes.

**Startup / session-restore flow** — the registration effect in
`usePushNotifications` is keyed purely on the auth `token` from the auth provider.
Because the token is restored from secure storage on launch, the effect runs on
**app startup** for already-authenticated users with the exact same steps:

- Check the authenticated session (token present).
- Request notification permission if needed.
- Get the current FCM token.
- Register it automatically via `registerFcmToken(token)`.

This means **existing users do not need to log out and log back in** — opening the
app is enough to register their token.

---

## FCM Token Registration

`registerFcmToken(token)` — `src/lib/push.ts`:

```ts
export async function registerFcmToken(token: string): Promise<void> {
  const platform = Platform.OS;
  if (platform !== "ios" && platform !== "android") return;
  try {
    const deviceId = await getOrCreateDeviceId();
    await apolloClient.mutate({
      mutation: CP_USER_ADD_FCM_TOKEN,
      variables: { deviceId, token, platform },
    });
  } catch (e) {
    console.warn("[push] failed to register FCM token:", e); // never logs the token
  }
}
```

Arguments:

- **`deviceId`** — a stable, per-install UUID generated once and persisted by
  `getOrCreateDeviceId()` (`src/utils/deviceId.ts`) under the `deviceId` storage
  key (`src/constants/config.ts`). It lets the backend keep **one token per
  device** and deduplicate on repeat calls.
- **`token`** — the current FCM registration token from `messaging().getToken()`.
- **`platform`** — `Platform.OS` (`'ios'` or `'android'`), matching the backend
  `FcmPlatform` enum (`ios | android | web`).

GraphQL mutation — `src/graphql/notificationsQL.ts` (sent to `<BACKEND_GRAPHQL_URL>`):

```graphql
mutation ClientPortalUserAddFcmToken(
  $deviceId: String!
  $token: String!
  $platform: FcmPlatform!
) {
  clientPortalUserAddFcmToken(
    deviceId: $deviceId
    token: $token
    platform: $platform
  ) {
    _id
  }
}
```

**How registration works (backend):** the resolver upserts the
`{ deviceId, token, platform }` entry into `CPUser.fcmTokens` — replacing the
existing entry for that `deviceId` or appending a new one. Because the app always
sends the same persisted `deviceId`, repeated calls are safe and never create
duplicates. The resolver also detaches the same token from any _other_ user
(account-switch on a shared device) so pushes are not mis-delivered.

---

## Token Refresh Handling

`src/hooks/usePushNotifications.ts`:

```ts
const unsubscribeRefresh = messaging().onTokenRefresh((token) => {
  void register(token); // re-registers via registerFcmToken
});
```

- **Why refresh occurs** — FCM rotates the token on app reinstall, data clear,
  restore to a new device, or periodically for security. The old token stops
  delivering.
- **Automatic re-registration** — `onTokenRefresh` re-invokes the same
  `registerFcmToken` path, keeping the backend record current with no user
  action. A `useRef` guard skips redundant mutations when the token is unchanged.

---

## Notification Event Handling

All listeners live in `src/hooks/usePushNotifications.ts`, except the background
handler which is registered at module scope in `src/lib/push.ts`.

### Foreground Notifications

`messaging().onMessage(...)` — iOS/Android do not display notifications while the
app is foregrounded, so the handler surfaces an in-app toast
(`notify.info(title, body)`).

### Background Notifications

Delivered by the OS while the app is backgrounded. `notification`-payload messages
are rendered automatically by the system tray. Data-only messages invoke the
module-scope `messaging().setBackgroundMessageHandler(...)` in `src/lib/push.ts`.

### Terminated Notifications

The same module-scope background handler (registered before the React tree mounts,
via the import in `app/_layout.tsx`) lets the OS spin up a headless JS task to
acknowledge data messages while the app is killed. Notification-payload messages
are shown by the OS tray.

### Notification Open Events

`messaging().onNotificationOpenedApp(...)` — fires when the user taps a
notification that brought the app from background to foreground; navigates via
`router.push(resolveRoute(message))`.

### Initial Notification Handling

`messaging().getInitialNotification()` — when the app is launched from a fully
**terminated** state by tapping a notification, the pending message is read on
mount and the app navigates to the target route.

`resolveRoute()` reads `data.route ?? data.url` and falls back to `/notification`
(the in-app notification screen) when no explicit route is present.

---

## Backend Integration

The client-portal backend supports the full flow; the app plugs into it as
follows.

- **FCM token registration** — `clientPortalUserAddFcmToken` (resolver in
  `core-api/src/modules/clientportal/graphql/resolvers/mutations/cpUser/user.ts`)
  stores tokens on `CPUser.fcmTokens` (schema fields: `deviceId`, `token`,
  `platform` enum `ios|android|web`).
- **Client Portal notification flow** — when a notification is sent
  (`clientPortalSendNotification` mutation or the `cpNotifications.create` tRPC
  route), `notificationService.sendNotification(Bulk)`:
  1. `createNotification(...)` persists a notification document keyed by
     `cpUserId` → visible in the app via the `clientPortalNotifications` query.
  2. `sendFirebaseNotification(...)` reads `cpUser.fcmTokens` and pushes through
     `firebaseService` (FCM multicast), provided the client portal has
     `firebaseConfig.enabled` and a `serviceAccountKey`.
- **Expected backend behavior** — a single send both **saves** the in-app
  notification **and** delivers a push to every registered device; invalid tokens
  returned by FCM are pulled from the user automatically.

> Optional backend hardening that complements this flow (additive, behavior-preserving):
> cross-user token detach in `clientPortalUserAddFcmToken`, and non-sensitive
> error logging in `sendFirebaseNotification` (logs token _count_ only, never
> tokens). See _Files Modified → Backend_.

---

## Verification Checklist

- [ ] **Firebase initialization** — app launches with no `No Firebase App '[DEFAULT]'` crash.
- [ ] **Permission prompts** — system prompt appears on first run after login (iOS + Android 13+).
- [ ] **FCM token generation** — `messaging().getToken()` resolves a token.
- [ ] **Backend registration** — `clientPortalUserAddFcmToken` runs with `{ deviceId, token, platform }`.
- [ ] **Push delivery** — a test push from the Firebase Console reaches the device.
- [ ] **Foreground notifications** — in-app toast shows while app is open.
- [ ] **Background notifications** — system tray notification appears while backgrounded.
- [ ] **Terminated notifications** — notification appears when app is killed; tap launches app and routes correctly.
- [ ] **Token refresh** — clearing app data / reinstall re-registers automatically.
- [ ] **Android 13 permission handling** — `POST_NOTIFICATIONS` prompt shows on 13+; denying it suppresses notifications without crashing; no prompt on Android ≤12.

---

## Troubleshooting

### No Firebase App '[DEFAULT]'

Firebase was not initialized. Confirm `FirebaseApp.configure()` is present in
`ios/<IOS_TARGET_NAME>/AppDelegate.swift` and the `@react-native-firebase/app`
plugin is in `app.json`. Re-run `npx expo prebuild` and rebuild.

### Missing GoogleService-Info.plist

Ensure `./GoogleService-Info.plist` exists at the repo root and `app.json` has
`ios.googleServicesFile`. Re-run `npx expo prebuild --platform ios` and
`npx pod-install`; verify the file is referenced in
`ios/<IOS_TARGET_NAME>.xcodeproj/project.pbxproj`.

### Missing google-services.json

Ensure `./google-services.json` exists at the repo root and `app.json` has
`android.googleServicesFile`. A _"No matching client found for package name"_
build error means `applicationId` (`android/app/build.gradle`) does not match the
`package_name` in `google-services.json` — both must be `<ANDROID_PACKAGE_NAME>`.
Re-run `npx expo prebuild --platform android`.

### Permission Not Showing

On Android 13+, confirm `POST_NOTIFICATIONS` is in the manifest and
`ensureNotificationPermission()` runs. If previously denied, the OS will not
re-prompt — enable it in system Settings. On Android ≤12 no prompt is expected.

### Token Not Generated

Verify notification permission is granted, the device has network, and (iOS) a
real device is used. On iOS, `registerDeviceForRemoteMessages()` must succeed
first — check that the APNs key is uploaded in the Firebase Console.

### Notification Not Received

Confirm the token was registered on the backend (`CPUser.fcmTokens`), the client
portal has `firebaseConfig.enabled` + `serviceAccountKey`, and check the backend
`[cp][push] firebase send failed …` log. Verify the device token is not stale
(reinstall to force `onTokenRefresh`).

### APNs Configuration Issues

iOS push requires: Push Notifications capability on `<IOS_BUNDLE_ID>` in the Apple
Developer portal, an APNs auth key (`.p8`) uploaded to Firebase Console → Cloud
Messaging for project `<FIREBASE_PROJECT_ID>`, a real device (not the Simulator),
and a provisioning profile that includes the push entitlement.

---

## Files Modified

### iOS _(generated by `expo prebuild` from `app.json` — usually not committed)_

- `ios/<IOS_TARGET_NAME>/GoogleService-Info.plist` — Firebase config, added to Xcode target
- `ios/<IOS_TARGET_NAME>/AppDelegate.swift` — `import FirebaseCore` + `FirebaseApp.configure()`
- `ios/<IOS_TARGET_NAME>/Info.plist` — `UIBackgroundModes: [remote-notification]`
- `ios/<IOS_TARGET_NAME>/<IOS_TARGET_NAME>.entitlements` — `aps-environment`
- `ios/Podfile.properties.json` — `ios.useFrameworks: "static"`

### Android _(generated by `expo prebuild` from `app.json` — usually not committed)_

- `android/app/google-services.json` — Firebase config (renamed)
- `android/build.gradle` — `classpath 'com.google.gms:google-services:<version>'`
- `android/app/build.gradle` — `apply plugin: 'com.google.gms.google-services'`; `applicationId '<ANDROID_PACKAGE_NAME>'`
- `android/app/src/main/AndroidManifest.xml` — `POST_NOTIFICATIONS` permission

### React Native Application _(committed)_

- `app.json` — `googleServicesFile` (both), iOS entitlements + background modes, Android permissions, Firebase/build-properties plugins
- `GoogleService-Info.plist`, `google-services.json` — committed config (repo root)
- `package.json` / `package-lock.json` — Firebase + build-properties dependencies
- `src/constants/config.ts` — added `deviceId` storage key
- `src/utils/deviceId.ts` — **new**, `getOrCreateDeviceId()`
- `src/graphql/notificationsQL.ts` — **new**, `clientPortalUserAddFcmToken` mutation
- `src/lib/push.ts` — **new**, background handler, `ensureNotificationPermission()`, `getFcmToken()`, `registerFcmToken()`
- `src/hooks/usePushNotifications.ts` — **new**, listeners + permission/token registration + refresh
- `app/_layout.tsx` — mounts `usePushNotifications(token)` in the root layout
- `ios/FIREBASE_SETUP.md`, `android/FIREBASE_SETUP.md` — per-platform native docs

### Backend _(client-portal core-api)_

- `core-api/src/modules/clientportal/graphql/resolvers/mutations/cpUser/user.ts` — cross-user token detach in `clientPortalUserAddFcmToken`
- `core-api/src/modules/clientportal/services/notification/notificationService.ts` — non-sensitive error log in `sendFirebaseNotification`

---

## Final Result

- **Existing users** automatically register their FCM token on **app startup**
  (session restore) — no logout/login cycle required.
- **New users** register their token **after login**.
- **Token refresh** updates the backend record automatically via `onTokenRefresh`.
- **Client Portal notifications behavior is unchanged** — the same send call still
  persists the notification and now also pushes it.
- Notifications **appear inside the app** (notification screen) and arrive as
  **push notifications on both iOS and Android** in foreground, background, and
  terminated states.
- Registration is **best-effort and non-blocking**: permission denial or network
  failure never blocks startup/login, and no FCM tokens or Firebase config values
  are logged.
