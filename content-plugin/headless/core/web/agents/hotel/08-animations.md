# TASK 08 — Animations & Motion

> Scope: every animation, scroll effect, and carousel in the repo — what animates, which library
> drives it, the literal source, and the generalized recipes a consuming agent can regenerate.
>
> This report does **not** re-document the components themselves (those are in
> `03a-layouts.md` / `03b-features.md`, referenced as `03a/03b §x`); it documents the **motion layer** only and
> gives working recipes. Booking/payment flows are in `06-*`, data layer in `04-*`.
>
> Values are **REDACTED** where secret. Anything not found is `NOT FOUND IN CODE`.

## TABLE OF CONTENTS

1. [Libraries & Setup](#1-libraries--setup)
2. [Inventory of Animations & Interactions](#2-inventory)
3. [Recipes](#3-recipes)
4. [Scroll System](#4-scroll-system)
5. [CSS & Tailwind Animation Surface](#5-css--tailwind-animation-surface)
6. [Performance & Accessibility](#6-performance--accessibility)
7. [Motion Tokens Table](#7-motion-tokens-table)
8. [REPRODUCE vs AVOID Rules](#8-reproduce-vs-avoid-rules)
9. [Brand-Specific Hardcoding Audit](#9-brand-specific-hardcoding-audit)
10. [Open Questions / Uncertainties](#10-open-questions--uncertainties)

---

## 1. LIBRARIES & SETUP

Source of truth: `package.json` (declared ranges) + `package-lock.json` (resolved).

| Library | Declared | Locked | Role | Setup / registration |
|---|---|---|---|---|
| `framer-motion` | `^12.23.9` | `12.23.24` | scroll-linked + enter/exit + spring UI anims | No provider/plugin — used directly in 9 client files (§2) |
| `embla-carousel-react` | `^8.6.0` | `8.6.0` | every carousel (17 components) | Wrapped once in `ui/carousel.tsx` (`03a §2.1 row 20`); clients use `<Carousel>` |
| `embla-carousel-autoplay` | `^8.6.0` | `8.6.0` | autoplay plugin | Registered **inline per carousel** via `plugins={[autoplay.current]}` where the instance is a `useRef` memo (`§2`) |
| `lottie-react` | `^2.4.1` | `2.4.1` | animated page loader | Single consumer: `src/components/ui/MainLoader.tsx` + `public/animation/mainLoader.json` |
| `lenis` | `^1.3.9` | `1.3.14` | smooth scroll | **DEAD** — zero imports in `src/` (§8 AVOID A-02) |
| `tw-animate-css` | `^1.3.6` | `1.4.0` | Tailwind v4 animation utilities (`animate-in`, `animate-out`, `animate-accordion-up/down`) | `@import "tw-animate-css";` at `src/app/[locale]/globals.css:2`, directly after `@import "tailwindcss"` |
| `tailwindcss` | `^4` | `4.1.17` | styling + built-in `animate-pulse`/`animate-spin` | **CSS-first** (`@theme inline`), **no `tailwind.config.*` file exists** |

Not present: **gsap**, **ScrollTrigger**, **swiper**, **react-intersection-observer**, **@react-spring**, **motion/react**.
There is **no global animation provider**; every motion effect is local to a component.

### 1.1 framer-motion consumer list (exact files)

```
src/components/activities/ActivitiesAccordion.tsx        AnimatePresence + motion item (layout collapse)
src/components/contact-us/FaqDatas.tsx                   AnimatePresence + motion item + hover/tap button
src/components/layout/Header.tsx                         header collapse, drawer, staggered nav, hover/tap (03a §3.2)
src/components/layout/SecondaryHeader.tsx                same drawer/stagger (03a §3.3)
src/components/layout/Reserve.tsx                        booking-bar panel / FAB spring swap (03a §3.5)
src/components/ReviewCard.tsx                            card + stars + copy enter animation
src/components/ScrollStack.tsx                           the scroll-scrub card stack (03a §1.4)
src/components/spa-wellness/SpaAccordton.tsx             AnimatePresence accordion items
src/containers/auth/auth-container.tsx                   login⇄signup slide transitions
```

### 1.2 embla-carousel consumer list (carousel = `ui/carousel.tsx` wrapper)

`Accommodation`, `LodgeStays`, `JourneySection`, `GallerySection`, `NewsSection`, `MemoriesSection`
(no autoplay), `VideoPageLayout` (hero), `accommodationDetailPage`, `ActivitiesHero`,
`ActivitiesImages`, `ActivitiesAccordion`(none — accordion), `GridImages`, `SpaImages`,
`SustainabilitySection`, `ProjectsSection` (fund), `MerchHero`, `MerchProductsCarousel`,
`authImages/images`, `ReservationSummary`, `lodgeStaysDetailPage`. Autoplay enabled in all but
`MemoriesSection`, `GallerySection`, `ReservationSummary`, `lodgeStaysDetailPage`,
`profileBookingDetailPage`, `merchPage`.

> **Feature gating:** motion consumers that belong to a gated feature are skipped when that feature is
> OFF — `ReviewCard` / `MemoriesSection` → `features.google_reviews`; `spa-wellness/SpaAccordton` →
> `features.spaWellness`; the pay-at-property form/modal and QR/checking dialogs →
> `features.pay_at_property`.

### 1.3 Version pin notes

- `framer-motion` on React 19 / Next 15.4 here uses the `framer-motion` package name (not the newer
  `motion` package). Keep the same import unless migrating intentionally.
- Embla v8 API (`useEmblaCarousel`, `EmblaOptionsType` via `UseEmblaCarouselType`) — v9 changed
  plugin signature, so pin `^8.6.0`.

---

## 2. INVENTORY

Legend — trigger: **mount** = on component mount, **scroll** = window/target scroll, **in-view** =
whileInView/useInView, **hover**/**tap** = pointer, **load** = data loading→ready. Library: FM =
framer-motion, EM = embla, CSS = Tailwind/plain CSS, LO = lottie.

### 2.1 framer-motion inventory

| # | File | Component | Trigger | What animates | Values (duration / ease / delay / distance) | Lib |
|---|---|---|---|---|---|---|
| 1 | `ScrollStack.tsx:33-44` | `StackCard` | **scroll (target)** | sticky card `y` scrubbed by scroll progress | offset `["start 65%","start 45%"]`; `y` `[120, index*gap]`; gap `72`px desktop, `40`px mobile (`:18-19`); sticky `top-20 md:top-28 lg:top-32`; `zIndex index+1`; container height `items*80vh` (mobile 70vh) | FM `useScroll`+`useTransform` |
| 2 | `Header.tsx:142-155` | `motion.header` | **scroll** (window >10px, `:19-29`) | background + padding collapse | `backgroundColor` rgba transitions 1↔0; `paddingTop` 20↔36px; `duration:0.3`; `initial={false}` | FM |
| 3 | `Header.tsx:186-216` | nav items | **mount** | fade+drop in | `opacity 0, y:-10`→`1,0`, `delay 0.1+index*0.05` | FM |
| 4 | `Header.tsx:211-216` | nav underline | **hover** | width 0→100% | `duration:0.3` | FM |
| 5 | `Header.tsx:159-178` | logo | **hover/tap** | scale | hover 1.05 / tap 0.95; `type:"spring", stiffness:300, damping:15` | FM |
| 6 | `Header.tsx:239-252` | right side controls | **mount** | slide+fade from right | `x 20`→0, `delay 0.3`, spring `stiffness:300, damping:20` | FM |
| 7 | `Header.tsx:254-280` | hamburger | **hover/tap/clicks** | scale + icon rotation | hover 1.05 / tap 0.95; icon rotate 180 (0↔180°), `duration:0.3, ease:"easeInOut"` | FM |
| 8 | `Header.tsx:284-295` | drawer overlay | **open/close** | opacity | `duration:0.3` (in) / `0.25` (out), default `AnimatePresence` | FM |
| 9 | `Header.tsx:297-419` | mobile drawer panel | **open/close** | slide from right + stagger items | panel `x:"100%"→0`, opacity; exit reverse (`duration 0.2`/`0.15` opacity w/ delay 0.05); `AnimatePresence mode="wait"` | FM |
| 10 | `Header.tsx:86-109,352-359` | `navItemVariants` (staggered list) | **mount** | each nav item slide+fade | `hidden {x:30, opacity:0, scale:0.95}`, `visible(i){delay:0.1+0.08*i}`, `exit(i){x:20, opacity:0, scale:0.95, duration:0.15, delay:(len-i-1)*0.03}` | FM variants + `custom` |
| 11 | `Header.tsx:309-348` | drawer header + close button | **mount/hover/tap** | slide down + rotate | header spring `stiffness:300, damping:25, delay:0.1`; close hover `scale:1.1, rotate:90`, tap 0.9 | FM |
| 12 | `Header.tsx:373-379` | mobile link accent bar | **hover** | `scaleY 0→1` (origin top) | `duration:0.3` | FM |
| 13 | `Header.tsx:41-59` (Shared with) | `overlayVariants` | open/close | fade | in 0.3 / out 0.25 | FM |
| 14 | `SecondaryHeader.tsx:75-83,150-233` | same drawer family (variant `mode`, no `mode="wait"`, exit `duration:0.2`) | open/close/mount | slide+fade, staggered | duplicates Header values (§2.2 note) | FM |
| 15 | `Reserve.tsx:142-291` | booking bar | **open/close** (localStorage `reserve_open`, `:50`) | panel drop + FAB pop | panel `opacity 0,y:-16`→`1,0`; spring `stiffness:300,damping:26,mass:0.8`; exit same; FAB spring `stiffness:260,damping:20,mass:0.7`, `y:12`, scale 0.95; `AnimatePresence initial={false} mode="wait"` | FM |
| 16 | `ReviewCard.tsx:27-35` | review card | **mount** (each index change remounts) | scale+fade | `scale 0.95,opacity 0`→`1,1`, `duration:0.4, ease:[0.25,0.46,0.45,0.94]` | FM |
| 17 | `ReviewCard.tsx:78-103` | stars | **mount,** stagger | spring pop | each star `type:"spring",stiffness:200`, `delay:0.3+i*0.1`, `duration:0.4` | FM |
| 18 | `ReviewCard.tsx:105-130` | quote + author | **mount** (delayed stagger) | fade-up | `y:20`, dels `0.4`/`0.6`, `0.6`/`0.5` | FM |
| 19 | `ReviewCard.tsx:36-62` | prev/next chevrons | hover/tap | scale | hover 1.1, tap 0.95 | FM |
| 20 | `ActivitiesAccordion.tsx:142-148` + `SpaAccordton.tsx:141-147` | accordion items | **mount** | fade-up + **layout collapse on exit** | `initial {opacity:0,y:8}`→`1,0`; `exit {opacity:0,height:0,marginTop:0,marginBottom:0}`; `duration:0.25, ease:"easeOut"`; `layout`; `AnimatePresence initial={false}` | FM |
| 21 | `FaqDatas.tsx:85-97,127-135` | FAQ items + show-more button | mount/hover/tap | items same as 20 (with visibleCount slicing) | same 0.25/easeOut + `layout`; button `whileTap scale:0.98`, `whileHover y:-1` | FM |
| 22 | `auth-container.tsx:15-36,233-281` | login⇄signup panel | **click** (direction via `setDirection`) | slide transition | variants `enter(d){x:d>0?300:-300,opacity:0}`, exit mirrored; `AnimatePresence mode="wait" custom={direction}`; spring `stiffness:300, damping:30`, `opacity.duration:0.3` | FM |

### 2.2 embla-carousel inventory (motion-relevant facts)

| # | File | Carousel type | Autoplay | Dots / navigation | Notes |
|---|---|---|---|---|---|
| 1 | `VideoPageLayout.tsx:44-95` | hero bg images | `Autoplay({delay:4000, stopOnInteraction:false, stopOnMouseEnter:false})` in `useRef` | none | fills hero (`h-screen`); `plugins` toggled off when `images.length<=1` (`:66`); `<MainVideo/>` hero is **commented out** (`:61`) |
| 2 | `Accommodation.tsx:83-120,241-268` | room cards | `Autoplay({delay:5000,…})` in `useRef`; `stop`/`play` wired to mouse/touch handlers | **dots** `active===i`(`:252-263`): `w-6 bg-gray-400` vs `w-2 bg-gray-400/30`, `transition-all` | **mobile carousel / desktop 2-col grid pair** (`lg:hidden` vs `hidden lg:grid`) |
| 3 | `JourneySection.tsx:24-39,57-63` | journey image (per item) | `Autoplay({delay:6000})` | **number+progress dots** (`current`,`count`, scrollTo index) | inside alternating rows (`index%2 fixed-reverse`) |
| 4 | `MerchHero.tsx:42-61` | hero slides | `Autoplay({delay:5000,…})` | dots (`active`) | |
| 5 | `MerchProductsCarousel.tsx:26-45,99-160` | products | `Autoplay({delay:5000, stopOnInteraction:true, stopOnMouseEnter:true})` | right arrow (`api?.scrollNext()`) | grid pair variant too |
| 6 | `ProjectsSection.tsx:26` (fund) | project cards | `Autoplay({delay:5000, stopOnInteraction:false, stopOnMouseEnter:true})` | prev/next buttons (`CarouselPrevious/Next`) | |
| 7 | `GallerySection.tsx`, `MemoriesSection.tsx` | gallery / reviews | **no autoplay** | arrows / `ReviewCard` prev-next callbacks | `MemoriesSection` remounts `ReviewCard` per slide → FM enter on each slide |
| 8 | `authImages/images.tsx:62-107` | auth panel slides | `Autoplay({delay:…})` | **clickable dots** `scrollTo(index)`, `bg-white scale-125` active | `aria-label` per dot |
| 9 | `Accommodation/LodgeStays/News/Spa/Activities/Sustainability`, `accommodationDetailPage`, `GridImages` | image/card carousels | mostly `delay:5000` | `active===i` dots | same dot recipe |
| — | `ui/carousel.tsx` | wrapper | — | — | shadcn embla wrapper (03a §2.1). `CarouselItem basis-full pl-4` etc. See Recipe 3.6 for dot wiring |

Autoplay delay histogram: **4000ms ×2** (VideoPageLayout, authImages), **5000ms ×10**, **6000ms ×3**
(JourneySection). `stopOnInteraction` variants: false (heroes) vs true (product grid).

### 2.3 CSS / Tailwind animation inventory

| Pattern | Count | Where | Meaning |
|---|---|---|---|
| `animate-pulse` | 43 | every skeleton + `VideoPageLayout:57` hero blur bg + `auth-container:226-227` decorative dots | loading placeholders |
| `animate-spin` | 11 | `current-user`, `private-route`, `personal.tsx`, `PaymentCheckingDialog`, `ReviewSection` | loaders |
| `animate-in fade-in-0 / zoom-in-95 / slide-in-from-*` (tw-animate-css) | 21 | `src/components/profile/personal.tsx` (form fields, avatar badge, submit row) | entrance utilities |
| `data-[state=open]:animate-accordion-up / …down` | 1 file | `ui/accordion.tsx:58` (Radix AccordionContent) | open/close slide |
| `transition-all` / `-colors` / `-transform` / `-opacity` / `-shadow` | 87 / 86 / 16 / 6 / 3 | everywhere | Tailwind transitions |
| `hover:scale-105` / `group-hover:scale-105` (image zoom) | ~12 | `TourCard:27 (500ms)`, `newsDetailPage:132 (700ms)`, `lodgeStaysDetailPage:110,133 (500/300)`, `FeaturedMerch:83`, `MerchProductsCarousel:117`, `personal.tsx`, merch/dining buttons | hover zoom |
| `.animate-kenburns` (`globals.css:12-22`) | **0 usages in TSX** | dead definition | 8s ease-out scale 1.05→1 |
| `animate-fadeIn` (`ContactForm.tsx:188`) | 1 | no `@keyframes fadeIn` found | likely inert class |

### 2.4 Other motion/media

- **Lottie loader** — `MainLoader.tsx` (`useLottie({ animationData, loop:true })`), `View` inside
  `h-16 w-16`; used for detail-page loading text.
- **Hero video** — `MainVideo.tsx` (`muted autoPlay playsInline` `/video/main.mp4`); **commented
  out** at its only call site (`VideoPageLayout.tsx:61`), kept as imported dead code.
- **Global CSS behaviors** — `*{scroll-behavior:smooth}` (`globals.css:9-11`); `html{overflow-x:hidden; scrollbar-width:none}` (`globals.css:214-222`); erxes messenger z-index/position overrides + mobile sizing at bottom (booking flow conflict mitigation).

---

## 3. RECIPES

Full working source for each reusable effect, followed by a generalized version. Component-level
docs already live in `03-*`; these excerpts exist so the motion code can be copied literally.

### 3.1 Hero stacked-card scroll effect (the signature `ScrollStack`)

**Actual source — `src/components/ScrollStack.tsx` (full):**

```tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "./ui/image"
import { Sun } from "lucide-react"

interface ScrollStackItem {
  thumbnail: { url: string }
  title: string
  excerpt: string
}

interface ScrollStackProps {
  items: ScrollStackItem[]
}

const DESKTOP_LAYER_GAP = 72
const MOBILE_LAYER_GAP = 40

function StackCard({ item, index, total, gap }: {
  item: ScrollStackItem; index: number; total: number; gap: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start 65%", "start 45%"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [120, index * gap])

  return (
    <motion.div
      ref={cardRef}
      style={{ y, zIndex: index + 1 }}
      className='sticky top-20 md:top-28 lg:top-32'
    >
      <div className='relative overflow-hidden rounded-[24px] md:rounded-[28px] shadow-2xl ring-1 ring-black/5 bg-black'>
        <Image src={item.thumbnail.url} alt={item.title}
          className='w-full h-[50vh] md:h-[60vh] lg:max-h-[620px] object-cover'
          width={1920} height={1080} />
        <div className='absolute top-0 left-0 w-full h-full bg-black/30'></div>
        <div className='absolute left-6 top-6 z-[1]'>
          <div className='flex items-center gap-2'>
            <div className='rounded-full border border-white backdrop-blur-sm text-white p-1 lg:p-2'>
              <Sun className='size-4 lg:size-5' />
            </div>
            <div className='rounded-full border border-white backdrop-blur-sm text-white px-2 lg:px-2 lg:py-1.5'>
              <span className='text-[10px] lg:text-xs font-roboto uppercase'>
                {item?.title || "HEALING OASIS HIDDEN AMONG THE DUNES"}
              </span>
            </div>
          </div>
        </div>
        <div className='absolute inset-x-0 bottom-0 p-4 md:p-6 lg:p-8 text-white'>
          <p className='text-sm md:text-base lg:text-lg font-roboto leading-5 lg:leading-6 text-white'>
            {item?.excerpt || "..."}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

const ScrollStack: React.FC<ScrollStackProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)")
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener?.("change", update)
      ; (mql as any).addListener?.(update)
    return () => {
      mql.removeEventListener?.("change", update)
        ; (mql as any).removeListener?.(update)
    }
  }, [])

  const gap = isMobile ? MOBILE_LAYER_GAP : DESKTOP_LAYER_GAP
  const heightPerItemVh = isMobile ? 70 : 80

  return (
    <div ref={containerRef} className='relative mb-24 md:mb-44'
      style={{ height: `${Math.max(items.length, 1) * heightPerItemVh}vh` }} >
      {items.map((item, index) => (
        <StackCard key={index} item={item} index={index} total={items.length} gap={gap} />
      ))}
    </div>
  )
}

export default ScrollStack
```

**Generalized recipe** (scroll-scrubbed sticky fan, no brand):

```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const LAYER_GAP = 72;            // px per layer; watch mobile → 40

export function ScrollStackR<const T extends { title: string; url: string }>({
  items,
}: { items: T[] }) {
  return (
    <div style={{ height: `${items.length * 80}vh` }} className="relative">
      {items.map((item, index) => (
        <StackItemR key={item.title} item={item} index={index} />
      ))}
    </div>
  );
}

function StackItemR<const T>({ item, index }: { item: T; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "start 45%"],   // trigger when card top crosses 65%→45% of viewport
  });
  const y = useTransform(scrollYProgress, [0, 1], [120, index * LAYER_GAP]);
  return (
    <motion.div ref={ref} style={{ y, zIndex: index + 1 }}
      className="sticky top-20 md:top-28 rounded-[24px] overflow-hidden">
      {/* contents */}
    </motion.div>
  );
}
```

Physics to reproduce: card is `sticky` (scrolls normally until pinned, then fans via `y`), the
container's extra height (`items×80vh`) is what creates the long scroll runway, and further layers
render *below* it in DOM but overlap because the parent height reserves space.

### 3.2 Fade-up on scroll / mount & staggered lists

There is **no `whileInView`/`useInView`** anywhere — all fade-ups here happen on **component mount**
(the closest to "fade-up on scroll" is the sticky fan above, which is scroll-*scrubbed*, not
scroll-*triggered*). Two canonical mount patterns:

**A) Staggered nav list — `src/components/layout/Header.tsx:86-109,352-359`:**

```tsx
const navItemVariants = {
  hidden: { x: 30, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    x: 0, opacity: 1, scale: 1,
    transition: { delay: 0.1 + 0.08 * i },
  }),
  exit: (i: number) => ({
    x: 20, opacity: 0, scale: 0.95,
    transition: { duration: 0.15, delay: (cmsMenus.length - i - 1) * 0.03 },
  }),
};
// usage:
{topLevelMenus.map((item, index) => (
  <motion.div key={item._id} custom={index}
    initial="hidden" animate="visible" exit="exit" variants={navItemVariants}>
    {/* link */}
  </motion.div>
))}
```

**B) Delayed fade-up chain — `src/components/ReviewCard.tsx:78-130`:**

```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2, duration: 0.5 }}>   {/* stars row    */}
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4, duration: 0.6 }}>   {/* quote        */}
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.6, duration: 0.5 }}>   {/* author/date  */}
```

**Generalized** (element provides its own `variants` + `custom` for index; wrap group in
`<AnimatePresence initial={false}>` when list mutates):

```tsx
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 + 0.1 } }),
};
// <motion.div custom={i} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>…
// NOTE: whileInView + viewport does NOT exist in this repo — it is the recommended upgrade (see §6).
```

### 3.3 Mobile drawer (AnimatePresence + `navItemVariants`)

Full working pattern from `src/components/layout/Header.tsx:284-419` (identical logic in
`SecondaryHeader.tsx:150-233`, without `mode="wait"`):

```tsx
const menuVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { opacity: { duration: 0.2 } } },
  exit: { x: "100%", opacity: 0, transition: { opacity: { duration: 0.15, delay: 0.05 } } },
};
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

