"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  Code2,
  Crown,
  FilePlus2,
  GraduationCap,
  HeartPulse,
  LayoutTemplate,
  Loader2,
  Palette,
  PenLine,
  RefreshCw,
  Rocket,
  Save,
  Shapes,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  WandSparkles,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/auth/token";
import { getDashboardDraft, saveDashboardDraft } from "@/lib/backend";
import {
  loadOnboardingState,
  saveOnboardingState,
} from "@/lib/onboarding-storage";
import type { DashboardDraftData } from "@/lib/types/dashboard.types";
import type {
  CareerField,
  EducationLevel,
  ExperienceLevel,
  OnboardingData,
  ResumeTemplateChoice,
  SurveyPurpose,
} from "@/lib/types/onboarding.types";
import {
  emptyCert,
  emptyEdu,
  emptyRole,
  emptySkillGroup,
} from "@/lib/utilities/resume";

type SurveyStepId =
  | "purpose"
  | "experienceLevel"
  | "field"
  | "targetRole"
  | "educationLevel"
  | "skills"
  | "template";

const STEPS: SurveyStepId[] = [
  "purpose",
  "experienceLevel",
  "field",
  "targetRole",
  "educationLevel",
  "skills",
  "template",
];

const PURPOSE_OPTIONS: SurveyPurpose[] = [
  "firstResume",
  "newJob",
  "internship",
  "careerChange",
];

const EXPERIENCE_OPTIONS: ExperienceLevel[] = [
  "none",
  "junior",
  "mid",
  "senior",
];

const FIELD_OPTIONS: CareerField[] = [
  "technology",
  "design",
  "business",
  "finance",
  "health",
  "education",
  "engineering",
  "other",
];

const ROLE_OPTIONS: Record<Exclude<CareerField, "">, string[]> = {
  technology: [
    "frontendDeveloper",
    "backendDeveloper",
    "fullStackDeveloper",
    "softwareEngineer",
    "dataAnalyst",
    "cybersecuritySpecialist",
  ],
  design: [
    "graphicDesigner",
    "uiUxDesigner",
    "productDesigner",
    "motionDesigner",
    "brandDesigner",
    "contentDesigner",
  ],
  business: [
    "projectCoordinator",
    "projectManager",
    "hrSpecialist",
    "marketingSpecialist",
    "operationsOfficer",
    "businessDevelopmentOfficer",
  ],
  finance: [
    "accountant",
    "financialAnalyst",
    "auditor",
    "financeOfficer",
    "payrollSpecialist",
    "bankingOfficer",
  ],
  health: [
    "dietitian",
    "nurse",
    "publicHealthOfficer",
    "pharmacist",
    "physiotherapist",
    "labTechnician",
  ],
  education: [
    "teacher",
    "trainer",
    "educationCoordinator",
    "academicResearcher",
    "schoolCounselor",
    "curriculumSpecialist",
  ],
  engineering: [
    "civilEngineer",
    "electricalEngineer",
    "mechanicalEngineer",
    "architecturalEngineer",
    "industrialEngineer",
    "siteEngineer",
  ],
  other: [
    "administrativeAssistant",
    "customerServiceRepresentative",
    "communityOfficer",
    "salesRepresentative",
    "dataEntryClerk",
    "logisticsOfficer",
  ],
};

const EDUCATION_OPTIONS: EducationLevel[] = [
  "highSchool",
  "diploma",
  "bachelor",
  "master",
  "doctorate",
];

