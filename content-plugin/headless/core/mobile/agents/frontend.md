---
name: erxes-mobile-frontend
description: Build Expo (React Native) frontend from Pencil design and design tokens with zero errors. Use this skill when the user asks to build mobile frontend from design, implement UI from Pencil.dev, create Expo app from design tokens, generate components and screens, or convert design to production mobile app.
---

# SKILL.md — erxes Mobile Frontend (Expo + React Native)

---

> **Pipeline position:** Section C — Step 1. Runs after Section B (Design).
> **Core mandate:** Build pixel-faithful, zero-error Expo 55 / React Native frontend.
> Implement EVERY animation library the design skill specced — precisely.
> Motion Levels 0–5. All visual directions. All animation systems.
> **Inputs required:** approved Pencil design + `design-tokens.json` + `ui-libraries.json` + `HANDOFF.md`
> **Output:** `npx expo export` passes with zero TypeScript errors, zero runtime errors.

---

## Skill Identity

```
SKILL_NAME  = erxes-mobile-frontend
ROLE        = Expo 55 / React Native Frontend Engineer — Zero-Error, Animation-Complete
SCOPE       = Scaffold → Tokens → Libraries → Animations → Feature Modules → Screens → Build
NEVER       = Invent design values. Skip library installations. Leave type errors.
              Use "any". Hardcode hex/color values. Skip animation implementations.
              Leave a motion spec from HANDOFF.md unimplemented.
              Use HTML elements (div, p, img, span) — always use React Native primitives.
              Upgrade the starter's Expo SDK / React Native stack or use @latest tooling.
              Use Next.js APIs (next/navigation, next/image, next/font).
              Scatter a single feature's component/graphql/hook/type across unrelated
              top-level folders (see PHASE 2 — Feature-Based Organization).
POSITION    = Section C — Step 1 in the pipeline
```

---

## Web → Mobile API Mapping (always apply)

| Web (Next.js)                  | Mobile (Expo / React Native)                        |
| ------------------------------ | --------------------------------------------------- |
| `<div>`                        | `<View>`                                            |
| `<p>`, `<span>`, `<h1>`–`<h6>` | `<Text>`                                            |
| `<img>`                        | `<Image>` from `expo-image`                         |
| `<button>`                     | `<Pressable>` or `<TouchableOpacity>`               |
| `<input>`                      | `<TextInput>`                                       |
| `<ScrollView>` (vertical list) | `<FlatList>` or `<FlashList>`                       |
| CSS / Tailwind classes         | NativeWind `className` or `StyleSheet.create()`     |
| `next/navigation` `useRouter`  | `expo-router` `useRouter`                           |
| `next/navigation` `useParams`  | `expo-router` `useLocalSearchParams`                |
| `next/link` `<Link>`           | `expo-router` `<Link>`                              |
| `app/page.tsx`                 | `app/(tabs)/index.tsx`                              |
| `app/[slug]/page.tsx`          | `app/[slug].tsx`                                    |
| `app/layout.tsx`               | `app/_layout.tsx`                                   |
| `NEXT_PUBLIC_*` env vars       | `EXPO_PUBLIC_*` env vars                            |
| `next/font`                    | `expo-font` + `useFonts`                            |
| `pnpm build`                   | `npx expo export`                                   |
| CSS `position: fixed`          | `position: absolute` + safe area insets             |
| CSS `vh`, `vw`                 | `Dimensions.get('window')` or `useWindowDimensions` |
| `window`, `document`           | Not available — use Expo APIs                       |

---

## Reference Files

Before implementing any animation library, read the matching reference:

