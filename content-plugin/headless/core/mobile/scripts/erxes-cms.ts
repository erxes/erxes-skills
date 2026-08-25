import * as fs from "fs";
import * as path from "path";

const CONFIG_PATH = path.resolve(__dirname, "../store.config.json");
const ENV_PATH = path.resolve(__dirname, "../.env");
const APP_ENV_PATH = path.resolve(__dirname, "../output/testapp/.env.local");

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function writeConfig(data: Record<string, unknown>) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2) + "\n");
}

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

function updateEnvFile(filePath: string, key: string, value: string) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${key}=${value}\n`);
    return;
  }
  let content = fs.readFileSync(filePath, "utf-8");
  const regex = new RegExp(`^${key}=.*`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `${key}=${value}\n`;
  }
  fs.writeFileSync(filePath, content);
}

async function main() {
  const config = readConfig();
  const env = readEnv(ENV_PATH);

  if (config.erxes_cms_id) {
    console.log(`ERXES_CMS_ID already exists: ${config.erxes_cms_id}`);
    return;
  }

  const apiUrl = config.erxes_api_url || env.EXPO_PUBLIC_ERXES_API_URL;
  const appToken =
    env.EXPO_PUBLIC_CLIENT_PORTAL_TOKEN ||
    env.ERXES_APP_TOKEN ||
    config.erxes_app_token;

  if (!apiUrl || !appToken) {
    console.error("Missing erxes_api_url or app token");
    process.exit(1);
  }

  const mutation = `
    mutation CpContentCreateCMS($input: ContentCMSInput) {
      cpContentCreateCMS(input: $input) {
        _id
        clientPortalId
        name
        description
        language
        languages
        postUrlField
      }
    }
  `;

  const variables = {
    input: {
      name: `${config.name} CMS`,
      description: `Headless CMS for ${config.name} Expo mobile app.`,
      content: "Pages, posts, navigation, categories, tags, and custom types.",
      language: config.language || "mn",
      languages: config.languages || ["mn", "en"],
      postUrlField: "slug",
      clientPortalId: config.client_portal_id || "",
    },
  };

  console.log("Creating CMS...");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-token": appToken,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error("GraphQL errors:", JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }

  const cmsId = result.data?.cpContentCreateCMS?._id;
  if (!cmsId) {
    console.error("No _id returned:", JSON.stringify(result.data, null, 2));
    process.exit(1);
  }

  console.log(`CMS created with _id: ${cmsId}`);

  // Update store.config.json
  config.erxes_cms_id = cmsId;
  writeConfig(config);
  console.log("Updated store.config.json");

  // Update root .env
  updateEnvFile(ENV_PATH, "ERXES_CMS_ID", cmsId);
  updateEnvFile(ENV_PATH, "EXPO_PUBLIC_CMS_ID", cmsId);
  console.log("Updated .env");

  // Update app .env.local
  updateEnvFile(APP_ENV_PATH, "ERXES_CMS_ID", cmsId);
  updateEnvFile(APP_ENV_PATH, "EXPO_PUBLIC_CMS_ID", cmsId);
  console.log("Updated output/testapp/.env.local");

  console.log("Done! CMS setup complete.");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
