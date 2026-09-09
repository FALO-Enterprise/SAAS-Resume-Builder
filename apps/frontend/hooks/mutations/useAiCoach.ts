"use client";

import { useMutation } from "@tanstack/react-query";
import {
  analyzeWithAiCoach,
  type AiCoachAnalysisResult,
} from "@/lib/api/resumes";
import type { DashboardDraftData } from "@/lib/types/dashboard.types";

export type AiCoachAnalysisInput = {
  draft?: DashboardDraftData;
  userPrompt?: string;
  purpose?: string;
  resumeId?: string;
};


export function useAiCoachAnalysisMutation() {
  return useMutation<AiCoachAnalysisResult, Error, AiCoachAnalysisInput>({
    mutationFn: (input) => analyzeWithAiCoach(input),
  });
}
