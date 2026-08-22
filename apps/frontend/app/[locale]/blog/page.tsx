import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import SectionLabel from "@/components/ui/SectionLabel";
import { routing } from "@/i18n/routing";
import {
  BLOG_ROUTE,
  estimateReadingMinutes,
  resolveAuthor,
  sortedPosts,
} from "@/lib/blog";
import type {
  BlogAuthorId,
  BlogAuthorProfile,
  BlogPostCard,
  BlogPostContent,
} from "@/lib/types/blog.types";
import BlogBrowser from "@/components/ui//Blog/BlogBrowser";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const title = `${t("title")} — ResuMax`;
  const description = t("subtitle");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${BLOG_ROUTE}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/${BLOG_ROUTE}`]),
      ),
    },
    openGraph: { title, description, type: "website" },
  };
}

export default async function BlogPage({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const content = t.raw("posts") as Record<string, BlogPostContent>;
  const profiles = t.raw("authors") as Record<BlogAuthorId, BlogAuthorProfile>;

  const cards: BlogPostCard[] = sortedPosts().map((meta) => {
    const post = content[meta.slug];
    return {
      ...meta,
      title: post.title,
      excerpt: post.excerpt,
      resolvedAuthor: resolveAuthor(meta.author, profiles[meta.author]),
      readingMinutes: estimateReadingMinutes(post.sections, locale),
    };
  });

  const featured = cards.find((card) => card.featured) ?? null;

  return (
    <main className="relative min-h-screen">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden pt-32 pb-10">
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <SectionLabel text={t("eyebrow")} color="gold" />

          <h1 className="mt-5 font-playfair text-4xl font-black leading-tight text-primary lg:text-5xl">
            {t("title")}
          </h1>

          <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.75] text-secondary">
            {t("subtitle")}
          </p>
        </div>
      </header>

      {/* ── Featured + filters + grid ──────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-6 pb-24">
        <BlogBrowser posts={cards} featured={featured} />
      </div>

      <Footer />
    </main>
  );
}
