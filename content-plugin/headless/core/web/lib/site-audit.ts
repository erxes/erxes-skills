import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import type {
  SiteAuditContact,
  SiteAuditLink,
  SiteAuditPage,
  SiteAuditResult,
} from "../types.js";

const DEFAULT_MAX_PAGES = 24;
const REQUEST_TIMEOUT_MS = 15000;

const SKIP_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".zip",
  ".xml",
  ".json",
  ".ico",
  ".mp4",
  ".mp3",
  ".woff",
  ".woff2",
];

const SKIP_PATH_PARTS = [
  "login",
  "signin",
  "sign-in",
  "signup",
  "sign-up",
  "register",
  "account",
  "admin",
  "checkout",
  "cart",
  "search",
  "tag",
  "author",
  "wp-admin",
];

const PRIORITY_KEYWORDS = [
  "about",
  "service",
  "services",
  "contact",
  "faq",
  "team",
  "portfolio",
  "gallery",
  "pricing",
  "product",
  "products",
  "career",
  "careers",
  "location",
  "blog",
  "news",
];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function cleanText(input: string): string {
  return decodeHtmlEntities(
    input
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function normaliseHref(baseUrl: URL, href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  if (/^(mailto|tel|javascript):/i.test(trimmed)) return null;

  try {
    const resolved = new URL(trimmed, baseUrl);
    resolved.hash = "";
    resolved.search = "";
    if (resolved.origin !== baseUrl.origin) return null;
    if (SKIP_EXTENSIONS.some((ext) => resolved.pathname.toLowerCase().endsWith(ext))) return null;
    if (SKIP_PATH_PARTS.some((part) => resolved.pathname.toLowerCase().includes(`/${part}`))) return null;
    return resolved.toString().replace(/\/+$/, "") || resolved.origin;
  } catch {
    return null;
  }
}

function extractTagText(html: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const results: string[] = [];

  for (const match of html.matchAll(regex)) {
    const text = cleanText(match[1] ?? "");
    if (text) results.push(text);
  }

  return unique(results);
}

function extractMetaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta\\b[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["'][^>]*>`, "i"),
    new RegExp(`<meta\\b[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }

  return null;
}

function extractHtmlLang(html: string): string | null {
  const match = html.match(/<html\b[^>]*lang=["']([^"']+)["']/i);
  return match?.[1]?.trim() || null;
}

function extractAnchors(html: string, baseUrl: URL, source: SiteAuditLink["source"]): SiteAuditLink[] {
  const regex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  const links: SiteAuditLink[] = [];

  for (const match of html.matchAll(regex)) {
    const url = normaliseHref(baseUrl, match[2] ?? "");
    if (!url) continue;

    const label = cleanText(match[3] ?? "");
    if (!label) continue;

    links.push({ url, label, source });
  }

  return links;
}

function extractScopedAnchors(html: string, baseUrl: URL, tagName: "nav" | "footer"): SiteAuditLink[] {
  const blockRegex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const links: SiteAuditLink[] = [];

  for (const match of html.matchAll(blockRegex)) {
    links.push(...extractAnchors(match[1] ?? "", baseUrl, tagName === "nav" ? "nav" : "footer"));
  }

  return links;
}

function extractLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase();
  if (first && /^[a-z]{2}(-[a-z]{2})?$/.test(first)) return first;
  return null;
}

function extractLocaleLinks(html: string, baseUrl: URL): SiteAuditLink[] {
  const hreflangRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*hreflang=(["'])(.*?)\3[^>]*>([\s\S]*?)<\/a>/gi;
  const results: SiteAuditLink[] = [];

  for (const match of html.matchAll(hreflangRegex)) {
    const url = normaliseHref(baseUrl, match[2] ?? "");
    if (!url) continue;

    const hreflang = (match[4] ?? "").trim();
    const label = cleanText(match[5] ?? "") || hreflang;
    if (!label) continue;

    results.push({ url, label, source: "locale" });
  }

  const allAnchors = extractAnchors(html, baseUrl, "locale");
  return uniqueByUrl([...results, ...allAnchors.filter((link) => extractLocaleFromPath(new URL(link.url).pathname))]);
}

function uniqueByUrl(links: SiteAuditLink[]): SiteAuditLink[] {
  const seen = new Map<string, SiteAuditLink>();
  for (const link of links) {
    if (!seen.has(link.url)) seen.set(link.url, link);
  }
  return [...seen.values()];
}

function extractTextBlocks(html: string): string[] {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const source = mainMatch?.[1] ?? html;
  const blocks: string[] = [];
  const regex = /<(p|li|h2|h3|h4|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  for (const match of source.matchAll(regex)) {
    const text = cleanText(match[2] ?? "");
    if (text.length >= 30 && text.length <= 320) blocks.push(text);
  }

  return unique(blocks).slice(0, 24);
}

function extractCtaLabels(links: SiteAuditLink[]): string[] {
  return unique(
    links
      .map((link) => link.label)
      .filter((label) => label.length > 1 && label.length <= 60)
  ).slice(0, 12);
}

function extractContact(html: string): SiteAuditContact {
  const emailMatches = [...html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0]);
  const phoneMatches = [...html.matchAll(/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{2,4}[\s-]?\d{2,4}(?:[\s-]?\d{2,4})?/g)]
    .map((match) => match[0].replace(/\s+/g, " ").trim())
    .filter((value) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 12) return false;
      if (/^20\d{2}[-/]\d{2}[-/]\d{2}$/.test(value)) return false;
      return true;
    });

  return {
    emails: unique(emailMatches).slice(0, 8),
    phones: unique(phoneMatches).slice(0, 8),
  };
}

function shouldPrioritise(urlString: string): number {
  const url = new URL(urlString);
  const pathname = url.pathname.toLowerCase();
  const segments = pathname.split("/").filter(Boolean);

  let score = 0;
  if (pathname === "/" || pathname === "") score += 100;
  if (segments.length <= 2) score += 20;
  if (extractLocaleFromPath(pathname)) score += 10;
  if (PRIORITY_KEYWORDS.some((keyword) => pathname.includes(keyword))) score += 25;
  if (/\d{4}/.test(pathname)) score -= 10;
  if (segments.length > 4) score -= 10;

  return score;
}

function filterRelevantUrls(urls: string[], baseUrl: URL): string[] {
  return unique(urls)
    .filter((url) => {
      try {
        const parsed = new URL(url);
        if (parsed.origin !== baseUrl.origin) return false;
        if (SKIP_EXTENSIONS.some((ext) => parsed.pathname.toLowerCase().endsWith(ext))) return false;
        if (SKIP_PATH_PARTS.some((part) => parsed.pathname.toLowerCase().includes(`/${part}`))) return false;
        return true;
      } catch {
        return false;
      }
    })
    .sort((a, b) => shouldPrioritise(b) - shouldPrioritise(a));
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "erxes-site-audit/1.0 (+https://erxes.io)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSitemapUrls(baseUrl: URL): Promise<string[]> {
  const candidates = [
    new URL("/sitemap.xml", baseUrl).toString(),
    new URL("/sitemap_index.xml", baseUrl).toString(),
  ];

  for (const url of candidates) {
    try {
      const xml = await fetchText(url);
      const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)].map((match) => match[1]?.trim()).filter(Boolean) as string[];
      if (locs.length > 0) {
        return filterRelevantUrls(locs, baseUrl);
      }
    } catch {
      continue;
    }
  }

  return [];
}

function buildPageRecord(url: string, html: string, source: SiteAuditPage["source"]): SiteAuditPage {
  const baseUrl = new URL(url);
  const navLinks = extractScopedAnchors(html, baseUrl, "nav");
  const footerLinks = extractScopedAnchors(html, baseUrl, "footer");
  const contentLinks = extractAnchors(html, baseUrl, "content");
  const localeLinks = extractLocaleLinks(html, baseUrl);
  const links = uniqueByUrl([...navLinks, ...footerLinks, ...localeLinks, ...contentLinks]);

  return {
    url: baseUrl.toString().replace(/\/+$/, "") || baseUrl.origin,
    pathname: baseUrl.pathname || "/",
    title: extractTagText(html, "title")[0] ?? null,
    description: extractMetaContent(html, "description"),
    locale: extractLocaleFromPath(baseUrl.pathname),
    html_lang: extractHtmlLang(html),
    headings: unique([
      ...extractTagText(html, "h1"),
      ...extractTagText(html, "h2"),
      ...extractTagText(html, "h3"),
    ]).slice(0, 18),
    cta_labels: extractCtaLabels(links),
    text_blocks: extractTextBlocks(html),
    links,
    contact: extractContact(html),
    source,
  };
}

export interface SiteAuditOptions {
  startUrl: string;
  maxPages?: number;
  outputPath?: string;
}

export async function siteAudit(options: SiteAuditOptions): Promise<SiteAuditResult> {
  const baseUrl = new URL(options.startUrl);
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const queue = [baseUrl.toString().replace(/\/+$/, "") || baseUrl.origin];
  const visited = new Set<string>();
  const skipped = new Set<string>();
  const pages: SiteAuditPage[] = [];

  const sitemapUrls = await fetchSitemapUrls(baseUrl);
  for (const url of sitemapUrls) {
    if (!queue.includes(url)) queue.push(url);
  }

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    try {
      const html = await fetchText(current);
      const page = buildPageRecord(current, html, pages.length === 0 ? "seed" : "content");
      pages.push(page);

      const discovered = filterRelevantUrls(page.links.map((link) => link.url), baseUrl);
      for (const discoveredUrl of discovered) {
        if (!visited.has(discoveredUrl) && !queue.includes(discoveredUrl)) {
          queue.push(discoveredUrl);
        }
      }

      queue.sort((a, b) => shouldPrioritise(b) - shouldPrioritise(a));
    } catch {
      skipped.add(current);
    }
  }

  const locales = unique(
    pages
      .flatMap((page) => [page.locale, page.html_lang])
      .filter((locale): locale is string => Boolean(locale))
      .map((locale) => locale.toLowerCase())
  );

  const result: SiteAuditResult = {
    site: baseUrl.hostname,
    start_url: baseUrl.toString(),
    audited_at: new Date().toISOString(),
    locales,
    audited_pages: pages,
    discovered_pages: unique(pages.flatMap((page) => page.links.map((link) => link.url))),
    skipped_pages: [...skipped],
  };

  if (options.outputPath) {
    await mkdir(dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
  }

  return result;
}
