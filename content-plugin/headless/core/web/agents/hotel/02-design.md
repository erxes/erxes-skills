# 02 — Design System Analysis

Tegri Gobi Resort. Read-only analysis of `src/app/[locale]/globals.css`, `layout.tsx`, `components.json`, `src/components/ui/*`, `src/components/layout/*`, and the home-page sections in `src/components/*.tsx`.

No file in the project was modified. No secrets or real IDs are reproduced (one hardcoded CMS field key is referenced by name only, no value).

---

## 1. Design tokens

All tokens live in a single CSS file. There is **no `tailwind.config.js`** — Tailwind v4 CSS-first config.

### 1.1 Imports and the custom dark variant — `src/app/[locale]/globals.css:1-5`

```css
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.never-dark *));

* {
  font-family: inherit;
  scroll-behavior: smooth;
}
```

`tw-animate-css` supplies `animate-in` / `animate-out` / `fade-in-*` / `zoom-in-*` used by Radix-based shadcn primitives (dialog, popover, select, tooltip).

The dark variant is deliberately inverted: dark styles apply only when **`.never-dark` is on an ancestor**. No component in the repo sets `.never-dark`, so `dark:` utilities are effectively dead — the site is light-only by construction. This is the mechanism by which shadcn's stock `dark:*` classes were disabled without editing 26 primitives.

### 1.2 Keyframes — `globals.css:12-23`

```css
@keyframes kenburns {
  0% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-kenburns {
  animation: kenburns 8s ease-out forwards;
}
```

One custom keyframe in the whole project. Slow 8s ease-out zoom for hero imagery.

### 1.3 Font utility classes, hand-written — `globals.css:25-64`

```css
body {
  font-family:
    var(--font-roboto),
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    "Apple Color Emoji",
    "Segoe UI Emoji";
}

.font-roboto {
  font-family: var(--font-roboto), ui-sans-serif, system-ui, ...;
}
.font-dm-sans {
  font-family: var(--font-dm-sans), ui-sans-serif, system-ui, ...;
}
```

These are **plain class rules, not `@theme`-registered utilities**. The font stack is triplicated. Works, but a `@theme` entry (`--font-roboto: var(--font-roboto)`) would be the idiomatic v4 way.

### 1.4 `@theme inline` mapping — `globals.css:67-104`

Maps semantic shadcn names onto Tailwind color slots:

```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  /* … chart-2..5 … */
  /* … sidebar, sidebar-foreground, sidebar-primary(+fg),
       sidebar-accent(+fg), sidebar-border, sidebar-ring … */
}
```

Complete inventory — 27 mapped tokens. The full shadcn set is present including `--color-sidebar-*` and `--color-chart-1..5`, even though **no chart and no sidebar component exists in the repo**. They are inherited boilerplate.

### 1.5 Raw token values — `globals.css:105-141`

```css
:root {
  color-scheme: light;

  --radius: 0.625rem;

  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.637 0.223 28.4);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  /* … 6 more sidebar tokens, all neutral … */
}
```

Everything is `oklch` (Tailwind v4 default). **The palette is stock shadcn `neutral` base, unmodified, except `--primary`**, which is retuned to a warm red-orange (`hue 28.4`, chroma `0.223`) — the resort's brand accent. All other tokens are neutral greys. No custom "sand"/"dune" brand color exists despite the desert positioning.

**`--radius: 0.625rem`** (10px). Note this is _not_ shadcn's default 0.5rem.

### 1.6 The `.dark` block — `globals.css:143-180`

`.dark` redefines **every single token to the exact same value as `:root`**. Byte-identical palette. So even if `.never-dark` were applied, nothing would change visually. It is 38 lines of no-op CSS kept because `next-themes` (`src/components/ui/sonner.tsx` calls `useTheme()`) and shadcn primitives expect the selector to exist.

### 1.7 `@utility container` — `globals.css:182-186`

```css
@utility container {
  margin-inline: auto;
  padding-inline: 1rem;
  max-width: 1536px;
}
```

Tailwind's own `container` utility is **overridden** to a fixed `1536px` max-width with `1rem` inline padding and auto margins. Consequences visible everywhere downstream:

- No responsive max-width stepping (`sm:`, `md:` … variants of `container` do nothing here).
- Mobile gutter is 16px only — the project compensates with per-component `sm:px-*` / `lg:px-*` and with `space-x-*`/`gap-*` grids inside.
- 1536px is the widest a section ever gets. Content is typically further narrowed by `max-w-4xl`, `max-w-3xl`, `max-w-md`, or grid columns.

### 1.8 Base layer — `globals.css:188-196`

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

Stock shadcn. The `*` rule gives every element `border-border` as the default border color and a soft focus ring color.

### 1.9 Project CSS classes — `globals.css:198-203`

```css
.info ul {
  list-style: none;
}
.info ul li:before {
  content: "•";
  margin-right: 0.5rem;
}
```

A minimal "prose" convention for CMS bullet lists: any `.info` wrapper strips native list styling and injects a bullet glyph via `:before`.

### 1.10 Third-party / global overrides — `globals.css:205-249`

Two long blocks force the embedded **Erxes chat widget** (`#erxes-messenger`, `[id*="erxes"]`, `[id*="messenger"]`, `iframe[src*="erxes.io"]`) to a fixed high z-index and pins it bottom-right, with a `max-width: 640px` media query resizing and repositioning it (scaled 0.85, moved to `bottom: 80px`) on small screens.

Then scrollbar suppression:

```css
html {
  overflow-x: hidden;
  scrollbar-width: none;
}
html::-webkit-scrollbar {
  display: none;
}
```

Visible scrollbar is deliberately removed site-wide (kiosk/immersive feel); the chat widget and carousel dots compensate visually. `overflow-x: hidden` on `html` is a blunt instrument that will silently clip any horizontally-overflowing layout.

### 1.11 Token usage reality check

| Token / class                              | Real usage                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `--primary` (`bg-primary`, `text-primary`) | **78 occurrences** across `src/`. Footer background, primary buttons, focus accents, CTA pills. The single most-used brand token. |
| `--muted-foreground`                       | `text-muted-foreground` in the server-down error screen                                                                           |
| `--destructive`                            | shadcn `destructive` button variant only                                                                                          |
| `--border`, `--ring`, `--input`            | via `@apply border-border` + shadcn primitives                                                                                    |
| `--chart-1..5`, `--sidebar*`               | **zero usage**                                                                                                                    |
| `--radius-*`                               | mostly overridden by literal `rounded-2xl` / `rounded-3xl` in components                                                          |

---

## 2. Typography

### 2.1 Font loading — `src/app/[locale]/layout.tsx:21-37`

```tsx
const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});
```

Both via `next/font/google`, `display: "swap"`, four weights each. Applied to `<body>` (`layout.tsx:98-101`):

```tsx
<body className={`${roboto.variable} ${dmSans.variable} ${roboto.className} antialiased`}>
```

So **Roboto is the default body font** (`roboto.className` sets `font-family` on body). Both variables are always emitted even though DM Sans is nearly unused.

### 2.2 Where each family is used

- **Roboto — primary, ~everything.** Explicit `font-roboto` on essentially every heading and label. Also the `body` default, so it is technically redundant, but it is written out anyway.
- **DM Sans — 8 occurrences total.** Files: `globals.css`, `layout.tsx`, `src/components/Accommodation.tsx:169`, `src/components/LodgeStays.tsx`, `src/components/clientPages/contactUsPage/contactUsPage.tsx`, `src/components/accommodation/ClientAccommodation.tsx`. Applied to **room/tour card descriptions only** (e.g. `Accommodation.tsx:169`):

```tsx
<p className="text-xs font-normal leading-relaxed text-black opacity-80 font-dm-sans lg:text-base">
  {item.excerpt?.split(" ").slice(0, 26).join(" ")}
</p>
```

