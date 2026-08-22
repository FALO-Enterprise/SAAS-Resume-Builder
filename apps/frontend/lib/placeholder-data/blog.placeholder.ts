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
  { id: "lina-haddad", accent: "from-gold/30 to-gold-dark/20" },
  { id: "omar-rashid", accent: "from-azure-light/30 to-azure/20" },
  { id: "sofia-marchetti", accent: "from-teal-light/30 to-teal/20" },
];

export const posts: BlogPostMeta[] = [
  {
    slug: "ats-resume-checklist",
    category: "ats",
    author: "sofia-marchetti",
    publishedAt: "2026-07-28",
    featured: true,
    accent: "from-gold/25 via-card-hover to-base",
    icon: "scan-line",
  },
  {
    slug: "summary-that-earns-the-interview",
    category: "career",
    author: "lina-haddad",
    publishedAt: "2026-07-14",
    accent: "from-azure-light/20 via-card-hover to-base",
    icon: "target",
  },
  {
    slug: "choosing-the-right-template",
    category: "templates",
    author: "omar-rashid",
    publishedAt: "2026-06-30",
    accent: "from-teal-light/20 via-card-hover to-base",
    icon: "layout-template",
  },
  {
    slug: "questions-hiding-in-your-resume",
    category: "interview",
    author: "sofia-marchetti",
    publishedAt: "2026-06-12",
    accent: "from-vilot/20 via-card-hover to-base",
    icon: "messages-square",
  },
  {
    slug: "ai-that-does-not-sound-like-ai",
    category: "product",
    author: "omar-rashid",
    publishedAt: "2026-05-26",
    accent: "from-gold/20 via-card-hover to-base",
    icon: "sparkles",
  },
  {
    slug: "changing-career-without-starting-over",
    category: "career",
    author: "lina-haddad",
    publishedAt: "2026-05-08",
    accent: "from-pink/20 via-card-hover to-base",
    icon: "trending-up",
  },
];
