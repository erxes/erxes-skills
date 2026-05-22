# Code Conventions

Follow these in every file you write.

## React / Next.js
- Prefer Server Components — every section is a Server Component by default
- Only add `"use client"` when you need browser APIs, React hooks, or event handlers
- Use `next/image <Image>` for all images — never `<img>`
- Use `next/link <Link>` for all internal navigation — never `<a>`
- Keep `"use client"` components small and leaf-level

## Tailwind CSS
- No inline styles
- No hardcoded hex colors — use CSS variables or Tailwind tokens
- Mobile-first — all sections must be responsive

## TypeScript
- No `any` except in `section.config` access (it is typed `any` intentionally)
- Never use `id` — erxes always returns `_id`

## Data patterns
- `externalLinks.phones` and `.emails` are JSON strings — always use `parseStringOrArray` before calling `.map()`:
  ```ts
  const parseStringOrArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try { return JSON.parse(value); } catch { return [value]; }
    }
    return [];
  };
  ```
- Stock check: `remainder > 0` — never use `|| 999` fallback
  - If `remainder` is `null` or `undefined` → treat as in-stock (`true`)
- ISR cache: `lib/client.ts` has `next: { revalidate: 60 }` — do not change

## Content
- No lorem ipsum — all placeholder text must be real copy
- All copy comes from `section.config` — never hardcoded in components

## Build
- Run `pnpm build` after every batch of changes
- Fix all TypeScript and ESLint errors before reporting done
- No `console.log` in committed code
