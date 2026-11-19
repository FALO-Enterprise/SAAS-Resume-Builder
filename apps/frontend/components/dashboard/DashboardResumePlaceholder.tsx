'use client';

import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ResumeTemplateId } from '@shared-types/resume';
import type { StepId } from '@/lib/types/dashboard.types';
import { getResumePlaceholderSections } from './resume-placeholder.model';

/* The outline beside the editor. It is drawn in the shape of the template the
   resume will use (header band, sidebar, centred heading), carries the
   writer's own name and title, lists the sections in their own order, and
   highlights the one being edited.

   It is a drawing, not a photo of the template sample: the sample shows
   someone else's content with sections in fixed places, so a highlight laid
   over it would point at the wrong block as soon as sections are reordered.

   The sheet keeps fixed paper colours in both themes, because a resume is
   paper either way. The shapes mirror `components/resume/templates`. */

type Shape = {
  header: 'band' | 'left' | 'center';
  side: 'none' | 'dark' | 'light';
  accent: string;
};

const SHAPES: Record<ResumeTemplateId, Shape> = {
  executive: { header: 'band', side: 'light', accent: '#0f766e' },
  developer: { header: 'left', side: 'dark', accent: '#b4415b' },
  director: { header: 'left', side: 'none', accent: '#b45309' },
  minimal: { header: 'center', side: 'none', accent: '#1c1830' },
  academic: { header: 'center', side: 'none', accent: '#1e3a8a' },
  global: { header: 'left', side: 'none', accent: '#15803d' },
};

const PAPER_INK = '#1c1830';
const HIGHLIGHT = '#6e5bc4';

const LINES: Record<Exclude<StepId, 'contact'>, number[]> = {
  summary: [100, 91, 72],
  skills: [82, 100, 64, 90],
  experience: [65, 40, 100, 88],
  projects: [70, 48, 100],
  education: [86, 68, 52],
};

function Lines({ widths, tone }: { widths: number[]; tone: string }) {
  return (
    <span aria-hidden className="flex flex-col gap-[5px]">
      {widths.map((width, index) => (
        <span
          key={index}
          className="block h-[3px]"
          style={{ width: `${width}%`, background: tone }}
        />
      ))}
    </span>
  );
}