| When you see this in ui-libraries.json | Read this reference                                       |
| -------------------------------------- | --------------------------------------------------------- |
| react-native-reanimated                | `agents/animations.md` → Reanimated section               |
| moti                                   | `agents/animations.md` → Moti section                     |
| react-native-gesture-handler           | `agents/animations.md` → Gesture Handler section          |
| lottie-react-native                    | `agents/animations.md` → Lottie Native section            |
| react-native-skia                      | `agents/animations.md` → Skia section                     |
| expo-gl, expo-three                    | `agents/animations.md` → ExpoGL / Three.js Native section |
| react-native-svg                       | `agents/animations.md` → SVG Native section               |
| react-native-linear-gradient           | `agents/animations.md` → Gradient section                 |
| react-native-blur                      | `agents/animations.md` → Blur section                     |
| react-native-haptics (expo-haptics)    | `agents/animations.md` → Haptics section                  |
| Animated (React Native built-in)       | `agents/animations.md` → RN Animated section              |

**Read the reference section in `agents/animations.md` BEFORE writing the component. Not after.**

---

## MCP Integrations

```
Pencil.dev MCP  → Read component specs, layout, spacing, animation annotations
                  Read BEFORE implementing every component. Every time.
                  Use mobile viewport (390×844) for all previews.
Context7 MCP    → Verify Expo SDK 57 / React Native / NativeWind API patterns
Web Search      → Find correct library APIs, TypeScript types, breaking changes
```

---

## ── PHASE 0: PRE-FLIGHT ──────────────────────────────────────────────────────

**Do not write a single line of code until all checks pass.**

### 0.1 Read All Design Inputs

```
[ ] Verify Section B — Step 2 (Design) actually completed in Pencil before coding
[ ] Confirm home screen previews were created at mobile viewport (390×844)
[ ] Confirm HANDOFF.md includes an Approval Record with the chosen home screen option
[ ] Confirm design.pen and design.png are real exports from the approved direction
[ ] Read design-tokens.json completely — parse every key including motion section
[ ] Read ui-libraries.json completely — extract all packages, animation_config, motion_variants
[ ] Read HANDOFF.md completely — note every animation spec, library setup snippet
[ ] Connect Pencil MCP — load project, list artboard IDs (mobile artboards only)
[ ] Extract from HANDOFF.md:
      MOTION_LEVEL (0–5)
      VISUAL_DIRECTION
      DARK_MODE
      LOCALE
      SITE_TYPE
      ERXES_SAAS_URL
      Scroll behavior choice
      Text animation choice
      Gesture interaction choice
      Screen transition choice
      Ambient animation choice
      Haptic feedback choice
[ ] Identify which commerce features SITE_TYPE requires (products, cart, orders,
    payment, review, auth, cms) — this determines which src/features/ modules
    get scaffolded in PHASE 2.2
```

If any approval proof is missing, stop and send the flow back to `agents/pencil-design.md`.

### 0.2 Parse ui-libraries.json → Animation Plan

```
Animation Implementation Plan (Mobile):
  Core animation library:    [reanimated | moti | rn-animated | css-only]
  Gesture library:           [gesture-handler | none]
  Text animation library:    [reanimated | moti | custom | none]
  Screen transition library: [expo-router transitions | reanimated | none]
  Ambient library:           [lottie-react-native | expo-gl | skia | none]
  Micro-interaction library: [reanimated | haptics | none]
  Haptic feedback:           [expo-haptics | none]

  For each library above → read `agents/animations.md` before implementing.
```

### 0.3 Validate Token Schema

Required keys in design-tokens.json — STOP if any missing:

```
colors.semantic.*
typography.families.display + body
typography.scale.*
spacing.scale + layout
radius.* + shadows.*
motion.duration.* + motion.easing.*
motion.spring_configs.*
motion.variants.*
```

### 0.4 Dependency Baseline Lock

```
[ ] Read output/<slug>/package.json
[ ] Treat the Expo SDK version as locked — do not upgrade expo, react-native, react
[ ] Do not run create-expo-app inside output/<slug>/
[ ] Do not use @latest for any framework-affecting package
[ ] Check expo-doctor compatibility before adding new native modules
```

---

## ── PHASE 1: LIBRARY INSTALLATION ───────────────────────────────────────────

**Install everything from ui-libraries.json BEFORE writing component code.**

