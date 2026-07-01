'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, GraduationCap, Zap,
  Mail, Phone, MapPin, Link2, ArrowRight,
  ArrowLeft, Save, Sparkles, Check,
  LayoutDashboard, ChevronRight, FileText, Menu, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

type StepId = 'contact' | 'experience' | 'education' | 'skills';

interface ContactData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

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

function FieldCard({
  label, icon: Icon, type = 'text', placeholder, value, onChange, error, hint,
}: {
  label: string; icon: React.ElementType; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; error?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;

  // Border + bg by state (fixed set → static classes)
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

function Sidebar({ currentStep, completedSteps, onStepClick, onSaveDraft, saving, savedAt, open, onClose }: {
  currentStep: StepId; completedSteps: Set<StepId>;
  onStepClick: (id: StepId) => void; onSaveDraft: () => void;
  saving: boolean; savedAt: string | null;
  open: boolean; onClose: () => void;
}) {
  const currentNum = STEPS.find(s => s.id === currentStep)?.num ?? 1;
  const locale = useLocale();

  return (
    <aside className={`fixed inset-y-0 start-0 z-50 flex h-screen w-[280px] min-w-[280px] flex-col border-e border-edge bg-soft transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:w-[260px] lg:min-w-[260px] lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
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

function ComingSoonStep({ stepId }: { stepId: StepId }) {
  const config = {
    experience: { icon: Briefcase,     label: 'Work Experience', dot: 'bg-azure-light', iconText: 'text-azure-light', box: 'border-azure-light/15 bg-azure-light/[0.08]', desc: 'Add your work history, job titles, responsibilities, and key achievements.' },
    education:  { icon: GraduationCap, label: 'Education',       dot: 'bg-vilot',       iconText: 'text-vilot',       box: 'border-vilot/15 bg-vilot/[0.08]',                desc: 'List your degrees, institutions, graduation years, and academic honors.' },
    skills:     { icon: Zap,           label: 'Skills',          dot: 'bg-teal-light',  iconText: 'text-teal-light',  box: 'border-teal-light/15 bg-teal-light/[0.08]',      desc: 'Showcase your technical skills, tools, languages, and soft skills.' },
  }[stepId as 'experience' | 'education' | 'skills'];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex min-h-110 flex-col items-center justify-center px-10 text-center">
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={`mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border-[1.5px] ${config.box}`}>
        <Icon size={36} className={config.iconText} />
      </motion.div>
      <h2 className="mb-3 font-playfair text-[32px] font-black text-primary">{config.label}</h2>
      <p className="mb-7 max-w-110 text-[15px] leading-[1.7] text-faint">{config.desc}</p>
      <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-card px-4.5 py-2">
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        <span className="text-[13px] text-faint">Coming in the next build</span>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const locale = useLocale();
  const [currentStep, setCurrentStep]  = useState<StepId>('contact');
  const [completedSteps, setCompleted] = useState<Set<StepId>>(new Set());
  const [saving, setSaving]            = useState(false);
  const [savedAt, setSavedAt]          = useState<string | null>(null);
  const [contact, setContact]          = useState<ContactData>({ fullName: '', title: '', email: '', phone: '', location: '', linkedin: '' });
  const [errors, setErrors]            = useState<Partial<Record<keyof ContactData, string>>>({});
  const [navOpen, setNavOpen] = useState(false);


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
        body: JSON.stringify({ step: 'contact', contact }),
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

  const handleSidebarStep = (id: StepId) => {
    handleStepClick(id);
    setNavOpen(false);
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

      {/* Mobile drawer backdrop */}
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
          <span className="w-[22px]" /> {/* spacer to center logo */}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-8 sm:px-8 lg:px-[60px] lg:pt-[52px]">
          <div className="w-full max-w-215">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                {currentStep === 'contact' && (
                  <ContactStep data={contact}
                    onChange={(field, value) => { setContact(c => ({ ...c, [field]: value })); if (errors[field]) setErrors(e => ({ ...e, [field]: undefined })); }}
                    errors={errors} />
                )}
                {currentStep !== 'contact' && <ComingSoonStep stepId={currentStep} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-edge bg-[color-mix(in_srgb,var(--bg-base)_95%,transparent)] px-5 py-[14px] backdrop-blur-[20px] sm:px-8 lg:px-[60px] lg:py-[18px]">
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

          <button onClick={handleNext}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gold px-4 py-[13px] text-[13px] font-bold text-[#0a0b0f] shadow-[0_6px_20px_rgba(245,166,35,0.35)] transition-all hover:-translate-y-px hover:bg-gold-light hover:shadow-[0_10px_28px_rgba(245,166,35,0.5)] sm:px-[26px] sm:text-sm">
            {nextLabel[currentStep]} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <motion.button
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        title="AI Resume Assistant"
        className="fixed bottom-[88px] right-5 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-gold/25 bg-linear-to-br from-elevated to-ink-muted shadow-[0_8px_30px_var(--shadow-color)] lg:right-7"
      >
        <Sparkles size={20} className="text-gold" />
      </motion.button>
    </div>
  );
}