import { DEFAULT_RESUME_CUSTOMIZATION } from '@resumax/shared-types';
import { DashboardRepository } from './dashboard.repository';
import { dashboardDraftSchema, type DashboardDraftDTO } from './dashboard.schema';

type DraftStore = {
    findByUserId(userId: string): Promise<unknown>;
    findByResumeId?(resumeId: string, userId: string): Promise<unknown>;
    upsert(userId: string, draft: DashboardDraftDTO, resumeId?: string): Promise<object>;
};

const EMPTY_CONTACT = {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    photo: '',
};

export class DashboardService {
    constructor(private readonly repository: DraftStore = new DashboardRepository()) { }

    async getDraft(user: { id: string; email: string }, resumeId?: string) {
        const draft = resumeId && this.repository.findByResumeId
            ? await this.repository.findByResumeId(resumeId, user.id)
            : await this.repository.findByUserId(user.id);

        if (draft) {
            const parseResult = dashboardDraftSchema.safeParse(draft);
            if (parseResult.success) {
                return { ...draft, ...parseResult.data };
            }

            console.warn(
                'Invalid persisted dashboard draft. Returning defaults for user.',
                { userId: user.id, resumeId, issues: parseResult.error.issues },
            );
        }

        return {
            template: null,
            purpose: 'general',
            currentStep: 'contact',
            completedSteps: [],
            sectionOrder: [...DEFAULT_RESUME_CUSTOMIZATION.sectionOrder],
            contact: { ...EMPTY_CONTACT, email: user.email },
            summary: '',
            skillGroups: [],
            experience: [],
            projects: [],
            education: [],
            certifications: [],
            skills: [],
        } satisfies DashboardDraftDTO;
    }

    saveDraft(userId: string, draft: DashboardDraftDTO, resumeId?: string) {
        return this.repository.upsert(userId, draft, resumeId);
    }
}

export const dashboardService = new DashboardService();
