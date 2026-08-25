/**
 * Create blog posts in erxes.
 * Ported from web/lib/post-seeder.ts; input contract adapted to
 * agents/ecommerce/AGENTS.md Step 5b — flat array, one object per language,
 * NO top-level category object:
 * [{ lang, title, slug, description?, content, status?, publishedDate?, categoryIds? }]
 *
 * Category handling: entries WITHOUT a `categoryIds` key are attached to a
 * shared default category ("Blog" / slug "blog") that is looked up via
 * cpCategories and created via cpCmsCategoriesAdd only if missing — repeated
 * runs reuse the same category instead of duplicating it. Entries WITH an
 * explicit `categoryIds` value are passed through verbatim; `"categoryIds": []`
 * forces an uncategorized post.
 *
 * Field mapping notes (gateway-proven field names only):
 * - docs' `description` is sent as PostInput `excerpt` (the field web's
 *   post-seeder uses against the same gateway); `publishedDate` and
 *   `categoryIds` were verified against the live gateway by the legacy
 *   mobile seeding flow this script replaces
 *
 * Output: prints { post_ids, category_id } as JSON
 */
import type { SeedPost, ErxesContext } from "./seed-types.js";

const POST_MUTATION = `
  mutation CpCmsPostsAdd($input: PostInput!) {
    cpCmsPostsAdd(input: $input) {
      _id
      title
      slug
    }
  }
`;

const CATEGORY_MUTATION = `
  mutation CpCmsCategoriesAdd($input: PostCategoryInput!) {
    cpCmsCategoriesAdd(input: $input) {
      _id
      name
      slug
    }
  }
`;

const CATEGORIES_QUERY = `
  query CpCategories($language: String) {
    cpCategories(language: $language) {
      list {
        _id
        name
        slug
      }
    }
  }
`;

export const DEFAULT_CATEGORY = { name: "Blog", slug: "blog" } as const;

async function fetchJson(
  endpoint: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): Promise<{ data?: Record<string, unknown>; errors?: { message: string }[] }> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Looks up an existing category by slug (fallback: case-insensitive name). */
export async function findCategoryId(
  slug: string,
  name: string,
  intent: ErxesContext,
  headers: Record<string, string>
): Promise<string | null> {
  const data = await fetchJson(intent.erxes_endpoint, headers, {
    query: CATEGORIES_QUERY,
    variables: { language: intent.language },
  });
  const list = (data.data?.cpCategories as { list?: { _id: string; name: string; slug: string }[] })
    ?.list ?? [];
  const match =
    list.find((c) => c.slug === slug) ??
    list.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return match?._id ?? null;
}

/** Returns the default category's _id, creating it first if it doesn't exist. */
export async function ensureDefaultCategoryId(
  intent: ErxesContext,
  headers: Record<string, string>
): Promise<string | null> {
  const existing = await findCategoryId(
    DEFAULT_CATEGORY.slug,
    DEFAULT_CATEGORY.name,
    intent,
    headers
  );
  if (existing) {
    console.log(`→ [post-seeder] Reusing existing "${DEFAULT_CATEGORY.name}" category ${existing}`);
    return existing;
  }

  console.log(`→ [post-seeder] Creating default "${DEFAULT_CATEGORY.name}" category...`);
  const data = await fetchJson(intent.erxes_endpoint, headers, {
    query: CATEGORY_MUTATION,
    variables: {
      input: {
        name: DEFAULT_CATEGORY.name,
        slug: DEFAULT_CATEGORY.slug,
        language: intent.language,
      },
    },
  });
  const id =
    (data.data?.cpCmsCategoriesAdd as { _id?: string } | undefined)?._id ?? null;
  if (id) {
    console.log(`  ✓ category "${DEFAULT_CATEGORY.name}" → ${id}`);
  } else if (data.errors?.length) {
    console.warn(`  ✗ default category:`, data.errors[0].message);
  }
  return id;
}

export async function postSeeder(
  posts: SeedPost[],
  intent: ErxesContext
): Promise<{ post_ids: string[]; category_id: string | null }> {
  const post_ids: string[] = [];

  if (posts.length === 0) return { post_ids, category_id: null };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-app-token": intent.erxes_app_token,
  };

  let defaultCategoryId: string | null = null;
  if (posts.some((p) => p.categoryIds === undefined)) {
    defaultCategoryId = await ensureDefaultCategoryId(intent, headers);
  }

  console.log(`→ [post-seeder] Creating ${posts.length} posts...`);
  for (const post of posts) {
    const categoryIds =
      post.categoryIds !== undefined ? post.categoryIds : defaultCategoryId ? [defaultCategoryId] : [];
    const res = await fetch(intent.erxes_endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: POST_MUTATION,
        variables: {
          input: {
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt ?? post.description ?? "",
            language: post.lang || intent.language,
            status: post.status ?? "published",
            publishedDate:
              post.publishedDate ?? new Date().toISOString().split("T")[0],
            categoryIds,
          },
        },
      }),
    });
    const data = (await res.json()) as {
      data?: { cpCmsPostsAdd?: { _id: string } };
      errors?: { message: string }[];
    };
    if (data.data?.cpCmsPostsAdd?._id) {
      const id = data.data.cpCmsPostsAdd._id;
      post_ids.push(id);
      console.log(`  ✓ "${post.title}" (${post.lang || intent.language}) → ${id}`);
    } else if (data.errors?.length) {
      console.warn(
        `  ✗ "${post.title}" (${post.lang || intent.language}):`,
        data.errors[0].message
      );
    }
  }

  return { post_ids, category_id: defaultCategoryId };
}
