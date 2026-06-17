'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, GraduationCap, Zap,
  Mail, Phone, MapPin, Link2, ArrowRight,
  ArrowLeft, Save, Sparkles, Check,
  LayoutDashboard, ChevronRight, FileText,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <motion.div
        animate={{
          borderColor: error ? 'rgba(248,113,113,0.5)' : focused ? 'rgba(245,166,35,0.6)' : filled ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.07)',
          background: focused ? 'rgba(245,166,35,0.04)' : 'rgba(255,255,255,0.03)',
          boxShadow: focused ? '0 0 0 3px rgba(245,166,35,0.1), 0 8px 32px rgba(0,0,0,0.3)' : error ? '0 0 0 3px rgba(248,113,113,0.08)' : '0 2px 8px rgba(0,0,0,0.2)',
        }}
        transition={{ duration: 0.18 }}
        style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px', background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}
      >
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #f5a623, transparent)', transformOrigin: 'left' }}
            />
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: focused ? 'rgba(245,166,35,0.15)' : filled ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.05)',
            transition: 'background 0.2s',
          }}>
            <Icon size={14} color={focused ? '#f5a623' : filled ? 'rgba(245,166,35,0.7)' : 'rgba(255,255,255,0.3)'} style={{ transition: 'color 0.2s' }} />
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' as const,
            color: focused ? '#f5a623' : filled ? 'rgba(245,166,35,0.7)' : 'rgba(255,255,255,0.35)',
            transition: 'color 0.2s', fontFamily: 'Syne, system-ui, sans-serif',
          }}>
            {label}
          </span>
          {filled && !focused && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={9} color="#4ade80" />
            </motion.div>
          )}
        </div>

        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontWeight: 500, color: filled ? '#fff' : 'rgba(255,255,255,0.25)', fontFamily: 'Syne, system-ui, sans-serif', paddingLeft: 36 }}
        />
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
            style={{ color: '#f87171', fontSize: 11.5, fontWeight: 500, marginTop: 6, paddingLeft: 4 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {hint && !error && (
        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, marginTop: 5, paddingLeft: 4 }}>{hint}</p>
      )}
    </div>
  );
}

