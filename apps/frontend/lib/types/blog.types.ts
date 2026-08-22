export const BLOG_CATEGORY_IDS = [
  "career",
  "ats",
  "templates",
  "interview",
  "product",
] as const;

export type BlogCategoryId = (typeof BLOG_CATEGORY_IDS)[number];

export type BlogFilterKey = "all" | BlogCategoryId;

export const BLOG_AUTHOR_IDS = [
  "lina-haddad",
  "omar-rashid",
  "sofia-marchetti",
] as const;

export type BlogAuthorId = (typeof BLOG_AUTHOR_IDS)[number];

/* ── Article body ─────────────────────────────────────────────────────── */

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "takeaways"; title: string; items: string[] }
  | {
      type: "callout";
      tone: "gold" | "azure" | "teal" | "pink";
      title: string;
      text: string;
    };

export interface BlogSection {
  id: string;
  title: string;
  blocks: BlogBlock[];
}

export interface BlogPostContent {
  title: string;
  excerpt: string;
  sections: BlogSection[];
}

export interface BlogAuthorProfile {
  name: string;
  role: string;
}


export interface BlogPostMeta {
  slug: string;
  category: BlogCategoryId;
  author: BlogAuthorId;
  publishedAt: string;
  featured?: boolean;
  accent: string;
  icon: BlogIcon;
  image?: string;
}

export type BlogIcon =
  | "target"
  | "scan-line"
  | "layout-template"
  | "messages-square"
  | "sparkles"
  | "trending-up";

export interface BlogAuthorMeta {
  id: BlogAuthorId;
  accent: string;
}


export interface BlogAuthor extends BlogAuthorMeta, BlogAuthorProfile {
  initials: string;
}

export interface BlogPost extends BlogPostMeta, BlogPostContent {
  author: BlogAuthorId;
  resolvedAuthor: BlogAuthor;
  readingMinutes: number;
}

export type BlogPostCard = Omit<BlogPost, "sections">;