function Block({
  id,
  active,
  label,
  className = '',
  children,
}: {
  id: StepId;
  active: boolean;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-current={active ? 'step' : undefined}
      aria-label={label}
      data-resume-section={id}
      data-active={active}
      className={`relative p-[5px] outline-2 -outline-offset-1 transition-[background-color,outline-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
      style={{
        outlineStyle: 'solid',
        outlineColor: active ? HIGHLIGHT : 'transparent',
        background: active ? `${HIGHLIGHT}1f` : 'transparent',
      }}
    >
      {children}
    </section>
  );
}

export default function DashboardResumePlaceholder({
  currentStep,
  order,
  template = 'minimal',
  name,
  title,
}: {
  currentStep: StepId;
  order?: StepId[];
  template?: ResumeTemplateId;
  name?: string;
  title?: string;
}) {
  const t = useTranslations('dashboard');
  const activeSection = t(`steps.${currentStep}.label`);
  const sectionStates = getResumePlaceholderSections(currentStep);
  const isActive = (id: StepId) =>
    sectionStates.find((section) => section.id === id)?.active ?? false;
  const sectionLabel = (id: StepId) => t(`steps.${id}.label`);

  const shape = SHAPES[template] ?? SHAPES.minimal;
  const centered = shape.header === 'center';
  const band = shape.header === 'band';
  const hasSide = shape.side !== 'none';
  const darkSide = shape.side === 'dark';

  const defaultOrder: StepId[] = ['summary', 'skills', 'experience', 'projects', 'education'];
  const bodyOrder = (order ?? defaultOrder).filter((id) => id !== 'contact') as Exclude<StepId, 'contact'>[];
  /* Templates with a sidebar carry skills there, as the real ones do. */
  const mainOrder = hasSide ? bodyOrder.filter((id) => id !== 'skills') : bodyOrder;

  const heading = (id: StepId, tone: string, center = false) => (
    <span
      aria-hidden
      className={`mb-[5px] block truncate text-[6.5px] font-bold uppercase leading-none tracking-[0.1em] rtl:tracking-normal ${center ? 'text-center' : ''}`}
      style={{ color: tone }}
    >
      {sectionLabel(id)}
    </span>
  );

  const body = (id: Exclude<StepId, 'contact'>) => (
    <Block
      key={id}
      id={id}
      active={isActive(id)}
      label={sectionLabel(id)}
      className={id === 'experience' ? 'flex-[1.35]' : 'flex-1'}
    >
      {heading(id, shape.accent, centered)}
      <Lines widths={LINES[id]} tone="#cbc8d6" />
    </Block>
  );

  const contactTone = band ? '#ffffff' : PAPER_INK;

  return (
    <aside
      aria-label={t('resumePlaceholder.ariaLabel', { section: activeSection })}
      className="hidden self-start xl:sticky xl:top-6 xl:block xl:h-fit"
    >
      <figure className="rounded-lg border border-edge bg-card p-4 2xl:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
              <FileText size={14} className="text-accent" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-bold text-primary">
                {t('resumePlaceholder.title')}
              </h2>
              <p
                key={currentStep}
                className="mt-0.5 truncate text-[12px] font-semibold text-accent"
              >
                {t('resumePlaceholder.editing', { section: activeSection })}
              </p>
            </div>
          </div>
        </div>

        {/* The sheet sits on a patch of the cutting mat. */}
        <div className="lp-mat overflow-hidden rounded-lg p-3">
          <div
            className="relative mx-auto flex aspect-210/297 w-full flex-col overflow-hidden rounded-sm bg-white shadow-[0_14px_30px_-14px_rgba(28,24,48,0.45)]"
            style={{ color: PAPER_INK }}
          >
            {/* Contact: the head of the page, in the template's own style */}
            <Block
              id="contact"
              active={isActive('contact')}
              label={sectionLabel('contact')}
              className={band ? '!p-0' : 'mx-[5%] mt-[5%] !p-0'}
            >
              <span
                className={`block px-[6%] py-[5%] ${centered ? 'text-center' : ''} ${band ? '' : 'border-b-2 !px-[3px]'}`}
                style={
                  band
                    ? { background: shape.accent, color: contactTone }
                    : { borderColor: shape.accent }
                }
              >
                <span className="block truncate text-[12px] font-bold leading-tight tracking-[-0.02em] rtl:tracking-normal">
                  {name?.trim() || (
                    <span
                      aria-hidden
                      className={`block h-[6px] w-2/3 ${centered ? 'mx-auto' : ''}`}
                      style={{ background: band ? '#ffffff99' : '#cbc8d6' }}
                    />
                  )}
                </span>
                <span className="mt-[3px] block truncate text-[7.5px] leading-tight opacity-80">
                  {title?.trim() || (
                    <span
                      aria-hidden
                      className={`block h-[3px] w-2/5 ${centered ? 'mx-auto' : ''}`}
                      style={{ background: band ? '#ffffff80' : '#cbc8d6' }}
                    />
                  )}
                </span>
              </span>
            </Block>

            <div className="flex min-h-0 flex-1">
              {hasSide && (
                <div
                  className="flex w-[32%] shrink-0 flex-col p-[4%]"
                  style={{
                    background: darkSide ? PAPER_INK : `${shape.accent}14`,
                  }}
                >
                  <Block
                    id="skills"
                    active={isActive('skills')}
                    label={sectionLabel('skills')}
                    className="flex-1"
                  >
                    {heading('skills', darkSide ? '#cfc4ff' : shape.accent)}
                    <Lines
                      widths={[90, 70, 84, 60, 76, 52]}
                      tone={darkSide ? '#ffffff59' : '#b9b5c8'}
                    />
                  </Block>
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-[3px] p-[4%]">
                {mainOrder.map((id) => body(id))}
              </div>
            </div>
          </div>
        </div>

        <figcaption className="mt-3 text-center text-[12px] leading-relaxed text-secondary">
          {t('resumePlaceholder.hint')}
        </figcaption>
      </figure>
    </aside>
  );
}
