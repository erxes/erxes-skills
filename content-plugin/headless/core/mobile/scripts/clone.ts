import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ENV_PATH = path.resolve(__dirname, "../.env");
const CONFIG_PATH = path.resolve(__dirname, "../store.config.json");

function readEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([^#=]\w+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function main() {
  const env = readEnv(ENV_PATH);
  const config = readConfig();

  const siteName = process.argv[2] || config.name;
  if (!siteName) {
    console.error('Usage: tsx scripts/clone.ts "<store-name>"');
    process.exit(1);
  }

  const starterRepoUrl = env.STARTER_REPO_URL ?? "";
  if (!starterRepoUrl) throw new Error("STARTER_REPO_URL is not set in .env");

  const slug = siteName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const outputDir = path.resolve(__dirname, `../output/${slug}`);

  if (fs.existsSync(outputDir)) {
    console.log(`→ output/${slug}/ already exists, skipping clone`);
    console.log(outputDir);
    return;
  }

  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set in .env");

  const authenticatedUrl = starterRepoUrl.replace("https://", `https://${token}@`);

  console.log(`→ Cloning into output/${slug}/...`);
  execSync(`git clone ${authenticatedUrl} "${outputDir}"`, { stdio: "pipe" });
  execSync(`rm -rf "${outputDir}/.git"`);

  console.log("→ Done");
  console.log(outputDir);
}

main();
