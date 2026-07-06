'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, GraduationCap, Zap,
  Mail, Phone, MapPin, Link2, ArrowRight,
  ArrowLeft, Save, Sparkles, Check,
  LayoutDashboard, ChevronRight, FileText, Menu, X,
  Plus, Trash2, Building2, Calendar, Info,
  Award, Lightbulb, PlusCircle, Search,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import type { StepId, ContactData, ExperienceItem, EducationItem, CertItem } from '@/lib/types';
import { emptyRole, emptyEdu, emptyCert } from '@/lib/resume';

const STEPS: {
  id: StepId;
  label: string;
  icon: React.ElementType;
  num: number;
  desc: string;
}[] = [
  { id: 'contact',    label: 'Contact',    icon: User,          num: 1, desc: 'Personal & contact info'   },
  { id: 'experience', label: 'Experience', icon: Briefcase,     num: 2, desc: 'Work history & roles'      },
  { id: 'education',  label: 'Education',  icon: GraduationCap, num: 3, desc: 'Degrees & certifications'  },
  { id: 'skills',     label: 'Skills',     icon: Zap,           num: 4, desc: 'Technical & soft skills'   },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));

const DEFAULT_SUGGESTIONS = [
  'AWS Cloud', 'UI/UX Design', 'Agile Method', 'Data Analysis',
  'Product Strategy', 'TypeScript', 'Docker', 'GraphQL',
  'Kubernetes', 'Figma', 'Python', 'System Design',
];


function FieldCard({
  label, icon: Icon, type = 'text', placeholder, value, onChange, error, hint,
}: {
  label: string; icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; error?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;

  const wrapState = error
    ? 'border-pink-light/50 bg-card shadow-[0_0_0_3px_rgba(248,113,113,0.08)]'
    : focused
    ? 'border-gold/60 bg-gold/4 shadow-[0_0_0_3px_rgba(245,166,35,0.1),0_8px_32px_var(--shadow-color)]'
    : filled
    ? 'border-gold/20 bg-card shadow-[0_2px_8px_var(--shadow-color)]'
    : 'border-edge bg-card shadow-[0_2px_8px_var(--shadow-color)]';

  const iconBox = focused
    ? 'bg-gold/15'
    : filled
    ? 'bg-gold/8'
    : 'bg-card-hover';

  const iconColor = focused ? 'text-gold' : filled ? 'text-gold/70' : 'text-muted';
  const labelColor = focused ? 'text-gold' : filled ? 'text-gold/70' : 'text-faint';

  return (
    <div className="flex flex-col">
      <div className={`relative overflow-hidden rounded-[14px] border px-5 py-4.5 transition-all duration-200 ${wrapState}`}>
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-0 top-0 h-0.5 origin-left bg-[linear-gradient(to_right,transparent,var(--color-gold),transparent)]"
            />
          )}
        </AnimatePresence>

        <div className="mb-2.5 flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${iconBox}`}>
            <Icon size={14} className={`transition-colors ${iconColor}`} />
          </div>
          <span className={`font-syne text-[11px] font-bold uppercase tracking-[0.09em] transition-colors ${labelColor}`}>
            {label}
          </span>
          {filled && !focused && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="ms-auto flex h-4 w-4 items-center justify-center rounded-full border border-green/30 bg-green/15">
              <Check size={9} className="text-green" />
            </motion.div>
          )}
        </div>

        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full border-none bg-transparent ps-9 font-syne text-[15px] font-medium text-primary outline-none placeholder:text-muted"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 ps-1 text-[11.5px] font-medium text-pink-light">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {hint && !error && (
        <p className="mt-1.25 ps-1 text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}

// ── Shared field/select for Experience + Education ───────────────────────────
function ExpField({ label, icon: Icon, placeholder, value, onChange, type = 'text', rightIcon: RightIcon }: {
  label: string; icon?: React.ElementType; placeholder: string;
  value: string; onChange: (v: string) => void; type?: string; rightIcon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1.5 font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-azure-light">
        {Icon && <Icon size={12} />} {label}
      </label>
      <div className="relative">
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-xl border border-edge bg-base/40 px-4 py-3 pe-10 text-[14px] text-primary outline-none transition-all placeholder:text-muted focus:border-gold/50 focus:bg-gold/4 focus:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]"
        />
        {RightIcon && <RightIcon size={15} className="pointer-events-none absolute inset-e-3.5 top-1/2 -translate-y-1/2 text-muted" />}
      </div>
    </div>
  );
}

function ExpSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: string[];
  placeholder: string; disabled?: boolean;
}) {
  return (
    <div className="relative flex-1">
      <select
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full appearance-none rounded-xl border border-edge bg-base/40 px-4 py-3 text-[14px] text-primary outline-none transition-all focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <option value="" className="bg-elevated text-primary">{placeholder}</option>
        {options.map(o => <option key={o} value={o} className="bg-elevated text-primary">{o}</option>)}
      </select>
      <ChevronRight size={14} className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 rotate-90 text-muted" />
    </div>
  );
}

