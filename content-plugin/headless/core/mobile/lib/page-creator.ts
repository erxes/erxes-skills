/**
 * Create CMS pages in erxes.
 * Ported from web/lib/page-creator.ts; input contract adapted to
 * agents/ecommerce/AGENTS.md Step 5a — one object per language:
 * [{ slug, lang, title, description, content, status?, meta? }]
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

export async function pageCreator(
  pages: SeedPage[],
  intent: ErxesContext
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  console.log(`→ [page-creator] Creating ${pages.length} pages...`);

  for (const page of pages) {
    const response = await fetch(intent.erxes_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-token": intent.erxes_app_token,
      },
      body: JSON.stringify({
        query: MUTATION,
        variables: {
          input: {
            language: page.lang || intent.language,
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

    const key = `${page.slug}:${page.lang || intent.language}`;
    if (data.errors?.length) {
      console.warn(`  ✗ page "${key}":`, data.errors[0].message);
    } else if (data.data?.cpCmsPagesAdd?._id) {
      const id = data.data.cpCmsPagesAdd._id;
      map[key] = id;
      console.log(`  ✓ "${key}" → ${id}`);
    }
  }

  return map;
}
