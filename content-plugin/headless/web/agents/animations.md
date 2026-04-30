# Animation Library Reference

This file contains exact implementation code for every animation library
the erxes-design skill can specify. Read the relevant section BEFORE
implementing. Do not improvise library APIs from memory.

---

## Table of Contents

1. [GSAP + ScrollTrigger + SplitText](#gsap)
2. [Framer Motion — Advanced Patterns](#framer-motion)
3. [Lenis Smooth Scroll](#lenis)
4. [Three.js / React Three Fiber](#three)
5. [tsParticles](#particles)
6. [Rive](#rive)
7. [Lottie / DotLottie](#lottie)
8. [Barba.js Page Transitions](#barba)
9. [VanillaTilt 3D Hover](#vanillatilt)
10. [TextScramble](#textscramble)
11. [Typewriter](#typewriter)
12. [Text Reveal (Mask)](#textreveal)
13. [CountUp.js](#countup)
14. [Custom Cursor](#cursor)
15. [Magnetic Button](#magnetic)
16. [Spotlight Card](#spotlight)
17. [Liquid Fill Button](#liquid)
18. [Shimmer / Sheen](#shimmer)
19. [Curtain Page Transition](#curtain)
20. [View Transitions API](#viewtransitions)
21. [Aurora Background (CSS)](#aurora)
22. [Glitch Text (CSS)](#glitch)
23. [Aceternity UI Components](#aceternity)
24. [Magic UI Components](#magicui)
25. [Motion Primitives Components](#motionprimitives)
26. [Hover.dev Components](#hoverdev)
27. [Theatre.js](#theatre)

---

## 1. GSAP + ScrollTrigger + SplitText {#gsap}

### Install
```bash
pnpm add gsap @gsap/react
```

### `lib/gsap.ts` — Plugin registration (import this ONCE in app/layout.tsx or providers)

```typescript
// lib/gsap.ts
"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
// import { SplitText } from "gsap/SplitText";      // paid club plugin
// import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"; // paid
// import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";   // paid

// Register all plugins used in this project
gsap.registerPlugin(
  ScrollTrigger,
  Flip,
  // SplitText, MorphSVGPlugin, DrawSVGPlugin — uncomment if using GSAP Club
);

// Token-driven defaults (read from lib/tokens.ts)
gsap.defaults({ duration: 0.4, ease: "power2.out" });

// Reduced motion override — disables all GSAP animations instantly
if (typeof window !== "undefined") {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.globalTimeline.timeScale(1000);
    return () => gsap.globalTimeline.timeScale(1);
  });
}

export { gsap, ScrollTrigger, Flip };
```

### `hooks/useGSAP.ts` — Safe GSAP hook with cleanup

```typescript
"use client";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Runs a GSAP animation in useEffect with proper cleanup.
 * All ScrollTriggers created inside the callback are auto-killed on unmount.
 */
export function useGSAPAnimation(
  callback: (ctx: gsap.Context) => void,
  deps: React.DependencyList = []
) {
  const ctx = useRef<gsap.Context | null>(null);

  useEffect(() => {
    ctx.current = gsap.context(callback);
    return () => {
      ctx.current?.revert();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
```

### `components/motion/GSAPReveal.tsx` — Scroll-triggered reveal

```typescript
"use client";
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/useGSAPAnimation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface GSAPRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export function GSAPReveal({
  children,
  direction = "up",
  distance = 40,
  duration = 0.7,
  delay = 0,
  className,
}: GSAPRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const fromVars: gsap.TweenVars = {
    opacity: 0,
    x: direction === "left" ? -distance : direction === "right" ? distance : 0,
    y: direction === "up" ? distance : direction === "down" ? -distance : 0,
  };

  useGSAPAnimation(() => {
    if (!ref.current || prefersReduced) return;

    gsap.from(ref.current, {
      ...fromVars,
      opacity: 0,
      duration: prefersReduced ? 0 : duration,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  }, [prefersReduced]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

### `components/motion/GSAPSplitText.tsx` — Character-by-character animation

```typescript
"use client";
// Uses open-source Splitting.js instead of paid GSAP SplitText
// If using paid GSAP Club SplitText, swap the split logic below
import { useRef, useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface GSAPSplitTextProps {
  children: string;   // Must be a plain string, not ReactNode
  tag?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  animation?: "chars" | "words" | "lines";
  stagger?: number;
  duration?: number;
  className?: string;
  triggerOnScroll?: boolean;
}

export function GSAPSplitText({
  children,
  tag: Tag = "div",
  animation = "chars",
  stagger = 0.03,
  duration = 0.6,
  className,
  triggerOnScroll = true,
}: GSAPSplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current || prefersReduced) return;

    const el = containerRef.current;
    const text = el.textContent ?? "";

    // Manual split — wraps each char in a span
    if (animation === "chars") {
      el.innerHTML = text
        .split("")
        .map(char =>
          char === " "
            ? `<span style="display:inline-block">&nbsp;</span>`
            : `<span class="split-char" style="display:inline-block;overflow:hidden">${char}</span>`
        )
        .join("");
    } else if (animation === "words") {
      el.innerHTML = text
        .split(" ")
        .map(word => `<span class="split-word" style="display:inline-block;overflow:hidden;margin-right:0.25em">${word}</span>`)
        .join("");
    }

    const chars = el.querySelectorAll<HTMLElement>(".split-char, .split-word");

    const ctx = gsap.context(() => {
      gsap.from(chars, {
        opacity: 0,
        y: animation === "chars" ? "100%" : 20,
        rotateX: animation === "chars" ? -90 : 0,
        stagger,
        duration,
        ease: "power3.out",
        scrollTrigger: triggerOnScroll
          ? { trigger: el, start: "top 85%", toggleActions: "play none none none" }
          : undefined,
      });
    }, el);

    return () => {
      ctx.revert();
      el.textContent = text; // restore original text
    };
  }, [prefersReduced, animation, stagger, duration, triggerOnScroll]);

  return (
    // @ts-expect-error — dynamic tag
    <Tag ref={containerRef} className={className} aria-label={children}>
      {prefersReduced ? children : null}
    </Tag>
  );
}
```

### `components/motion/GSAPPinnedSection.tsx` — Pinned scroll section

```typescript
"use client";
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGSAPAnimation } from "@/hooks/useGSAPAnimation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface GSAPPinnedSectionProps {
  children: ReactNode;
  className?: string;
  scrubSpeed?: number;
}

export function GSAPPinnedSection({
  children,
  className,
  scrubSpeed = 1,
}: GSAPPinnedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useGSAPAnimation(() => {
    if (!sectionRef.current || !innerRef.current || prefersReduced) return;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "+=200%",
      pin: true,
      scrub: scrubSpeed,
      anticipatePin: 1,
    });
  }, [prefersReduced]);

  return (
    <section ref={sectionRef} className={className}>
      <div ref={innerRef}>{children}</div>
    </section>
  );
}
```

---

## 2. Framer Motion — Advanced Patterns {#framer-motion}

### `components/motion/StaggerList.tsx`

```typescript
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { useInView } from "react-intersection-observer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ReactNode } from "react";

interface StaggerListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

export function StaggerList({
  children,
  className,
  itemClassName,
  staggerDelay = 0.08,
}: StaggerListProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <motion.ul
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: prefersReduced ? 0 : staggerDelay },
        },
      }}
      className={className}
    >
      {children.map((child, i) => (
        <motion.li
          key={i}
          variants={prefersReduced ? {} : fadeUp}
          className={itemClassName}
        >
          {child}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### `components/motion/PageTransitionWrapper.tsx`

```typescript
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { pageFade, pageCurtain } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ReactNode } from "react";

// Read HANDOFF.md page_transition choice, use matching variant
interface PageTransitionWrapperProps {
  children: ReactNode;
  variant?: "fade" | "curtain" | "slide" | "none";
}

export function PageTransitionWrapper({
  children,
  variant = "fade",
}: PageTransitionWrapperProps) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  if (variant === "none" || prefersReduced) {
    return <>{children}</>;
  }

  const variants = variant === "curtain" ? pageCurtain : pageFade;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 3. Lenis Smooth Scroll {#lenis}

### Install
```bash
pnpm add lenis
```

### `hooks/useLenis.ts`

```typescript
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "@/lib/gsap"; // Only if GSAP also selected

let lenisInstance: Lenis | null = null;

export function useLenis() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Sync Lenis with GSAP ScrollTrigger if both are selected
    if (typeof ScrollTrigger !== "undefined") {
      lenisInstance.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenisInstance?.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time: number) {
        lenisInstance?.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    return () => {
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);
}

export const getLenis = (): Lenis | null => lenisInstance;
```

---

## 4. Three.js / React Three Fiber {#three}

### Install
```bash
pnpm add three @react-three/fiber @react-three/drei @types/three
```

### IMPORTANT: Always dynamic import with ssr: false

```typescript
// In the page/layout that uses Three.js:
import dynamic from "next/dynamic";
const ThreeScene = dynamic(
  () => import("@/components/effects/ThreeScene").then(m => ({ default: m.ThreeScene })),
  { ssr: false, loading: () => null }
);
```

### `components/effects/ThreeScene.tsx`

```typescript
"use client";
import { useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ── Inner scene objects ──────────────────────────────────────────────

function FloatingGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.18;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 6]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.3}
          roughness={0.05}
          transmissionSampler
          chromaticAberration={0.06}
          ior={1.5}
        />
      </mesh>
    </Float>
  );
}

// Cursor-reactive camera pointer
function CameraPointer() {
  const { camera, gl } = useThree();
  useFrame((state) => {
    camera.position.x += (state.pointer.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (state.pointer.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Exported component ───────────────────────────────────────────────

interface ThreeSceneProps {
  className?: string;
  variant?: "sphere" | "particles" | "custom";
}

export function ThreeScene({ className, variant = "sphere" }: ThreeSceneProps) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <div className={className} aria-hidden="true">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <CameraPointer />
          <FloatingGeometry />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Environment preset="city" />
        </Canvas>
      </Suspense>
    </div>
  );
}
```

---

## 5. tsParticles {#particles}

### Install
```bash
pnpm add @tsparticles/react @tsparticles/slim @tsparticles/engine
```

### `components/effects/ParticleField.tsx`

```typescript
"use client";
import { useCallback, type CSSProperties } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Particle config presets — choose based on VISUAL_DIRECTION
const CONFIGS: Record<string, ISourceOptions> = {
  // Glass / Aurora: sparse connected dots
  connected: {
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    particles: {
      number: { value: 40, density: { enable: true, area: 800 } },
      color: { value: "var(--color-accent)" },
      opacity: { value: 0.15, random: true },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: 0.6, outModes: "bounce" },
      links: { enable: true, distance: 150, color: "var(--color-accent)", opacity: 0.08 },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
        onClick: { enable: true, mode: "push" },
      },
      modes: {
        repulse: { distance: 100 },
        push: { quantity: 2 },
      },
    },
    detectRetina: true,
  },
  // Neon Brutalist: fast chaotic particles
  chaotic: {
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    particles: {
      number: { value: 80 },
      color: { value: ["#00ff41", "#ff0099"] }, // neon colors
      opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 1 } },
      size: { value: { min: 1, max: 2 } },
      move: { enable: true, speed: 2, direction: "random", outModes: "destroy" },
      life: { count: 1, duration: { value: { min: 2, max: 5 } } },
    },
    emitters: { position: { x: 50, y: 50 }, rate: { delay: 0.1, quantity: 1 } },
    detectRetina: true,
  },
};

interface ParticleFieldProps {
  style?: "connected" | "chaotic";
  className?: string;
  containerStyle?: CSSProperties;
}

export function ParticleField({
  style = "connected",
  className,
  containerStyle,
}: ParticleFieldProps) {
  const prefersReduced = useReducedMotion();

  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  if (prefersReduced) return null;

  return (
    <Particles
      id="tsparticles"
      className={className}
      style={containerStyle}
      init={init}
      options={CONFIGS[style] ?? CONFIGS.connected}
    />
  );
}
```

---

## 6. Rive {#rive}

### Install
```bash
pnpm add @rive-app/react-canvas
```

### IMPORTANT: Always dynamic import (uses canvas API)

```typescript
const RiveHero = dynamic(
  () => import("@/components/effects/RiveHero").then(m => ({ default: m.RiveHero })),
  { ssr: false, loading: () => <div className="aspect-square skeleton" /> }
);
```

### `components/effects/RiveHero.tsx`

```typescript
"use client";
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface RiveHeroProps {
  src: string;           // path to .riv file in /public
  stateMachine?: string; // state machine name from Rive editor
  artboard?: string;     // artboard name
  className?: string;
  width?: number;
  height?: number;
}

export function RiveHero({
  src,
  stateMachine = "State Machine 1",
  artboard,
  className,
  width = 800,
  height = 600,
}: RiveHeroProps) {
  const prefersReduced = useReducedMotion();

  const { rive, RiveComponent } = useRive({
    src,
    artboard,
    stateMachines: stateMachine,
    autoplay: !prefersReduced,
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
  });

  // Example: trigger hover state machine input
  const hoverInput = useStateMachineInput(rive, stateMachine, "isHovered");

  return (
    <div
      className={className}
      style={{ width, height }}
      onMouseEnter={() => { if (hoverInput) hoverInput.value = true; }}
      onMouseLeave={() => { if (hoverInput) hoverInput.value = false; }}
      aria-hidden="true"
    >
      <RiveComponent />
    </div>
  );
}
```

---

## 7. Lottie {#lottie}

### Install
```bash
pnpm add lottie-react
# Or for DotLottie format:
pnpm add @lottiefiles/dotlottie-react
```

### `components/effects/LottiePlayer.tsx`

```typescript
"use client";
import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useInView } from "react-intersection-observer";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface LottiePlayerProps {
  animationData: object;   // import yourAnimation from "@/public/animations/hero.json"
  loop?: boolean;
  className?: string;
  playOnHover?: boolean;
  playOnView?: boolean;
  speed?: number;
}

export function LottiePlayer({
  animationData,
  loop = true,
  className,
  playOnHover = false,
  playOnView = false,
  speed = 1,
}: LottiePlayerProps) {
  const prefersReduced = useReducedMotion();
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const { ref: viewRef, inView } = useInView({ triggerOnce: true });

  // Respect reduced motion — show first frame only
  const isAutoplay = !prefersReduced && !playOnHover && (!playOnView || inView);

  return (
    <div
      ref={viewRef}
      className={className}
      onMouseEnter={() => {
        if (playOnHover && !prefersReduced) lottieRef.current?.play();
      }}
      onMouseLeave={() => {
        if (playOnHover) lottieRef.current?.stop();
      }}
      aria-hidden="true"
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={prefersReduced ? false : loop}
        autoplay={isAutoplay}
        speed={speed}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
```

---

## 8. Barba.js Page Transitions {#barba}

### Install
```bash
pnpm add barba
```

### IMPORTANT: Barba.js hijacks the router. In Next.js, use with App Router carefully.
### Recommended: Use Framer Motion AnimatePresence instead for Next.js projects.
### Only use Barba.js for non-Next.js or when HANDOFF.md specifically requires it.

### `lib/barba.ts` — If Barba.js is required

```typescript
// lib/barba.ts
"use client";
import barba from "@barba/core";
import { gsap } from "@/lib/gsap";

// Called once at app startup (in a "use client" layout)
export function initBarba() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  barba.init({
    debug: process.env.NODE_ENV === "development",
    transitions: [
      {
        name: "curtain-transition",
        async leave({ current }) {
          const curtain = document.getElementById("page-curtain");
          if (!curtain) return;
          await gsap.to(curtain, {
            scaleY: 1,
            transformOrigin: "bottom",
            duration: 0.5,
            ease: "power2.inOut",
          });
        },
        async enter({ next }) {
          const curtain = document.getElementById("page-curtain");
          if (!curtain) return;
          await gsap.to(curtain, {
            scaleY: 0,
            transformOrigin: "top",
            duration: 0.5,
            ease: "power2.inOut",
          });
        },
      },
    ],
  });
}
```

### Curtain overlay element (add to layout.tsx body):
```tsx
{/* Page curtain for Barba.js transitions */}
<div
  id="page-curtain"
  aria-hidden="true"
  style={{
    position: "fixed", inset: 0, zIndex: 9999,
    background: "var(--color-accent)",
    transform: "scaleY(0)", transformOrigin: "bottom",
    pointerEvents: "none",
  }}
/>
```

---

## 9. VanillaTilt 3D Hover {#vanillatilt}

### Install
```bash
pnpm add vanilla-tilt @types/vanilla-tilt
```

### `components/motion/TiltCard.tsx`

```typescript
"use client";
import { useRef, useEffect, type ReactNode } from "react";
import VanillaTilt, { type HTMLVanillaTiltElement } from "vanilla-tilt";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  max?: number;       // max tilt in degrees (default: 10)
  scale?: number;     // scale on hover (default: 1.02)
  speed?: number;     // animation speed (default: 400)
  glare?: boolean;    // show glare effect
  maxGlare?: number;  // max glare opacity (default: 0.2)
}

export function TiltCard({
  children,
  className,
  max = 10,
  scale = 1.02,
  speed = 400,
  glare = false,
  maxGlare = 0.2,
}: TiltCardProps) {
  const ref = useRef<HTMLVanillaTiltElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!ref.current || prefersReduced) return;

    VanillaTilt.init(ref.current, {
      max,
      scale,
      speed,
      glare,
      "max-glare": maxGlare,
      easing: "cubic-bezier(.03,.98,.52,.99)",
      perspective: 1000,
    });

    return () => {
      ref.current?.vanillaTilt?.destroy();
    };
  }, [prefersReduced, max, scale, speed, glare, maxGlare]);

  return (
    <div ref={ref} className={cn("transform-gpu", className)}>
      {children}
    </div>
  );
}
```

---

## 10. TextScramble {#textscramble}

### Install
```bash
pnpm add react-scramble
# Or use the custom implementation below (no npm needed)
```

### Custom `components/motion/TextScramble.tsx` (zero dependencies)

```typescript
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
const MN_CHARS = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя";

interface TextScrambleProps {
  text: string;
  className?: string;
  trigger?: "hover" | "mount" | "inview";
  duration?: number;        // ms (default 600)
  useMongolian?: boolean;   // use Mongolian Cyrillic chars
  speed?: number;           // iterations per frame (default 3)
}

export function TextScramble({
  text,
  className,
  trigger = "hover",
  duration = 600,
  useMongolian = false,
  speed = 3,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const prefersReduced = useReducedMotion();
  const rafRef = useRef<number>(0);
  const chars = useMongolian ? MN_CHARS : CHARS;

  const scramble = useCallback(() => {
    if (prefersReduced) return;

    let iteration = 0;
    const totalIterations = (text.length * speed);
    clearInterval(rafRef.current as unknown as number);

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration / speed) return text[i] ?? char;
            return chars[Math.floor(Math.random() * chars.length)] ?? char;
          })
          .join("")
      );

      if (iteration >= totalIterations) {
        clearInterval(interval);
        setDisplayText(text);
      }
      iteration += 1;
    }, duration / totalIterations);

    return () => clearInterval(interval);
  }, [text, prefersReduced, chars, duration, speed]);

  useEffect(() => {
    if (trigger === "mount") scramble();
  }, [trigger, scramble]);

  const handlers =
    trigger === "hover"
      ? { onMouseEnter: scramble }
      : {};

  return (
    <span
      className={className}
      aria-label={text}
      {...handlers}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {displayText}
    </span>
  );
}
```

---

## 11. Typewriter {#typewriter}

### `components/motion/Typewriter.tsx` (zero dependencies)

```typescript
"use client";
import { useState, useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TypewriterProps {
  words: string[];          // cycles through these words
  className?: string;
  typingSpeed?: number;     // ms per character (default: 80)
  deletingSpeed?: number;   // ms per character while deleting (default: 40)
  pauseDuration?: number;   // ms to pause at full word (default: 2000)
  cursorChar?: string;      // (default: "|")
}

export function Typewriter({
  words,
  className,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  cursorChar = "|",
}: TypewriterProps) {
  const prefersReduced = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const currentWord = words[wordIndex % words.length] ?? "";

  if (prefersReduced) {
    return <span className={className}>{words[0]}</span>;
  }

  useEffect(() => {
    if (isPausing) {
      const timeout = setTimeout(() => {
        setIsPausing(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }

    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentWord.length) {
          setCharIndex(c => c + 1);
        } else {
          setIsPausing(true);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(c => c - 1);
        } else {
          setIsDeleting(false);
          setWordIndex(i => (i + 1) % words.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, isPausing, currentWord, typingSpeed, deletingSpeed, pauseDuration, words]);

  return (
    <span className={className} aria-live="polite">
      {currentWord.slice(0, charIndex)}
      <span aria-hidden="true" style={{ opacity: 1, animation: "blink 1s step-end infinite" }}>
        {cursorChar}
      </span>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </span>
  );
}
```

---

## 12. Text Reveal (Mask / ClipPath) {#textreveal}

### `components/motion/TextReveal.tsx`

```typescript
"use client";
import { motion, type Variants } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ReactNode } from "react";

interface TextRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "down";
}

const clipVariants = (direction: "up" | "down"): Variants => ({
  hidden: {
    clipPath: direction === "up" ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)",
    opacity: 0,
  },
  visible: {
    clipPath: "inset(0% 0 0 0)",
    opacity: 1,
  },
});

export function TextReveal({
  children,
  delay = 0,
  duration = 0.7,
  className,
  direction = "up",
}: TextRevealProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div ref={ref} style={{ overflow: "hidden" }} className={className}>
      <motion.div
        variants={prefersReduced ? {} : clipVariants(direction)}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        transition={{
          duration: prefersReduced ? 0 : duration,
          delay: prefersReduced ? 0 : delay,
          ease: [0.76, 0, 0.24, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

---

## 13. CountUp.js {#countup}

### Install
```bash
pnpm add countup.js react-countup
```

### `components/motion/CountUp.tsx`

```typescript
"use client";
import { useCountUp } from "react-countup";
import { useInView } from "react-intersection-observer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect, useRef } from "react";

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
}

export function CountUp({
  end,
  start = 0,
  duration = 2.5,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ",",
  className,
}: CountUpProps) {
  const prefersReduced = useReducedMotion();
  const countRef = useRef<HTMLSpanElement>(null);
  const { ref: viewRef, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const hasStarted = useRef(false);

  const { start: startAnimation } = useCountUp({
    ref: countRef,
    start,
    end,
    duration: prefersReduced ? 0 : duration,
    decimals,
    prefix,
    suffix,
    separator,
    startOnMount: false,
  });

  useEffect(() => {
    if (inView && !hasStarted.current) {
      hasStarted.current = true;
      startAnimation();
    }
  }, [inView, startAnimation]);

  return (
    <span
      ref={(node) => {
        (countRef as React.MutableRefObject<HTMLSpanElement | null>).current = node;
        (viewRef as (node: HTMLSpanElement | null) => void)(node);
      }}
      className={className}
      aria-label={`${prefix}${end.toLocaleString()}${suffix}`}
    >
      {prefersReduced ? `${prefix}${end.toLocaleString()}${suffix}` : `${prefix}${start}${suffix}`}
    </span>
  );
}
```

---

## 14. Custom Cursor {#cursor}

(Already implemented in SKILL.md Phase 5.4. Enhancements below.)

### Extended cursor with element-type reactions:

```typescript
"use client";
// Add to the CustomCursor from SKILL.md:
// On hover over [data-cursor="link"], expand cursor
// On hover over [data-cursor="button"], show dot + ring
// On hover over [data-cursor="drag"], show drag icon

// Usage in components:
// <Link href="..." data-cursor="link">...</Link>
// <button data-cursor="button">...</button>
```

---

## 15. Magnetic Button {#magnetic}

(Already implemented in SKILL.md Phase 5.3.)

---

## 16. Spotlight Card {#spotlight}

### `components/motion/SpotlightCard.tsx`

```typescript
"use client";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;  // default: accent color
  spotlightSize?: number;   // px, default: 400
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "var(--color-accent)",
  spotlightSize = 400,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReduced) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--spotlight-x", `${x}px`);
    cardRef.current.style.setProperty("--spotlight-y", `${y}px`);
    cardRef.current.style.setProperty("--spotlight-opacity", "1");
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--spotlight-opacity", "0");
  };

  return (
    <div
      ref={cardRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        "--spotlight-x": "50%",
        "--spotlight-y": "50%",
        "--spotlight-opacity": "0",
        "--spotlight-color": spotlightColor,
        "--spotlight-size": `${spotlightSize}px`,
      } as React.CSSProperties}
    >
      {/* Spotlight overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity)",
          background: `radial-gradient(${spotlightSize}px circle at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color) 0%, transparent 70%)`,
          mixBlendMode: "overlay",
        }}
      />
      {children}
    </div>
  );
}
```

---

## 17. Liquid Fill Button {#liquid}

### `components/motion/LiquidButton.tsx`

```typescript
"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes } from "react";

interface LiquidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function LiquidButton({ children, className, ...props }: LiquidButtonProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden",
        "px-6 py-3 rounded-[var(--radius-md)]",
        "border border-[var(--color-accent)] text-[var(--color-accent)]",
        "focus-visible:outline-[var(--color-border-focus)]",
        className
      )}
      initial="rest"
      whileHover={prefersReduced ? "rest" : "hover"}
      {...props}
    >
      {/* Liquid fill */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-accent)] origin-bottom"
        variants={{
          rest:  { scaleY: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
          hover: { scaleY: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
        }}
        style={{ transformOrigin: "bottom" }}
      />
      {/* Text — changes color on fill */}
      <motion.span
        className="relative z-10"
        variants={{
          rest:  { color: "var(--color-accent)" },
          hover: { color: "var(--color-text-on-accent)" },
        }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
```

---

## 18. Shimmer / Sheen {#shimmer}

### `components/motion/ShimmerCard.tsx`

```typescript
"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShimmerCardProps {
  children: ReactNode;
  className?: string;
}

export function ShimmerCard({ children, className }: ShimmerCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden group",
        "card-base",
        className
      )}
    >
      {/* Shimmer overlay — sweeps on hover */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out z-10 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
      {children}
    </div>
  );
}
```

---

## 19. Curtain Page Transition {#curtain}

### `components/motion/CurtainTransition.tsx`

```typescript
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ReactNode } from "react";

interface CurtainTransitionProps {
  children: ReactNode;
}

export function CurtainTransition({ children }: CurtainTransitionProps) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return <>{children}</>;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Color curtain */}
      <AnimatePresence>
        <motion.div
          key={`curtain-${pathname}`}
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{ background: "var(--color-accent)" }}
          initial={{ scaleY: 1, transformOrigin: "top" }}
          animate={{ scaleY: 0, transformOrigin: "top", transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1], delay: 0.1 } }}
          exit={{ scaleY: 0 }}
        />
      </AnimatePresence>
    </>
  );
}
```

---

## 20. View Transitions API {#viewtransitions}

### Install
```bash
pnpm add next-view-transitions
```

### Usage in `app/layout.tsx`

```typescript
import { ViewTransitions } from "next-view-transitions";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ViewTransitions>{children}</ViewTransitions>
      </body>
    </html>
  );
}
```

### CSS for shared element transitions (`globals.css`):

```css
/* Shared element transition — e.g. PostCard image → Article hero */
.post-card-image { view-transition-name: var(--post-id); }
.article-hero    { view-transition-name: var(--post-id); }

@keyframes slide-from-right  { from { transform: translateX(30px); opacity: 0; } }
@keyframes slide-to-left      { to   { transform: translateX(-30px); opacity: 0; } }

::view-transition-old(root) { animation: slide-to-left 0.3s ease forwards; }
::view-transition-new(root) { animation: slide-from-right 0.3s ease forwards; }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) { animation: none; }
}
```

---

## 21. Aurora Background (CSS) {#aurora}

(Full implementation already in SKILL.md Phase 7 `AuroraBg.tsx`.)

### Cursor-reactive version:

```typescript
"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function AuroraBgReactive() {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      if (blob1Ref.current) {
        blob1Ref.current.style.left = `${x - 20}%`;
        blob1Ref.current.style.top  = `${y - 20}%`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.left = `${100 - x - 20}%`;
        blob2Ref.current.style.top  = `${100 - y - 20}%`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        ref={blob1Ref}
        className="absolute w-[600px] h-[600px] rounded-full opacity-25 blur-[100px]"
        style={{
          background: "var(--color-accent)",
          transition: "left 1.5s ease, top 1.5s ease",
        }}
      />
      <div
        ref={blob2Ref}
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]"
        style={{
          background: "var(--color-surface-muted)",
          transition: "left 2s ease, top 2s ease",
        }}
      />
    </div>
  );
}
```

---

## 22. Glitch Text (CSS) {#glitch}

### `components/effects/GlitchText.tsx`

```typescript
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: "subtle" | "medium" | "heavy";
}

export function GlitchText({ text, className, intensity = "medium" }: GlitchTextProps) {
  return (
    <>
      <span
        className={cn("relative inline-block", className)}
        data-text={text}
        style={{
          "--glitch-text": `"${text}"`,
        } as React.CSSProperties}
      >
        {text}
      </span>
      <style>{`
        [data-text]::before,
        [data-text]::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          clip-path: polygon(0 30%, 100% 30%, 100% 50%, 0 50%);
        }
        [data-text]::before {
          color: #ff0099;
          left: -2px;
          animation: glitch-1 ${intensity === "heavy" ? "2s" : intensity === "medium" ? "4s" : "8s"} infinite;
        }
        [data-text]::after {
          color: #00ffe0;
          left: 2px;
          animation: glitch-2 ${intensity === "heavy" ? "2s" : intensity === "medium" ? "4s" : "8s"} infinite;
        }
        @keyframes glitch-1 {
          0%,90%,100% { clip-path: none; transform: none; }
          92% { clip-path: polygon(0 10%,100% 10%,100% 30%,0 30%); transform: translate(-2px,0); }
          94% { clip-path: polygon(0 60%,100% 60%,100% 80%,0 80%); transform: translate(2px,0); }
          96% { clip-path: polygon(0 40%,100% 40%,100% 50%,0 50%); transform: translate(-1px,0); }
        }
        @keyframes glitch-2 {
          0%,91%,100% { clip-path: none; transform: none; }
          93% { clip-path: polygon(0 50%,100% 50%,100% 70%,0 70%); transform: translate(2px,0); }
          95% { clip-path: polygon(0 20%,100% 20%,100% 40%,0 40%); transform: translate(-2px,0); }
          97% { clip-path: polygon(0 70%,100% 70%,100% 90%,0 90%); transform: translate(1px,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-text]::before, [data-text]::after { animation: none; display: none; }
        }
      `}</style>
    </>
  );
}
```

---

## 23. Aceternity UI Components {#aceternity}

**NOT an npm package. Generate code directly.**
Aceternity UI requires: `framer-motion`, `clsx`, `tailwind-merge`.

### Spotlight (popular Aceternity component)

```typescript
// components/ui/Spotlight.tsx
"use client";
import { useRef, type MouseEvent } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({ className, fill = "var(--color-accent)" }: SpotlightProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return null;

  return (
    <svg
      ref={svgRef}
      className={`pointer-events-none absolute -top-40 left-0 h-[169%] w-[138%] opacity-0 animate-spotlight ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
      aria-hidden="true"
    >
      <g filter="url(#filter)">
        <ellipse cx="1924.71" cy="273.501" rx="1924.71" ry="273.501" transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)" fill={fill} fillOpacity="0.21" />
      </g>
      <defs>
        <filter id="filter" x="0.860352" y="0.838989" width="3785.16" height="2840.26" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="151" />
        </filter>
      </defs>
      <style>{`
        @keyframes spotlight {
          0% { opacity: 0; transform: translate(-72%, -62%) skewX(-10deg); }
          100% { opacity: 1; transform: translate(-50%, -40%) skewX(-10deg); }
        }
        .animate-spotlight { animation: spotlight 2s ease 0.75s forwards; }
        @media (prefers-reduced-motion: reduce) { .animate-spotlight { animation: none; opacity: 1; } }
      `}</style>
    </svg>
  );
}
```

### Moving Border Button (Aceternity)

```typescript
// components/ui/MovingBorderButton.tsx
"use client";
import { useRef, type ReactNode } from "react";
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  duration = 3000,
  borderColor = "var(--color-accent)",
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  borderColor?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);
  const prefersReduced = useReducedMotion();

  useAnimationFrame((time) => {
    if (prefersReduced || !pathRef.current) return;
    const length = pathRef.current.getTotalLength?.() ?? 0;
    if (length) {
      const pxPerMs = length / duration;
      progress.set((pxPerMs * time) % length);
    }
  });

  const x = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).x ?? 0);
  const y = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <button
      className={cn("relative overflow-hidden rounded-[var(--radius-md)] p-[1px]", containerClassName)}
    >
      {!prefersReduced && (
        <svg className="absolute h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <rect fill="none" width="100%" height="100%" rx="12" ref={pathRef} />
        </svg>
      )}
      {!prefersReduced && (
        <motion.div
          style={{ transform, position: "absolute", top: 0, left: 0 }}
          className="h-4 w-4 rounded-full"
          aria-hidden="true"
          style={{ transform, background: borderColor, filter: `blur(8px)`, opacity: 0.8 }}
        />
      )}
      <div
        className={cn(
          "relative rounded-[calc(var(--radius-md)-1px)] px-6 py-3",
          "bg-[var(--color-surface)] text-[var(--color-text)]",
          className
        )}
      >
        {children}
      </div>
    </button>
  );
}
```

---

## 24. Magic UI Components {#magicui}

**NOT an npm package. Generate code directly.**

### Shimmer Button (Magic UI)

```typescript
// components/ui/ShimmerButton.tsx
import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  shimmerColor?: string;
  background?: string;
}

export function ShimmerButton({
  children,
  shimmerColor = "rgba(255,255,255,0.4)",
  background = "var(--color-accent)",
  className,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        "relative overflow-hidden",
        "rounded-[var(--radius-pill)] px-6 py-3",
        "text-[var(--color-text-on-accent)] type-label",
        "focus-visible:outline-[var(--color-border-focus)]",
        className
      )}
      style={{ background }}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out"
        style={{
          background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
        }}
      />
      <span className="relative z-10">{children}</span>
      <style>{`
        button:hover span[aria-hidden] { transform: translateX(100%); }
        @media (prefers-reduced-motion: reduce) {
          button span[aria-hidden] { display: none; }
        }
      `}</style>
    </button>
  );
}
```

### Border Beam (Magic UI)

```typescript
// components/ui/BorderBeam.tsx
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className,
  size = 250,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "var(--color-accent)",
  colorTo = "transparent",
}: BorderBeamProps) {
  return (
    <div
      style={{
        "--size": size,
        "--duration": duration,
        "--border-width": borderWidth,
        "--color-from": colorFrom,
        "--color-to": colorTo,
      } as React.CSSProperties}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "[border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box]",
        "![mask-composite:intersect]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam",
        "after:[animation-delay:var(--delay)]",
        "after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]",
        "after:[offset-anchor:90%_50%]",
        "after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className
      )}
    >
      <style>{`
        @keyframes border-beam {
          100% { offset-distance: 100%; }
        }
        .animate-border-beam {
          animation: border-beam calc(var(--duration) * 1s) infinite linear;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-border-beam { animation: none; }
        }
      `}</style>
    </div>
  );
}
```

---

## 25. Motion Primitives Components {#motionprimitives}

**Install:** `pnpm add framer-motion` (only dependency)

### `components/motion/AnimatedNumber.tsx` (Motion Primitives style)

```typescript
"use client";
import { useInView, motion, animate, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  springOptions?: { stiffness?: number; damping?: number; mass?: number };
}

