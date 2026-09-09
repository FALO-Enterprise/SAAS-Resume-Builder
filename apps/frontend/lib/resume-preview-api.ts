import type {
  ResumePreviewData,
  ResumePurpose,
  SelectedResumeTemplate,
} from "@/lib/types/resumePreview.types";
import {
  RESUME_TEMPLATE_DEFINITIONS,
  type ResumeRenderSnapshot,
  type ResumeCustomization,
  type ResumeTemplateId,
} from "@shared-types/resume";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getAccessToken } from "@/lib/auth/token";
import { createApiRequestError, normalizeBackendPayload } from "./backend";

const EXPORT_TIMEOUT_MS = 60_000;

export type ResumeExportFormat = "pdf" | "jpg";

export type ResumeExportResult = {
  downloadUrl: string;
  creditsRemaining: number;
  creditsTotal: number;
};

export type CurrentResumeTemplateResult = {
  id: string;
  title: string;
  templateId: ResumeTemplateId;
  updatedAt: string;
};

const TEMPLATE_THUMBNAILS: Record<ResumeTemplateId, string> = {
  executive: "https://i.imgur.com/ptI7HFp.png",
  developer: "https://i.imgur.com/D91CvTh.png",
  director: "https://i.imgur.com/PWtfFl4.png",
  minimal: "https://i.imgur.com/glF9QYl.png",
  academic: "https://i.imgur.com/E6LVnlU.png",
  global: "https://i.imgur.com/WUJ3Hwx.png",
};

const TEMPLATE_IDS = new Set<ResumeTemplateId>(
  RESUME_TEMPLATE_DEFINITIONS.map((template) => template.id),
);

export function isResumeTemplateId(value: string): value is ResumeTemplateId {
  return TEMPLATE_IDS.has(value as ResumeTemplateId);
}

export function getResumeTemplateMetadata(
  templateId: ResumeTemplateId,
): SelectedResumeTemplate {
  const definition = RESUME_TEMPLATE_DEFINITIONS.find(
    (template) => template.id === templateId,
  );

  if (!definition) {
    throw new Error(`Resume template "${templateId}" is unavailable`);
  }

  return {
    id: definition.id,
    name: definition.name,
    version: definition.version,
    thumbnailUrl: TEMPLATE_THUMBNAILS[definition.id],
    supportsPhoto: definition.supportsPhoto,
  };
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
}

async function readBlobErrorMessage(body: unknown): Promise<string | null> {
  if (!(body instanceof Blob)) return null;

  try {
    const text = await body.text();
    if (!text.trim()) return null;

    const payload: unknown = JSON.parse(text);
    if (typeof payload === "string" && payload.trim()) return payload;

    if (payload && typeof payload === "object") {
      const data = payload as { message?: unknown; error?: unknown };
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
      if (data.error && typeof data.error === "object") {
        const message = (data.error as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) return message;
      }
    }
  } catch {
    // Not JSON — the status-bearing fallback is the best we can do.
  }

  return null;
}

