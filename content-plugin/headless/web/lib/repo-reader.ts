import { readdir, readFile } from "fs/promises";
import { join, relative, extname } from "path";
import type { Dirent } from "fs";
import type { GeneratedFile } from "../types.js";

const READABLE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".md"];
const SKIP_FOLDERS = ["node_modules", ".git", ".next", "out", "dist", ".turbo"];

async function collectFiles(
  dir: string,
  rootDir: string,
  files: GeneratedFile[] = []
): Promise<GeneratedFile[]> {
  const entries: Dirent[] = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_FOLDERS.includes(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectFiles(fullPath, rootDir, files);
    } else if (READABLE_EXTENSIONS.includes(extname(entry.name))) {
      const relativePath = relative(rootDir, fullPath);
      const content = await readFile(fullPath, "utf-8");
      files.push({ path: relativePath, content });
    }
  }

  return files;
}

export async function repoReader(projectDir: string): Promise<GeneratedFile[]> {
  console.log(`→ [repo-reader] Reading starter structure...`);

  const files = await collectFiles(projectDir, projectDir);

  console.log(`→ [repo-reader] Read ${files.length} files`);

  // Truncate large files so Kimi context stays manageable
  return files.map((f) => ({
    path: f.path,
    content: f.content.length > 5000
      ? f.content.slice(0, 500) + "\n... (truncated)"
      : f.content,
  }));
}
