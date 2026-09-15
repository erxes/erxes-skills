import type { SeedPost, ContentTranslation, ErxesContext } from "../types.js";

const CATEGORY_MUTATION = `
  mutation CpCmsCategoriesAdd($input: PostCategoryInput!) {
    cpCmsCategoriesAdd(input: $input) {
      _id
      name
      slug
    }
  }
`;

const POST_MUTATION = `
  mutation CpCmsPostsAdd($input: PostInput!) {
    cpCmsPostsAdd(input: $input) {
      _id
      title
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

const POSTS_QUERY = `
  query CpPosts($language: String, $status: PostStatus, $limit: Int) {
    cpPosts(language: $language, status: $status, limit: $limit) {
      _id
      slug
    }
  }
`;

const POST_BY_SLUG_QUERY = `
  query CpPost($slug: String, $language: String) {
    cpPost(slug: $slug, language: $language) {
      _id
      slug
    }
  }
`;

interface PostSeederResult {
  category_id: string | null;
  post_ids: string[];
}

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
  const list =
    (
      data.data as {
        cpCategories?: { list?: { _id: string; name: string; slug: string }[] };
      }
    )?.cpCategories?.list ?? [];
  const match =
    list.find((c) => c.slug === slug) ??
    list.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return match?._id ?? null;
}

/**
 * Returns the _id of an existing post with the given slug, or null.
 * Primary lookup uses the single-post resolver the frontend renders blog
 * detail from; the published-list scan is a fallback for records the single
 * resolver does not surface.
 */
export async function findPostIdBySlug(
  slug: string,
  intent: ErxesContext,
  headers: Record<string, string>
): Promise<string | null> {
  const single = await fetchJson(intent.erxes_endpoint, headers, {
    query: POST_BY_SLUG_QUERY,
    variables: { slug, language: intent.language },
  });
  const resolved = (single.data as { cpPost?: { _id: string } } | undefined)?.cpPost;
  if (resolved?._id) return resolved._id;

  const list = await fetchJson(intent.erxes_endpoint, headers, {
    query: POSTS_QUERY,
    variables: { language: intent.language, limit: 200 },
  });
  const posts =
    (list.data as { cpPosts?: { _id: string; slug?: string }[] } | undefined)?.cpPosts ?? [];
  return posts.find((p) => p.slug === slug)?._id ?? null;
}

export async function postSeeder(
  category: { name: string; slug: string; translations?: ContentTranslation[] } | null,
  posts: SeedPost[],
  intent: ErxesContext
): Promise<PostSeederResult> {
  const result: PostSeederResult = { category_id: null, post_ids: [] };

  if (posts.length === 0) return result;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-app-token": intent.erxes_app_token,
  };

  // Category first — reuse an existing one by slug/name instead of duplicating it.
  if (category) {
    const existingCategoryId = await findCategoryId(
      category.slug,
      category.name,
      intent,
      headers
    );
    if (existingCategoryId) {
      result.category_id = existingCategoryId;
      console.log(
        `→ [post-seeder] Reusing existing category "${category.name}" → ${existingCategoryId}`
      );
    } else {
      console.log(`→ [post-seeder] Creating category "${category.name}"...`);
      const res = await fetch(intent.erxes_endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: CATEGORY_MUTATION,
          variables: {
            input: {
              name: category.name,
              slug: category.slug,
              ...(category.translations?.length
                ? { translations: category.translations }
                : {}),
            },
          },
        }),
      });
      const data = (await res.json()) as {
        data?: { cpCmsCategoriesAdd?: { _id: string } };
        errors?: { message: string }[];
      };
      if (data.data?.cpCmsCategoriesAdd?._id) {
        result.category_id = data.data.cpCmsCategoriesAdd._id;
        console.log(`  ✓ category → ${result.category_id}`);
      } else {
        console.warn(`  ✗ category:`, data.errors?.[0]?.message);
      }
    }
  }

  // Pre-fetch existing posts by slug so duplicates are skipped, not re-created.
  const existingBySlug = new Map<string, string>();
  const listData = await fetchJson(intent.erxes_endpoint, headers, {
    query: POSTS_QUERY,
    variables: { language: intent.language, status: "published", limit: 200 },
  });
  for (const p of
    (listData.data as { cpPosts?: { _id: string; slug?: string }[] } | undefined)
      ?.cpPosts ?? []) {
    if (p.slug) existingBySlug.set(p.slug, p._id);
  }

  // Create posts
  let created = 0;
  let skipped = 0;
  console.log(`→ [post-seeder] Processing ${posts.length} posts...`);
  for (const post of posts) {
    const existingId = existingBySlug.get(post.slug) ?? (await findPostIdBySlug(post.slug, intent, headers));
    if (existingId) {
      existingBySlug.set(post.slug, existingId);
      result.post_ids.push(existingId);
      skipped++;
      console.log(`  ≐ "${post.title}" already exists (${existingId}), skipping`);
      continue;
    }

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
            excerpt: post.excerpt,
            language: intent.language,
            status: "published",
            categoryIds: result.category_id ? [result.category_id] : [],
            ...(post.translations?.length ? { translations: post.translations } : {}),
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
      existingBySlug.set(post.slug, id);
      result.post_ids.push(id);
      created++;
      console.log(`  ✓ "${post.title}" → ${id}`);
    } else {
      console.warn(`  ✗ "${post.title}":`, data.errors?.[0]?.message);
    }
  }

  if (skipped > 0) {
    console.log(
      `→ [post-seeder] Done: ${created} created, ${skipped} already existed (skipped)`
    );
  }
  return result;
}