### 1.1 Motion Level Install Matrix

#### MOTION_LEVEL 0 — Static

```bash
# No animation libraries. React Native Animated API only (built-in).
```

#### MOTION_LEVEL 1 — Polished

```bash
npx expo install react-native-reanimated
npx expo install react-native-gesture-handler
```

#### MOTION_LEVEL 2 — Alive

```bash
npx expo install react-native-reanimated react-native-gesture-handler moti
```

#### MOTION_LEVEL 3 — Expressive

```bash
npx expo install react-native-reanimated react-native-gesture-handler moti
npx expo install expo-haptics
npx expo install lottie-react-native          # if Lottie selected
npx expo install react-native-svg             # if SVG animations
```

#### MOTION_LEVEL 4 — Cinematic

```bash
npx expo install react-native-reanimated react-native-gesture-handler moti
npx expo install expo-haptics expo-blur
npx expo install lottie-react-native
npx expo install react-native-svg
npx expo install @shopify/react-native-skia   # if Skia selected
npx expo install expo-gl expo-three           # if 3D selected
```

#### MOTION_LEVEL 5 — Theatrical

```bash
# Everything from Level 4, plus:
npx expo install react-native-linear-gradient
npx expo install expo-camera expo-sensors     # if sensor-reactive
npx expo install react-native-reanimated-carousel  # if carousel
```

### 1.2 Always Install

```bash
npx expo install \
  expo-router \
  expo-constants \
  expo-linking \
  expo-status-bar \
  expo-font \
  expo-image \
  expo-secure-store \
  react-native-safe-area-context \
  react-native-screens \
  nativewind \
  @apollo/client \
  graphql \
  jotai

npm install --save-dev tailwindcss
```

### 1.3 NativeWind Setup

```bash
# tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};

# babel.config.js — add NativeWind plugin
module.exports = {
  presets: ["babel-preset-expo"],
  plugins: ["nativewind/babel"],
};
```

---

## ── PHASE 2: PROJECT SCAFFOLD ────────────────────────────────────────────────

### 2.1 Directory Structure

