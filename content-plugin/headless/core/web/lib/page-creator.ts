import type { SeedPage, ErxesContext } from "../types.js";

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

/** Looks up an existing page _id by slug (reuses the first match). */
export async function findPageIdBySlug(
  slug: string,
  intent: ErxesContext,
  headers: Record<string, string>
): Promise<string | null> {
  const data = await fetchJson(intent.erxes_endpoint, headers, {
    query: PAGES_QUERY,
    variables: { language: intent.language },
  });
  const pages =
    (data.data as { cpPages?: { _id: string; slug?: string }[] } | undefined)?.cpPages ?? [];
  return pages.find((p) => p.slug === slug)?._id ?? null;
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

  for (const page of pages) {
    // Skip pages that already exist so re-runs don't create duplicates.
    const existingId = await findPageIdBySlug(page.slug, intent, headers);
    if (existingId) {
      map[page.section] = existingId;
      console.log(`  ≐ page "${page.section}" already exists (${existingId}), skipping`);
      continue;
    }

    const response = await fetch(intent.erxes_endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: MUTATION,
        variables: {
          input: {
            language: intent.language,
            name: page.name,
            slug: page.slug,
            description: page.description,
            content: page.content,
            status: "published",
            ...(page.translations?.length ? { translations: page.translations } : {}),
          },
        },
      }),
    });

    const data = (await response.json()) as {
      data?: { cpCmsPagesAdd?: { _id: string } };
      errors?: { message: string }[];
    };

    if (data.errors?.length) {
      console.warn(`  ✗ page "${page.section}":`, data.errors[0].message);
    } else if (data.data?.cpCmsPagesAdd?._id) {
      const id = data.data.cpCmsPagesAdd._id;
      map[page.section] = id;
      console.log(`  ✓ "${page.section}" → ${id}`);
    }
  }

  return map;
}