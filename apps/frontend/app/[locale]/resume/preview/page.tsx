"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileText,
  ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ResumeTemplateId } from "@shared-types/resume";

import { toast } from "sonner";
import { generateCurrentResume } from "@/lib/backend";
import { resolveResumeTemplate } from "@/components/resume/templates/registry";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserAvatarMenu from "@/components/ui/UserAvatarMenu";
import {
  exportResume,
  getResumePreviewData,
  getResumeTemplateMetadata,
  isResumeTemplateId,
  updateCurrentResumeTemplate,
  type ResumeExportFormat,
} from "@/lib/resume-preview-api";
import type {
  ResumePreviewData,
  ResumePurpose,
} from "@/lib/types/resumePreview.types";

const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const ZOOM_STEP = 5;
const DEFAULT_ZOOM = 95;

const SELECTABLE_TEMPLATE_IDS = [
  "minimal",
  "executive",
  "developer",
] as const satisfies readonly ResumeTemplateId[];

const RESUME_PURPOSES: ResumePurpose[] = [
  "job",
  "internship",
  "scholarship",
  "academic",
  "promotion",
  "government",
  "general",
];

const PURPOSE_TRANSLATION_KEYS: Record<ResumePurpose, string> = {
  job: "purposes.job",
  internship: "purposes.internship",
  scholarship: "purposes.scholarship",
  academic: "purposes.academic",
  promotion: "purposes.promotion",
  government: "purposes.government",
  general: "purposes.general",
};

const EXPORT_FORMATS: ResumeExportFormat[] = ["pdf", "jpg"];

const FORMAT_TRANSLATION_KEYS: Record<ResumeExportFormat, string> = {
  pdf: "formats.pdf",
  jpg: "formats.jpg",
};

const TEMPLATE_ACCENTS: Record<
  (typeof SELECTABLE_TEMPLATE_IDS)[number],
  string
> = {
  minimal: "from-slate-100 via-white to-slate-50",
  executive: "from-cyan-950 via-teal-800 to-cyan-700",
  developer: "from-slate-950 via-slate-900 to-rose-950",
};