```
<project>/
├── app/
│   ├── _layout.tsx              # Root layout — Providers, fonts, safe area
│   ├── +not-found.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Bottom tab navigator
│   │   ├── index.tsx            # Home screen
│   │   ├── products/
│   │   │   ├── index.tsx        # imports FROM src/features/products
│   │   │   └── [id].tsx
│   │   ├── cart.tsx             # imports FROM src/features/cart
│   │   └── profile/
│   │       ├── index.tsx
│   │       ├── orders.tsx       # imports FROM src/features/orders
│   │       ├── orders/[id].tsx
│   │       └── wishlist.tsx
│   ├── checkout.tsx             # imports FROM src/features/payment + cart
│   ├── verify.tsx
│   ├── about.tsx
│   ├── contact.tsx
│   ├── blog/
│   │   ├── index.tsx
│   │   └── [slug].tsx
│   └── faq.tsx
│
├── src/
│   └── features/                 # ★ ALL commerce/domain logic lives here — every feature owns 100% of its own components/graphql/hooks/types (see contract below)
│       ├── products/
│       │   ├── components/
│       │   │   ├── ProductCard.tsx
│       │   │   ├── ProductList.tsx
│       │   │   ├── ProductDetail.tsx
│       │   │   ├── ProductSkeleton.tsx
│       │   │   └── ProductFilterBar.tsx
│       │   ├── graphql/
│       │   │   ├── queries.ts
│       │   │   └── mutations.ts
│       │   ├── hooks/
│       │   │   ├── useProducts.ts
│       │   │   ├── useProductDetail.ts
│       │   │   └── useProductFilters.ts
│       │   ├── types.ts
│       │   └── index.ts          # public export surface — see contract below
│       │
│       ├── cart/
│       │   ├── components/
│       │   │   ├── CartItem.tsx
│       │   │   └── CartSummary.tsx
│       │   ├── graphql/
│       │   │   ├── queries.ts
│       │   │   └── mutations.ts
│       │   ├── hooks/
│       │   │   └── useCart.ts
│       │   ├── types.ts
│       │   └── index.ts
│       │
│       ├── orders/
│       │   ├── components/
│       │   │   ├── OrderCard.tsx
│       │   │   └── OrderTimeline.tsx
│       │   ├── graphql/
│       │   │   ├── queries.ts
│       │   │   └── mutations.ts
│       │   ├── hooks/
│       │   │   └── useOrder.ts
│       │   ├── types.ts
│       │   └── index.ts
│       │
│       ├── payment/
│       │   ├── components/
│       │   │   └── PaymentMethodPicker.tsx
│       │   ├── graphql/
│       │   │   └── mutations.ts
│       │   ├── hooks/
│       │   │   └── usePayment.ts
│       │   ├── types.ts
│       │   └── index.ts
│       │
│       ├── review/
│       │   ├── components/
│       │   │   ├── ReviewCard.tsx
│       │   │   └── ReviewForm.tsx
│       │   ├── graphql/
│       │   │   ├── queries.ts
│       │   │   └── mutations.ts
│       │   ├── hooks/
│       │   │   └── useReview.ts
│       │   ├── types.ts
│       │   └── index.ts
│       │
│       └── auth/
│           ├── components/
│           │   ├── LoginForm.tsx
│           │   └── RegisterForm.tsx
│           ├── graphql/
│           │   ├── queries.ts
│           │   └── mutations.ts
│           ├── hooks/
│           │   └── useAuth.ts
│           ├── types.ts
│           └── index.ts
│
├── components/                   # NO feature/domain code — design-system + layout only
│   ├── ui/                       # react-native-reusables / gluestack-ui primitives — NOT shadcn (Radix/DOM-only, no RN runtime)
│   ├── motion/                   # Reanimated + Moti variants (replaces Framer Motion) — FadeIn, AnimatedCard…
│   ├── effects/                  # touch-based effects only — no hover/cursor effects — GlassCard, AuroraBackground…
│   ├── layout/                   # TabBar, Header, Providers
│   └── cms/                      # PostCard, PostGrid — content that is NOT a commerce feature
│
├── lib/
│   ├── motion.ts                 # Reanimated shared values + Moti variants (replaces motion.ts + gsap.ts)
│   ├── tokens.ts                 # Typed token accessors
│   ├── fonts.ts                  # expo-font loader
│   ├── utils.ts
│   ├── constants.ts
│   └── mock/                     # Mock data — connectErxes target (mirrors the feature split, e.g. lib/mock/products.ts)
│
├── hooks/                        # ONLY cross-feature/global hooks — nothing product/order-specific
│   ├── useReducedMotion.ts       # AccessibilityInfo.isReduceMotionEnabled
│   ├── useHaptics.ts             # expo-haptics wrapper
│   ├── useScrollProgress.ts      # Reanimated scroll tracker
│   ├── useSafeArea.ts            # useSafeAreaInsets wrapper
│   └── useBreakpoint.ts          # useWindowDimensions breakpoints
│
├── graphql/
│   └── client.ts                 # Apollo client setup ONLY — no feature queries/mutations here
│
├── types/
│   └── site.ts                   # global, cross-feature types only
│
├── store/                        # global state (jotai atoms that span features)
│
├── design-tokens.json            # Source of truth from design skill
├── ui-libraries.json             # Library spec from design skill
├── HANDOFF.md                    # Design brief from design skill
├── tailwind.config.js
├── app.config.ts
└── .agent-config.json
```

---

## ── PHASE 3: TOKEN SYSTEM ────────────────────────────────────────────────────

### 3.1 `lib/tokens.ts`

Read every token from design-tokens.json. Components use CSS variables via Tailwind.
This file provides typed JS access for `lib/motion.ts` and `lib/gsap.ts`.

