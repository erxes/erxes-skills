/**
 * Push output/<slug>/ to a private GitHub repo under the user's personal account.
 * Usage: tsx scripts/github-push.ts "<site-name>"
 * Output: prints the GitHub repo URL
 */
import "dotenv/config";
import { githubPusher } from "../lib/github-pusher.js";

const siteName = process.argv[2];
if (!siteName) {
  console.error('Usage: tsx scripts/github-push.ts "<site-name>"');
  process.exit(1);
}

const slug = siteName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const outputDir = `${process.cwd()}/output/${slug}`;

async function main() {
  const { repoUrl } = await githubPusher(outputDir, siteName);
  console.log(`→ GitHub: ${repoUrl}`);
}

main();
