'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FileText, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { StepId } from '@/lib/types/dashboard.types';
import { getResumePlaceholderSections } from './resume-placeholder.model';

type PlaceholderSectionProps = {
  id: StepId;
  currentStep: StepId;
  label: string;
  className?: string;
  children: ReactNode;
};

function SkeletonLine({ width = '100%' }: { width?: string }) {
  return (
    <span
      aria-hidden="true"
      className="block h-1 rounded-full bg-slate-300"
      style={{ width }}
    />
  );
}

function PlaceholderSection({
  id,
  currentStep,
  label,
  className = '',
  children,
}: PlaceholderSectionProps) {
  const active = id === currentStep;

  return (
    <motion.section
      aria-current={active ? 'step' : undefined}
      aria-label={label}
      data-resume-section={id}
      data-active={active}
      animate={{
        backgroundColor: active ? 'rgba(59, 130, 246, 0.09)' : 'rgba(255, 255, 255, 0)',
        borderColor: active ? 'rgba(37, 99, 235, 0.95)' : 'rgba(148, 163, 184, 0)',
        boxShadow: active ? '0 0 0 2px rgba(59, 130, 246, 0.10)' : '0 0 0 0 rgba(59, 130, 246, 0)',
      }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-md border p-2 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`mb-1.5 block text-[6px] font-bold uppercase tracking-[0.13em] transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}
      >
        {label}
      </span>
      <div aria-hidden="true">{children}</div>
    </motion.section>
  );
}

export default function DashboardResumePlaceholder({ currentStep, order }: { currentStep: StepId; order?: StepId[] }) {
  const t = useTranslations('dashboard');
  const activeSection = t(`steps.${currentStep}.label`);
  const sectionStates = getResumePlaceholderSections(currentStep);
  const isActive = (id: StepId) => sectionStates.find((section) => section.id === id)?.active ?? false;
  const sectionLabel = (id: StepId) => t(`steps.${id}.label`);

  const defaultOrder: StepId[] = ['summary', 'skills', 'experience', 'projects', 'education'];
  const resumeOrder = ['contact', ...(order ?? defaultOrder)];

  return (
    <aside
      aria-label={t('resumePlaceholder.ariaLabel', { section: activeSection })}
      className="hidden self-start xl:sticky xl:top-6 xl:block xl:h-fit"
    >
      <figure className="rounded-2xl border border-edge bg-card p-4 shadow-[0_18px_55px_var(--shadow-color)] 2xl:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-azure-light/20 bg-azure-light/10">
              <FileText size={14} className="text-azure-light" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[12px] font-bold text-primary">
                {t('resumePlaceholder.title')}
              </h2>
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-0.5 truncate text-[10px] font-semibold text-azure-light"
              >
                {t('resumePlaceholder.editing', { section: activeSection })}
              </motion.p>
            </div>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full bg-azure-light shadow-[0_0_12px_rgba(59,130,246,0.85)]" />
        </div>

        <div className="relative mx-auto aspect-210/297 w-full rounded-xl bg-white p-[6%] shadow-[0_12px_35px_rgba(15,23,42,0.18)]">
          <div className="flex min-h-full flex-col gap-2">
            {resumeOrder.map((sectionId) => {
              switch (sectionId) {
                case 'contact':
                  return (
                    <PlaceholderSection
                      key="contact"
                      id="contact"
                      currentStep={currentStep}
                      label={sectionLabel('contact')}
                      className="flex-1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
                          <SkeletonLine width="68%" />
                          <SkeletonLine width="46%" />
                          <div className="flex gap-1.5 pt-1">
                            <SkeletonLine width="32%" />
                            <SkeletonLine width="25%" />
                            <SkeletonLine width="24%" />
                          </div>
                        </div>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isActive('contact') ? 'bg-blue-200 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                          <UserRound size={18} strokeWidth={1.8} />
                        </div>
                      </div>
                    </PlaceholderSection>
                  );

                case 'summary':
                  return (
                    <PlaceholderSection key="summary" id="summary" currentStep={currentStep} label={sectionLabel('summary')} className="flex-1">
                      <div className="flex flex-col gap-1.5">
                        <SkeletonLine />
                        <SkeletonLine width="91%" />
                        <SkeletonLine width="72%" />
                      </div>
                    </PlaceholderSection>
                  );

                case 'experience':
                  return (
                    <PlaceholderSection key="experience" id="experience" currentStep={currentStep} label={sectionLabel('experience')} className="flex-[1.35]">
                      <div className="flex flex-col gap-1.5">
                        <SkeletonLine width="65%" />
                        <SkeletonLine width="40%" />
                        <SkeletonLine />
                      </div>
                    </PlaceholderSection>
                  );

                case 'projects':
                  return (
                    <PlaceholderSection key="projects" id="projects" currentStep={currentStep} label={sectionLabel('projects')} className="flex-1">
                      <div className="flex flex-col gap-1.5">
                        <SkeletonLine width="70%" />
                        <SkeletonLine width="48%" />
                        <SkeletonLine />
                      </div>
                    </PlaceholderSection>
                  );

                case 'skills':
                  return (
                    <PlaceholderSection key="skills" id="skills" currentStep={currentStep} label={sectionLabel('skills')} className="flex-1">
                      <div className="grid grid-cols-[1fr_0.85fr] gap-x-1.5 gap-y-2">
                        {Array.from({ length: 6 }, (_, index) => (
                          <SkeletonLine key={index} width={index % 3 === 0 ? '82%' : '100%'} />
                        ))}
                      </div>
                    </PlaceholderSection>
                  );

                case 'education':
                  return (
                    <PlaceholderSection key="education" id="education" currentStep={currentStep} label={sectionLabel('education')} className="flex-[1.1]">
                      <div className="flex flex-col gap-1.5">
                        <SkeletonLine width="86%" />
                        <SkeletonLine width="68%" />
                        <SkeletonLine width="52%" />
                      </div>
                    </PlaceholderSection>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>

        <figcaption className="mt-3 text-center text-[10px] leading-relaxed text-muted">
          {t('resumePlaceholder.hint')}
        </figcaption>
      </figure>
    </aside>
  );
}
