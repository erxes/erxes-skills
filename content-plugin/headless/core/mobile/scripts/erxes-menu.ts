/**
 * Create navigation menu items in erxes from a JSON file.
 * Usage: tsx scripts/erxes-menu.ts <menu.json>
 *
 * Input JSON format — nested groups, flattened internally
 * (agents/ecommerce/AGENTS.md Step 5c):
 * [
 *   {
 *     "name": "Main Navigation",
 *     "items": [
 *       { "name": "Нүүр", "link": "/", "order": 1 },
 *       { "name": "Бараа", "link": "/products", "order": 2 }
 *     ]
 *   },
 *   {
 *     "name": "Footer",
 *     "items": [
 *       { "name": "Бидний тухай", "link": "/about", "order": 1 }
 *     ]
 *   }
 * ]
 *
 * Group names containing "footer" (case-insensitive) map to kind "footer",
 * all others to "header"; per-item `kind` overrides both.
 *
 * Output: prints array of created menu item _ids as JSON
 */
import { loadSeedContext, readJsonArg } from "../lib/seed-context.js";
import { menuBuilder } from "../lib/menu-builder.js";
import type { SeedMenuGroup } from "../lib/seed-types.js";

const groups = readJsonArg<SeedMenuGroup[]>(
  "Usage: tsx scripts/erxes-menu.ts <menu.json>"
);
const ctx = loadSeedContext();

async function main() {
  const ids = await menuBuilder(groups, ctx);
  console.log(JSON.stringify(ids, null, 2));
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
