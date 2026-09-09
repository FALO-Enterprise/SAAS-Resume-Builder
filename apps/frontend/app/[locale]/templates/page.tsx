"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { TemplateCard, FilterKey } from "@/lib/types/resume.types"
import { filters, templates, qualityItems } from "@/lib/placeholder-data/templates.placeholder"
import { PLAN_BADGES } from "@/lib/placeholder-data/plans.placeholder";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import HeroGridBackdrop from "@/components/ui/HeroGridBackdrop";
import { useAuth } from "@/context/AuthContext";

import { toast } from "sonner";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeScale = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

type PlanId = keyof typeof PLAN_BADGES;

const FREE_TEMPLATE_ID = "minimal";

function templatePlans(templateId: string): PlanId[] {
  return templateId === FREE_TEMPLATE_ID ? ["free", "pro"] : ["pro", "enterprise"];
}

function PlanBadges({
  templateId,
  className = "",
}: {
  templateId: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {templatePlans(templateId).map((plan) => (
        <span
          key={plan}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${PLAN_BADGES[plan]}`}
        >
          {plan}
        </span>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
   const t = useTranslations('templatesPage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resumeId')?.trim() || '';
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const isFreeUser = user?.planName === 'FREE' || !user?.planName;

  const getPreviewLink = (templateId: string) => {
    if (resumeId) {
      return `/${locale}/resume/preview?resumeId=${encodeURIComponent(resumeId)}&template=${templateId}`;
    }
    return `/${locale}/resume/preview?template=${templateId}`;
  };

  // Hero copy rises in on a stagger; the offset collapses under reduced motion
  // so the same sequence still plays as a plain fade.
  const heroGroup = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.09,
        delayChildren: 0.05,
      },
    },
  };

  const heroLine = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease },
    },
  };

  const heroStats: [string, string][] = [
    ['6+', t('stats.templates')],
    ['100%', t('stats.responsive')],
    ['RTL', t('stats.languages')],
  ];

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCard | null>(null);
  const [upgradeModalTemplate, setUpgradeModalTemplate] = useState<TemplateCard | null>(null);
  // The dialog panel, so the focus trap knows what "inside" means.
  const previewPanelRef = useRef<HTMLDivElement>(null);

  const handleTemplateClick = (templateId: string, templateCard: TemplateCard, e: React.MouseEvent) => {
    if (isFreeUser && templateId !== FREE_TEMPLATE_ID) {
      e.preventDefault();
      setUpgradeModalTemplate(templateCard);
      // One dialog at a time: the upgrade prompt takes over from the preview,
      // so focus is never trapped inside a panel that is no longer the subject.
      setPreviewTemplate(null);
      toast.error(`The ${t(`templates.${templateCard.id}.title`)} template is reserved for Pro & Enterprise members.`);
    }
  };

  const visibleTemplates = useMemo(() => {
    if (activeFilter === 'all') return templates;
    return templates.filter((template) => template.category === activeFilter);
  }, [activeFilter]);

  const closePreview = useCallback(() => {
    setPreviewTemplate(null);
  }, []);

  const openPreview = (template: TemplateCard) => {
    setPreviewTemplate(template);
  };

  useEffect(() => {
    if (!previewTemplate) return;

    const trigger = document.activeElement as HTMLElement | null;

    const focusable = () => {
      const panel = previewPanelRef.current;
      if (!panel) return [] as HTMLElement[];

      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          element.offsetWidth > 0 ||
          element.offsetHeight > 0 ||
          element.getClientRects().length > 0,
      );
    };

    focusable()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreview();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const panel = previewPanelRef.current;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      // Restore on close intent, not on exit-animation completion — otherwise
      // focus falls through to <body> during the fade out.
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [previewTemplate, closePreview]);


  return (
    <main className="min-h-screen overflow-x-hidden bg-base text-primary">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-[min(90svh,940px)] flex-col items-center justify-center overflow-hidden px-6 pb-32 pt-32 md:pb-36 lg:pt-36">
        <HeroGridBackdrop />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroGroup}
          className="relative z-10 mx-auto w-full max-w-4xl text-center"
        >
          <motion.div
            variants={heroLine}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              {t("labels.studio")}
            </span>
          </motion.div>

          <motion.h1
            variants={heroLine}
            className="text-balance font-playfair text-[clamp(2.35rem,7vw,4.6rem)] font-black leading-[1.03] tracking-[-0.045em] text-primary"
          >
            {t("hero.title")}
            <span className="mt-2 block bg-linear-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
              {t("hero.badge")}
            </span>
          </motion.h1>

          <motion.p
            variants={heroLine}
            className="mx-auto mt-6 max-w-2xl text-pretty text-[15px] leading-7 text-secondary sm:text-[17px] sm:leading-8"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            variants={heroLine}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="#templates-grid"
                className="group flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-extrabold text-ink shadow-[0_18px_50px_-18px_rgba(245,166,35,0.85)] transition-all duration-200 hover:bg-gold-light hover:shadow-[0_0_36px_rgba(245,166,35,0.45)] sm:w-auto"
              >
                {t("actions.useTemplate")}
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                />
              </Link>
            </motion.div>

            <motion.span
              whileHover={{ y: -2 }}
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full border border-edge bg-card px-7 py-4 text-sm font-semibold text-secondary backdrop-blur-xl sm:w-auto"
            >
              <ShieldCheck size={16} className="text-gold" />
              {t("labels.ats")}
            </motion.span>
          </motion.div>

          <motion.div variants={heroLine} className="mt-12 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-7 gap-y-5 rounded-3xl border border-edge bg-card px-6 py-5 backdrop-blur-xl sm:gap-x-0 sm:px-8">
              {heroStats.map(([number, label], index) => (
                <div key={label} className="flex items-center">
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="hidden h-9 w-px bg-edge sm:mx-8 sm:block"
                    />
                  )}

                  <div className="text-center">
                    <div className="font-playfair text-3xl font-black text-primary">
                      {number}
                    </div>
                    <div className="mt-1 text-xs font-medium tracking-wide text-secondary sm:text-sm">
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Filters */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease }}
        className="mx-auto max-w-7xl px-5 py-10 lg:px-6"
      >
        <div className="mx-auto flex max-w-4xl snap-x snap-mandatory items-center gap-3 overflow-x-auto scroll-smooth rounded-3xl border border-edge bg-card/70 p-3 backdrop-blur-md [-ms-overflow-style:none] scrollbar-none md:flex-wrap md:justify-center [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <motion.button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative h-10 shrink-0 snap-center rounded-full border px-5 text-[11px] font-extrabold uppercase tracking-[0.12em] transition ${isActive
                    ? "border-gold bg-gold text-ink shadow-xl"
                    : "border-edge bg-elevated text-secondary hover:border-edge-strong hover:bg-card-hover hover:text-primary"
                  }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeFilter"
                    className="absolute inset-0 rounded-full bg-gold"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                )}

                <span className="relative z-10">{t(`filters.${filter}`)}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Templates Grid */}
      <section
        id="templates-grid"
        className="mx-auto max-w-7xl overflow-visible px-5 pb-24 pt-4 lg:px-6"
      >
        <motion.div
          layout
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth py-6 [-ms-overflow-style:none] scrollbar-none md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:py-6 xl:grid-cols-3 [&::-webkit-scrollbar]:hidden"
        >
          <AnimatePresence mode="popLayout">
            {visibleTemplates.map((template, index) => {
              const Icon = template.icon;

              return (
                <motion.article
                  layout
                  key={template.id}
                  variants={fadeScale}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: 18, scale: 0.94 }}
                  transition={{
                    duration: 0.42,
                    delay: index * 0.035,
                    ease,
                    layout: { type: "spring", stiffness: 260, damping: 26 },
                  }}
                  whileHover={{ y: -6 }}
                  className="group relative flex min-w-[82vw] snap-center flex-col overflow-hidden rounded-3xl border border-edge bg-elevated shadow-[0_1px_2px_var(--shadow-color),0_10px_30px_-14px_var(--shadow-color)] transition-[box-shadow,border-color] duration-300 hover:border-edge-strong hover:shadow-[0_2px_6px_var(--shadow-color),0_26px_60px_-18px_var(--shadow-color)] sm:min-w-100 md:min-w-0"
                >
                  {/* Gold hairline picks out the card on hover — the same
                      device the old featured hero card used. */}
                  <div className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-linear-to-r from-transparent via-gold/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Preview: the page floats on a lit mat. Two layers, not
                      three — the sheet carries its own edge and shadow, and is
                      held at exact A4 so those edges are the real page edges.
                      Full page, never cropped: a resume's signature is its
                      structure (sidebar vs columns), which only reads whole. */}
                  <div className="relative flex aspect-3/4 items-center justify-center overflow-hidden border-b border-edge bg-card p-4">
                    <div
                      className={`absolute inset-0 bg-linear-to-br ${template.accent}`}
                    />

                    <PlanBadges
                      templateId={template.id}
                      className="absolute right-4 top-4 z-20"
                    />

                    <div className="relative aspect-210/297 h-full overflow-hidden rounded-lg ring-1 ring-black/10 shadow-[0_18px_45px_-12px_var(--shadow-color)] transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                      <Image
                        src={template.image}
                        alt={t(`templates.${template.id}.title`)}
                        fill
                        priority={index < 3}
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 74vw, (max-width: 1280px) 42vw, 28vw"
                      />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">
                      {t(`templates.${template.id}.tag`)}
                    </p>

                    <h2 className="mt-2 font-playfair text-[1.6rem] font-black leading-tight tracking-[-0.03em] text-primary">
                      <Link
                        href={getPreviewLink(template.id)}
                        onClick={(e) => handleTemplateClick(template.id, template, e)}
                        className="rounded-3xl outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-gold"
                      >
                        {t(`templates.${template.id}.title`)}
                      </Link>
                    </h2>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-secondary">
                      {t(`templates.${template.id}.description`)}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-edge pt-5">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon size={15} className="shrink-0 text-gold" />
                        <span className="truncate text-[11px] font-extrabold uppercase tracking-[0.14em] text-secondary">
                          {t(`templates.${template.id}.field`)}
                        </span>
                      </div>

                      <div className="relative z-10 flex shrink-0 items-center gap-2">
                        <motion.button
                          type="button"
                          onClick={() => openPreview(template)}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-card text-secondary transition hover:border-edge-strong hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                          aria-label={t("labels.preview")}
                        >
                          <Eye size={17} />
                        </motion.button>

                        <motion.div
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <Link
                            href={getPreviewLink(template.id)}
                            onClick={(e) => handleTemplateClick(template.id, template, e)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gold px-4 py-2.5 text-[12px] font-extrabold leading-none text-ink transition hover:bg-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-elevated sm:text-sm"
                          >
                            <span>{t("actions.useTemplate")}</span>
                            <ArrowRight
                              size={16}
                              className="shrink-0 rtl:rotate-180"
                            />
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Quality Section */}
      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-6">
        <div className="relative overflow-hidden rounded-4xl border border-edge bg-card p-8 md:p-10 lg:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-azure/10 blur-3xl" />

          <div className="relative z-10 grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-edge bg-elevated px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-secondary">
                <Sparkles size={14} className="text-gold" />
                {t("quality.badge")}
              </span>

              <h2 className="max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] text-primary sm:text-4xl">
                {t("quality.title")}
              </h2>

              <p className="mt-4 max-w-xl text-lg leading-7 text-secondary">
                {t("quality.subtitle")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {qualityItems.map(({ key, icon: Icon }) => (
                <motion.div
                  key={key}
                  whileHover={{ y: -5, scale: 1.012 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  className="rounded-3xl border border-edge bg-elevated p-5 transition-colors hover:border-edge-strong"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.45 }}
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold"
                  >
                    <Icon size={22} />
                  </motion.div>

                  <h3 className="text-lg font-black tracking-[-0.02em] text-primary">
                    {t(`quality.items.${key}.title`)}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-secondary">
                    {t(`quality.items.${key}.description`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Preview Modal — information rail beside the document. No zoom: the
          sheet is rendered large enough to read outright, which is what the
          zoom UI was compensating for. */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
          >
            <motion.div
              ref={previewPanelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-title"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 20 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease }}
              onClick={(event) => event.stopPropagation()}
              className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-edge bg-elevated shadow-[0_30px_120px_rgba(0,0,0,0.55)] lg:grid lg:h-[min(88vh,880px)] lg:max-h-none lg:grid-cols-[22rem_minmax(0,1fr)]"
            >
              {/* Close floats over the document. With the CTA moved into the
                  rail there is no header strip left to seat it in. */}
              <motion.button
                type="button"
                onClick={closePreview}
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                className="absolute inset-e-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-elevated/85 text-secondary backdrop-blur-md transition hover:border-edge-strong hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                aria-label={t('labels.close')}
              >
                <X size={18} />
              </motion.button>

              <div className="order-2 flex min-h-0 flex-1 flex-col overflow-y-auto p-6 lg:order-1 lg:h-full lg:flex-none lg:border-e lg:border-edge lg:p-8">
                <div className="flex items-center gap-2">
                  <previewTemplate.icon size={15} className="shrink-0 text-gold" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-secondary">
                    {t(`filters.${previewTemplate.category}`)}
                  </span>
                </div>

                <h3
                  id="preview-title"
                  className="mt-3 font-playfair text-3xl font-black leading-tight tracking-[-0.03em] text-primary"
                >
                  {t(`templates.${previewTemplate.id}.title`)}
                </h3>

                <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold">
                  {t(`templates.${previewTemplate.id}.tag`)}
                </p>

                <PlanBadges templateId={previewTemplate.id} className="mt-4" />

                <p className="mt-5 text-sm leading-6 text-secondary">
                  {t(`templates.${previewTemplate.id}.description`)}
                </p>

                <Link
                  href={getPreviewLink(previewTemplate.id)}
                  onClick={(e) => handleTemplateClick(previewTemplate.id, previewTemplate, e)}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-extrabold text-ink shadow-[0_14px_36px_-14px_rgba(245,166,35,0.9)] transition hover:bg-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-elevated"
                >
                  <span>{t("actions.useTemplate")}</span>
                  <ArrowRight size={16} className="shrink-0 rtl:rotate-180" />
                </Link>

                <div className="mt-7 border-t border-edge pt-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-faint">
                    {t('quality.badge')}
                  </p>

                  <ul className="mt-4 space-y-3">
                    {qualityItems.map(({ key, icon: QualityIcon }) => (
                      <li key={key} className="flex items-start gap-2.5">
                        <QualityIcon size={15} className="mt-0.5 shrink-0 text-gold" />
                        <span className="text-[13px] leading-5 text-secondary">
                          {t(`quality.items.${key}.title`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="order-1 flex h-[42vh] shrink-0 items-center justify-center overflow-hidden bg-card p-5 lg:order-2 lg:h-full lg:p-8">
                <Image
                  src={previewTemplate.image}
                  alt={t(`templates.${previewTemplate.id}.title`)}
                  width={2382}
                  height={3369}
                  unoptimized
                  priority
                  draggable={false}
                  className="h-auto max-h-full w-auto max-w-full rounded-lg object-contain shadow-[0_24px_60px_-18px_var(--shadow-color)] ring-1 ring-black/10"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {upgradeModalTemplate && (
          <motion.div
            className="fixed inset-0 z-110 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUpgradeModalTemplate(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-gold/30 bg-elevated p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                  <Lock size={22} />
                </div>
                <button
                  type="button"
                  onClick={() => setUpgradeModalTemplate(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-card text-secondary hover:text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="mt-4 text-xl font-black text-primary">
                Pro Template Reserved
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-secondary">
                The <strong className="text-primary">{t(`templates.${upgradeModalTemplate.id}.title`)}</strong> template is reserved exclusively for <strong className="text-gold">Pro</strong> &amp; <strong className="text-vilot">Enterprise</strong> plan members.
              </p>

              <div className="mt-4 rounded-2xl border border-edge bg-card p-3 text-xs text-secondary">
                ⚡ Free plan users are allowed to build and export with the <strong className="text-primary">Classic ATS</strong> template.
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href={`/${locale}/pricing`}
                  onClick={() => setUpgradeModalTemplate(null)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-extrabold text-ink shadow-lg transition hover:bg-gold-light"
                >
                  <Sparkles size={16} />
                  <span>Upgrade to Pro</span>
                </Link>

                <Link
                  href={getPreviewLink(FREE_TEMPLATE_ID)}
                  onClick={() => setUpgradeModalTemplate(null)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-edge bg-card px-5 py-3 text-sm font-bold text-secondary transition hover:bg-card-hover hover:text-primary"
                >
                  <span>Use Classic ATS Template</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 

      <Footer />
    </main>
  );
}
