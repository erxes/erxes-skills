import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import type { SiteConfig, SiteIntent } from "../types.js";

const VALID_SITE_TYPES = ["business", "ecommerce", "tour", "hotel"];
const VALID_TONES = ["formal", "casual", "modern", "traditional", "playful"];
const VALID_LANGUAGES = ["mn", "en", "zh", "ru", "ko", "ja"];
const VALID_SECTIONS = [
  "hero", "about", "services", "blog", "contact", "gallery",
  "pricing", "team", "testimonials", "faq", "menu", "portfolio",
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
      raw.required_sections = input.split(",").map((s) => s.trim()).filter(Boolean);
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
    raw.color_hint = parsed.color_hint;
    raw.extra_notes = parsed.extra_notes || null;
    configErxes.endpoint = parsed.erxes_endpoint ?? "";
    configErxes.app_token = parsed.erxes_app_token ?? "";
    configErxes.cms_id = parsed.erxes_cms_id ?? "";
    configErxes.client_portal_id = parsed.client_portal_id ?? "";
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

  // Derive slug from name
  const slug = toSlug(config.name);

  // Derive boolean flags
  const has_blog = config.required_sections.includes("blog");
  const has_contact = config.required_sections.includes("contact");
  const has_ecommerce = config.site_type === "ecommerce";

  console.log("→ [config-loader] Done");

  return {
    name: config.name,
    slug,
    site_type: config.site_type,
    language: config.language,
    languages: config.languages ?? [config.language],
    tone: config.tone,
    required_sections: config.required_sections,
    erxes_endpoint,
    erxes_app_token,
    client_portal_id,
    erxes_cms_id,
    has_blog,
    has_contact,
    has_ecommerce,
    color_hint: config.color_hint ?? null,
    extra_notes: config.extra_notes ?? null,
  };
}
