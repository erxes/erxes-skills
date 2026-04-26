export type SiteType = "business" | "blog" | "landing" | "portfolio" | "ecommerce";
export type Tone = "formal" | "casual" | "modern" | "traditional" | "playful";
export type Language = "mn" | "en" | "zh" | "ru" | "ko" | "ja";

export interface SiteConfig {
  name: string;
  site_type: SiteType;
  industry: string;
  language: Language;
  tone: Tone;
  required_sections: string[];
  color_hint?: string | null;
  extra_notes?: string | null;
}

export interface SiteIntent {
  name: string;
  slug: string;
  site_type: SiteType;
  industry: string;
  language: Language;
  tone: Tone;
  required_sections: string[];
  erxes_endpoint: string;
  erxes_app_token: string;
  erxes_cp_id: string;
  erxes_cms_id: string;
  has_blog: boolean;
  has_contact: boolean;
  has_ecommerce: boolean;
  color_hint: string | null;
  extra_notes: string | null;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ContentMutation {
  type: string;
  mutation: string;
  variables: Record<string, unknown>;
}

export interface MutationResult {
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SeedPage {
  section: string;
  name: string;
  slug: string;
  description: string;
  content: string;
}

export interface SeedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

export interface SeedMenuItem {
  label: string;
  url: string;
  order: number;
}

export interface SeedContent {
  pages: SeedPage[];
  category: { name: string; slug: string } | null;
  posts: SeedPost[];
  menu: SeedMenuItem[];
}

export interface ErxesContext {
  erxes_endpoint: string;
  erxes_app_token: string;
  erxes_cp_id: string;
  language: string;
}

export interface ContentMap {
  pages: Record<string, string>;  // section → page _id
  category_id: string | null;
  post_ids: string[];
  menu_ids: string[];
}
