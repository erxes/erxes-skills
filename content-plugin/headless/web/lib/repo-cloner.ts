import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export function repoCloner(repoUrl: string, siteName: string): string {
  const slug = siteName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const outputDir = join(process.cwd(), "output", slug);

  if (existsSync(outputDir)) {
    console.log(`→ [repo-cloner] output/${slug}/ already exists, skipping clone`);
    return outputDir;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set in .env");

  const authenticatedUrl = repoUrl.replace("https://", `https://${token}@`);

  console.log(`→ [repo-cloner] Cloning into output/${slug}/...`);
  execSync(`git clone ${authenticatedUrl} "${outputDir}"`, { stdio: "pipe" });

  // Remove .git so it becomes a fresh project
  execSync(`rm -rf "${outputDir}/.git"`);

  console.log(`→ [repo-cloner] Done`);
  return outputDir;
}
