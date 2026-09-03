/**
 * Create navigation menu items in erxes.
 * Ported from web/lib/menu-builder.ts; input contract adapted to
 * agents/ecommerce/AGENTS.md Step 5c — nested groups, flattened internally:
 * [
 *   { "name": "Main Navigation", "items": [{ "name": "Home", "link": "/", "order": 1 }] },
 *   { "name": "Footer",          "items": [{ "name": "About", "link": "/about", "order": 1 }] }
 * ]
 *
 * kind mapping: an item's explicit `kind` wins; otherwise a group whose name
 * contains "footer" (case-insensitive) maps to "footer", anything else to
 * "header" (the two kinds the cpMenus queries filter on).
 *
 * Output: prints array of created menu item _ids as JSON
 */
import type {
  SeedMenuGroup,
  SeedMenuItem,
  ErxesContext,
} from "./seed-types.js";

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

export function flattenMenuGroups(groups: SeedMenuGroup[]): SeedMenuItem[] {
  return groups.flatMap((group) =>
    group.items.map((item) => ({
      label: item.name,
      url: item.link,
      order: item.order,
      kind:
        item.kind ??
        (/footer/i.test(group.name) ? ("footer" as const) : ("header" as const)),
    }))
  );
}

export async function menuBuilder(
  groups: SeedMenuGroup[],
  intent: ErxesContext
): Promise<string[]> {
  const items = flattenMenuGroups(groups);
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
            label: item.label,
            url: item.url,
            order: item.order,
            language: intent.language,
            kind: item.kind,
          },
        },
      }),
    });

    const data = (await response.json()) as {
      data?: { cpCmsAddMenu?: { _id: string } };
      errors?: { message: string }[];
    };

    if (data.data?.cpCmsAddMenu?._id) {
      const id = data.data.cpCmsAddMenu._id;
      ids.push(id);
      console.log(`  ✓ [${item.kind}] "${item.label}" → ${id}`);
    } else if (data.errors?.length) {
      console.warn(`  ✗ "${item.label}":`, data.errors[0].message);
    }
  }

  return ids;
}
