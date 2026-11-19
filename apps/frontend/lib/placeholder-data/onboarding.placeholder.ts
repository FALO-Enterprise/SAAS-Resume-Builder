import type {
  CareerField,
  EducationLevel,
  ExperienceLevel,
  OnboardingData,
  SurveyPurpose,
} from "@/lib/types/onboarding.types";

export type SurveyStepId =
  | "purpose"
  | "experienceLevel"
  | "field"
  | "targetRole"
  | "educationLevel"
  | "skills"
  | "template";

export const STEPS: SurveyStepId[] = [
  "purpose",
  "experienceLevel",
  "field",
  "targetRole",
  "educationLevel",
  "skills",
  "template",
];

export const PURPOSE_OPTIONS: SurveyPurpose[] = [
  "firstResume",
  "newJob",
  "internship",
  "careerChange",
];

export const EXPERIENCE_OPTIONS: ExperienceLevel[] = [
  "none",
  "junior",
  "mid",
  "senior",
];

export const FIELD_OPTIONS: CareerField[] = [
  "technology",
  "design",
  "business",
  "finance",
  "health",
  "education",
  "engineering",
  "other",
];

export const ROLE_OPTIONS: Record<Exclude<CareerField, "">, string[]> = {
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

export const EDUCATION_OPTIONS: EducationLevel[] = [
  "highSchool",
  "diploma",
  "bachelor",
  "master",
  "doctorate",
];

export const SKILL_OPTIONS: Record<Exclude<CareerField, "">, string[]> = {
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

export const EMPTY_ANSWERS: OnboardingData = {
  purpose: "",
  experienceLevel: "",
  field: "",
  targetRole: "",
  customTargetRole: "",
  educationLevel: "",
  skills: [],
  template: "",
};
