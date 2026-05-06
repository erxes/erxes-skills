import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import type { SiteConfig, SiteIntent } from "../types.js";

const VALID_SITE_TYPES = ["business", "ecommerce", "tour", "hotel"];
const VALID_TONES = ["formal", "casual", "modern", "traditional", "playful"];
const VALID_LANGUAGES = ["mn", "en", "zh", "ru", "ko", "ja"];
const VALID_UI_SOURCES = ["words", "pencil", "figma", "screenshot", "website"];
const VALID_DESIGN_STRATEGIES = [
  "from-scratch",
  "copy-site",
  "improve-site",
  "brand-first",
  "beat-competitors",
];
const VALID_DEPLOY_TARGETS = ["vercel", "github"];
const VALID_SECTIONS = [
  "hero", "about", "services", "blog", "contact", "gallery",
  "pricing", "team", "testimonials", "faq", "menu", "portfolio",
  "design", "career", "product", "location",
];

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

function toSlug(input: string): string {
  return input.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeErxesEndpoint(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/gateway/graphql")) return trimmed;
  return `${trimmed}/gateway/graphql`;
}

function parseCsv(input: string): string[] {
  return input.split(",").map((value) => value.trim()).filter(Boolean);
}

function getUiSourcePrompt(uiSource: string): string {
  switch (uiSource) {
    case "words":
      return "Describe the look and feel you want: ";
    case "pencil":
      return "Path to your .pen file: ";
    case "figma":
      return "Figma file URL or exported image paths: ";
    case "screenshot":
      return "Screenshot file path(s): ";
    case "website":
      return "URL of the existing website: ";
    default:
      return "UI source reference: ";
  }
}

async function collectMissing(raw: Partial<SiteConfig>): Promise<SiteConfig> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    if (!raw.name?.trim()) {
      const input = await ask(rl, "Site name (lowercase, dashes — e.g. my-coffee-shop): ");
      raw.name = toSlug(input);
    } else {
      raw.name = toSlug(raw.name);
    }
    if (!raw.site_type || !VALID_SITE_TYPES.includes(raw.site_type)) {
      raw.site_type = (await ask(rl, `Template type (${VALID_SITE_TYPES.join(" | ")}): `)) as SiteConfig["site_type"];
    }
    if (!raw.language || !VALID_LANGUAGES.includes(raw.language)) {
      const input = await ask(rl, `Languages, comma-separated — first is default (${VALID_LANGUAGES.join(", ")}): `);
      const langs = input.split(",").map((l) => l.trim()).filter(Boolean) as SiteConfig["language"][];
      raw.language = langs[0] ?? "en";
      raw.languages = langs.length > 0 ? langs : [raw.language];
    }
    if (!raw.tone || !VALID_TONES.includes(raw.tone)) {
      raw.tone = (await ask(rl, `Tone (${VALID_TONES.join(" | ")}): `)) as SiteConfig["tone"];
    }
    if (!Array.isArray(raw.required_sections) || raw.required_sections.length === 0) {
      const input = await ask(rl, "Sections (comma-separated): ");
      raw.required_sections = parseCsv(input);
    }
    if (!raw.ui_source || !VALID_UI_SOURCES.includes(raw.ui_source)) {
      raw.ui_source = (await ask(
        rl,
        `UI source (${VALID_UI_SOURCES.join(" | ")}): `
      )) as SiteConfig["ui_source"];
    }
    if (!raw.ui_source_ref?.trim()) {
      raw.ui_source_ref = await ask(rl, getUiSourcePrompt(raw.ui_source ?? ""));
    }
    if (!raw.design_strategy || !VALID_DESIGN_STRATEGIES.includes(raw.design_strategy)) {
      raw.design_strategy = (await ask(
        rl,
        `Design strategy (${VALID_DESIGN_STRATEGIES.join(" | ")}): `
      )) as SiteConfig["design_strategy"];
    }
    if (
      raw.design_strategy === "copy-site" ||
      raw.design_strategy === "improve-site"
    ) {
      if (raw.ui_source === "website" && raw.ui_source_ref?.trim() && !raw.reference_url?.trim()) {
        raw.reference_url = raw.ui_source_ref.trim();
      }
      if (!raw.reference_url?.trim()) {
        raw.reference_url = await ask(rl, "Source website URL to copy or improve: ");
      }
      raw.competitor_urls = [];
    } else if (raw.design_strategy === "beat-competitors") {
      if (!Array.isArray(raw.competitor_urls) || raw.competitor_urls.length < 2) {
        const input = await ask(rl, "Competitor website URLs, comma-separated (2 to 5): ");
        raw.competitor_urls = parseCsv(input).slice(0, 5);
      }
      raw.reference_url = null;
    } else {
      raw.reference_url = null;
      raw.competitor_urls = [];
    }
    if (raw.ui_source === "words" && raw.color_hint === undefined) {
      const input = await ask(rl, "Primary color (optional, press Enter to skip): ");
      raw.color_hint = input || null;
    }
    if (!raw.deploy_target || !VALID_DEPLOY_TARGETS.includes(raw.deploy_target)) {
      raw.deploy_target = (await ask(
        rl,
        `Deploy target (${VALID_DEPLOY_TARGETS.join(" | ")}): `
      )) as SiteConfig["deploy_target"];
    }
  } finally {
    rl.close();
  }
  return raw as SiteConfig;
}

