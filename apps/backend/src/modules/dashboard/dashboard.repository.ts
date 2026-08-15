import { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma.service';
import { DashboardDraftDTO } from './dashboard.schema';

export function toPersistenceData(draft: DashboardDraftDTO) {
    return {
        template: draft.template,
        currentStep: draft.currentStep,
        completedSteps: draft.completedSteps,
        sectionOrder: draft.sectionOrder,
        contact: draft.contact as Prisma.InputJsonValue,
        summary: draft.summary,
        skillGroups: draft.skillGroups as Prisma.InputJsonValue,
        experience: draft.experience as Prisma.InputJsonValue,
        projects: draft.projects as Prisma.InputJsonValue,
        education: draft.education as Prisma.InputJsonValue,
        certifications: draft.certifications as Prisma.InputJsonValue,
        skills: draft.skills as Prisma.InputJsonValue,
    };
}

export class DashboardRepository {
    findByUserId(userId: string) {
        return prisma.dashboardDraft.findUnique({ where: { userId } });
    }

    upsert(userId: string, draft: DashboardDraftDTO) {
        const data = toPersistenceData(draft);

        return prisma.dashboardDraft.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
    }
}