{/* overlay */}
<AnimatePresence>
  {isMenuOpen && (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={overlayVariants}
      className="fixed inset-0 z-40 xl:hidden xl:bg-black/40" onClick={() => setIsMenuOpen(false)} />
  )}
</AnimatePresence>

{/* panel */}
<AnimatePresence mode="wait">
  {isMenuOpen && (
    <motion.div id="mobile-menu" role="dialog" aria-modal="true"
      initial="hidden" animate="visible" exit="exit" variants={menuVariants}
      className="xl:hidden absolute top-0 right-0 z-[60] w-80 max-w-[85vw] bg-white shadow-2xl
                 border-l border-gray-100/50 flex flex-col h-dvh">
      {/* header: spring in */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}>
        {/* logo + close */}
      </motion.div>
      <nav>
        {topLevelMenus.map((item, index) => (
          <motion.div key={item._id} custom={index} initial="hidden" animate="visible" exit="exit"
            variants={navItemVariants}>
            {/* main link + children (children appear after parent, no own variants) */}
          </motion.div>
        ))}
      </nav>
      {/* footer: fade up delay 0.4 */}
    </motion.div>
  )}
</AnimatePresence>
```

Body scroll lock: `useEffect(() => { document.body.classList.toggle("overflow-hidden", isMenuOpen) }, [isMenuOpen])` (`Header.tsx:31-38`).

**Generalized drawer** (SSR-safe, correct unmount order):

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";

export const drawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};
export const overlayVariants = {
  hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 },
};
```
Use exactly one `AnimatePresence` per keyed panel, close the overlay **first** (it has lower
`z-index` than the panel so it never covers the drawer), keep `mode` consistent on a per-drawer basis,
and reverse-order the exit stagger (`(length - i - 1) * 0.03`) so items "fall back" in DOM order.

