import { writeFileSync } from "fs";
import { join } from "path";

export function nextConfigWriter(outputDir: string): void {
  const erxesEndpoint = process.env.ERXES_ENDPOINT ?? "";
  const erxesAppToken = process.env.ERXES_APP_TOKEN ?? "";
  const erxesCmsId = process.env.ERXES_CMS_ID ?? "";

  if (!erxesEndpoint) throw new Error("ERXES_ENDPOINT is not set in .env");

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
  },
};

export default withNextIntl(nextConfig);
`;

  const configPath = join(outputDir, "next.config.mjs");
  writeFileSync(configPath, content, "utf-8");
  console.log(`→ [next-config-writer] Written ${configPath}`);
}
