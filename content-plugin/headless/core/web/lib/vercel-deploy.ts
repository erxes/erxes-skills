import { execSync } from "child_process";
import { nextConfigWriter } from "./next-config-writer.js";

interface DeployResult {
  url: string;
  projectName: string;
}

export function vercelDeploy(outputDir: string, siteName: string): DeployResult {
  const projectName = siteName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN is not set in .env");

  const scope = "erxes";
  const flags = `--scope ${scope}`;

  // Write env vars into next.config.mjs before deploying
  nextConfigWriter(outputDir);

  console.log(`→ [vercel-deploy] Deploying "${projectName}" to Vercel...`);

  const env = { ...process.env };
  delete env.VERCEL_ORG_ID;

  // Link and deploy in one command
  const output = execSync(
    `cd "${outputDir}" && vercel deploy --prod --yes --token ${token} ${flags}`,
    { encoding: "utf-8", stdio: "pipe", env }
  );

  // Parse URL from Vercel output
  const lines = output.trim().split("\n");
  let deployedUrl = "";
  
  // Look for "Production: https://..." line
  for (const line of lines) {
    const match = line.match(/Production:\s+(https:\/\/[^\s]+)/);
    if (match) {
      deployedUrl = match[1];
      break;
    }
  }
  
  if (!deployedUrl) {
    // Fallback: try JSON "url" field
    const jsonMatch = output.match(/"url":\s*"(https:\/\/[^"]+)"/);
    if (jsonMatch) deployedUrl = jsonMatch[1];
  }

  console.log(`→ [vercel-deploy] Deployed to: ${deployedUrl}`);

  return { url: deployedUrl, projectName };
}