So the only real typographic differentiation in the whole design system is: **Roboto for UI/headings, DM Sans for long-form card excerpts.** A second Google font is fetched (extra ~30-50KB woff2 + a layout-blocking preload) to serve four call sites.

### 2.3 Size scale (mobile-first, ~40 samples in `src/components/*.tsx`)

| Class                                         | Count     | Role                                                                       |
| --------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| `text-xs`                                     | 26        | Default body/label at mobile. Metadata, descriptions, chips, footer links. |
| `text-sm`                                     | 23        | Secondary labels, nav items, form labels                                   |
| `text-base`                                   | 23        | Card body / section-level text at desktop via `lg:text-base`               |
| `text-2xl`                                    | 8         | Section headings at mobile                                                 |
| `text-lg`                                     | 7         | Card headings at desktop                                                   |
| `text-3xl`                                    | 6         | Section headings at desktop                                                |
| `text-xl`                                     | 2         | Rare                                                                       |
| `text-4xl`                                    | 1         | Hero title at desktop only (`ReserveText.tsx:37`)                          |
| `text-[14px]` / `text-[16px]` / `text-[10px]` | 3 / — / 1 | Arbitrary escapes from the Figma source                                    |

**The dominant pairing is a two-step mobile→desktop bump, nothing in between:**

```
text-xs    → lg:text-base      (section body copy)
text-base  → lg:text-lg         (card titles)
text-2xl   → lg:text-3xl        (section headings)
```

There is no `sm:` step and no `md:` step on type size anywhere in the home sections. `md:` appears on layout/height only.

### 2.4 The canonical heading class string

Repeated almost verbatim in 6 of 8 home sections (`JourneySection.tsx:141`, `NewsSection.tsx:127,145`, `AccommodationList.tsx:44`, `BannerSection.tsx:85`, `SubscriptionSection.tsx:34`, `GallerySection` via parent):

```tsx
<h1 className="text-2xl not-italic font-normal leading-normal text-black font-roboto lg:text-3xl">
  {page?.name || ""}
</h1>
<p className="mt-3 text-xs font-normal leading-5 text-black font-roboto lg:text-base">
  {page?.description || ""}
</p>
```

This exact 9-class string is the project's de-facto section heading. Note:

- `<h1>` is used for **every** section heading, not `<h2>` — including inside `BannerSection` which switches to `<h2>` (`BannerSection.tsx:84`). Inconsistent heading levels across a page.
- `not-italic` on an `h1` is meaningless in this codebase (nothing sets a global italic). It reads like a Figma export artifact.
- `font-normal` on every heading — the design has **no bold headings at all**.
- `leading-normal` (Tailwind = 1.5) for headings, `leading-5` / `leading-relaxed` for body.
- `text-black` instead of `text-foreground` — see §2.6.

### 2.5 Recurring compound patterns

Card heading + meta:

```tsx
<h3 className="text-base font-medium leading-normal text-black uppercase font-roboto lg:text-lg">
```

(`Accommodation.tsx:140`) — `font-medium` + `uppercase` is the card-title treatment; only here and in `ScrollStack` pills.

Metadata row (date · tag):

```tsx
<div className="flex overflow-hidden gap-2 items-center text-xs font-normal leading-normal truncate text-black/70 font-roboto lg:text-sm">
```

(`NewsSection.tsx:100`) — `text-black/70` + `truncate` is the standard secondary-text treatment.

Eyebrow / overline pill (`ScrollStack.tsx:60`):

```tsx
<span className="text-[10px] lg:text-xs font-roboto uppercase">
  {item?.title}
</span>
```

The **full class-name stack** is the real signature: every text node repeats `font-roboto font-normal` + explicit `text-*` color + `leading-*`. There is no typographic utility layer; no `prose` defaults, no `@utility` shortcuts. Copying a class string is the codebase's theming mechanism.

### 2.6 Color discipline

`text-black` — **194 occurrences**. `text-foreground` — **12**. `bg-primary` — 78.

The token system is used for _surfaces_ (`bg-card`, `bg-primary`, `border-border`, `bg-background`) and for text only where the shadcn primitive applies it. Hand-written text almost always bypasses tokens in favor of `text-black`, `text-black/70`, `text-gray-500`, `text-gray-200`, `text-gray-300`, `text-gray-600`, `text-white`. Consequences: re-theming the text color is impossible via tokens, and `text-black` is not `foreground` if the palette ever changes.

---

## 3. Layout rules

### 3.1 Container and gutters

Single rule: `<section className="container">` or `<div className="container">`, with no width classes. Everything else is nested max-widths.

`DefaultPageLayout.tsx` (the standard interior-page shell) adds top offset + vertical rhythm:

```tsx
className={cn(className,
  "container relative mt-20 py-10 min-h-[50vh] sm:min-h-[60vh] lg:min-screen")}
```

