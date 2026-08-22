import { authors, posts } from "@/lib/placeholder-data/blog.placeholder";
import type {
  BlogAuthor,
  BlogAuthorId,
  BlogAuthorProfile,
  BlogPostMeta,
  BlogSection,
} from "@/lib/types/blog.types";

/** Route segment the blog lives at, under the locale prefix. */
export const BLOG_ROUTE = "blog";

/** Path to the index, or to a single article when a slug is given. */
export function blogHref(locale: string, slug?: string): string {
  return slug
    ? `/${locale}/${BLOG_ROUTE}/${slug}`
    : `/${locale}/${BLOG_ROUTE}`;
}

/* ── Post lookup ──────────────────────────────────────────────────────── */

/** Newest first. The placeholder array is authored in no particular order, so
 *  every surface sorts through here rather than trusting the file. */
export function sortedPosts(): BlogPostMeta[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function findPost(slug: string): BlogPostMeta | undefined {
  return posts.find((post) => post.slug === slug);
}

function findAuthor(id: BlogAuthorId) {
  return authors.find((author) => author.id === id);
}

/**
 * Posts to show under an article: same category first, then the next newest,
 * never the article itself. Falling back to recency means the rail is always
 * full even for a category with a single post in it.
 */
export function relatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const current = findPost(slug);
  if (!current) return sortedPosts().slice(0, limit);

  const others = sortedPosts().filter((post) => post.slug !== slug);
  const sameCategory = others.filter((p) => p.category === current.category);
  const rest = others.filter((p) => p.category !== current.category);

  return [...sameCategory, ...rest].slice(0, limit);
}

/* ── Derived display values ───────────────────────────────────────────── */

/**
 * Reading speed, in words per minute.
 *
 * English career prose sits comfortably at the low end of the 200–250 wpm band
 * publishers use for non-fiction. Arabic is given a slower constant: the script
 * is denser per word and a shared constant would systematically under-promise
 * on one locale and over-promise on the other.
 */
const WORDS_PER_MINUTE: Record<string, number> = { en: 225, ar: 180 };

/** Strips the inline markup tags so word counts measure prose, not syntax. */
function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function sectionToText(section: BlogSection): string {
  const blocks = section.blocks.map((block) => {
    switch (block.type) {
      case "paragraph":
      case "subheading":
        return block.text;
      case "quote":
        return `${block.text} ${block.attribution ?? ""}`;
      case "list":
        return block.items.join(" ");
      case "takeaways":
        return `${block.title} ${block.items.join(" ")}`;
      case "callout":
        return `${block.title} ${block.text}`;
    }
  });

  return [section.title, ...blocks].join(" ");
}

/** Whole minutes, never zero — a very short post still costs a reader a minute. */
export function estimateReadingMinutes(
  sections: BlogSection[],
  locale: string,
): number {
  const words = stripTags(sections.map(sectionToText).join(" "))
    .split(/\s+/)
    .filter(Boolean).length;

  const wpm = WORDS_PER_MINUTE[locale] ?? WORDS_PER_MINUTE.en;
  return Math.max(1, Math.round(words / wpm));
}

/**
 * Two initials from a display name, taken from the translated name so they
 * transliterate with the rest of the locale rather than staying Latin in
 * Arabic. Falls back to a single glyph for mononyms.
 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = [...parts[0]][0] ?? "";
  const last = parts.length > 1 ? ([...parts[parts.length - 1]][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Joins the placeholder half of an author with the translated half. */
export function resolveAuthor(
  id: BlogAuthorId,
  profile: BlogAuthorProfile,
): BlogAuthor {
  return {
    id,
    accent: findAuthor(id)?.accent ?? "from-gold/30 to-gold-dark/20",
    name: profile.name,
    role: profile.role,
    initials: initialsOf(profile.name),
  };
}

/** Locale-aware date, matching the formatting the legal pages use. */
export function formatPostDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));
}