```typescript
import designTokens from "@/design-tokens.json";
export const tokens = designTokens as typeof designTokens;
export const { colors, typography, spacing, radius, shadows } = tokens;
export const motionTokens = tokens.motion;
```

### 3.2 `lib/motion.ts` — Reanimated + Moti variants

**Read the `motion.variants` section from design-tokens.json.**
Every variant the design skill defined MUST appear here.

```typescript
import { withTiming, withSpring, Easing } from "react-native-reanimated";
import { tokens } from "./tokens";

// ── Timing configs from tokens ──────────────────────────────────────
export const timings = {
  default: {
    duration: parseInt(tokens.motion.duration.normal),
    easing: Easing.bezier(
      ...(tokens.motion.easing.default as [number, number, number, number]),
    ),
  },
  fast: {
    duration: parseInt(tokens.motion.duration.fast),
    easing: Easing.bezier(
      ...(tokens.motion.easing.default as [number, number, number, number]),
    ),
  },
  slow: {
    duration: parseInt(tokens.motion.duration.slow),
    easing: Easing.bezier(
      ...(tokens.motion.easing.decelerate as [number, number, number, number]),
    ),
  },
};

// ── Spring configs from tokens ──────────────────────────────────────
export const springs = {
  snappy: tokens.motion.spring_configs.snappy,
  gentle: tokens.motion.spring_configs.gentle,
  bouncy: tokens.motion.spring_configs.bouncy,
};

// ── Moti variants (map from design-tokens.json motion.variants) ─────
// Used with Moti's `from` / `animate` / `exit` props
export const motiVariants = {
  fadeUp: {
    from: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    exit: { opacity: 0, translateY: 20 },
  },
  fadeIn: {
    from: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideRight: {
    from: { opacity: 0, translateX: -20 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: -20 },
  },
  slideLeft: {
    from: { opacity: 0, translateX: 20 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: 20 },
  },
};

// ── Reduced motion helper ────────────────────────────────────────────
export function withReducedMotion<T extends object>(variant: T): T {
  // Returns instant (duration: 0) version — use with AccessibilityInfo check
  return variant; // caller applies duration: 0 when reduced motion is on
}
```

### 3.3 `hooks/useReducedMotion.ts`

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

---

## ── PHASE 4: ANIMATION COMPONENT ARCHITECTURE ────────────────────────────────

### Rule: Every HANDOFF.md animation spec becomes a component or hook.

Animation primitives are cross-feature and stay in `components/motion/` /
`hooks/` at the root. Feature-specific animated components (e.g. an animated
`ProductCard` press state) still live inside `src/features/products/components/`
but should compose the shared primitives from `components/motion/`.

| HANDOFF.md selection     | Component/hook to build                   | Reference                           |
| ------------------------ | ----------------------------------------- | ----------------------------------- |
| Scroll progress          | `hooks/useScrollProgress.ts`              | Reanimated useAnimatedScrollHandler |
| Text: fade in chars      | `components/motion/AnimatedText.tsx`      | Moti stagger                        |
| Text: typewriter         | `components/motion/Typewriter.tsx`        | Reanimated + setInterval            |
| Gesture: swipe           | `hooks/useSwipeGesture.ts`                | gesture-handler                     |
| Gesture: pull-to-refresh | Built into `<FlatList refreshControl>`    | RN built-in                         |
| Gesture: long press      | `components/motion/LongPressable.tsx`     | gesture-handler                     |
| Gesture: pinch zoom      | `components/motion/PinchZoom.tsx`         | gesture-handler                     |
| Haptic: tap              | `hooks/useHaptics.ts`                     | expo-haptics                        |
| Haptic: success          | `hooks/useHaptics.ts`                     | expo-haptics                        |
| Screen transition: slide | Expo Router `<Stack>` with animation prop | expo-router                         |
| Screen transition: modal | Expo Router `presentation: "modal"`       | expo-router                         |
| Screen transition: fade  | Expo Router `animation: "fade"`           | expo-router                         |
| Ambient: Lottie          | `components/effects/LottiePlayer.tsx`     | lottie-react-native                 |
| Ambient: Skia shader     | `components/effects/SkiaBackground.tsx`   | @shopify/react-native-skia          |
| Micro: count-up          | `components/motion/CountUp.tsx`           | Reanimated useSharedValue           |
| Micro: skeleton          | `components/motion/Skeleton.tsx`          | Moti + shimmer                      |
| Micro: progress bar      | `components/motion/ProgressBar.tsx`       | Reanimated width                    |
| Card: scale on press     | `components/motion/AnimatedCard.tsx`      | Reanimated + gesture                |

