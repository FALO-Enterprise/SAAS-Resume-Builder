import z from 'zod';
import {
    DEFAULT_RESUME_CUSTOMIZATION,
    RESUME_SECTION_IDS,
} from '@resumax/shared-types';

export const dashboardSteps = ['contact', 'summary', 'skills', 'experience', 'projects', 'education'] as const;

const shortText = z.string().max(200);
const longText = z.string().max(5000);

export const resumeSectionOrderSchema = z.array(z.enum(RESUME_SECTION_IDS))
    .max(RESUME_SECTION_IDS.length)
    .refine((sectionOrder) => new Set(sectionOrder).size === sectionOrder.length, {
        message: 'Resume section order cannot contain duplicates',
    })
    .default([...DEFAULT_RESUME_CUSTOMIZATION.sectionOrder]);

export const contactSchema = z.object({
    fullName: shortText.default(''),
    title: shortText.default(''),
    email: z.union([z.literal(''), z.email().max(320)]).default(''),
    phone: shortText.default(''),
    location: shortText.default(''),
    linkedin: z.string().max(500).default(''),
    github: z.string().max(500).default(''),
    portfolio: z.string().max(500).default(''),
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
    location: shortText.default(''),
    country: shortText.default(''),
    startMonth: shortText.default(''),
    startYear: shortText.default(''),
    endMonth: shortText.default(''),
    endYear: shortText.default(''),
    current: z.boolean().default(false),
    gradYear: shortText,
});

export const certificationSchema = z.object({
    id: z.string().min(1).max(100),
    name: shortText,
    org: shortText,
});

export const skillGroupSchema = z.object({
    id: z.string().min(1).max(100),
    label: shortText,
    skills: z.array(shortText).max(100),
});

export const projectSchema = z.object({
    id: z.string().min(1).max(100),
    name: shortText,
    technologies: z.array(shortText).max(100),
    link: z.string().max(500),
    startMonth: shortText,
    startYear: shortText,
    description: longText,
});

export const dashboardDraftSchema = z.object({
    template: z.string().max(100).nullable().default(null),
    purpose: z.string().max(100).default('general'),
    currentStep: z.enum(dashboardSteps),
    completedSteps: z.array(z.enum(dashboardSteps)).max(dashboardSteps.length),
    sectionOrder: resumeSectionOrderSchema,
    contact: contactSchema,
    summary: longText.default(''),
    skillGroups: z.array(skillGroupSchema).max(30).default([]),
    experience: z.array(experienceSchema).max(30).default([]),
    projects: z.array(projectSchema).max(30).default([]),
    education: z.array(educationSchema).max(30).default([]),
    certifications: z.array(certificationSchema).max(30).default([]),
    skills: z.array(shortText).max(100).default([]),
});

export const resumeContentSchema = dashboardDraftSchema.pick({
    contact: true,
    summary: true,
    skillGroups: true,
    experience: true,
    projects: true,
    education: true,
    certifications: true,
    skills: true,
});

export const resumeDraftCustomizationSchema = dashboardDraftSchema.pick({
    sectionOrder: true,
});

export type DashboardDraftInput = z.input<typeof dashboardDraftSchema>;
export type DashboardDraftDTO = z.output<typeof dashboardDraftSchema>;
