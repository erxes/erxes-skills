import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

interface SiteConfigJson {
  client_portal_id?: string;
  pos_token?: string;
  erxes_cms_id?: string;
  erxes_app_token?: string;
  erxes_endpoint?: string;
  pms_token?: string;
  branch_id?: string;
  tms_branch_id?: string;
  pipeline_id?: string;
  booking_stage_id?: string;
  request_stage_id?: string;
  pending_stage_id?: string;
  paid_stage_id?: string;
  pay_at_property_stage_id?: string;
  approved_stage_id?: string;
  payment_ids?: string[];
  google_maps_api_key?: string;
  google_place_id?: string;
}

interface DynamicSegmentCheck {
  dir: string;
  hasGenerateStaticParams: boolean;
}

export interface ExportCompatibilityResult {
  compatible: boolean;
  middlewareFiles: string[];
  missingParamsRoutes: string[];
}

const MIDDLEWARE_FILE_NAMES = [
  "middleware.ts",
  "middleware.js",
  "middleware.tsx",
  "middleware.jsx",
  "proxy.ts",
  "proxy.js",
  "proxy.tsx",
  "proxy.jsx",
];

const APP_DIRS = ["app", "src/app"];

function readSiteConfigJson(): SiteConfigJson {
  const candidates = [
    join(process.cwd(), "hotel.config.json"),
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

/**
 * Detect middleware / proxy files at the project root or under src/.
 * Next.js middleware (and its Next 15.5+/16 `proxy` successor) are not
 * supported under `output: "export"` — their presence blocks static export.
 */
function findMiddlewareFiles(outputDir: string): string[] {
  const found: string[] = [];
  for (const dir of ["", "src"]) {
    for (const name of MIDDLEWARE_FILE_NAMES) {
      const p = join(outputDir, dir, name);
      if (existsSync(p) && statSync(p).isFile()) found.push(p);
    }
  }
  return found;
}

function hasGenerateStaticParamsExport(filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  return /export\s+(?:async\s+)?(?:function\s+|const\s+)?generateStaticParams/.test(
    content
  );
}

/**
 * Check whether any route module (page/layout/template/...) directly inside a
 * dynamic segment directory exports `generateStaticParams` — the pattern these
 * generated sites use is `app/[locale]/layout.tsx` returning the locales and
 * each dynamic page (e.g. `products/[id]/page.tsx`) returning its own ids.
 */
function dirHasGenerateStaticParams(dir: string): boolean {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (!/^[^.]+\.(ts|tsx|js|jsx)$/.test(entry)) continue;
    const full = join(dir, entry);
    let isFile: boolean;
    try {
      isFile = statSync(full).isFile();
    } catch {
      continue;
    }
    if (isFile && hasGenerateStaticParamsExport(full)) return true;
  }
  return false;
}

/**
 * Find every dynamic route segment directory under app/ (names containing `[`
 * and `]`, e.g. `[locale]`, `[id]`, `[slug]`, `[...slug]`) and check whether
 * its own page/layout files export `generateStaticParams`. Under
 * `output: "export"` every dynamic segment must have a corresponding
 * generateStaticParams or Next fails the build.
 */
function listDynamicSegments(outputDir: string): DynamicSegmentCheck[] {
  const results: DynamicSegmentCheck[] = [];
  const roots = APP_DIRS.map((dir) => join(outputDir, dir)).filter((dir) =>
    existsSync(dir)
  );
  const seen = new Set<string>();

  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      let isDir = false;
      try {
        isDir = statSync(full).isDirectory();
      } catch {
        continue;
      }
      if (!isDir) continue;
      walk(full);
      if (entry.includes("[") && entry.includes("]") && !seen.has(full)) {
        seen.add(full);
        results.push({
          dir: full,
          hasGenerateStaticParams: dirHasGenerateStaticParams(full),
        });
      }
    }
  }

  for (const root of roots) walk(root);
  return results;
}

/**
 * Decide whether a generated site can be deployed as a static export.
 * A site is export-compatible only when it has NO middleware/proxy file AND
 * every dynamic route segment exports `generateStaticParams`.
 */
export function checkExportCompatibility(
  outputDir: string
): ExportCompatibilityResult {
  const middlewareFiles = findMiddlewareFiles(outputDir);
  const missingParamsRoutes = listDynamicSegments(outputDir)
    .filter((segment) => !segment.hasGenerateStaticParams)
    .map((segment) => segment.dir);
  const compatible =
    middlewareFiles.length === 0 && missingParamsRoutes.length === 0;
  return { compatible, middlewareFiles, missingParamsRoutes };
}

