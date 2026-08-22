"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Search, X } from "lucide-react";
import BlogCard from "./BlogCard";
import BlogCover from "./BlogCover";
import { blogHref, formatPostDate } from "@/lib/blog";
import { filters } from "@/lib/placeholder-data/blog.placeholder";
import type { BlogFilterKey, BlogPostCard } from "@/lib/types/blog.types";

const ease = [0.16, 1, 0.3, 1] as const;

export default function BlogBrowser({
  posts,
  featured,
}: {
  posts: BlogPostCard[];
  featured: BlogPostCard | null;
}) {
  const t = useTranslations("blog");
  const locale = useLocale();

  const [category, setCategory] = useState<BlogFilterKey>("all");
  const [query, setQuery] = useState("");

  const filtering = category !== "all" || query.trim().length > 0;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return posts.filter((post) => {
      if (!filtering && featured && post.slug === featured.slug) return false;
      if (category !== "all" && post.category !== category) return false;
      if (!needle) return true;

      return (
        post.title.toLowerCase().includes(needle) ||
        post.excerpt.toLowerCase().includes(needle) ||
        post.resolvedAuthor.name.toLowerCase().includes(needle)
      );
    });
  }, [posts, featured, category, query, filtering]);

  const reset = () => {
    setCategory("all");
    setQuery("");
  };

  return (
    <>
      {/* ── Featured. Hidden while filtering, so the grid is the whole answer ── */}
      {featured && !filtering && (
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="group relative mb-20 overflow-hidden rounded-[28px] border border-edge bg-elevated transition-colors duration-300 hover:border-gold/30"
        >
          <div className="grid lg:grid-cols-2">
            <div className="relative aspect-video overflow-hidden lg:aspect-auto lg:min-h-88">
              <BlogCover
                icon={featured.icon}
                accent={featured.accent}
                image={featured.image}
                title={featured.title}
                size="feature"
              />
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
                  {t("featuredLabel")}
                </span>
                <span className="inline-flex items-center rounded-full border border-edge px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {t(`categories.${featured.category}`)}
                </span>
              </div>

              <h2 className="mb-4 font-playfair text-[28px] font-black leading-tight text-primary sm:text-[34px]">
                <Link
                  href={blogHref(locale, featured.slug)}
                  className="no-underline transition-colors after:absolute after:inset-0 after:content-[''] hover:text-gold"
                >
                  {featured.title}
                </Link>
              </h2>

              <p className="mb-7 max-w-xl text-[15.5px] leading-[1.75] text-secondary">
                {featured.excerpt}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-[12px] font-bold text-primary ${featured.resolvedAuthor.accent}`}
                  aria-hidden
                >
                  {featured.resolvedAuthor.initials}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-primary">
                    {featured.resolvedAuthor.name}
                  </p>
                  {/* Dates carry digits, which stay LTR inside Arabic prose. */}
                  <p className="text-[12px] text-muted">
                    <span dir="ltr">
                      {formatPostDate(featured.publishedAt, locale)}
                    </span>
                  </p>
                </div>

                <span className="flex items-center gap-1.5 text-[12px] text-muted">
                  <Clock size={13} />
                  {t("readingTime", { minutes: featured.readingMinutes })}
                </span>

                <span className="ms-auto flex items-center gap-1.5 text-[13px] font-bold text-gold">
                  {t("readMore")}
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  />
                </span>
              </div>
            </div>
          </div>
        </motion.article>
      )}

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-primary">
              {t("latestTitle")}
            </h2>
            <p className="mt-1.5 text-[14px] text-secondary">
              {t("latestSubtitle")}
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute top-1/2 inset-s-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              dir="auto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              className="glass w-full rounded-full border border-edge py-2.5 pe-4 ps-11 text-[14px] text-primary outline-none transition-colors focus:border-gold/40"
            />
          </div>
        </div>

        <div
          role="group"
          aria-label={t("filterLabel")}
          className="flex flex-wrap gap-2"
        >
          {filters.map((key) => {
            const active = key === category;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={active}
                className={`relative cursor-pointer rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                  active
                    ? "border-gold/40 text-gold"
                    : "border-edge text-secondary hover:border-edge-strong hover:text-primary"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="blog-filter-pill"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="absolute inset-0 rounded-full bg-gold/10"
                  />
                )}
                <span className="relative">{t(`categories.${key}`)}</span>
              </button>
            );
          })}
        </div>

        {filtering && (
          <p className="mt-5 flex flex-wrap items-center gap-3 text-[13px] text-muted">
            {t("resultCount", { count: visible.length, total: posts.length })}
            <button
              type="button"
              onClick={reset}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-edge px-3 py-1 font-semibold text-secondary transition-colors hover:border-edge-strong hover:text-primary"
            >
              <X size={12} />
              {t("clearFilters")}
            </button>
          </p>
        )}
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      {visible.length > 0 ? (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((post, i) => (
              <BlogCard
                key={post.slug}
                post={post}
                locale={locale}
                index={i}
                categoryLabel={t(`categories.${post.category}`)}
                readingLabel={t("readingTime", { minutes: post.readingMinutes })}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass rounded-3xl border border-edge px-6 py-16 text-center">
          <p className="mb-2 font-playfair text-xl font-bold text-primary">
            {t("noResultsTitle")}
          </p>
          <p className="mx-auto mb-6 max-w-md text-[14.5px] leading-[1.7] text-secondary">
            {t("noResultsBody")}
          </p>
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer rounded-full border border-gold/30 bg-gold/10 px-5 py-2.5 text-[13px] font-bold text-gold transition-colors hover:bg-gold/15"
          >
            {t("clearFilters")}
          </button>
        </div>
      )}
    </>
  );
}
