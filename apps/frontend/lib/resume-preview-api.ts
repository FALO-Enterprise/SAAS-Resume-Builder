import type {
  ResumePreviewData,
  ResumePurpose,
} from "@/lib/types/resumePreview.types";

export type ResumeExportFormat = "pdf" | "jpg";

export type ResumeExportResult = {
  downloadUrl: string;
  creditsRemaining: number;
  creditsTotal: number;
};

const MOCK_RESUME_DATA: ResumePreviewData = {
  resumeId: "resume-123",
  resumeName: "Scholarship Resume",
  purpose: "scholarship",

  selectedTemplate: {
    id: "classic",
    name: "Classic",
    thumbnailUrl:
      "https://placehold.co/220x310/ffffff/111827/png?text=Classic",
    previewImageUrl:
      "https://placehold.co/794x1123/ffffff/111827/png?text=Scholarship+Resume",
  },

  pdfDownloadUrl: null,
  jpgDownloadUrl: null,

  creditsRemaining: 3,
  creditsTotal: 5,

  updatedAt: new Date().toISOString(),
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getResumePreviewData(
  resumeId: string,
  signal?: AbortSignal,
): Promise<ResumePreviewData> {
  if (!API_BASE_URL) {
    return {
      ...MOCK_RESUME_DATA,
      resumeId,
      updatedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/resumes/${encodeURIComponent(
      resumeId,
    )}/preview`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load resume preview: ${response.status}`,
    );
  }

  const data: unknown = await response.json();

  if (!isResumePreviewData(data)) {
    throw new Error(
      "Invalid resume preview response",
    );
  }

  return data;
}

export async function exportResume(
  resumeId: string,
  format: ResumeExportFormat,
  signal?: AbortSignal,
): Promise<ResumeExportResult> {
  if (!API_BASE_URL) {
    await waitForMockExport(signal);

    return {
      downloadUrl:
        format === "pdf"
          ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
          : "https://placehold.co/794x1123/ffffff/111827/jpg?text=Scholarship+Resume",

      creditsRemaining: Math.max(
        MOCK_RESUME_DATA.creditsRemaining - 1,
        0,
      ),

      creditsTotal:
        MOCK_RESUME_DATA.creditsTotal,
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/api/resumes/${encodeURIComponent(
      resumeId,
    )}/export`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
      signal,
      body: JSON.stringify({
        format,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to export resume: ${response.status}`,
    );
  }

  const data: unknown = await response.json();

  if (!isResumeExportResult(data)) {
    throw new Error(
      "Invalid resume export response",
    );
  }

  return data;
}

function isResumePreviewData(
  value: unknown,
): value is ResumePreviewData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data =
    value as Partial<ResumePreviewData>;

  const selectedTemplate =
    data.selectedTemplate;

  return (
    typeof data.resumeId === "string" &&
    typeof data.resumeName === "string" &&
    isResumePurpose(data.purpose) &&
    selectedTemplate !== null &&
    typeof selectedTemplate === "object" &&
    typeof selectedTemplate.id === "string" &&
    typeof selectedTemplate.name === "string" &&
    typeof selectedTemplate.thumbnailUrl ===
      "string" &&
    typeof selectedTemplate.previewImageUrl ===
      "string" &&
    (typeof data.pdfDownloadUrl === "string" ||
      data.pdfDownloadUrl === null) &&
    (typeof data.jpgDownloadUrl === "string" ||
      data.jpgDownloadUrl === null) &&
    typeof data.creditsRemaining === "number" &&
    typeof data.creditsTotal === "number" &&
    typeof data.updatedAt === "string"
  );
}

function isResumePurpose(
  value: unknown,
): value is ResumePurpose {
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

function isResumeExportResult(
  value: unknown,
): value is ResumeExportResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data =
    value as Partial<ResumeExportResult>;

  return (
    typeof data.downloadUrl === "string" &&
    data.downloadUrl.length > 0 &&
    typeof data.creditsRemaining === "number" &&
    typeof data.creditsTotal === "number"
  );
}

function waitForMockExport(
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener(
        "abort",
        handleAbort,
      );

      resolve();
    }, 800);

    function handleAbort() {
      clearTimeout(timeoutId);
      reject(createAbortError());
    }

    signal?.addEventListener(
      "abort",
      handleAbort,
      {
        once: true,
      },
    );
  });
}

function createAbortError(): DOMException {
  return new DOMException(
    "The operation was aborted.",
    "AbortError",
  );
}