/**
 * Create CMS pages in erxes from a JSON file.
 * Usage: tsx scripts/erxes-pages.ts <pages.json>
 *
 * Input JSON format — one object per language (agents/ecommerce/AGENTS.md Step 5a):
 * [
 *   {
 *     "slug": "about",
 *     "lang": "mn",
 *     "title": "Бидний тухай",
 *     "description": "...",
 *     "content": "<html content>",
 *     "status": "published",
 *     "meta": { "title": "...", "description": "...", "keywords": "..." }
 *   },
 *   ...
 * ]
 *
 * Output: prints { "<slug>:<lang>": _id } map as JSON
 */
import { loadSeedContext, readJsonArg } from "../lib/seed-context.js";
import { pageCreator } from "../lib/page-creator.js";
import type { SeedPage } from "../lib/seed-types.js";

const pages = readJsonArg<SeedPage[]>("Usage: tsx scripts/erxes-pages.ts <pages.json>");
const ctx = loadSeedContext();

async function main() {
  const result = await pageCreator(pages, ctx);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
