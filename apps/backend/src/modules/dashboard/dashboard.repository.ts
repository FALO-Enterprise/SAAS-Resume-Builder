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
    async findByUserId(userId: string) {
        return prisma.dashboardDraft.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findByResumeId(resumeId: string, userId: string) {
        if (resumeId && resumeId !== 'current' && resumeId !== 'resume-123') {
            const draft = await prisma.dashboardDraft.findFirst({
                where: {
                    OR: [
                        { resumeId },
                        { id: resumeId },
                    ],
                    userId,
                },
            });
            if (draft) return draft;
        }

        return this.findByUserId(userId);
    }

    async upsert(userId: string, draft: DashboardDraftDTO, resumeId?: string) {
        const data = toPersistenceData(draft);

        if (resumeId && resumeId !== 'current' && resumeId !== 'resume-123') {
            const existing = await prisma.dashboardDraft.findFirst({
                where: {
                    OR: [
                        { resumeId },
                        { id: resumeId },
                    ],
                    userId,
                },
            });

            if (existing) {
                return prisma.dashboardDraft.update({
                    where: { id: existing.id },
                    data: {
                        ...data,
                        resumeId,
                    },
                });
            }

            return prisma.dashboardDraft.create({
                data: {
                    userId,
                    resumeId,
                    ...data,
                },
            });
        }

        const latest = await prisma.dashboardDraft.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });

        if (latest) {
            return prisma.dashboardDraft.update({
                where: { id: latest.id },
                data,
            });
        }

        return prisma.dashboardDraft.create({
            data: {
                userId,
                ...data,
            },
        });
    }

    async createForResume(userId: string, resumeId: string, draft: DashboardDraftDTO) {
        const data = toPersistenceData(draft);
        return prisma.dashboardDraft.create({
            data: {
                userId,
                resumeId,
                ...data,
            },
        });
    }
}
