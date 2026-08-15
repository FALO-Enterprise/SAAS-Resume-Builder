import z from 'zod';

const enhancedExperienceSchema = z.object({
    id: z.string().min(1).max(100),
    description: z.string().max(5000),
});

export const resumeAiEnhancementSchema = z.object({
    professionalTitle: z.string().max(200),
    experiences: z.array(enhancedExperienceSchema).max(30),
    skills: z.array(z.string().max(200)).max(100),
});

