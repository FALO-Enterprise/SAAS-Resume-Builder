import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Clock } from "lucide-react";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { routing } from "@/i18n/routing";
import {
  BLOG_ROUTE,
  blogHref,
  estimateReadingMinutes,
  findPost,
  formatPostDate,
  relatedPosts,
  resolveAuthor,
} from "@/lib/blog";
import type {
  BlogAuthorId,
  BlogAuthorProfile,
  BlogPostCard,
  BlogPostContent,
} from "@/lib/types/blog.types";
import BlogCard from "@/components/ui/Blog/BlogCard";
import BlogCover from "@/components/ui/Blog/BlogCover";
import BlogBlocks from "@/components/ui/Blog/BlogBlocks";
import BlogShell from "@/components/ui/Blog/BlogShell";

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;

  const meta = findPost(slug);
  if (!meta) return {};

  const t = await getTranslations({ locale, namespace: "blog" });
  const post = t.raw(`posts.${slug}`) as BlogPostContent;

  return {
    title: `${post.title} — ResuMax`,
    description: post.excerpt,
    alternates: {
      canonical: `/${locale}/${BLOG_ROUTE}/${slug}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/${BLOG_ROUTE}/${slug}`]),
      ),
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: meta.publishedAt,
    },
  };
}

/**
 * A single article.
 *
 * The prose column is capped at 68ch — the readable measure for long-form text,
 * and the reason the page is not simply centred in the container.
 */
export default async function BlogPostPage({ params }: Params) {
  const { locale, slug } = await params;

  const meta = findPost(slug);
  if (!meta) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const tArticle = await getTranslations({ locale, namespace: "blog.article" });

  const post = t.raw(`posts.${slug}`) as BlogPostContent;
  const profiles = t.raw("authors") as Record<BlogAuthorId, BlogAuthorProfile>;
  const author = resolveAuthor(meta.author, profiles[meta.author]);

  const readingMinutes = estimateReadingMinutes(post.sections, locale);
  const entries = post.sections.map(({ id, title }) => ({ id, title }));

  const related: BlogPostCard[] = relatedPosts(slug).map((other) => {
    const otherContent = t.raw(`posts.${other.slug}`) as BlogPostContent;
    return {
      ...other,
      title: otherContent.title,
      excerpt: otherContent.excerpt,
      resolvedAuthor: resolveAuthor(other.author, profiles[other.author]),
      readingMinutes: estimateReadingMinutes(otherContent.sections, locale),
    };
  });

  return (
    <main className="relative min-h-screen">
      <Navbar />

      {/* ── Header: metadata above the cover, per editorial convention ──── */}
      <header className="relative overflow-hidden pt-32 pb-10">
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <Link
            href={blogHref(locale)}
            className="mb-8 inline-flex items-center gap-2 text-[13px] font-semibold text-muted no-underline transition-colors hover:text-gold"
          >
            <ArrowLeft size={15} className="rtl:rotate-180" />
            {tArticle("back")}
          </Link>

          <span className="mb-5 inline-flex w-fit items-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
            {t(`categories.${meta.category}`)}
          </span>

          <h1 className="font-playfair text-[32px] font-black leading-[1.2] text-primary sm:text-[42px]">
            {post.title}
          </h1>

          <p className="mt-5 text-[17.5px] leading-[1.75] text-secondary">
            {post.excerpt}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-edge pt-6">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br text-[13px] font-bold text-primary ${author.accent}`}
              aria-hidden
            >
              {author.initials}
            </span>

            <div>
              <p className="text-[13.5px] font-semibold text-primary">
                <span className="text-muted">{tArticle("writtenBy")} </span>
                {author.name}
              </p>
              <p className="text-[12px] text-muted">{author.role}</p>
            </div>

            <span className="ms-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
              {/* Dates and durations carry digits, which stay LTR in Arabic. */}
              <span dir="ltr">{formatPostDate(meta.publishedAt, locale)}</span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {t("readingTime", { minutes: readingMinutes })}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Cover ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto mb-14 max-w-5xl px-6">
        <div className="relative aspect-video overflow-hidden rounded-3xl border border-edge">
          <BlogCover
            icon={meta.icon}
            accent={meta.accent}
            image={meta.image}
            title={post.title}
            size="feature"
          />
        </div>
      </div>

      {/* ── Body, with the TOC / share rail ────────────────────────────── */}
      <BlogShell entries={entries} title={post.title}>
        <article className="max-w-[68ch]">
          {post.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              // Clears the fixed navbar when a TOC entry or deep link jumps here.
              className="scroll-mt-28 pt-10 first:pt-0"
            >
              <h2 className="mb-5 font-playfair text-[26px] font-bold leading-snug text-primary">
                {section.title}
              </h2>
              <BlogBlocks blocks={section.blocks} locale={locale} />
            </section>
          ))}

          <p className="mt-12 border-t border-edge pt-6 text-[12px] text-muted">
            {tArticle("updatedNote")}
          </p>

          {/* ── Closing CTA ──────────────────────────────────────────── */}
          <aside className="glass mt-10 rounded-3xl border border-edge p-7 sm:p-9">
            <h2 className="mb-2.5 font-playfair text-2xl font-bold text-primary">
              {tArticle("ctaTitle")}
            </h2>
            <p className="mb-6 max-w-lg text-[15.5px] leading-[1.75] text-secondary">
              {tArticle("ctaBody")}
            </p>
            <Link
              href={`/${locale}/resume/getstarted`}
              className="inline-flex items-center rounded-full bg-gold px-6 py-3 text-[14px] font-bold text-ink no-underline transition-colors hover:bg-gold-light"
            >
              {tArticle("ctaButton")}
            </Link>
          </aside>
        </article>
      </BlogShell>

      {/* ── Related. Directly after the body, nothing wedged in between ── */}
      {related.length > 0 && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-8 border-t border-edge pt-12">
            <h2 className="font-playfair text-2xl font-bold text-primary">
              {tArticle("relatedTitle")}
            </h2>
            <p className="mt-1.5 text-[14px] text-secondary">
              {tArticle("relatedSubtitle")}
            </p>
          </div>

          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {related.map((other, i) => (
              <BlogCard
                key={other.slug}
                post={other}
                locale={locale}
                index={i}
                categoryLabel={t(`categories.${other.category}`)}
                readingLabel={t("readingTime", {
                  minutes: other.readingMinutes,
                })}
              />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