`mt-20` clears the fixed header (80px, matching `Header`'s scrolled padding).

Interior shells add their own padding: `booking-layout.tsx` uses `container mt-18 min-h-[50vh] sm:min-h-[60vh] lg:min-h-screen py-6 sm:py-8 lg:py-10` — note `mt-18` (not a default Tailwind step) vs `mt-20`.

### 3.2 Section spacing

Measured across `src/components/*.tsx`: `space-y-3` ×10, `space-y-2` ×4, `space-y-6` ×3, `space-y-10` ×2, `space-y-8` ×1, `lg:space-y-10` ×1.

The home page parent (`clientPages/homePage/homePage.tsx:31`):

```tsx
<div className="space-y-10 lg:space-y-15">
```

And `VideoPageLayout` (`VideoPageLayout.tsx:26`):

```tsx
<div className="space-y-10 lg:space-y-15">
```

Both use `lg:space-y-15` — **not a default Tailwind step** (Tailwind v4 does allow arbitrary numeric spacing multiples, so `space-y-15` resolves to 3.75rem; this is a v4-only affordance). `space-y-10` → 2.5rem, `space-y-6` → 1.5rem, `space-y-3` → 0.75rem, `space-y-2` → 0.5rem.

Two competing scales: **`10/15` for between sections, `2/3/4` for intra-component.** The `space-y-15` at desktop is the single most consistent brand-specific spacing value.

### 3.3 Breakpoints actually used

Only four appear: `sm` (640), `md` (768), `lg` (1024), `xl` (1280).

| Breakpoint | Role                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `sm:`      | Height bumps on images (240→300px), flex→grid on reserve form, footer border/copyright row, grid columns |
| `md:`      | Height bumps (300px), basis values on gallery carousel                                                   |
| `lg:`      | The real breakpoint: switches mobile carousel → desktop grid; reveals header nav; shows second column    |
| `xl:`      | Header desktop nav + user menu (`hidden … xl:flex`)                                                      |

**`xl` is the nav breakpoint, not `lg`.** Both `Header.tsx` and `SecondaryHeader.tsx` gate the full nav on `xl:flex`, so between 1024–1280px desktop users get the hamburger. That is unusual and worth preserving deliberately (or fixing deliberately).

Media queries written by hand: `ScrollStack.tsx:81` uses `window.matchMedia("(max-width: 640px)")` for a JS branch; `Accommodation.tsx:186-190` uses `window.innerWidth < 640 / < 1024` for a "show 1/2/3 amenity chips" rule; `image.tsx` uses `useMediaQuery("(min-width: 768px)")` and `"(min-width: 480px)"` for `sizes`.

### 3.4 Grid patterns

Canonical multi-card desktop grid (`NewsSection.tsx:163`):

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
```

Two-column 55/45 split (`JourneySection.tsx:47,78`):

```tsx
className={`flex flex-col lg:flex-row w-full justify-between items-center gap-3 ${
  index % 2 !== 0 ? "lg:flex-row-reverse" : ""
}`}
...
<div className="w-full lg:w-[55%] relative">   {/* media */}
<div className="w-full lg:w-[45%]">            {/* text */}
```

Alternate-row reversal via `index % 2` is the signature editorial rhythm of this site. Also used in the `JourneySection` skeleton so the loading state matches the loaded state.

Reserve bar form (`Reserve.tsx:170`) — 2-col → 4-col → inline row:

```tsx
className =
  "grid grid-cols-2 gap-4 px-2 w-full md:grid-cols-2 lg:flex lg:items-center sm:gap-6 lg:gap-10 sm:w-auto";
```

Footer: `grid grid-cols-2 gap-8` on mobile (`Footer.tsx:112`), `flex justify-between items-start` on desktop (`Footer.tsx:158`) — About | Center logo | Experience.

### 3.5 Responsive swap idiom (carousel ⇄ grid)

The most repeated structural pattern in the codebase. Both branches are rendered and CSS decides (`NewsSection.tsx:172-206`, `Accommodation.tsx:245-286`, `GallerySection`, `MemoriesSection`, `LodgeStays`):

```tsx
<div className="lg:hidden">        {/* mobile: Embla carousel, autoplay, dot indicators */}
  <Carousel setApi={setApi} opts={{ loop: true }} plugins={[autoplayRef.current]} className="w-full"
    onMouseEnter={() => autoplayRef.current?.stop?.()} ... >
    <CarouselContent>{items.map(i => <CarouselItem key={i._id} className="basis-full">…)}</CarouselContent>
  </Carousel>
  {items.length > 1 && (
    <div className="flex gap-2 justify-center items-center mt-2">
      {items.map((_, i) => (
        <span className={`h-1.5 rounded-full transition-all ${
          active === i ? "w-6 bg-gray-400" : "w-2 bg-gray-400/30"}`} />))}
    </div>
  )}
</div>
<div className="hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-3 lg:gap-6">
  {items.map(i => <Card key={i._id} … />)}
</div>
```

Every one of these repeats an identical 20-line `useEffect` subscribing to Embla's `select` event to track the active index, and an identical dot-indicator block. Duplicated 5+ times, never abstracted.

### 3.6 Header structure

**`Header.tsx` (transparent/overlay variant)** — `fixed top-0 z-50 w-full shadow-lg`, animated by `framer-motion` on scroll (`Header.tsx:141-152`):

```tsx
<motion.header
  initial={false}
  animate={{
    backgroundColor: isScrolled ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0)",
    paddingTop: isScrolled ? "20px" : "36px",
    paddingBottom: isScrolled ? "20px" : undefined,
  }}
  transition={{ duration: 0.3 }}
  className="fixed top-0 z-50 w-full shadow-lg"
  style={{ boxShadow: isScrolled ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none" }}
>
  <div className="container">
    <div className="flex justify-between items-center h-10">
```

White-on-scroll over the hero; transparent at rest. Bar height `h-10` (logo) with 20px padding → ~80px total when scrolled.

**`SecondaryHeader.tsx` (solid/compact variant)** — `fixed top-0 z-50 w-full bg-white`, `container py-4`, inner `h-14`. Shadow toggled inline by `isScrolled`.

Both share:

- logo `Image` from `next/image` (not the custom wrapper) — `src="/images/header-logo.png"` at `101×40`, `className="w-auto h-10"`
- `<nav className="hidden items-center space-x-8 xl:flex">` rendering CMS `topLevelMenus`
- CSS-only dropdown on hover: `invisible absolute left-1/2 top-full … group-hover/menu:visible group-hover/menu:opacity-100` wrapping `min-w-44 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5`
- `<div className="hidden items-center space-x-4 xl:flex">` with `LanguageSwitcher` + `CurrentUser`
- hamburger `xl:hidden`, then two `AnimatePresence` blocks: a `fixed inset-0 z-40 bg-black/40` overlay and a drawer `fixed top-0 right-0 bottom-0 z-[60] w-80 max-w-[85vw] bg-white h-dvh shadow-2xl border-l border-gray-100 flex flex-col`
- scroll listener with a 10px threshold (`setIsScrolled(window.scrollY > 10)`) in both
- body scroll lock via `document.body.classList.toggle("overflow-hidden", isMenuOpen)`

Mobile drawer item animation uses a **staggered `custom` prop** (`SecondaryHeader.tsx:66-79`):

```tsx
const navItemVariants = {
  hidden: { x: 30, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { delay: 0.1 + 0.08 * i },
  }),
  exit: (i: number) => ({
    x: 20,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, delay: (cmsMenus.length - i - 1) * 0.03 },
  }),
};
```

Reverse-order exit stagger. `Header.tsx` duplicates this almost exactly plus 4 more variants (`logoVariants`, `menuButtonVariants`, `iconRotateVariants`, `navLinkVariants`).

### 3.7 Footer structure

`Footer.tsx:57`:

```tsx
<footer className="w-full bg-primary text-white z-20">
  <div className="container w-full py-8 md:py-12">
    {/* MOBILE: <div className="flex flex-col gap-8 lg:hidden"> — centered logo,
        contact block, 2-col link grid */}
    {/* DESKTOP: <div className="hidden lg:flex justify-between items-start">
        About | Center logo & contact | Experience  */}
    <div className="container border-t border-gray-400 py-4 sm:py-6">  {/* bottom bar */}
```

Brand-red footer (`bg-primary`) — the strongest color block on the site and the inverse of the white header. Mobile is a centered stack, desktop a 3-part flex. Contact block: `mailto:`/`tel:` links with `text-gray-300` icons, social buttons as `p-2 rounded-full hover:bg-white/10 hover:text-gray-300`, and a white inverted CTA `inline-flex items-center gap-2 bg-white text-gray-700 px-5 py-2 text-sm rounded-full shadow-lg hover:shadow-xl`. Bottom bar holds copyright + an "Powered by" vendor link. Logo swaps per locale: `footerLogo = locale === "en" ? "/images/logo-footer-en.png" : "/images/logo-footer.png"` (`Footer.tsx:21`).

### 3.8 Hero / video layout

`VideoPageLayout.tsx` is the shared hero for every content page:

```tsx
<div className="space-y-10 lg:space-y-15">
  <div className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-screen overflow-hidden">
    {/* blurred pulsing placeholder while loading with no images */}
    <div className="absolute inset-0 z-0">
      {/* Carousel of pageImages with 4s autoplay, loop, or single Image */}
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
    <ReserveText title={title} text={description} loading={loading} />
    {showReserve && (
      <Reserve
        className={`fixed right-0 left-0 bottom-4 px-4 md:px-0 lg:px-0 sm:bottom-4
        lg:bottom-4 transition-all duration-500 ease-in-out transform z-40 ${
          isFooterVisible
            ? "opacity-0 pointer-events-none translate-y-full"
            : "opacity-100 translate-y-0"
        }`}
      />
    )}
  </div>
  {children}
</div>
```

Key decisions:

- Full-bleed background layer at `absolute inset-0 z-0`, content stacked above.
- **Every hero has a fixed `bg-black/40` scrim** — the only text-legibility mechanism.
- Loading state is a blurred, animated dark gradient placeholder, not a skeleton grid.
- `MainVideo` (`layout/MainVideo.tsx`) exists and renders `public/video/main.mp4` via the vendored `kibo-ui` `VideoPlayer`, but its usage is **commented out** in `VideoPageLayout.tsx:57` — the site uses image carousels, not video.
- The floating Reserve bar auto-hides when the footer enters view via `useFooterVisibility()`.

`ReserveText.tsx:31-40` — hero copy, bottom-anchored and centered:

```tsx
<div className="flex absolute right-0 left-0 bottom-16 flex-col gap-4 items-center px-4 md:bottom-18 lg:bottom-32 sm:px-6 z-5">
  <h1 className="text-2xl font-medium text-center text-white uppercase font-roboto md:text-3xl lg:text-4xl">
    {title}
  </h1>
  <p className="max-w-3xl text-base font-normal text-center text-white font-roboto lg:text-xl">
    {text}
  </p>
