/**
 * Create blog category + posts in erxes from a JSON file.
 * Usage: tsx scripts/erxes-posts.ts <posts.json>
 *
 * Input JSON format:
 * {
 *   "category": { "name": "Blog", "slug": "blog" },
 *   "posts": [
 *     {
 *       "title": "Post title",
 *       "slug": "post-slug",
 *       "excerpt": "Short summary",
 *       "content": "<html content>"
 *     },
 *     ...
 *   ]
 * }
 *
 * Output: prints { category_id, post_ids } as JSON
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { postSeeder } from "../lib/post-seeder.js";
import type { SeedPost, ErxesContext } from "../types.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/erxes-posts.ts <posts.json>");
  process.exit(1);
}

const input = JSON.parse(readFileSync(file, "utf-8")) as {
  category: { name: string; slug: string } | null;
  posts: SeedPost[];
};

const ctx: ErxesContext = {
  erxes_endpoint: process.env.ERXES_ENDPOINT ?? "",
  erxes_app_token: process.env.ERXES_APP_TOKEN ?? "",
  erxes_cp_id: process.env.ERXES_CP_ID ?? "",
  language: process.env.ERXES_LANGUAGE ?? "en",
};

if (!ctx.erxes_endpoint) throw new Error("ERXES_ENDPOINT is not set in .env");
if (!ctx.erxes_app_token) throw new Error("ERXES_APP_TOKEN is not set in .env");
if (!ctx.erxes_cp_id) throw new Error("ERXES_CP_ID is not set in .env");

async function main() {
  const result = await postSeeder(input.category, input.posts, ctx);
  console.log(JSON.stringify(result, null, 2));
}

main();
