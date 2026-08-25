# Code Conventions — Mobile (Expo Go)

Follow these in every file you write.

> **Read order:** for ecommerce builds read
> [`agents/ecommerce/conventions.md`](ecommerce/conventions.md) FIRST — it is
> the **source of truth** — then this file for global/project-wide rules.
> Where the two overlap on an ecommerce build, the ecommerce file wins.
>
> **Moved to the ecommerce file (do not duplicate here):** erxes data-fetching
> rules (`_id`, no `clientPortalId` variables, fetch policies), Apollo v4
> import patterns, auth-token storage, image handling details, and navigation
> specifics.

## React Native / Expo

- **Expo Go project** — only use libraries supported inside Expo Go (Expo SDK modules or pure-JS packages). Never add a library that requires custom native code, a config plugin, or a **custom dev client** — those break Expo Go compatibility.
- Never run `npx expo prebuild`, `expo eject`, or anything that generates native `ios/`/`android` folders — this project must stay a managed, Expo-Go-runnable app.
- Use Expo Router (file-based routing under `app/`) for all screens and navigation.
- Use `expo-font` (`useFonts`) for custom fonts — never load fonts from a remote CDN URL at runtime.
- Keep screens lean: pull data-fetching and heavy logic into hooks (`hooks/`), keep screen files focused on layout.
- **Do not upgrade the starter's framework stack** — never change `expo`, `react-native`, `react`, or NativeWind/Tailwind major versions, and never scaffold a new app when working inside `output/<slug>/`.
- **Never use `@latest` for framework-affecting tools inside the cloned starter** — that includes `create-expo-app`, `expo install --fix`, `expo upgrade`, and any command that can rewrite config based on a newer Expo SDK release.
- Use `expo install <package>` instead of `pnpm add <package>` for any native-adjacent Expo package, so the correct SDK-compatible version is installed.

> Navigation, image handling, and the client-component model are defined per
> template — see `agents/ecommerce/conventions.md` §7–§8 for ecommerce builds.

## NativeWind (Tailwind for React Native)

- Match `color_hint` from config as the primary color throughout.
- Match `tone` from config:
  - `formal` → clean spacing, muted colors, serif-friendly `font-serif` classes
  - `casual` → rounded corners (`rounded-xl`+), bright accents, relaxed spacing
  - `modern` → dark backgrounds, sharp edges (`rounded-none`/`rounded-sm`), bold typography
  - `traditional` → warm tones, conservative layout
  - `playful` → gradients (via `expo-linear-gradient`, since CSS gradients aren't supported), large rounded corners, vibrant colors
- Design mobile-first for a single column of device widths — no `hover:` variants (there's no mouse); use `active:` / `pressed` state styling instead.
- Always wrap screen content in `SafeAreaView` (from `react-native-safe-area-context`) so content respects notches/status bars.

## TypeScript

- Never use `any` — use proper types or `unknown` with narrowing.
- GraphQL identifiers: erxes always returns `_id` (MongoDB ObjectId) — the detailed rule lives in `agents/ecommerce/conventions.md` §4.

## Styling

- Never hardcode hex colors — use NativeWind theme tokens (defined via CSS variables in `tailwind.config.js` / `global.css`) instead of literal hex values.
- Use NativeWind `className` styling only — no inline `style={{ ... }}` objects and no `StyleSheet.create`, so styling stays consistent with the web conventions.

## Content

- Never write lorem ipsum — all placeholder content must be real text in the site's language.
- No hardcoded text — all copy comes from erxes CMS or config language.

## File structure

> **Ecommerce builds:** do NOT scaffold from the tree below — the ecommerce
> structure (tabs group, `graphql/`, `store/`, `features/products/`) is
> defined by `agents/ecommerce/generate-setup.md` + `agents/ecommerce/generate.md`
> Step 4. This tree applies to the generic CMS mobile template only.

Always scaffold new generic mobile projects to match this tree exactly:

```
<project>/
├── app/
│   ├── _layout.tsx              # root layout (replaces app/layout.tsx)
│   ├── +not-found.tsx           # replaces not-found.tsx
│   ├── global.css               # NativeWind entry (replaces globals.css)
│   └── (site)/
│       ├── _layout.tsx
│       ├── index.tsx            # replaces page.tsx
│       └── [contentType]/[slug].tsx
│
├── components/
│   ├── ui/                # react-native-reusables / gluestack-ui primitives — NOT shadcn (Radix/DOM-only, no RN runtime)
│   ├── motion/            # Reanimated + Moti variants (replaces Framer Motion, see Phase 5)
│   ├── effects/           # touch-based effects only — no hover/cursor effects (see Phase 7)
│   ├── layout/            # Header, TabBar/Footer nav, Providers
│   ├── cms/               # PostCard, PostGrid, PostDetail
│   └── sections/          # HeroSection, BreakingTicker, etc.
│
├── lib/
│   ├── motion.ts          # ALL Reanimated/Moti variants (replaces motion.ts + gsap.ts)
│   ├── tokens.ts          # Typed token accessors
│   ├── fonts.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── mock/              # Mock data — connectErxes target
│
├── hooks/
│   ├── useReducedMotion.ts   # via AccessibilityInfo, not prefers-reduced-motion
│   ├── useScrollProgress.ts  # via Reanimated's useAnimatedScrollHandler
│   ├── useAnimatedStyle.ts   # Reanimated hook (replaces useGSAP.ts)
│   └── useBreakpoint.ts      # via useWindowDimensions
│
├── types/
│   ├── cms.ts
│   └── site.ts
│
├── design-tokens.json     # Source of truth from design skill
├── ui-libraries.json      # Library spec from design skill
├── HANDOFF.md             # Design brief from design skill
└── .agent-config.json
```

**Dropped from the web structure — do not recreate on mobile:**

- `sitemap.ts`, `robots.ts` — web-only SEO files, no mobile equivalent.
- `error.tsx`, `loading.tsx` per-route — Expo Router has no built-in per-route error/loading file convention; handle errors with a shared `ErrorBoundary` component in `components/layout/`, and loading state inside each screen (e.g. a `useQuery`'s `loading` flag).
- `gsap.ts`, `useGSAP.ts` — GSAP targets the DOM and does not run on React Native; use Reanimated/Moti instead.
- `useLenis.ts` — Lenis is a web smooth-scroll library with no RN equivalent; native `ScrollView`/`FlatList` handle momentum scrolling natively.
- `useMagneticEffect.ts` — magnetic-cursor hover effects don't apply to touch devices; drop entirely (no substitute needed).

Shared UI in `components/` — one file per component, PascalCase. Shared data hooks in `hooks/` — one hook per file, camelCase, prefixed `use`. Run `pnpm start` (or `expo start`) to sanity-check the app boots in Expo Go, and run `pnpm typecheck` / `pnpm lint` after generating all files — fix all TypeScript and ESLint errors before reporting done.
