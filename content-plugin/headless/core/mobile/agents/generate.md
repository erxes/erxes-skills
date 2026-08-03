# Section C — Step 1 (Generate Code) — Mobile (Expo)

Write all files directly into `output/<slug>/`.

## Starter inventory — read before writing anything

The cloned Expo starter already contains these. **Import from them — do not recreate.**

| Already exists                 | Import / usage                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Apollo client + provider       | `@/lib/apollo/client`, `@/lib/apollo/provider`                                                    |
| Auth context + hook            | `import { AuthProvider, useAuth } from "@/lib/auth/AuthContext"` — **only for `has_auth = true`** |
| Protected screen wrapper       | `import RequireAuth from "@/lib/auth/RequireAuth"` — **only for `has_auth = true`**               |
| Payment hook                   | `import { useInvoice } from "@/lib/hooks/useInvoice"` — **only for `has_auth = true`**            |
| Image component                | `import { Image } from "expo-image"` — **always use this, never `<img>` or `next/image`**         |
| Loader / EmptyState            | `@/components/common/Loader`, `@/components/common/EmptyState`                                    |
| All GraphQL operations + types | `@/graphql/auth/*`, `@/graphql/cms/*`, `@/graphql/ecommerce/*`                                    |
| i18n config                    | `@/i18n/config` — only update `locales` + `defaultLocale`, never rewrite                          |
| Root layout                    | `app/_layout.tsx` — update it, do not replace it                                                  |

For `has_auth = true` only: add `<AuthProvider>` inside `<ApolloProvider>` in `_layout.tsx`.
**Do not add `AuthProvider` for `business` sites.**

---

## 4a. Mock data layer (`lib/mock/`)

Build with placeholder data first so the app works without a live erxes connection.
The mock layer and the real GraphQL layer must have **identical export signatures**.

**`lib/mock/index.ts`** — never change these signatures:

```typescript
// Replaced by lib/graphql/index.ts after CMS is seeded
export { getPages, getPageBySlug } from "./pages";
export { getPosts, getPostBySlug, getFeaturedPost } from "./posts";
export { getCategories } from "./categories";
export { getHeaderMenu, getFooterMenu } from "./menus";
```

All mock content must be real text in the app's language — no lorem ipsum.

---

## 4b. Internationalisation (i18n)

Expo does not use `next-intl` or `app/[locale]/` routing.
Use **`i18n-js`** or **`expo-localization`** + a simple messages object instead.

### Install

```bash
npx expo install expo-localization
npm install i18n-js
```

### `lib/i18n/index.ts`

```typescript
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";
import en from "@/messages/en.json";
import mn from "@/messages/mn.json";

export const i18n = new I18n({ en, mn });
i18n.locale = getLocales()[0]?.languageCode ?? "mn";
i18n.enableFallback = true;
```

### `messages/<locale>.json` — one file per language

UI strings only (labels, buttons, nav text) — **not** CMS content.
Generate real translated text for the app's language and tone.

Example for `messages/mn.json`:

```json
{
  "nav": {
    "home": "Нүүр",
    "about": "Бидний тухай",
    "products": "Бараа",
    "contact": "Холбоо барих"
  },
  "hero": { "cta": "Эхлэх", "learnMore": "Дэлгэрэнгүй" },
  "contact": {
    "submit": "Илгээх",
    "namePlaceholder": "Таны нэр",
    "emailPlaceholder": "Имэйл хаяг"
  },
  "footer": { "rights": "Бүх эрх хамгаалагдсан" }
}
```

### Pass `locale` to all GraphQL queries

Every screen that calls `useQuery` must pass locale as the `language` variable:

```typescript
const locale = i18n.locale; // or from Jotai store / context
const { data } = useQuery(GET_POSTS, {
  variables: { language: locale },
});
```

### Language switcher (only if `languages.length > 1`)