export async function configLoader(): Promise<SiteIntent> {
  const configPath = join(process.cwd(), "site.config.json");
  type RawConfig = {
    name?: string;
    template_type?: string;
    site_type?: string;
    language?: string;
    languages?: string[];
    tone?: string;
    sections?: string[];
    required_sections?: string[];
    ui_source?: string;
    ui_source_ref?: string;
    design_strategy?: string;
    reference_url?: string | null;
    competitor_urls?: string[];
    deploy_target?: string;
    color_hint?: string;
    extra_notes?: string;
    client_portal_id?: string;
    erxes_endpoint?: string;
    erxes_app_token?: string;
    erxes_cms_id?: string;
  };

  let raw: Partial<SiteConfig> = {};
  let configErxes = { endpoint: "", app_token: "", cms_id: "", client_portal_id: "" };

  if (existsSync(configPath)) {
    console.log("→ [config-loader] Loading site.config.json...");
    const parsed = JSON.parse(readFileSync(configPath, "utf-8")) as RawConfig;
    raw.name = parsed.name;
    raw.site_type = (parsed.site_type ?? parsed.template_type) as SiteConfig["site_type"];
    raw.language = parsed.language as SiteConfig["language"];
    raw.languages = (parsed.languages ?? (parsed.language ? [parsed.language] : [])) as SiteConfig["language"][];
    raw.tone = parsed.tone as SiteConfig["tone"];
    raw.required_sections = parsed.required_sections ?? parsed.sections;
    raw.ui_source = parsed.ui_source as SiteConfig["ui_source"];
    raw.ui_source_ref = parsed.ui_source_ref ?? null;
    raw.design_strategy = parsed.design_strategy as SiteConfig["design_strategy"];
    raw.reference_url = parsed.reference_url ?? null;
    raw.competitor_urls = parsed.competitor_urls ?? [];
    raw.deploy_target = parsed.deploy_target as SiteConfig["deploy_target"];
    raw.color_hint = parsed.color_hint;
    raw.extra_notes = parsed.extra_notes || null;
    configErxes.endpoint = parsed.erxes_endpoint ?? parsed.erxes_api_url ?? "";
    configErxes.app_token = parsed.erxes_app_token ?? "";
    configErxes.cms_id = parsed.erxes_cms_id ?? "";
    configErxes.client_portal_id = parsed.client_portal_id ?? parsed.clientPortalId ?? "";
  } else {
    console.log("→ [config-loader] site.config.json not found, collecting via CLI...");
  }

  const config = await collectMissing(raw);

  // Erxes credentials: env → config file → CLI prompt
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let erxes_endpoint = normalizeErxesEndpoint(
    process.env.ERXES_ENDPOINT?.trim() || configErxes.endpoint
  );
  let erxes_app_token = process.env.ERXES_APP_TOKEN?.trim() || configErxes.app_token;
  let erxes_cms_id = process.env.ERXES_CMS_ID?.trim() || configErxes.cms_id || null;
  let client_portal_id =
    process.env.ERXES_CLIENT_PORTAL_ID?.trim() || configErxes.client_portal_id;
  try {
    if (!erxes_endpoint) {
      erxes_endpoint = normalizeErxesEndpoint(
        await ask(rl, "erxes SaaS URL (example: https://producttest.next.erxes.io): ")
      );
    }
    if (!erxes_app_token) erxes_app_token = await ask(rl, "erxes app token: ");
    if (!client_portal_id) client_portal_id = await ask(rl, "erxes client portal id: ");
  } finally {
    rl.close();
  }

  // Validate and normalise sections
  if (!config.required_sections.includes("hero")) {
    config.required_sections.unshift("hero");
  }
  const invalid = config.required_sections.filter((s) => !VALID_SECTIONS.includes(s));
  if (invalid.length) throw new Error(`Unknown sections: ${invalid.join(", ")}`);
  config.required_sections = [...new Set(config.required_sections)];
  if (config.design_strategy === "beat-competitors") {
    const competitorCount = config.competitor_urls?.length ?? 0;
    if (competitorCount < 2) {
      throw new Error("beat-competitors requires at least 2 competitor URLs");
    }
  }

  // Derive slug from name
  const slug = toSlug(config.name);

  // Derive boolean flags
  const has_blog = config.required_sections.includes("blog");
  const has_contact = config.required_sections.includes("contact");
  const has_ecommerce = config.site_type === "ecommerce";
  const has_auth = ["ecommerce", "tour", "hotel"].includes(config.site_type);

  console.log("→ [config-loader] Done");

  return {
    name: config.name,
    slug,
    site_type: config.site_type,
    language: config.language,
    languages: config.languages ?? [config.language],
    tone: config.tone,
    required_sections: config.required_sections,
    ui_source: config.ui_source ?? null,
    ui_source_ref: config.ui_source_ref ?? null,
    design_strategy: config.design_strategy ?? null,
    reference_url: config.reference_url ?? null,
    competitor_urls: config.competitor_urls ?? [],
    deploy_target: config.deploy_target ?? null,
    erxes_endpoint,
    erxes_app_token,
    client_portal_id,
    erxes_cms_id,
    has_blog,
    has_contact,
    has_ecommerce,
    has_auth,
    color_hint: config.color_hint ?? null,
    extra_notes: config.extra_notes ?? null,
  };
}
