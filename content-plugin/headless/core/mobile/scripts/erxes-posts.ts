/**
 * Create blog posts in erxes from a JSON file.
 * Usage: tsx scripts/erxes-posts.ts <posts.json>
 *
 * Input JSON format — flat array, one object per language
 * (agents/ecommerce/AGENTS.md Step 5b, no category object):
 * [
 *   {
 *     "lang": "mn",
 *     "title": "Post title",
 *     "slug": "post-slug",
 *     "description": "Short summary",
 *     "content": "<html content>",
 *     "status": "published",
 *     "publishedDate": "<today's ISO date>",
 *     "categoryIds": ["<optional existing category _id>"]
 *   },
 *   ...
 * ]
 *
 * Default category: entries WITHOUT `categoryIds` are attached to a shared
 * "Blog" category (created on first run, reused afterwards). Explicit
 * `categoryIds` pass through verbatim; `"categoryIds": []` forces
 * uncategorized.
 *
 * Output: prints { post_ids, category_id } as JSON
 */
import { loadSeedContext, readJsonArg } from "../lib/seed-context.js";
import { postSeeder } from "../lib/post-seeder.js";
import type { SeedPost } from "../lib/seed-types.js";

const posts = readJsonArg<SeedPost[]>("Usage: tsx scripts/erxes-posts.ts <posts.json>");
const ctx = loadSeedContext();

async function main() {
  const result = await postSeeder(posts, ctx);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
