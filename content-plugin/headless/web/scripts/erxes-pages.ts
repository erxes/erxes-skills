/**
 * Create CMS pages in erxes from a JSON file.
 * Usage: tsx scripts/erxes-pages.ts <pages.json>
 *
 * Input JSON format:
 * [
 *   {
 *     "section": "hero",
 *     "name": "Hero",
 *     "slug": "hero",
 *     "description": "Welcome section",
 *     "content": "<html content>"
 *   },
 *   ...
 * ]
 *
 * Output: prints { section: _id } map as JSON
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { pageCreator } from "../skills/page-creator.js";
import type { SeedPage, ErxesContext } from "../types.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/erxes-pages.ts <pages.json>");
  process.exit(1);
}

const pages = JSON.parse(readFileSync(file, "utf-8")) as SeedPage[];

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
  const result = await pageCreator(pages, ctx);
  console.log(JSON.stringify(result, null, 2));
}

main();