### 3.4 Booking-bar show/hide (Reserve panel ⇄ FAB + footer hide)

**Floating bar swap — `src/components/layout/Reserve.tsx:142-291` (motion-relevant excerpt):**

```tsx
<AnimatePresence initial={false} mode="wait">
  {(fixedOpen ? true : open) ? (
    <motion.div key="reserve-panel"
      initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.8 }}
      className="relative flex flex-col lg:flex-row items-center gap-4 … rounded-[25px] sm:rounded-[50px] bg-white shadow-[0_2px_6.1px_0_rgba(0,0,0,0.25)]">
      {/* DatePicker ×2, RoomCounter, GuestCounter, Reserve button */}
    </motion.div>
  ) : (
    !fixedOpen && (
      <MotionButton key="reserve-fab" type="button" onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.7 }}
        className="inline-flex fixed right-4 z-50 gap-2 items-center px-4 py-2 text-white bg-black rounded-full shadow-lg bottom-18 hover:bg-black/90">
        <Calendar className="w-4 h-4" />
        <span className="font-medium">{t("Reserve")}</span>
      </MotionButton>
    )
  )}
</AnimatePresence>
```

Persistence: `open` initialized from `localStorage.getItem("reserve_open")` and persisted on change
(`Reserve.tsx:74-83,126-133`). `MotionButton = motion(Button)` (`:48`) is the trick for a motion
wrapped shadcn button.

