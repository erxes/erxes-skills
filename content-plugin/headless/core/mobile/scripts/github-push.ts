/**
 * Push output/<slug>/ to a private GitHub repo under the user's personal account.
 * Usage: tsx scripts/github-push.ts "<store-name>"
 * Output: prints the GitHub repo URL
 */
import * as path from "path";
import { readEnv } from "../lib/seed-context.js";
import { githubPusher } from "../lib/github-pusher.js";

const storeName = process.argv[2];
if (!storeName) {
  console.error('Usage: tsx scripts/github-push.ts "<store-name>"');
  process.exit(1);
}

const env = readEnv(path.resolve(__dirname, "../.env"));
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || env.GITHUB_TOKEN || "";
process.env.GITHUB_USERNAME =
  process.env.GITHUB_USERNAME || env.GITHUB_USERNAME || "";

const slug = storeName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9-]/g, "");
const outputDir = path.resolve(__dirname, "../output", slug);

async function main() {
  const { repoUrl } = await githubPusher(outputDir, storeName);
  console.log(`→ GitHub: ${repoUrl}`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