---

## ── PHASE 5: CORE MOTION COMPONENTS ─────────────────────────────────────────

### Always build these (MOTION_LEVEL ≥ 1):

**`hooks/useReducedMotion.ts`** — uses `AccessibilityInfo.isReduceMotionEnabled()`
**`components/motion/FadeIn.tsx`** — Moti MotiView with fadeUp variant
**`components/motion/AnimatedCard.tsx`** — scale + shadow on press (Reanimated)
**`components/motion/Skeleton.tsx`** — shimmer loading placeholder

All motion components must:

- Work with both iOS and Android
- Call `useReducedMotion()` and skip animation when true
- Have explicit `width` and `height` — never rely on web-style sizing
- Handle safe area insets where needed
- Export named exports (not default)

**`components/motion/FadeIn.tsx`** example:

```tsx
import { MotiView } from "moti";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motiVariants } from "@/lib/motion";

export function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <MotiView
      {...(reduced ? {} : motiVariants.fadeUp)}
      transition={{ type: "timing", duration: reduced ? 0 : 400, delay }}
    >
      {children}
    </MotiView>
  );
}
```

---

## ── PHASE 6: DIRECTION-SPECIFIC EFFECTS ─────────────────────────────────────

Read VISUAL_DIRECTION. Build only the matching effects.

| Direction        | Effect components to build                                         |
| ---------------- | ------------------------------------------------------------------ |
| glass-future     | `GlassCard.tsx` (expo-blur `<BlurView>`)                           |
| aurora-gradient  | `AuroraBackground.tsx` (react-native-linear-gradient + Reanimated) |
| neon-brutalist   | `NeonBorder.tsx` (react-native-svg glow), `GlitchText.tsx`         |
| organic-texture  | `GrainOverlay.tsx` (Skia noise shader)                             |
| morphic-soft     | `BlobBackground.tsx` (Skia animated paths)                         |
| mongolian-modern | `UlziiPattern.tsx` (react-native-svg stroke draw)                  |
| midnight-cinema  | `LetterboxView.tsx`, `NoiseGrain.tsx` (Skia)                       |
| immersive-3d     | `ExpoGLScene.tsx` (expo-gl + expo-three, lazy loaded)              |
| data-precision   | `AnimatedGrid.tsx`, `DataTicker.tsx` (Reanimated)                  |

These are cross-feature visual effects and always live in `components/effects/`,
never inside a `src/features/*` folder — a feature may import and use them, but
does not own them.

For Lottie, Skia, and ExpoGL — always lazy load:

```typescript
const LottiePlayer = React.lazy(() =>
  import("@/components/effects/LottiePlayer").then((m) => ({
    default: m.LottiePlayer,
  })),
);
```

---

## ── PHASE 7: TOKEN SYSTEM → STYLES ──────────────────────────────────────────

All style values come from `design-tokens.json`. Never hardcode.

### NativeWind (className-based):

Define extended theme in `tailwind.config.js` from design tokens:

```js
theme: {
  extend: {
    colors: { /* from tokens.colors.semantic */ },
    fontFamily: { /* from tokens.typography.families */ },
    borderRadius: { /* from tokens.radius */ },
  }
}
```

### StyleSheet-based (for Reanimated animated styles):