// ── ATS completion ring ──────────────────────────────────────────────────────
function AtsRing({ percent }: { percent: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--edge-strong)" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--color-gold)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ── Experience step (accordion) ──────────────────────────────────────────────
function ExperienceStep({ items, onChange }: {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string>(items[0]?.id ?? '');

  const update = (id: string, patch: Partial<ExperienceItem>) =>
    onChange(items.map(it => it.id === id ? { ...it, ...patch } : it));

  const addRole = () => {
    const role = emptyRole();
    onChange([...items, role]);
    setExpandedId(role.id);
  };

  const removeRole = (id: string) => {
    const remaining = items.filter(it => it.id !== id);
    onChange(remaining);
    if (expandedId === id) setExpandedId(remaining[remaining.length - 1]?.id ?? '');
  };

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? '' : id));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="mb-6 inline-flex items-center gap-1.75 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1.25">
        <span className="inline-block h-1.25 w-1.25 rounded-full bg-gold" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">Step 2 — Experience</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-3.5 font-playfair text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-primary">
        Work Experience
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-130 text-[15px] leading-[1.7] text-faint">
        Detail your career history to highlight your impact and leadership.
      </motion.p>

      <div className="flex flex-col gap-4">
        {items.map((role, idx) => {
          const isOpen = expandedId === role.id;
          const title = role.jobTitle || `Role ${idx + 1}`;
          const subtitle = [role.company, role.location].filter(Boolean).join(' · ');

          return (
            <div key={role.id} className="overflow-hidden rounded-2xl border border-edge bg-card">
              <button
                type="button"
                onClick={() => toggle(role.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-card-hover sm:px-7"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                  <Briefcase size={15} className="text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-primary">{title}</div>
                  {subtitle && <div className="truncate text-[12px] text-faint">{subtitle}</div>}
                </div>
                {items.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); removeRole(role.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeRole(role.id); } }}
                    aria-label="Remove role"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-muted transition-all hover:border-pink-light/40 hover:bg-pink-light/10 hover:text-pink-light"
                  >
                    <Trash2 size={14} />
                  </span>
                )}
                <ChevronRight size={16} className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-edge px-5 pb-6 pt-5 sm:px-7">
                      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                        <ExpField label="Job Title" placeholder="e.g. Senior Software Engineer"
                          value={role.jobTitle} onChange={v => update(role.id, { jobTitle: v })} />
                        <ExpField label="Company Name" icon={Building2} placeholder="e.g. Global Tech Solutions"
                          value={role.company} onChange={v => update(role.id, { company: v })} />

                        <ExpField label="Location" icon={MapPin} placeholder="e.g. New York, NY or Remote"
                          value={role.location} onChange={v => update(role.id, { location: v })} />

                        <div className="flex items-end">
                          <label className="flex cursor-pointer items-center gap-2.5 py-3">
                            <button type="button" role="checkbox" aria-checked={role.current}
                              onClick={() => update(role.id, { current: !role.current, endMonth: '', endYear: '' })}
                              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                                role.current ? 'border-gold bg-gold' : 'border-edge-strong bg-transparent'
                              }`}>
                              {role.current && <Check size={12} className="text-ink" />}
                            </button>
                            <span className="text-[14px] text-secondary">I currently work here</span>
                          </label>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-1.5 font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-azure-light">
                            <Calendar size={12} /> Start Date
                          </label>
                          <div className="flex gap-2.5">
                            <ExpSelect value={role.startMonth} onChange={v => update(role.id, { startMonth: v })} options={MONTHS} placeholder="Month" />
                            <ExpSelect value={role.startYear} onChange={v => update(role.id, { startYear: v })} options={YEARS} placeholder="Year" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-1.5 font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-azure-light">
                            <Calendar size={12} /> End Date
                          </label>
                          <div className="flex gap-2.5">
                            <ExpSelect value={role.endMonth} onChange={v => update(role.id, { endMonth: v })} options={MONTHS} placeholder="Month" disabled={role.current} />
                            <ExpSelect value={role.endYear} onChange={v => update(role.id, { endYear: v })} options={YEARS} placeholder="Year" disabled={role.current} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <label className="font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-azure-light">
                            Description / Key Achievements
                          </label>
                          <span className="rounded-md border border-azure-light/20 bg-azure-light/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-azure-light">
                            ATS Optimized Tips Available
                          </span>
                        </div>
                        <textarea
                          rows={5} placeholder="• Spearheaded the development of a cloud-native platform, increasing deployment speed by 40%…"
                          value={role.description} onChange={e => update(role.id, { description: e.target.value })}
                          className="w-full resize-none rounded-xl border border-edge bg-base/40 px-4 py-3.5 text-[14px] leading-[1.6] text-primary outline-none transition-all placeholder:text-muted focus:border-gold/50 focus:bg-gold/4 focus:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]"
                        />
                        <p className="flex items-center gap-1.5 text-[12px] text-muted">
                          <Info size={12} /> Use action verbs and quantify results where possible.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <button onClick={addRole}
        className="mx-auto mt-6 flex items-center gap-2 rounded-xl border border-dashed border-azure-light/40 bg-azure-light/4 px-6 py-3.5 text-[14px] font-semibold text-azure-light transition-all hover:border-azure-light/60 hover:bg-azure-light/8">
        <Plus size={16} /> Add Another Role
      </button>
    </div>
  );
}

// ── Education step ───────────────────────────────────────────────────────────
function EducationStep({ education, onEducationChange, certs, onCertsChange }: {
  education: EducationItem[];
  onEducationChange: (items: EducationItem[]) => void;
  certs: CertItem[];
  onCertsChange: (items: CertItem[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string>(education[0]?.id ?? '');

  const updateEdu = (id: string, patch: Partial<EducationItem>) =>
    onEducationChange(education.map(it => it.id === id ? { ...it, ...patch } : it));

  const addEdu = () => {
    const edu = emptyEdu();
    onEducationChange([...education, edu]);
    setExpandedId(edu.id);
  };

  const removeEdu = (id: string) => {
    const remaining = education.filter(it => it.id !== id);
    onEducationChange(remaining);
    if (expandedId === id) setExpandedId(remaining[remaining.length - 1]?.id ?? '');
  };

  const toggleEdu = (id: string) => setExpandedId(prev => (prev === id ? '' : id));

  const updateCert = (id: string, patch: Partial<CertItem>) =>
    onCertsChange(certs.map(it => it.id === id ? { ...it, ...patch } : it));
  const addCert = () => onCertsChange([...certs, emptyCert()]);
  const removeCert = (id: string) => onCertsChange(certs.filter(it => it.id !== id));

  const eduFilled = education.reduce((n, e) => n + [e.institution, e.degree, e.field, e.gradYear].filter(v => v.trim()).length, 0);
  const eduTotal = education.length * 4;
  const certFilled = certs.reduce((n, c) => n + [c.name, c.org].filter(v => v.trim()).length, 0);
  const certTotal = certs.length * 2;
  const total = eduTotal + certTotal;
  const percent = total === 0 ? 0 : Math.round(((eduFilled + certFilled) / total) * 100);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="mb-6 inline-flex items-center gap-1.75 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1.25">
        <span className="inline-block h-1.25 w-1.25 rounded-full bg-gold" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">Academic Portfolio</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-3.5 font-playfair text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-primary">
        Education &amp; Certifications
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-150 text-[15px] leading-[1.7] text-faint">
        Showcase your academic foundations and professional credentials. ResuMax helps align these with industry standards for better ATS ranking.
      </motion.p>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GraduationCap size={20} className="text-gold" />
          <h2 className="text-[20px] font-bold text-primary">Formal Education</h2>
        </div>
        <button onClick={addEdu}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-azure-light transition-colors hover:text-azure">
          <PlusCircle size={16} /> Add Institution
        </button>
      </div>

      <div className="mb-10 flex flex-col gap-4">
        {education.map((edu, idx) => {
          const isOpen = expandedId === edu.id;
          const title = edu.institution || `Institution ${idx + 1}`;
          const subtitle = [edu.degree, edu.gradYear].filter(Boolean).join(' · ');

          return (
            <div key={edu.id} className="overflow-hidden rounded-2xl border border-edge bg-card">
              <button
                type="button"
                onClick={() => toggleEdu(edu.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-card-hover sm:px-7"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                  <GraduationCap size={15} className="text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-primary">{title}</div>
                  {subtitle && <div className="truncate text-[12px] text-faint">{subtitle}</div>}
                </div>
                {education.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); removeEdu(edu.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeEdu(edu.id); } }}
                    aria-label="Remove institution"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-muted transition-all hover:border-pink-light/40 hover:bg-pink-light/10 hover:text-pink-light"
                  >
                    <Trash2 size={14} />
                  </span>
                )}
                <ChevronRight size={16} className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-edge px-5 pb-6 pt-5 sm:px-7">
                      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                        <ExpField label="Institution Name" placeholder="e.g. Stanford University"
                          value={edu.institution} onChange={v => updateEdu(edu.id, { institution: v })} />
                        <ExpField label="Degree" placeholder="e.g. B.S. Computer Science"
                          value={edu.degree} onChange={v => updateEdu(edu.id, { degree: v })} />
                        <ExpField label="Field of Study" placeholder="e.g. Artificial Intelligence"
                          value={edu.field} onChange={v => updateEdu(edu.id, { field: v })} />
                        <ExpField label="Graduation Year" placeholder="2023" rightIcon={Calendar}
                          value={edu.gradYear} onChange={v => updateEdu(edu.id, { gradYear: v })} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex items-center gap-2.5">
        <Award size={20} className="text-gold" />
        <h2 className="text-[20px] font-bold text-primary">Professional Certifications</h2>
      </div>

      <div className="mb-10 rounded-2xl border border-edge bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-4">
          {certs.map((cert) => (
            <motion.div key={cert.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="relative grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2"
            >
              <ExpField label="Certificate Name" placeholder="e.g. AWS Certified Solutions Architect"
                value={cert.name} onChange={v => updateCert(cert.id, { name: v })} />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <ExpField label="Issuing Organization" placeholder="e.g. Amazon Web Services"
                    value={cert.org} onChange={v => updateCert(cert.id, { org: v })} />
                </div>
                {certs.length > 1 && (
                  <button onClick={() => removeCert(cert.id)} aria-label="Remove certificate"
                    className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-edge text-muted transition-all hover:border-pink-light/40 hover:bg-pink-light/10 hover:text-pink-light">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={addCert}
            className="flex items-center gap-2 rounded-xl border border-azure-light/25 bg-azure-light/10 px-4 py-2.5 text-[13px] font-semibold text-azure-light transition-all hover:border-azure-light/40 hover:bg-azure-light/15">
            <Plus size={15} /> Add Certificate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-gold/50 bg-gold/4 p-6">
          <div className="relative z-10">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gold">Pro Tip</div>
            <p className="max-w-[90%] text-[14px] leading-[1.7] text-secondary">
              Listing relevant coursework can significantly boost your ATS score for entry-level and mid-level roles. Ensure you use industry keywords.
            </p>
          </div>
          <Lightbulb size={90} className="pointer-events-none absolute -bottom-3 i-2 text-gold/10" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-card p-6 lg:w-64">
          <div className="relative flex items-center justify-center">
            <AtsRing percent={percent} />
            <span className="absolute text-[22px] font-black text-primary">{percent}%</span>
          </div>
          <div className="mt-3 text-[14px] font-bold text-primary">ATS Score Rank</div>
          <div className="text-[12px] text-faint">Profile completion progress</div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Skills step ──────────────────────────────────────────────────────────────
function SkillsStep({ skills, onChange, onFinish }: {
  skills: string[];
  onChange: (skills: string[]) => void;
  onFinish: () => void;
}) {
  const [input, setInput] = useState('');
  const [showAll, setShowAll] = useState(false);

  const addSkill = (value: string) => {
    const v = value.trim();
    if (!v || skills.some(s => s.toLowerCase() === v.toLowerCase())) return;
    onChange([...skills, v]);
    setInput('');
  };
  const removeSkill = (value: string) => onChange(skills.filter(s => s !== value));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(input); }
  };

  const available = DEFAULT_SUGGESTIONS.filter(s => !skills.some(k => k.toLowerCase() === s.toLowerCase()));
  const visible = showAll ? available : available.slice(0, 5);
  const remaining = available.length - visible.length;

  const percent = Math.min(100, 40 + skills.length * 7);

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-3.5 font-playfair text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-primary">
        Skills &amp; Expertise
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-150 text-[15px] leading-[1.7] text-faint">
        ResuMax AI has analyzed your job history. Add specific skills to pass ATS filters and stand out to recruiters.
      </motion.p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div>
          <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">Add Manually</div>
            <div className="relative mb-5">
              <Search size={16} className="pointer-events-none absolute inset-s-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="e.g., Python, Project Management…"
                className="w-full rounded-xl border border-edge bg-base/40 py-3.5 ps-11 pe-4 text-[14px] text-primary outline-none transition-all placeholder:text-muted focus:border-gold/50 focus:bg-gold/4 focus:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]"
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <AnimatePresence>
                {skills.map(skill => (
                  <motion.button
                    key={skill}
                    type="button"
                    onClick={() => removeSkill(skill)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-[13px] font-semibold text-gold transition-colors hover:bg-gold/15"
                  >
                    {skill} <X size={13} />
                  </motion.button>
                ))}
              </AnimatePresence>
              {skills.length === 0 && (
                <span className="py-2 text-[13px] text-muted">No skills added yet — type above or pick a suggestion.</span>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">Suggested for your role</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visible.map(s => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="group flex min-h-24 flex-col justify-between rounded-xl border border-edge bg-card p-4 text-left transition-all hover:border-gold/30 hover:bg-card-hover"
                >
                  <span className="text-[14px] font-semibold text-primary">{s}</span>
                  <PlusCircle size={18} className="text-muted transition-colors group-hover:text-gold" />
                </button>
              ))}
              {remaining > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="flex min-h-24 items-center justify-center rounded-xl border border-edge bg-card-hover p-4 text-[14px] font-medium text-faint transition-colors hover:text-primary"
                >
                  View {remaining}+ more
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-azure/20 bg-azure/6 p-6 text-center">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">Estimated ATS Score</div>
            <div className="relative mx-auto flex w-fit items-center justify-center">
              <AtsRing percent={percent} />
              <span className="absolute text-[26px] font-black text-gold">{percent}%</span>
            </div>
            <p className="mt-5 text-[13px] italic leading-[1.6] text-secondary">
              &quot;Add 3 more technical skills to increase visibility for Senior Developer roles.&quot;
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-edge bg-card p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-azure-light/20 bg-azure-light/12">
              <Sparkles size={15} className="text-azure-light" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-azure-light">Pro Tip</div>
              <p className="text-[13px] leading-[1.6] text-faint">
                Skills like &apos;Public Speaking&apos; or &apos;Critical Thinking&apos; are great, but focus on industry-standard software and tools first.
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={onFinish}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink shadow-[0_8px_30px_rgba(245,166,35,0.4)] transition-all hover:-translate-y-px hover:bg-gold-light"
            >
              Finish &amp; Generate Resume <Zap size={16} />
            </button>
            <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              No credit card required • AI powered generation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ currentStep, completedSteps, onStepClick, onSaveDraft, saving, savedAt, open, onClose }: {
  currentStep: StepId; completedSteps: Set<StepId>;
  onStepClick: (id: StepId) => void; onSaveDraft: () => void;
  saving: boolean; savedAt: string | null;
  open: boolean; onClose: () => void;
}) {
  const currentNum = STEPS.find(s => s.id === currentStep)?.num ?? 1;
  const locale = useLocale();

  return (
    <aside className={`fixed inset-y-0 inset-s-0 z-50 flex h-screen w-70 min-w-70 flex-col border-e border-edge bg-soft transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:w-65 lg:min-w-65 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-6 pt-7">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={onClose} aria-label="Close menu" className="text-secondary lg:hidden">
            <X size={20} />
          </button>
        </div>
        <Link href={`/${locale}`}
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted no-underline transition-colors hover:text-secondary"
        >
          <LayoutDashboard size={12} /> Back to home
        </Link>
      </div>

      <div className="px-6 pb-6 pt-7">
        <div className="rounded-[14px] border border-gold/12 bg-gold/6 px-4.5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold text-primary">Onboarding</div>
              <div className="mt-0.5 text-xs text-faint">Step {currentNum} of {STEPS.length}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gold/25 bg-gold/12">
              <span className="text-[13px] font-extrabold text-gold">{currentNum}/{STEPS.length}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {STEPS.map(s => (
              <motion.div key={s.id}
                animate={{ background: completedSteps.has(s.id) ? 'var(--color-gold)' : s.id === currentStep ? 'color-mix(in srgb, var(--color-gold) 50%, transparent)' : 'var(--edge)' }}
                transition={{ duration: 0.3 }}
                className="h-0.75 flex-1 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-6 h-px bg-edge" />

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 px-3">
        {STEPS.map(step => {
          const Icon = step.icon;
          const isActive   = step.id === currentStep;
          const isComplete = completedSteps.has(step.id);
          const isLocked   = !isActive && !isComplete && step.num > currentNum;
          return (
            <motion.button key={step.id}
              onClick={() => !isLocked && onStepClick(step.id)}
              whileHover={!isLocked ? { x: 2 } : {}}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                isActive ? 'border-gold/15 bg-gold/10' : 'border-gold/10 bg-transparent'
              } ${isLocked ? 'cursor-default opacity-35' : 'cursor-pointer'}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition-all ${
                isActive ? 'border-gold/30 bg-gold/15' : isComplete ? 'border-green/20 bg-green/10' : 'border-edge bg-card'
              }`}>
                {isComplete ? <Check size={15} className="text-green" /> : <Icon size={15} className={isActive ? 'text-gold' : 'text-muted'} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[13px] transition-colors ${
                  isActive ? 'font-bold text-primary' : isComplete ? 'font-medium text-secondary' : 'font-medium text-secondary'
                }`}>
                  {step.label}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-faint">
                  {step.desc}
                </div>
              </div>
              {isActive && <ChevronRight size={14} className="text-gold/60" />}
            </motion.button>
          );
        })}
      </nav>

      <div className="mx-6 h-px bg-edge" />

      <div className="px-6 py-5">
        {savedAt && (
          <div className="mb-2.5 flex items-center justify-center gap-1.5">
            <Check size={11} className="text-green" />
            <span className="text-[11px] text-muted">Saved {savedAt}</span>
          </div>
        )}
        <button onClick={onSaveDraft} disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-edge bg-card py-3 text-[13px] font-semibold text-secondary transition-all hover:border-gold/20 hover:bg-gold/8 hover:text-gold disabled:cursor-not-allowed"
        >
          {saving ? <><FileText size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save Draft</>}
        </button>
      </div>
    </aside>
  );
}

function ContactStep({ data, onChange, errors }: {
  data: ContactData;
  onChange: (f: keyof ContactData, v: string) => void;
  errors: Partial<Record<keyof ContactData, string>>;
}) {
  const fields: { key: keyof ContactData; label: string; icon: React.ElementType; placeholder: string; type?: string; hint?: string; }[] = [
    { key: 'fullName', label: 'Full Name',            icon: User,     placeholder: 'e.g. Alex Sterling',                hint: 'Use your real name as it appears on official documents' },
    { key: 'title',    label: 'Professional Title',   icon: Briefcase,placeholder: 'e.g. Senior UX Designer',           hint: "Your current role or the role you're targeting" },
    { key: 'email',    label: 'Email Address',        icon: Mail,     placeholder: 'alex.sterling@example.com', type: 'email', hint: 'Use a professional email address' },
    { key: 'phone',    label: 'Phone Number',         icon: Phone,    placeholder: '+1 (555) 000-0000',         type: 'tel' },
    { key: 'location', label: 'Location',             icon: MapPin,   placeholder: 'San Francisco, CA',                 hint: 'City and country is enough — no full address needed' },
    { key: 'linkedin', label: 'LinkedIn Profile URL', icon: Link2,    placeholder: 'linkedin.com/in/alexsterling',       hint: 'Increases your callback rate by up to 40%' },
  ];
  const filledCount = Object.values(data).filter(v => v.trim()).length;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="mb-6 inline-flex items-center gap-1.75 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1.25">
        <span className="inline-block h-1.25 w-1.25 rounded-full bg-gold" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">Step 1 — Contact Info</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-3.5 font-playfair text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-primary">
        Tell us about
        <span className="block text-gradient-gold">yourself</span>
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-130 text-[15px] leading-[1.7] text-faint">
        First impressions matter. We&apos;ll use this information to build your resume header and optimize your contact details for ATS screening.
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">Section completion</span>
          <span className={`text-xs font-bold ${filledCount === 6 ? 'text-green' : 'text-gold'}`}>{filledCount}/6 fields</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-card">
          <motion.div animate={{ width: `${(filledCount / 6) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${filledCount === 6 ? 'bg-linear-to-r from-green to-green-light' : 'bg-linear-to-r from-gold to-gold-light'}`} />
        </div>
      </motion.div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        {fields.map((f, i) => (
          <motion.div key={f.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 + i * 0.06 }}>
            <FieldCard label={f.label} icon={f.icon} type={f.type} placeholder={f.placeholder}
              value={data[f.key]} onChange={v => onChange(f.key, v)} error={errors[f.key]} hint={f.hint} />
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-7 flex items-start gap-3.5 rounded-[14px] border border-azure/15 bg-azure/[0.07] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-azure-light/20 bg-azure-light/12">
          <Sparkles size={15} className="text-azure-light" />
        </div>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#93c5fd]">ATS Tip</div>
          <p className="text-[13px] leading-[1.6] text-faint">
            Recruiters spend an average of <span className="font-semibold text-secondary">6 seconds</span> on the header.
            A complete contact section increases your callback rate by up to <span className="font-semibold text-gold">60%</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const locale = useLocale();
  const [currentStep, setCurrentStep]  = useState<StepId>('contact');
  const [completedSteps, setCompleted] = useState<Set<StepId>>(new Set());
  const [saving, setSaving]            = useState(false);
  const [savedAt, setSavedAt]          = useState<string | null>(null);
  const [contact, setContact]          = useState<ContactData>({ fullName: '', title: '', email: '', phone: '', location: '', linkedin: '' });
  const [experience, setExperience]    = useState<ExperienceItem[]>([emptyRole()]);
  const [education, setEducation]      = useState<EducationItem[]>([emptyEdu()]);
  const [certs, setCerts]              = useState<CertItem[]>([emptyCert()]);
  const [skills, setSkills]            = useState<string[]>(['Strategic Planning', 'React.js', 'Team Leadership']);
  const [errors, setErrors]            = useState<Partial<Record<keyof ContactData, string>>>({});
  const [navOpen, setNavOpen]          = useState(false);

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
  const nextStep     = STEPS[currentIndex + 1];
  const prevStep     = STEPS[currentIndex - 1];

  const validateContact = (): boolean => {
    const e: Partial<Record<keyof ContactData, string>> = {};
    if (!contact.fullName.trim())                  e.fullName = 'Full name is required';
    if (!contact.title.trim())                     e.title    = 'Professional title is required';
    if (!contact.email)                            e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(contact.email)) e.email    = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await fetch('/api/resume/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('resumax_token') : ''}` },
        body: JSON.stringify({ step: currentStep, contact, experience, education, certs, skills }),
      });
      const now = new Date();
      setSavedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleNext = () => {
    if (currentStep === 'contact' && !validateContact()) return;
    setCompleted(prev => new Set(prev).add(currentStep));
    if (nextStep) setCurrentStep(nextStep.id);
  };

  const handleFinish = () => {
    setCompleted(prev => new Set(prev).add('skills'));
    // ── BACKEND: generate resume / navigate to preview ──
    // router.push(`/${locale}/resume/preview`);
  };

  const handleStepClick = (id: StepId) => {
    const clickedIdx = STEPS.findIndex(s => s.id === id);
    if (clickedIdx <= currentIndex || completedSteps.has(id)) {
      setCurrentStep(id);
    } else if (currentStep === 'contact' && validateContact()) {
      setCompleted(prev => new Set(prev).add(currentStep));
      setCurrentStep(id);
    }
  };

  const handleSidebarStep = (id: StepId) => {
    handleStepClick(id);
    setNavOpen(false);
  };

  const nextLabel: Record<StepId, string> = {
    contact: 'Next: Experience', experience: 'Next: Education',
    education: 'Next: Skills',  skills: 'Finish & Preview',
  };

  return (
    <div className="flex min-h-screen bg-base font-syne">
      <div className="pointer-events-none fixed right-[15%] top-[20%] z-0 h-100 w-100 rounded-full bg-gold/4 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[20%] right-[30%] z-0 h-75 w-75 rounded-full bg-azure/4 blur-[80px]" />

      <Sidebar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleSidebarStep}
        onSaveDraft={handleSaveDraft}
        saving={saving}
        savedAt={savedAt}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <div className="relative z-1 flex min-h-screen flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-edge bg-[color-mix(in_srgb,var(--bg-base)_92%,transparent)] px-5 py-3 backdrop-blur-xl lg:hidden">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="text-primary">
            <Menu size={22} />
          </button>
          <Logo />
          <span className="w-5.5" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-8 sm:px-8 lg:px-15 lg:pt-13">
          <div className="w-full max-w-215">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                {currentStep === 'contact' && (
                  <ContactStep data={contact}
                    onChange={(field, value) => { setContact(c => ({ ...c, [field]: value })); if (errors[field]) setErrors(e => ({ ...e, [field]: undefined })); }}
                    errors={errors} />
                )}
                {currentStep === 'experience' && (
                  <ExperienceStep items={experience} onChange={setExperience} />
                )}
                {currentStep === 'education' && (
                  <EducationStep education={education} onEducationChange={setEducation} certs={certs} onCertsChange={setCerts} />
                )}
                {currentStep === 'skills' && (
                  <SkillsStep skills={skills} onChange={setSkills} onFinish={handleFinish} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-edge bg-[color-mix(in_srgb,var(--bg-base)_95%,transparent)] px-5 py-3.5 backdrop-blur-[20px] sm:px-8 lg:px-15 lg:py-4.5">
          {prevStep ? (
            <button onClick={() => setCurrentStep(prevStep.id)}
              className="flex items-center gap-2 border-none bg-transparent py-2.5 text-sm font-semibold text-muted transition-colors hover:text-secondary">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link href={`/${locale}`}
              className="flex items-center gap-2 text-sm font-semibold text-muted no-underline transition-colors hover:text-secondary">
              <ArrowLeft size={16} /> Exit to home
            </Link>
          )}

          <div className="hidden items-center gap-2 sm:flex">
            {STEPS.map(s => (
              <motion.div key={s.id}
                transition={{ duration: 0.3 }}
                className={`h-1.5 rounded-full ${s.id === currentStep ? 'w-6' : 'w-1.5'} ${completedSteps.has(s.id) ? 'bg-green' : s.id === currentStep ? 'bg-gold' : 'bg-edge-strong'}`} />
            ))}
          </div>

          {currentStep !== 'skills' ? (
            <button onClick={handleNext}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-gold px-4 py-3.25 text-[13px] font-bold text-ink shadow-[0_6px_20px_rgba(245,166,35,0.35)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_28px_rgba(245,166,35,0.5)] sm:px-6.5 sm:text-sm">
              {nextLabel[currentStep]} <ArrowRight size={15} />
            </button>
          ) : (
            <span className="w-px" />
          )}
        </div>
      </div>

      <motion.button
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        title="AI Resume Assistant"
        className="fixed bottom-22 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-full border border-gold/25 bg-linear-to-br from-elevated to-ink-muted shadow-[0_8px_30px_var(--shadow-color)] lg:right-7"
      >
        <Sparkles size={20} className="text-gold" />
      </motion.button>
    </div>
  );
}