```typescript
import { useAtom } from "jotai";
import { localeAtom } from "@/store/locale";
import { Pressable, Text, View } from "react-native";

const LABELS: Record<string, string> = { en: "EN", mn: "МН", zh: "中", ru: "РУ" };

export function LanguageSwitcher({ locales }: { locales: string[] }) {
  const [locale, setLocale] = useAtom(localeAtom);
  return (
    <View className="flex-row gap-2">
      {locales.map((l) => (
        <Pressable key={l} onPress={() => setLocale(l)} className="min-h-[44px] min-w-[44px] items-center justify-center">
          <Text className={l === locale ? "font-bold" : "opacity-60"}>
            {LABELS[l] ?? l.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

---

## 4c. Apollo Client files

**`lib/apollo/client.ts`** — singleton for all screens:

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

let client: ApolloClient<unknown> | null = null;

export function getApolloClient() {
  if (client) return client;
  client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.EXPO_PUBLIC_ERXES_ENDPOINT,
      headers: {
        "x-app-token": process.env.EXPO_PUBLIC_ERXES_APP_TOKEN ?? "",
      },
    }),
  });
  return client;
}
```

**`lib/apollo/provider.tsx`** — wrap the app:

```typescript
import { ApolloProvider } from "@apollo/client";
import { getApolloClient } from "./client";

export function ApolloClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={getApolloClient()}>
      {children}
    </ApolloProvider>
  );
}
```

> **No `registerApolloClient` or `@apollo/client-integration-nextjs`** — those are Next.js only.
> **No `getClient().query()` Server Components** — all data fetching is `useQuery` in screens.
> **No `revalidate` context** — Expo has no ISR/SSR.

---

## 4d. Root layout + navigation

**`app/_layout.tsx`** — update the existing file, do not create a new one:

```tsx
import "react-native-gesture-handler"; // MUST be first import
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApolloClientProvider } from "@/lib/apollo/provider";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // fonts from design-tokens.json
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApolloClientProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ApolloClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

**`app/(tabs)/_layout.tsx`** — bottom tab navigator:

```tsx
import { Tabs } from "expo-router";
import { TabBar } from "@/components/layout/TabBar";

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Нүүр" }} />
      <Tabs.Screen name="products/index" options={{ title: "Бараа" }} />
      <Tabs.Screen name="cart" options={{ title: "Сагс" }} />
      <Tabs.Screen name="profile/index" options={{ title: "Профайл" }} />
    </Tabs>
  );
}
```

---

## 4e. Screens

All screens live under `app/` using Expo Router file-based routing.
Every screen receives params via `useLocalSearchParams` — never function params.

### Screen type decision tree

| Section                               | Screen type                         | Route                                                           |
| ------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| `about`, `services`, `faq`, `pricing` | CMS content screen                  | `app/[slug].tsx`                                                |
| `contact`                             | Dedicated screen with form          | `app/contact.tsx`                                               |
| `blog`                                | Listing + detail                    | `app/blog/index.tsx`, `app/blog/[slug].tsx`                     |
| `products`                            | Listing + detail                    | `app/(tabs)/products/index.tsx`, `app/(tabs)/products/[id].tsx` |
| Home                                  | Compose selected section components | `app/(tabs)/index.tsx`                                          |

---

### Home screen `app/(tabs)/index.tsx`

```tsx
import { ScrollView } from "react-native";
import { useQuery } from "@apollo/client/react";
import { GET_PAGES } from "@/graphql/cms/queries/page";
import HeroSection from "@/components/sections/Hero";
import AboutSection from "@/components/sections/About";
import { i18n } from "@/lib/i18n";

export default function HomeScreen() {
  const { data } = useQuery(GET_PAGES, {
    variables: { language: i18n.locale },
  });
  const pages = data?.cpPages ?? [];
  const getPage = (slug: string) =>
    pages.find((p: { slug: string }) => p.slug === slug);

  return (
    <ScrollView>
      <HeroSection />
      <AboutSection page={getPage("about")} />
      {/* render each selected section */}
    </ScrollView>
  );
}
```

---

### CMS content screen `app/[slug].tsx`

```tsx
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@apollo/client/react";
import { ScrollView, Text, ActivityIndicator } from "react-native";
import RenderHtml from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { GET_PAGE_BY_SLUG } from "@/graphql/cms/queries/page";
import { i18n } from "@/lib/i18n";

