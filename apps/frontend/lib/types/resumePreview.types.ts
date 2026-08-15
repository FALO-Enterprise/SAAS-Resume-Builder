import type {
  ResumeContent,
  ResumeCustomization,
  ResumeTemplateId,
} from "@shared-types/resume";

export type ResumePurpose =
  | "job"
  | "internship"
  | "scholarship"
  | "academic"
  | "promotion"
  | "government"
  | "general";

export type SelectedResumeTemplate = {
  id: ResumeTemplateId;
  name: string;
  version: number;
  thumbnailUrl: string;
};

export type ResumePreviewData = {
  resumeId: string;
  resumeName: string;

  purpose: ResumePurpose;

  selectedTemplate: SelectedResumeTemplate;

  content: ResumeContent;
  customization: ResumeCustomization;

  pdfDownloadUrl: string | null;
  jpgDownloadUrl: string | null;

  creditsRemaining: number;
  creditsTotal: number;

  updatedAt: string;
};
