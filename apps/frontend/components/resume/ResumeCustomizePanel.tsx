"use client";

import { type ComponentType, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Type,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeContent,
  type ResumeCustomization,
  type ResumeSectionId,
} from "@shared-types/resume";
import type { ResumeTemplateProps } from "./templates/ProfessionalAtsTemplate";

export const FONT_FAMILIES = [
  {
    id: "arial",
    label: "Arial",
    value: 'Arial, "Liberation Sans", Helvetica, sans-serif',
  },
  {
    id: "times",
    label: "Times New Roman",
    value: '"Times New Roman", Times, serif',
  },
  {
    id: "georgia",
    label: "Georgia",
    value: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "cambria",
    label: "Cambria",
    value: "Cambria, Georgia, serif",
  },
  {
    id: "garamond",
    label: "Garamond",
    value: 'Garamond, "Palatino Linotype", serif',
  },
  {
    id: "calibri",
    label: "Calibri",
    value: 'Calibri, "Gill Sans", sans-serif',
  },
  {
    id: "helvetica",
    label: "Helvetica Neue",
    value: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  {
    id: "roboto",
    label: "Roboto",
    value: 'Roboto, "Segoe UI", sans-serif',
  },
  {
    id: "system",
    label: "System Default",
    value: "system-ui, -apple-system, sans-serif",
  },
] as const;

export type FontFamilyId = (typeof FONT_FAMILIES)[number]["id"];

export function getFontFamilyId(font?: string): FontFamilyId {
  if (!font) return "arial";

  const directMatch = FONT_FAMILIES.find(
    (family) => family.value === font || family.id === font,
  );
  if (directMatch) return directMatch.id;

  const normalizedFont = font.toLowerCase().replace(/['"\s]/g, "");
  const normalizedMatch = FONT_FAMILIES.find((family) => {
    const normalizedValue = family.value.toLowerCase().replace(/['"\s]/g, "");
    const normalizedLabel = family.label.toLowerCase().replace(/['"\s]/g, "");

    return (
      normalizedFont === family.id ||
      normalizedValue === normalizedFont ||
      normalizedFont.includes(family.id) ||
      normalizedLabel === normalizedFont
    );
  });

  return normalizedMatch?.id ?? "arial";
}

const ACCENT_COLORS = [
  { hex: "#0563c1", key: "blue" },
  { hex: "#087682", key: "teal" },
  { hex: "#1e3a8a", key: "navy" },
  { hex: "#0f766e", key: "emerald" },
  { hex: "#7c3aed", key: "violet" },
  { hex: "#c25e2e", key: "copper" },
  { hex: "#d75d68", key: "rose" },
  { hex: "#b45309", key: "amber" },
  { hex: "#374151", key: "slate" },
  { hex: "#000000", key: "black" },
] as const;

const FONT_SCALE_MIN = 0.75;
const FONT_SCALE_MAX = 1.25;
const FONT_SCALE_STEP = 0.05;
const PREVIEW_ZOOM_MIN = 50;
const PREVIEW_ZOOM_MAX = 150;
const PREVIEW_ZOOM_STEP = 5;
const PREVIEW_ZOOM_DEFAULT = 100;
const MIN_MOBILE_ZOOM = 1;
const MAX_MOBILE_ZOOM = 3;

type MobileEditorView = "preview" | "customize";

type PreviewDocumentSize = {
  width: number;
  height: number;
};

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

interface ResumeCustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  customization: ResumeCustomization;
  fontFamily: string;
  onCustomizationChange: (customization: ResumeCustomization) => void;
  onFontFamilyChange: (fontFamily: string) => void;
  onReset?: () => void;
  resumeContent?: ResumeContent;
  TemplateComponent?: ComponentType<ResumeTemplateProps> | null;
  resumeName?: string;
}

export default function ResumeCustomizePanel({
  isOpen,
  onClose,
  customization,
  fontFamily,
  onCustomizationChange,
  onFontFamilyChange,
  onReset,
  resumeContent,
  TemplateComponent,
  resumeName,
}: ResumeCustomizePanelProps) {
  const t = useTranslations("resumePreview.customize");
  const mobilePreviewViewportRef = useRef<HTMLDivElement | null>(null);
  const mobilePreviewDocumentRef = useRef<HTMLDivElement | null>(null);
  const mobileGestureRef = useRef<MobileGestureState>({
    mode: "idle",
    startDistance: 0,
    startScale: MIN_MOBILE_ZOOM,
    startTouchX: 0,
    startTouchY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });
  const [draggedSection, setDraggedSection] = useState<ResumeSectionId | null>(
    null,
  );
  const [zoom, setZoom] = useState(PREVIEW_ZOOM_DEFAULT);
  const [mobileView, setMobileView] = useState<MobileEditorView>("customize");
  const [mobileFitScale, setMobileFitScale] = useState(1);
  const [mobilePreviewReady, setMobilePreviewReady] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(MIN_MOBILE_ZOOM);
  const [mobileOffset, setMobileOffset] = useState<MobilePreviewOffset>({
    x: 0,
    y: 0,
  });
  const [previewDocumentSize, setPreviewDocumentSize] =
    useState<PreviewDocumentSize>({ width: 794, height: 1123 });

  const resetMobilePreview = () => {
    mobileGestureRef.current.mode = "idle";
    setMobileZoom(MIN_MOBILE_ZOOM);
    setMobileOffset({ x: 0, y: 0 });
  };

  const closePanel = () => {
    setMobileView("customize");
    setZoom(PREVIEW_ZOOM_DEFAULT);
    setMobilePreviewReady(false);
    resetMobilePreview();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileView("customize");
        setMobileZoom(MIN_MOBILE_ZOOM);
        setMobileOffset({ x: 0, y: 0 });
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || mobileView !== "preview") return;

    const viewport = mobilePreviewViewportRef.current;
    const documentElement = mobilePreviewDocumentRef.current;
    if (!viewport || !documentElement) return;

    const measurePreview = () => {
      const documentWidth = documentElement.offsetWidth;
      const documentHeight = documentElement.offsetHeight;
      if (documentWidth <= 0 || documentHeight <= 0) return;

      const availableWidth = Math.max(1, viewport.clientWidth - 24);
      const availableHeight = Math.max(1, viewport.clientHeight - 24);
      const nextFitScale = Math.min(
        1,
        availableWidth / documentWidth,
        availableHeight / documentHeight,
      );

      setPreviewDocumentSize({
        width: documentWidth,
        height: documentHeight,
      });
      setMobileFitScale(nextFitScale);
      setMobilePreviewReady(true);
    };

    const frameId = window.requestAnimationFrame(measurePreview);
    const resizeObserver = new ResizeObserver(measurePreview);
    resizeObserver.observe(viewport);
    resizeObserver.observe(documentElement);
    window.addEventListener("resize", measurePreview);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measurePreview);
    };
  }, [
    isOpen,
    mobileView,
    customization,
    fontFamily,
    resumeContent,
    TemplateComponent,
  ]);

  if (!isOpen) return null;

  const updateCustomization = (partial: Partial<ResumeCustomization>) => {
    onCustomizationChange({ ...customization, ...partial });
  };

  const handleFontScaleChange = (delta: number) => {
    const newScale = Math.round((customization.fontScale + delta) * 100) / 100;
    if (newScale >= FONT_SCALE_MIN && newScale <= FONT_SCALE_MAX) {
      updateCustomization({ fontScale: newScale });
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    setZoom(Math.min(Math.max(nextZoom, PREVIEW_ZOOM_MIN), PREVIEW_ZOOM_MAX));
  };

  const toggleSectionVisibility = (sectionId: ResumeSectionId) => {
    const hidden = new Set(customization.hiddenSections);
    if (hidden.has(sectionId)) {
      hidden.delete(sectionId);
    } else {
      hidden.add(sectionId);
    }
    updateCustomization({ hiddenSections: Array.from(hidden) });
  };

  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...customization.sectionOrder];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    updateCustomization({ sectionOrder: newOrder });
  };

  const moveSectionDown = (index: number) => {
    if (index >= customization.sectionOrder.length - 1) return;
    const newOrder = [...customization.sectionOrder];
    [newOrder[index], newOrder[index + 1]] = [
      newOrder[index + 1],
      newOrder[index],
    ];
    updateCustomization({ sectionOrder: newOrder });
  };

  const handleDragOver = (event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    if (!draggedSection) return;

    const draggedIndex = customization.sectionOrder.indexOf(draggedSection);
    if (draggedIndex === targetIndex) return;

    const newOrder = [...customization.sectionOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSection);
    updateCustomization({ sectionOrder: newOrder });
  };

  const resetToDefaults = () => {
    if (onReset) {
      onReset();
    } else {
      const defaultCustomization: ResumeCustomization = {
        ...DEFAULT_RESUME_CUSTOMIZATION,
        fontFamily: FONT_FAMILIES[0].value,
      };
      onCustomizationChange(defaultCustomization);
      onFontFamilyChange(FONT_FAMILIES[0].value);
    }
    setZoom(PREVIEW_ZOOM_DEFAULT);
    resetMobilePreview();
  };

  const clampMobileOffset = (
    x: number,
    y: number,
    scale: number,
  ): MobilePreviewOffset => {
    const viewport = mobilePreviewViewportRef.current;
    if (!viewport || scale <= MIN_MOBILE_ZOOM) return { x: 0, y: 0 };

    const scaledWidth = previewDocumentSize.width * mobileFitScale * scale;
    const scaledHeight = previewDocumentSize.height * mobileFitScale * scale;
    const maxX = Math.max(0, (scaledWidth - viewport.clientWidth + 24) / 2);
    const maxY = Math.max(0, (scaledHeight - viewport.clientHeight + 24) / 2);

    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY),
    };
  };

  const getTouchDistance = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    const secondTouch = event.touches[1];
    return Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
  };

  const handleMobileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
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

  const handleMobileTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = mobileGestureRef.current;

    if (event.touches.length === 2 && gesture.mode === "pinch") {
      event.preventDefault();
      const nextScale = Math.min(
        Math.max(
          gesture.startScale *
            (getTouchDistance(event) / gesture.startDistance),
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
      setMobileOffset(
        clampMobileOffset(
          gesture.startOffsetX + touch.clientX - gesture.startTouchX,
          gesture.startOffsetY + touch.clientY - gesture.startTouchY,
          mobileZoom,
        ),
      );
    }
  };

  const handleMobileTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
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
    if (mobileZoom <= MIN_MOBILE_ZOOM) resetMobilePreview();
  };

  const openMobilePreview = () => {
    setMobilePreviewReady(false);
    resetMobilePreview();
    setMobileView("preview");
  };

  const currentFontId = getFontFamilyId(fontFamily || customization.fontFamily);
  const fontScalePercent = Math.round(customization.fontScale * 100);
  const mobilePreviewScale = mobileFitScale * mobileZoom;

  return (
    <div className="fixed inset-0 z-80 flex min-h-0 flex-col overflow-hidden bg-base text-primary animate-in fade-in duration-200">
      <header className="flex min-h-17 shrink-0 items-center justify-between gap-3 border-b border-edge bg-elevated/95 px-3 shadow-sm backdrop-blur-xl sm:px-5 lg:min-h-16">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={closePanel}
            className="hidden h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-edge bg-card px-3 text-xs font-bold text-secondary transition-colors hover:border-gold/40 hover:text-gold lg:flex"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            <span>{t("doneClose")}</span>
          </button>
          <div className="hidden h-5 w-px bg-edge lg:block" />
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 shadow-sm">
              <SlidersHorizontal size={16} className="text-gold" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-sm font-black text-primary">
                  {t("title")}
                </h1>
                {resumeName && (
                  <span className="hidden max-w-44 truncate rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-bold text-gold xl:inline-block">
                    {resumeName}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[10px] font-medium text-faint sm:text-[11px] lg:hidden">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            dir="ltr"
            className="hidden items-center gap-1 rounded-xl border border-edge bg-card p-1 lg:flex"
          >
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - PREVIEW_ZOOM_STEP)}
              disabled={zoom <= PREVIEW_ZOOM_MIN}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-soft disabled:cursor-not-allowed disabled:opacity-30"
              title={t("zoomOut")}
            >
              <Minus size={13} />
            </button>
            <span className="min-w-11 text-center text-xs font-black text-gold">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + PREVIEW_ZOOM_STEP)}
              disabled={zoom >= PREVIEW_ZOOM_MAX}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-soft disabled:cursor-not-allowed disabled:opacity-30"
              title={t("zoomIn")}
            >
              <Plus size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(PREVIEW_ZOOM_DEFAULT)}
              disabled={zoom === PREVIEW_ZOOM_DEFAULT}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-soft hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
              title={t("resetZoom")}
            >
              <RotateCcw size={12} />
            </button>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card transition-colors hover:bg-soft hover:text-gold"
            aria-label={t("close")}
          >
            <X size={17} />
          </button>
        </div>
      </header>

      <nav className="shrink-0 border-b border-edge bg-base px-3 py-2 lg:hidden">
        <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-1 rounded-2xl border border-edge bg-soft/70 p-1 shadow-inner">
          <button
            type="button"
            onClick={openMobilePreview}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-xl text-xs font-black transition-all ${
              mobileView === "preview"
                ? "bg-elevated text-gold shadow-sm ring-1 ring-gold/20"
                : "text-secondary hover:bg-elevated/60 hover:text-primary"
            }`}
          >
            <FileText size={15} />
            {t("previewTab")}
          </button>
          <button
            type="button"
            onClick={() => setMobileView("customize")}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-xl text-xs font-black transition-all ${
              mobileView === "customize"
                ? "bg-elevated text-gold shadow-sm ring-1 ring-gold/20"
                : "text-secondary hover:bg-elevated/60 hover:text-primary"
            }`}
          >
            <SlidersHorizontal size={15} />
            {t("customizeTab")}
          </button>
        </div>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden lg:flex-row">
        <section
          className={`${
            mobileView === "preview" ? "flex" : "hidden"
          } min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-soft/70 dark:bg-black/45 lg:flex`}
        >
          <div
            ref={mobilePreviewViewportRef}
            onTouchStart={handleMobileTouchStart}
            onTouchMove={handleMobileTouchMove}
            onTouchEnd={handleMobileTouchEnd}
            onTouchCancel={handleMobileTouchEnd}
            onDoubleClick={resetMobilePreview}
            className="relative min-h-0 flex-1 touch-none overflow-hidden bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-size[22px_22px] lg:hidden"
          >
            {!mobilePreviewReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-soft">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-edge border-t-gold" />
              </div>
            )}

            {TemplateComponent && resumeContent ? (
              <div
                className={`absolute left-1/2 top-1/2 will-change-transform transition-opacity duration-200 ${
                  mobilePreviewReady ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform: `translate3d(${mobileOffset.x}px, ${mobileOffset.y}px, 0)`,
                }}
              >
                <div
                  ref={mobilePreviewDocumentRef}
                  className="w-[210mm] max-w-none will-change-transform"
                  style={{
                    marginLeft: "-105mm",
                    marginTop: `${-previewDocumentSize.height / 2}px`,
                    transform: `scale(${mobilePreviewScale})`,
                    transformOrigin: "center",
                  }}
                >
                  <TemplateComponent
                    resume={resumeContent}
                    customization={{ ...customization, fontFamily }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-5 text-center text-sm text-secondary">
                {t("previewUnavailable")}
              </div>
            )}

            {mobilePreviewReady && (
              <span className="pointer-events-none absolute -inset-s-3 top-3 z-20 inline-flex min-h-9 items-center rounded-full border border-edge bg-elevated/95 px-3 text-[10px] font-black uppercase tracking-wide text-gold shadow-lg backdrop-blur">
                {t("livePreview")}
              </span>
            )}

            {mobilePreviewReady && mobileZoom === MIN_MOBILE_ZOOM && (
              <p className="pointer-events-none absolute inset-x-3 bottom-3 z-20 mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-full border border-edge bg-elevated/95 px-3 py-2 text-center text-[11px] font-semibold text-secondary shadow-lg backdrop-blur">
                {t("pinchHint")}
              </p>
            )}

            {mobileZoom > MIN_MOBILE_ZOOM && (
              <button
                type="button"
                onClick={resetMobilePreview}
                className="absolute inset-e-3 top-3 z-20 flex min-h-9 items-center gap-1.5 rounded-full border border-edge bg-elevated/95 px-3 text-[11px] font-black text-primary shadow-lg backdrop-blur"
                aria-label={t("resetZoom")}
              >
                <RotateCcw size={13} className="text-gold" />
                {Math.round(mobileZoom * 100)}%
              </button>
            )}
          </div>

          <div className="hidden min-h-0 flex-1 items-start justify-center overflow-auto p-6 lg:flex xl:p-8">
            {TemplateComponent && resumeContent ? (
              <div
                className="my-auto shrink-0 rounded-sm shadow-2xl transition-transform duration-200"
                style={{ zoom: zoom / 100 }}
              >
                <TemplateComponent
                  resume={resumeContent}
                  customization={{ ...customization, fontFamily }}
                />
              </div>
            ) : (
              <div className="m-auto text-sm text-secondary">
                {t("previewUnavailable")}
              </div>
            )}
          </div>
        </section>

        <aside
          className={`${
            mobileView === "customize" ? "flex" : "hidden"
          } min-h-0 min-w-0 w-full shrink-0 flex-col overflow-hidden bg-base shadow-2xl lg:flex lg:w-102.5 lg:border-s lg:border-edge xl:w-110`}
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain bg-soft/30 p-3 pb-5 sm:p-4 lg:space-y-0 lg:bg-transparent lg:p-0">
            <div className="rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 lg:hidden">
              <p className="text-xs font-black text-primary">
                {t("customizationTitle")}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-secondary">
                {t("customizationHint")}
              </p>
            </div>

            <section className="rounded-2xl border border-edge bg-elevated px-4 py-5 shadow-sm sm:px-5 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:shadow-none">
              <div className="mb-4 flex items-center gap-2">
                <Type size={16} className="text-gold" />
                <h2 className="text-sm font-bold text-primary">
                  {t("fontFamily")}
                </h2>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => onFontFamilyChange(font.value)}
                    className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs font-semibold transition-all ${
                      currentFontId === font.id
                        ? "border-gold bg-gold/10 text-gold shadow-sm"
                        : "border-edge bg-card text-secondary hover:border-gold/40 hover:text-primary"
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {currentFontId === font.id && (
                      <Check size={12} className="shrink-0" />
                    )}
                    <span className="truncate">{font.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-edge bg-elevated px-4 py-5 shadow-sm sm:px-5 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:shadow-none">
              <div className="mb-4 flex items-center gap-2">
                <Type size={16} className="text-gold" />
                <h2 className="text-sm font-bold text-primary">
                  {t("fontSize")}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFontScaleChange(-FONT_SCALE_STEP)}
                  disabled={customization.fontScale <= FONT_SCALE_MIN}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card transition-colors hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("decreaseFontSize")}
                >
                  <Minus size={14} />
                </button>
                <div className="min-w-0 flex-1">
                  <input
                    type="range"
                    min={FONT_SCALE_MIN * 100}
                    max={FONT_SCALE_MAX * 100}
                    step={FONT_SCALE_STEP * 100}
                    value={fontScalePercent}
                    onChange={(event) =>
                      updateCustomization({
                        fontScale: Number(event.target.value) / 100,
                      })
                    }
                    className="w-full cursor-pointer accent-gold"
                  />
                  <div className="mt-1 flex justify-between px-0.5 text-[10px] text-faint">
                    <span>75%</span>
                    <span className="font-bold text-gold">
                      {fontScalePercent}%
                    </span>
                    <span>125%</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFontScaleChange(FONT_SCALE_STEP)}
                  disabled={customization.fontScale >= FONT_SCALE_MAX}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card transition-colors hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("increaseFontSize")}
                >
                  <Plus size={14} />
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-edge bg-elevated px-4 py-5 shadow-sm sm:px-5 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:shadow-none">
              <div className="mb-4 flex items-center gap-2">
                <Palette size={16} className="text-gold" />
                <h2 className="text-sm font-bold text-primary">
                  {t("accentColor")}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    title={t(`colors.${color.key}`)}
                    onClick={() =>
                      updateCustomization({ accentColor: color.hex })
                    }
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                      customization.accentColor === color.hex
                        ? "scale-110 border-gold shadow-md"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {customization.accentColor === color.hex && (
                      <Check size={14} className="text-white drop-shadow" />
                    )}
                  </button>
                ))}
                <label
                  className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-edge transition-colors hover:border-gold/50"
                  title={t("customColor")}
                >
                  <input
                    type="color"
                    value={customization.accentColor}
                    onChange={(event) =>
                      updateCustomization({
                        accentColor: event.target.value,
                      })
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={t("customColor")}
                  />
                  <Palette size={14} className="text-secondary" />
                </label>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-faint">
                {t("accentHelp")}
              </p>
            </section>

            <section className="rounded-2xl border border-edge bg-elevated px-4 py-5 shadow-sm sm:px-5 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:shadow-none">
              <div className="mb-4 flex items-start gap-2.5">
                <SlidersHorizontal
                  size={16}
                  className="mt-0.5 shrink-0 text-gold"
                />
                <div>
                  <h2 className="text-sm font-bold text-primary">
                    {t("sectionOrder")}
                  </h2>
                  <p className="mt-1 text-[11px] leading-5 text-faint">
                    {t("sectionOrderHelp")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {customization.sectionOrder.map((sectionId, index) => {
                  const isHidden =
                    customization.hiddenSections.includes(sectionId);

                  return (
                    <div
                      key={sectionId}
                      draggable
                      onDragStart={() => setDraggedSection(sectionId)}
                      onDragOver={(event) => handleDragOver(event, index)}
                      onDragEnd={() => setDraggedSection(null)}
                      className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 transition-all sm:px-3 ${
                        draggedSection === sectionId
                          ? "border-gold/50 bg-gold/5 opacity-70"
                          : isHidden
                            ? "border-edge bg-soft/50 opacity-60"
                            : "border-edge bg-card hover:border-gold/30"
                      }`}
                    >
                      <GripVertical
                        size={14}
                        className="shrink-0 cursor-grab text-faint"
                      />
                      <span
                        className={`min-w-0 flex-1 truncate text-xs font-semibold sm:text-sm ${
                          isHidden ? "text-faint line-through" : "text-primary"
                        }`}
                      >
                        {t(`sections.${sectionId}`)}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveSectionUp(index)}
                          disabled={index === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-soft disabled:cursor-not-allowed disabled:opacity-30"
                          title={t("moveUp")}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSectionDown(index)}
                          disabled={
                            index === customization.sectionOrder.length - 1
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-soft disabled:cursor-not-allowed disabled:opacity-30"
                          title={t("moveDown")}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sectionId)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            isHidden
                              ? "text-faint hover:bg-gold/10"
                              : "text-secondary hover:bg-soft"
                          }`}
                          title={isHidden ? t("showSection") : t("hideSection")}
                        >
                          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <footer className="grid shrink-0 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2 border-t border-edge bg-elevated/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-4">
            <button
              type="button"
              onClick={resetToDefaults}
              className="flex min-h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-edge bg-card px-2 text-[11px] font-bold text-secondary transition-all hover:border-gold/40 hover:text-gold sm:px-3 sm:text-xs"
            >
              <RotateCcw size={13} className="shrink-0" />
              <span className="truncate">{t("resetDefaults")}</span>
            </button>
            <button
              type="button"
              onClick={closePanel}
              className="flex min-h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gold px-2 text-[11px] font-black text-ink shadow-[0_10px_28px_rgba(245,158,11,0.22)] transition-all hover:-translate-y-0.5 hover:opacity-95 sm:px-3 sm:text-xs"
            >
              <Check size={14} className="shrink-0" />
              <span className="truncate">{t("applyDone")}</span>
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}
