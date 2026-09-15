/**
 * Create CMS pages in erxes.
 * Ported from web/lib/page-creator.ts; input contract adapted to
 * agents/ecommerce/AGENTS.md Step 5a — one object per language:
 * [{ slug, lang, title, description, content, status?, meta? }]
 *
 * Idempotent: pages are looked up per language (cpPages) before each
 * cpCmsPagesAdd — a page whose (slug, language) pair already exists is skipped
 * instead of re-created, so repeated runs don't duplicate it.
 *
 * Output: prints { "<slug>:<lang>": _id } map as JSON
 */
import type { SeedPage, ErxesContext } from "./seed-types.js";

const MUTATION = `
  mutation CpCmsPagesAdd($input: PageInput!) {
    cpCmsPagesAdd(input: $input) {
      _id
      name
      slug
    }
  }
`;

const PAGES_QUERY = `
  query CpPages($language: String) {
    cpPages(language: $language) {
      _id
      slug
    }
  }
`;

async function fetchJson(
  endpoint: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): Promise<{ data?: unknown; errors?: { message: string }[] }> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Returns existing pages (slug -> _id) for a language, cached per language. */
export async function findExistingPagesForLang(
  lang: string,
  intent: ErxesContext,
  headers: Record<string, string>,
  cache = new Map<string, Map<string, string>>()
): Promise<Map<string, string>> {
  const cached = cache.get(lang);
  if (cached) return cached;
  const data = await fetchJson(intent.erxes_endpoint, headers, {
    query: PAGES_QUERY,
    variables: { language: lang },
  });
  const pages =
    (data.data as { cpPages?: { _id: string; slug?: string }[] } | undefined)?.cpPages ?? [];
  const map = new Map<string, string>();
  for (const p of pages) {
    if (p.slug) map.set(p.slug, p._id);
  }
  cache.set(lang, map);
  return map;
}

export async function pageCreator(
  pages: SeedPage[],
  intent: ErxesContext
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  console.log(`→ [page-creator] Creating ${pages.length} pages...`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-app-token": intent.erxes_app_token,
  };

  const existingCache = new Map<string, Map<string, string>>();

  for (const page of pages) {
    const lang = page.lang || intent.language;
    const key = `${page.slug}:${lang}`;

    // Skip (slug, language) pairs that already exist so re-runs don't duplicate.
    const existing = await findExistingPagesForLang(lang, intent, headers, existingCache);
    const existingId = existing.get(page.slug);
    if (existingId) {
      map[key] = existingId;
      console.log(`  ≐ page "${key}" already exists (${existingId}), skipping`);
      continue;
    }

    const response = await fetch(intent.erxes_endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: MUTATION,
        variables: {
          input: {
            language: lang,
            name: page.title,
            slug: page.slug,
            description: page.description,
            content: page.content,
            status: page.status ?? "published",
            ...(page.meta ? { meta: page.meta } : {}),
          },
        },
      }),
    });

    const data = (await response.json()) as {
      data?: { cpCmsPagesAdd?: { _id: string } };
      errors?: { message: string }[];
    };

    if (data.errors?.length) {
      console.warn(`  ✗ page "${key}":`, data.errors[0].message);
    } else if (data.data?.cpCmsPagesAdd?._id) {
      const id = data.data.cpCmsPagesAdd._id;
      existing.set(page.slug, id);
      map[key] = id;
      console.log(`  ✓ "${key}" → ${id}`);
    }
  }

  return map;
}
