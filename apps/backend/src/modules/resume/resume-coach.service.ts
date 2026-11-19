import prisma from '../../prisma/prisma.service';
import { geminiResumeCoachGenerator, type AiCoachAnalysisResult } from './ai/gemini-resume-coach.generator';
import { DashboardRepository } from '../dashboard/dashboard.repository';

export class ResumeCoachService {
    private dashboardRepository = new DashboardRepository();

    public async analyze(
        userId: string,
        payload: { draft?: any; userPrompt?: string; purpose?: string; resumeId?: string },
    ): Promise<AiCoachAnalysisResult> {
        // Enforce Enterprise plan access check
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
            include: { Plan: true },
        });

        const planName = (subscription?.Plan?.name || 'FREE').toUpperCase();
        if (planName !== 'ENTERPRISE') {
            throw new Error('The AI Resume Coach is an exclusive feature for Enterprise plan subscribers.');
        }

        // Get fresh draft data from DB first, falling back to payload draft
        let draftData: any = null;
        if (payload.resumeId) {
            draftData = await this.dashboardRepository.findByResumeId(payload.resumeId, userId);
        }
        if (!draftData && userId) {
            draftData = await this.dashboardRepository.findByUserId(userId);
        }
        if (!draftData) {
            draftData = payload.draft;
        }

        if (!draftData) {
            throw new Error('No resume content found to analyze.');
        }

        return await geminiResumeCoachGenerator.analyze(draftData, payload.userPrompt, payload.purpose);
    }
}

export const resumeCoachService = new ResumeCoachService();
