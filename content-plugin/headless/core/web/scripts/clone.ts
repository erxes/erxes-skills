/**
 * Clone erxes-web-starter into output/<slug>/
 * Usage: tsx scripts/clone.ts "<site-name>"
 * Output: prints the output directory path
 */
import "dotenv/config";
import { repoCloner } from "../lib/repo-cloner.js";

const siteName = process.argv[2];
if (!siteName) {
  console.error("Usage: tsx scripts/clone.ts \"<site-name>\"");
  process.exit(1);
}

const starterRepoUrl = process.env.STARTER_REPO_URL ?? "";
if (!starterRepoUrl) throw new Error("STARTER_REPO_URL is not set in .env");

const outputDir = repoCloner(starterRepoUrl, siteName);
console.log(outputDir);