const SKILL_OPTIONS: Record<Exclude<CareerField, "">, string[]> = {
  technology: [
    "webDevelopment",
    "programming",
    "problemSolving",
    "dataAnalysis",
    "teamwork",
    "projectManagement",
    "communication",
    "research",
  ],
  design: [
    "uiDesign",
    "creativity",
    "communication",
    "teamwork",
    "projectManagement",
    "marketing",
    "problemSolving",
    "timeManagement",
  ],
  business: [
    "leadership",
    "projectManagement",
    "communication",
    "marketing",
    "excel",
    "customerService",
    "teamwork",
    "timeManagement",
  ],
  finance: [
    "accounting",
    "excel",
    "dataAnalysis",
    "reporting",
    "problemSolving",
    "timeManagement",
    "communication",
    "research",
  ],
  health: [
    "healthEducation",
    "communication",
    "research",
    "dataAnalysis",
    "teamwork",
    "caseManagement",
    "timeManagement",
    "customerService",
  ],
  education: [
    "teaching",
    "communication",
    "research",
    "leadership",
    "teamwork",
    "timeManagement",
    "projectManagement",
    "problemSolving",
  ],
  engineering: [
    "engineeringDesign",
    "problemSolving",
    "projectManagement",
    "dataAnalysis",
    "excel",
    "teamwork",
    "timeManagement",
    "research",
  ],
  other: [
    "communication",
    "teamwork",
    "problemSolving",
    "timeManagement",
    "excel",
    "leadership",
    "projectManagement",
    "customerService",
  ],
};

const EMPTY_ANSWERS: OnboardingData = {
  purpose: "",
  experienceLevel: "",
  field: "",
  targetRole: "",
  customTargetRole: "",
  educationLevel: "",
  skills: [],
  template: "",
};

function recommendedTemplate(answers: OnboardingData): ResumeTemplateChoice {
  if (answers.experienceLevel === "senior") return "executive";
  if (
    answers.purpose === "internship" ||
    answers.experienceLevel === "none"
  ) {
    return "academic";
  }
  if (answers.field === "technology") return "developer";
  if (answers.field === "design") return "director";
  if (answers.purpose === "careerChange") return "global";
  return "minimal";
}

function templateChoices(answers: OnboardingData): ResumeTemplateChoice[] {
  const recommended = recommendedTemplate(answers);
  return Array.from(
    new Set<ResumeTemplateChoice>([
      recommended,
      "minimal",
      "global",
      "executive",
      "academic",
      "developer",
      "director",
    ]),
  ).slice(0, 4);
}

function stepIcon(step: SurveyStepId): ReactNode {
  switch (step) {
    case "purpose":
      return <Target size={18} />;
    case "experienceLevel":
      return <BarChart3 size={18} />;
    case "field":
      return <BriefcaseBusiness size={18} />;
    case "targetRole":
      return <Target size={18} />;
    case "educationLevel":
      return <GraduationCap size={18} />;
    case "skills":
      return <WandSparkles size={18} />;
    case "template":
      return <LayoutTemplate size={18} />;
  }
}

function optionIcon(step: SurveyStepId, option: string): ReactNode {
  if (step === "purpose") {
    if (option === "firstResume") return <FilePlus2 size={19} />;
    if (option === "newJob") return <BriefcaseBusiness size={19} />;
    if (option === "internship") return <GraduationCap size={19} />;
    return <RefreshCw size={19} />;
  }

  if (step === "experienceLevel") {
    if (option === "none") return <Sprout size={19} />;
    if (option === "junior") return <Rocket size={19} />;
    if (option === "mid") return <TrendingUp size={19} />;
    return <Crown size={19} />;
  }

  if (step === "field") {
    if (option === "technology") return <Code2 size={19} />;
    if (option === "design") return <Palette size={19} />;
    if (option === "business") return <Building2 size={19} />;
    if (option === "finance") return <Calculator size={19} />;
    if (option === "health") return <HeartPulse size={19} />;
    if (option === "education") return <BookOpen size={19} />;
    if (option === "engineering") return <Wrench size={19} />;
    return <Shapes size={19} />;
  }

  if (step === "targetRole") return <BriefcaseBusiness size={19} />;
  if (step === "educationLevel") return <GraduationCap size={19} />;

  return <LayoutTemplate size={19} />;
}

