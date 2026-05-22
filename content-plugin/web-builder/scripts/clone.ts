/**
 * Clone template-boilerplate into the matching output directory.
 * Usage: tsx scripts/clone.ts <template_type>
 * template_type: ecommerce | tour | hotel | business
 */
import { execSync } from "child_process";
import { existsSync, cpSync } from "fs";
import { join, resolve } from "path";

const templateType = process.argv[2];
const validTypes = ["ecommerce", "tour", "hotel", "business"];

if (!templateType || !validTypes.includes(templateType)) {
  console.error(`Usage: tsx scripts/clone.ts <template_type>`);
  console.error(`template_type must be one of: ${validTypes.join(", ")}`);
  process.exit(1);
}

const outputDirName = `${templateType}-template`;
const outputDir = join(process.cwd(), outputDirName);
const boilerplatePath = resolve(process.cwd(), "../../apps/templates/template-boilerplate");

if (!existsSync(boilerplatePath)) {
  console.error(`template-boilerplate not found at: ${boilerplatePath}`);
  console.error("Make sure you are running this from content-plugin/web-builder/");
  process.exit(1);
}

if (existsSync(join(outputDir, "package.json"))) {
  console.log(`→ ${outputDirName}/ already has content, skipping clone`);
  console.log(outputDir);
  process.exit(0);
}

console.log(`→ Cloning template-boilerplate into ${outputDirName}/...`);
cpSync(boilerplatePath, outputDir, {
  recursive: true,
  filter: (src) => !src.includes("node_modules") && !src.includes(".next"),
});

// Remove git history so it becomes a fresh project
try {
  execSync(`rm -rf "${join(outputDir, ".git")}"`);
} catch {
  // ignore if no .git
}

console.log(`→ Done`);
console.log(outputDir);