**Footer-attention hide — `src/components/clientPages/VideoPageLayout.tsx:101-109`:**

```tsx
{showReserve && (
  <Reserve
    className={`fixed right-0 left-0 bottom-4 px-4 md:px-0 lg:px-0 sm:bottom-4 lg:bottom-4
      transition-all duration-500 ease-in-out transform z-40 ${
      isFooterVisible
        ? "opacity-0 pointer-events-none translate-y-full"
        : "opacity-100 translate-y-0"}`}
  />
)}
```

where `isFooterVisible` = `useFooterVisibility()` (see §4).

**Generalized hide-on-crossing pattern:** keep the element in DOM, disable pointer events and slide
it out of viewport with `translate-y-full`, drive the boolean from a scroll/hover signal — cheaper
than mounting/unmounting a heavy form on every scroll.

### 3.5 Page transitions (auth login⇄signup)

**`src/containers/auth/auth-container.tsx:15-36,233-281`:**

```tsx
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};
const [direction, setDirection] = useState(0);
const switchToSignup = () => { setDirection(1); setCurrentView("signup"); };
// (switchToLogin → setDirection(-1))

<AnimatePresence mode='wait' custom={direction}>
  <motion.div
    key={currentView}
    custom={direction}
    variants={slideVariants}
    initial='enter' animate='center' exit='exit'
    transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }}>
    {currentView === "login" ? <LoginForm /> : <RegisterForm />}
  </motion.div>
</AnimatePresence>
```