function stepIsComplete(step: SurveyStepId, answers: OnboardingData) {
  if (step === "skills") return answers.skills.length >= 3;
  if (step === "targetRole") {
    return Boolean(answers.targetRole || answers.customTargetRole.trim());
  }
  return Boolean(answers[step]);
}

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const isRTL = locale === "ar";

  const [answers, setAnswers] = useState<OnboardingData>(EMPTY_ANSWERS);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const step = STEPS[currentStep];
  const recommended = recommendedTemplate(answers);
  const availableTemplates = useMemo(() => templateChoices(answers), [answers]);
  const availableSkills = answers.field
    ? SKILL_OPTIONS[answers.field]
    : SKILL_OPTIONS.other;
  const availableRoles = answers.field
    ? ROLE_OPTIONS[answers.field]
    : ROLE_OPTIONS.other;
  const progress = finished ? 100 : ((currentStep + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (!user?.id) return;

    const token = getAccessToken();
    if (!token) {
      router.replace(`/${locale}`);
      return;
    }

    const timer = window.setTimeout(() => {
      const stored = loadOnboardingState(user?.id);
      if (stored) {
        setAnswers(stored.answers);
        setCurrentStep(
          Math.min(Math.max(stored.currentStep, 0), STEPS.length - 1),
        );
        setFinished(Boolean(stored.completed && stored.dashboardSynced));
      }
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [locale, router, user?.id]);

  useEffect(() => {
    if (loading || !user?.id) return;
    const timer = window.setTimeout(() => {
      saveOnboardingState({
        answers,
        currentStep,
        completed: finished,
        dashboardSynced: finished,
      }, user?.id);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [answers, currentStep, finished, loading, user?.id]);

  function chooseOption(value: string) {
    setAnswers((previous) => {
      if (step === "purpose") {
        return { ...previous, purpose: value as SurveyPurpose, template: "" };
      }
      if (step === "experienceLevel") {
        return {
          ...previous,
          experienceLevel: value as ExperienceLevel,
          template: "",
        };
      }
      if (step === "field") {
        return {
          ...previous,
          field: value as CareerField,
          targetRole: "",
          customTargetRole: "",
          skills: [],
          template: "",
        };
      }
      if (step === "targetRole") {
        return { ...previous, targetRole: value, customTargetRole: "" };
      }
      if (step === "educationLevel") {
        return { ...previous, educationLevel: value as EducationLevel };
      }
      if (step === "template") {
        return { ...previous, template: value as ResumeTemplateChoice };
      }
      return previous;
    });
  }

  function updateCustomRole(value: string) {
    setAnswers((previous) => ({
      ...previous,
      targetRole: "",
      customTargetRole: value,
    }));
  }

  function toggleSkill(skill: string) {
    setAnswers((previous) => {
      const selected = previous.skills.includes(skill);
      if (selected) {
        return {
          ...previous,
          skills: previous.skills.filter((item) => item !== skill),
        };
      }
      if (previous.skills.length >= 5) return previous;
      return { ...previous, skills: [...previous.skills, skill] };
    });
  }

  function goBack() {
    if (currentStep === 0) return;
    setDirection(-1);
    setCurrentStep((previous) => previous - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function syncToDashboard() {
    const token = getAccessToken();
    if (!token) {
      router.replace(`/${locale}`);
      return false;
    }

    setSaving(true);
    try {
      const currentDraft = await getDashboardDraft(token);
      if ("error" in currentDraft) {
        throw new Error(currentDraft.error);
      }

      const translatedSkills = answers.skills.map((skill) =>
        t(`quick.skillOptions.${skill}`),
      );
      const translatedRole = answers.customTargetRole.trim()
        ? answers.customTargetRole.trim()
        : t(`quick.roleOptions.${answers.targetRole}`);
      const translatedDegree = t(
        `steps.education.options.${answers.educationLevel}.title`,
      );
      const mergedSkills = Array.from(
        new Set([...currentDraft.skills, ...translatedSkills]),
      ).filter(Boolean);
      const currentSkillGroups = currentDraft.skillGroups ?? [];
      const primarySkillGroup =
        currentSkillGroups[0] ?? emptySkillGroup(t("quick.skillsCategory"));
      const mergedPrimaryGroup = {
        ...primarySkillGroup,
        label: primarySkillGroup.label || t("quick.skillsCategory"),
        skills: Array.from(
          new Set([...primarySkillGroup.skills, ...translatedSkills]),
        ).filter(Boolean),
      };
      const firstEducation = currentDraft.education[0] ?? emptyEdu();

      const nextDraft: DashboardDraftData = {
        ...currentDraft,
        template: answers.template,
        currentStep: currentDraft.currentStep || "contact",
        completedSteps: currentDraft.completedSteps || [],
        contact: {
          ...currentDraft.contact,
          fullName: currentDraft.contact.fullName || user?.name || "",
          email: currentDraft.contact.email || user?.email || "",
          title: translatedRole,
        },
        experience: currentDraft.experience.length
          ? currentDraft.experience
          : [emptyRole()],
        education: [
          { ...firstEducation, degree: translatedDegree },
          ...currentDraft.education.slice(1),
        ],
        certifications: currentDraft.certifications.length
          ? currentDraft.certifications
          : [emptyCert()],
        skillGroups: [mergedPrimaryGroup, ...currentSkillGroups.slice(1)],
        skills: mergedSkills,
      };

      const savedDraft = await saveDashboardDraft(token, nextDraft);
      if ("error" in savedDraft) {
        throw new Error(savedDraft.error);
      }

      return true;
    } catch {
      toast.error(t("errors.dashboardSave"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    if (!stepIsComplete(step, answers) || saving) return;

    if (currentStep === STEPS.length - 1) {
      const synced = await syncToDashboard();
      if (!synced) return;
      saveOnboardingState({
        answers,
        currentStep,
        completed: true,
        dashboardSynced: true,
      }, user?.id);
      setFinished(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setDirection(1);
    setCurrentStep((previous) => previous + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveAndExit() {
    saveOnboardingState({
      answers,
      currentStep,
      completed: finished,
      dashboardSynced: finished,
    }, user?.id);
    router.push(`/${locale}`);
  }

  function stepTitle() {
    if (step === "targetRole") return t("quick.targetRoleQuestion.title");
    if (step === "educationLevel") return t("steps.education.title");
    if (step === "skills") return t("quick.skillsQuestion.title");
    if (step === "template") return t("quick.templateQuestion.title");
    return t(`steps.${step}.title`);
  }

  function stepDescription() {
    if (step === "targetRole") {
      return t("quick.targetRoleQuestion.description");
    }
    if (step === "educationLevel") return t("steps.education.description");
    if (step === "skills") return t("quick.skillsQuestion.description");
    if (step === "template") return t("quick.templateQuestion.description");
    return t(`steps.${step}.description`);
  }

  function stepOptions() {
    if (step === "purpose") return PURPOSE_OPTIONS;
    if (step === "experienceLevel") return EXPERIENCE_OPTIONS;
    if (step === "field") return FIELD_OPTIONS;
    if (step === "targetRole") return availableRoles;
    if (step === "educationLevel") return EDUCATION_OPTIONS;
    if (step === "template") return availableTemplates;
    return [];
  }

  function selectedOption() {
    if (step === "purpose") return answers.purpose;
    if (step === "experienceLevel") return answers.experienceLevel;
    if (step === "field") return answers.field;
    if (step === "targetRole") return answers.targetRole;
    if (step === "educationLevel") return answers.educationLevel;
    if (step === "template") return answers.template;
    return "";
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-base text-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={29} className="animate-spin text-gold" />
          <p className="text-sm font-semibold text-secondary">{t("loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-dvh overflow-x-hidden bg-base font-syne text-primary"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,166,35,0.11),transparent_42%)]" />
        <div className="absolute -start-48 top-1/3 h-96 w-96 rounded-full bg-azure/5 blur-3xl" />
        <div className="absolute -end-48 bottom-0 h-96 w-96 rounded-full bg-gold/6 blur-3xl" />
      </div>

      <header className="relative z-30 border-b border-edge bg-base/85 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-360 items-center justify-between px-4 sm:h-19 sm:px-7 lg:px-10">
          <Link href={`/${locale}`} aria-label="ResuMax home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted sm:flex">
            <span>{t("surveyLabel")}</span>
            <span className="h-1 w-1 rounded-full bg-gold" />
            <span className="text-secondary">
              {t("stepCounter", {
                current: currentStep + 1,
                total: STEPS.length,
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={saveAndExit}
              aria-label={t("saveExit")}
              className="ms-1 inline-flex h-10 items-center gap-2 rounded-xl border border-edge bg-elevated px-3 text-[11px] font-bold text-secondary transition-colors hover:border-edge-strong hover:text-primary sm:px-4"
            >
              <Save size={14} className="hidden sm:block" />
              <span className="hidden sm:inline">{t("saveExit")}</span>
              <X size={15} className="sm:hidden" />
            </button>
          </div>
        </div>

        <div className="h-0.75 bg-edge">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-linear-to-r from-gold-dark via-gold to-gold-light"
          />
        </div>
      </header>

      {finished ? (
        <CompletionScreen
          locale={locale}
          isRTL={isRTL}
          answers={answers}
          onEdit={() => {
            setDirection(-1);
            setCurrentStep(0);
            setFinished(false);
          }}
        />
      ) : (
        <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-245 items-center px-4 pb-32 pt-9 sm:px-8 sm:pb-32 sm:pt-12 lg:px-12 lg:pb-32 lg:pt-14">
          <div className="w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 34, y: 8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction * -24, y: -5 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto w-full"
              >
                <div className="mb-7 sm:mb-9">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                      {stepIcon(step)}
                    </span>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-gold">
                        {t("quick.questionLabel", {
                          current: currentStep + 1,
                          total: STEPS.length,
                        })}
                      </span>
                      <span className="mt-1 block text-[10px] font-bold text-muted sm:hidden">
                        {currentStep + 1}/{STEPS.length}
                      </span>
                    </div>
                  </div>

                  <h1 className="max-w-210 font-playfair text-[clamp(34px,5.5vw,58px)] font-black leading-[1.06] tracking-[-0.025em] text-primary">
                    {stepTitle()}
                  </h1>
                  <p className="mt-4 max-w-175 text-[13px] font-medium leading-6.5 text-secondary sm:text-[15px] sm:leading-7">
                    {stepDescription()}
                  </p>
                </div>

                {step === "skills" ? (
                  <SkillsGrid
                    skills={availableSkills}
                    selected={answers.skills}
                    onToggle={toggleSkill}
                    t={t}
                  />
                ) : (
                  <>
                    <ChoiceGrid
                      step={step}
                      options={stepOptions()}
                      selected={selectedOption()}
                      recommended={recommended}
                      onSelect={chooseOption}
                      isRTL={isRTL}
                      t={t}
                    />
                    {step === "targetRole" && (
                      <CustomRoleInput
                        value={answers.customTargetRole}
                        onChange={updateCustomRole}
                        t={t}
                      />
                    )}
                  </>
                )}

                <p className="mt-5 flex max-w-205 items-center gap-2 text-[10px] font-semibold leading-5 text-muted">
                  <Check size={13} className="shrink-0 text-green" />
                  {step === "template"
                    ? t("quick.dashboardSaveNote")
                    : t("quick.changeLater")}
                </p>

              </motion.div>
            </AnimatePresence>
          </div>
          <SurveyNavigation
            currentStep={currentStep}
            totalSteps={STEPS.length}
            canContinue={stepIsComplete(step, answers)}
            isRTL={isRTL}
            onBack={goBack}
            onNext={goNext}
            saving={saving}
            t={t}
          />
        </section>
      )}
    </main>
  );
}

function CustomRoleInput({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  t: ReturnType<typeof useTranslations<"onboarding">>;
}) {
  const active = Boolean(value.trim());

  return (
    <div className="mt-4 max-w-215 rounded-2xl border border-dashed border-edge-strong bg-elevated/55 p-4 sm:p-5">
      <label
        htmlFor="custom-target-role"
        className="mb-3 flex items-center gap-2 text-[11px] font-black text-primary"
      >
        <PenLine size={15} className="text-gold" />
        {t("quick.targetRoleQuestion.customLabel")}
      </label>
      <div className="relative">
        <input
          id="custom-target-role"
          type="text"
          value={value}
          maxLength={80}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("quick.targetRoleQuestion.customPlaceholder")}
          className={`h-13 w-full rounded-xl border bg-card px-4 pe-12 text-[13px] font-bold text-primary outline-none transition-all placeholder:text-muted ${
            active
              ? "border-gold shadow-[0_0_0_3px_rgba(245,166,35,0.07)]"
              : "border-edge-strong focus:border-gold"
          }`}
        />
        <span
          className={`absolute inset-e-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full ${
            active ? "bg-gold text-ink" : "bg-elevated text-muted"
          }`}
        >
          {active ? <Check size={13} /> : <PenLine size={12} />}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-semibold leading-5 text-muted">
        {t("quick.targetRoleQuestion.customHint")}
      </p>
    </div>
  );
}

function ChoiceGrid({
  step,
  options,
  selected,
  recommended,
  onSelect,
  isRTL,
  t,
}: {
  step: SurveyStepId;
  options: readonly string[];
  selected: string;
  recommended: ResumeTemplateChoice;
  onSelect: (value: string) => void;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations<"onboarding">>;
}) {
  return (
    <div className="grid max-w-215 gap-3 md:grid-cols-2">
      {options.map((option) => {
        const active = selected === option;
        const isRecommended = step === "template" && option === recommended;
        const title =
          step === "template"
            ? t(`templates.${option}`)
            : step === "targetRole"
              ? t(`quick.roleOptions.${option}`)
              : step === "educationLevel"
                ? t(`steps.education.options.${option}.title`)
            : t(`steps.${step}.options.${option}.title`);
        const description =
          step === "template"
            ? t(`quick.templateOptions.${option}`)
            : step === "targetRole"
              ? t("quick.targetRoleQuestion.optionDescription")
              : step === "educationLevel"
                ? t(`steps.education.options.${option}.description`)
            : t(`steps.${step}.options.${option}.description`);

        return (
          <button
            type="button"
            key={option}
            onClick={() => onSelect(option)}
            aria-pressed={active}
            className={`group relative flex min-h-21 items-center gap-4 rounded-2xl border px-4 py-3.5 text-start transition-all sm:min-h-23 sm:px-5 ${
              active
                ? "border-gold bg-gold/10 shadow-[0_0_0_3px_rgba(245,166,35,0.07),0_14px_42px_var(--shadow-color)]"
                : "border-edge bg-elevated/85 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[0_14px_42px_var(--shadow-color)]"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                active
                  ? "border-gold bg-gold text-ink"
                  : "border-edge-strong bg-card text-secondary group-hover:border-gold/35 group-hover:text-gold"
              }`}
            >
              {optionIcon(step, option)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-[13px] font-black text-primary sm:text-[14px]">
                  {title}
                </strong>
                {isRecommended && (
                  <span className="rounded-full bg-gold/12 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-gold">
                    {t("quick.recommended")}
                  </span>
                )}
              </span>
              <small className="mt-1 block text-[10px] font-semibold leading-5 text-secondary sm:text-[11px]">
                {description}
              </small>
            </span>

            {active ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                <Check size={15} />
              </span>
            ) : (
              <ChevronRight
                size={17}
                className={`shrink-0 text-muted transition-all group-hover:text-gold ${
                  isRTL
                    ? "rotate-180 group-hover:-translate-x-1"
                    : "group-hover:translate-x-1"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SkillsGrid({
  skills,
  selected,
  onToggle,
  t,
}: {
  skills: string[];
  selected: string[];
  onToggle: (skill: string) => void;
  t: ReturnType<typeof useTranslations<"onboarding">>;
}) {
  return (
    <div className="max-w-215">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[10px] font-bold text-secondary">
          {t("quick.skillsQuestion.hint")}
        </span>
        <span className="rounded-lg border border-gold/20 bg-gold/10 px-2.5 py-1.5 text-[10px] font-black text-gold">
          {selected.length}/5
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((skill) => {
          const active = selected.includes(skill);
          return (
            <button
              type="button"
              key={skill}
              onClick={() => onToggle(skill)}
              aria-pressed={active}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-start transition-all ${
                active
                  ? "border-gold bg-gold/10 shadow-[0_0_0_3px_rgba(245,166,35,0.06)]"
                  : "border-edge bg-elevated/85 hover:-translate-y-0.5 hover:border-gold/35"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                  active
                    ? "border-gold bg-gold text-ink"
                    : "border-edge-strong bg-card text-muted"
                }`}
              >
                {active ? <Check size={13} /> : "+"}
              </span>
              <span className="text-[12px] font-black text-primary sm:text-[13px]">
                {t(`quick.skillOptions.${skill}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SurveyNavigation({
  currentStep,
  totalSteps,
  canContinue,
  isRTL,
  onBack,
  onNext,
  saving,
  t,
}: {
  currentStep: number;
  totalSteps: number;
  canContinue: boolean;
  isRTL: boolean;
  onBack: () => void;
  onNext: () => void | Promise<void>;
  saving: boolean;
  t: ReturnType<typeof useTranslations<"onboarding">>;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-base/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_var(--shadow-color)] backdrop-blur-xl sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-215 items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 0}
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-edge bg-elevated px-4 text-xs font-bold text-secondary transition-colors hover:border-edge-strong hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
        >
          <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
          <span className="hidden sm:inline">{t("back")}</span>
        </button>

        <button
          type="button"
          onClick={() => void onNext()}
          disabled={!canContinue || saving}
          className="inline-flex h-12 min-w-42 flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-xs font-black text-ink shadow-[0_10px_30px_rgba(245,166,35,0.24)] transition-all hover:-translate-y-0.5 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:flex-none"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {currentStep === totalSteps - 1 ? t("finish") : t("continue")}
              <ArrowRight
                size={15}
                className={isRTL ? "rotate-180" : ""}
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CompletionScreen({
  locale,
  isRTL,
  answers,
  onEdit,
}: {
  locale: string;
  isRTL: boolean;
  answers: OnboardingData;
  onEdit: () => void;
}) {
  const t = useTranslations("onboarding");

  return (
    <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-80px)] max-w-225 items-center px-4 py-14 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full text-center"
      >
        <div className="relative mx-auto mb-7 flex h-22 w-22 items-center justify-center">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring" }}
            className="absolute inset-0 rounded-full border border-gold/25 bg-gold/10"
          />
          <Check size={32} className="relative text-gold" />
        </div>

        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
          <Sparkles size={13} />
          {t("completion.eyebrow")}
        </span>
        <h1 className="mx-auto mt-4 max-w-185 font-playfair text-[clamp(36px,6vw,62px)] font-black leading-[1.04] tracking-[-0.03em] text-primary">
          {t("completion.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-155 text-[14px] font-medium leading-7 text-secondary sm:text-[16px] sm:leading-8">
          {t("completion.description")}
        </p>

        <div className="mx-auto mt-8 flex max-w-170 flex-wrap justify-center gap-2">
          {answers.field && (
            <span className="rounded-full border border-edge bg-elevated px-4 py-2 text-[11px] font-bold text-primary">
              {t(`steps.field.options.${answers.field}.title`)}
            </span>
          )}
          {(answers.targetRole || answers.customTargetRole.trim()) && (
            <span className="rounded-full border border-edge bg-elevated px-4 py-2 text-[11px] font-bold text-primary">
              {answers.customTargetRole.trim() ||
                t(`quick.roleOptions.${answers.targetRole}`)}
            </span>
          )}
          {answers.educationLevel && (
            <span className="rounded-full border border-edge bg-elevated px-4 py-2 text-[11px] font-bold text-primary">
              {t(`steps.education.options.${answers.educationLevel}.title`)}
            </span>
          )}
          <span className="rounded-full border border-edge bg-elevated px-4 py-2 text-[11px] font-bold text-primary">
            {t("quick.selectedSkills", { count: answers.skills.length })}
          </span>
          {answers.template && (
            <span className="rounded-full border border-gold/25 bg-gold/8 px-4 py-2 text-[11px] font-bold text-gold">
              {t(`templates.${answers.template}`)}
            </span>
          )}
        </div>

        <div className="mx-auto mt-10 flex max-w-135 flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-6 text-xs font-black text-ink no-underline shadow-[0_12px_35px_rgba(245,166,35,0.25)] transition-all hover:-translate-y-0.5 hover:bg-gold-light"
          >
            {t("completion.primary")}
            <ArrowRight size={15} className={isRTL ? "rotate-180" : ""} />
          </Link>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl border border-edge bg-elevated px-6 text-xs font-bold text-secondary transition-colors hover:border-edge-strong hover:text-primary"
          >
            <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
            {t("completion.edit")}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