const MOCK_RESUME_DATA: ResumePreviewData = {
  resumeId: "resume-123",
  resumeName: "Scholarship Resume",
  purpose: "scholarship",

  selectedTemplate: {
    ...getResumeTemplateMetadata("minimal"),
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
    hiddenSections: [],
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
  if (!getAccessToken()) {
    return {
      ...MOCK_RESUME_DATA,
      resumeId,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const { data } = await apiClient.get(
      API_ENDPOINTS.resumes.preview(resumeId),
      { signal },
    );

    const snapshot = normalizeBackendPayload<ResumeRenderSnapshot>(data);
    if ("error" in snapshot) throw new Error(snapshot.error);
    if (!isResumeTemplateId(snapshot.templateId)) {
      throw new Error("The selected resume template is unavailable");
    }

    const preview: ResumePreviewData = {
      resumeId: snapshot.resumeId,
      resumeName: snapshot.title,
      purpose: getStoredResumePurpose(snapshot.resumeId) ?? "general",
      selectedTemplate: getResumeTemplateMetadata(snapshot.templateId),
      content: snapshot.content,
      customization: snapshot.customization,
      pdfDownloadUrl: null,
      jpgDownloadUrl: null,
      creditsRemaining: 1,
      creditsTotal: 1,
      updatedAt: snapshot.createdAt,
    };

    if (!isResumePreviewData(preview)) {
      throw new Error("Invalid resume preview response");
    }

    return preview;
  } catch (error) {
    throwIfAborted(signal);
    throw createApiRequestError(error, "Failed to load resume preview");
  }
}

export async function updateCurrentResumeTemplate(
  title: string,
  templateId: ResumeTemplateId,
  signal?: AbortSignal,
  resumeId?: string,
): Promise<CurrentResumeTemplateResult> {
  if (!getAccessToken()) {
    throw new Error("Authentication is required to update a resume template");
  }

  const targetsExistingResume =
    Boolean(resumeId) && resumeId !== "current" && resumeId !== "resume-123";

  try {
    const { data } = await apiClient.put(
      API_ENDPOINTS.resumes.current,
      { title, templateId },
      {
        signal,
        params: targetsExistingResume ? { resumeId } : undefined,
      },
    );

    const result = normalizeBackendPayload<CurrentResumeTemplateResult>(data);
    if ("error" in result) throw new Error(result.error);
    if (!isResumeTemplateId(result.templateId)) {
      throw new Error("The server returned an invalid resume template");
    }

    return result;
  } catch (error) {
    throwIfAborted(signal);
    throw createApiRequestError(error, "Failed to update resume template");
  }
}

export async function exportResume(
  resumeId: string,
  format: ResumeExportFormat,
  signal?: AbortSignal,
  templateId: ResumeTemplateId = "minimal",
  customization?: ResumeCustomization,
): Promise<ResumeExportResult> {
  if (!getAccessToken()) {
    throw new Error("Authentication is required to export a resume");
  }

  const contentType = format === "pdf" ? "application/pdf" : "image/jpeg";
  const fallback = "Failed to export resume";

  try {
    const response = await apiClient.post(
      API_ENDPOINTS.resumes.exports(resumeId, format),
      { templateId, customization },
      {
        signal,
        responseType: "blob",
        headers: { Accept: contentType },
        timeout: EXPORT_TIMEOUT_MS,
        validateStatus: () => true,
      },
    );

    if (response.status < 200 || response.status >= 300) {
      const message = await readBlobErrorMessage(response.data);
      throw createApiRequestError(
        {
          status: response.status,
          message: message ?? `${fallback} (${response.status})`,
        },
        fallback,
      );
    }

    const received = String(response.headers["content-type"] ?? "").toLowerCase();
    if (!received.includes(contentType)) {
      throw new Error(
        `The server returned an invalid ${format.toUpperCase()} response`,
      );
    }

    return {
      downloadUrl: URL.createObjectURL(response.data as Blob),
      creditsRemaining: 0,
      creditsTotal: 1,
    };
  } catch (error) {
    throwIfAborted(signal);
    throw createApiRequestError(error, fallback);
  }
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
    isResumeTemplateId(selectedTemplate.id) &&
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

const RESUME_PURPOSE_STORAGE_PREFIX = "resumax_resume_purpose:";

export function getStoredResumePurpose(resumeId: string): ResumePurpose | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(
    `${RESUME_PURPOSE_STORAGE_PREFIX}${resumeId}`,
  );
  return stored && isResumePurpose(stored) ? stored : null;
}

export function setStoredResumePurpose(
  resumeId: string,
  purpose: ResumePurpose,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${RESUME_PURPOSE_STORAGE_PREFIX}${resumeId}`,
    purpose,
  );
}

export function isResumePurpose(value: unknown): value is ResumePurpose {
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

export type UserResumeSummary = {
  id: string;
  title: string;
  templateId: string;
  updatedAt: string;
  createdAt: string;
};

export async function getUserResumesList(
  signal?: AbortSignal,
): Promise<UserResumeSummary[]> {
  if (!getAccessToken()) return [];

  try {
    const { data } = await apiClient.get(API_ENDPOINTS.resumes.root, { signal });
    const list = normalizeBackendPayload<UserResumeSummary[]>(data);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function renameResumeDraft(
  resumeId: string,
  newTitle: string,
  templateId?: ResumeTemplateId,
): Promise<boolean> {
  if (!getAccessToken()) return false;

  try {
    if (!resumeId || resumeId === "current" || resumeId === "resume-123") {
      await apiClient.put(API_ENDPOINTS.resumes.current, {
        title: newTitle,
        templateId: templateId ?? "minimal",
      });
      return true;
    }

    await apiClient.patch(API_ENDPOINTS.resumes.byId(resumeId), {
      title: newTitle,
    });
    return true;
  } catch {
    return false;
  }
}

export async function createNewClonedDraft(): Promise<{
  id: string;
  title: string;
  templateId: string;
}> {
  if (!getAccessToken()) {
    throw new Error("Authentication is required to create a new draft");
  }

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.resumes.newDraft);
    const result = normalizeBackendPayload<{
      id: string;
      title: string;
      templateId: string;
    }>(data);
    if ("error" in result) throw new Error(result.error);
    return result;
  } catch (error) {
    throw createApiRequestError(error, "Failed to create new draft");
  }
}

export async function deleteResumeDraft(resumeId: string): Promise<boolean> {
  if (!getAccessToken() || !resumeId) return false;

  try {
    await apiClient.delete(API_ENDPOINTS.resumes.byId(resumeId));
    return true;
  } catch {
    return false;
  }
}