**Generalized:** direction-aware variants + `custom` + `mode="wait"`; `key` on the *view id*; only
the `x` spring is tweened, opacity is plain duration — the two-part `transition` object matters.

### 3.6 Carousel/grid pair with dot indicator (Embla)

**Mobile-carousel ⇄ desktop-grid + dots — `src/components/Accommodation.tsx:241-268`:**

```tsx
const [api, setApi] = useState<CarouselApi | null>(null);
const [active, setActive] = useState(0);

useEffect(() => {
  if (!api) return;
  const onSelect = () => setActive(api.selectedScrollSnap());
  onSelect();
  api.on("select", onSelect);
  api.on("reInit", onSelect);
  return () => { api.off("select", onSelect); api.off("reInit", onSelect); };
}, [api]);

<div className="lg:hidden">
  <Carousel setApi={setApi} opts={{ loop: true }} plugins={[autoplayRef.current]} className="w-full"
    onMouseEnter={() => autoplayRef.current?.stop?.()}
    onMouseLeave={() => autoplayRef.current?.play?.()}
    onTouchStart={() => autoplayRef.current?.stop?.()}
    onTouchEnd={() => autoplayRef.current?.play?.()}
    onTouchCancel={() => autoplayRef.current?.play?.()}>
    <CarouselContent>
      {limitedAccommodation.map((item) => (
        <CarouselItem key={item._id} className="basis-full"><AccommodationCard item={item} /></CarouselItem>
      ))}
    </CarouselContent>
  </Carousel>
  {limitedAccommodation.length > 1 && (
    <div className="flex gap-2 justify-center items-center mt-2">
      {limitedAccommodation.map((_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${
          active === i ? "w-6 bg-gray-400" : "w-2 bg-gray-400/30"}`} />
      ))}
    </div>
  )}
</div>

<div className="hidden grid-cols-2 gap-6 lg:grid">
  {limitedAccommodation.map((item) => <AccommodationCard key={item._id} item={item} />)}
