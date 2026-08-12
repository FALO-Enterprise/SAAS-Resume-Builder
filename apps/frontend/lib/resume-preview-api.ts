import type { ResumePreviewData, ResumePurpose } from "@/types/resume-preview";
import type { ResumeRenderSnapshot } from "@shared-types/resume";
import type {
  ResumeCustomization,
  ResumeTemplateId,
} from "@shared-types/resume";
import { buildBackendUrl, normalizeBackendPayload } from "./backend";

export type ResumeExportFormat = "pdf" | "jpg";

export type ResumeExportResult = {
  downloadUrl: string;
  creditsRemaining: number;
  creditsTotal: number;
};

export async function getResumeApiErrorMessage(
  response: Response,
  fallback: string,
) {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === "string" && payload.trim()) return payload;

    if (payload && typeof payload === "object") {
      const body = payload as {
        message?: unknown;
        error?: unknown;
      };
      if (typeof body.message === "string" && body.message.trim()) {
        return body.message;
      }
      if (typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }
      if (body.error && typeof body.error === "object") {
        const message = (body.error as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) return message;
      }
    }
  } catch {
    // Fall back to a status-bearing message for non-JSON server responses.
  }

  return `${fallback} (${response.status})`;
}

const MOCK_RESUME_DATA: ResumePreviewData = {
  resumeId: "resume-123",
  resumeName: "Scholarship Resume",
  purpose: "scholarship",

  selectedTemplate: {
    id: "minimal",
    name: "Professional ATS",
    version: 3,
    thumbnailUrl: "/file.svg",
  },

  content: {
    contact: {
      fullName: "Alex Morgan",
      title: "Software Engineer",
      email: "alex@example.com",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    summary: "",
    skillGroups: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    skills: [],
  },
  customization: {
    sectionOrder: [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certifications",
    ],
    hiddenSections: ["certifications"],
    accentColor: "#0563c1",
    fontScale: 1,
  },

  pdfDownloadUrl: null,
  jpgDownloadUrl: null,

  creditsRemaining: 3,
  creditsTotal: 5,

  updatedAt: new Date().toISOString(),
};

export async function getResumePreviewData(
  resumeId: string,
  signal?: AbortSignal,
): Promise<ResumePreviewData> {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem("resumax_token");
  if (!token)
    return {
      ...MOCK_RESUME_DATA,
      resumeId,
      updatedAt: new Date().toISOString(),
    };

  const response = await fetch(
    buildBackendUrl(`/api/resumes/${encodeURIComponent(resumeId)}/preview`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      await getResumeApiErrorMessage(response, "Failed to load resume preview"),
    );
  }

  const payload: unknown = await response.json();
  const snapshot = normalizeBackendPayload<ResumeRenderSnapshot>(payload);
  if ("error" in snapshot) throw new Error(snapshot.error);
  const data: ResumePreviewData = {
    resumeId: snapshot.resumeId,
    resumeName: snapshot.title,
    purpose: "general",
    selectedTemplate: {
      id: snapshot.templateId,
      name: "Professional ATS",
      version: snapshot.templateVersion,
      thumbnailUrl: "/file.svg",
    },
    content: snapshot.content,
    customization: snapshot.customization,
    pdfDownloadUrl: null,
    jpgDownloadUrl: null,
    creditsRemaining: 1,
    creditsTotal: 1,
    updatedAt: snapshot.createdAt,
  };

  if (!isResumePreviewData(data)) {
    throw new Error("Invalid resume preview response");
  }

  return data;
}

export async function exportResume(
  resumeId: string,
  format: ResumeExportFormat,
  signal?: AbortSignal,
  templateId: ResumeTemplateId = "minimal",
  customization?: ResumeCustomization,
): Promise<ResumeExportResult> {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem("resumax_token");
  if (!token) throw new Error("Authentication is required to export a resume");

  const contentType = format === "pdf" ? "application/pdf" : "image/jpeg";

  const response = await fetch(
    buildBackendUrl(
      `/api/resumes/${encodeURIComponent(resumeId)}/exports/${format}`,
    ),
    {
      method: "POST",
      headers: {
        Accept: contentType,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
      signal,
      body: JSON.stringify({ templateId, customization }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getResumeApiErrorMessage(response, "Failed to export resume"),
    );
  }

  if (
    !response.headers
      .get("content-type")
      ?.toLowerCase()
      .includes(contentType)
  ) {
    throw new Error(
      `The server returned an invalid ${format.toUpperCase()} response`,
    );
  }

  const blob = await response.blob();
  return {
    downloadUrl: URL.createObjectURL(blob),
    creditsRemaining: 0,
    creditsTotal: 1,
  };
}

function isResumePreviewData(value: unknown): value is ResumePreviewData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<ResumePreviewData>;

  const selectedTemplate = data.selectedTemplate;

  return (
    typeof data.resumeId === "string" &&
    typeof data.resumeName === "string" &&
    isResumePurpose(data.purpose) &&
    selectedTemplate !== null &&
    typeof selectedTemplate === "object" &&
    typeof selectedTemplate.id === "string" &&
    typeof selectedTemplate.name === "string" &&
    typeof selectedTemplate.thumbnailUrl === "string" &&
    typeof selectedTemplate.version === "number" &&
    (typeof data.pdfDownloadUrl === "string" || data.pdfDownloadUrl === null) &&
    (typeof data.jpgDownloadUrl === "string" || data.jpgDownloadUrl === null) &&
    typeof data.creditsRemaining === "number" &&
    typeof data.creditsTotal === "number" &&
    typeof data.updatedAt === "string"
  );
}

function isResumePurpose(value: unknown): value is ResumePurpose {
  return (
    value === "job" ||
    value === "internship" ||
    value === "scholarship" ||
    value === "academic" ||
    value === "promotion" ||
    value === "government" ||
    value === "general"
  );
}