</div>
```

`bottom-18` and `z-5` are again non-default v4 numeric steps. Loading state swaps in `bg-white/20` pulsing bars.

### 3.9 The Reserve widget — the site's signature UI

`Reserve.tsx:145-163` — a floating pill-shaped booking bar that expands from a FAB:

```tsx
<motion.div
  key="reserve-panel"
  initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
  transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.8 }}
  className="relative flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-10 w-full sm:w-auto
             py-4 sm:py-5 px-4 sm:px-6 rounded-[25px] sm:rounded-[50px] bg-white
             shadow-[0_2px_6.1px_0_rgba(0,0,0,0.25)]">
```

Distinct corner radii on the same element across breakpoints (`rounded-[25px]` → `sm:rounded-[50px]` = fully pill). Open/closed state persisted to `localStorage` under `reserve_open`. The collapsed FAB (`Reserve.tsx:266-278`) is a `fixed right-4 bottom-18 z-50` black pill that springs in. Labels use a shared constant `formLabelClass = "text-black text-[14px] sm:text-[16px] font-roboto not-italic font-normal leading-normal"` (`Reserve.tsx:41-42`) — a good example of the string-constant-over-utility-component approach. `MAX_PEOPLE_PER_ROOM = 4` and a per-room `maxPeople` computation drive the GuestCounter cap.

---

## 4. Recurring UI patterns

### 4.1 The section pattern (used by 6 of 8 sections)

Every home section is: `"use client"` → read locale via `useParams` → two CMS hooks → `useEffect(refetch, [locale])` → `<section className="container">` → heading block → content.

```tsx
// AccommodationList.tsx:37-50
const params = useParams();
const currentLocale = params.locale as string;
const { page, refetch } = useCmsPageDetail("accommodationsection", currentLocale);
useEffect(() => { refetch() }, [currentLocale]);
...
<section className='container space-y-10 lg:space-y-10'>
  <div>
    <h1 className='text-2xl not-italic font-normal leading-normal text-black font-roboto lg:text-3xl'>
      {page?.name || ""}
    </h1>
    <p className='mt-3 max-w-4xl text-xs font-normal leading-5 text-black font-roboto lg:text-base'>
      {page?.description || ""}
    </p>
  </div>
```

Content key convention: `useCmsPageDetail("<name>section", locale)` for the heading (`home`, `bannerdesctiption`, `journeysection`, `newssection`, `accommodationsection`, `subscriptionsection`) and `useCmsPostsBySlug("<slug>", { language: locale })` for the items (`accommodation`, `gallery`, `news`, `desertjourney`, `whychooseus`). **Every section returns `null`/empty-renders rather than throwing when the CMS has no content** (`{page?.name || ""}`).

Two heading layouts: left-aligned (most sections) and centered (`space-y-3 text-center` on `BannerSection`, `SubscriptionSection`).

### 4.2 Card patterns

**Room/lodge card** — `Accommodation.tsx:122-227`, built on shadcn `Card`:

```tsx
<Card className="p-3 h-full rounded-3xl lg:p-5">
  <div className="flex flex-col space-y-3 h-full">
    <Link href={`/accommodation/${item._id}`}>
      <div className="w-full aspect-[5/2] overflow-hidden">
        <Image width={1920} height={1080} src={item?.thumbnail?.url}
               className="object-cover w-full h-full rounded-2xl" />
      </div>
      <CardContent className="flex flex-col flex-1 justify-between">
        ...
        <Button variant="outline" size="lg">{t("See more")}</Button>
```

Signature: `Card` rounded to `rounded-3xl`, padded `p-3 lg:p-5`, image inset with `rounded-2xl` at a fixed `aspect-[5/2]`, `CardContent` as flex column with `justify-between` so the CTA sticks to the bottom, and `h-full` + `flex-1` for equal-height cards in the grid.

**News card** — no `Card` at all, just an `article`:

```tsx
<Link href={`/news/${item._id}`}>
  <article className="space-y-3">
    <Image className="object-cover rounded-2xl h-[200px] lg:h-[300px] w-full" … />
    <div className="space-y-2">
      <div className="flex … text-black/70 … lg:text-sm">{tag} • {date}</div>
      <h3 className="text-base font-normal leading-normal text-black font-roboto lg:text-lg">{item.title}</h3>
      <p className="overflow-hidden text-xs … text-black/70 font-roboto">{item.excerpt.slice(0, 170)}</p>
```

(`NewsSection.tsx:91-112`). Image is **fixed-height** (`200px` → `300px`), not aspect-ratio. Excerpt truncated by `slice(0, 170)` chars.

**Amenity chip** — `Accommodation.tsx:203-206`, glassmorphic pill:

```tsx
<div className="border rounded-full flex p-1.5 lg:p-2 justify-center items-center gap-2.5 backdrop-blur-md">
  <div>{info.icon}</div>
  <span className="text-xs font-normal leading-normal text-black font-roboto lg:text-sm">
    {info.label}
  </span>
</div>
```

Overflow is represented by an identical chip containing `<Plus/>` and the remaining count — computed with `window.innerWidth` breakpoints.

### 4.3 Button variants in real use

From `src/components/ui/button.tsx:8-40`, `cva` with 6 variants / 4 sizes, base class `rounded-full`:

- variants: `default` (`bg-primary … hover:bg-primary/90`), `destructive`, `outline`, `secondary`, `ghost`, `link`
- sizes: `default` (`px-4 py-2`), `sm` (`h-8`), `lg` (`h-10`), `icon` (`size-9`)

Observed usage in home sections / layout:

| Variant   | Where                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| `default` | Reserve submit (`Reserve.tsx:249`) — overridden to `py-2.5 has-[>svg]:pl-6 has-[>svg]:pr-3`                       |
| `outline` | "See more" on cards (`Accommodation.tsx:225`), Reserve close X (`Reserve.tsx:157`), ReviewCard arrows (`ghost`)   |
| `ghost`   | ReviewCard prev/next arrows with `bg-white/80 hover:bg-white`, Subscription submit (`SubscriptionSection.tsx:56`) |
| `link`    | Sign-in pill in `containers/auth/current-user.tsx`, "Forgot password" in `login-form.tsx`                         |

Notes: `default` renders `<h1>` inside the Reserve button for its label (`Reserve.tsx:254`) — invalid nesting. Auth buttons bypass the variant system almost entirely, re-declaring `className` with `h-12 … rounded-full bg-primary text-white` (`containers/auth/login-form.tsx`). `motion(Button)` is aliased as `MotionButton` for spring animation (`Reserve.tsx:44`). `badge.tsx` exists with 4 variants but is **never used**.

### 4.4 Image handling — `src/components/ui/image.tsx`

The default for all CMS imagery; `next/image` is used directly only for logos and a handful of static UI icons. Three responsibilities:

**a) URL resolution.** `const fixedSrc = readFile(src || "")` — `readFile` (`src/lib/utils.ts:40-66`) rewrites a bare CMS attachment key into a full URL, or rewrites an absolute `/read-file?key=…` URL onto `NEXT_PUBLIC_MAIN_API_DOMAIN`. It also short-circuits `data:` and `blob:` URLs. Because the CMS hands out opaque keys, **every image component must go through this**.

**b) Cloudflare image CDN.** `src/lib/image-loader.tsx`:

```ts
export default function cloudflareLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  const params = [`width=${width}`, "format=avif"];
  const trimmedSrc = src.trim();
  if (trimmedSrc.startsWith("https://imagedelivery.net/")) {
    return `${trimmedSrc.slice(0, -6)}${params.join(",")}`;
  }
  const q = `quality=${quality || 75}`;
  return `https://erxes.io/cdn-cgi/image/${params.concat([q]).join(",")}/${trimmedSrc}`;
}
```

Two upstream CDNs. Images already on `imagedelivery.net` get params appended in place; everything else is routed through a Cloudflare `/cdn-cgi/image/` proxy on a third-party origin. Loader is skipped for local paths (`srcI.startsWith("/")` or `//:localhost`).