export default function CmsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { data, loading } = useQuery(GET_PAGE_BY_SLUG, {
    variables: { slug, language: i18n.locale },
  });

  if (loading) return <ActivityIndicator />;
  const page = data?.cpPageDetail;
  if (!page) return <Text>Олдсонгүй</Text>;

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">{page.name}</Text>
      <RenderHtml contentWidth={width} source={{ html: page.content ?? "" }} />
    </ScrollView>
  );
}
```

> **`dangerouslySetInnerHTML` байхгүй** — CMS HTML-ийг `react-native-render-html` ашиглан рендер хийнэ.
>
> ```bash
> npx expo install react-native-render-html
> ```

---

### Contact screen `app/contact.tsx`

```tsx
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useState } from "react";
import { CP_FORMS_SUBMIT } from "@/graphql/cms/mutations/forms";
import { i18n } from "@/lib/i18n";

export default function ContactScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submit, { loading, error, data }] = useMutation(CP_FORMS_SUBMIT);

  async function handleSubmit() {
    await submit({ variables: { name, email, message } });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 p-4">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={i18n.t("contact.namePlaceholder")}
          className="border border-gray-300 rounded-lg p-3 mb-3 min-h-[44px]"
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={i18n.t("contact.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-gray-300 rounded-lg p-3 mb-3 min-h-[44px]"
        />
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-3 mb-4 min-h-[100px]"
        />
        {error && <Text className="text-red-500 mb-2">{error.message}</Text>}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="bg-primary rounded-lg p-4 items-center min-h-[44px]"
        >
          <Text className="text-white font-semibold">
            {i18n.t("contact.submit")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

---

### Blog listing `app/blog/index.tsx`

```tsx
import { FlatList, Text, Pressable, View } from "react-native";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "expo-router";
import { GET_POSTS } from "@/graphql/cms/queries/post";
import { i18n } from "@/lib/i18n";

export default function BlogScreen() {
  const router = useRouter();
  const { data, loading } = useQuery(GET_POSTS, {
    variables: { language: i18n.locale },
  });
  const posts = data?.cpPosts ?? [];

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/blog/${item.slug}`)}
          className="p-4 border-b border-gray-200 min-h-[44px]"
        >
          <Text className="text-lg font-semibold">{item.title}</Text>
          {item.excerpt && (
            <Text className="text-gray-500 mt-1">{item.excerpt}</Text>
          )}
        </Pressable>
      )}
    />
  );
}
```

### Blog detail `app/blog/[slug].tsx`

```tsx
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@apollo/client/react";
import { ScrollView, Text, ActivityIndicator } from "react-native";
import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";
import { GET_POST_BY_SLUG } from "@/graphql/cms/queries/post";
import { i18n } from "@/lib/i18n";

export default function PostDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { data, loading } = useQuery(GET_POST_BY_SLUG, {
    variables: { slug, language: i18n.locale },
  });

  if (loading) return <ActivityIndicator />;
  const post = data?.cpPostDetail;
  if (!post) return <Text>Олдсонгүй</Text>;

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">{post.title}</Text>
      <RenderHtml contentWidth={width} source={{ html: post.content ?? "" }} />
    </ScrollView>
  );
}
```

---

## 4f. SEO & Metadata

React Native app-д web SEO байхгүй. Оронд нь:

- **App Store metadata** → `app.config.ts` дотор `expo.name`, `expo.description` тохируулна
- **Deep linking** → `expo-router` автоматаар зохицуулна
- **Share функц** → `expo-sharing` ашиглана

```typescript
// app.config.ts
export default {
  expo: {
    name: "<App Name>",
    slug: "<slug>",
    description: "<App description>",
    // ...
  },
};
```

---

## 4g. Auth (`has_auth` — ecommerce only)

**Skip this section entirely if `site_type` is `business`.**

`AuthProvider`, `useAuth`, `RequireAuth` are pre-built in the starter — do not recreate them.

### Layout — add `AuthProvider`

In `app/_layout.tsx`, wrap with `AuthProvider` inside `ApolloClientProvider`:

```tsx
import { AuthProvider } from "@/lib/auth/AuthContext";