```typescript
// Always derive from tokens — never hardcode
const styles = StyleSheet.create({
  card: {
    borderRadius: parseInt(tokens.radius.md),
    padding: parseInt(tokens.spacing.scale["4"]),
  },
});
```

### Dark mode:

Use `useColorScheme()` from `react-native` + token semantic colors:

```typescript
const scheme = useColorScheme();
const bg =
  scheme === "dark" ? tokens.colors.semantic.bgDark : tokens.colors.semantic.bg;
```

---

## ── PHASE 8: CMS TYPES AND DATA CONTRACT ────────────────────────────────────

All types from `types/site.ts` (global) and each feature's own `types.ts`
(feature-scoped) — preserved exactly. All mock data functions from `lib/mock/`
— preserved exactly, split per feature (`lib/mock/products.ts`, `lib/mock/orders.ts`,
etc.), matching the `src/features/` split. Use `_id` (not `id`). MongoDB convention.
All mock text in real Mongolian.

---

## ── PHASE 9: COMPONENTS AND SCREENS ─────────────────────────────────────────

### Build order (strict):

1. `lib/tokens.ts` + `lib/motion.ts` + `lib/fonts.ts`
2. `hooks/` (global, cross-feature hooks only)
3. `components/motion/` (all motion components per animation plan)
4. `components/effects/` (direction-specific effects)
5. `components/ui/` (design system primitives)
6. `src/features/<feature>/` — for each feature identified in PHASE 0.1, build in this
   order per feature: `types.ts` → `graphql/` → `hooks/` → `components/` → `index.ts`