**c) A Ken-Burns-style load animation — this is the project's signature image treatment:**

```tsx
className={cn(
  "object-cover",
  !skipAnimation && loading
    ? "scale-110 blur-2xl grayscale"
    : "scale-100 blur-0 grayscale-0",
  srcI === PLACEHOLDER && "object-contain",
  className,
)}
```

Blur + grayscale + 110% scale while loading, resolving to sharp on `onLoad`. Falls back to `PLACEHOLDER = "/images/metaBackground.jpg"` when `src` is empty **or** when `onError` fires, and switches to `object-contain` so the placeholder isn't cropped. `fill` is inferred when either dimension is omitted. `sizes` gets a default for fill-mode images: `(max-width: 768px) 20vw, (max-width: 1200px) 15vw, 15vw`.

Practical notes: `width`/`height` are effectively decorative (CMS images are always rendered at `1920×1080` to satisfy Next's requirement while CSS controls actual size); a `// TODO: use srcSet etc.` sits above `getWidth()`. `CustomImage.tsx` is a thin unused wrapper over `next/image`.

### 4.5 Loaders and skeletons — five variants, no standard

| Component            | Mechanism                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MainLoader.tsx`     | Lottie via `useLottie` with `public/animation/mainLoader.json`; `flex items-center justify-center min-h-[100vh]`, 16×16 lottie box + optional text |
| `Loader.tsx`         | 3 variants (`spinner` / `dots` / `pulse`), 3 sizes; default `color = "#D33718"` — a **raw hex**, not `var(--primary)`                              |
| `FourDotsLoader.tsx` | `cn()`-composed 4 bouncing dots                                                                                                                    |
| `loading.tsx`        | `LoadingIcon`, used inline inside buttons (`{loading && <LoadingIcon className="mr-2 h-4 w-4 w-4" />}`)                                            |
| `GridSkeleton.tsx`   | `animate-pulse` block placeholders                                                                                                                 |

`MainLoader` is the app-wide loader — mounted by `containers/config/currentConfig.tsx:26` as the whole-page gate while site config loads. `GridSkeleton` takes a `mobileSingle` prop to render a mobile-first placeholder that mirrors the carousel→grid swap.

**Two skeleton styles coexist:** Tailwind's own `animate-pulse` with `bg-gray-200` blocks (used inline in 5+ sections, always with the same `rounded w-*` bar shapes), and `GridSkeleton`. Neither is derived from tokens — `gray-200` is hardcoded. Several sections write their skeleton inline rather than reaching for `GridSkeleton`:

```tsx
// JourneySection.tsx:121-128 (section heading skeleton)
<div className="animate-pulse">
  <div className="h-7 bg-gray-200 rounded w-2/3 lg:w-1/2" />
  <div className="mt-3 space-y-2">
    <div className="h-4 bg-gray-200 rounded w-5/6" />
    <div className="h-4 bg-gray-200 rounded w-2/3" />
  </div>
</div>
```

The pattern (`h-7` title + two `h-4` lines, `bg-gray-200 rounded`) is stable enough to be an unwritten convention.

### 4.6 Carousels

`src/components/ui/carousel.tsx` is the shadcn Embla wrapper. Four distinct configurations in use:

1. **Hero background** (`VideoPageLayout.tsx:60-77`) — `opts={{loop:true}}`, autoplay 4s, `align` default, full-bleed with `data-slot` selectors forcing item height:
   ```tsx
   className =
     "h-full w-full [&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]>div]:h-full";
   ```
2. **Gallery** (`GallerySection.tsx:38-43`) — `align: "center", loop: true, containScroll: false`, per-item `basis` staircase:
   ```tsx
   className =
     "pl-2 sm:pl-3 md:pl-4 basis-[85%] sm:basis-[75%] md:basis-[70%] lg:basis-[60%] xl:basis-[50%]";
   ```
   Arrows `hidden lg:flex absolute … top-1/2 -translate-y-1/2 backdrop-blur-md bg-white/10 hover:bg-transparent text-white border-none shadow-lg hover:scale-105 z-10`; dots hidden on desktop (`lg:hidden`).
3. **Journey** (`JourneySection.tsx:55-59`) — autoplay 6s, `align: "start"`, `overflow-hidden w-full rounded-lg shadow-md`, with custom circular dot buttons (`w-2 h-2 lg:w-3 lg:h-3 rounded-full`, active = `bg-white scale-110 shadow-lg`).
4. **Reviews** (`MemoriesSection.tsx:117`) — `opts={{ align: "start", loop: false }}`, `basis-full`, drives **infinite scroll** via `api.on("select")` → `if (current >= total - 3) loadMore()`.

Autoplay config is identical everywhere except delay: `Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: false })`, held in a `useRef` so the plugin instance is stable across renders, with manual `stop()`/`play()` wired to `onMouseEnter/onMouseLeave/onTouchStart/onTouchEnd/onTouchCancel`.

Arrows are hidden on mobile in favor of dots; dots are hidden on desktop in favor of arrows. Consistent but hand-written twice.

### 4.7 Accordions

Stock shadcn `Accordion` (Radix) is used in `src/components/appointment/time/AppointmentPickerDayRange.tsx`, and a custom `framer-motion` accordion exists as `src/components/spa-wellness/SpaAccordton.tsx` (note the typo in the filename). `NewsSection`, `MemoriesSection`, `GallerySection` do **not** use accordions — the `html { scrollbar-width: none }` rule in `globals.css` means vertical scroll areas show no scrollbar at all.

---

## 5. Per-section recipe

Home composition order (`src/components/clientPages/homePage/homePage.tsx:30-42`):

```tsx
<VideoPageLayout
  title={page?.name}
  description={page?.description}
  imageSrc={page?.thumbnail?.url}
  pageImages={page?.pageImages}
  loading={loading}
>
  <div className="space-y-10 lg:space-y-15">
    <WhyChooseUs />
    <AccommodationSection />
    <JourneySection />
    <GallerySection />
    <NewsSection />
    <MemoriesSection />
    <BannerSection isShow={true} isContainer={true} />
    {/* <SubscriptionSection /> */}
  </div>
