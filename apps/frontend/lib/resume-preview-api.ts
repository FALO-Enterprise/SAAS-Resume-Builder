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
import { buildBackendUrl, normalizeBackendPayload } from "./backend";

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
  if (!isResumeTemplateId(snapshot.templateId)) {
    throw new Error("The selected resume template is unavailable");
  }
  const snapshotPurpose = typeof snapshot.purpose === "string" && isResumePurpose(snapshot.purpose)
    ? snapshot.purpose
    : "general";

  const data: ResumePreviewData = {
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

  if (!isResumePreviewData(data)) {
    throw new Error("Invalid resume preview response");
  }

  return data;
}

export async function updateCurrentResumeTemplate(
  title: string,
  templateId: ResumeTemplateId,
  signal?: AbortSignal,
  resumeId?: string,
): Promise<CurrentResumeTemplateResult> {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem("resumax_token");
  if (!token) {
    throw new Error("Authentication is required to update a resume template");
  }

  const endpoint = resumeId && resumeId !== "current" && resumeId !== "resume-123"
    ? `/api/resumes/current?resumeId=${encodeURIComponent(resumeId)}`
    : "/api/resumes/current";

  const response = await fetch(buildBackendUrl(endpoint), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    cache: "no-store",
    signal,
    body: JSON.stringify({ title, templateId }),
  });

  if (!response.ok) {
    throw new Error(
      await getResumeApiErrorMessage(
        response,
        "Failed to update resume template",
      ),
    );
  }

  const payload: unknown = await response.json();
  const result = normalizeBackendPayload<CurrentResumeTemplateResult>(payload);
  if ("error" in result) throw new Error(result.error);
  if (!isResumeTemplateId(result.templateId)) {
    throw new Error("The server returned an invalid resume template");
  }

  return result;
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

// The backend's Resume model has no `purpose` field, and the update call
// only ever sends {title, templateId} — persisting purpose server-side is a
// schema/API change out of scope here. Until that lands, remember the
// user's choice per-resume in localStorage so a reload doesn't silently
// reset it to "general" despite the UI reporting the change as applied.
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

export async function getUserResumesList(signal?: AbortSignal): Promise<UserResumeSummary[]> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("resumax_token");
  if (!token) return [];

  try {
    const response = await fetch(buildBackendUrl("/api/resumes"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
      signal,
    });

    if (!response.ok) return [];
    const payload: unknown = await response.json();
    const data = normalizeBackendPayload<UserResumeSummary[]>(payload);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function renameResumeDraft(
  resumeId: string,
  newTitle: string,
  templateId?: ResumeTemplateId,
): Promise<boolean> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("resumax_token");
  if (!token) return false;

  try {
    if (!resumeId || resumeId === "current" || resumeId === "resume-123") {
      const response = await fetch(buildBackendUrl("/api/resumes/current"), {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ title: newTitle, templateId: templateId ?? "minimal" }),
      });
      return response.ok;
    }

    const response = await fetch(buildBackendUrl(`/api/resumes/${encodeURIComponent(resumeId)}`), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ title: newTitle }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function createNewClonedDraft(): Promise<{ id: string; title: string; templateId: string }> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("resumax_token");
  if (!token) {
    throw new Error("Authentication is required to create a new draft");
  }

  const response = await fetch(buildBackendUrl("/api/resumes/new-draft"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await getResumeApiErrorMessage(response, "Failed to create new draft"),
    );
  }

  const payload: unknown = await response.json();
  const data = normalizeBackendPayload<{ id: string; title: string; templateId: string }>(payload);
  if ('error' in data) {
    throw new Error(data.error);
  }
  return data;
}

export async function deleteResumeDraft(resumeId: string): Promise<boolean> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("resumax_token");
  if (!token || !resumeId) return false;

  try {
    const response = await fetch(buildBackendUrl(`/api/resumes/${encodeURIComponent(resumeId)}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}
