/**
 * Create navigation menu items in erxes from a JSON file.
 * Usage: tsx scripts/erxes-menu.ts <menu.json>
 *
 * Input JSON format:
 * [
 *   { "label": "Home",    "url": "/",       "order": 1 },
 *   { "label": "Menu",    "url": "/menu",   "order": 2 },
 *   { "label": "Blog",    "url": "/blog",   "order": 3 },
 *   { "label": "Contact", "url": "/contact","order": 4 }
 * ]
 *
 * Output: prints array of created menu item _ids as JSON
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { menuBuilder } from "../lib/menu-builder.js";
import type { SeedMenuItem, ErxesContext } from "../types.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/erxes-menu.ts <menu.json>");
  process.exit(1);
}

const items = JSON.parse(readFileSync(file, "utf-8")) as SeedMenuItem[];

const ctx: ErxesContext = {
  erxes_endpoint: process.env.ERXES_ENDPOINT ?? "",
  erxes_app_token: process.env.ERXES_APP_TOKEN ?? "",
  language: process.env.ERXES_LANGUAGE ?? "en",
};

if (!ctx.erxes_endpoint) throw new Error("ERXES_ENDPOINT is not set in .env");
if (!ctx.erxes_app_token) throw new Error("ERXES_APP_TOKEN is not set in .env");

async function main() {
  const ids = await menuBuilder(items, ctx);
  console.log(JSON.stringify(ids, null, 2));
}

main();
