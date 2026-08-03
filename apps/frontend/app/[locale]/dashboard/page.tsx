'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, GraduationCap, Zap,
  Mail, Phone, MapPin, Link2, ArrowRight,
  ArrowLeft, Sparkles, Check,
  LayoutDashboard, ChevronRight, Menu, X,
  Plus, Trash2, Building2, Calendar, Info,
  Award, Lightbulb, PlusCircle, Search,
  Pencil, Loader2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';
import UserAvatarMenu from '@/components/ui/UserAvatarMenu';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import HintTooltip from '@/components/ui/HintTooltip';
import type { StepId, ContactData, ExperienceItem, EducationItem, CertItem, DashboardDraftData } from '@/lib/types/dashborad.types';
import { STEPS, MONTHS, YEARS, DEFAULT_SUGGESTIONS } from '@/lib/placeholder-data/dashboard.placeholder';
import { emptyRole, emptyEdu, emptyCert } from '@/lib/utilities/resume';
import { formatPhoneNumber } from "@/lib/utilities/phone";
import { getAvatarUrl, isUploadedAvatar } from '@/lib/utilities/avatar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { getDashboardDraft, saveDashboardDraft } from '@/lib/backend';

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

function FieldCard({
  label, icon: Icon, type = 'text', placeholder, value, onChange, error, hint, optional,
}: {
  label: string; icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; error?: string; hint?: string; optional?: boolean; maxLength?: number;
}) {
  const t = useTranslations('dashboard.contact');
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
    <div className="relative flex flex-col">
      <div className={`relative overflow-visible rounded-[14px] border px-5 py-4.5 transition-all duration-200 ${wrapState}`}>
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
          {optional && (
            <span className="rounded-full border border-edge bg-card px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em] text-gold">
              {t('optional')}
            </span>
          )}
          <div className="absolute inset-e-5 top-5 flex items-center gap-2">
            {filled && !focused && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-4 w-4 items-center justify-center rounded-full border border-green/30 bg-green/15"
              >
                <Check size={9} className="text-green" />
              </motion.div>
            )}

            {hint && <HintTooltip hint={hint} />}
          </div>
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
    </div>
  );
}

