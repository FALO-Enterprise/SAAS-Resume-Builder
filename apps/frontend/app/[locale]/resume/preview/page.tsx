"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, TouchEvent as ReactTouchEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserAvatarMenu from "@/components/ui/UserAvatarMenu";

import {
  exportResume,
  getResumePreviewData,
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

const RESUME_PURPOSES: ResumePurpose[] = [
  "job",
  "internship",
  "scholarship",
  "academic",
  "promotion",
  "government",
  "general",
];

const EXPORT_FORMATS: ResumeExportFormat[] = ["pdf", "jpg"];

const PURPOSE_TRANSLATION_KEYS: Record<
  ResumePurpose,
  | "purposes.job"
  | "purposes.internship"
  | "purposes.scholarship"
  | "purposes.academic"
  | "purposes.promotion"
  | "purposes.government"
  | "purposes.general"
> = {
  job: "purposes.job",
  internship: "purposes.internship",
  scholarship: "purposes.scholarship",
  academic: "purposes.academic",
  promotion: "purposes.promotion",
  government: "purposes.government",
  general: "purposes.general",
};

const FORMAT_TRANSLATION_KEYS: Record<
  ResumeExportFormat,
  "formats.pdf" | "formats.jpg"
> = {
  pdf: "formats.pdf",
  jpg: "formats.jpg",
};

const UPGRADE_BENEFIT_KEYS = [
  "benefits.unlimitedExports",
  "benefits.premiumTemplates",
  "benefits.moreOptions",
] as const;

type PreviewImageStatus = "loading" | "loaded" | "error";

type MobilePreviewOffset = {
  x: number;
  y: number;
};

type MobileGestureState = {
  mode: "idle" | "pan" | "pinch";
  startDistance: number;
  startScale: number;
  startTouchX: number;
  startTouchY: number;
  startOffsetX: number;
  startOffsetY: number;
};

const MIN_MOBILE_ZOOM = 1;
const MAX_MOBILE_ZOOM = 3;

export default function ResumePreviewPage() {
  const locale = useLocale();
  const t = useTranslations("resumePreview");

  const configuration = useTranslations("resumePreview.configuration");

  const isRTL = locale === "ar";

  const upgrade = useTranslations("resumePreview.configuration.upgrade");

  const purposeMenuRef = useRef<HTMLDivElement | null>(null);

  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const mobileExportMenuRef = useRef<HTMLDivElement | null>(null);

  const mobilePreviewViewportRef = useRef<HTMLDivElement | null>(null);

  const mobilePreviewImageRef = useRef<HTMLImageElement | null>(null);

  const mobileGestureRef = useRef<MobileGestureState>({
    mode: "idle",
    startDistance: 0,
    startScale: MIN_MOBILE_ZOOM,
    startTouchX: 0,
    startTouchY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  const [resumeData, setResumeData] = useState<ResumePreviewData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [pageError, setPageError] = useState<string | null>(null);

  const [draftPurpose, setDraftPurpose] = useState<ResumePurpose>("scholarship");

  const [isPurposeMenuOpen, setIsPurposeMenuOpen] = useState(false);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const [imageStatus, setImageStatus] = useState<PreviewImageStatus>("loading");

  const [imageReloadKey, setImageReloadKey] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedExportFormat, setSelectedExportFormat] =
    useState<ResumeExportFormat>("pdf");

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const [exportingFormat, setExportingFormat] =  useState<ResumeExportFormat | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [mobileZoom, setMobileZoom] = useState(MIN_MOBILE_ZOOM);

  const [mobileOffset, setMobileOffset] = useState<MobilePreviewOffset>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadResumePreview() {
      try {
        setIsLoading(true);
        setPageError(null);
        setImageStatus("loading");

        const searchParams = new URLSearchParams(window.location.search);

        const resumeId = searchParams.get("resumeId")?.trim() || "resume-123";

        const data = await getResumePreviewData(resumeId, controller.signal);

        setResumeData(data);
        setDraftPurpose(data.purpose);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setPageError(
          loadError instanceof Error
            ? loadError.message
            : t("status.errorText"),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadResumePreview();

    return () => {
      controller.abort();
    };
  }, [t]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const clickedInsidePurposeMenu = purposeMenuRef.current?.contains(target);

      if (!clickedInsidePurposeMenu) {
        setIsPurposeMenuOpen(false);
      }

      const clickedInsideExportMenu =
        exportMenuRef.current?.contains(target) ||
        mobileExportMenuRef.current?.contains(target);

      if (!clickedInsideExportMenu) {
        setIsExportMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPurposeMenuOpen(false);
        setIsExportMenuOpen(false);
        setIsMobileSidebarOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 768px)");

    const handleDesktopLayout = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    desktopMediaQuery.addEventListener("change", handleDesktopLayout);

    return () => {
      desktopMediaQuery.removeEventListener("change", handleDesktopLayout);
    };
  }, []);

  const handleZoomChange = (value: number) => {
    setZoom(Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM));
  };

  const handleZoomIn = () => {
    handleZoomChange(zoom + ZOOM_STEP);
  };

  const handleZoomOut = () => {
    handleZoomChange(zoom - ZOOM_STEP);
  };

  const handleResetZoom = () => {
    setZoom(DEFAULT_ZOOM);
  };

  const resetMobilePreview = () => {
    mobileGestureRef.current.mode = "idle";
    setMobileZoom(MIN_MOBILE_ZOOM);
    setMobileOffset({ x: 0, y: 0 });
  };

  const clampMobileOffset = (
    x: number,
    y: number,
    scale: number,
  ): MobilePreviewOffset => {
    const viewport = mobilePreviewViewportRef.current;
    const image = mobilePreviewImageRef.current;

    if (!viewport || !image || scale <= MIN_MOBILE_ZOOM) {
      return { x: 0, y: 0 };
    }

    const scaledWidth = image.offsetWidth * scale;
    const scaledHeight = image.offsetHeight * scale;

    const maxX = Math.max(0, (scaledWidth - viewport.clientWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - viewport.clientHeight) / 2);

    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY),
    };
  };

  const getTouchDistance = (event: ReactTouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    const secondTouch = event.touches[1];

    return Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
  };

  const handleMobileTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      mobileGestureRef.current = {
        mode: "pinch",
        startDistance: getTouchDistance(event),
        startScale: mobileZoom,
        startTouchX: 0,
        startTouchY: 0,
        startOffsetX: mobileOffset.x,
        startOffsetY: mobileOffset.y,
      };

      return;
    }

    if (event.touches.length === 1 && mobileZoom > MIN_MOBILE_ZOOM) {
      const touch = event.touches[0];

      mobileGestureRef.current = {
        mode: "pan",
        startDistance: 0,
        startScale: mobileZoom,
        startTouchX: touch.clientX,
        startTouchY: touch.clientY,
        startOffsetX: mobileOffset.x,
        startOffsetY: mobileOffset.y,
      };
    }
  };

  const handleMobileTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const gesture = mobileGestureRef.current;

    if (event.touches.length === 2 && gesture.mode === "pinch") {
      event.preventDefault();

      const distance = getTouchDistance(event);
      const nextScale = Math.min(
        Math.max(
          gesture.startScale * (distance / gesture.startDistance),
          MIN_MOBILE_ZOOM,
        ),
        MAX_MOBILE_ZOOM,
      );

      setMobileZoom(nextScale);
      setMobileOffset(
        clampMobileOffset(
          gesture.startOffsetX,
          gesture.startOffsetY,
          nextScale,
        ),
      );

      return;
    }

    if (
      event.touches.length === 1 &&
      gesture.mode === "pan" &&
      mobileZoom > MIN_MOBILE_ZOOM
    ) {
      event.preventDefault();

      const touch = event.touches[0];
      const nextX = gesture.startOffsetX + touch.clientX - gesture.startTouchX;
      const nextY = gesture.startOffsetY + touch.clientY - gesture.startTouchY;

      setMobileOffset(clampMobileOffset(nextX, nextY, mobileZoom));
    }
  };

  const handleMobileTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1 && mobileZoom > MIN_MOBILE_ZOOM) {
      const touch = event.touches[0];

      mobileGestureRef.current = {
        mode: "pan",
        startDistance: 0,
        startScale: mobileZoom,
        startTouchX: touch.clientX,
        startTouchY: touch.clientY,
        startOffsetX: mobileOffset.x,
        startOffsetY: mobileOffset.y,
      };

      return;
    }

    mobileGestureRef.current.mode = "idle";

    if (mobileZoom <= MIN_MOBILE_ZOOM) {
      resetMobilePreview();
    }
  };

  const handleImageLoad = () => {
    setImageStatus("loaded");
  };

  const handleImageError = () => {
    setImageStatus("error");
  };

  const handleRetryImage = () => {
    setImageStatus("loading");

    setImageReloadKey((currentKey) => currentKey + 1);
  };

  const handleRetryPage = () => {
    window.location.reload();
  };

  const handlePurposeSelection = (purpose: ResumePurpose) => {
    setDraftPurpose(purpose);
    setIsPurposeMenuOpen(false);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleExportFormatSelection = (format: ResumeExportFormat) => {
    setSelectedExportFormat(format);
    setIsExportMenuOpen(false);
    setActionError(null);
  };

  const handleGenerate = async () => {
    if (!resumeData || isGenerating) {
      return;
    }

    try {
      setIsGenerating(true);
      setActionError(null);
      setActionSuccess(null);
      setIsPurposeMenuOpen(false);
      setIsExportMenuOpen(false);

      await wait(900);

      setResumeData((currentData) => {
        if (!currentData) {
          return currentData;
        }

        return {
          ...currentData,
          purpose: draftPurpose,
          pdfDownloadUrl: null,
          jpgDownloadUrl: null,
          updatedAt: new Date().toISOString(),
        };
      });

      setImageStatus("loading");

      setImageReloadKey((currentKey) => currentKey + 1);

      setActionSuccess(configuration("generatedSuccessfully"));
    } catch {
      setActionError(configuration("generateError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerDownload = (downloadUrl: string) => {
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.download = "";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleExport = async () => {
    if (!resumeData || exportingFormat || isGenerating) {
      return;
    }

    setIsExportMenuOpen(false);

    if (draftPurpose !== resumeData.purpose) {
      setActionError(configuration("generateError"));

      return;
    }

    const existingDownloadUrl =
      selectedExportFormat === "pdf"
        ? resumeData.pdfDownloadUrl
        : resumeData.jpgDownloadUrl;

    setActionError(null);
    setActionSuccess(null);

    if (existingDownloadUrl) {
      triggerDownload(existingDownloadUrl);
      return;
    }

    if (resumeData.creditsRemaining <= 0) {
      return;
    }

    try {
      setExportingFormat(selectedExportFormat);

      const result = await exportResume(
        resumeData.resumeId,
        selectedExportFormat,
      );

      setResumeData((currentData) => {
        if (!currentData) {
          return currentData;
        }

        return {
          ...currentData,

          pdfDownloadUrl:
            selectedExportFormat === "pdf"
              ? result.downloadUrl
              : currentData.pdfDownloadUrl,

          jpgDownloadUrl:
            selectedExportFormat === "jpg"
              ? result.downloadUrl
              : currentData.jpgDownloadUrl,

          creditsRemaining: result.creditsRemaining,

          creditsTotal: result.creditsTotal,
        };
      });

      triggerDownload(result.downloadUrl);
    } catch (exportError) {
      setActionError(
        exportError instanceof Error
          ? exportError.message
          : t("status.errorText"),
      );
    } finally {
      setExportingFormat(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 text-primary">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-edge border-t-gold" />

          <h1 className="mt-5 text-base font-bold">
            {t("status.loadingTitle")}
          </h1>

          <p className="mt-2 text-sm text-secondary">
            {t("status.loadingText")}
          </p>
        </div>
      </main>
    );
  }

  if (pageError || !resumeData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 text-primary">
        <div className="w-full max-w-md rounded-3xl border border-edge bg-elevated p-7 text-center shadow-[0_24px_80px_var(--shadow-color)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
            <FileText size={26} className="text-gold" />
          </div>

          <h1 className="mt-5 text-lg font-bold text-primary">
            {t("status.errorTitle")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-secondary">
            {pageError || t("status.errorText")}
          </p>

          <button
            type="button"
            onClick={handleRetryPage}
            className="mt-6 min-h-11 rounded-xl bg-gold px-6 text-sm font-bold text-ink transition-opacity hover:opacity-90"
          >
            {t("status.retry")}
          </button>
        </div>
      </main>
    );
  }

  const selectedTemplate = resumeData.selectedTemplate;

  const isPurposeChanged = draftPurpose !== resumeData.purpose;

  const hasCredits = resumeData.creditsRemaining > 0;

  const exportUrl =
    selectedExportFormat === "pdf"
      ? resumeData.pdfDownloadUrl
      : resumeData.jpgDownloadUrl;

  const isExporting = exportingFormat !== null;

  const isImageLoading = imageStatus === "loading";

  const isImageLoaded = imageStatus === "loaded";

  const hasImageError = imageStatus === "error";

  const generateButtonText = isPurposeChanged
    ? configuration("generate")
    : configuration("regenerate");

  const updatedAt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(resumeData.updatedAt));

  const templatesPageUrl = `/${locale}/templates?resumeId=${encodeURIComponent(
    resumeData.resumeId,
  )}`;

  const retrySeparator = selectedTemplate.previewImageUrl.includes("?")
    ? "&"
    : "?";

  const previewImageUrl =
    imageReloadKey > 0
      ? `${selectedTemplate.previewImageUrl}${retrySeparator}reload=${imageReloadKey}`
      : selectedTemplate.previewImageUrl;

  return (
    <main className="min-h-screen bg-base text-primary">
      <header className="sticky top-0 z-50 border-b border-edge bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link href={`/${locale}`} className="shrink-0 no-underline">
              <Logo />
            </Link>

            <div className="hidden h-6 w-px bg-edge sm:block" />

            <Link
              href={`/${locale}/dashboard`}
              className="hidden min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-secondary no-underline transition-colors hover:text-gold sm:flex"
            >
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />

              {t("backToDashboard")}
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      <div className="pointer-events-none fixed inset-s-[5%] top-[12%] h-80 w-80 rounded-full bg-gold/5 blur-[120px]" />

      <div className="pointer-events-none fixed bottom-[8%] inset-e-[5%] h-80 w-80 rounded-full bg-azure/5 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid items-start gap-3 md:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          {isMobileSidebarOpen && (
            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                setIsPurposeMenuOpen(false);
                setIsExportMenuOpen(false);
              }}
              aria-label={configuration("preview")}
              className="fixed inset-0 z-60 bg-black/55 backdrop-blur-[2px] md:hidden"
            />
          )}

          <aside
            id="mobile-preview-sidebar"
            className={`fixed inset-y-0 z-70 flex w-[min(90vw,390px)] flex-col border-edge bg-base shadow-[0_0_80px_rgba(0,0,0,0.38)] transition-transform duration-300 ease-out md:contents md:w-auto md:translate-x-0 md:border-0 md:bg-transparent md:shadow-none ${isRTL ? "right-0 border-l" : "left-0 border-r"
              } ${isMobileSidebarOpen
                ? "pointer-events-auto translate-x-0"
                : isRTL
                  ? "pointer-events-none translate-x-full md:pointer-events-auto"
                  : "pointer-events-none -translate-x-full md:pointer-events-auto"
              } xl:sticky xl:top-22 xl:right-auto xl:bottom-auto xl:left-auto xl:flex xl:min-w-0 xl:flex-col xl:gap-5 xl:self-start`}
          >
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-edge bg-elevated px-4 md:hidden">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                  <Settings size={18} className="text-gold" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-primary">
                    {resumeData.resumeName}
                  </p>

                  <p className="mt-0.5 text-[11px] text-secondary">
                    {configuration("lastUpdated")}: {updatedAt}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  setIsPurposeMenuOpen(false);
                  setIsExportMenuOpen(false);
                }}
                aria-label={configuration("preview")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card text-primary transition-colors hover:border-gold/40 hover:bg-soft hover:text-gold"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-3.5 md:contents">
              {/* Resume information and export inside the mobile sidebar */}
              <section className="relative overflow-visible rounded-[20px] border border-edge bg-elevated shadow-[0_12px_35px_var(--shadow-color)] md:hidden">
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                      <FileText size={18} className="text-gold" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-primary">
                        {resumeData.resumeName}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-secondary">
                        {configuration("lastUpdated")}: {updatedAt}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-green/20 bg-green/10 px-2 py-1 text-[10px] font-bold text-green">
                      <CheckCircle2 size={12} />
                      <span className="hidden min-[360px]:inline">
                        {configuration("ready")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-edge pt-3">
                    <label className="mb-1.5 block text-[11px] font-bold text-secondary">
                      {configuration("exportAs")}
                    </label>

                    <div className="flex gap-2">
                      <div
                        ref={mobileExportMenuRef}
                        className="relative min-w-0 flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isExporting || isGenerating) {
                              return;
                            }

                            setIsExportMenuOpen(
                              (currentState) => !currentState,
                            );
                            setIsPurposeMenuOpen(false);
                          }}
                          disabled={isExporting || isGenerating}
                          aria-haspopup="listbox"
                          aria-expanded={isExportMenuOpen}
                          className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-edge bg-card px-3 text-sm font-black uppercase text-primary outline-none transition-all hover:border-gold/50 hover:bg-soft focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>
                            {configuration(
                              FORMAT_TRANSLATION_KEYS[selectedExportFormat],
                            )}
                          </span>

                          <ChevronDown
                            size={14}
                            className={[
                              "shrink-0 text-secondary transition-transform",
                              isExportMenuOpen ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </button>

                        {isExportMenuOpen && (
                          <div
                            role="listbox"
                            aria-label={configuration("exportAs")}
                            className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-edge bg-elevated p-1.5 shadow-[0_20px_55px_rgba(0,0,0,0.24)]"
                          >
                            {EXPORT_FORMATS.map((format) => {
                              const isSelected =
                                selectedExportFormat === format;

                              return (
                                <button
                                  key={format}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    handleExportFormatSelection(format);
                                  }}
                                  className={[
                                    "flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-start text-sm font-bold uppercase transition-colors",
                                    isSelected
                                      ? "bg-gold/15 text-gold"
                                      : "text-primary hover:bg-soft",
                                  ].join(" ")}
                                >
                                  <span>
                                    {configuration(
                                      FORMAT_TRANSLATION_KEYS[format],
                                    )}
                                  </span>

                                  {isSelected && <Check size={14} />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void handleExport();
                        }}
                        disabled={
                          isExporting ||
                          isGenerating ||
                          isPurposeChanged ||
                          (!exportUrl && !hasCredits)
                        }
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-gold px-3 font-bold text-ink shadow-[0_8px_22px_rgba(245,158,11,0.2)] transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                        aria-label={configuration("exportAs")}
                      >
                        {isExporting ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : selectedExportFormat === "pdf" ? (
                          <Download size={16} />
                        ) : (
                          <ImageIcon size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 md:order-1 md:gap-5 xl:order-0">
                {/* Selected template */}
                <section className="rounded-[20px] border border-edge bg-elevated p-4 shadow-[0_12px_35px_var(--shadow-color)] md:rounded-[26px] md:p-5 md:shadow-[0_18px_60px_var(--shadow-color)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                      <LayoutTemplate size={19} className="text-gold" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-secondary">
                        {configuration("selectedTemplate")}
                      </p>

                      <h2 className="mt-1 truncate text-base font-black">
                        {selectedTemplate.name}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-4 rounded-2xl border border-gold/30 bg-gold/10 p-4">
                    <div className="h-26 w-18.5 shrink-0 overflow-hidden rounded-xl border border-edge bg-white shadow-sm">
                      <Image
                        src={selectedTemplate.thumbnailUrl}
                        alt={selectedTemplate.name}
                        width={74}
                        height={96}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-gold">
                        {configuration("currentTemplate")}
                      </p>

                      <p className="mt-2 truncate text-lg font-black text-primary">
                        {selectedTemplate.name}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green">
                        <CheckCircle2 size={14} />

                        {configuration("ready")}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={templatesPageUrl}
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-edge bg-card px-4 text-sm font-bold text-primary no-underline transition-colors hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                  >
                    <LayoutTemplate size={16} />

                    {configuration("changeTemplate")}
                  </Link>
                </section>

                {/* Purpose */}
                <section className="rounded-[20px] border border-edge bg-elevated p-4 shadow-[0_12px_35px_var(--shadow-color)] md:rounded-[26px] md:p-5 md:shadow-[0_18px_60px_var(--shadow-color)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-azure/25 bg-azure/10">
                      <Sparkles size={19} className="text-azure-light" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-secondary">
                        {configuration("purpose")}
                      </p>

                      <h2 className="mt-1 truncate text-sm font-black text-primary">
                        {configuration(PURPOSE_TRANSLATION_KEYS[draftPurpose])}
                      </h2>
                    </div>
                  </div>

                  <div ref={purposeMenuRef} className="relative mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        if (isGenerating) {
                          return;
                        }

                        setIsPurposeMenuOpen((currentState) => !currentState);

                        setIsExportMenuOpen(false);
                      }}
                      disabled={isGenerating}
                      aria-haspopup="listbox"
                      aria-expanded={isPurposeMenuOpen}
                      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-edge bg-card px-4 text-start text-sm font-black text-primary shadow-sm outline-none transition-all hover:border-gold/50 hover:bg-soft focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="truncate">
                        {configuration(PURPOSE_TRANSLATION_KEYS[draftPurpose])}
                      </span>

                      <ChevronDown
                        size={17}
                        className={`shrink-0 text-secondary transition-transform ${isPurposeMenuOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {isPurposeMenuOpen && (
                      <div
                        role="listbox"
                        aria-label={configuration("purpose")}
                        className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-edge bg-elevated p-1.5 shadow-[0_20px_55px_rgba(0,0,0,0.22)]"
                      >
                        {RESUME_PURPOSES.map((purpose) => {
                          const isSelected = draftPurpose === purpose;

                          return (
                            <button
                              key={purpose}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                handlePurposeSelection(purpose);
                              }}
                              className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-start text-sm font-bold transition-colors ${isSelected
                                  ? "bg-gold/15 text-gold"
                                  : "text-primary hover:bg-soft"
                                }`}
                            >
                              <span className="truncate">
                                {configuration(
                                  PURPOSE_TRANSLATION_KEYS[purpose],
                                )}
                              </span>

                              {isSelected && (
                                <Check size={15} className="shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {isPurposeChanged && (
                    <p className="mt-3 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-semibold leading-5 text-gold">
                      {configuration("generate")}
                    </p>
                  )}
                </section>

                {/* Desktop upgrade and generate controls */}
                <div className="order-last hidden md:contents md:order-0">
                  <section className="overflow-hidden rounded-[18px] bg-card/50 md:rounded-[26px] md:border md:border-gold/25 md:bg-elevated md:shadow-[0_18px_60px_var(--shadow-color)]">
                    <div className="p-3.5 md:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 md:h-11 md:w-11 md:rounded-2xl">
                          <Sparkles size={18} className="text-gold md:hidden" />
                          <Sparkles
                            size={19}
                            className="hidden text-gold md:block"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-secondary md:text-xs">
                            {upgrade("eyebrow")}
                          </p>

                          <h2 className="mt-1 text-sm font-black text-primary">
                            {resumeData.creditsRemaining > 0
                              ? upgrade("availableTitle")
                              : upgrade("limitTitle")}
                          </h2>

                          <p className="mt-1.5 text-[11px] leading-5 text-secondary md:mt-2 md:text-xs">
                            {resumeData.creditsRemaining > 0
                              ? upgrade("availableDescription", {
                                remaining: resumeData.creditsRemaining,
                              })
                              : upgrade("limitDescription")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 rounded-2xl border border-gold/20 bg-gold/10 p-3 md:mt-4 md:p-4">
                        {UPGRADE_BENEFIT_KEYS.map((benefitKey) => (
                          <div
                            key={benefitKey}
                            className="flex items-start gap-2 text-[11px] font-semibold leading-4 text-primary md:text-xs"
                          >
                            <CheckCircle2
                              size={14}
                              className="mt-px shrink-0 text-green"
                            />

                            <span>{upgrade(benefitKey)}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={`/${locale}/pricing`}
                        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-ink no-underline transition-all hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 md:mt-4 md:min-h-12"
                      >
                        <Sparkles size={16} />
                        {upgrade("button")}
                      </Link>

                      <p className="mt-2.5 text-center text-[10px] leading-4 text-secondary md:mt-3 md:text-[11px] md:leading-5">
                        {upgrade("note")}
                      </p>
                    </div>
                  </section>

                  <div className="my-3 h-px bg-edge md:hidden" />

                  <button
                    type="button"
                    onClick={() => {
                      void handleGenerate();
                    }}
                    disabled={isGenerating}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-black text-ink shadow-[0_12px_32px_rgba(245,158,11,0.22)] transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 md:min-h-14 md:rounded-2xl md:text-base md:shadow-[0_15px_40px_rgba(245,158,11,0.2)]"
                  >
                    {isGenerating ? (
                      <LoaderCircle size={19} className="animate-spin" />
                    ) : (
                      <Sparkles size={19} />
                    )}

                    {isGenerating
                      ? configuration("generating")
                      : generateButtonText}
                  </button>
                </div>

                {/* Generate action stays inside the mobile sidebar */}
                <button
                  type="button"
                  onClick={() => {
                    void handleGenerate();
                  }}
                  disabled={isGenerating}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-black text-ink shadow-[0_12px_32px_rgba(245,158,11,0.22)] transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 md:hidden"
                >
                  {isGenerating ? (
                    <LoaderCircle size={19} className="animate-spin" />
                  ) : (
                    <Sparkles size={19} />
                  )}

                  {isGenerating
                    ? configuration("generating")
                    : generateButtonText}
                </button>

                <div
                  aria-live="polite"
                  className="order-3 space-y-3 md:order-0"
                >
                  {actionSuccess && (
                    <p className="flex items-start gap-2 rounded-xl border border-green/20 bg-green/10 px-3 py-2.5 text-xs leading-5 text-green">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0" />

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
              </div>
            </div>
          </aside>

          {/* Preview */}
          <section className="relative order-1 min-w-0 overflow-hidden rounded-[22px] border border-edge bg-elevated shadow-[0_18px_55px_var(--shadow-color)] sm:rounded-[28px] md:order-2 md:shadow-[0_24px_80px_var(--shadow-color)] xl:order-0">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-edge bg-elevated px-3.5 sm:px-4 md:hidden">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                  <FileText size={18} className="text-gold" />
                </div>

                <div className="min-w-0">
                  <h1 className="font-playfair text-lg font-black text-primary">
                    {configuration("preview")}
                  </h1>

                  <p className="mt-0.5 truncate text-[11px] font-semibold text-secondary">
                    {resumeData.resumeName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(true);
                  setIsPurposeMenuOpen(false);
                  setIsExportMenuOpen(false);
                }}
                aria-controls="mobile-preview-sidebar"
                aria-expanded={isMobileSidebarOpen}
                aria-label={configuration("preview")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold shadow-sm transition-all hover:border-gold/60 hover:bg-gold/20 active:scale-95"
              >
                <Settings size={19} />
              </button>
            </div>

            <div className="hidden border-b border-edge px-5 py-5 sm:px-6 md:block">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gold" />

                    <h1 className="font-playfair text-2xl font-black text-primary sm:text-3xl">
                      {configuration("preview")}
                    </h1>
                  </div>

                  <p className="mt-2 truncate text-sm font-bold text-primary">
                    {resumeData.resumeName}
                  </p>

                  <p className="mt-1 text-xs text-secondary">
                    {configuration("lastUpdated")}: {updatedAt}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  {/* Zoom */}
                  <div className="min-w-62.5">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label
                        htmlFor="resume-zoom"
                        className="text-xs font-bold text-primary"
                      >
                        {configuration("zoom")}
                      </label>

                      <output
                        htmlFor="resume-zoom"
                        className="text-xs font-black text-gold"
                      >
                        {zoom}%
                      </output>
                    </div>

                    <div dir="ltr" className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={zoom <= MIN_ZOOM || !isImageLoaded}
                        aria-label={t("preview.zoomOut")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card text-primary transition-colors hover:border-gold/40 hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40"
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
                        disabled={!isImageLoaded}
                        onChange={(event) => {
                          handleZoomChange(Number(event.target.value));
                        }}
                        className="h-2 min-w-0 flex-1 cursor-pointer accent-gold disabled:cursor-not-allowed disabled:opacity-40"
                      />

                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={zoom >= MAX_ZOOM || !isImageLoaded}
                        aria-label={t("preview.zoomIn")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card text-primary transition-colors hover:border-gold/40 hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={handleResetZoom}
                        disabled={zoom === DEFAULT_ZOOM || !isImageLoaded}
                        aria-label={t("preview.resetZoom")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card text-primary transition-colors hover:border-gold/40 hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Export */}
                  <div className="min-w-57.5">
                    <label className="mb-2 block text-xs font-bold text-primary">
                      {configuration("exportAs")}
                    </label>

                    <div className="flex gap-2">
                      <div
                        ref={exportMenuRef}
                        className="relative min-w-0 flex-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isExporting || isGenerating) {
                              return;
                            }

                            setIsExportMenuOpen(
                              (currentState) => !currentState,
                            );

                            setIsPurposeMenuOpen(false);
                          }}
                          disabled={isExporting || isGenerating}
                          aria-haspopup="listbox"
                          aria-expanded={isExportMenuOpen}
                          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-edge bg-card px-3 text-sm font-black uppercase text-primary outline-none transition-all hover:border-gold/50 hover:bg-soft focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>
                            {configuration(
                              FORMAT_TRANSLATION_KEYS[selectedExportFormat],
                            )}
                          </span>

                          <ChevronDown
                            size={15}
                            className={`shrink-0 text-secondary transition-transform ${isExportMenuOpen ? "rotate-180" : ""
                              }`}
                          />
                        </button>

                        {isExportMenuOpen && (
                          <div
                            role="listbox"
                            aria-label={configuration("exportAs")}
                            className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-edge bg-elevated p-1.5 shadow-[0_20px_55px_rgba(0,0,0,0.22)]"
                          >
                            {EXPORT_FORMATS.map((format) => {
                              const isSelected =
                                selectedExportFormat === format;

                              return (
                                <button
                                  key={format}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    handleExportFormatSelection(format);
                                  }}
                                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-start text-sm font-bold uppercase transition-colors ${isSelected
                                      ? "bg-gold/15 text-gold"
                                      : "text-primary hover:bg-soft"
                                    }`}
                                >
                                  <span>
                                    {configuration(
                                      FORMAT_TRANSLATION_KEYS[format],
                                    )}
                                  </span>

                                  {isSelected && <Check size={14} />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void handleExport();
                        }}
                        disabled={
                          isExporting ||
                          isGenerating ||
                          isPurposeChanged ||
                          (!exportUrl && !hasCredits)
                        }
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-gold px-3 font-bold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={configuration("exportAs")}
                      >
                        {isExporting ? (
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

            <div
              ref={mobilePreviewViewportRef}
              onTouchStart={handleMobileTouchStart}
              onTouchMove={handleMobileTouchMove}
              onTouchEnd={handleMobileTouchEnd}
              onTouchCancel={handleMobileTouchEnd}
              onDoubleClick={resetMobilePreview}
              className="relative flex min-h-105 touch-none items-start justify-center overflow-hidden bg-soft p-2.5 sm:min-h-140 sm:p-4 md:h-[calc(100vh-190px)] md:min-h-180 md:touch-auto md:overflow-auto md:p-8"
            >
              {isImageLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-soft">
                  <div className="text-center">
                    <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-edge border-t-gold" />

                    <p className="mt-4 text-sm font-semibold text-secondary">
                      {t("preview.imageLoading")}
                    </p>
                  </div>
                </div>
              )}

              {hasImageError && (
                <div className="absolute inset-0 z-30 flex items-center justify-center px-5">
                  <div className="w-full max-w-sm rounded-3xl border border-edge bg-elevated p-7 text-center shadow-[0_20px_70px_var(--shadow-color)]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                      <ImageIcon size={26} className="text-gold" />
                    </div>

                    <h2 className="mt-5 text-base font-bold">
                      {t("preview.imageErrorTitle")}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-secondary">
                      {t("preview.imageErrorText")}
                    </p>

                    <button
                      type="button"
                      onClick={handleRetryImage}
                      className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-ink transition-opacity hover:opacity-90"
                    >
                      <RefreshCw size={16} />

                      {t("preview.retryImage")}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex w-full max-w-190 items-start justify-center md:shrink-0">
                <Image
                  ref={mobilePreviewImageRef}
                  key={imageReloadKey}
                  src={previewImageUrl}
                  width={100}
                  height={133}
                  alt={`${t("preview.imageAlt")} - ${selectedTemplate.name}`}
                  loading="eager"
                  decoding="async"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={
                    {
                      "--mobile-preview-scale": mobileZoom,
                      "--mobile-preview-x": `${mobileOffset.x}px`,
                      "--mobile-preview-y": `${mobileOffset.y}px`,
                      "--desktop-preview-width": `${zoom}%`,
                    } as CSSProperties
                  }
                  className={`h-auto w-full max-w-full shrink-0 origin-center translate-x-(--mobile-preview-x) translate-y-(--mobile-preview-y) scale-(--mobile-preview-scale) rounded-md border border-edge bg-white object-contain shadow-[0_22px_65px_rgba(0,0,0,0.26)] transition-opacity duration-200 ease-out md:w-(--desktop-preview-width) md:max-w-none md:translate-x-0 md:translate-y-0 md:scale-100 md:shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:transition-[width,opacity] md:duration-300 ${isImageLoaded
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                    }`}
                />
              </div>
            </div>
          </section>

          {/* Upgrade stays visible below the preview on mobile */}
          <section className="order-2 overflow-hidden rounded-[22px] border border-gold/30 bg-elevated shadow-[0_16px_45px_var(--shadow-color)] md:hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                  <Sparkles size={19} className="text-gold" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-secondary">
                    {upgrade("eyebrow")}
                  </p>

                  <h2 className="mt-1 text-sm font-black text-primary">
                    {resumeData.creditsRemaining > 0
                      ? upgrade("availableTitle")
                      : upgrade("limitTitle")}
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-secondary">
                    {resumeData.creditsRemaining > 0
                      ? upgrade("availableDescription", {
                        remaining: resumeData.creditsRemaining,
                      })
                      : upgrade("limitDescription")}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-2xl border border-gold/20 bg-gold/10 p-3.5">
                {UPGRADE_BENEFIT_KEYS.map((benefitKey) => (
                  <div
                    key={benefitKey}
                    className="flex items-start gap-2 text-xs font-semibold leading-5 text-primary"
                  >
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-green"
                    />

                    <span>{upgrade(benefitKey)}</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/${locale}/pricing`}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-ink no-underline shadow-[0_12px_30px_rgba(245,158,11,0.2)] transition-all hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              >
                <Sparkles size={16} />
                {upgrade("button")}
              </Link>

              <p className="mt-3 text-center text-[11px] leading-5 text-secondary">
                {upgrade("note")}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