function triggerDownload(url: string, format: ResumeExportFormat) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `resume.${format}`;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function releaseDownloadUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export default function ResumePreviewPage() {
  const locale = useLocale();
  const t = useTranslations("resumePreview");
  const configuration = useTranslations("resumePreview.configuration");
  const templates = useTranslations("templatesPage");
  const isRTL = locale === "ar";

  const { user } = useAuth();
  const isFreeUser = user?.planName === "FREE" || !user?.planName;

  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [resumeData, setResumeData] = useState<ResumePreviewData | null>(null);
  const [draftTemplateId, setDraftTemplateId] =
    useState<ResumeTemplateId>("minimal");
  const [appliedTemplateId, setAppliedTemplateId] =
    useState<ResumeTemplateId>("minimal");
  const [draftPurpose, setDraftPurpose] = useState<ResumePurpose>("general");
  const [appliedPurpose, setAppliedPurpose] = useState<ResumePurpose>("general");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedExportFormat, setSelectedExportFormat] =
    useState<ResumeExportFormat>("pdf");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [exportingFormat, setExportingFormat] =
    useState<ResumeExportFormat | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      try {
        setIsLoading(true);
        setPageError(null);
        const searchParams = new URLSearchParams(window.location.search);
        const resumeId =
          searchParams.get("resumeId")?.trim() ||
          "resume-123";
        const templateParam = searchParams.get("template")?.trim();
        const data = await getResumePreviewData(resumeId, controller.signal);

        if (controller.signal.aborted) return;

        let activeTemplateId = data.selectedTemplate.id;
        let activeMetadata = data.selectedTemplate;

        if (templateParam && isResumeTemplateId(templateParam)) {
          activeTemplateId = templateParam;
          activeMetadata = getResumeTemplateMetadata(templateParam);
        }

        if (isFreeUser && activeTemplateId !== "minimal") {
          activeTemplateId = "minimal";
          activeMetadata = getResumeTemplateMetadata("minimal");
          setActionError("Free plan users are restricted to the Classic ATS template. Upgrade to Pro to unlock premium templates.");
        } else if (templateParam && isResumeTemplateId(templateParam)) {
          const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;
          if (token) {
            void updateCurrentResumeTemplate(
              data.resumeName,
              templateParam,
              controller.signal,
            ).catch((err) => {
              console.warn("Failed to persist template selection:", err);
            });
          }
        }

        setResumeData({
          ...data,
          selectedTemplate: activeMetadata,
        });
        setDraftTemplateId(activeTemplateId);
        setAppliedTemplateId(activeTemplateId);
        setDraftPurpose(data.purpose);
        setAppliedPurpose(data.purpose);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPageError(
          error instanceof Error ? error.message : t("status.errorText"),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [t]);

  useEffect(() => {
    function closeExportMenu(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(target)
      ) {
        setIsExportMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExportMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeExportMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeExportMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const hasPendingChanges =
    draftTemplateId !== appliedTemplateId || draftPurpose !== appliedPurpose;
  const isBusy = isApplying || exportingFormat !== null;

  const selectTemplate = (templateId: ResumeTemplateId) => {
    if (isBusy) return;
    if (isFreeUser && templateId !== "minimal") {
      const msg = "This template is reserved for Pro & Enterprise members. Upgrade to Pro to use this template.";
      setActionError(msg);
      toast.error(msg);
      return;
    }
    setDraftTemplateId(templateId);
    setActionError(null);
    setActionSuccess(null);
  };

  const handlePurposeSelect = async (newPurpose: ResumePurpose) => {
    if (!resumeData || isBusy) return;
    setDraftPurpose(newPurpose);

    const purposeLabel = configuration(PURPOSE_TRANSLATION_KEYS[newPurpose]);
    const toastId = toast.loading(`Rewriting resume for ${purposeLabel} with Gemini AI...`);

    try {
      setIsApplying(true);
      setActionError(null);
      setActionSuccess(null);
      setIsExportMenuOpen(false);

      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;

      if (token) {
        await generateCurrentResume(token, {
          title: resumeData.resumeName,
          templateId: draftTemplateId,
          purpose: newPurpose,
        });

        const freshData = await getResumePreviewData(resumeData.resumeId);
        releaseDownloadUrl(resumeData.pdfDownloadUrl);
        releaseDownloadUrl(resumeData.jpgDownloadUrl);
        setResumeData(freshData);
        setDraftTemplateId(freshData.selectedTemplate.id);
        setAppliedTemplateId(freshData.selectedTemplate.id);
        setAppliedPurpose(newPurpose);
      } else {
        setAppliedPurpose(newPurpose);
      }

      const successMsg = `Resume rewritten for ${purposeLabel} using Gemini AI!`;
      setActionSuccess(successMsg);
      toast.success(successMsg, { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : configuration("generateError");
      setActionError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      setDraftPurpose(appliedPurpose);
    } finally {
      setIsApplying(false);
    }
  };

  const applyConfiguration = async () => {
    if (!resumeData || isBusy || !hasPendingChanges) return;

    const toastId = toast.loading("Applying changes and re-generating preview...");
    try {
      setIsApplying(true);
      setActionError(null);
      setActionSuccess(null);
      setIsExportMenuOpen(false);

      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;

      if (draftPurpose !== appliedPurpose && token) {
        await generateCurrentResume(token, {
          title: resumeData.resumeName,
          templateId: draftTemplateId,
          purpose: draftPurpose,
        });

        const freshData = await getResumePreviewData(resumeData.resumeId);
        releaseDownloadUrl(resumeData.pdfDownloadUrl);
        releaseDownloadUrl(resumeData.jpgDownloadUrl);
        setResumeData(freshData);
        setDraftTemplateId(freshData.selectedTemplate.id);
        setAppliedTemplateId(freshData.selectedTemplate.id);
        setAppliedPurpose(draftPurpose);
      } else {
        const result = await updateCurrentResumeTemplate(
          resumeData.resumeName,
          draftTemplateId,
        );
        const metadata = getResumeTemplateMetadata(result.templateId);

        releaseDownloadUrl(resumeData.pdfDownloadUrl);
        releaseDownloadUrl(resumeData.jpgDownloadUrl);
        setResumeData((current) =>
          current
            ? {
                ...current,
                selectedTemplate: metadata,
                purpose: draftPurpose,
                pdfDownloadUrl: null,
                jpgDownloadUrl: null,
                updatedAt: result.updatedAt || new Date().toISOString(),
              }
            : current,
        );
        setDraftTemplateId(result.templateId);
        setAppliedTemplateId(result.templateId);
        setAppliedPurpose(draftPurpose);
      }

      const successMsg = configuration("generatedSuccessfully");
      setActionSuccess(successMsg);
      toast.success(successMsg, { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : configuration("generateError");
      setActionError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsApplying(false);
    }
  };

  const handleExport = async () => {
    if (!resumeData || isBusy || hasPendingChanges) return;

    const existingUrl =
      selectedExportFormat === "pdf"
        ? resumeData.pdfDownloadUrl
        : resumeData.jpgDownloadUrl;
    setIsExportMenuOpen(false);
    setActionError(null);
    setActionSuccess(null);

    if (existingUrl) {
      triggerDownload(existingUrl, selectedExportFormat);
      toast.success(`Downloading ${selectedExportFormat.toUpperCase()}...`);
      return;
    }

    if (resumeData.creditsRemaining <= 0 && isFreeUser) {
      const msg = "Free plan users are allowed 1 download attempt. Upgrade to Pro for unlimited exports.";
      setActionError(msg);
      toast.error(msg);
      return;
    }

    const toastId = toast.loading(`Preparing ${selectedExportFormat.toUpperCase()} download...`);
    try {
      const format = selectedExportFormat;
      setExportingFormat(format);
      const result = await exportResume(
        resumeData.resumeId,
        format,
        undefined,
        appliedTemplateId,
        resumeData.customization,
      );

      setResumeData((current) =>
        current
          ? {
              ...current,
              pdfDownloadUrl:
                format === "pdf" ? result.downloadUrl : current.pdfDownloadUrl,
              jpgDownloadUrl:
                format === "jpg" ? result.downloadUrl : current.jpgDownloadUrl,
              creditsRemaining: result.creditsRemaining,
              creditsTotal: result.creditsTotal,
            }
          : current,
      );
      triggerDownload(result.downloadUrl, format);
      const successMsg = configuration("exportedSuccessfully");
      setActionSuccess(successMsg);
      toast.success(successMsg, { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t("status.errorText");
      setActionError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setExportingFormat(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 text-primary">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-gold" size={42} />
          <h1 className="mt-5 text-base font-bold">{t("status.loadingTitle")}</h1>
          <p className="mt-2 text-sm text-secondary">{t("status.loadingText")}</p>
        </div>
      </main>
    );
  }

  if (pageError || !resumeData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 text-primary">
        <div className="w-full max-w-md rounded-3xl border border-edge bg-elevated p-7 text-center shadow-xl">
          <FileText size={28} className="mx-auto text-gold" />
          <h1 className="mt-5 text-lg font-bold">{t("status.errorTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-secondary">
            {pageError || t("status.errorText")}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 min-h-11 rounded-xl bg-gold px-6 text-sm font-bold text-ink"
          >
            {t("status.retry")}
          </button>
        </div>
      </main>
    );
  }

  const selectedMetadata = getResumeTemplateMetadata(draftTemplateId);
  const selectedDefinition =
    resolveResumeTemplate(draftTemplateId) ?? resolveResumeTemplate("minimal");
  const TemplateComponent = selectedDefinition?.component;
  const selectedExportUrl =
    selectedExportFormat === "pdf"
      ? resumeData.pdfDownloadUrl
      : resumeData.jpgDownloadUrl;
  const exportDisabled =
    isBusy ||
    hasPendingChanges ||
    (!selectedExportUrl && resumeData.creditsRemaining <= 0);
  const updatedAt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(resumeData.updatedAt));

  return (
    <main className="min-h-screen bg-base text-primary">
      <header className="sticky top-0 z-50 border-b border-edge bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link href={`/${locale}`} className="shrink-0 no-underline">
              <Logo />
            </Link>
            <div className="hidden h-6 w-px bg-edge sm:block" />
            <Link
              href={`/${locale}/dashboard?template=${draftTemplateId}`}
              className="hidden min-h-11 items-center gap-2 text-sm font-semibold text-secondary no-underline hover:text-gold sm:flex"
            >
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
              {t("backToDashboard")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5 xl:sticky xl:top-22">
          <section className="rounded-[26px] border border-edge bg-elevated p-5 shadow-[0_18px_60px_var(--shadow-color)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                  <LayoutTemplate size={19} className="text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-secondary">
                    {configuration("selectedTemplate")}
                  </p>
                  <h2 className="mt-1 truncate text-base font-black">
                    {selectedMetadata.name}
                  </h2>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-green/30 bg-green/10 px-2.5 py-1 text-[11px] font-bold text-green">
                <Check size={12} />
                <span>{t("template.selected")}</span>
              </span>
            </div>

            {/* Selected Template Preview Card */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-gold/30 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="relative aspect-4/5 w-16 shrink-0 overflow-hidden rounded-xl border border-edge bg-elevated shadow-inner">
                  {selectedMetadata.thumbnailUrl ? (
                    <Image
                      src={selectedMetadata.thumbnailUrl}
                      alt={selectedMetadata.name}
                      fill
                      unoptimized
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gold/10 text-gold">
                      <LayoutTemplate size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      selectedMetadata.id === 'minimal'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    }`}>
                      {selectedMetadata.id === 'minimal' ? 'Plan: Free & Pro' : 'Plan: Pro & Enterprise'}
                    </span>
                    <span className="text-[11px] font-medium text-secondary">
                      {templates("labels.ats")}
                    </span>
                  </div>
                  <h3 className="mt-1.5 truncate text-sm font-black text-primary">
                    {selectedMetadata.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-secondary">
                    {t("template.subtitle")}
                  </p>
                </div>
              </div>
            </div>

            {/* Change Template Action */}
            <div className="mt-4">
              <Link
                href={`/${locale}/templates`}
                className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-bold text-primary transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
              >
                <Sparkles size={15} className="text-gold" />
                <span>{t("template.changeButton")}</span>
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
            </div>
          </section>

          <section className="rounded-[26px] border border-edge bg-elevated p-5 shadow-[0_18px_60px_var(--shadow-color)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-azure/25 bg-azure/10">
                <Sparkles size={19} className="text-azure-light" />
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary">
                  {configuration("purpose")}
                </p>
                <h2 className="mt-1 text-sm font-black">
                  {configuration(PURPOSE_TRANSLATION_KEYS[draftPurpose])}
                </h2>
              </div>
            </div>
            <select
              value={draftPurpose}
              disabled={isBusy}
              onChange={(event) => {
                void handlePurposeSelect(event.target.value as ResumePurpose);
              }}
              className="mt-5 min-h-12 w-full rounded-xl border border-edge bg-card px-4 text-sm font-bold text-primary outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
              aria-label={configuration("selectPurpose")}
            >
              {RESUME_PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {configuration(PURPOSE_TRANSLATION_KEYS[purpose])}
                </option>
              ))}
            </select>
          </section>

          {hasPendingChanges && (
            <button
              type="button"
              onClick={() => void applyConfiguration()}
              disabled={isBusy}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-base font-black text-ink shadow-[0_15px_40px_rgba(245,158,11,0.2)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55"
            >
              {isApplying ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : (
                <Sparkles size={19} />
              )}
              {isApplying
                ? configuration("generating")
                : configuration("generate")}
            </button>
          )}

          <Link
            href={`/${locale}/dashboard?template=${draftTemplateId}`}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-edge bg-elevated px-5 text-sm font-black text-primary shadow-[0_10px_30px_var(--shadow-color)] transition-all hover:border-gold/40 hover:bg-card hover:text-gold"
          >
            <Pencil size={15} className="text-gold" />
            <span>{t("editResume")}</span>
          </Link>

          <div aria-live="polite" className="space-y-3">
            {hasPendingChanges && !actionError && (
              <p className="rounded-xl border border-gold/25 bg-gold/10 px-3 py-2.5 text-xs leading-5 text-gold">
                {t("template.changeHint")}
              </p>
            )}
            {actionSuccess && (
              <p className="rounded-xl border border-green/20 bg-green/10 px-3 py-2.5 text-xs leading-5 text-green">
                {actionSuccess}
              </p>
            )}
            {actionError && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs leading-5 text-red-400"
              >
                {actionError}
              </p>
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[28px] border border-edge bg-elevated shadow-[0_24px_80px_var(--shadow-color)] xl:sticky xl:top-22 xl:flex xl:h-[calc(100dvh-7rem)] xl:flex-col">
          <div className="shrink-0 border-b border-edge px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gold" />
                  <h1 className="font-playfair text-2xl font-black sm:text-3xl">
                    {configuration("preview")}
                  </h1>
                </div>
                <p className="mt-2 truncate text-sm font-bold">
                  {resumeData.resumeName}
                </p>
                <p className="mt-1 text-xs text-secondary">
                  {configuration("lastUpdated")}: {updatedAt}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-55">
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="resume-zoom" className="text-xs font-bold">
                      {configuration("zoom")}
                    </label>
                    <output htmlFor="resume-zoom" className="text-xs font-black text-gold">
                      {zoom}%
                    </output>
                  </div>
                  <div dir="ltr" className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
                      disabled={zoom <= MIN_ZOOM}
                      aria-label={t("preview.zoomOut")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      id="resume-zoom"
                      type="range"
                      min={MIN_ZOOM}
                      max={MAX_ZOOM}
                      step={ZOOM_STEP}
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="h-2 min-w-0 flex-1 cursor-pointer accent-gold"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
                      disabled={zoom >= MAX_ZOOM}
                      aria-label={t("preview.zoomIn")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(DEFAULT_ZOOM)}
                      disabled={zoom === DEFAULT_ZOOM}
                      aria-label={t("preview.resetZoom")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                <div className="min-w-52">
                  <label className="mb-2 block text-xs font-bold">
                    {configuration("exportAs")}
                  </label>
                  <div className="flex gap-2">
                    <div ref={exportMenuRef} className="relative min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => !isBusy && setIsExportMenuOpen((open) => !open)}
                        disabled={isBusy}
                        aria-haspopup="listbox"
                        aria-expanded={isExportMenuOpen}
                        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-edge bg-card px-3 text-sm font-black uppercase disabled:opacity-50"
                      >
                        {configuration(FORMAT_TRANSLATION_KEYS[selectedExportFormat])}
                        <ChevronDown size={15} />
                      </button>
                      {isExportMenuOpen && (
                        <div
                          role="listbox"
                          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 rounded-xl border border-edge bg-elevated p-1.5 shadow-xl"
                        >
                          {EXPORT_FORMATS.map((format) => (
                            <button
                              key={format}
                              type="button"
                              role="option"
                              aria-selected={selectedExportFormat === format}
                              onClick={() => {
                                setSelectedExportFormat(format);
                                setIsExportMenuOpen(false);
                              }}
                              className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-sm font-bold uppercase hover:bg-soft"
                            >
                              {configuration(FORMAT_TRANSLATION_KEYS[format])}
                              {selectedExportFormat === format && <Check size={14} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleExport()}
                      disabled={exportDisabled}
                      aria-label={configuration("exportAs")}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-gold px-3 text-ink disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {exportingFormat ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : selectedExportFormat === "pdf" ? (
                        <Download size={17} />
                      ) : (
                        <ImageIcon size={17} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-180 flex-1 items-start justify-center overflow-auto bg-soft p-5 sm:p-8 xl:min-h-0">
            {TemplateComponent ? (
              <div
                className="flex w-full shrink-0 justify-center transition-[zoom] duration-200"
                style={{ zoom: zoom / 100 }}
              >
                <TemplateComponent
                  resume={resumeData.content}
                  customization={resumeData.customization}
                />
              </div>
            ) : (
              <div className="m-auto rounded-xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-400">
                {t("status.errorText")}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}