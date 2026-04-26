import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import type { SiteConfig, SiteIntent } from "../types.js";

const VALID_SITE_TYPES = ["business", "blog", "landing", "portfolio", "ecommerce"];
const VALID_TONES = ["formal", "casual", "modern", "traditional", "playful"];
const VALID_LANGUAGES = ["mn", "en", "zh", "ru", "ko", "ja"];
const VALID_SECTIONS = [
  "hero", "about", "services", "blog", "contact", "gallery",
  "pricing", "team", "testimonials", "faq", "menu", "portfolio",
];

const INDUSTRY_COLOR_MAP: Record<string, string> = {
  coffee: "brown",
  restaurant: "warm orange",
  food: "warm orange",
  tech: "blue",
  fashion: "black",
  health: "green",
  finance: "navy",
  education: "blue",
  nature: "green",
  beauty: "pink",
  law: "dark gray",
  hotel: "gold",
  travel: "teal",
  sport: "red",
};

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

async function collectMissing(raw: Partial<SiteConfig>): Promise<SiteConfig> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    if (!raw.name?.trim()) {
      raw.name = await ask(rl, "Site name: ");
    }
    if (!raw.site_type || !VALID_SITE_TYPES.includes(raw.site_type)) {
      raw.site_type = (await ask(rl, `Site type (${VALID_SITE_TYPES.join(" | ")}): `)) as SiteConfig["site_type"];
    }
    if (!raw.industry?.trim()) {
      raw.industry = await ask(rl, "Industry (e.g. coffee, tech, health): ");
    }
    if (!raw.language || !VALID_LANGUAGES.includes(raw.language)) {
      raw.language = (await ask(rl, `Language (${VALID_LANGUAGES.join(" | ")}): `)) as SiteConfig["language"];
    }
    if (!raw.tone || !VALID_TONES.includes(raw.tone)) {
      raw.tone = (await ask(rl, `Tone (${VALID_TONES.join(" | ")}): `)) as SiteConfig["tone"];
    }
    if (!Array.isArray(raw.required_sections) || raw.required_sections.length === 0) {
      const input = await ask(rl, "Sections (comma-separated, valid: " + VALID_SECTIONS.join(", ") + "): ");
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
    industry?: string;
    language?: string;
    tone?: string;
    sections?: string[];
    required_sections?: string[];
    color_hint?: string;
    extra_notes?: string;
    erxes_endpoint?: string;
    erxes_app_token?: string;
    erxes_cp_id?: string;
    erxes_cms_id?: string;
  };

  let raw: Partial<SiteConfig> = {};
  let configErxes = { endpoint: "", app_token: "", cp_id: "", cms_id: "" };

  if (existsSync(configPath)) {
    console.log("→ [config-loader] Loading site.config.json...");
    const parsed = JSON.parse(readFileSync(configPath, "utf-8")) as RawConfig;
    raw.name = parsed.name;
    raw.site_type = (parsed.site_type ?? parsed.template_type) as SiteConfig["site_type"];
    raw.industry = parsed.industry;
    raw.language = parsed.language as SiteConfig["language"];
    raw.tone = parsed.tone as SiteConfig["tone"];
    raw.required_sections = parsed.required_sections ?? parsed.sections;
    raw.color_hint = parsed.color_hint;
    raw.extra_notes = parsed.extra_notes || null;
    configErxes.endpoint = parsed.erxes_endpoint ?? "";
    configErxes.app_token = parsed.erxes_app_token ?? "";
    configErxes.cp_id = parsed.erxes_cp_id ?? "";
    configErxes.cms_id = parsed.erxes_cms_id ?? "";
  } else {
    console.log("→ [config-loader] site.config.json not found, collecting via CLI...");
  }

  const config = await collectMissing(raw);

  // Erxes credentials: env → config file → CLI prompt
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let erxes_endpoint = process.env.ERXES_ENDPOINT?.trim() || configErxes.endpoint;
  let erxes_app_token = process.env.ERXES_APP_TOKEN?.trim() || configErxes.app_token;
  let erxes_cp_id = process.env.ERXES_CP_ID?.trim() || configErxes.cp_id;
  let erxes_cms_id = process.env.ERXES_CMS_ID?.trim() || configErxes.cms_id;
  try {
    if (!erxes_endpoint) erxes_endpoint = await ask(rl, "erxes SaaS endpoint URL: ");
    if (!erxes_app_token) erxes_app_token = await ask(rl, "erxes app token: ");
    if (!erxes_cp_id) erxes_cp_id = await ask(rl, "erxes client portal id: ");
    if (!erxes_cms_id) erxes_cms_id = await ask(rl, "erxes CMS id: ");
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

  // Derive slug
  const slug = config.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Derive boolean flags
  const has_blog = config.required_sections.includes("blog");
  const has_contact = config.required_sections.includes("contact");
  const has_ecommerce = config.site_type === "ecommerce";

  // Derive color_hint from industry if not provided
  let color_hint = config.color_hint ?? null;
  if (!color_hint) {
    const lower = config.industry.toLowerCase();
    for (const [keyword, color] of Object.entries(INDUSTRY_COLOR_MAP)) {
      if (lower.includes(keyword)) {
        color_hint = color;
        break;
      }
    }
  }

  console.log("→ [config-loader] Done");

  return {
    name: config.name,
    slug,
    site_type: config.site_type,
    industry: config.industry,
    language: config.language,
    tone: config.tone,
    required_sections: config.required_sections,
    erxes_endpoint,
    erxes_app_token,
    erxes_cp_id,
    erxes_cms_id,
    has_blog,
    has_contact,
    has_ecommerce,
    color_hint,
    extra_notes: config.extra_notes ?? null,
  };
}
