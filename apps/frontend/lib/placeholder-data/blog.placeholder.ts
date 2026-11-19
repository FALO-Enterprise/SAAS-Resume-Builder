import type {
  BlogAuthorMeta,
  BlogFilterKey,
  BlogPostMeta,
} from "@/lib/types/blog.types";

export const filters: BlogFilterKey[] = [
  "all",
  "career",
  "ats",
  "templates",
  "interview",
  "product",
];

export const authors: BlogAuthorMeta[] = [
  { id: "lina-haddad", accent: "from-accent/30 to-accent-strong/20" },
  { id: "omar-rashid", accent: "from-accent/30 to-accent/20" },
  { id: "sofia-marchetti", accent: "from-pass/30 to-pass/20" },
];

export const posts: BlogPostMeta[] = [
  {
    slug: "ats-resume-checklist",
    category: "ats",
    author: "sofia-marchetti",
    publishedAt: "2026-07-28",
    featured: true,
    accent: "from-accent/25 via-card-hover to-base",
    icon: "scan-line",
  },
  {
    slug: "summary-that-earns-the-interview",
    category: "career",
    author: "lina-haddad",
    publishedAt: "2026-07-14",
    accent: "from-accent/20 via-card-hover to-base",
    icon: "target",
  },
  {
    slug: "choosing-the-right-template",
    category: "templates",
    author: "omar-rashid",
    publishedAt: "2026-06-30",
    accent: "from-pass/20 via-card-hover to-base",
    icon: "layout-template",
  },
  {
    slug: "questions-hiding-in-your-resume",
    category: "interview",
    author: "sofia-marchetti",
    publishedAt: "2026-06-12",
    accent: "from-accent/20 via-card-hover to-base",
    icon: "messages-square",
  },
  {
    slug: "ai-that-does-not-sound-like-ai",
    category: "product",
    author: "omar-rashid",
    publishedAt: "2026-05-26",
    accent: "from-accent/20 via-card-hover to-base",
    icon: "sparkles",
  },
  {
    slug: "changing-career-without-starting-over",
    category: "career",
    author: "lina-haddad",
    publishedAt: "2026-05-08",
    accent: "from-flag/20 via-card-hover to-base",
    icon: "trending-up",
  },
];
