"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Code2,
  Eye,
  Globe2,
  GraduationCap,
  Languages,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

type FilterKey =
  | "all"
  | "professional"
  | "creative"
  | "technical"
  | "minimalist";

type TemplateId =
  | "executive"
  | "developer"
  | "director"
  | "minimal"
  | "academic"
  | "global";

type TemplateCard = {
  id: TemplateId;
  image: string;
  category: Exclude<FilterKey, "all">;
  icon: LucideIcon;
  accent: string;
};

const filters: FilterKey[] = [
  "all",
  "professional",
  "creative",
  "technical",
  "minimalist",
];

const templates: TemplateCard[] = [
  {
    id: "executive",
    image: "https://i.imgur.com/oPsyIDT.png",
    category: "professional",
    icon: Briefcase,
    accent: "from-gold/20 via-card-hover to-base",
  },
  {
    id: "developer",
    image: "https://i.imgur.com/UFjkAoq.png",
    category: "technical",
    icon: Code2,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "director",
    image: "https://i.imgur.com/bIVtQW4.png",
    category: "creative",
    icon: Palette,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "minimal",
    image: "https://i.imgur.com/KnsEIYe.png",
    category: "minimalist",
    icon: Sparkles,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "academic",
    image: "https://i.imgur.com/cL8Rls0.png",
    category: "professional",
    icon: GraduationCap,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "global",
    image: "https://i.imgur.com/uaye0sJ.png",
    category: "technical",
    icon: Languages,
    accent: "from-gold/15 via-card-hover to-base",
  },
];

const qualityItems = [
  { key: "ats", icon: ShieldCheck },
  { key: "global", icon: Globe2 },
  { key: "rtl", icon: CheckCircle2 },
  { key: "support", icon: Sparkles },
] as const;

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

const MIN_ZOOM = 60;
const MAX_ZOOM = 220;
const ZOOM_STEP = 20;
const DEFAULT_ZOOM = 90;

function RatingStars() {
  return (
    <div className="flex items-center gap-1 text-gold">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={13} fill="currentColor" />
      ))}
    </div>
  );
}

function getTouchDistance(touches: TouchList) {
  const firstTouch = touches[0];
  const secondTouch = touches[1];

  if (!firstTouch || !secondTouch) return 0;

  return Math.hypot(
    secondTouch.clientX - firstTouch.clientX,
    secondTouch.clientY - firstTouch.clientY,
  );
}

