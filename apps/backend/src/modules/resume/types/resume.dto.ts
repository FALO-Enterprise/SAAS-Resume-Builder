import { Resume } from "../resume.schema";

export type CreateResumeDTO = Pick<Resume, 'title' | 'templateId' | 'userId'>;
export type UpdateResumeDTO = Partial<CreateResumeDTO>;
export type ResumeResponseDTO = Resume;
