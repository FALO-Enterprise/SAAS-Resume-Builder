import z from 'zod';

export const dashboardSteps = ['contact', 'experience', 'education', 'skills'] as const;

const shortText = z.string().max(200);
const longText = z.string().max(5000);

export const contactSchema = z.object({
    fullName: shortText,
    title: shortText,
    email: z.union([z.literal(''), z.email().max(320)]),
    phone: shortText,
    location: shortText,
    linkedin: z.string().max(500),
});

export const experienceSchema = z.object({
    id: z.string().min(1).max(100),
    jobTitle: shortText,
    company: shortText,
    location: shortText,
    current: z.boolean(),
    startMonth: shortText,
    startYear: shortText,
    endMonth: shortText,
    endYear: shortText,
    description: longText,
});

export const educationSchema = z.object({
    id: z.string().min(1).max(100),
    institution: shortText,
    degree: shortText,
    field: shortText,
    gradYear: shortText,
});

export const certificationSchema = z.object({
    id: z.string().min(1).max(100),
    name: shortText,
    org: shortText,
});

export const dashboardDraftSchema = z.object({
    template: z.string().max(100).nullable().default(null),
    currentStep: z.enum(dashboardSteps),
    completedSteps: z.array(z.enum(dashboardSteps)).max(dashboardSteps.length),
    contact: contactSchema,
    experience: z.array(experienceSchema).max(30),
    education: z.array(educationSchema).max(30),
    certifications: z.array(certificationSchema).max(30),
    skills: z.array(shortText).max(100),
});

export const resumeContentSchema = dashboardDraftSchema.pick({
    contact: true,
    experience: true,
    education: true,
    certifications: true,
    skills: true,
});

export type DashboardDraftDTO = z.infer<typeof dashboardDraftSchema>;
