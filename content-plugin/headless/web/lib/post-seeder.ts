import type { SeedPost, ErxesContext } from "../types.js";

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

interface PostSeederResult {
  category_id: string | null;
  post_ids: string[];
}

export async function postSeeder(
  category: { name: string; slug: string } | null,
  posts: SeedPost[],
  intent: ErxesContext
): Promise<PostSeederResult> {
  const result: PostSeederResult = { category_id: null, post_ids: [] };

  if (posts.length === 0) return result;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-app-token": intent.erxes_app_token,
  };

  // Create category first
  if (category) {
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
            language: intent.language,
            status: "published",
          },
        },
      }),
    });
    const data = await res.json() as {
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

  // Create posts
  console.log(`→ [post-seeder] Creating ${posts.length} posts...`);
  for (const post of posts) {
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
          },
        },
      }),
    });
    const data = await res.json() as {
      data?: { cpCmsPostsAdd?: { _id: string } };
      errors?: { message: string }[];
    };
    if (data.data?.cpCmsPostsAdd?._id) {
      const id = data.data.cpCmsPostsAdd._id;
      result.post_ids.push(id);
      console.log(`  ✓ "${post.title}" → ${id}`);
    } else {
      console.warn(`  ✗ "${post.title}":`, data.errors?.[0]?.message);
    }
  }

  return result;
}
