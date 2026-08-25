/**
 * Shared types for erxes CMS seeding scripts.
 * Mirrors web/types.ts but adapted to the JSON contracts specified in
 * agents/ecommerce/AGENTS.md Step 5a/5b/5c (one object per language,
 * no top-level translations[] wrapper).
 */

export interface ErxesContext {
  erxes_endpoint: string;
  erxes_app_token: string;
  language: string;
}

export interface SeedPageMeta {
  title?: string;
  description?: string;
  keywords?: string;
}

/** Step 5a contract: one object per language */
export interface SeedPage {
  slug: string;
  lang: string;
  title: string;
  description: string;
  content: string;
  status?: string;
  meta?: SeedPageMeta;
}

/** Step 5b contract: one object per language, no category object */
export interface SeedPost {
  lang: string;
  title: string;
  slug: string;
  description?: string;
  excerpt?: string;
  content: string;
  status?: string;
  publishedDate?: string;
  /**
   * Omitted → post is attached to the shared default "Blog" category
   * (created once, reused on later runs). Explicit `[]` forces
   * uncategorized; explicit IDs pass through verbatim.
   */
  categoryIds?: string[];
}

/** Step 5c contract: nested menu groups */
export interface SeedMenuGroup {
  name: string;
  items: SeedMenuGroupItem[];
}

export interface SeedMenuGroupItem {
  name: string;
  link: string;
  order: number;
  /** Overrides the kind derived from the group name ("header"/"footer") */
  kind?: "header" | "footer";
}

/** Flat shape actually sent to cpCmsAddMenu (derived from the nested input) */
export interface SeedMenuItem {
  label: string;
  url: string;
  order: number;
  kind: "header" | "footer";
}
