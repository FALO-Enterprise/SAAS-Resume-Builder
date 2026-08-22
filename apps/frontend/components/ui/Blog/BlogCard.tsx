"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import BlogCover from "./BlogCover";
import { blogHref, formatPostDate } from "@/lib/blog";
import type { BlogPostCard } from "@/lib/types/blog.types";

const ease = [0.16, 1, 0.3, 1] as const;

export default function BlogCard({
  post,
  locale,
  categoryLabel,
  readingLabel,
  index = 0,
}: {
  post: BlogPostCard;
  locale: string;
  categoryLabel: string;
  readingLabel: string;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      // Capped so a full grid entering at once never staggers past ~0.4s.
      transition={{ duration: 0.45, ease, delay: Math.min(index, 5) * 0.06 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-edge bg-elevated transition-colors duration-300 hover:border-gold/30"
    >
      <div className="relative aspect-video overflow-hidden">
        <BlogCover
          icon={post.icon}
          accent={post.accent}
          image={post.image}
          title={post.title}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className="mb-3 inline-flex w-fit items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
          {categoryLabel}
        </span>

        <h3 className="mb-2.5 font-playfair text-[20px] font-bold leading-snug text-primary">
          <Link
            href={blogHref(locale, post.slug)}
            className="no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-gold"
          >
            <span className="line-clamp-2">{post.title}</span>
          </Link>
        </h3>

        <p className="mb-6 line-clamp-2 text-[14.5px] leading-[1.7] text-secondary">
          {post.excerpt}
        </p>

        {/* Pushed to the bottom so cards with shorter excerpts still align. */}
        <div className="mt-auto flex items-center gap-3 border-t border-edge pt-4">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[11px] font-bold text-primary ${post.resolvedAuthor.accent}`}
            aria-hidden
          >
            {post.resolvedAuthor.initials}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-primary">
              {post.resolvedAuthor.name}
            </p>
            <p className="truncate text-[11.5px] text-muted">
              {/* Dates carry digits, which stay LTR inside Arabic prose. */}
              <span dir="ltr">{formatPostDate(post.publishedAt, locale)}</span>
            </p>
          </div>

          <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-muted">
            <Clock size={12} />
            {readingLabel}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
