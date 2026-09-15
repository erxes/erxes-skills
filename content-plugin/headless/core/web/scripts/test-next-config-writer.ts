/**
 * Manual test for lib/next-config-writer.ts export-compatibility decision.
 * Usage: pnpm test:config-writer  (or npx tsx scripts/test-next-config-writer.ts)
 *
 * Covers:
 *  (a) site with middleware present            -> skips static export
 *  (b) site with dynamic route lacking params  -> skips static export
 *  (c) fully export-compatible site            -> gets output:"export" as before
 */
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkExportCompatibility,
  nextConfigWriter,
} from "../lib/next-config-writer.js";

const ROOT = mkdtempSync(join(tmpdir(), "ncw-test-"));

function write(file: string, content: string) {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content, "utf-8");
}

function makeSite(name: string) {
  const dir = join(ROOT, name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

const DYNAMIC_PAGE_WITH_PARAMS = `export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }];
}

export default function Page() {
  return <div>ok</div>;
}
`;

const DYNAMIC_PAGE_WITHOUT_PARAMS = `export default function Page() {
  return <div>ok</div>;
}
`;

const STATIC_PAGE = `export default function Page() {
  return <div>ok</div>;
}
`;

const LOCALE_LAYOUT_WITH_PARAMS = `export function generateStaticParams() {
  return [{ locale: "mn" }, { locale: "en" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
`;

const SITES = [
  {
    name: "a-middleware",
    expectedCompatible: false,
    reason: "middleware present -> skip static export",
    build: (dir: string) => {
      write(join(dir, "src", "proxy.ts"),
        `import { NextRequest } from "next/server";\nexport function proxy(req: NextRequest) {}\n`
      );
      write(join(dir, "app", "[locale]", "layout.tsx"), LOCALE_LAYOUT_WITH_PARAMS);
      write(join(dir, "app", "[locale]", "products", "[id]", "page.tsx"), DYNAMIC_PAGE_WITH_PARAMS);
    },
  },
  {
    name: "b-missing-params",
    expectedCompatible: false,
    reason: "dynamic route missing generateStaticParams -> skip static export",
    build: (dir: string) => {
      write(join(dir, "app", "[locale]", "layout.tsx"), LOCALE_LAYOUT_WITH_PARAMS);
      write(join(dir, "app", "[locale]", "blog", "[slug]", "page.tsx"), DYNAMIC_PAGE_WITHOUT_PARAMS);
    },
  },
  {
    name: "c-fully-compatible",
    expectedCompatible: true,
    reason: "all dynamic routes have params + no middleware -> static export as before",
    build: (dir: string) => {
      write(join(dir, "app", "[locale]", "layout.tsx"), LOCALE_LAYOUT_WITH_PARAMS);
      write(join(dir, "app", "[locale]", "products", "[id]", "page.tsx"), DYNAMIC_PAGE_WITH_PARAMS);
      write(
        join(dir, "app", "[locale]", "orders", "[id]", "page.tsx"),
        `export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <div>ok</div>;
}
`
      );
      write(join(dir, "app", "[locale]", "about", "page.tsx"), STATIC_PAGE);
    },
  },
];

try {
  process.env.ERXES_ENDPOINT = "http://localhost:4000/graphql";
  process.env.ERXES_APP_TOKEN = "test-app-token";
  process.env.ERXES_CMS_ID = "test-cms-id";

  for (const site of SITES) {
    const dir = makeSite(site.name);
    site.build(dir);

    const result = checkExportCompatibility(dir);
    assert.equal(
      result.compatible,
      site.expectedCompatible,
      `[${site.name}] expected compatible=${site.expectedCompatible} (${site.reason}) result=${JSON.stringify(result)}`
    );

    nextConfigWriter(dir);
    assert.ok(
      existsSync(join(dir, "next.config.mjs")),
      `[${site.name}] next.config.mjs should be written`
    );
    const config = readFileSync(join(dir, "next.config.mjs"), "utf-8");

    if (site.expectedCompatible) {
      assert.ok(
        config.includes('output: "export"'),
        `[${site.name}] config should contain output:"export"`
      );
      assert.ok(
        config.includes('distDir: "dist"'),
        `[${site.name}] config should contain distDir:"dist"`
      );
    } else {
      assert.ok(
        !config.includes('output: "export"'),
        `[${site.name}] config must NOT contain output:"export"`
      );
      assert.ok(
        !config.includes("distDir"),
        `[${site.name}] config must NOT contain distDir`
      );
      assert.ok(
        (result.middlewareFiles.length > 0 || result.missingParamsRoutes.length > 0) &&
          !result.compatible,
        `[${site.name}] result should report the blocking reason`
      );
    }

    assert.ok(
      config.includes("NEXT_PUBLIC_ERXES_ENDPOINT"),
      `[${site.name}] env block should be present in both modes`
    );

    console.log(`PASS [${site.name}] ${site.reason}`);
  }

  console.log("\nAll next-config-writer export-compatibility tests passed.");
} finally {
  rmSync(ROOT, { recursive: true, force: true });
}