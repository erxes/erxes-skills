---
name: erxes-frontend
description: Build Next.js frontend from Pencil design and design tokens with zero errors. Use this skill when the user asks to build frontend from design, implement UI from Pencil.dev, create Next.js app from design tokens, generate components and pages, or convert design to production frontend.
---

# SKILL.md — erxes Frontend (Animation-Complete Edition)

---

> **Pipeline position:** Section C — Step 1. Runs after Section B (Design).
> **Core mandate:** Build pixel-faithful, zero-error Next.js 15 frontend.
>                   Implement EVERY animation library the design skill specced — precisely.
>                   Motion Levels 0–5. All visual directions. All animation systems.
> **Inputs required:** approved Pencil design + `design-tokens.json` + `ui-libraries.json` + `HANDOFF.md`
> **Output:** `pnpm build` passes with zero TypeScript errors, zero runtime errors.

---

## Skill Identity

```
SKILL_NAME  = erxes-frontend
ROLE        = Next.js 15 Frontend Engineer — Zero-Error, Animation-Complete
SCOPE       = Scaffold → Tokens → Libraries → Animations → Components → Pages → Build
NEVER       = Invent design values. Skip library installations. Leave type errors.
              Use "any". Hardcode hex values. Skip animation implementations.
              Leave a motion spec from HANDOFF.md unimplemented.
              Upgrade the starter's Next.js / React stack or use @latest tooling inside it.
POSITION    = Section C — Step 1 in the pipeline
```

---

## Reference Files

Before implementing any animation library, read the matching reference:

| When you see this in ui-libraries.json | Read this reference |
|---|---|
| gsap, @gsap/react | `agents/animations.md` → GSAP section |
| framer-motion | `agents/animations.md` → Framer Motion section |
| lenis | `agents/animations.md` → Lenis section |
| three, @react-three/fiber | `agents/animations.md` → Three.js section |
| @tsparticles/* | `agents/animations.md` → Particles section |
| @rive-app/react-canvas | `agents/animations.md` → Rive section |
| lottie-react, @lottiefiles/* | `agents/animations.md` → Lottie section |
| barba.js | `agents/animations.md` → Barba.js section |
| vanilla-tilt | `agents/animations.md` → VanillaTilt section |
| react-scramble | `agents/animations.md` → TextScramble section |
| countup.js, react-countup | `agents/animations.md` → CountUp section |
| theatre.js | `agents/animations.md` → Theatre.js section |
| Aceternity UI in custom_components | `agents/animations.md` → Aceternity section |
| Magic UI in custom_components | `agents/animations.md` → Magic UI section |
| Motion Primitives in custom_components | `agents/animations.md` → Motion Primitives section |
| Hover.dev in custom_components | `agents/animations.md` → Hover.dev section |

**Read the reference section in `agents/animations.md` BEFORE writing the component. Not after.**

---

## MCP Integrations

```
Pencil.dev MCP  → Read component specs, layout, spacing, animation annotations
                  Read BEFORE implementing every component. Every time.
Context7 MCP    → Verify Next.js 15 / React 19 / Tailwind v4 API patterns
Web Search      → Find correct library APIs, TypeScript types, breaking changes
```

---

## ── PHASE 0: PRE-FLIGHT ──────────────────────────────────────────────────────

**Do not write a single line of code until all checks pass.**

### 0.1 Read All Design Inputs

```
[ ] Verify Section B — Step 2 (Design) actually completed in Pencil before coding
[ ] Confirm homepage previews were created and one option was approved
[ ] Confirm HANDOFF.md includes an Approval Record with the chosen homepage option
[ ] Confirm design.pen and design.png are real exports from the approved direction, not placeholders
[ ] Read design-tokens.json completely — parse every key including motion section
[ ] Read ui-libraries.json completely — extract all packages, animation_config, motion_variants
[ ] Read HANDOFF.md completely — note every animation spec, library setup snippet
[ ] Connect Pencil MCP — load project, list artboard IDs
[ ] Extract from HANDOFF.md:
      MOTION_LEVEL (0–5)
      VISUAL_DIRECTION
      DARK_MODE
      LOCALE
      SITE_TYPE
      ERXES_SAAS_URL
      Scroll behavior choice
      Text animation choice
      Hover interaction choice
      Page transition choice
      Ambient animation choice
      Micro-interaction choice
```

If any approval proof is missing, stop and send the flow back to `agents/pencil-design.md`. Do not start frontend implementation from tokens alone.

### 0.2 Parse ui-libraries.json → Animation Plan

Read the `animation_config` block from ui-libraries.json and create an
**Animation Implementation Plan** before writing any code:

```
Animation Implementation Plan:
  Core animation library:    [framer-motion | gsap | anime.js | css-only]
  Scroll library:            [lenis | locomotive-scroll | none]
  Text animation library:    [gsap-splittext | splitting.js | custom | none]
  Page transition library:   [barba.js | view-transitions | framer | none]
  Ambient library:           [three.js | tsparticles | rive | lottie | css | none]
  Micro-interaction library: [framer-motion | css | countup.js | none]
  Copy-paste libraries:      [Aceternity UI / Magic UI / Motion Primitives — list components]

  For each library above → read `agents/animations.md` before implementing.
```

### 0.3 Validate Token Schema

Required keys in design-tokens.json — STOP if any missing:
```
colors.semantic.* (all semantic color pairs)
typography.families.display + body
typography.scale.* (all scale steps)
spacing.scale + layout
radius.* + shadows.*
motion.duration.* + motion.easing.*
motion.spring_configs.*  (snappy, gentle, bouncy, heavy, magnetic)
motion.variants.*        (all named variants from design skill)
motion.gsap_configs.*    (if GSAP selected)
```

### 0.4 Dependency Baseline Lock

Before installing any library:

```
[ ] Read output/<slug>/package.json
[ ] Treat the cloned starter's next/react/react-dom versions as locked
[ ] Do not upgrade next, react, react-dom, eslint-config-next, or Tailwind major versions
[ ] Do not run create-next-app inside output/<slug>/
[ ] Do not use @latest for shadcn or any framework-affecting bootstrap tool
[ ] If shadcn is already configured, add only the missing components or write equivalent local components manually
```

---

## ── PHASE 1: LIBRARY INSTALLATION ───────────────────────────────────────────

**Install everything from ui-libraries.json BEFORE writing component code.**

### 1.1 Motion Level Install Matrix

Read MOTION_LEVEL and install automatically. No questions asked.

#### MOTION_LEVEL 0 — Static
```bash
# No animation libraries. CSS transitions only.
```

#### MOTION_LEVEL 1 — Polished
```bash
pnpm add react-intersection-observer framer-motion
```

#### MOTION_LEVEL 2 — Alive
```bash
pnpm add framer-motion react-intersection-observer lenis date-fns
```

#### MOTION_LEVEL 3 — Expressive
```bash
pnpm add framer-motion lenis react-intersection-observer
# Check HANDOFF.md animation selections then add:
pnpm add gsap @gsap/react                   # if GSAP selected
pnpm add vanilla-tilt @types/vanilla-tilt   # if 3D tilt selected
pnpm add react-scramble                     # if text scramble selected
pnpm add splitting                          # if SplitText (open-source) selected
pnpm add countup.js react-countup           # if count-up micro selected
```

#### MOTION_LEVEL 4 — Cinematic
```bash
pnpm add gsap @gsap/react lenis framer-motion react-intersection-observer
pnpm add vanilla-tilt @types/vanilla-tilt
pnpm add react-scramble splitting

# Conditional on HANDOFF.md choices:
pnpm add three @react-three/fiber @react-three/drei @types/three   # if Three.js
pnpm add @tsparticles/react @tsparticles/slim @tsparticles/engine  # if particles
pnpm add @rive-app/react-canvas                                     # if Rive
pnpm add lottie-react                                               # if Lottie
pnpm add barba                                                      # if Barba.js
pnpm add countup.js react-countup
```

#### MOTION_LEVEL 5 — Theatrical
```bash
# Everything from Level 4, plus:
pnpm add @theatre/core @theatre/studio @theatre/r3f   # if Theatre.js
pnpm add ogl                                           # if WebGL shader
pnpm add matter-js @types/matter-js                   # if physics
pnpm add motion-canvas                                 # if Motion Canvas
pnpm add howler @types/howler                          # if sound-reactive
```

### 1.2 Copy-Paste Library Installation

Aceternity UI, Magic UI, Motion Primitives, and Hover.dev are NOT npm packages.
Agent GENERATES the component code directly (see `agents/animations.md` for each).

```bash
# These require only their dependencies:
pnpm add framer-motion clsx tailwind-merge   # Aceternity UI deps
pnpm add framer-motion clsx tailwind-merge   # Magic UI deps
pnpm add framer-motion                       # Motion Primitives deps
```

### 1.3 Always Install

```bash
pnpm add \
  clsx tailwind-merge \
  lucide-react \
  date-fns \
  react-hook-form zod \
  zustand \
  next-themes \
  @radix-ui/react-slot

pnpm add -D \
  @tailwindcss/typography \
  tailwindcss-animate \
  @next/bundle-analyzer
```

### 1.4 shadcn/ui Init

```bash
# Only if the starter does not already have shadcn configured:
# use a CLI version compatible with the starter's existing React/Next/Tailwind stack.
# Never use @latest here.
pnpm dlx shadcn@<compatible-version> init --defaults
pnpm dlx shadcn@<compatible-version> add [components from ui-libraries.json shadcn_components]
```

---

## ── PHASE 2: PROJECT SCAFFOLD ────────────────────────────────────────────────

### 2.1 Starter Reuse

```bash
# In this erxes pipeline the project is already cloned in Step 2.
# Reuse the existing starter in output/<slug>/ and modify it in place.
# Do not run create-next-app here.
```

### 2.2 Directory Structure

```
<project>/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   ├── sitemap.ts
│   ├── robots.ts
│   └── (site)/
│       ├── layout.tsx
│       ├── page.tsx
│       └── [contentType]/[slug]/page.tsx + loading.tsx
│
├── components/
│   ├── ui/               # shadcn + design system primitives
│   ├── motion/           # Animation system (see Phase 5)
│   ├── effects/          # Direction-specific effects (see Phase 7)
│   ├── layout/           # Header, Footer, Providers
│   ├── cms/              # PostCard, PostGrid, PostDetail
│   └── sections/         # HeroSection, BreakingTicker, etc.
│
├── lib/
│   ├── motion.ts         # ALL Framer Motion variants + GSAP configs
│   ├── gsap.ts           # GSAP plugin registration (if GSAP selected)
│   ├── tokens.ts         # Typed token accessors
│   ├── fonts.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── mock/             # Mock data — connectErxes target
│
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useLenis.ts
│   ├── useMagneticEffect.ts
│   ├── useScrollProgress.ts
│   ├── useGSAP.ts        # GSAP hook (if GSAP)
│   └── useBreakpoint.ts
│
├── types/
│   ├── cms.ts
│   └── site.ts
│
├── design-tokens.json    # Source of truth from design skill
├── ui-libraries.json     # Library spec from design skill
├── HANDOFF.md            # Design brief from design skill
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

### 3.2 `lib/motion.ts` — Consume Token Variants Exactly

**Read the `motion.variants` section from design-tokens.json.**
Every variant the design skill defined MUST appear here — not invented inline.

```typescript
import type { Variants, Transition } from "framer-motion";
import { tokens } from "./tokens";

// ── Transitions from tokens ──────────────────────────────────────────
export const transitions = {
  default:     buildTransition(tokens.motion.duration.normal,  tokens.motion.easing.default),
  fast:        buildTransition(tokens.motion.duration.fast,    tokens.motion.easing.default),
  slow:        buildTransition(tokens.motion.duration.slow,    tokens.motion.easing.decelerate),
  page:        buildTransition(tokens.motion.duration.page,    tokens.motion.easing.decelerate),
  cinematic:   buildTransition(tokens.motion.duration.cinematic ?? "1200ms", tokens.motion.easing.decelerate),
  spring:      tokens.motion.spring_configs.snappy as Transition,
  springGentle:tokens.motion.spring_configs.gentle as Transition,
  springBouncy:tokens.motion.spring_configs.bouncy as Transition,
} as const;

function buildTransition(durationMs: string, ease: number[]): Transition {
  return {
    duration: parseFloat(durationMs) / 1000,
    ease: ease as [number, number, number, number],
  };
}

// ── Token-defined variants (READ from design-tokens.json motion.variants) ──
// For each variant in tokens.motion.variants, create the matching Framer object.
// The token structure is: { hidden: {...}, visible: {...} }
// Map it directly — do not invent values.

export const fadeUp:      Variants = buildVariant("fadeUp");
export const fadeIn:      Variants = buildVariant("fadeIn");
export const fadeDown:    Variants = buildVariant("fadeDown");
export const slideRight:  Variants = buildVariant("slideRight");
export const slideLeft:   Variants = buildVariant("slideLeft");
export const scaleIn:     Variants = buildVariant("scaleIn");
export const textReveal:  Variants = buildVariant("textReveal");    // clipPath reveal
export const liquid:      Variants = buildVariant("liquid");        // circle expand
export const shimmer:     Variants = buildVariant("shimmer");       // bg-position sweep

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: parseFloat(tokens.motion.duration.stagger ?? "80ms") / 1000,
      delayChildren: 0.05,
    },
  },
};

export const cardHover: Variants = {
  rest:  { y: 0, scale: 1,     boxShadow: tokens.shadows.md, transition: transitions.default },
  hover: { y: -4, scale: 1.005, boxShadow: tokens.shadows.lg, transition: transitions.default },
};

export const imageHover: Variants = {
  rest:  { scale: 1,    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
  hover: { scale: 1.04, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

// Page transition variants — read from HANDOFF.md choice
export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.page },
  exit:    { opacity: 0, transition: transitions.fast },
};

export const pageCurtain: Variants = {
  initial: { scaleY: 1, transformOrigin: "bottom" },
  animate: { scaleY: 0, transformOrigin: "bottom", transition: { ...transitions.page, ease: [0.76, 0, 0.24, 1] } },
  exit:    { scaleY: 1, transformOrigin: "top",    transition: { ...transitions.fast } },
};

// Reduced-motion helper — returns variant with instant transitions
export function withReducedMotion<T extends Variants>(variant: T): T {
  const reduced: Variants = {};
  for (const key of Object.keys(variant)) {
    reduced[key] = { ...variant[key], transition: { duration: 0 } };
  }
  return reduced as T;
}

function buildVariant(name: string): Variants {
  const raw = (tokens.motion.variants as Record<string, unknown>)[name];
  if (!raw) return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  return raw as Variants;
}
```

### 3.3 `lib/gsap.ts` — Plugin Registration (if GSAP selected)

**Read `agents/animations.md` → GSAP section before writing this file.**

```typescript
// lib/gsap.ts — MUST be imported once at app startup
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

// Register ALL plugins used by this project up-front
// (Read ui-libraries.json → animation_config → gsap_plugins for the list)
gsap.registerPlugin(
  ScrollTrigger,
  // Add: SplitText, Flip, MorphSVG, DrawSVG, MotionPathPlugin as needed
);

// Apply token-defined defaults
gsap.defaults({
  duration: parseFloat(tokens.motion.duration.normal) / 1000,
  ease: "power2.out",
});

// Reduced-motion override
if (typeof window !== "undefined") {
  gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
    gsap.globalTimeline.timeScale(1000); // effectively instant
    ScrollTrigger.getAll().forEach(st => st.animation?.progress(1));
  });
}

export { gsap, ScrollTrigger };
```

---

## ── PHASE 4: ANIMATION COMPONENT ARCHITECTURE ────────────────────────────────

### Rule: Every HANDOFF.md animation spec becomes a component or hook.

Read the animation plan from Phase 0. For each selection:

| HANDOFF.md selection | Component/hook to build | Reference |
|---|---|---|
| Scroll: Lenis | `hooks/useLenis.ts` | animations.md → Lenis |
| Scroll: GSAP ScrollTrigger | `hooks/useGSAP.ts` + section wrappers | animations.md → GSAP |
| Text: SplitText / chars | `components/motion/SplitText.tsx` | animations.md → SplitText |
| Text: Scramble | `components/motion/TextScramble.tsx` | animations.md → TextScramble |
| Text: Typewriter | `components/motion/Typewriter.tsx` | animations.md → Typewriter |
| Text: Mask reveal | `components/motion/TextReveal.tsx` | animations.md → TextReveal |
| Hover: Magnetic | `components/motion/MagneticButton.tsx` | animations.md → Magnetic |
| Hover: 3D tilt | `components/motion/TiltCard.tsx` | animations.md → VanillaTilt |
| Hover: Custom cursor | `components/motion/CustomCursor.tsx` | animations.md → Cursor |
| Hover: Spotlight | `components/motion/SpotlightCard.tsx` | animations.md → Spotlight |
| Hover: Liquid fill | `components/motion/LiquidButton.tsx` | animations.md → Liquid |
| Hover: Shimmer | `components/motion/ShimmerCard.tsx` | animations.md → Shimmer |
| Transition: Barba.js | `lib/barba.ts` + `hooks/useBarba.ts` | animations.md → Barba |
| Transition: Curtain | `components/motion/CurtainTransition.tsx` | animations.md → Curtain |
| Transition: View Transitions | `components/motion/ViewTransition.tsx` | animations.md → ViewTransitions |
| Ambient: Three.js | `components/effects/ThreeScene.tsx` | animations.md → Three.js |
| Ambient: tsParticles | `components/effects/ParticleField.tsx` | animations.md → Particles |
| Ambient: Rive | `components/effects/RiveHero.tsx` | animations.md → Rive |
| Ambient: Lottie | `components/effects/LottiePlayer.tsx` | animations.md → Lottie |
| Ambient: Aurora CSS | `components/effects/AuroraBg.tsx` | animations.md → Aurora |
| Micro: Count-up | `components/motion/CountUp.tsx` | animations.md → CountUp |
| Micro: Stagger list | `components/motion/StaggerList.tsx` | Built-in Framer |
| Micro: Progress bar | `components/motion/ScrollProgress.tsx` | Built-in Framer |
| Aceternity components | Generate from animations.md → Aceternity | animations.md |
| Magic UI components | Generate from animations.md → Magic UI | animations.md |
| Motion Primitives | Generate from animations.md → MotionPrimitives | animations.md |

---

## ── PHASE 5: CORE MOTION COMPONENTS ─────────────────────────────────────────

### Always build these (MOTION_LEVEL ≥ 1):

**`hooks/useReducedMotion.ts`** — reads prefers-reduced-motion media query
**`components/motion/FadeIn.tsx`** — direction-aware reveal with Intersection Observer
**`components/motion/StaggerContainer.tsx`** — staggered children entrance
**`components/motion/PageTransition.tsx`** — wraps page content with chosen transition variant

All motion components must:
- Be `"use client"` files
- Import motion variants ONLY from `lib/motion.ts` (never inline)
- Call `useReducedMotion()` and skip/collapse animation when true
- Export named exports (not default)

See existing implementations in the original SKILL.md for:
- `useReducedMotion`, `useLenis`, `MagneticButton`, `CustomCursor`, `FadeIn`

### Build additional components based on animation plan (read `agents/animations.md`):

For each library in the animation plan → read its section in `agents/animations.md`
→ implement the component exactly as specified → place in correct directory.

---

## ── PHASE 6: DIRECTION-SPECIFIC EFFECTS ─────────────────────────────────────

Read VISUAL_DIRECTION. Build only the matching effects.

| Direction | Effect components to build |
|---|---|
| glass-future | `GlassCard.tsx`, `GlassNav.tsx` |
| aurora-gradient | `AuroraBg.tsx` (with cursor tracking) |
| neon-brutalist | `GlitchText.tsx`, `NeonBorder.tsx`, `ScanlineOverlay.tsx` |
| organic-texture | `NoiseBg.tsx` (SVG feTurbulence), `GrainOverlay.tsx` |
| morphic-soft | `BlobBg.tsx` (animated SVG blobs) |
| mongolian-modern | `UlziiPattern.tsx` (SVG stroke draw), `PatternBorder.tsx` |
| midnight-cinema | `LetterboxHero.tsx`, `NoiseGrain.tsx` |
| immersive-3d | `ThreeScene.tsx` (R3F, dynamic import, Suspense, ssr: false) |
| data-precision | `AnimatedGrid.tsx`, `DataTicker.tsx` |

For Three.js, Rive, Lottie, and Particles — always dynamic import:

```typescript
const ThreeScene = dynamic(
  () => import("@/components/effects/ThreeScene").then(m => ({ default: m.ThreeScene })),
  { ssr: false, loading: () => null }
);
```

---

## ── PHASE 7: TOKEN SYSTEM → CSS ─────────────────────────────────────────────

`app/globals.css` — Read EVERY value from design-tokens.json. No hardcoded values.
Map all semantic colors, spacing, radius, shadows, motion durations, easing curves
to CSS custom properties in `@theme {}` block.

Dark mode: `[data-theme="dark"]` overrides all semantic color variables.
Reduced motion: `@media (prefers-reduced-motion: reduce)` disables all transitions.

The shimmer skeleton animation, glass card blur, noise overlay, and glow effects
are all defined here from their matching token values.

(Full globals.css implementation is in the original SKILL.md — preserve it exactly,
substituting real token values from design-tokens.json.)

---

## ── PHASE 8: CMS TYPES AND DATA CONTRACT ────────────────────────────────────

All types from `types/cms.ts` and `types/site.ts` — preserved exactly.
All mock data functions from `lib/mock/` — preserved exactly.
Use `_id` (not `id`). MongoDB convention. All mock text in real Mongolian.

---

## ── PHASE 9: COMPONENTS AND PAGES ───────────────────────────────────────────

### Build order (strict):

1. `lib/tokens.ts` + `lib/motion.ts` + `lib/gsap.ts` (if GSAP)
2. `app/globals.css` (full CSS custom properties)
3. `hooks/` (all hooks for selected libraries)
4. `components/motion/` (all motion components per animation plan)
5. `components/effects/` (direction-specific effects)
6. `components/ui/` (shadcn + primitives)
7. `components/cms/PostCard/` (all 4 variants)
8. `components/sections/HeroSection/` (chosen pattern)
9. `components/layout/` (Header, Footer, Providers)
10. `app/layout.tsx` + pages

### Every component rule:

- Read Pencil spec BEFORE implementing
- Import variants from `lib/motion.ts` — never inline
- CSS values via `var(--token-name)` — never hardcode
- Null guard every CMS field: `post.category?.name ?? ""`
- Skeleton matches component geometry exactly
- `FadeIn` wraps every above-the-fold animation

---

## ── PHASE 10: ZERO-ERROR BUILD PROTOCOL ─────────────────────────────────────

### TypeScript Check

```bash
pnpm tsc --noEmit 2>&1 | head -50
```

Zero-error requirements:
```
[ ] No `any` — use unknown + type guard or explicit interface
[ ] All Next.js 15 page params typed as Promise<{...}>
[ ] useRef typed: useRef<HTMLDivElement>(null)
[ ] noUncheckedIndexedAccess: arr[0] is T | undefined — null guard required
[ ] All Framer Motion variants typed as Variants
[ ] GSAP timeline refs typed: useRef<gsap.core.Timeline>(null)
[ ] Three.js mesh refs typed: useRef<THREE.Mesh>(null)
[ ] Rive: useRive return type fully typed from @rive-app/react-canvas
[ ] All async page components: generateMetadata params typed as Promise
[ ] All discriminated unions fully covered
```

### Animation-Specific Runtime Safety

```
[ ] GSAP.registerPlugin() called before any plugin use (in lib/gsap.ts)
[ ] GSAP imported only in "use client" files or useEffect (never Server Component)
[ ] gsap.matchMedia() configured for prefers-reduced-motion
[ ] Lenis destroyed in useEffect cleanup
[ ] ScrollTrigger.refresh() called after Lenis init
[ ] Three.js Canvas in Suspense fallback={null}
[ ] Rive canvas has explicit width/height — never 0x0
[ ] tsParticles init wrapped in useCallback
[ ] VanillaTilt.init() called in useEffect, destroyed in cleanup
[ ] Barba.js initialized after DOM ready, destroyed on unmount
[ ] Custom cursor unmounts correctly (no stale event listeners)
[ ] All heavy effects (Three.js, particles) dynamic imported with ssr: false
[ ] All motion variants imported from lib/motion.ts — none defined inline
[ ] Copy-paste library components (Aceternity, Magic UI) have all dependencies installed
```

### Full Build

```bash
pnpm build
```

Required: `✓ Compiled successfully` — zero errors, zero type errors.
If any error: fix it first.

### Performance

```bash
ANALYZE=true pnpm build
```

```
[ ] Three.js, tsParticles, Rive, Lottie: all dynamic imported
[ ] GSAP: only import used plugins (not gsap/all)
[ ] Aceternity/Magic UI: only build components actually used
[ ] All font subsets include Cyrillic (mn locale)
```

---

## ── ABSOLUTE RULES ───────────────────────────────────────────────────────────

```
ANIMATION CONTRACT
  Every animation spec in HANDOFF.md must be implemented. No skipping.
  Every motion variant must come from lib/motion.ts — never inline.
  Every animation must have a prefers-reduced-motion fallback.
  Every heavy library (Three.js, particles, Rive) must be dynamic imported.
  Read `agents/animations.md` before implementing any listed library.

DESIGN FIDELITY
  Read design-tokens.json before writing any CSS or component.
  Read Pencil spec before implementing every component.
  Never hardcode color, font, spacing, or radius values.

TYPESCRIPT
  Zero `any`. Use unknown + type guard or explicit interface.
  pnpm build must pass with zero TypeScript errors.

ERXES CONTRACT
  Use _id (not id). Never change mock export signatures.
  Mock data must use real Mongolian text.

BUILD
  pnpm build passes with zero errors before handoff.
```

---

## ── CONNECTERXES HANDOFF ─────────────────────────────────────────────────────

Output when `pnpm build` passes:

```
Frontend Build Complete ✅

Animation libraries implemented:
  [list every library from animation plan — confirm each is working]

Prompt erxes-connect agent with:
  "Connect this project to [ERXES_SAAS_URL].
   Replace lib/mock/index.ts with lib/graphql/index.ts (same signatures)."
```
