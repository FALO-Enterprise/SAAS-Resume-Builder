import type { Resume } from './resume.schema';
import { DashboardRepository } from '../dashboard/dashboard.repository';
import { dashboardDraftSchema, resumeContentSchema, type DashboardDraftDTO } from '../dashboard/dashboard.schema';
import { ResumeRepository } from './resume.repository';
import { resolveResumeTemplate } from './resume-template.registry';
import type { ResumeGenerationDTO } from './util/resume.schema';
import type { ResumeAiEnhancement, ResumeAiGenerator } from './ai/resume-ai-generator';
import { geminiResumeAiGenerator, GeminiAiProviderError } from './ai/gemini-resume-ai.generator';

type DraftStore = {
    findByUserId(userId: string): Promise<unknown>;
    upsert(userId: string, draft: DashboardDraftDTO): Promise<unknown>;
};

type ResumeStore = {
    upsertForUser(title: string, templateId: string, templateName: string, userId: string): Promise<Resume>;
};

export type ResumeAiGenerationErrorCode =
    | 'DRAFT_NOT_FOUND'
    | 'INVALID_DRAFT'
    | 'INVALID_TEMPLATE'
    | 'AI_NOT_CONFIGURED'
    | 'AI_AUTH_FAILED'
    | 'AI_QUOTA_EXCEEDED'
    | 'AI_RATE_LIMITED'
    | 'AI_MODEL_UNAVAILABLE'
    | 'AI_TIMEOUT'
    | 'AI_FAILED';

export class ResumeAiGenerationError extends Error {
    constructor(message: string, public readonly code: ResumeAiGenerationErrorCode) {
        super(message);
        this.name = 'ResumeAiGenerationError';
    }
}

function mergeEnhancement(draft: DashboardDraftDTO, enhancement: ResumeAiEnhancement): DashboardDraftDTO {
    const descriptionById = new Map(
        enhancement.experiences.map((experience) => [experience.id, experience.description.trim()]),
    );

    const skills: string[] = [];
    const seenSkills = new Set<string>();
    for (const rawSkill of enhancement.skills) {
        const skill = rawSkill.trim();
        const normalized = skill.toLocaleLowerCase();
        if (!skill || seenSkills.has(normalized)) continue;
        skills.push(skill);
        seenSkills.add(normalized);
    }

    return {
        ...draft,
        contact: {
            ...draft.contact,
            title: enhancement.professionalTitle.trim() || draft.contact.title,
        },
        experience: draft.experience.map((experience) => ({
            ...experience,
            description: descriptionById.get(experience.id) || experience.description,
        })),
        skills: skills.length > 0 ? skills : draft.skills,
    };
}

export class ResumeAiService {
    constructor(
        private readonly dashboardRepository: DraftStore = new DashboardRepository(),
        private readonly resumeRepository: ResumeStore = new ResumeRepository(),
        private readonly generator: ResumeAiGenerator = geminiResumeAiGenerator,
    ) { }

    async generate(userId: string, payload: ResumeGenerationDTO): Promise<Resume> {
        const template = resolveResumeTemplate(payload.templateId);
        if (!template) {
            throw new ResumeAiGenerationError('Template not found', 'INVALID_TEMPLATE');
        }

        const storedDraft = await this.dashboardRepository.findByUserId(userId);
        if (!storedDraft) {
            throw new ResumeAiGenerationError('Complete the dashboard before generating a resume', 'DRAFT_NOT_FOUND');
        }

        const parsedDraft = dashboardDraftSchema.safeParse(storedDraft);
        if (!parsedDraft.success) {
            throw new ResumeAiGenerationError('The saved resume data is invalid', 'INVALID_DRAFT');
        }

        try {
            const content = resumeContentSchema.parse(parsedDraft.data);
            const enhancement = await this.generator.enhance(content, userId);
            const enhancedDraft = mergeEnhancement(parsedDraft.data, enhancement);
            const validatedDraft = dashboardDraftSchema.parse(enhancedDraft);

            await this.dashboardRepository.upsert(userId, validatedDraft);
            return await this.resumeRepository.upsertForUser(payload.title, template.id, template.name, userId);
        } catch (error) {
            if (error instanceof ResumeAiGenerationError) throw error;
            if (error instanceof GeminiAiProviderError && error.code === 'NOT_CONFIGURED') {
                throw new ResumeAiGenerationError('AI resume generation is not configured', 'AI_NOT_CONFIGURED');
            }
            if (error instanceof GeminiAiProviderError && error.code === 'AUTH_FAILED') {
                throw new ResumeAiGenerationError(
                    'Gemini API key is invalid. Update GEMINI_API_KEY and restart the backend.',
                    'AI_AUTH_FAILED',
                );
            }
            if (error instanceof GeminiAiProviderError && error.code === 'QUOTA_EXCEEDED') {
                throw new ResumeAiGenerationError('Gemini API quota is exhausted. Check project billing and limits.', 'AI_QUOTA_EXCEEDED');
            }
            if (error instanceof GeminiAiProviderError && error.code === 'RATE_LIMITED') {
                throw new ResumeAiGenerationError('AI resume generation is busy. Please try again shortly.', 'AI_RATE_LIMITED');
            }
            if (error instanceof GeminiAiProviderError && error.code === 'MODEL_UNAVAILABLE') {
                throw new ResumeAiGenerationError('The configured Gemini model is unavailable.', 'AI_MODEL_UNAVAILABLE');
            }
            if (error instanceof GeminiAiProviderError && error.code === 'TIMEOUT') {
                throw new ResumeAiGenerationError('AI resume generation timed out. Please try again.', 'AI_TIMEOUT');
            }
            throw new ResumeAiGenerationError('AI resume generation is temporarily unavailable', 'AI_FAILED');
        }
    }
}

export const resumeAiService = new ResumeAiService();