function buildConfigContent(opts: {
  staticExport: boolean;
  erxesEndpoint: string;
  erxesAppToken: string;
  erxesCmsId: string;
  clientPortalId: string;
  posToken: string;
  publicCmsId: string;
  pmsToken: string;
  branchId: string;
  tmsBranchId: string;
  pmsPipelineId: string;
  bookingStageId: string;
  requestStageId: string;
  pendingStageId: string;
  paidStageId: string;
  payAtPropertyStageId: string;
  approvedStageId: string;
  paymentIds: string;
  googleMapsApiKey: string;
  googlePlaceId: string;
}): string {
  const {
    staticExport,
    erxesEndpoint,
    erxesAppToken,
    erxesCmsId,
    clientPortalId,
    posToken,
    publicCmsId,
    pmsToken,
    branchId,
    tmsBranchId,
    pmsPipelineId,
    bookingStageId,
    requestStageId,
    pendingStageId,
    paidStageId,
    payAtPropertyStageId,
    approvedStageId,
    paymentIds,
    googleMapsApiKey,
    googlePlaceId,
  } = opts;

  const exportBlock = staticExport ? "  output: \"export\",\n  distDir: \"dist\",\n" : "";

  return `import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
${exportBlock}  images: {
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
    NEXT_PUBLIC_PMS_TOKEN: "${pmsToken}",
    NEXT_PUBLIC_BRANCH_ID: "${branchId}",
    NEXT_PUBLIC_TMS_BRANCH_ID: "${tmsBranchId}",
    NEXT_PUBLIC_PMS_PIPELINE_ID: "${pmsPipelineId}",
    NEXT_PUBLIC_BOOKING_STAGE_ID: "${bookingStageId}",
    NEXT_PUBLIC_REQUEST_STAGE_ID: "${requestStageId}",
    NEXT_PUBLIC_PENDING_STAGE_ID: "${pendingStageId}",
    NEXT_PUBLIC_PAID_STAGE_ID: "${paidStageId}",
    NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID: "${payAtPropertyStageId}",
    NEXT_PUBLIC_APPROVED_STAGE_ID: "${approvedStageId}",
    NEXT_PUBLIC_PAYMENT_IDS: "${paymentIds}",
    GOOGLE_MAPS_API_KEY: "${googleMapsApiKey}",
    GOOGLE_PLACE_ID: "${googlePlaceId}",
  },
};

export default withNextIntl(nextConfig);
`;
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

  // Hotel (PMS) values: .env wins, then the hotel config file.
  const pmsToken =
    process.env.NEXT_PUBLIC_PMS_TOKEN?.trim() || siteConfig.pms_token || "";
  const branchId =
    process.env.NEXT_PUBLIC_BRANCH_ID?.trim() || siteConfig.branch_id || "";
  const tmsBranchId =
    process.env.NEXT_PUBLIC_TMS_BRANCH_ID?.trim() ||
    siteConfig.tms_branch_id ||
    "";
  const pmsPipelineId =
    process.env.NEXT_PUBLIC_PMS_PIPELINE_ID?.trim() ||
    siteConfig.pipeline_id ||
    "";
  const bookingStageId =
    process.env.NEXT_PUBLIC_BOOKING_STAGE_ID?.trim() ||
    siteConfig.booking_stage_id ||
    "";
  const requestStageId =
    process.env.NEXT_PUBLIC_REQUEST_STAGE_ID?.trim() ||
    siteConfig.request_stage_id ||
    "";
  const pendingStageId =
    process.env.NEXT_PUBLIC_PENDING_STAGE_ID?.trim() ||
    siteConfig.pending_stage_id ||
    "";
  const paidStageId =
    process.env.NEXT_PUBLIC_PAID_STAGE_ID?.trim() ||
    siteConfig.paid_stage_id ||
    "";
  const payAtPropertyStageId =
    process.env.NEXT_PUBLIC_PAY_AT_PROPERTY_STAGE_ID?.trim() ||
    siteConfig.pay_at_property_stage_id ||
    "";
  const approvedStageId =
    process.env.NEXT_PUBLIC_APPROVED_STAGE_ID?.trim() ||
    siteConfig.approved_stage_id ||
    "";
  const paymentIds =
    process.env.NEXT_PUBLIC_PAYMENT_IDS?.trim() ||
    (siteConfig.payment_ids ?? []).join(",");
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    siteConfig.google_maps_api_key ||
    "";
  const googlePlaceId =
    process.env.GOOGLE_PLACE_ID?.trim() ||
    siteConfig.google_place_id ||
    "";

  const { compatible, middlewareFiles, missingParamsRoutes } =
    checkExportCompatibility(outputDir);

  if (compatible) {
    console.log(
      `→ [next-config-writer] Site is static-export compatible — writing ${outputDir}/next.config.mjs with output:"export".`
    );
  } else {
    const reasons: string[] = [];
    if (middlewareFiles.length) {
      reasons.push(
        `middleware/proxy present: ${middlewareFiles.join(", ")} (incompatible with output:"export")`
      );
    }
    if (missingParamsRoutes.length) {
      reasons.push(
        `dynamic route(s) missing generateStaticParams:\n    ${missingParamsRoutes.join(
          "\n    "
        )}`
      );
    }
    console.log(
      `→ [next-config-writer] Skipping static-export rewrite for ${outputDir} — leaving SSR config. Reasons:\n    ${reasons.join(
        "\n    "
      )}`
    );
  }

  const content = buildConfigContent({
    staticExport: compatible,
    erxesEndpoint,
    erxesAppToken,
    erxesCmsId,
    clientPortalId,
    posToken,
    publicCmsId,
    pmsToken,
    branchId,
    tmsBranchId,
    pmsPipelineId,
    bookingStageId,
    requestStageId,
    pendingStageId,
    paidStageId,
    payAtPropertyStageId,
    approvedStageId,
    paymentIds,
    googleMapsApiKey,
    googlePlaceId,
  });

  const configPath = join(outputDir, "next.config.mjs");
  writeFileSync(configPath, content, "utf-8");
  console.log(`→ [next-config-writer] Written ${configPath}`);
}