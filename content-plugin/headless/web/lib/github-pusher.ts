import { execSync } from "child_process";

interface GithubPushResult {
  repoUrl: string;
  repoName: string;
}

export async function githubPusher(
  outputDir: string,
  siteName: string,
  org?: string
): Promise<GithubPushResult> {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  if (!token) throw new Error("GITHUB_TOKEN is not set in .env");
  if (!username) throw new Error("GITHUB_USERNAME is not set in .env");

  const repoName = siteName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const owner = org ?? username;
  const repoUrl = `https://github.com/${owner}/${repoName}`;

  // 1. Create private repo via GitHub API (ignore 422 if it already exists)
  console.log(`→ [github-pusher] Creating private repo "${owner}/${repoName}"...`);
  const apiUrl = org
    ? `https://api.github.com/orgs/${org}/repos`
    : "https://api.github.com/user/repos";

  const createRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      private: true,
      auto_init: false,
    }),
  });

  if (createRes.status === 422) {
    console.log(`  ↩ repo already exists — pushing to existing repo`);
  } else if (!createRes.ok) {
    const err = await createRes.json() as { message?: string };
    throw new Error(`GitHub API error ${createRes.status}: ${err.message}`);
  } else {
    console.log(`  ✓ repo created: ${repoUrl}`);
  }

  // 2. Init git and push (token embedded in remote URL, stripped after push)
  const remoteWithToken = `https://${username}:${token}@github.com/${owner}/${repoName}.git`;

  const run = (cmd: string) =>
    execSync(cmd, { cwd: outputDir, stdio: "pipe", encoding: "utf-8" });

  try {
    run("git init");
    run("git checkout -b main");
  } catch {
    // Already initialised — switch to main branch
    try { run("git checkout -b main"); } catch { /* already on main */ }
  }

  // Always update remote first so the push target is correct
  try {
    run(`git remote add origin ${remoteWithToken}`);
  } catch {
    run(`git remote set-url origin ${remoteWithToken}`);
  }

  run("git add .");
  try {
    run(`git commit -m "chore: initial site build"`);
  } catch {
    // Nothing new to commit — still push in case remote changed (e.g. org migration)
    console.log("  ↩ nothing new to commit — pushing existing commits");
  }

  console.log(`→ [github-pusher] Pushing to ${repoUrl}...`);
  run("git push -u origin main --force");

  // Strip token from remote URL
  run(`git remote set-url origin ${repoUrl}.git`);

  console.log(`  ✓ pushed to ${repoUrl}`);
  return { repoUrl, repoName };
}