function Sidebar({ currentStep, completedSteps, onStepClick, onSaveDraft, saving, savedAt }: {
  currentStep: StepId; completedSteps: Set<StepId>;
  onStepClick: (id: StepId) => void; onSaveDraft: () => void;
  saving: boolean; savedAt: string | null;
}) {
  const currentNum = STEPS.find(s => s.id === currentStep)?.num ?? 1;
  const locale = useLocale();

  return (
    <aside style={{ width: 260, minWidth: 260, height: '100vh', background: '#0d0f18', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0 }}>

      <div style={{ padding: '28px 24px 0' }}>
        <Logo />
        <Link href={`/${locale}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
        >
          <LayoutDashboard size={12} /> Back to home
        </Link>
      </div>

      <div style={{ padding: '28px 24px 24px' }}>
        <div style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.12)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Onboarding</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Step {currentNum} of {STEPS.length}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,166,35,0.12)', border: '2px solid rgba(245,166,35,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#f5a623', fontSize: 13, fontWeight: 800 }}>{currentNum}/{STEPS.length}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {STEPS.map(s => (
              <motion.div key={s.id}
                animate={{ background: completedSteps.has(s.id) ? '#f5a623' : s.id === currentStep ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.08)' }}
                transition={{ duration: 0.3 }}
                style={{ flex: 1, height: 3, borderRadius: 99 }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.4)', margin: '0 24px' }} />

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {STEPS.map(step => {
          const Icon = step.icon;
          const isActive   = step.id === currentStep;
          const isComplete = completedSteps.has(step.id);
          const isLocked   = !isActive && !isComplete && step.num > currentNum;
          return (
            <motion.button key={step.id}
              onClick={() => !isLocked && onStepClick(step.id)}
              whileHover={!isLocked ? { x: 2 } : {}}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: isActive ? 'rgba(245,166,35,0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(245,166,35,0.15)' : '1px solid rgba(245,166,35,0.10)',
                cursor: isLocked ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s',
                opacity: isLocked ? 0.35 : 1,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'rgba(245,166,35,0.15)' : isComplete ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1px solid rgba(245,166,35,0.3)' : isComplete ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.6)',
                transition: 'all 0.2s',
              }}>
                {isComplete ? <Check size={15} color="#4ade80" /> : <Icon size={15} color={isActive ? '#f5a623' : 'rgba(255,255,255,0.3)'} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : isComplete ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.8)', transition: 'color 0.2s' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {step.desc}
                </div>
              </div>
              {isActive && <ChevronRight size={14} color="rgba(245,166,35,0.6)" />}
            </motion.button>
          );
        })}
      </nav>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.4)', margin: '0 24px' }} />

      <div style={{ padding: '20px 24px' }}>
        {savedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, justifyContent: 'center' }}>
            <Check size={11} color="#4ade80" />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Saved {savedAt}</span>
          </div>
        )}
        <button onClick={onSaveDraft} disabled={saving}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (!saving) { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(245,166,35,0.08)'; el.style.borderColor = 'rgba(245,166,35,0.2)'; el.style.color = '#f5a623'; } }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.borderColor = 'rgba(255,255,255,0.09)'; el.style.color = 'rgba(255,255,255,0.55)'; }}
        >
          {saving ? <><FileText size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={13} /> Save Draft</>}
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
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 9999, padding: '5px 14px', marginBottom: 24 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f5a623', display: 'inline-block' }} />
        <span style={{ color: '#f5a623', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 1 — Contact Info</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 14, fontFamily: 'Playfair Display, serif', color: '#fff' }}>
        Tell us about
        <span style={{ display: 'block', background: 'linear-gradient(135deg, #f5a623, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          yourself
        </span>
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, maxWidth: 520, marginBottom: 36 }}>
        First impressions matter. We&apos;ll use this information to build your resume header and optimize your contact details for ATS screening.
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 500 }}>Section completion</span>
          <span style={{ color: filledCount === 6 ? '#4ade80' : '#f5a623', fontSize: 12, fontWeight: 700 }}>{filledCount}/6 fields</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${(filledCount / 6) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 99, background: filledCount === 6 ? 'linear-gradient(to right, #4ade80, #22c55e)' : 'linear-gradient(to right, #f5a623, #fbbf24)' }} />
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        {fields.map((f, i) => (
          <motion.div key={f.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 + i * 0.06 }}>
            <FieldCard label={f.label} icon={f.icon} type={f.type} placeholder={f.placeholder}
              value={data[f.key]} onChange={v => onChange(f.key, v)} error={errors[f.key]} hint={f.hint} />
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
        style={{ marginTop: 28, padding: '16px 20px', background: 'rgba(29,78,216,0.07)', border: '1px solid rgba(29,78,216,0.15)', borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={15} color="#3b82f6" />
        </div>
        <div>
          <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>ATS Tip</div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>
            Recruiters spend an average of <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>6 seconds</span> on the header.
            A complete contact section increases your callback rate by up to <span style={{ color: '#f5a623', fontWeight: 600 }}>60%</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function ComingSoonStep({ stepId }: { stepId: StepId }) {
  const config = {
    experience: { icon: Briefcase,     label: 'Work Experience', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.15)',  desc: 'Add your work history, job titles, responsibilities, and key achievements.' },
    education:  { icon: GraduationCap, label: 'Education',       color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)', desc: 'List your degrees, institutions, graduation years, and academic honors.' },
    skills:     { icon: Zap,           label: 'Skills',          color: '#14b8a6', bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.15)',  desc: 'Showcase your technical skills, tools, languages, and soft skills.' },
  }[stepId as 'experience' | 'education' | 'skills'];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440, textAlign: 'center', padding: '0 40px' }}>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 80, height: 80, borderRadius: 24, background: config.bg, border: `1.5px solid ${config.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: `0 0 40px ${config.bg}` }}>
        <Icon size={36} color={config.color} />
      </motion.div>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12, fontFamily: 'Playfair Display, serif' }}>{config.label}</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, maxWidth: 400, marginBottom: 28 }}>{config.desc}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9999, padding: '8px 18px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Coming in the next build</span>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0b0f', fontFamily: 'Syne, system-ui, sans-serif' }}>
      <div style={{ position: 'fixed', top: '20%', right: '15%', width: 400, height: 400, background: 'rgba(245,166,35,0.04)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '30%', width: 300, height: 300, background: 'rgba(29,78,216,0.04)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      <Sidebar currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleStepClick} onSaveDraft={handleSaveDraft} saving={saving} savedAt={savedAt} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '52px 60px 40px' }}>
          <div style={{ maxWidth: 860, width: '100%' }}>
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

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px 60px', background: 'rgba(10,11,15,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: 0, zIndex: 10 }}>
          {prevStep ? (
            <button onClick={() => setCurrentStep(prevStep.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 600, transition: 'color 0.2s', padding: '10px 0' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link href={`/${locale}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
              <ArrowLeft size={16} /> Exit to home
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {STEPS.map(s => (
              <motion.div key={s.id}
                animate={{ width: s.id === currentStep ? 24 : 6, background: completedSteps.has(s.id) ? '#4ade80' : s.id === currentStep ? '#f5a623' : 'rgba(255,255,255,0.12)' }}
                transition={{ duration: 0.3 }}
                style={{ height: 6, borderRadius: 99 }} />
            ))}
          </div>

          <button onClick={handleNext}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f5a623', color: '#0a0b0f', fontSize: 14, fontWeight: 700, padding: '13px 26px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 6px 20px rgba(245,166,35,0.35)' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fbbf24'; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 10px 28px rgba(245,166,35,0.5)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f5a623'; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 6px 20px rgba(245,166,35,0.35)'; }}>
            {nextLabel[currentStep]} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <motion.button
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        title="AI Resume Assistant"
        style={{ position: 'fixed', bottom: 88, right: 28, zIndex: 50, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #13141a, #1e2028)', border: '1px solid rgba(245,166,35,0.25)', boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,166,35,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={20} color="#f5a623" />
      </motion.button>
    </div>
  );
}