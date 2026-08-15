import z from "zod";
import { RESUME_TEMPLATE_IDS } from '@resumax/shared-types';

export const resumeSchema = z.object({
    id: z.string(),
    title: z.string(),
    templateId: z.string(),
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const resumeCreateSchema = resumeSchema.pick({
    title: true,
    templateId: true,
    userId: true
});

export const resumeUpdateSchema = resumeCreateSchema.partial();

export const resumeGenerationSchema = z.object({
    title: z.string().trim().min(1).max(200),
    templateId: z.enum(RESUME_TEMPLATE_IDS),
    purpose: z.string().trim().optional(),
}).strict();

export type ResumeGenerationDTO = z.infer<typeof resumeGenerationSchema>;
