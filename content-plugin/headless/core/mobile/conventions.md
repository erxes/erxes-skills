# Code Conventions — Mobile (Expo / React Native)

Read `conventions.core.md` first. This file adds mobile-specific rules on top of it.

---

## React Native Primitives

- **Never use HTML elements** — always use React Native primitives:
  - `<View>` not `<div>`
  - `<Text>` not `<p>`, `<span>`, `<h1>`–`<h6>`
  - `<Pressable>` or `<TouchableOpacity>` not `<button>`
  - `<TextInput>` not `<input>`
  - `<ScrollView>` / `<FlatList>` not `<ul>`, `<ol>`
- Use `expo-image` `<Image>` for all images — never `<img>`
- Use `expo-font` + `useFonts()` for fonts — never import fonts from CDN

## Navigation

- Use `expo-router` `<Link>` for all internal navigation — never `<a href="...">`
- Use `useRouter()` from `expo-router` for programmatic navigation
- Use `useLocalSearchParams<{ id: string }>()` for dynamic screen params

## Data Fetching

- **All screens are client-side** — there are no Server Components in Expo
- Use Apollo `useQuery` / `useMutation` in all screens and components
- No `getClient().query()` — that is Next.js only
- No `revalidate` context — Expo does not support ISR/SSR

## Styling

- Use NativeWind `className` or `StyleSheet.create()` — no CSS files
- All touch targets minimum **44×44pt** (`minHeight: 44, minWidth: 44`)
- Always handle safe area insets with `useSafeAreaInsets()` or `<SafeAreaView>`
- Use `useColorScheme()` from `react-native` for dark mode

## Environment Variables

- Client-side env vars use `EXPO_PUBLIC_*` prefix — never `NEXT_PUBLIC_*`

## Build

- Run `npx expo export` after generating all files
- Run `npx expo-doctor` to verify native module compatibility
- Fix all TypeScript and expo-doctor errors before reporting done
