import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface SiteConfigJson {
  client_portal_id?: string;
  pos_token?: string;
  erxes_cms_id?: string;
  erxes_app_token?: string;
  erxes_endpoint?: string;
}

function readSiteConfigJson(): SiteConfigJson {
  const candidates = [
    join(process.cwd(), "store.config.json"),
    join(process.cwd(), "site.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf-8")) as SiteConfigJson;
    } catch {
      // Ignore corrupt file, fall through to .env / empty values.
    }
  }
  return {};
}

export function nextConfigWriter(outputDir: string): void {
  const erxesEndpoint = process.env.ERXES_ENDPOINT ?? "";
  const erxesAppToken = process.env.ERXES_APP_TOKEN ?? "";
  const erxesCmsId = process.env.ERXES_CMS_ID ?? "";

  if (!erxesEndpoint) throw new Error("ERXES_ENDPOINT is not set in .env");

  const siteConfig = readSiteConfigJson();

  // Ecommerce values: .env wins, then store.config.json / site.config.json.
  const clientPortalId =
    process.env.ERXES_CLIENT_PORTAL_ID?.trim() ||
    siteConfig.client_portal_id ||
    "";
  const posToken =
    process.env.POS_TOKEN?.trim() || siteConfig.pos_token || "";
  const publicCmsId =
    process.env.NEXT_PUBLIC_CMS_ID?.trim() ||
    erxesCmsId ||
    siteConfig.erxes_cms_id ||
    "";

  const content = `import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ERXES_ENDPOINT: "${erxesEndpoint}",
    NEXT_PUBLIC_ERXES_APP_TOKEN: "${erxesAppToken}",
    NEXT_PUBLIC_ERXES_CMS_ID: "${erxesCmsId}",
    ERXES_APP_TOKEN: "${erxesAppToken}",
    NEXT_PUBLIC_ERXES_CP_TOKEN: "${clientPortalId}",
    NEXT_PUBLIC_CP_ID: "${clientPortalId}",
    NEXT_PUBLIC_POS_TOKEN: "${posToken}",
    NEXT_PUBLIC_CMS_ID: "${publicCmsId}",
    NEXT_PUBLIC_GRAPHQL_URL: "${erxesEndpoint}",
  },
};

export default withNextIntl(nextConfig);
`;

  const configPath = join(outputDir, "next.config.mjs");
  writeFileSync(configPath, content, "utf-8");
  console.log(`→ [next-config-writer] Written ${configPath}`);
}