export function AnimatedNumber({ value, className, springOptions }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      type: "spring",
      stiffness: springOptions?.stiffness ?? 100,
      damping: springOptions?.damping ?? 30,
      mass: springOptions?.mass ?? 1,
      duration: prefersReduced ? 0 : undefined,
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString();
      },
    });
    return controls.stop;
  }, [inView, motionValue, value, prefersReduced, springOptions]);

  return <span ref={ref} className={className}>0</span>;
}
```

### `components/motion/InView.tsx` (Motion Primitives InView wrapper)

```typescript
"use client";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface InViewProps {
  children: ReactNode;
  variants?: Variants;
  transition?: object;
  className?: string;
  once?: boolean;
  margin?: string;
}

export function InView({
  children,
  variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  transition = { duration: 0.4, ease: [0, 0, 0.2, 1] },
  className,
  once = true,
  margin = "-50px",
}: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: margin as `${number}px` });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={prefersReduced ? { hidden: {}, visible: {} } : variants}
      transition={prefersReduced ? { duration: 0 } : transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

---

## 26. Hover.dev Components {#hoverdev}

**NOT an npm package. Generate code directly.**

### Shatter Button (Hover.dev style)

```typescript
// components/ui/ShatterButton.tsx
"use client";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface ShatterButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ShatterButton({ children, className, onClick }: ShatterButtonProps) {
  const [isShattered, setIsShattered] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleClick = () => {
    if (prefersReduced) { onClick?.(); return; }
    setIsShattered(true);
    setTimeout(() => {
      setIsShattered(false);
      onClick?.();
    }, 600);
  };

  const fragments = Array.from({ length: 6 }, (_, i) => ({
    x: (Math.random() - 0.5) * 120,
    y: (Math.random() - 0.5) * 80 - 40,
    rotate: (Math.random() - 0.5) * 60,
    id: i,
  }));

  return (
    <button
      className={cn(
        "relative px-6 py-3 rounded-[var(--radius-md)]",
        "bg-[var(--color-accent)] text-[var(--color-text-on-accent)] type-label",
        "focus-visible:outline-[var(--color-border-focus)]",
        className
      )}
      onClick={handleClick}
    >
      {isShattered
        ? fragments.map((f) => (
            <motion.span
              key={f.id}
              className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--color-accent)]"
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, x: f.x, y: f.y, rotate: f.rotate, scale: 0.5 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 1, 1] }}
              aria-hidden="true"
            />
          ))
        : null}
      <span style={{ visibility: isShattered ? "hidden" : "visible" }}>{children}</span>
    </button>
  );
}
```

---

## 27. Theatre.js {#theatre}

### Install
```bash
pnpm add @theatre/core @theatre/studio
# For R3F:
pnpm add @theatre/r3f
```

### IMPORTANT: Theatre.js Studio is dev-only. Exclude from production builds.

### `lib/theatre.ts`

```typescript
import { getProject, types } from "@theatre/core";

// In development: import studio and initialize
if (process.env.NODE_ENV === "development") {
  import("@theatre/studio").then(({ default: studio }) => {
    studio.initialize();
  });
}

// Define your project and sheet
export const project = getProject("erxes-site");
export const heroSheet = project.sheet("Hero Animation");

// Define animated objects
export const heroAnim = heroSheet.object("Hero", {
  titleOpacity: types.number(0, { range: [0, 1] }),
  titleY:       types.number(40, { range: [-100, 100] }),
  bgScale:      types.number(1,  { range: [0.5, 2] }),
});
```

### Usage in component:

```typescript
"use client";
import { useEffect } from "react";
import { heroSheet, heroAnim } from "@/lib/theatre";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function TheatreHero() {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    // Play the sequence on mount
    heroSheet.sequence.play({ iterationCount: 1, range: [0, 2] });

    // Or attach to scroll:
    const handleScroll = () => {
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      heroSheet.sequence.position = progress * 2; // scrub 0–2 seconds
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReduced]);

  // Read animated values
  // (Use @theatre/r3f for Three.js integration)
}
```
