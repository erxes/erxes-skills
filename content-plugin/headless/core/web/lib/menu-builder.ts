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

const MENUS_QUERY = `
  query CpMenus($language: String) {
    cpMenus(language: $language) {
      _id
      url
      kind
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

function normalizeKind(kind?: string): string {
  return kind || "link";
}

/** Menu uniqueness key: url + kind (mirrors how the frontend dedupes cpMenus). */
function dedupeKey(url: string | undefined, kind?: string): string {
  return `${url ?? ""}|${normalizeKind(kind)}`;
}

/**
 * Loads existing menu items (url + kind) so re-runs skip items that already
 * exist instead of creating duplicate records.
 */
export async function findExistingMenuKeys(
  intent: ErxesContext,
  headers: Record<string, string>
): Promise<Map<string, string>> {
  const data = await fetchJson(intent.erxes_endpoint, headers, {
    query: MENUS_QUERY,
    variables: { language: intent.language },
  });
  const menus =
    (data.data as
      | { cpMenus?: { _id: string; url?: string; kind?: string }[] }
      | undefined)?.cpMenus ?? [];
  const map = new Map<string, string>();
  for (const m of menus) {
    map.set(dedupeKey(m.url, m.kind), m._id);
  }
  return map;
}

export async function menuBuilder(
  items: SeedMenuItem[],
  intent: ErxesContext
): Promise<string[]> {
  const ids: string[] = [];

  console.log(`→ [menu-builder] Creating ${items.length} menu items...`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-app-token": intent.erxes_app_token,
  };

  const existing = await findExistingMenuKeys(intent, headers);

  for (const item of items) {
    const key = dedupeKey(item.url, item.kind);
    const existingId = existing.get(key);
    if (existingId) {
      ids.push(existingId);
      console.log(`  ≐ "${item.label}" (${key}) already exists (${existingId}), skipping`);
      continue;
    }

    const response = await fetch(intent.erxes_endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: MUTATION,
        variables: {
          input: {
            label: item.label,
            url: item.url,
            order: item.order,
            language: intent.language,
            kind: item.kind,
            ...(item.translations?.length ? { translations: item.translations } : {}),
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
      existing.set(key, id);
      ids.push(id);
      console.log(`  ✓ "${item.label}" → ${id}`);
    } else {
      console.warn(`  ✗ "${item.label}":`, data.errors?.[0]?.message);
    }
  }

  return ids;
}