// ── Email field with in-place edit → save/cancel flow ────────────────────────
function EmailFieldCard({ label, icon: Icon, placeholder, value, error, hint, onSave }: {
  label: string; icon: React.ElementType; placeholder: string;
  value: string; error?: string; hint?: string;
  onSave: (email: string) => Promise<{ requiresVerification: boolean }>;
}) {
  const locale = useLocale();
  const t = useTranslations('dashboard.contact.email');
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editBtnRef = useRef<HTMLButtonElement>(null);

  const shown = editing ? draft : value;
  const filled = shown.length > 0;
  const trimmed = draft.trim();
  const dirty = trimmed !== value;
  const validDraft = /\S+@\S+\.\S+/.test(trimmed);
  const canSave = editing && dirty && validDraft && !saving;

  const displayError = saveError
    ?? (editing && dirty && trimmed.length > 0 && !validDraft ? t('invalidEmail') : undefined)
    ?? error;

  const startEdit = () => {
    setDraft(value);
    setSaveError(null);
    setSavedOk(false);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    if (saving) return;
    setEditing(false);
    setDraft(value);
    setSaveError(null);
    setTimeout(() => editBtnRef.current?.focus(), 0);
  };

  const saveEdit = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { requiresVerification } = await onSave(trimmed);
      setEditing(false);
      setVerifyEmail(requiresVerification ? trimmed : null);
      setSavedOk(true);
      setTimeout(() => editBtnRef.current?.focus(), 0);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const active = focused || editing;
  const wrapState = displayError
    ? 'border-pink-light/50 bg-card shadow-[0_0_0_3px_rgba(248,113,113,0.08)]'
    : active
      ? 'border-gold/60 bg-gold/4 shadow-[0_0_0_3px_rgba(245,166,35,0.1),0_8px_32px_var(--shadow-color)]'
      : filled
        ? 'border-gold/20 bg-card shadow-[0_2px_8px_var(--shadow-color)]'
        : 'border-edge bg-card shadow-[0_2px_8px_var(--shadow-color)]';

  const iconBox = active ? 'bg-gold/15' : filled ? 'bg-gold/8' : 'bg-card-hover';
  const iconColor = active ? 'text-gold' : filled ? 'text-gold/70' : 'text-muted';
  const labelColor = active ? 'text-gold' : filled ? 'text-gold/70' : 'text-faint';

  return (
    <div className="relative flex flex-col">
      <div className={`relative overflow-hidden rounded-[14px] border px-5 py-4.5 transition-all duration-200 ${wrapState}`}>
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-0 top-0 h-0.5 origin-left bg-[linear-gradient(to_right,transparent,var(--color-gold),transparent)]"
            />
          )}
        </AnimatePresence>

        <div className={`mb-2.5 flex items-center gap-2 ${hint ? 'pe-9' : ''}`}>
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${iconBox}`}>
            <Icon size={14} className={`transition-colors ${iconColor}`} />
          </div>
          <span className={`font-syne text-[11px] font-bold uppercase tracking-[0.09em] transition-colors ${labelColor}`}>
            {label}
          </span>
          {filled && !active && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="ms-auto flex h-4 w-4 items-center justify-center rounded-full border border-green/30 bg-green/15">
              <Check size={9} className="text-green" />
            </motion.div>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="email" placeholder={placeholder} value={shown}
            readOnly={!editing}
            aria-label={label}
            onChange={e => { setDraft(e.target.value); if (saveError) setSaveError(null); }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            onKeyDown={e => {
              if (!editing) return;
              if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
              if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
            }}
            className={`w-full border-none bg-transparent ps-9 font-syne text-[15px] font-medium text-primary outline-none placeholder:text-muted ${editing ? 'pe-20' : 'cursor-default pe-11'}`}
          />
          <div className="absolute inset-e-0 flex items-center gap-1.5">
            {editing ? (
              <>
                <button
                  type="button" onClick={saveEdit} disabled={!canSave}
                  aria-label={t('save')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green/30 bg-green/15 text-green transition-all hover:bg-green/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button
                  type="button" onClick={cancelEdit} disabled={saving}
                  aria-label={t('cancel')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge text-muted transition-all hover:border-pink-light/40 hover:bg-pink-light/10 hover:text-pink-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <button
                ref={editBtnRef}
                type="button" onClick={startEdit}
                aria-label={t('edit')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-card text-muted transition-all hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {hint && <HintTooltip hint={hint} className="absolute inset-e-4 top-4.5" />}

      <AnimatePresence>
        {displayError && (
          <motion.p initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 ps-1 text-[11.5px] font-medium text-pink-light">
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {savedOk && !editing && !displayError && (
          <motion.p initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 ps-1 text-[11.5px] font-medium text-green">
            {verifyEmail ? (
              <>
                {t('updatedVerify')}{' '}
                <Link href={`/${locale}/verificationcode?email=${encodeURIComponent(verifyEmail)}`}
                  className="font-semibold text-green underline underline-offset-2 hover:text-green-light">
                  {t('verifyNow')}
                </Link>
              </>
            ) : (
              t('updated')
            )}
          </motion.p>
        )}
      </AnimatePresence>
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
      <label className="flex items-center gap-1.5 font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-faint">
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
  const t = useTranslations('dashboard.experience');
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
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">{t('badge')}</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-3.5 font-playfair text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-primary">
        {t('title')}
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-130 text-[15px] leading-[1.7] text-faint">
        {t('subtitle')}
      </motion.p>

      <div className="flex flex-col gap-4">
        {items.map((role, idx) => {
          const isOpen = expandedId === role.id;
          const title = role.jobTitle || t('roleFallback', { n: idx + 1 });
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
                    aria-label={t('removeRole')}
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
                        <ExpField label={t('jobTitle.label')} placeholder={t('jobTitle.placeholder')}
                          value={role.jobTitle} onChange={v => update(role.id, { jobTitle: v })} />
                        <ExpField label={t('company.label')} icon={Building2} placeholder={t('company.placeholder')}
                          value={role.company} onChange={v => update(role.id, { company: v })} />

                        <ExpField label={t('location.label')} icon={MapPin} placeholder={t('location.placeholder')}
                          value={role.location} onChange={v => update(role.id, { location: v })} />

                        <div className="flex items-end">
                          <label className="flex cursor-pointer items-center gap-2.5 py-3">
                            <button type="button" role="checkbox" aria-checked={role.current}
                              onClick={() => update(role.id, { current: !role.current, endMonth: '', endYear: '' })}
                              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${role.current ? 'border-gold bg-gold' : 'border-edge-strong bg-transparent'
                                }`}>
                              {role.current && <Check size={12} className="text-ink" />}
                            </button>
                            <span className="text-[14px] text-secondary">{t('currentlyWorkHere')}</span>
                          </label>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-1.5 font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-faint">
                            <Calendar size={12} /> {t('startDate')}
                          </label>
                          <div className="flex gap-2.5">
                            <ExpSelect value={role.startMonth} onChange={v => update(role.id, { startMonth: v })} options={MONTHS} placeholder={t('month')} />
                            <ExpSelect value={role.startYear} onChange={v => update(role.id, { startYear: v })} options={YEARS} placeholder={t('year')} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-1.5 font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-faint">
                            <Calendar size={12} /> {t('endDate')}
                          </label>
                          <div className="flex gap-2.5">
                            <ExpSelect value={role.endMonth} onChange={v => update(role.id, { endMonth: v })} options={MONTHS} placeholder={t('month')} disabled={role.current} />
                            <ExpSelect value={role.endYear} onChange={v => update(role.id, { endYear: v })} options={YEARS} placeholder={t('year')} disabled={role.current} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <label className="font-syne text-[11px] font-bold uppercase tracking-[0.09em] text-faint">
                            {t('descriptionLabel')}
                          </label>
                          <span className="rounded-md border border-azure-light/20 bg-azure-light/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-faint">
                            {t('atsTipsAvailable')}
                          </span>
                        </div>
                        <textarea
                          rows={5} placeholder={t('descriptionPlaceholder')}
                          value={role.description} onChange={e => update(role.id, { description: e.target.value })}
                          className="w-full resize-none rounded-xl border border-edge bg-base/40 px-4 py-3.5 text-[14px] leading-[1.6] text-primary outline-none transition-all placeholder:text-muted focus:border-gold/50 focus:bg-gold/4 focus:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]"
                        />
                        <p className="flex items-center gap-1.5 text-[12px] text-muted">
                          <Info size={12} /> {t('descriptionHint')}
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
        className="mx-auto mt-6 flex items-center gap-2 rounded-xl border border-dashed border-azure-light/40 bg-azure-light/4 px-6 py-3.5 text-[14px] font-semibold text-faint transition-all hover:border-azure-light/60 hover:bg-azure-light/8">
        <Plus size={16} /> {t('addAnotherRole')}
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
  const t = useTranslations('dashboard.education');
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
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">{t('badge')}</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-3.5 font-playfair text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-primary">
        {t('title')}
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-150 text-[15px] leading-[1.7] text-faint">
        {t('subtitle')}
      </motion.p>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GraduationCap size={20} className="text-gold" />
          <h2 className="text-[20px] font-bold text-primary">{t('formalEducation')}</h2>
        </div>
        <button onClick={addEdu}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-faint transition-colors hover:text-azure">
          <PlusCircle size={16} /> {t('addInstitution')}
        </button>
      </div>

      <div className="mb-10 flex flex-col gap-4">
        {education.map((edu, idx) => {
          const isOpen = expandedId === edu.id;
          const title = edu.institution || t('institutionFallback', { n: idx + 1 });
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
                    aria-label={t('removeInstitution')}
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
                        <ExpField label={t('institutionName.label')} placeholder={t('institutionName.placeholder')}
                          value={edu.institution} onChange={v => updateEdu(edu.id, { institution: v })} />
                        <ExpField label={t('degree.label')} placeholder={t('degree.placeholder')}
                          value={edu.degree} onChange={v => updateEdu(edu.id, { degree: v })} />
                        <ExpField label={t('fieldOfStudy.label')} placeholder={t('fieldOfStudy.placeholder')}
                          value={edu.field} onChange={v => updateEdu(edu.id, { field: v })} />
                        <ExpField label={t('gradYear.label')} placeholder={t('gradYear.placeholder')} rightIcon={Calendar}
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
        <h2 className="text-[20px] font-bold text-primary">{t('professionalCertifications')}</h2>
      </div>

      <div className="mb-10 rounded-2xl border border-edge bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-4">
          {certs.map((cert) => (
            <motion.div key={cert.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="relative grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2"
            >
              <ExpField label={t('certificateName.label')} placeholder={t('certificateName.placeholder')}
                value={cert.name} onChange={v => updateCert(cert.id, { name: v })} />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <ExpField label={t('issuingOrg.label')} placeholder={t('issuingOrg.placeholder')}
                    value={cert.org} onChange={v => updateCert(cert.id, { org: v })} />
                </div>
                {certs.length > 1 && (
                  <button onClick={() => removeCert(cert.id)} aria-label={t('removeCertificate')}
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
            className="flex items-center gap-2 rounded-xl border border-azure-light/25 bg-azure-light/10 px-4 py-2.5 text-[13px] font-semibold text-faint transition-all hover:border-azure-light/40 hover:bg-azure-light/15">
            <Plus size={15} /> {t('addCertificate')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-gold/50 bg-gold/4 p-6">
          <div className="relative z-10">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gold">{t('proTip')}</div>
            <p className="max-w-[90%] text-[14px] leading-[1.7] text-secondary">
              {t('proTipText')}
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
          <div className="mt-3 text-[14px] font-bold text-primary">{t('atsScoreRank')}</div>
          <div className="text-[12px] text-faint">{t('profileCompletion')}</div>
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
  const t = useTranslations('dashboard.skills');
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
        {t('title')}
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-150 text-[15px] leading-[1.7] text-faint">
        {t('subtitle')}
      </motion.p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div>
          <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">{t('addManually')}</div>
            <div className="relative mb-5">
              <Search size={16} className="pointer-events-none absolute inset-s-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t('inputPlaceholder')}
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
                <span className="py-2 text-[13px] text-muted">{t('noneAdded')}</span>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">{t('suggestedForRole')}</div>
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
                  {t('viewMore', { count: remaining })}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-azure/20 bg-azure/6 p-6 text-center">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">{t('estimatedAtsScore')}</div>
            <div className="relative mx-auto flex w-fit items-center justify-center">
              <AtsRing percent={percent} />
              <span className="absolute text-[26px] font-black text-gold">{percent}%</span>
            </div>
            <p className="mt-5 text-[13px] italic leading-[1.6] text-secondary">
              &quot;{t('atsQuote')}&quot;
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-edge bg-card p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-azure-light/20 bg-azure-light/12">
              <Sparkles size={15} className="text-faint" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-faint">{t('proTip')}</div>
              <p className="text-[13px] leading-[1.6] text-faint">
                {t('proTipText')}
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={onFinish}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-[15px] font-bold text-ink shadow-[0_8px_30px_rgba(245,166,35,0.4)] transition-all hover:-translate-y-px hover:bg-gold-light"
            >
              {t('finishButton')} <Zap size={16} />
            </button>
            <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              {t('noCreditCard')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ currentStep, completedSteps, onStepClick, open, onClose }: {
  currentStep: StepId; completedSteps: Set<StepId>;
  onStepClick: (id: StepId) => void;
  open: boolean; onClose: () => void;
}) {
  const t = useTranslations('dashboard');
  const currentNum = STEPS.find(s => s.id === currentStep)?.num ?? 1;
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { user } = useAuth();
  const activePlanId = user?.planName ?? 'FREE';
  const planLabel: Record<'FREE' | 'PRO' | 'ENTERPRISE', string> = {
    FREE: t('plans.free'),
    PRO: t('plans.pro'),
    ENTERPRISE: t('plans.enterprise'),
  };
  const ctaLabel = activePlanId === 'FREE' ? t('upgrade') : t('managePlan');

  return (
    <aside className={`fixed inset-y-0 inset-s-0 z-50 flex h-screen w-70 min-w-70 flex-col border-e border-edge bg-soft transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:w-65 lg:min-w-65 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-6 pt-7">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`} aria-label="ResuMax home">
            <Logo />
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="text-secondary lg:hidden">
            <X size={20} />
          </button>
        </div>
        <Link href={`/${locale}`}
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted no-underline transition-colors hover:text-secondary"
        >
          <LayoutDashboard size={12} /> {t('backToHome')}
        </Link>
      </div>

      <div className="px-6 pb-6 pt-7">
        <div className="rounded-[14px] border border-gold/12 bg-gold/6 px-4.5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold text-primary">{t('onboarding')}</div>
              <div className="mt-0.5 text-xs text-faint">{t('stepOf', { current: currentNum, total: STEPS.length })}</div>
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
          const isActive = step.id === currentStep;
          const isComplete = completedSteps.has(step.id);
          const isLocked = !isActive && !isComplete && step.num > currentNum;
          return (
            <motion.button key={step.id}
              onClick={() => !isLocked && onStepClick(step.id)}
              whileHover={!isLocked ? { x: 2 } : {}}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${isActive ? 'border-gold/15 bg-gold/10' : 'border-gold/10 bg-transparent'
                } ${isLocked ? 'cursor-default opacity-35' : 'cursor-pointer'}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition-all ${isActive ? 'border-gold/30 bg-gold/15' : isComplete ? 'border-green/20 bg-green/10' : 'border-edge bg-card'
                }`}>
                {isComplete ? <Check size={15} className="text-green" /> : <Icon size={15} className={isActive ? 'text-gold' : 'text-muted'} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[13px] transition-colors ${isActive ? 'font-bold text-primary' : isComplete ? 'font-medium text-secondary' : 'font-medium text-secondary'
                  }`}>
                  {t(`steps.${step.id}.label`)}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-faint">
                  {t(`steps.${step.id}.desc`)}
                </div>
              </div>
              {isActive && <ChevronRight size={14} className={`text-gold/60 ${isRTL ? "rotate-180" : ""}`} />}
            </motion.button>
          );
        })}
      </nav>

      <div className="mx-6 h-px bg-edge" />

      <div className="px-4 py-4">
        <div className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-card-hover">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-[12px] font-bold text-ink">
              {user?.avatar ? (
                <Image
                  src={getAvatarUrl(user.avatar)}
                  alt={user?.name || t('yourAccount')}
                  width={24}
                  height={24}
                  key={user.avatar}
                  className="h-full w-full object-cover rounded-full"
                  unoptimized={isUploadedAvatar(user.avatar)}
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-primary">
                {user?.name ?? t('yourAccount')}
              </p>

              <p
                className={`text-[11px] ${activePlanId === "FREE"
                  ? "text-muted"
                  : activePlanId === "PRO"
                    ? "text-gold"
                    : "text-violet-300"
                  }`}
              >
                {planLabel[activePlanId]}
              </p>
            </div>
          </div>

          {/* Right */}
          <Link
            href={`/${locale}/pricing`}
            className="group flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            {ctaLabel}
            <ArrowRight
              size={13}
              className={`transition-transform group-hover:translate-x-0.5 ${isRTL ? "-rotate-180" : ""}`}
              
            />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function ContactStep({ data, onChange, errors, onSaveEmail }: {
  data: ContactData;
  onChange: (f: keyof ContactData, v: string) => void;
  errors: Partial<Record<keyof ContactData, string>>;
  onSaveEmail: (email: string) => Promise<{ requiresVerification: boolean }>;
}) {
  const t = useTranslations('dashboard.contact');

  const fields: { key: keyof ContactData; label: string; icon: React.ElementType; placeholder: string; type?: string; hint?: string; optional?: boolean; }[] = [
    { key: 'fullName', label: t('fields.fullName.label'), icon: User, placeholder: t('fields.fullName.placeholder'), hint: t('fields.fullName.hint') },
    { key: 'title', label: t('fields.title.label'), icon: Briefcase, placeholder: t('fields.title.placeholder'), hint: t('fields.title.hint') },
    { key: 'email', label: t('fields.email.label'), icon: Mail, placeholder: t('fields.email.placeholder'), type: 'email', hint: t('fields.email.hint') },
    { key: 'phone', label: t('fields.phone.label'), icon: Phone, placeholder: t('fields.phone.placeholder'), type: 'tel', optional: true },
    { key: 'location', label: t('fields.location.label'), icon: MapPin, placeholder: t('fields.location.placeholder'), hint: t('fields.location.hint'), optional: true },
    { key: 'linkedin', label: t('fields.linkedin.label'), icon: Link2, placeholder: t('fields.linkedin.placeholder'), hint: t('fields.linkedin.hint'), optional: true },
  ];
  const filledCount = Object.values(data).filter(v => v.trim()).length;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="mb-6 inline-flex items-center gap-1.75 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1.25">
        <span className="inline-block h-1.25 w-1.25 rounded-full bg-gold" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">{t('badge')}</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-3.5 font-playfair text-[clamp(28px,4vw,44px)] font-black leading-[1.1] text-primary">
        {t('titleLine1')}
        <span className="block text-gradient-gold">{t('titleHighlight')}</span>
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-9 max-w-130 text-[15px] leading-[1.7] text-faint">
        {t('subtitle')}
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">{t('sectionCompletion')}</span>
          <span className={`text-xs font-bold ${filledCount === 6 ? 'text-green' : 'text-gold'}`}>{t('fieldsCount', { count: filledCount })}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-card">
          <motion.div animate={{ width: `${(filledCount / 6) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${filledCount === 6 ? 'bg-linear-to-r from-green to-green-light' : 'bg-linear-to-r from-gold to-gold-light'}`} />
        </div>
      </motion.div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        {fields.map((f, i) => (
          <motion.div key={f.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 + i * 0.06 }}>
            {f.key === 'email' ? (
              <EmailFieldCard label={f.label} icon={f.icon} placeholder={f.placeholder}
                value={data.email} error={errors.email} hint={f.hint} onSave={onSaveEmail} />
            ) : f.key === 'phone' ? (
              <FieldCard label={f.label} icon={f.icon} type={f.type} placeholder={f.placeholder}
                value={data.phone}
                onChange={v => onChange('phone', formatPhoneNumber(v))}
                error={errors.phone} hint={f.hint} optional={f.optional}
                maxLength={12}
              />
            ) : (
              <FieldCard label={f.label} icon={f.icon} type={f.type} placeholder={f.placeholder}
                value={data[f.key]} onChange={v => onChange(f.key, v)} error={errors[f.key]} hint={f.hint} optional={f.optional} />
            )}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-7 flex items-start gap-3.5 rounded-[14px] border border-azure/15 bg-azure/[0.07] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-azure-light/20 bg-azure-light/12">
          <Sparkles size={15} className="text-faint" />
        </div>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#93c5fd]">{t('atsTipLabel')}</div>
          <p className="text-[13px] leading-[1.6] text-faint">
            {t.rich('atsTipText', {
              b: (chunks) => <span className="font-semibold text-secondary">{chunks}</span>,
              gold: (chunks) => <span className="font-semibold text-gold">{chunks}</span>,
            })}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tContact = useTranslations('dashboard.contact');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const templateFromQuery = searchParams.get('template');
  const isRTL = locale === "ar";
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<StepId>('contact');
  const [completedSteps, setCompleted] = useState<Set<StepId>>(new Set());
  const [contact, setContact] = useState<ContactData>({ fullName: '', title: '', email: '', phone: '', location: '', linkedin: '' });
  const [experience, setExperience] = useState<ExperienceItem[]>([emptyRole()]);
  const [education, setEducation] = useState<EducationItem[]>([emptyEdu()]);
  const [certs, setCerts] = useState<CertItem[]>([emptyCert()]);
  const [skills, setSkills] = useState<string[]>(['Strategic Planning', 'React.js', 'Team Leadership']);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactData, string>>>({});
  const [navOpen, setNavOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(templateFromQuery);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const lastQueuedDraft = useRef('');
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const token = localStorage.getItem('resumax_token');

    if (!token) {
      setContact(c => ({ ...c, fullName: c.fullName || user.name, email: c.email || user.email }));
      setDraftLoaded(true);
      return;
    }

    getDashboardDraft(token)
      .then((draft) => {
        if (cancelled) return;

        const persisted = Boolean(draft.id);
        const nextDraft: DashboardDraftData = {
          ...draft,
          template: templateFromQuery ?? draft.template,
          contact: {
            ...draft.contact,
            fullName: draft.contact.fullName || user.name,
            email: draft.contact.email || user.email,
          },
          experience: persisted ? draft.experience : [emptyRole()],
          education: persisted ? draft.education : [emptyEdu()],
          certifications: persisted ? draft.certifications : [emptyCert()],
          skills: persisted ? draft.skills : ['Strategic Planning', 'React.js', 'Team Leadership'],
        };

        setSelectedTemplate(nextDraft.template);
        setCurrentStep(nextDraft.currentStep);
        setCompleted(new Set(nextDraft.completedSteps));
        setContact(nextDraft.contact);
        setExperience(nextDraft.experience);
        setEducation(nextDraft.education);
        setCerts(nextDraft.certifications);
        setSkills(nextDraft.skills);
      })
      .catch(() => {
        if (!cancelled) toast.error('We could not load your saved resume draft.');
      })
      .finally(() => {
        if (!cancelled) setDraftLoaded(true);
      });

    return () => { cancelled = true; };
  }, [templateFromQuery, user]);

  useEffect(() => {
    if (!draftLoaded) return;

    const token = localStorage.getItem('resumax_token');
    if (!token) return;

    const draft: DashboardDraftData = {
      template: selectedTemplate,
      currentStep,
      completedSteps: [...completedSteps],
      contact,
      experience,
      education,
      certifications: certs,
      skills,
    };
    const serialized = JSON.stringify(draft);
    if (serialized === lastQueuedDraft.current) return;

    const timer = window.setTimeout(() => {
      lastQueuedDraft.current = serialized;
      saveQueue.current = saveQueue.current
        .then(async () => {
          await saveDashboardDraft(token, draft);
        })
        .catch(() => {
          lastQueuedDraft.current = '';
          toast.error('We could not save your latest dashboard changes.');
        });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [certs, completedSteps, contact, currentStep, draftLoaded, education, experience, selectedTemplate, skills]);

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
  const nextStep = STEPS[currentIndex + 1];
  const prevStep = STEPS[currentIndex - 1];

  const validateContact = (): boolean => {
    const e: Partial<Record<keyof ContactData, string>> = {};
    if (!contact.fullName.trim()) e.fullName = tContact('errors.fullNameRequired');
    if (!contact.title.trim()) e.title = tContact('errors.titleRequired');
    if (!contact.email) e.email = tContact('errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(contact.email)) e.email = tContact('errors.emailInvalid');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveEmail = async (newEmail: string) => {
    setContact((prev) => ({
      ...prev,
      email: newEmail,
    }));

    if (errors.email) {
      setErrors((prev) => ({
        ...prev,
        email: undefined,
      }));
    }

    return {
      requiresVerification: false,
    };
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
    contact: t('nextLabel.contact'),
    experience: t('nextLabel.experience'),
    education: t('nextLabel.education'),
    skills: t('nextLabel.skills'),
  };

  return (
    <div className="flex min-h-screen bg-base font-syne">
      <div className="pointer-events-none fixed right-[15%] top-[20%] z-0 h-100 w-100 rounded-full bg-gold/4 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[20%] right-[30%] z-0 h-75 w-75 rounded-full bg-azure/4 blur-[80px]" />

      <Sidebar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleSidebarStep}
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
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-edge bg-linear-to-r from-bg-base to-bg-transparent px-5 py-3 backdrop-blur-xl md:hidden">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="text-primary">
            <Menu size={22} />
          </button>
          <Logo />
          <span className="w-5.5" />
        </div>

        <div className="fixed inset-x-0 top-0 z-30 hidden h-16 md:flex lg:inset-s-65">
          <div className="absolute inset-0 -z-10 border-b border-edge bg-linear-to-r from-bg-base to-bg-transparent backdrop-blur-xl" />
          <div className="flex w-full items-center justify-end gap-3 px-8 lg:px-15">
            <ThemeToggle />
            <LanguageSwitcher />
            <UserAvatarMenu />
          </div>
        </div>
        <div className="hidden h-16 shrink-0 md:block" aria-hidden />

        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-8 sm:px-8 lg:px-15 lg:pt-13">
          <div className="w-full max-w-215">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                {currentStep === 'contact' && (
                  <ContactStep data={contact}
                    onChange={(field, value) => { setContact(c => ({ ...c, [field]: value })); if (errors[field]) setErrors(e => ({ ...e, [field]: undefined })); }}
                    errors={errors} onSaveEmail={handleSaveEmail} />
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

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-edge bg-linear-to-r from-bg-base to-bg-transparent px-5 py-3.5 backdrop-blur-[20px] sm:px-8 lg:px-15 lg:py-4.5">
          {prevStep ? (
            <button onClick={() => setCurrentStep(prevStep.id)}
              className="flex items-center gap-2 border-none bg-transparent py-2.5 text-sm font-semibold text-muted transition-colors hover:text-secondary">
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} /> {t('back')}
            </button>
          ) : (
            <Link href={`/${locale}`}
              className="flex items-center gap-2 text-sm font-semibold text-muted no-underline transition-colors hover:text-secondary">
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} /> {t('exitToHome')}
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
              {nextLabel[currentStep]} <ArrowRight size={15} className={isRTL ? "rotate-180" : ""} />
            </button>
          ) : (
            <span className="w-px" />
          )}
        </div>
      </div>

      <motion.button
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        title={t('aiAssistant')}
        className={`fixed bottom-22 z-50 flex h-13 w-13 items-center justify-center rounded-full border border-gold/25 bg-linear-to-br from-elevated to-ink-muted shadow-[0_8px_30px_var(--shadow-color)]  ${isRTL ? "left-5 lg:left-7" : "right-5  lg:right-7"}`}
      >
        <Sparkles size={20} className="text-gold" />
      </motion.button>
    </div>
  );
}