<ApolloClientProvider>
  <AuthProvider>
    <Stack screenOptions={{ headerShown: false }} />
  </AuthProvider>
</ApolloClientProvider>;
```

### Screens to generate

| Route              | File                             | Purpose                         |
| ------------------ | -------------------------------- | ------------------------------- |
| `/login`           | `app/(auth)/login.tsx`           | Email/phone + password login    |
| `/register`        | `app/(auth)/register.tsx`        | New account registration        |
| `/forgot-password` | `app/(auth)/forgot-password.tsx` | Request reset OTP               |
| `/verify`          | `app/(auth)/verify.tsx`          | OTP verification after register |
| `/profile`         | `app/(tabs)/profile/index.tsx`   | Protected — user profile        |

### Login screen pattern

```tsx
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation } from "@apollo/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import { CLIENT_PORTAL_USER_LOGIN_WITH_CREDENTIALS } from "@/graphql/auth/mutations/loginWithCredentials";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMutation, { loading, error }] = useMutation(
    CLIENT_PORTAL_USER_LOGIN_WITH_CREDENTIALS,
  );

  async function handleSubmit() {
    const { data } = await loginMutation({ variables: { email, password } });
    const token = data?.clientPortalUserLoginWithCredentials?.token;
    if (token) {
      login(token);
      router.replace("/(tabs)/profile");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 p-6 justify-center"
    >
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Имэйл"
        keyboardType="email-address"
        autoCapitalize="none"
        className="border border-gray-300 rounded-lg p-3 mb-3 min-h-[44px]"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Нууц үг"
        secureTextEntry
        className="border border-gray-300 rounded-lg p-3 mb-4 min-h-[44px]"
      />
      {error && <Text className="text-red-500 mb-2">{error.message}</Text>}
      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className="bg-primary rounded-lg p-4 items-center min-h-[44px]"
      >
        <Text className="text-white font-semibold">Нэвтрэх</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
```

Follow the same pattern for register, forgot-password, verify using the corresponding mutations from `@/graphql/auth/mutations/`.

### Protected screens

Wrap profile and other protected screens with the pre-built `RequireAuth`:

```tsx
import RequireAuth from "@/lib/auth/RequireAuth";
import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
```

### Header auth button

```tsx
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export function AuthButton() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  if (loading) return null;
  if (user) {
    return (
      <Pressable onPress={logout} className="min-h-[44px] px-3 justify-center">
        <Text>Гарах</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => router.push("/(auth)/login")}
      className="min-h-[44px] px-3 justify-center"
    >
      <Text>Нэвтрэх</Text>
    </Pressable>
  );
}
```

### Rules

- All auth screens use `useState` + `useMutation` — no Server Components
- All UI text must be in the app's language — use `messages/<locale>.json`

---

## 4h. Section components

One component per section in `sections`:

- Path: `components/sections/<SectionName>.tsx`
- All components are client-side — use `useQuery` for data fetching
- NativeWind `className` matching `tone` and `color_hint`
- All UI text in the config language
- All images via `expo-image` `<Image>` — never `<img>`
- All touch targets minimum `min-h-[44px]`

---

## 4i. TypeScript types (`types/cms.ts`)

```typescript
export interface Media {
  readonly url: string;
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface Category {
  readonly _id: string;
  readonly name: string;
  readonly code: string;
  readonly description?: string;
  readonly order?: number;
}

export interface Tag {
  readonly _id: string;
  readonly name: string;
  readonly colorCode?: string;
}

export type PostStatus = "published" | "draft" | "archived";

export interface Post {
  readonly _id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly content?: string;
  readonly status: PostStatus;
  readonly publishedDate?: string;
  readonly category?: Category;
  readonly categoryIds?: readonly string[];
  readonly tags?: readonly Tag[];
  readonly tagIds?: readonly string[];
  readonly featuredImage?: Media;
  readonly featured?: boolean;
}

export interface NavItem {
  readonly _id: string;
  readonly label: string;
  readonly url: string;
  readonly order: number;
  readonly target?: string;
}

export interface CmsPage {
  readonly _id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly content?: string;
  readonly pageItems?: ReadonlyArray<{
    readonly _id: string;
    readonly name: string;
    readonly type: string;
    readonly content?: string;
    readonly order: number;
  }>;
}
```

---

## 4j. Motion components (motion level ≥ 1)

**`hooks/useReducedMotion.ts`**:

```typescript
// React Native uses AccessibilityInfo — NOT window.matchMedia
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => sub.remove();
  }, []);
  return reduced;
}
```

**`components/motion/FadeIn.tsx`**:

```typescript
import { MotiView } from "moti";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

