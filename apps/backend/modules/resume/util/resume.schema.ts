import z from "zod";

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
