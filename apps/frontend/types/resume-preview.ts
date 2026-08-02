export type ResumePurpose =
  | "job"
  | "internship"
  | "scholarship"
  | "academic"
  | "promotion"
  | "government"
  | "general";

export type SelectedResumeTemplate = {
  id: string;
  name: string;
  thumbnailUrl: string;
  previewImageUrl: string;
};

export type ResumePreviewData = {
  resumeId: string;
  resumeName: string;

  purpose: ResumePurpose;

  selectedTemplate: SelectedResumeTemplate;

  pdfDownloadUrl: string | null;
  jpgDownloadUrl: string | null;

  creditsRemaining: number;
  creditsTotal: number;

  updatedAt: string;
};