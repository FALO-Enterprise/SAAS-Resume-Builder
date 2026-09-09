import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { unwrap, type ApiEnvelope } from "@/lib/api/envelope";
import type { DashboardDraftData } from "@/lib/types/dashboard.types";
import type { ResumeTemplateId } from "@shared-types/resume";

export type GeneratedResume = {
  id: string;
  title: string;
  templateId: ResumeTemplateId;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type ResumeDraftItem = {
  id: string;
  title: string;
  templateId?: string;
  templateName: string;
  updatedAt: string;
  thumbnailUrl?: string;
};

export type AiCoachTip = {
  id: string;
  category: "summary" | "experience" | "skills" | "keywords" | "general";
  title: string;
  description: string;
  suggestedActionText?: string;
  suggestedFix?: {
    targetField: "summary" | "title" | "skills" | "experience";
    experienceId?: string;
    value: unknown;
  };
};

export type AiCoachAnalysisResult = {
  atsScore: number;
  scoreBreakdown: {
    impact: number;
    keywords: number;
    clarity: number;
    completeness: number;
  };
  overallAssessment: string;
  tips: AiCoachTip[];
  suggestedSkills: string[];
  replyMessage?: string;
};

/** Strips the client-only fields the backend rejects. */
export function createDashboardDraftPayload(draft: DashboardDraftData) {
  return {
    template: draft.template,
    currentStep: draft.currentStep,
    completedSteps: draft.completedSteps,
    sectionOrder: draft.sectionOrder,
    contact: draft.contact,
    summary: draft.summary,
    skillGroups: draft.skillGroups,
    experience: draft.experience,
    projects: draft.projects,
    education: draft.education,
    certifications: draft.certifications,
    skills: draft.skills,
  };
}

export async function fetchDashboardDraft(
  resumeId?: string,
  signal?: AbortSignal,
): Promise<DashboardDraftData> {
  const { data } = await apiClient.get<
    ApiEnvelope<DashboardDraftData> | DashboardDraftData
  >(API_ENDPOINTS.auth.dashboard, {
    params: resumeId ? { resumeId } : {},
    signal,
  });

  return unwrap(data, "Could not fetch your dashboard");
}

export async function saveDashboardDraft(input: {
  draft: DashboardDraftData;
  resumeId?: string;
}): Promise<DashboardDraftData> {
  const { data } = await apiClient.put<
    ApiEnvelope<DashboardDraftData> | DashboardDraftData
  >(API_ENDPOINTS.auth.dashboard, createDashboardDraftPayload(input.draft), {
    params: input.resumeId ? { resumeId: input.resumeId } : {},
  });

  return unwrap(data, "Could not save your dashboard");
}

const GENERATE_TIMEOUT_MS = 75_000;
const AI_COACH_TIMEOUT_MS = 60_000;

export async function generateResume(input: {
  title: string;
  templateId: ResumeTemplateId;
  purpose?: string;
  resumeId?: string;
}): Promise<GeneratedResume> {
  const { resumeId, ...body } = input;

  const { data } = await apiClient.post<
    ApiEnvelope<GeneratedResume> | GeneratedResume
  >(API_ENDPOINTS.resumes.generate, body, {
    params: resumeId ? { resumeId } : {},
    timeout: GENERATE_TIMEOUT_MS,
  });

  return unwrap(data, "Could not generate your resume");
}

export async function analyzeWithAiCoach(
  payload: {
    draft?: DashboardDraftData;
    userPrompt?: string;
    purpose?: string;
    resumeId?: string;
  } = {},
  signal?: AbortSignal,
): Promise<AiCoachAnalysisResult> {
  const { data } = await apiClient.post<
    ApiEnvelope<AiCoachAnalysisResult> | AiCoachAnalysisResult
  >(API_ENDPOINTS.resumes.aiCoachAnalyze, payload, {
    timeout: AI_COACH_TIMEOUT_MS,
    signal,
  });

  return unwrap(data, "Could not run AI Coach analysis");
}
