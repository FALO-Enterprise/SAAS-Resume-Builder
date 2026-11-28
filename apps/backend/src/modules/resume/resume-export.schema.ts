import { z } from 'zod';
import { RESUME_SECTION_IDS, RESUME_TEMPLATE_IDS } from '@resumax/shared-types';

const customizationSchema = z.object({
    sectionOrder: z.array(z.enum(RESUME_SECTION_IDS)).max(RESUME_SECTION_IDS.length).optional(),
    hiddenSections: z.array(z.enum(RESUME_SECTION_IDS)).max(RESUME_SECTION_IDS.length).optional(),
    accentColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Accent color must be a six-digit hex color').optional(),
    fontScale: z.number().min(0.5).max(2.0).optional(),
    fontFamily: z.string().max(200).optional(),
}).strict();

export const resumeExportSchema = z.object({
    templateId: z.enum(RESUME_TEMPLATE_IDS).optional(),
    customization: customizationSchema.optional(),
}).strict();

export type ResumeExportInput = z.infer<typeof resumeExportSchema>;
