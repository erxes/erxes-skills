/**
 * Clone erxes-web-starter into output/<slug>/
 * Usage: tsx scripts/clone.ts "<site-name>"
 * Output: prints the output directory path
 */
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { repoCloner } from "../lib/repo-cloner.js";

/**
 * Payment operations are shared across verticals. The starter keeps them in the
 * ecommerce folder, and `src/lib/hooks/useInvoice.ts` imports them from there,
 * so hotel and tour runs must retain them even though ecommerce is not their
 * active vertical. Both files import nothing outside @apollo/client, so this
 * list is their complete transitive closure.
 */
const SHARED_PAYMENT_FILES = [
  join("mutations", "payment.ts"),
  join("queries", "payment.ts"),
];

/** Verticals that must keep the shared payment operations after pruning. */
const KEEPS_SHARED_PAYMENT = new Set(["hotel", "tour"]);

const siteName = process.argv[2];
if (!siteName) {
  console.error("Usage: tsx scripts/clone.ts \"<site-name>\"");
  process.exit(1);
}

const starterRepoUrl = process.env.STARTER_REPO_URL ?? "";
if (!starterRepoUrl) throw new Error("STARTER_REPO_URL is not set in .env");

const outputDir = repoCloner(starterRepoUrl, siteName);

const templateType = detectTemplateType();
pruneInactiveVerticals(outputDir, templateType);

console.log(outputDir);

/**
 * Resolve the active vertical from the migrated config at the workspace root.
 * Order matters: vertical config files win over the generic site config.
 * - hotel.config.json → "hotel"
 * - store.config.json → "ecommerce"
 * - site.config.json → `template_type` / `site_type` field
 * Returns null when no config exists yet (clone will not prune, preserving the
 * full starter tree until setup completes).
 */
function detectTemplateType(): string | null {
  const byFile: Array<[string, string]> = [
    ["hotel.config.json", "hotel"],
    ["store.config.json", "ecommerce"],
  ];
  for (const [file, vertical] of byFile) {
    if (existsSync(join(process.cwd(), file))) return vertical;
  }
  const siteConfig = join(process.cwd(), "site.config.json");
  if (existsSync(siteConfig)) {
    try {
      const parsed = JSON.parse(readFileSync(siteConfig, "utf-8")) as {
        template_type?: string;
        site_type?: string;
      };
      const detected = parsed.template_type ?? parsed.site_type;
      if (detected) return detected;
    } catch {
      // fall through to no-op
    }
  }
  console.log(
    "→ [clone] could not determine template_type from config; skipping graphql prune"
  );
  return null;
}

/**
 * The starter commits graphql layers for every vertical. Keep only the shared
 * layers (auth, cms) plus the active vertical folder; drop the inactive ones.
 * `business` sites keep auth + cms only. A null template skips pruning.
 * hotel/tour additionally retain the shared payment operations.
 */
function pruneInactiveVerticals(dir: string, templateType: string | null): void {
  if (!templateType) return;
  const verticals = ["ecommerce", "tour", "hotel"];
  const keep = verticals.includes(templateType) ? templateType : null;
  const keepSharedPayment = KEEPS_SHARED_PAYMENT.has(templateType);

  for (const vertical of verticals) {
    if (vertical === keep) continue;
    const target = join(dir, "src", "graphql", vertical);
    if (!existsSync(target)) continue;

    // Read the shared files before the folder is removed.
    const preserved: { path: string; body: Buffer }[] = [];
    if (keepSharedPayment && vertical === "ecommerce") {
      for (const rel of SHARED_PAYMENT_FILES) {
        const file = join(target, rel);
        if (existsSync(file)) {
          preserved.push({ path: file, body: readFileSync(file) });
        }
      }
    }

    rmSync(target, { recursive: true, force: true });

    for (const { path, body } of preserved) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
    }

    console.log(
      `→ [clone] pruned src/graphql/${vertical} (template_type=${templateType})` +
        (preserved.length
          ? ` — retained ${preserved.length} shared payment operation file(s)`
          : "")
    );
  }
  console.log(
    `→ [clone] retained src/graphql/auth + src/graphql/cms` +
      (keep ? ` + src/graphql/${keep}` : "") +
      ` (template_type=${templateType})` +
      (keepSharedPayment
        ? ` + shared payment ops for ${[...KEEPS_SHARED_PAYMENT].join("/")}`
        : "")
  );
}
