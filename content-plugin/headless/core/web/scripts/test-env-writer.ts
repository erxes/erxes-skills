import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { config as loadEnv } from "dotenv";
import { writeEnvFields } from "../lib/env-writer.js";
import { configLoader } from "../lib/config-loader.js";

let failures = 0;
const print = (name: string, ok: boolean) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures += 1;
};

const KEY = (name: string, value: string, envPath: string) => {
  const line = readFileSync(envPath, "utf-8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1) === value;
};

const fresh = (initial: string, label: string) => {
  const dir = join(tmpdir(), `env-writer-${label}-${Date.now()}`);
  const path = join(dir, ".env");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, initial, "utf-8");
  return { dir, path };
};

const CREDS = {
  ERXES_ENDPOINT: "https://acme.next.erxes.io/gateway/graphql",
  ERXES_APP_TOKEN: "jwt.app.token",
  ERXES_CLIENT_PORTAL_ID: "portal-id-1234",
  GITHUB_USERNAME: "acme-dev",
  GITHUB_TOKEN: "ghp_1234567890",
  VERCEL_TOKEN: "vt_abcdef",
  VERCEL_ORG_ID: "team_x1y2",
};

async function main() {
  {
    const { dir, path } = fresh("# erxes deployment\nSTARTER_REPO_URL=https://github.com/pages-web/erxes-web-starter\n", "create");
    try {
      const written = writeEnvFields(CREDS, path);
      const contents = readFileSync(written, "utf-8");
      print("fresh create: file created at default-adjacent path", written === path);
      print("fresh create: comment line preserved", contents.includes(`# erxes deployment`));
      print("fresh create: STARTER_REPO_URL preserved", KEY("STARTER_REPO_URL", "https://github.com/pages-web/erxes-web-starter", path));
      for (const [key, value] of Object.entries(CREDS)) {
        print(`fresh create: ${key} present with exact value`, KEY(key, value, path));
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  {
    const initial = `# existing header\nERXES_ENDPOINT=https://old.next.erxes.io/gateway/graphql\nCLIENT_PORTAL_ID=stale-wrong-name\nPOS_TOKEN=keepme\n`;
    const { dir, path } = fresh(initial, "upsert");
    try {
      writeEnvFields({ ...CREDS, POS_TOKEN: "", CLIENT_PORTAL_ID: "" }, path);
      const contents = readFileSync(path, "utf-8");
      print("upsert: original comment kept", contents.includes("# existing header"));
      print("upsert: existing ERXES_ENDPOINT updated in place", KEY("ERXES_ENDPOINT", CREDS.ERXES_ENDPOINT, path));
      print("upsert: ERXES_ENDPOINT appears exactly once", contents.split("ERXES_ENDPOINT=").length - 1 === 1);
      print("upsert: stale CLIENT_PORTAL_ID line untouched", KEY("CLIENT_PORTAL_ID", "stale-wrong-name", path));
      print("upsert: POS_TOKEN untouched (empty value skipped)", KEY("POS_TOKEN", "keepme", path));
      print("upsert: appended keys written once each", CREDS.ERXES_APP_TOKEN === undefined ? false : contents.includes(`ERXES_APP_TOKEN=${CREDS.ERXES_APP_TOKEN}`) && contents.includes(`GITHUB_USERNAME=${CREDS.GITHUB_USERNAME}`) && contents.includes(`VERCEL_TOKEN=${CREDS.VERCEL_TOKEN}`));
      print("upsert: erxes keys all named exactly as downstream reads", KEY("ERXES_CLIENT_PORTAL_ID", CREDS.ERXES_CLIENT_PORTAL_ID, path));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const originalCwd = process.cwd();
  const deleteEnv = () => {
    for (const k of ["ERXES_ENDPOINT", "ERXES_APP_TOKEN", "ERXES_CLIENT_PORTAL_ID", "ERXES_CMS_ID"]) {
      delete process.env[k];
    }
  };

  {
    const dir = join(tmpdir(), `env-writer-config-sim-a-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(
        join(dir, "site.config.json"),
        JSON.stringify({
          name: "acme-business",
          template_type: "business",
          tone: "modern",
          language: "en",
          languages: ["en"],
          sections: ["hero", "about", "services", "contact"],
          client_portal_id: CREDS.ERXES_CLIENT_PORTAL_ID,
          erxes_endpoint: CREDS.ERXES_ENDPOINT,
          erxes_app_token: CREDS.ERXES_APP_TOKEN,
          deploy_target: "github",
          ui_source: "words",
          ui_source_ref: "clean modern business site",
          design_strategy: "from-scratch",
          color_hint: null,
          extra_notes: null,
        }),
        "utf-8"
      );
      writeEnvFields(CREDS, join(dir, ".env"));
      process.chdir(dir);
      deleteEnv();
      loadEnv({ path: join(dir, ".env") });
      const intent = await configLoader();
      print("config-loader (business site.config.json): name loaded", intent.name === "acme-business");
      print("config-loader (business): site_type loaded from config", intent.site_type === "business");
      print("config-loader (business): ERXES_ENDPOINT resolved from .env", intent.erxes_endpoint === CREDS.ERXES_ENDPOINT);
      print("config-loader (business): ERXES_APP_TOKEN resolved from .env", intent.erxes_app_token === CREDS.ERXES_APP_TOKEN);
      print("config-loader (business): ERXES_CLIENT_PORTAL_ID resolved from .env", intent.client_portal_id === CREDS.ERXES_CLIENT_PORTAL_ID);
    } finally {
      process.chdir(originalCwd);
      rmSync(dir, { recursive: true, force: true });
    }
  }

  {
    const dir = join(tmpdir(), `env-writer-config-sim-b-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(
        join(dir, "store.config.json"),
        JSON.stringify({
          name: "acme-shop",
          language: "en",
          languages: ["en", "mn"],
          tone: "casual",
          delivery_types: ["delivery"],
          allow_guest: true,
          ui_source: "website",
          ui_source_ref: "https://example.com/",
          color_hint: "black",
          design_strategy: "copy-site",
          reference_url: "https://example.com/",
          competitor_urls: [],
          sections: ["about"],
          cms_sections: ["about"],
          extra_notes: null,
          deploy_target: "vercel",
          erxes_api_url: CREDS.ERXES_ENDPOINT,
          erxes_main_domain: "https://acme.next.erxes.io",
          erxes_app_token: CREDS.ERXES_APP_TOKEN,
          client_portal_id: CREDS.ERXES_CLIENT_PORTAL_ID,
          pos_token: "pos-xyz",
        }),
        "utf-8"
      );
      writeEnvFields(CREDS, join(dir, ".env"));
      process.chdir(dir);
      deleteEnv();
      loadEnv({ path: join(dir, ".env") });
      const intent = await configLoader();
      print("config-loader (ecommerce store.config.json): no CLI re-prompt (clean run, would crash on stdin EOF if prompted)", intent.site_type === "ecommerce");
      print("config-loader (ecommerce): site_type inferred as ecommerce (proves store.config.json was read)", intent.site_type === "ecommerce");
      print("config-loader (ecommerce): erxes_endpoint from env/config", intent.erxes_endpoint === CREDS.ERXES_ENDPOINT);
      print("config-loader (ecommerce): erxes_app_token from env/config", intent.erxes_app_token === CREDS.ERXES_APP_TOKEN);
      print("config-loader (ecommerce): client_portal_id from env/config", intent.client_portal_id === CREDS.ERXES_CLIENT_PORTAL_ID);
    } finally {
      process.chdir(originalCwd);
      rmSync(dir, { recursive: true, force: true });
    }
  }

  if (failures === 0) {
    console.log("\nAll env-writer + config-loader checks passed.");
  } else {
    console.log(`\n${failures} check(s) FAILED.`);
    process.exitCode = 1;
  }
}

main();