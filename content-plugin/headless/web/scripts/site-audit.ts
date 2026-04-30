/**
 * Crawl a public website and write a structured source-content inventory.
 * Usage: tsx scripts/site-audit.ts <url> [output.json]
 */
import "dotenv/config";
import { siteAudit } from "../lib/site-audit.js";

const startUrl = process.argv[2];
const outputPath = process.argv[3];

if (!startUrl) {
  console.error("Usage: tsx scripts/site-audit.ts <url> [output.json]");
  process.exit(1);
}

async function main(): Promise<void> {
  const result = await siteAudit({ startUrl, outputPath });

  console.log(`→ [site-audit] Audited ${result.audited_pages.length} page(s) for ${result.site}`);
  if (outputPath) console.log(`→ [site-audit] Wrote ${outputPath}`);
  for (const page of result.audited_pages) {
    console.log(`  ✓ ${page.pathname} (${page.headings.length} headings, ${page.text_blocks.length} text blocks)`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`site-audit failed: ${message}`);
  process.exit(1);
});
