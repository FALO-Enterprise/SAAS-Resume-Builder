import { DashboardRepository } from './dashboard.repository';
import { DashboardDraftDTO } from './dashboard.schema';

const EMPTY_CONTACT = {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
};

export class DashboardService {
    private repository = new DashboardRepository();

    async getDraft(user: { id: string; email: string }) {
        const draft = await this.repository.findByUserId(user.id);
        if (draft) return draft;

        return {
            template: null,
            currentStep: 'contact',
            completedSteps: [],
            contact: { ...EMPTY_CONTACT, email: user.email },
            experience: [],
            education: [],
            certifications: [],
            skills: [],
        } satisfies DashboardDraftDTO;
    }

    saveDraft(userId: string, draft: DashboardDraftDTO) {
        return this.repository.upsert(userId, draft);
    }
}

export const dashboardService = new DashboardService();
