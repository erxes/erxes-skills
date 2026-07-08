/**
 * Push output/<slug>/ to a private GitHub repo, then deploy to Vercel.
 * Usage: tsx scripts/deploy.ts "<site-name>"
 * Output: prints the live Vercel URL
 */
import "dotenv/config";
import { githubPusher } from "../lib/github-pusher.js";
import { vercelDeploy } from "../lib/vercel-deploy.js";

const siteName = process.argv[2];
if (!siteName) {
  console.error('Usage: tsx scripts/deploy.ts "<site-name>"');
  process.exit(1);
}

const slug = siteName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const outputDir = `${process.cwd()}/output/${slug}`;

async function main() {
  // Step 1 — push to pages-web org (required for Vercel deploy)
  const { repoUrl } = await githubPusher(outputDir, siteName, "pages-web");
  console.log(`→ GitHub: ${repoUrl}`);

  // Step 2 — deploy to Vercel
  const { url } = vercelDeploy(outputDir, siteName);
  console.log(`→ Vercel: ${url}`);
}

main();
