import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const KEY_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*=/;

export function writeEnvFields(
  fields: Record<string, string>,
  envPath?: string
): string {
  const target = envPath ?? join(process.cwd(), ".env");
  const existing = existsSync(target) ? readFileSync(target, "utf-8") : "";
  const lines = existing.split("\n");

  const keys = Object.keys(fields).filter((key) => (fields[key] ?? "").length > 0);
  const replaced = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const match = KEY_RE.exec(line);
    if (match && keys.includes(match[1])) {
      if (!replaced.has(match[1])) {
        result.push(`${match[1]}=${fields[match[1]]}`);
        replaced.add(match[1]);
      }
      continue;
    }
    result.push(line);
  }

  for (const key of keys) {
    if (!replaced.has(key)) {
      result.push(`${key}=${fields[key]}`);
      replaced.add(key);
    }
  }

  writeFileSync(target, `${result.join("\n").replace(/\n+$/, "")}\n`, "utf-8");
  return target;
}