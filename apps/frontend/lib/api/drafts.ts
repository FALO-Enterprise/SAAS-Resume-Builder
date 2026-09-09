import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ResumeDraftItem } from "@/lib/backend";
import { unwrap, unwrapOptional, type ApiEnvelope } from "@/lib/api/envelope";

export type CreatedDraft = {
  id: string;
  title: string;
  templateId: string;
};

export const fetchDrafts = async (): Promise<ResumeDraftItem[]> => {
  const { data } = await api.get<ApiEnvelope<ResumeDraftItem[]> | ResumeDraftItem[]>(
    API_ENDPOINTS.resumes.drafts,
  );
  const drafts = unwrap(data, "Could not fetch your saved drafts");
  return Array.isArray(drafts) ? drafts : [];
};

export const createDraft = async (): Promise<CreatedDraft> => {
  const { data } = await api.post<ApiEnvelope<CreatedDraft> | CreatedDraft>(
    API_ENDPOINTS.resumes.newDraft,
    {},
  );
  return unwrap(data, "Could not create new resume draft");
};

export const deleteDraft = async (resumeId: string): Promise<void> => {
  const { data } = await api.delete<ApiEnvelope<{ success: boolean }>>(
    API_ENDPOINTS.resumes.byId(resumeId),
  );
  // A 204 leaves no body to inspect; only a returned envelope can carry a
  // failure, so an empty response is the success path here.
  unwrapOptional(data, "Could not delete resume draft");
};

export const updateDraftTitle = async (input: {
  resumeId: string;
  title: string;
}): Promise<void> => {
  const { data } = await api.patch<ApiEnvelope<{ id: string; title: string }>>(
    API_ENDPOINTS.resumes.byId(input.resumeId),
    { title: input.title },
  );
  unwrapOptional(data, "Could not update resume title");
};

