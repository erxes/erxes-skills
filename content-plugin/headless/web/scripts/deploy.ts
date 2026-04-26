/**
 * Deploy output/<slug>/ to Vercel.
 * Usage: tsx scripts/deploy.ts "<site-name>"
 * Output: prints the live Vercel URL
 */
import "dotenv/config";
import { vercelDeploy } from "../skills/vercel-deploy.js";

const siteName = process.argv[2];
if (!siteName) {
  console.error("Usage: tsx scripts/deploy.ts \"<site-name>\"");
  process.exit(1);
}

const slug = siteName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const outputDir = `${process.cwd()}/output/${slug}`;

const result = vercelDeploy(outputDir, siteName);
console.log(result.url);