</VideoPageLayout>
```

---

### `WhyChooseUs` — the only scroll-driven section

**Structure:** 6 lines. Fetches `useCmsPostsBySlug("whychooseus", { language })` and delegates everything to `ScrollStack`:

```tsx
const WhyChooseUs = () => {
  const params = useParams();
  const currentLocale = params.locale as string;
  const { posts: whychooseus, refetch } = useCmsPostsBySlug("whychooseus", {
    language: currentLocale,
  });
  useEffect(() => {
    refetch();
  }, [currentLocale]);
  return (
    <div className="container">
      <ScrollStack items={whychooseus} />
    </div>
  );
};
```

**`ScrollStack` animation (the most distinctive motion in the project)** — sticky cards that fan out as you scroll:

```tsx
const DESKTOP_LAYER_GAP = 72; const MOBILE_LAYER_GAP = 40;
const { scrollYProgress } = useScroll({ target: cardRef, offset: ["start 65%", "start 45%"] });
const y = useTransform(scrollYProgress, [0, 1], [120, index * gap]);
return (
  <motion.div ref={cardRef} style={{ y, zIndex: index + 1 }} className='sticky top-20 md:top-28 lg:top-32'>
    <div className='relative overflow-hidden rounded-[24px] md:rounded-[28px] shadow-2xl ring-1 ring-black/5 bg-black'>
      <Image className='w-full h-[50vh] md:h-[60vh] lg:max-h-[620px] object-cover' … />
      <div className='absolute top-0 left-0 w-full h-full bg-black/30'></div>
```

(`ScrollStack.tsx:33-71`). Container height is computed in JS: `height: ${Math.max(items.length,1) * heightPerItemVh}vh` with `heightPerItemVh` 80 (desktop) / 70 (mobile), and `isMobile` is tracked with `window.matchMedia("(max-width: 640px)")`. Uses `useScroll` + `useTransform` (not `whileInView`) so the fan-out is continuously scroll-linked, with `sticky top-20 md:top-28 lg:top-32` so cards stack under the fixed header. Overlay chrome is glass: `rounded-full border border-white backdrop-blur-sm text-white p-1 lg:p-2` pills. Wrapper gets `mb-24 md:mb-44`.

**No skeleton** — renders nothing until data arrives.

---

### `AccommodationList` — tabbed card grid

**Structure:** `<section className='container space-y-10 lg:space-y-10'>` → heading block → `<div className='space-y-6'>` → `<Accommodation perPage={2} />`. A tab row + "See All" link is **fully commented out** (`AccommodationList.tsx:53-79`) but `activeTab` state and both branches survive, so `LodgeStays` is dead in practice.

**Delegated to `Accommodation.tsx`:** dual-source — `useCmsPostsBySlug("accommodation")` for editorial copy, `useRooms()` (live PMS inventory) for price and availability, joined via `getRoomProductId(post)`. Price precedence: live `getRoomUnitPrice(correspondingRoom)` → `item.customFieldsMap.rooms.price` → `0`.

**Layout:** the carousel→grid swap (§3.5) with `perPage={2}`. Grid is `hidden grid-cols-2 gap-6 lg:grid`. Cards are `rounded-3xl` with `aspect-[5/2]` images.

**Loading:** bespoke 2-up skeleton matching the grid, second card hidden on mobile:

```tsx
<div className="grid grid-cols-1 gap-6 w-full lg:grid-cols-2">
  {[...Array(2)].map((_, i) => (
    <div className={`rounded-3xl p-3 lg:p-5 space-y-3 animate-pulse ${i === 1 ? "hidden lg:block" : ""}`}>
      <div className="w-full aspect-[5/2] rounded-2xl bg-gray-200" />
      <div className="space-y-2">
        <div className="w-2/3 h-4 bg-gray-200 rounded" />
        <div className="w-full h-3 bg-gray-200 rounded" />
        <div className="w-5/6 h-3 bg-gray-200 rounded" />
```

(`Accommodation.tsx:99-116`). Animates: Embla 5s autoplay only.

---

### `JourneySection` — alternating 55/45 editorial rows

**Structure:** `<section className="container">` → `<div className="mb-4 lg:mb-10">` heading (with its own skeleton) → `desertjourney.map(...)` rendering `<JourneyItem>`. Source: `useCmsPostsBySlug("desertjourney")` + `useCmsPageDetail("journeysection", locale)`.

**Row layout + alternation:**

```tsx
className={`flex flex-col lg:flex-row w-full justify-between items-center gap-3 ${
  index % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}
```

**Media side:** Embla `Autoplay({delay:6000})`, `align:"start" loop:true`, `overflow-hidden w-full rounded-lg shadow-md`, arrows `hidden sm:flex` (not `lg`), images `h-[240px] md:h-[300px] lg:h-[400px]` with `priority={index === 0 && imageIndex === 0}`.

**Text side:** `<div className="w-full lg:w-[45%]">` containing only `<ContentRenderer content={item?.content || ""} />`. All formatting is delegated to `ContentRenderer` (`src/components/ContentRenderer.tsx`), which sanitizes CMS HTML via `html-react-parser` (strips every `style` attribute in a `replace` callback) and renders with `@tailwindcss/typography` `prose` plus a long list of descendant selectors that reproduce the Figma type scale inside list items:

```tsx
className={cn(`prose max-w-none
  [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-6
  [&_li>p:first-of-type]:text-base sm:[&_li>p:first-of-type]:text-xl lg:[&_li>p:first-of-type]:text-2xl
  [&_li>p:first-of-type]:font-roboto lg:[&_li>p:first-of-type]:mb-2
  [&_li>p:nth-of-type(2)]:text-xs sm:[&_li>p:nth-of-type(2)]:text-sm
  lg:[&_li>p:nth-of-type(2)]:text-base`, className)}
```

(`ContentRenderer.tsx:26-44`). Because CMS HTML carries no classes, **prose typography is implemented entirely as arbitrary-variant descendant selectors** — the only place in the codebase that does this.

**Loading:** a full 2-row skeleton that reproduces the `lg:flex-row-reverse` alternation.

---

### `GallerySection` — edge-peeking image carousel

**Structure:** `<div className="relative w-full">` only — **no `container`, no section heading** (unlike every other section). Images are flattened out of all posts: `posts.flatMap(post => post?.images || []).filter(Boolean)`.

**Carousel:** `align:"center", loop:true, containScroll:false`, per-item `basis-[85%] sm:basis-[75%] md:basis-[70%] lg:basis-[60%] xl:basis-[50%]` — a peek-based hero carousel that gets progressively wider on small screens. Container `rounded-2xl overflow-hidden` on the inner div with `shadow-xl hover:shadow-2xl transition-all duration-300`, heights `h-[240px] md:h-[300px] lg:h-[450px]` (skeleton) / `lg:h-[400px]` (loaded — a **mismatch** between the two).

**Arrows/dots split:** arrows `hidden lg:flex absolute left-2 sm:left-4 md:left-[2%] top-1/2 -translate-y-1/2 backdrop-blur-md bg-white/10 hover:bg-transparent text-white border-none shadow-lg hover:scale-105 z-10`; dots `mt-2 flex items-center justify-center gap-2 lg:hidden` using the pill indicator (`h-1.5 rounded-full transition-all` → active `w-6 bg-gray-400`).

**Loading:** 3 skeleton items using the _exact same_ `basis` class string, so the layout doesn't shift. Animates: none (manual scroll only, no autoplay).

---

### `NewsSection` — the most feature-complete section

**Props-driven:** `showHeader?: "false" | "true"` (string, not boolean) and `layout?: "carousel" | "grid"`. Both header branches are copy-pasted duplicates differing only by the "See All" link.

**Header with inline CTA:**

```tsx
<div className="mb-4 lg:mb-10">
  <h1 className="text-2xl not-italic font-normal leading-normal text-black font-roboto lg:text-3xl">{page?.name || ""}</h1>
  <div className="flex justify-between items-center mt-3">
    <p className="font-roboto text-xs lg:text-base font-normal leading-5 text-black max-w-[320px] md:max-w-3xl lg:max-w-full">{page?.description || ""}</p>
    <Link href="/news" className="flex justify-center items-center gap-2.5 font-roboto text-sm lg:text-base font-normal leading-normal text-black">
      {t("See All")}<ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
```

(`NewsSection.tsx:126-141`). The `group-hover:translate-x-0.5` on the arrow has **no `group` class on the parent** — dead style.

**Description max-width also grows with breakpoint** (`max-w-[320px] md:max-w-3xl lg:max-w-full`) — the mobile 320px cap is a real design decision (short line length on phones), unique to this section.

**Grid variant:** `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6`. **Carousel variant:** mobile Embla 5s autoplay + dots, desktop `hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-3 lg:gap-6`.

**Dates:** hardcoded `toLocaleDateString("mn-MN", { year:"numeric", month:"long", day:"numeric" })` (`NewsSection.tsx:72-77`) — always Mongolian, regardless of the active locale. Also renders `/news/${item._id}` (the id, not the slug).

**Loading:** reuses `GridSkeleton mobileSingle={true}` rather than an inline skeleton. Animates: Embla autoplay only.

---

### `MemoriesSection` — testimonials over a photo background

**Unique structure:** not a `container` section. A full-bleed background layer with inline `backgroundImage`:

```tsx
<section className="w-full relative bg-cover bg-center bg-no-repeat min-h-[50vh] lg:min-h-[70vh] flex items-center justify-center"
         style={{ backgroundImage: "url('/images/metaBackground.jpg')" }}>
  <div className="absolute inset-0 bg-black/20 sm:bg-black/10"></div>
  <div className="relative z-10 w-full max-w-4xl px-4">
```

(`MemoriesSection.tsx:96-104`). Same `absolute inset-0` + scrim + `relative z-10` layering as the hero, but scrim opacity is responsive (`black/20 sm:black/10`).

**Data merge:** internal Erxes tickets + Google reviews, normalized into one shape and sorted newest-first:

```tsx
return [...internal, ...google].sort((a, b) => b.sortKey - a.sortKey);
```

Google reviews come from the app's own `/api/google-reviews` route via `useGoogleReviews()` — the only home section touching a REST endpoint. Ticket text is extracted from BlockNote JSON by `extractBlockNoteText`, and the rating is read from a hardcoded BlockNote custom-field key (name only). Author names are truncated at `" - "`. Dates formatted as `"Set with us in {month}. {year}"`.

**Carousel + infinite scroll:** `opts={{align:"start", loop:false}}` with an auto-advance effect:

```tsx
useEffect(() => {
  if (!hasMore) return;
  const total = api.scrollSnapList().length,
    current = api.selectedScrollSnap();
  if (current >= total - 3) loadMore();
}, [api, hasMore, loadMore]);
```

plus `api?.reInit()` when `reviews.length` changes — required because Embla caches item positions.

**Card:** `ReviewCard.tsx:26-37` is the only card in the repo using entrance animation:

```tsx
<motion.div className='relative rounded-lg shadow-lg backdrop-blur-sm bg-white/90'
  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
```

with `whileHover={{scale:1.1}} whileTap={{scale:0.95}}` on the arrow wrappers. Google-sourced cards get an `FcGoogle` badge. **Renders `null` when there are no reviews** — the only home section that bails out entirely.

---

### `BannerSection` — "getting here" block with lazy 3D embed

**Props:** `isShow = true` (heading toggle), `isContainer = false` (wrap in `container`). Root: `<div className={isContainer ? "container space-y-6" : "space-y-6"}>`.

**Heading is centered here:** `space-y-3 text-center` with `<h2 className="text-2xl font-normal leading-normal text-center text-black font-roboto lg:text-3xl">` — note `text-center` is redundant with the parent, and this is an `<h2>` where the others are `<h1>`.

**Lazy third-party embed:** a third-party 3D-tour iframe is **not** mounted on load. A poster button is rendered first, and the iframe only mounts after a click:

```tsx
{render3DLoaded ? (
  <div ref={iframeWrapperRef} className="relative w-full h-[200px] md:h-[300px] lg:h-[550px]">
    <iframe src={srcBanner3D} title="Tegri Gobi 3D" className="w-full h-full rounded-[20px]"
            allow="accelerometer; autoplay; …" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
    <button onClick={() => setRender3DLoaded(false)}
            className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm …">
      <X className="w-4 h-4" />
    </button>
  </div>
) : (
  <button onClick={() => setRender3DLoaded(true)}
          className="relative w-full h-[200px] md:h-[300px] lg:h-[550px] rounded-[20px] overflow-hidden group cursor-pointer"
          style={{ backgroundImage: "url('/images/banner.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
    … <Play /> … <span>{t("Load 3D View")}</span> <span className="text-white/70 …">{t("3d performance warning")}</span>
```

(`BannerSection.tsx:91-131`).

**Then it self-destructs to free GPU** — a genuinely good pattern:

```tsx
useEffect(() => {
  if (!render3DLoaded) return;
  const handleVisibility = () => {
    if (document.hidden) setRender3DLoaded(false);
  };
  document.addEventListener("visibilitychange", handleVisibility);
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.intersectionRatio === 0) setRender3DLoaded(false);
    },
    { threshold: 0 },
  );
  if (iframeWrapperRef.current) observer.observe(iframeWrapperRef.current);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    observer.disconnect();
  };
}, [render3DLoaded]);
```

`visibilitychange` + `IntersectionObserver` at `threshold: 0`. There's a localized warning string under the play button — a UX affordance the AI-generated version would omit.

**Info row:** three icon+text pairs (`MapPin`, `Plane`, `CarFront`) wrapping from centered on mobile to justified on desktop, with a hardcoded Google Maps deep link:

```tsx
<div className="flex flex-wrap gap-4 justify-center items-center lg:items-center sm:justify-between sm:gap-6 pb-5">
  <div className="w-full sm:w-auto lg:flex-1 flex items-center justify-center sm:justify-start gap-2 lg:gap-3 min-w-[220px]">
    <div className="flex justify-center items-center w-6 h-6 sm:w-7 sm:h-7">{data.icon}</div>
```

Plus a `Get Directions` link with an `ArrowRight`. Icon container sizing is fixed (`w-6 h-6 sm:w-7 sm:h-7`) with unsized `<MapPin/>` children — no explicit icon class. **No loading state** for the info row.

---

### `SubscriptionSection` — commented out of the home page

Not rendered (`homePage.tsx:41` has it commented), and its `handleSubmit` is an empty `e.preventDefault()` with a hardcoded English `'Your email'` placeholder. Still a useful reference for the centered heading + inline form pattern: `flex relative flex-col gap-3 items-stretch mx-auto max-w-md sm:flex-row sm:items-center sm:gap-0` with the submit button absolutely positioned over the input at `sm:absolute sm:right-1`. Note `max-w-5xl max-auto` — `max-auto` is not a valid Tailwind class.

### `TrendActivitiesSection` — dead

Zero references anywhere in `src/`.

---

## 6. Rules a generator should follow

### Reproduce these

1. **Two fonts, one job each.** Roboto (via `next/font/google`, CSS variable + `body` class) for all UI; DM Sans only for card excerpts. Four weights, `display: "swap"`.
2. **Tailwind v4 CSS-first.** No `tailwind.config.js`. `@import "tailwindcss"` + `@plugin "@tailwindcss/typography"` + `@custom-variant dark (&:is(.never-dark *))` to disable dark mode wholesale.
3. **One file of tokens, `@theme inline` mapping, oklch values.** Start from shadcn `neutral`, then override **only `--primary`** for brand color and `--radius` for the corner feel. Leave chart/sidebar tokens in even if unused — the primitives reference them.
4. **Override `container`** with `@utility container { margin-inline:auto; padding-inline:1rem; max-width:1536px; }`. One width for the whole site.
5. **Section spacing scale:** `space-y-10 lg:space-y-15` between sections; `space-y-2/3/4/6` inside components.
6. **The heading string is the design system.** Ship it as a shared constant rather than a 9-class copy-paste: `text-2xl not-italic font-normal leading-normal text-black font-roboto lg:text-3xl` + `mt-3 text-xs font-normal leading-5 text-black font-roboto lg:text-base`. No bold headings, `leading-normal`, mobile→desktop bump only.
7. **Two-step type scale, no `md:` for type.** `text-xs→lg:text-base`, `text-base→lg:text-lg`, `text-2xl→lg:text-3xl`.
8. **Section anatomy:** `<section className="container">` → heading block (`mb-4 lg:mb-10`) → content, all copy from CMS, all with `|| ""` fallbacks. Add `useEffect(refetch, [locale])`.
9. **Always render the carousel⇄grid pair** — mobile `lg:hidden` Embla with `basis-full`, desktop `hidden lg:grid` — with a pill dot indicator `h-1.5 rounded-full` (active `w-6 bg-gray-400`) below the mobile carousel and arrows on desktop.
10. **All CMS imagery through `@/components/ui/image`.** It does attachment-key resolution, the Cloudflare loader, blur→sharp entrance, and error fallback. Never raw `next/image` for CMS content; reserve raw `next/image` for local logos.
11. **Hero = `absolute inset-0 z-0` media + `bg-black/40` scrim + `relative z-10` content**, with `min-h-[60vh] md:min-h-[70vh] lg:min-h-screen` and a blurred placeholder while loading.
12. **Fixed header with scroll-linked transparency.** `fixed top-0 z-50`, animate `backgroundColor` white→transparent and `paddingTop` `36px`→`20px` at `scrollY > 10`. Desktop nav gated on **`xl:`**, not `lg:`.
13. **Footer inverts to `bg-primary text-white`**, mobile centered stack, desktop 3-part flex (About | logo+contact | Experience), `border-t border-gray-400` bottom bar.
14. **Skeleton conventions:** `animate-pulse` + `bg-gray-200` + `rounded`; title `h-7`, lines `h-4`, images `aspect-[5/2]` or fixed heights; skeletons must reproduce the loaded layout including `lg:flex-row-reverse` alternation and carousel `basis` classes.
15. **Scroll-linked fanning cards for the flagship editorial moment** — `useScroll` + `useTransform` + `sticky top-20 md:top-28 lg:top-32` + `zIndex: index + 1` + JS-computed container height in `vh`.
16. **Lazy-mount heavy third-party embeds, then destroy them** with `visibilitychange` + `IntersectionObserver`.
17. **Pill geometry everywhere:** `rounded-full` buttons/chips, `rounded-2xl` cards and images, `rounded-3xl` on accommodation cards, arbitrary `rounded-[20px]/[24px]/[25px]/[50px]` where the mockup needed it. `rounded-lg` only on legacy surfaces (`Card` default, `VideoPageLayout`).
18. **Glass overlays:** `border border-white backdrop-blur-sm bg-white/10` chips over imagery.
19. **Reserve/search widget as a floating pill** that expands from a FAB, persists open state to `localStorage`, and auto-hides when the footer scrolls into view.
20. **CMS-driven navigation:** `cpMenus` → `getMenuTree()` → top-level + `group-hover` dropdown; no hardcoded nav arrays in components.
21. **Sanitize all CMS HTML through `ContentRenderer`** (`html-react-parser` stripping `style`) and style it with `@tailwindcss/typography` plus explicit `[&_li>p:first-of-type]:…` descendant selectors.

### Avoid / fix these

1. **Never write raw hex colors.** `Loader.tsx:12` defaults `color = "#D33718"` when `--primary` is the source of that exact red.
2. **Don't nest `<h1>` inside `<button>`** (`Reserve.tsx:254`). Use a `<span>`.
3. **Don't emit `<h1>` for every section heading.** Use one `<h1>` per page, `<h2>` for sections, `<h3>` for cards — currently inconsistent (`JourneySection`/`NewsSection`/`AccommodationList` = `<h1>`, `BannerSection` = `<h2>`, cards = `<h3>`).
4. **Drop `not-italic`** on headings — no global italic exists.
5. **Fix `group-hover:` without `group`.** `NewsSection.tsx:139` arrow, `NewsSection.tsx:137` `flex justify-center items-center` on a container that isn't flex.
6. **Remove invalid classes:** `max-auto` (`SubscriptionSection.tsx:31`), `z-5` and `md:bottom-18` (`ReserveText.tsx:31`), `bottom-18` (`Reserve.tsx:275`), `mt-18` (`booking-layout.tsx`).
7. **Don't hardcode locale-specific formatting.** `NewsSection.tsx:72` always formats with `mn-MN`; `MemoriesSection` hardcodes English "Set with us in …"; `MemoriesSection`'s subtitle is fully English inside an i18n site.
8. **Never hardcode content IDs in JSX** for filtering (`LodgeStays.tsx:35-46` filters tours by comparing against four literal ids). Use a CMS field or a query variable.
9. **Extract the 4×-duplicated pieces:** the Embla `select` subscription effect, the dot indicator block, the section-heading class string, the skeleton heading block, the `framer-motion` variants (`Header` vs `SecondaryHeader`), and the `aria-invalid` focus ring (typed three times: `[14px]`, `text-sm`, `sm:text-[16px]`).
10. **Skip `text-black` in favor of `text-foreground`** (194 vs 12 uses) if you want themable text — or at least don't mix them.
11. **Don't ship unused primitives.** `badge.tsx` (0 uses), `CustomImage.tsx` (0 uses), `Loader.tsx`/`FourDotsLoader.tsx` (superseded by `MainLoader`/`loading.tsx`), `accordion`-family if unused. Also delete the chart/sidebar tokens and the no-op `.dark` block.
12. **Don't copy the "play icon" CTA on a static image.** `BannerSection`'s poster button implies a video; `<MainVideo/>` is commented out at `VideoPageLayout.tsx:57`, so `public/video/main.mp4` is currently dead weight.
13. **Avoid `html { overflow-x: hidden }`.** It silently clips overflow instead of fixing the cause.
14. **Avoid duplicate skeletons.** `GridSkeleton` exists; 5+ sections hand-roll their own. Pick one, and make it responsive-aware rather than passing a `mobileSingle` flag.
15. **Don't set `width={1920} height={1080}` on every CMS image** just to satisfy Next. It's a lie that produces wrong aspect ratios on non-16:9 assets.
16. **`ReviewCard`'s ease curve `[0.25,0.46,0.45,0.94]`** is a one-off magic-number ease array — fine, but it should be a named token if reused.
17. **`MatchMedia` in `ScrollStack.tsx:88-92` calls both `addEventListener` and the legacy `addListener`** with a `;` statement-prefixed second call. Use one API.
18. **Reading `window.innerWidth` during render** (`Accommodation.tsx:187`) is not SSR-safe — the hydration output can differ from the server's. Use `useMediaQuery` (already available at `src/lib/use-media-query.tsx` and used by `image.tsx`).

---

## File index

**Tokens / config:** `src/app/[locale]/globals.css` · `src/app/[locale]/layout.tsx` · `components.json` · `postcss.config.mjs`

**Primitives:** `src/components/ui/{button,badge,card,form,input,carousel,accordion,tabs,dialog,popover,select,calendar,sonner,menubar,avatar,checkbox,radio-group,scroll-area,separator,alert,alert-dialog,label,textarea}.tsx`

**Project UI:** `src/components/ui/{image,CustomImage,MainLoader,Loader,FourDotsLoader,GridSkeleton,loading,Icon,counter,date-time-picker,minimalist-calendar,minimalist-time-slot,time-picker,responsive-test,SkeletonAppointment}.tsx` · `src/components/ui/kibo-ui/video-player/` · `src/lib/image-loader.tsx` · `src/lib/use-media-query.tsx`

**Layout:** `src/components/layout/{ConditionalLayout,Header,SecondaryHeader,Footer,MainVideo,Reserve,ReserveText}.tsx` · `src/components/clientPages/{VideoPageLayout,DefaultPageLayout}.tsx` · `src/components/ContentRenderer.tsx`

**Home sections:** `src/components/{WhyChooseUs,ScrollStack,AccommodationList,Accommodation,LodgeStays,JourneySection,GallerySection,NewsSection,ReviewCard,MemoriesSection,BannerSection,SubscriptionSection,TrendActivitiesSection}.tsx` · `src/components/clientPages/homePage/homePage.tsx`
