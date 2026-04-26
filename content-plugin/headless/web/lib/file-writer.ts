import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import type { GeneratedFile } from "../types.js";

export async function fileWriter(files: GeneratedFile[], siteName: string): Promise<string> {
  const slug = siteName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const outputDir = join(process.cwd(), "output", slug);

  console.log(`→ [file-writer] Writing ${files.length} files to output/${slug}/`);

  for (const file of files) {
    const fullPath = join(outputDir, file.path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, "utf-8");
    console.log(`  ✓ ${file.path}`);
  }

  console.log(`→ [file-writer] Done`);
  return outputDir;
}
