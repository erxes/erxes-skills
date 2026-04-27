export type SiteType = "business" | "ecommerce" | "tour" | "hotel";
export type Tone = "formal" | "casual" | "modern" | "traditional" | "playful";
export type Language = "mn" | "en" | "zh" | "ru" | "ko" | "ja";

export interface SiteConfig {
  name: string;
  site_type: SiteType;
  language: Language;
  languages: Language[];
  tone: Tone;
  required_sections: string[];
  color_hint?: string | null;
  extra_notes?: string | null;
}

export interface SiteIntent {
  name: string;
  slug: string;
  site_type: SiteType;
  language: Language;
  languages: Language[];
  tone: Tone;
  required_sections: string[];
  erxes_endpoint: string;
  erxes_app_token: string;
  client_portal_id: string;
  erxes_cms_id: string | null;
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

export interface ContentTranslation {
  language: string;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  objectId?: string | null;
  type?: string | null;
  customFieldsData?: unknown | null;
}

export interface SeedPage {
  section: string;
  name: string;
  slug: string;
  description: string;
  content: string;
  translations?: ContentTranslation[];
}

export interface SeedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  translations?: ContentTranslation[];
}

export interface SeedMenuItem {
  label: string;
  url: string;
  order: number;
  kind?: string;
  translations?: ContentTranslation[];
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
  language: string;
}

export interface CmsCreateInput {
  name: string;
  description?: string | null;
  clientPortalId: string;
  language: string;
  languages: string[];
  postUrlField?: string | null;
}

export interface ContentMap {
  pages: Record<string, string>;  // section → page _id
  category_id: string | null;
  post_ids: string[];
  menu_ids: string[];
}