</div>
```

Autoplay memo pattern each carousel uses:

```tsx
import Autoplay from "embla-carousel-autoplay";
const autoplayRef = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: false }));
```

**Clickable dots variant — `src/components/authImages/images.tsx:95-107`:**

```tsx
{imagesToDisplay.length > 1 && (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
    {imagesToDisplay.map((_, index) => (
      <button key={index} aria-label={`Go to slide ${index + 1}`}
        className={`w-2 h-2 rounded-full transition-all duration-300 ${
          index === current ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"}`}
        onClick={() => api?.scrollTo(index)} />
    ))}
  </div>
)}
```

**Generalized Embla dots hook:**

```tsx
export function useEmblaActive(api: CarouselApi | null) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActive(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); api.off("reInit", onSelect); };
  }, [api]);
  return active;
}
// dots: active === i ? "w-6 bg-gray-400" : "w-2 bg-gray-400/30"   (or colored via theme)
```

### 3.7 Accordions (Radix data-state + AnimatePresence layout)

Two layers coexist:

**Radix slide — `src/components/ui/accordion.tsx:58`:**

```tsx
<AccordionContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
```
(`animate-accordion-up/down` come from `tw-animate-css`, §5.)

**List-level mount/collapse animation — `src/components/activities/ActivitiesAccordion.tsx:142-148`**
(identical in `SpaAccordton.tsx:141-147`, `FaqDatas.tsx:85-97`):

```tsx
<AnimatePresence initial={false}>
  {items.map((item) => (
    <motion.div key={item._id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      layout>
      <AccordionItem value={item._id} className="border-b border-gray-100 last:border-b-0">
        <AccordionTrigger className="py-3 lg:py-4 px-1 …">
          {/* trigger content */}
        </AccordionTrigger>
        <AccordionContent>
          <div dangerouslySetInnerHTML={{ __html: item.content }} />
        </AccordionContent>
      </AccordionItem>
    </motion.div>
  ))}
</AnimatePresence>
```

**Generalized:** wrap each list item in `motion.div` with `layout` and an exit collapse
(`height:0,marginTop:0,marginBottom:0`) so removals animate; `AnimatePresence initial={false}`
prevents the entrance flash on first paint; keep Radix `Accordion` (`type="single" collapsible`)
as the a11y/OI source of truth.

### 3.8 Image hover zoom

Canonical variants in the repo (choose by surrounding component):

```tsx
// TourCard (list card image): duration-500
<div className="overflow-hidden rounded-lg">
  <Image className="object-cover w-full h-full transition-transform duration-500 hover:scale-105" … />
</div>

// News detail gallery image: duration-700
<Image className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" … />

// Merch product card (object-contain): group-hover + duration-500
<Image className="object-contain transition-transform duration-500 group-hover:scale-105" … />

// Lodge stays: group-hover duration-500 (wrapper) / duration-300 (image)
<div className="w-full h-full transition-transform duration-500 ease-in-out transform group-hover:scale-105">
  <Image className="object-cover transition-transform duration-300 group-hover:scale-105" … />
</div>
```

Rule of thumb from the code: always on `transform` (not `all`), overflow-hidden parent, duration
300–700ms, no easing override (defaults), never scales the `<img>` without an overflow clip.

### 3.9 Effects that do NOT exist (do not fake them)

- **Counters** (animated numbers): `NOT FOUND` — no `CountUp`, no `requestAnimationFrame` counter;
  fund "livenumbers" are rendered as static text.
- **Marquee**: `NOT FOUND`.
- **Background parallax**: `NOT FOUND` — the only scroll-linked effect is `ScrollStack` (3.1) and
  the various fixed bars (they translate with viewport, not by scroll).
- **Ken Burns hero**: `animate-kenburns` keyframe exists (`globals.css:12-22`) but is **unused** in
  any TSX.

---

## 4. SCROLL SYSTEM

- **No smooth-scroll library is wired.** `lenis@1.3.14` is declared and locked in `package.json`/
  `package-lock.json` but has **zero imports** in `src/` — the site's smoothness comes from CSS:
  `* { scroll-behavior: smooth }` (`src/app/[locale]/globals.css:9-11`) for **anchor jumps only**.
- **Scroll-linked animation** exists in exactly one component: `ScrollStack` (`src/components/ScrollStack.tsx`,
  §3.1). It is the *only* `useScroll`/`useTransform`/`useMotionValue*` consumer in the codebase
  (grep verified).
- **Positioned-on-viewport elements** (not scroll-driven, but scroll-relevant):
  - `Header` (03a §3.2) and `SecondaryHeader` (03a §3.3): `fixed top-0`; Header compresses its
    background/padding when `window.scrollY > 10`.
  - `Reserve` floating booking bar: rendered `fixed right-0 left-0 bottom-4` by `VideoPageLayout`
    and hidden when the user crosses the footer (§3.4, via `useFooterVisibility`).
  - `ui/loading`: `fixed inset-0`.
  - `sticky`: `ScrollStack` cards `top-20 md:top-28 lg:top-32`; privacy/terms modal scroll area
    `sticky top-0 z-10`.
- **Nav anchors are not hardcoded.** Both headers render `href={item.url}` / `href={child.url}` from
  CMS `menus` data — there are no in-code `#section` hrefs.
- **Hash/`scrollIntoView` system** exists **only on the fund page** — `src/components/fund/useSectionHash.ts`:
  - `ALIASES` map resolves common slugs → canonical ids (e.g. `ourimpact`/`impactcounter`/`livenumbers`
    → `impact`, `ourprojects`/`ourproject` → `projects`, `frequentlyaskedquestions`/`questions` → `faq`).
  - `getSectionElement` = exact `getElementById` → alias → fuzzy match of `section[id]`.
  - `patchHistory` wraps `pushState`/`replaceState` to replay registered listeners on manual nav; a
    single `hashchange`-driven handler calls `target?.scrollIntoView({ behavior: "smooth"|"auto", block: "start" })`
    with a retry via `requestAnimationFrame` when the element isn't found yet (CMS content arrives async).
- **Scroll restoration**: no `next.config` or app-level `scrollRestoration` code exists — Next.js
  defaults apply.
- **Perf caveats to keep**: `useFooterVisibility` subscribes a `window.addEventListener("scroll")` that
  runs `document.querySelector("footer")` + `getBoundingClientRect()` on **every** scroll event without
  rAF throttling (acceptable at this site's size; see §10 Q-05).

---

## 5. CSS & TW-ANIMATE-CSS SURFACE

### 5.1 `src/app/[locale]/globals.css` (249 lines — the whole global surface)

Order of definitions (line positions captured at investigation time):

```css
@import "tailwindcss";                    /* :1 */
@import "tw-animate-css";                 /* :2 — utility classes below come from this package */

@theme inline { … }                       /* color + radius tokens ONLY; NO duration/ease/anim tokens */

* { scroll-behavior: smooth; }            /* :9-11 global smooth anchors */

@keyframes kenburns { from { transform: scale(1.05); } to { transform: scale(1); } }  /* :12-16 */
.animate-kenburns { animation: kenburns 8s ease-out forwards; }                      /* :17-22 */
                                          /* ^ UNUSED in any TSX (0 matches) */

@custom-variant dark (&:is(.never-dark *));   /* dark mode effectively disabled — only triggers
                                                 inside an element carrying .never-dark, which no
                                                 component applies */

/* erxes messenger (embedded support chat) overrides:
   - z-index raise so the float sits above sticky/fixed bars
   - responsive: on small screens the widget is scaled/shrunk
   - the booking flow (03, 06) depends on this overlap behavior */

html { overflow-x: hidden; scrollbar-width: none; }   /* :214-222 + body width guards */
```

### 5.2 Tailwind v4, CSS-first

- **No `tailwind.config.*` exists.** All theming is `@theme inline` in globals.css (colors, radius).
  There are **no motion tokens** (`--animate-*`, `--ease-*`, `--duration-*`) in the theme — animation
  utility classes come purely from `tw-animate-css` + Tailwind's built-in `animate-*` scale.
- `@custom-variant dark (&:is(.never-dark *))` means **`dark:` variants never fire** on the real site.

### 5.3 tw-animate-css classes actually used (whitelist — everything else must be verified at install)

Since `node_modules/` is checked out **empty**, only class *names* can be confirmed from call sites
(Tailwind tree-shakes unused ones at build, so their globals only exist when used):

| Class | Used at | Meaning from the package's contract |
|---|---|---|
| `animate-in fade-in-0` | `profile/personal.tsx` (form fields, submit row) | fade from opacity 0 |
| `animate-in zoom-in-95` | `personal.tsx` (badge/avatar) | scale 0.95 → 1 |
| `animate-in slide-in-from-*` | `personal.tsx` | directional slide-in |
| `animate-accordion-up` / `animate-accordion-down` | `ui/accordion.tsx:58` | Radix `AccordionContent` open/close height collapse |

> ⚠ `tw-animate-css@1.4.0`'s `Accordion` classes animate `--radix-accordion-content-height`/
> `--radix-accordion-content-width` with a transition — the open *state swap* animates, while the
> list-level **mount/exit** animation is Frame Motion (§3.7). The two layers do not conflict because
> one targets `[data-state]` transforms, the other structural mount/unmount.

### 5.4 Dead / inert animation classes

- **`animate-kenburns`** — defined (globals.css:17-22) + `@keyframes kenburns`, used **0 times** in TSX.
- **`animate-fadeIn`** — used at `src/components/contact-us/ContactForm.tsx:188` (the "waiting" dialog),
  but **no `@keyframes fadeIn`** exists anywhere (neither globals.css nor `tw-animate-css`'s contract).
  The class is inert today; the element still works because the dialog visibility is state-driven.

---

## 6. PERFORMANCE & ACCESSIBILITY

### 6.1 What the repo does right

- All loaders are `animate-pulse` skeletons (43 occurrences) with fixed aspect containers, so content
  swap causes no layout shift.
- Auto-playing video/carousels carry `muted autoPlay playsInline` and `stopOnInteraction` /
  `stopOnMouseEnter` variants; heroes keep autoplay running (that's the intended look), product grids
  pause on interaction (e.g. `MerchProductsCarousel` `{ stopOnInteraction:true, stopOnMouseEnter:true }`).
- `AnimatePresence initial={false}` is set on accordion lists and the Reserve panel so first paint
  isn't animated.
- Drawer closers are `role="dialog"` + `aria-modal="true"` (`Header.tsx:330`), focus does land in the
  panel, and overlay is a click-target to dismiss.
- Transforms are GPU-friendly (`transform`/`opacity` only; the one layout anim — accordion `height`
  collapse — is bounded to 0.25s).
- Lottie loader is small and local (no network CDN).

### 6.2 Gaps (flag but do not fix silently)

- **`prefers-reduced-motion` is `NOT FOUND IN CODE`** (grep incl. `@media` blocks). Every animation
  here runs regardless of OS reduced-motion. Recommended addition (compat. with framer-motion:
  `MotionConfig reducedMotion="user"` at root or per-section `useReducedMotion`), and CSS
  `@media (prefers-reduced-motion: reduce)` is currently absent.
- **`will-change` is `NOT FOUND IN CODE`** — intentional (framer-managed transforms don't need it),
  keep it that way; do not add spurious hints.
- **Scroll perf**: `useFooterVisibility` queries the DOM per scroll event (see §4). Acceptable at this
  scale; add rAF-throttling only if profiling demands.
- **Dot indicators are marked up inconsistently**: `Accommodation.tsx` renders `<span>` dots (decorative,
  no `aria-label`, not focusable); `authImages/images.tsx` renders `<button aria-label="Go to slide n">`.
  Match the button pattern when rebuilding.
- **Autoplay carousels have no pause affordance for keyboard/screen-reader users** and no reduced-
  motion guard — `prefers-reduced-motion` handling should pause autoplay too.
- `matchMedia.addListener`/`removeListener` legacy API is used as a fallback in `ScrollStack.tsx:91-94`
  (also `stopOnInteraction` etc. rely on unguarded plugin methods) — fine at runtime, but drop the
  deprecated branch when modernizing.

---

## 7. MOTION TOKENS TABLE

Actual usage counts across `src/` (grep-verified at investigation time) → recommended canonical set.

### 7.1 What the code actually uses

| Token family | Values used | Count (approx.) |
|---|---|---|
| Tailwind `duration-*` | `150`·`200`·`300`·`500`·`700` | 6 · 59 · 42 · 9 · 1 |
| Tailwind `transition-*` | `all`·`colors`·`transform`·`opacity`·`shadow`·`none` | 87 · 86 · 16 · 6 · 3 · 1 |
| Tailwind `ease-*` | `in-out`·`out`·`in`·`linear` | 3 · 2 · 3 · 0 |
| Tailwind `animate-*` | `pulse`·`spin`·`in`·`kenburns`·`fadeIn` | 43 · 11 · 21 · 0 (dead) · 1 (inert) |
| framer `duration:` | 0.15·0.2·0.25·0.3·0.4·0.5·0.6 | 3 · 9 · 5 · 8 · 2 · 2 · 2 |
| framer springs | `{stiffness,damping}` | 300/15·300/20·300/25·300/26+mass .8·260/20+mass .7·200 |
| framer stagger base | `0.08` · `0.05` | nav/page lists · hero group |
| distances | x:20/30, y:8/12/16/20/120, x:300 (page), x:100% (drawer), gaps 40/72 | standard |

### 7.2 RECOMMENDED CANONICAL SET (for a regenerating agent — keep visual parity)

| Semantic | Canonical value | Backs into |
|---|---|---|
| instant/hover micro | 150ms (`duration-150`) | buttons, chevrons, hamburger icon, nav underline |
| default interaction | 200ms | accordion content, drawer opacity, close items |
| default motion | 300ms | header bg collapse, overlay, accent-bar, hover zoom base |
| long reveal | 500ms | card fades, hero zoom (`duration-500`), footer-hide slide |
| hero image zoom | 700ms | news detail image (`duration-700`) — the only 700 |
| entrance fade/rise | `initial {opacity:0,y:20}` → `animate {1,0}`; stagger `0.08*i`, base delay 0.1 | lists, quotes |
| spring — press hover | `{type:"spring",stiffness:300,damping:15}` | logo |
| spring — UI panels | `{type:"spring",stiffness:300,damping:25}` | drawer header, FAB (260/20/mass .7) |
| spring — weighted panel | `{type:"spring",stiffness:300,damping:26,mass:0.8}` | Reserve panel |
| spring — playful pop | `{type:"spring",stiffness:200,duration:0.4}` | review stars |
| layout collapse | `{duration:0.25,ease:"easeOut"}` + `layout` | accordion/filter lists |
| slide-in overlays | 300ms L→R / 400ms vertical (0.3/0.4) | drawers, modals |
| autoplay cadence | 5000ms (hero 4000, journey 6000) | all Embla Autoplay |
| skeleton | `animate-pulse` (indefinite) | all loaders |

> Canonicalization note: `transition-all` (87 uses) vs `transition-colors` (86) is a **debt hotspot** —
> prefer `transition-[transform,opacity]` or `transition-transform` on anything that moves (see A-06).

---

## 8. REPRODUCE vs AVOID RULES

### REPRODUCE

1. **R-01 — Embla autoplay memo + dot indicator.** `const autoplayRef = useRef(Autoplay({delay:5000,…}))`,
   pass `plugins={[autoplayRef.current]}`, wire `api.on("select"/"reInit")` → state, dots as
   `.map` spans showing `w-6` vs `w-2`. Mirror `Accommodation.tsx:83,241-268` (§3.6). **Pair the
   mobile carousel with a desktop grid** inside the same component (`lg:hidden` / `hidden lg:grid`).
2. **R-02 — Sticky fanning card stack.** Copy §3.1 literally (sticky + useScroll scrub + `useTransform`
   `[120, index*gap]` + parent height `items*80vh`). It is the site's signature effect.
3. **R-03 — Mobile drawer.** `AnimatePresence mode="wait"` + `menuVariants x:"100%"→0` +
   `navItemVariants` stagger `0.1+0.08*i` / exit reverse `(len-i-1)*0.03` + `body` scroll lock via
   `overflow-hidden` (`Header.tsx:31-38,284-419`). Match the SecondaryHeader variant (exit `0.2`, no
   `mode="wait"`) for sub-pages (§3.3).
4. **R-04 — Floating booking bar.** Panel⇄FAB single `AnimatePresence initial={false} mode="wait"`,
   keyed children, `localStorage` persistence, footer-hide slide via `useFooterVisibility` (§3.4).
5. **R-05 — Accordions.** Radix trigger/content for a11y + `motion.div layout` wrapper with exit
   `{height:0,…}` 0.25s easeOut + `animate-accordion-down/up` on `data-state` (§3.7).
6. **R-06 — Image hover zoom.** `overflow-hidden` parent + `transition-transform duration-300/500`
   `hover:scale-105` (or `group-hover:scale-105`); use **500ms on list cards, 700ms on editorial hero
   images, 300ms on inline thumbs** exactly as the components do.
7. **R-07 — Mount-time stagger groups.** No in-view lib exists; copy the header/nav `variants` object
   with `custom={i}` and delayed fade-up chains (§3.2). Preserve the exit-reversed build order.
8. **R-08 — `useFooterVisibility`.** Scroll listener + `footer.getBoundingClientRect().top <= innerHeight`
   → boolean; toggle classes `opacity-0 pointer-events-none translate-y-full` vs
   `opacity-100 translate-y-0 transition-all duration-500 ease-in-out` (§3.4). Works because footer
   is present on every page (03).
9. **R-09 — Skeletons everywhere data load.** `animate-pulse` placeholders sized like the final block;
   the hero even pre-blurs its bg (`VideoPageLayout:57`).

### AVOID

1. **A-01 — Do not add gsap / ScrollTrigger / swiper / lenis.** They are not in the project's runtime
   footprint. `lenis` is an **unused dependency** — if a consuming agent sees it in `package.json`,
   it must NOT wire it into a new build without review; remove or intentionally adopt.
2. **A-02 — No custom scroll-restoration.** Absent today; Next defaults suffice for this SPA-heavy
   header UX.
3. **A-03 — No marquees, counters, or Ken Burns.** None exist as effects. `@keyframes kenburns` is dead
   code — if actually wanted, re-introduce behind the hero, not as a general utility.
4. **A-04 — Do not create new `whileInView` scroll-reveal.** The site's reveal language is *mount* +
   *scroll-scrub*. If a future build adds whileInView, it must ship with `prefers-reduced-motion`
   handling (§6.2), which the codebase currently lacks.
5. **A-05 — Do not duplicate drawer code.** Header & SecondaryHeader each re-implement the drawer with
   subtle differences (exit duration, `mode="wait"`). Extract one shared drawer + variant set.
6. **A-06 — Cut down `transition-all`.** 87 `transition-*all*` vs 16 `transform`/6 `opacity` is the
   top motion-debt item; never let new components animate `all` on layout-expensive nodes.
7. **A-07 — Never reuse `animate-fadeIn`.** It has no keyframes (dead today). Prefer tw-animate-css
   `animate-in fade-in-0`.
8. **A-08 — No `scroll-behavior` per-element overrides.** Keep the single globals.css rule; the fund
   page drives programmatic smooth/auto via `scrollIntoView({behavior})` (§4), not CSS toggles.
9. **A-09 — No cross-fading page transitions (site-wide).** Only the auth container slides between
   views (§3.5). Do not add an app-level `AnimatePresence` around routes (no `/app/layout` exists —
   see 07).

---

## 9. BRAND-SPECIFIC HARDCODING AUDIT

> Items that assume the specific "Terelj Resort" launch identity ≠ "Tegri Gobi" identity. Marked
> `OPTIONAL` = safe to regenerate differently; `PROPOSED` = suggested null-object config key if a
> config layer (02 §config) is introduced.

| # | File:line | Hardcoded string / palette | Why it matters | Status |
|---|---|---|---|---|
| 1 | `src/containers/auth/auth-container.tsx` | "Terelj Resort" heading + **Terelj** URL assets (`/…/terelj*.jpg`), blue `from-blue-900/60` gradient, forensic `.never-dark` cobalt slides | The auth pages render the *previous* resort's branding (wrong product name for Tegri Gobi) | **OPTIONAL** — PROPOSED config `features.authSlides` / `branding.auth.images` |
| 2 | `src/components/layout/Header.tsx:374` | mobile drawer accent bar `bg-gradient-to-b from-blue-500 to-purple-600` | Blue/violet accent is a Terelj-family color, not the Tegri brand system in 02 | OPTIONAL — PROPOSED `branding.accents.drawerBar` |
| 3 | `src/components/ui/MainLoader.tsx` + `public/animation/mainLoader.json` | Lottie loading animation asset | Branded loader must be reproduced asset-for-asset or swapped with a Tegri one | OPTIONAL — PROPOSED `branding.loader.lottie` |
| 4 | `src/components/ScrollStack.tsx:65` | fallback title "HEALING OASIS HIDDEN AMONG THE DUNES" | Only shows when CMS `item.title` is empty, but it's branded copy ("dunes") | OPTIONAL — keep or move to CMS |
| 5 | `src/components/clientPages/VideoPageLayout.tsx` | hero skeleton `from-neutral-600 via-neutral-800 to-neutral-900` | Survey-scale neutral; fine but a warm/brown ramp would match the resort palette | OPTIONAL |
| 6 | `src/app/[locale]/globals.css` | erxes messenger overlay + z-index (the fixed support chat) | Hardcoded 3rd-party widget rule; branding-sensitive dimensions | OPTIONAL |
| 7 | Header logo `alt="Tegri Gobi Resort"` + `header-logo.png` | Correct brand name already in place | Reference example — auth (#1) is the outlier | keep |
| 8 | `authImages/images.tsx` `/loginimages` CMS slug | Auth slide content is CMS-driven, but the *layout* is blue-banded Terelj | If #1 changes, revisit this | OPTIONAL |

---

## 10. OPEN QUESTIONS / UNCERTAINTIES

1. **tw-animate-css emitted CSS not verifiable** — `node_modules/` is empty in the checkout, so the
   real values behind `animate-accordion-up/down`, `animate-in fade-in-0`, `slide-in-from-*` were
   inferred from the package contract, not the built bundle. Confirm after `npm install`.
2. **`animate-fadeIn` (ContactForm.tsx:188)** — no `@keyframes fadeIn` exists anywhere; is the class a
   leftover meant to be `animate-in fade-in-0`, or intentionally inert (the success dialog is
   state-driven anyway)?
3. **`animate-kenburns` is dead code** — keep the 8s keyframe for future hero use, or delete?
4. **`lenis@1.3.14` is installed but unused** — a stale entry, or preparation for smooth scroll that
   should be handled outside the current CSS-first approach?
5. **No `prefers-reduced-motion`** anywhere — confirmed by grep. Should the next iteration add
   `MotionConfig reducedMotion="user"` + a CSS reduce guard and a `prefers-reduced-motion: reduce`
   media block? (Recommended yes — §6.2.)
6. **`matchMedia.addListener` legacy fallback** in `ScrollStack.tsx:91-94` — harmless but deprecated;
   safe to delete the fallback branch.
7. **Two divergent drawer implementations** (Header `mode="wait"` exit 0.2/0.15 vs SecondaryHeader
   no-`wait` exit 0.2) — consolidate or is the subtle difference intentional?
8. **`GallerySection` / `MemoriesSection` have no autoplay** — deliberate (reviews/gallery want manual
   control), but confirm gallery shouldn't auto-advance.
9. **JourneySection dots are progress-number style** (`current`/`count` numerals) while every other
   carousel uses bar dots — visual inconsistency or a feature? Keep as-is unless unified in a redline pass.
10. **Exact autoplay `delay`/flags for the remaining ~5 half-read carousels** (SpaImages, ActivitiesImages,
    ActivitiesHero, SustainabilitySection, GridImages, NewsSection at line 58, LodgeStays, authImages,
    accommodationDetailPage) were interpolated from the 4000/5000/6000 histogram rather than read
    line-by-line in this session; reconfirm before a rebuild.