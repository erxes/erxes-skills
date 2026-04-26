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
            clientPortalId: intent.erxes_cp_id,
            language: intent.language,
            name: page.name,
            slug: page.slug,
            description: page.description,
            content: page.content,
            status: "published",
          },
        },
      }),
    });

    const data = await response.json() as {
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