export default function TemplatesPage() {
   const t = useTranslations('templatesPage');
  const locale = useLocale();
 
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCard | null>(null);
  const [previewZoom, setPreviewZoom] = useState(DEFAULT_ZOOM);
 
  // Mirror of previewZoom readable inside native (non-React) event listeners.
  const zoomRef = useRef(previewZoom);
  
  useEffect(() => {
    zoomRef.current = previewZoom;
  }, [previewZoom]);
 
  // The scrollable preview surface that receives native pinch listeners.
  const previewSurfaceRef = useRef<HTMLDivElement>(null);
 
  const visibleTemplates = useMemo(() => {
    if (activeFilter === 'all') return templates;
    return templates.filter((template) => template.category === activeFilter);
  }, [activeFilter]);
 
  const [featuredTemplate] = templates;
 
  const closePreview = useCallback(() => {
    setPreviewTemplate(null);
    setPreviewZoom(DEFAULT_ZOOM);
  }, []);
 
  const openPreview = (template: TemplateCard) => {
    setPreviewTemplate(template);
    setPreviewZoom(DEFAULT_ZOOM);
  };
 
  const zoomIn = () => {
    setPreviewZoom((value) => Math.min(value + ZOOM_STEP, MAX_ZOOM));
  };
 
  const zoomOut = () => {
    setPreviewZoom((value) => Math.max(value - ZOOM_STEP, MIN_ZOOM));
  };
 
  // Escape-to-close + body scroll lock while the modal is open.
  useEffect(() => {
    if (!previewTemplate) return;
 
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePreview();
    };
 
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
 
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [previewTemplate, closePreview]);
 
  // Native, non-passive pinch-to-zoom so preventDefault() actually suppresses
  // the browser's page zoom. React's synthetic touch listeners are passive.
  useEffect(() => {
    const element = previewSurfaceRef.current;
    if (!previewTemplate || !element) return;
 
    let startDistance: number | null = null;
    let startZoom = zoomRef.current;
 
    const onTouchStart = (event: globalThis.TouchEvent) => {
      if (event.touches.length !== 2) return;
      startDistance = getTouchDistance(event.touches);
      startZoom = zoomRef.current;
    };
 
    const onTouchMove = (event: globalThis.TouchEvent) => {
      if (event.touches.length !== 2 || startDistance == null) return;
      event.preventDefault();
 
      const scale = getTouchDistance(event.touches) / startDistance;
      const nextZoom = Math.round((startZoom * scale) / 5) * 5;
      setPreviewZoom(Math.min(Math.max(nextZoom, MIN_ZOOM), MAX_ZOOM));
    };
 
    const onTouchEnd = () => {
      startDistance = null;
    };
 
    element.addEventListener('touchstart', onTouchStart, { passive: false });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchcancel', onTouchEnd);
 
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [previewTemplate]);
 

  return (
    <main className="min-h-screen overflow-x-hidden bg-base text-primary">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-ink via-soft to-ink" />
        <div className="absolute left-1/4 top-16 h-80 w-80 rounded-full bg-gold/10 blur-[110px]" />
        <div className="absolute bottom-24 right-1/4 h-80 w-80 rounded-full bg-azure/10 blur-[110px]" />
        <div className="absolute left-1/2 top-1/2 h-105 w-105 -translate-x-1/2 -translate-y-1/2 rounded-full bg-vilot/5 blur-[120px]" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-32 lg:grid-cols-[1.08fr_0.92fr] lg:pb-20 lg:pt-36">
          <div className="text-center lg:text-start">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              <span className="text-xs font-bold uppercase tracking-widest text-gold">
                {t("labels.studio")}
              </span>
            </div>

            <h1 className="font-playfair text-4xl font-black leading-[1.06] tracking-[-0.045em] text-primary md:text-5xl lg:text-6xl">
              {t("hero.title")}
              <br />
              <span className="bg-linear-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                {t("hero.badge")}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-primary leading-7 lg:mx-0">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link
                  href="#templates-grid"
                  className="group flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-ink transition-all duration-200 hover:bg-gold-light hover:shadow-xl"
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
                className="flex items-center justify-center gap-2 rounded-full border border-edge bg-card px-6 py-3 text-sm font-semibold text-secondary backdrop-blur-xl"
              >
                <ShieldCheck size={16} className="text-gold" />
                {t("labels.ats")}
              </motion.span>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-8 lg:justify-start">
              {[
                ["6+", t("stats.templates")],
                ["100%", t("stats.responsive")],
                ["RTL", t("stats.languages")],
              ].map(([number, label]) => (
                <div key={label} className="text-center lg:text-start">
                  <div className="font-playfair text-3xl font-black text-primary">
                    {number}
                  </div>
                  <div className="mt-1 text-sm font-medium tracking-wide text-secondary">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Card */}
          <motion.div
            initial={{ opacity: 0, x: 38, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.15, ease }}
            className="relative mx-auto w-full max-w-[288px] sm:max-w-76.25 lg:max-w-79.5"
          >
            <div className="absolute -inset-5 rounded-4xl bg-linear-to-br from-gold/25 via-azure/10 to-transparent blur-3xl" />

            <motion.div
              animate={{ y: [0, -5, 0] }}
              whileHover={{ y: -9, scale: 1.012 }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-[1.55rem] border border-edge bg-elevated text-primary shadow-2xl"
            >
              <div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent" />

              <div className="border-b border-edge bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[9px] font-bold uppercase tracking-[0.22em] text-secondary">
                      {t("labels.trusted")}
                    </p>

                    <h2 className="mt-1 truncate text-primary font-black tracking-[-0.03em]">
                      {t(`templates.${featuredTemplate.id}.title`)}
                    </h2>
                  </div>

                  <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold text-gold">
                    {t("labels.premium")}
                  </span>
                </div>
              </div>

              <div className="relative aspect-210/297 overflow-hidden bg-card p-2.5">
                <div className="absolute inset-0 bg-linear-to-br from-gold/15 via-card-hover to-base" />

                <div className="pointer-events-none absolute left-4 top-4 h-16 w-16 rounded-full border border-gold/20" />
                <div className="pointer-events-none absolute bottom-5 right-5 h-14 w-14 rounded-2xl border border-gold/20" />

                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative h-full overflow-hidden rounded-2xl border border-edge bg-card p-2 shadow-inner"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-elevated p-3">
                    <div className="relative h-full w-full">
                      <Image
                        src={featuredTemplate.image}
                        alt={t(`templates.${featuredTemplate.id}.title`)}
                        fill
                        priority
                        unoptimized
                        className="object-contain object-center drop-shadow-2xl"
                        sizes="(max-width: 1024px) 100vw, 318px"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 4, 0], x: [0, -2, 0] }}
                  whileHover={{ scale: 1.06 }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute bottom-5 left-5 rounded-2xl border border-edge bg-elevated/80 px-3 py-2 text-primary shadow-xl backdrop-blur-xl"
                >
                  <div className="text-[10px] text-secondary">
                    {t("labels.atsScore")}
                  </div>
                  <div className="mt-0.5 text-xl font-black text-gold">98%</div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
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
                  whileHover={{ y: -6, scale: 1.006 }}
                  className="group min-w-[82vw] snap-center overflow-hidden rounded-[1.75rem] border border-edge bg-elevated shadow-xl transition-colors duration-300 hover:border-edge-strong sm:min-w-100 md:min-w-0"
                >
                  <div className="relative border-b border-edge bg-card">
                    <div
                      className={`absolute inset-0 bg-linear-to-br ${template.accent}`}
                    />

                    <div className="relative aspect-4/5 w-full overflow-hidden p-4">
                      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-edge bg-elevated/80 px-2.5 py-1.5 text-[11px] font-extrabold text-primary shadow-sm backdrop-blur-md">
                        <Icon size={14} className="text-gold" />
                        {t("labels.rank", { number: index + 1 })}
                      </div>

                      <div className="absolute right-4 top-4 z-10 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gold backdrop-blur-md">
                        {t(`templates.${template.id}.tag`)}
                      </div>

                      <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] border border-edge bg-card p-3 shadow-inner">
                        <motion.div
                          whileHover={{ scale: 1.018 }}
                          transition={{ duration: 0.35 }}
                          className="relative h-full w-full overflow-hidden rounded-xl bg-elevated p-5"
                        >
                          <div className="relative h-full w-full">
                            <Image
                              src={template.image}
                              alt={t(`templates.${template.id}.title`)}
                              fill
                              priority={template.id === "executive"}
                              unoptimized
                              className="object-contain object-center drop-shadow-2xl"
                              sizes="(max-width: 768px) 82vw, (max-width: 1280px) 50vw, 33vw"
                            />
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-black tracking-[-0.04em] text-primary">
                      {t(`templates.${template.id}.title`)}
                    </h2>

                    <p className="mt-3 min-h-18 text-sm leading-6 text-secondary">
                      {t(`templates.${template.id}.description`)}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-edge pt-5">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                          {t(`templates.${template.id}.field`)}
                        </p>

                        <div className="mt-2">
                          <RatingStars />
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <motion.button
                          type="button"
                          onClick={() => openPreview(template)}
                          whileHover={{ scale: 1.08, rotate: 2 }}
                          whileTap={{ scale: 0.92 }}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-card text-secondary transition hover:border-edge-strong hover:text-primary"
                          aria-label={t("labels.preview")}
                        >
                          <Eye size={17} />
                        </motion.button>

                        <motion.div
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <Link
                            href={`/${locale}/Dashboard?template=${template.id}`}
                            className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gold px-4 py-2.5 text-[12px] font-extrabold leading-none text-ink transition hover:bg-gold-light sm:text-sm"
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

      {/* Preview Modal */}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-title"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.25, ease }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-edge bg-elevated p-3 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:p-4"
            >
              <div className="mb-3 flex flex-row flex-wrap items-center justify-between gap-3 sm:mb-4">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-secondary">
                    {t('labels.preview')}
                  </p>

                  <h3
                    id="preview-title"
                    className="mt-1 truncate text-xl font-black tracking-[-0.03em] text-primary"
                  >
                    {t(`templates.${previewTemplate.id}.title`)}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-full border border-edge bg-card px-2 py-1.5 sm:flex">
                    <motion.button
                      type="button"
                      onClick={zoomOut}
                      disabled={previewZoom <= MIN_ZOOM}
                      whileHover={{ scale: previewZoom <= MIN_ZOOM ? 1 : 1.08 }}
                      whileTap={{ scale: previewZoom <= MIN_ZOOM ? 1 : 0.92 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition hover:bg-card-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t('labels.zoomOut')}
                    >
                      <ZoomOut size={17} />
                    </motion.button>
 
                    <input
                      type="range"
                      min={MIN_ZOOM}
                      max={MAX_ZOOM}
                      step={ZOOM_STEP}
                      value={previewZoom}
                      onChange={(event) => setPreviewZoom(Number(event.target.value))}
                      className="h-1 w-24 cursor-pointer accent-gold sm:w-32"
                      aria-label={t('labels.zoomControl')}
                    />
 
                    <span className="min-w-12 text-center text-xs font-extrabold text-primary">
                      {previewZoom}%
                    </span>
 
                    <motion.button
                      type="button"
                      onClick={zoomIn}
                      disabled={previewZoom >= MAX_ZOOM}
                      whileHover={{ scale: previewZoom >= MAX_ZOOM ? 1 : 1.08 }}
                      whileTap={{ scale: previewZoom >= MAX_ZOOM ? 1 : 0.92 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition hover:bg-card-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t('labels.zoomIn')}
                    >
                      <ZoomIn size={17} />
                    </motion.button>
                  </div>
 
                  <motion.button
                    type="button"
                    onClick={closePreview}
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-card text-secondary transition hover:border-edge-strong hover:text-primary"
                    aria-label={t('labels.close')}
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>
 
              <div
                ref={previewSurfaceRef}
                className="min-h-0 flex-1 overflow-auto rounded-2xl border border-paper-edge bg-paper p-4 overscroll-contain"
              >
                <div
                  className="mx-auto transition-[width,max-width] duration-200"
                  style={{
                    width: `${previewZoom}%`,
                    maxWidth: `${previewZoom * 5.3}px`,
                  }}
                >
                  <Image
                    src={previewTemplate.image}
                    alt={t(`templates.${previewTemplate.id}.title`)}
                    width={1060}
                    height={1320}
                    unoptimized
                    className="h-auto w-full rounded-xl object-contain shadow-[0_20px_50px_rgba(62,45,23,0.20)]"
                    priority
                    draggable={false}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 

      <Footer />
    </main>
  );
}