7. `components/cms/` (content that isn't a commerce feature — PostCard, PostGrid)
8. `components/layout/` (TabBar, Header, Providers)
9. `app/_layout.tsx` + screens (compose from `src/features/*` and `components/*`)

### Every component rule:

- Read Pencil spec BEFORE implementing (mobile artboard)
- Use React Native primitives — never HTML elements
- Touch targets minimum **44×44pt** (use `minHeight: 44, minWidth: 44`)
- Handle safe area with `useSafeAreaInsets()` or `<SafeAreaView>`
- Use `expo-image` `<Image>` — never `<img>`
- Keyboard: wrap forms in `<KeyboardAvoidingView>`
- Null guard every CMS field: `post.category?.name ?? ""`
- Skeleton matches component geometry exactly
- `FadeIn` wraps entrance animations
- A commerce/domain component ALWAYS lives inside its `src/features/<feature>/components/`
  folder — never directly under root `components/`

---

## ── PHASE 10: ZERO-ERROR BUILD PROTOCOL ─────────────────────────────────────

### TypeScript Check

```bash
npx tsc --noEmit 2>&1 | head -50
```

Zero-error requirements:

```
[ ] No `any` — use unknown + type guard or explicit interface
[ ] All Expo Router screen params typed via useLocalSearchParams<{id: string}>()
[ ] useRef typed: useRef<View>(null)
[ ] Reanimated shared values typed: useSharedValue<number>(0)
[ ] Animated styles typed: useAnimatedStyle(() => ({ ... }))
[ ] All useAnimatedScrollHandler events typed
[ ] Skia paths and paints typed from @shopify/react-native-skia
[ ] All discriminated unions fully covered
[ ] No deep imports into another feature's internals — only via that feature's index.ts
```

### Animation-Specific Runtime Safety

```
[ ] react-native-reanimated babel plugin configured in babel.config.js
[ ] react-native-gesture-handler import at TOP of app/_layout.tsx (before anything else)
[ ] GestureHandlerRootView wraps the entire app in _layout.tsx
[ ] Lottie animations loaded with require() — not dynamic import URL
[ ] expo-haptics calls wrapped in try/catch (not available on all simulators)
[ ] AccessibilityInfo.isReduceMotionEnabled() checked before all animations
[ ] All heavy effects (Skia, ExpoGL) lazy loaded
[ ] useAnimatedStyle never references non-shared-value JS state directly
[ ] Reanimated worklets never call JS-thread functions
[ ] All Moti exit animations use AnimatePresence wrapper
```

### Feature Organization Check (run before final build)

```
[ ] Every folder under src/features/ has components/, graphql/, hooks/, types.ts, index.ts
[ ] grep for stray feature files outside src/features/, e.g.:
      grep -rl "ProductCard\|useProduct\|useOrder\|usePayment\|useReview" components/ hooks/ graphql/
    → must return nothing (or only imports of the feature's index.ts, never definitions)
[ ] No file named queries.ts or mutations.ts directly under root graphql/ (only client.ts there)
[ ] No hooks/order.ts, hooks/payment.ts, hooks/review.ts, hooks/queries.ts at root
```

### Full Build

```bash
npx expo export
npx expo-doctor
```

Required: zero errors, zero type errors, expo-doctor all checks pass.

### Performance

```
[ ] FlatList / FlashList used for all lists — never map() inside ScrollView for long lists
[ ] expo-image used for all images (caching, blurhash placeholders)
[ ] Lottie, Skia, ExpoGL: lazy loaded
[ ] Fonts preloaded in app/_layout.tsx with useFonts()
[ ] All font subsets include Cyrillic (mn locale)
[ ] No anonymous functions in FlatList renderItem (use useCallback)
```

---

## ── ABSOLUTE RULES ───────────────────────────────────────────────────────────

```
ANIMATION CONTRACT
  Every animation spec in HANDOFF.md must be implemented. No skipping.
  Every animation must have a prefers-reduced-motion fallback (AccessibilityInfo).
  Every heavy library (Skia, ExpoGL, Lottie) must be lazy loaded.
  Read `agents/animations.md` before implementing any listed library.

REACT NATIVE CONTRACT
  Never use HTML elements. Always use View, Text, Image, Pressable, TextInput.
  All touch targets minimum 44×44pt.
  Always handle safe area insets (notch, home indicator).
  Always handle both iOS and Android differences.
  Never use window, document, localStorage — use Expo equivalents.

FEATURE ORGANIZATION CONTRACT
  Every commerce/domain concept (products, cart, orders, payment, review, auth) gets
  exactly one folder under src/features/<feature>/, owning its own components/,
  graphql/, hooks/, and types.ts.
  Never create components/product/, hooks/order.ts, hooks/payment.ts, or a shared
  graphql/ecommerce/ that mixes multiple features — this is the exact scattering
  pattern this contract exists to prevent.
  Cross-feature access only through a feature's index.ts — never deep imports.
  Root components/, hooks/, graphql/, types/ hold ONLY cross-feature/global code.

DESIGN FIDELITY
  Read design-tokens.json before writing any style or component.
  Read Pencil spec (mobile artboard) before implementing every component.
  Never hardcode color, font, spacing, or radius values.

TYPESCRIPT
  Zero `any`. Use unknown + type guard or explicit interface.
  npx expo export must pass with zero TypeScript errors.

ERXES CONTRACT
  Use _id (not id). Never change mock export signatures.
  Mock data must use real Mongolian text.

BUILD
  npx expo export + npx expo-doctor pass with zero errors before handoff.
  Feature Organization Check (PHASE 10) passes before handoff.
```

---

## ── CONNECTERXES HANDOFF ─────────────────────────────────────────────────────

Output when `npx expo export` passes:

```
Mobile Frontend Build Complete

Animation libraries implemented:
  [list every library from animation plan — confirm each is working]

Feature modules scaffolded (src/features/):
  [list every feature folder built — confirm each has components/graphql/hooks/types/index]

Platform tested:
  [ ] iOS simulator
  [ ] Android emulator

Prompt erxes-connect agent with:
  "Connect this Expo project to [ERXES_SAAS_URL].
   For each src/features/<feature>/, replace graphql/queries.ts and graphql/mutations.ts
   with real erxes GraphQL operations (same signatures), and replace the corresponding
   lib/mock/<feature>.ts with live data via that feature's hooks."
```
