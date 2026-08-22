"use client";

import { useId, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Search,
  ChevronDown,
  X,
  Rocket,
  PenLine,
  LayoutTemplate,
  CreditCard,
  UserRound,
  Wrench,
  MessageCircleQuestion,
} from "lucide-react";
import type {
  HelpCategory,
  HelpCategoryId,
  HelpFaq,
  HelpIcon,
} from "@/lib/types/help.types";

const CATEGORY_ICONS: Record<HelpIcon, typeof Rocket> = {
  rocket: Rocket,
  pen: PenLine,
  layout: LayoutTemplate,
  card: CreditCard,
  user: UserRound,
  wrench: Wrench,
};

/** Case- and diacritic-insensitive match, so Arabic search works with or
 *  without harakat and English search ignores capitalisation. */
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ْ]/g, "");
}

/* ── One FAQ row ─────────────────────────────────────────────────────────── */

function FaqRow({ faq }: { faq: HelpFaq }) {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const panelId = `${uid}-panel`;
  const buttonId = `${uid}-button`;

  return (
    <div className="border-b border-edge last:border-none">
      {/* The interactive control is the button inside the heading, not the
          heading itself — the W3C accordion pattern. */}
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent py-5 text-start"
        >
          <span className="text-[15px] font-semibold leading-normal text-primary">
            {faq.question}
          </span>
          {/* A caret, not a plus: it reads as "expands in place" rather than
              "navigates away". */}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 text-faint"
          >
            <ChevronDown size={18} />
          </motion.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            id={panelId}
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="max-w-[62ch] pb-5 text-[14.5px] leading-[1.85] text-secondary">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Category tile ───────────────────────────────────────────────────────── */

function CategoryTile({
  category,
  active,
  onSelect,
}: {
  category: HelpCategory;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = CATEGORY_ICONS[category.icon];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`glass group flex cursor-pointer flex-col items-start rounded-2xl border p-5 text-start transition-all ${
        active
          ? "border-gold/40 bg-gold/6"
          : "border-edge hover:border-gold/25"
      }`}
    >
      <span
        className={`mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
          active
            ? "border-gold/30 bg-gold/15 text-gold"
            : "border-edge bg-card text-faint group-hover:text-gold"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="mb-1 text-[14.5px] font-bold text-primary">
        {category.title}
      </span>
      <span className="text-[13px] leading-[1.6] text-secondary">
        {category.description}
      </span>
    </button>
  );
}

/* ── Browser ─────────────────────────────────────────────────────────────── */

export default function HelpBrowser({
  contactHref,
  contactLabel,
}: {
  contactHref: string;
  contactLabel: string;
}) {
  const t = useTranslations("help");

  // Structured content, read the same way the pricing page reads its FAQ.
  const categories = t.raw("categories") as HelpCategory[];
  const faqs = t.raw("faqs") as HelpFaq[];
  const suggestions = t.raw("suggestions") as string[];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategoryId | null>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());

    return faqs.filter((faq) => {
      if (category && faq.category !== category) return false;
      if (!q) return true;
      return normalize(`${faq.question} ${faq.answer}`).includes(q);
    });
  }, [faqs, query, category]);

  const filtering = Boolean(query.trim() || category);

  const clear = () => {
    setQuery("");
    setCategory(null);
  };

  return (
    <>
      {/* ── Search: the single focal element of the page ─────────────────── */}
      <div className="mx-auto max-w-2xl">
        <div className="glass group flex items-center rounded-2xl border border-edge px-5 transition-all focus-within:border-gold/50 focus-within:shadow-[0_0_0_4px_rgba(245,166,35,0.08)]">
          <Search
            size={19}
            className="shrink-0 text-faint transition-colors group-focus-within:text-gold"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            // Free-text field in a bilingual app: let the browser pick
            // direction from what is actually typed.
            dir="auto"
            className="min-w-0 flex-1 border-none bg-transparent px-4 py-4 text-[15px] text-primary outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clearFilters")}
              className="shrink-0 cursor-pointer rounded-lg p-1 text-faint transition-colors hover:text-primary"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Example queries — they teach people what this search can answer. */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                setCategory(null);
              }}
              className="cursor-pointer rounded-full border border-edge bg-card px-3.5 py-1.5 text-[12.5px] text-secondary transition-colors hover:border-gold/30 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Categories ──────────────────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="help-browse-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="help-browse-heading"
            className="text-[11px] font-bold uppercase tracking-widest text-faint"
          >
            {t("browseTitle")}
          </h2>
          {category && (
            <button
              type="button"
              onClick={() => setCategory(null)}
              className="cursor-pointer text-[12.5px] font-semibold text-gold hover:underline"
            >
              {t("allCategories")}
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <CategoryTile
              key={c.id}
              category={c}
              active={category === c.id}
              onSelect={() => setCategory(category === c.id ? null : c.id)}
            />
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="help-faq-heading">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id="help-faq-heading"
            className="font-playfair text-2xl font-bold text-primary"
          >
            {t("faqTitle")}
          </h2>
          {filtering && (
            <p className="text-[12.5px] text-muted" aria-live="polite">
              {t("resultCount", { count: results.length, total: faqs.length })}
            </p>
          )}
        </div>
        <p className="mb-6 text-[14px] text-secondary">{t("faqSubtitle")}</p>

        {results.length > 0 ? (
          <div className="glass rounded-2xl border border-edge px-5 sm:px-7">
            {results.map((faq) => (
              <FaqRow key={faq.id} faq={faq} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl border border-edge p-10 text-center">
            <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-edge bg-card text-faint">
              <MessageCircleQuestion size={20} />
            </span>
            <p className="mb-1.5 text-[15px] font-bold text-primary">
              {t("noResultsTitle")}
            </p>
            <p className="mx-auto mb-5 max-w-sm text-[13.5px] leading-[1.7] text-secondary">
              {t("noResultsBody")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={clear}
                className="cursor-pointer rounded-xl border border-edge bg-card px-4 py-2 text-[13px] font-semibold text-secondary transition-colors hover:text-primary"
              >
                {t("clearFilters")}
              </button>
              <a
                href={contactHref}
                className="rounded-xl bg-gold px-4 py-2 text-[13px] font-bold text-ink no-underline transition-opacity hover:opacity-90"
              >
                {contactLabel}
              </a>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
