import type { SeedMenuItem, ErxesContext } from "../types.js";

const MUTATION = `
  mutation CpCmsAddMenu($input: MenuItemInput!) {
    cpCmsAddMenu(input: $input) {
      _id
      label
      url
      order
    }
  }
`;

export async function menuBuilder(
  items: SeedMenuItem[],
  intent: ErxesContext
): Promise<string[]> {
  const ids: string[] = [];

  console.log(`→ [menu-builder] Creating ${items.length} menu items...`);

  for (const item of items) {
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
              label: item.label,
              url: item.url,
              order: item.order,
              kind: "link",
            },
        },
      }),
    });

    const data = await response.json() as {
      data?: { cpCmsAddMenu?: { _id: string } };
      errors?: { message: string }[];
    };

    if (data.data?.cpCmsAddMenu?._id) {
      const id = data.data.cpCmsAddMenu._id;
      ids.push(id);
      console.log(`  ✓ "${item.label}" → ${id}`);
    } else {
      console.warn(`  ✗ "${item.label}":`, data.errors?.[0]?.message);
    }
  }

  return ids;
}