const directionFrom = {
  up:    { opacity: 0, translateY: 24 },
  down:  { opacity: 0, translateY: -16 },
  left:  { opacity: 0, translateX: -24 },
  right: { opacity: 0, translateX: 24 },
  none:  { opacity: 0 },
};

const directionTo = {
  up:    { opacity: 1, translateY: 0 },
  down:  { opacity: 1, translateY: 0 },
  left:  { opacity: 1, translateX: 0 },
  right: { opacity: 1, translateX: 0 },
  none:  { opacity: 1 },
};

export function FadeIn({ children, delay = 0, direction = "up", className }: FadeInProps) {
  const reduced = useReducedMotion();
  return (
    <MotiView
      from={reduced ? { opacity: 0 } : directionFrom[direction]}
      animate={reduced ? { opacity: 1 } : directionTo[direction]}
      transition={{ type: "timing", duration: reduced ? 0 : 400, delay: reduced ? 0 : delay }}
      className={className}
    >
      {children}
    </MotiView>
  );
}
```

---

## 4k. GraphQL query library (`lib/graphql/queries/cms.ts`)

```typescript
import { gql } from "@apollo/client";

export const GET_PAGES = gql`
  query CpPages($language: String) {
    cpPages(language: $language) {
      _id
      name
      slug
      status
      description
      content
      pageItems {
        _id
        name
        type
        content
        order
        config
      }
    }
  }
`;

export const GET_PAGE_BY_SLUG = gql`
  query CpPageBySlug($slug: String!, $language: String) {
    cpPageDetail(slug: $slug, language: $language) {
      _id
      name
      slug
      status
      description
      content
      pageItems {
        _id
        name
        type
        content
        order
        config
      }
    }
  }
`;

export const GET_POSTS = gql`
  query CpPosts(
    $language: String
    $categoryId: String
    $page: Int
    $perPage: Int
  ) {
    cpPosts(
      language: $language
      status: published
      categoryId: $categoryId
      page: $page
      perPage: $perPage
    ) {
      _id
      title
      slug
      excerpt
      content
      featured
      publishedDate
      categoryIds
      tagIds
      featuredImage {
        url
        altText
      }
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query CpPostBySlug($slug: String!, $language: String) {
    cpPostDetail(slug: $slug, language: $language) {
      _id
      title
      slug
      content
      excerpt
      featured
      publishedDate
      categoryIds
      tagIds
      featuredImage {
        url
        altText
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query CpCategories($language: String) {
    cpCategories(language: $language) {
      list {
        _id
        name
        slug
        description
      }
    }
  }
`;

export const GET_TAGS = gql`
  query CpTags($language: String) {
    cpCmsTags(language: $language) {
      tags {
        _id
        name
        slug
        colorCode
      }
    }
  }
`;

export const GET_HEADER_MENU = gql`
  query CpHeaderMenu($language: String) {
    cpMenus(language: $language, kind: "header") {
      _id
      label
      url
      order
      target
    }
  }
`;

export const GET_FOOTER_MENU = gql`
  query CpFooterMenu($language: String) {
    cpMenus(language: $language, kind: "footer") {
      _id
      label
      url
      order
      target
    }
  }
`;
```

---

## Build checklist

```
[ ] npx expo export — zero errors
[ ] npx expo-doctor — all checks pass
[ ] iOS simulator tested
[ ] Android emulator tested
[ ] All TypeScript errors fixed
[ ] No HTML elements used (div, p, img, span, button, a)
[ ] All touch targets min-h-[44px]
[ ] Safe area insets handled
[ ] CMS HTML rendered via react-native-render-html
[ ] EXPO_PUBLIC_* env vars (not NEXT_PUBLIC_*)
```
