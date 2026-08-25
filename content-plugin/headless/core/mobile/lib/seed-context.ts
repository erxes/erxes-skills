/**
 * Shared loader for erxes seeding scripts.
 * Follows mobile's existing conventions (scripts/clone.ts, scripts/erxes-cms.ts):
 * hand-rolled .env parsing, __dirname-relative paths, no dotenv dependency.
 *
 * Token resolution deliberately avoids the obsolete EXPO_PUBLIC_ERXES_CP_TOKEN
 * key — see agents/ecommerce/conventions.md §3 and reference.md env table.
 */
import * as fs from "fs";
import * as path from "path";
import type { ErxesContext } from "./seed-types.js";

const CONFIG_PATH = path.resolve(__dirname, "../store.config.json");
const ENV_PATH = path.resolve(__dirname, "../.env");

export function readConfig(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

export function readEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([^#=]\w+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

export function loadSeedContext(): ErxesContext {
  const config = readConfig();
  const env = readEnv(ENV_PATH);

  const erxes_endpoint =
    (config.erxes_api_url as string) ||
    env.EXPO_PUBLIC_ERXES_API_URL ||
    "";
  const erxes_app_token =
    env.EXPO_PUBLIC_CLIENT_PORTAL_TOKEN ||
    env.ERXES_APP_TOKEN ||
    (config.erxes_app_token as string) ||
    "";
  const language =
    (config.defaultLanguage as string) ||
    (config.language as string) ||
    "mn";

  if (!erxes_endpoint) {
    throw new Error(
      "Missing erxes API URL — set config.erxes_api_url in store.config.json or EXPO_PUBLIC_ERXES_API_URL in .env"
    );
  }
  if (!erxes_app_token) {
    throw new Error(
      "Missing app token — set EXPO_PUBLIC_CLIENT_PORTAL_TOKEN or ERXES_APP_TOKEN in .env, or erxes_app_token in store.config.json"
    );
  }

  return { erxes_endpoint, erxes_app_token, language };
}

/** Reads the JSON file path from argv[2] (usage: tsx scripts/<script>.ts <file.json>) */
export function readJsonArg<T>(usage: string): T {
  const file = process.argv[2];
  if (!file) {
    console.error(usage);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}
