'use client';

import { ComponentType, useEffect, useState } from 'react';
import {
  X,
  Type,
  Palette,
  SlidersHorizontal,
  Minus,
  Plus,
  Eye,
  EyeOff,
  GripVertical,
  Check,
  RotateCcw,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_RESUME_CUSTOMIZATION,
  RESUME_SECTION_IDS,
  type ResumeContent,
  type ResumeCustomization,
  type ResumeSectionId,
} from '@shared-types/resume';
import type { ResumeTemplateProps } from './templates/ProfessionalAtsTemplate';

export const FONT_FAMILIES = [
  { id: 'arial', label: 'Arial', value: 'Arial, "Liberation Sans", Helvetica, sans-serif' },
  { id: 'times', label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { id: 'georgia', label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { id: 'cambria', label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { id: 'garamond', label: 'Garamond', value: 'Garamond, "Palatino Linotype", serif' },
  { id: 'calibri', label: 'Calibri', value: 'Calibri, "Gill Sans", sans-serif' },
  { id: 'helvetica', label: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: 'roboto', label: 'Roboto', value: 'Roboto, "Segoe UI", sans-serif' },
  { id: 'system', label: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
] as const;

export type FontFamilyId = (typeof FONT_FAMILIES)[number]['id'];

export function getFontFamilyId(font?: string): string {
  if (!font) return 'arial';
  const found = FONT_FAMILIES.find((f) => f.value === font || f.id === font);
  if (found) return found.id;
  const normalized = font.toLowerCase().replace(/['"\s]/g, '');
  const match = FONT_FAMILIES.find(
    (f) =>
      f.id === normalized ||
      f.value.toLowerCase().replace(/['"\s]/g, '') === normalized ||
      normalized.includes(f.id) ||
      f.label.toLowerCase().replace(/['"\s]/g, '') === normalized
  );
  return match?.id ?? 'arial';
}

const ACCENT_COLORS = [
  { hex: '#0563c1', label: 'Blue' },
  { hex: '#087682', label: 'Teal' },
  { hex: '#1e3a8a', label: 'Navy' },
  { hex: '#0f766e', label: 'Emerald' },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#c25e2e', label: 'Copper' },
  { hex: '#d75d68', label: 'Rose' },
  { hex: '#b45309', label: 'Amber' },
  { hex: '#374151', label: 'Slate' },
  { hex: '#000000', label: 'Black' },
];

const SECTION_LABELS: Record<ResumeSectionId, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
};

const FONT_SCALE_MIN = 0.75;
const FONT_SCALE_MAX = 1.25;
const FONT_SCALE_STEP = 0.05;

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
  const [draggedSection, setDraggedSection] = useState<ResumeSectionId | null>(null);
  const [zoom, setZoom] = useState(90);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    updateCustomization({ sectionOrder: newOrder });
  };

  const moveSectionDown = (index: number) => {
    if (index >= customization.sectionOrder.length - 1) return;
    const newOrder = [...customization.sectionOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    updateCustomization({ sectionOrder: newOrder });
  };

  const handleDragStart = (sectionId: ResumeSectionId) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedSection) return;
    const draggedIndex = customization.sectionOrder.indexOf(draggedSection);
    if (draggedIndex === targetIndex) return;
    const newOrder = [...customization.sectionOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSection);
    updateCustomization({ sectionOrder: newOrder });
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  const resetToDefaults = () => {
    if (onReset) {
      onReset();
    }
  };

  const currentFontId = getFontFamilyId(fontFamily || customization?.fontFamily);
  const fontScalePercent = Math.round(customization.fontScale * 100);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-base/95 backdrop-blur-2xl text-primary animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-edge bg-elevated/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl border border-edge bg-card px-3.5 py-2 text-xs font-bold text-secondary hover:border-gold/40 hover:text-gold transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Done & Close</span>
          </button>
          <div className="hidden h-5 w-px bg-edge sm:block" />
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gold" />
            <span className="text-sm font-bold text-primary">Customize Resume</span>
            {resumeName && (
              <span className="hidden sm:inline-block rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-bold text-gold">
                {resumeName}
              </span>
            )}
          </div>
        </div>

        {/* Live Zoom Controls for the Left Resume Preview */}
        <div className="flex items-center gap-3">
          <div dir="ltr" className="flex items-center gap-2 rounded-xl border border-edge bg-card p-1">
            <button
              type="button"
              onClick={() => setZoom((val) => Math.max(50, val - 5))}
              disabled={zoom <= 50}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-soft disabled:opacity-30 cursor-pointer"
              title="Zoom out"
            >
              <Minus size={13} />
            </button>
            <span className="min-w-10 text-center text-xs font-black text-gold">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((val) => Math.min(150, val + 5))}
              disabled={zoom >= 150}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-soft disabled:opacity-30 cursor-pointer"
              title="Zoom in"
            >
              <Plus size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(90)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-soft text-secondary cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-card hover:bg-soft hover:text-gold transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Main Split Body: Left = Resume Canvas, Right = Controls Panel */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left Side: Live Rendered Resume */}
        <div className="flex-1 overflow-auto bg-soft/60 dark:bg-black/40 p-4 sm:p-8 flex items-start justify-center">
          {TemplateComponent && resumeContent ? (
            <div
              className="shrink-0 transition-transform duration-200 shadow-2xl rounded-sm my-auto"
              style={{ zoom: zoom / 100 }}
            >
              <TemplateComponent
                resume={resumeContent}
                customization={{ ...customization, fontFamily }}
              />
            </div>
          ) : (
            <div className="m-auto text-secondary text-sm">Resume preview unavailable</div>
          )}
        </div>

        {/* Right Side: Customization Sidebar */}
        <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-s border-edge bg-elevated flex flex-col overflow-hidden shadow-2xl">
          {/* Scrollable Configuration Controls */}
          <div className="flex-1 overflow-y-auto">
            {/* Font Family Section */}
            <div className="border-b border-edge px-5 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Type size={16} className="text-gold" />
                <h3 className="text-sm font-bold text-primary">Font Family</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => onFontFamilyChange(font.value)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer border ${
                      currentFontId === font.id
                        ? 'border-gold bg-gold/10 text-gold shadow-sm'
                        : 'border-edge bg-card text-secondary hover:border-gold/40 hover:text-primary'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {currentFontId === font.id && <Check size={12} className="shrink-0" />}
                    <span className="truncate">{font.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Section */}
            <div className="border-b border-edge px-5 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Type size={16} className="text-gold" />
                <h3 className="text-sm font-bold text-primary">Font Size</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFontScaleChange(-FONT_SCALE_STEP)}
                  disabled={customization.fontScale <= FONT_SCALE_MIN}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40 cursor-pointer hover:border-gold/40 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min={FONT_SCALE_MIN * 100}
                    max={FONT_SCALE_MAX * 100}
                    step={FONT_SCALE_STEP * 100}
                    value={fontScalePercent}
                    onChange={(e) => updateCustomization({ fontScale: Number(e.target.value) / 100 })}
                    className="w-full cursor-pointer accent-gold"
                  />
                  <div className="flex justify-between text-[10px] text-faint mt-1 px-0.5">
                    <span>75%</span>
                    <span className="font-bold text-gold">{fontScalePercent}%</span>
                    <span>125%</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleFontScaleChange(FONT_SCALE_STEP)}
                  disabled={customization.fontScale >= FONT_SCALE_MAX}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40 cursor-pointer hover:border-gold/40 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Accent Color Section */}
            <div className="border-b border-edge px-5 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={16} className="text-gold" />
                <h3 className="text-sm font-bold text-primary">Accent Color</h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    title={color.label}
                    onClick={() => updateCustomization({ accentColor: color.hex })}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all cursor-pointer ${
                      customization.accentColor === color.hex
                        ? 'border-gold scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {customization.accentColor === color.hex && (
                      <Check size={14} className="text-white drop-shadow" />
                    )}
                  </button>
                ))}
                {/* Custom color input */}
                <label
                  className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-edge hover:border-gold/50 transition-colors overflow-hidden"
                  title="Custom color"
                >
                  <input
                    type="color"
                    value={customization.accentColor}
                    onChange={(e) => updateCustomization({ accentColor: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <Palette size={14} className="text-secondary" />
                </label>
              </div>
              <p className="mt-3 text-[11px] text-faint">Accent color applies to headings, links, and accents</p>
            </div>

            {/* Section Order & Visibility */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-gold" />
                <h3 className="text-sm font-bold text-primary">Section Order & Visibility</h3>
              </div>
              <div className="space-y-1.5">
                {customization.sectionOrder.map((sectionId, index) => {
                  const isHidden = customization.hiddenSections.includes(sectionId);
                  return (
                    <div
                      key={sectionId}
                      draggable
                      onDragStart={() => handleDragStart(sectionId)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                        draggedSection === sectionId
                          ? 'border-gold/50 bg-gold/5 opacity-70'
                          : isHidden
                            ? 'border-edge bg-soft/50 opacity-60'
                            : 'border-edge bg-card hover:border-gold/30'
                      }`}
                    >
                      <GripVertical size={14} className="text-faint cursor-grab shrink-0" />
                      <span className={`flex-1 text-sm font-semibold ${
                        isHidden ? 'text-faint line-through' : 'text-primary'
                      }`}>
                        {SECTION_LABELS[sectionId] ?? sectionId}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSectionUp(index)}
                          disabled={index === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-soft disabled:opacity-30 cursor-pointer text-secondary"
                          title="Move up"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSectionDown(index)}
                          disabled={index === customization.sectionOrder.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-soft disabled:opacity-30 cursor-pointer text-secondary"
                          title="Move down"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sectionId)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg cursor-pointer transition-colors ${
                            isHidden ? 'hover:bg-gold/10 text-faint' : 'hover:bg-soft text-secondary'
                          }`}
                          title={isHidden ? 'Show section' : 'Hide section'}
                        >
                          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Footer Actions */}
          <div className="border-t border-edge p-4 bg-elevated flex gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="flex-1 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-edge bg-card px-3 text-xs font-bold text-secondary hover:border-gold/40 hover:text-gold transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-3 text-xs font-black text-ink shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Apply & Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
