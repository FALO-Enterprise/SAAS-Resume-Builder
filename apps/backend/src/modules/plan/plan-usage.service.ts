import prisma from '../../prisma/prisma.service';

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlanLimits {
    maxTotalDrafts: number;
    maxDailyDrafts: number;
    maxPdfExports: number;
    maxJpgExports: number;
    maxTemplateReuse: number;
    aiTokensLimit: number;
    tokensPerAiBuild: number;
    allowedTemplates?: string[];
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
    FREE: {
        maxTotalDrafts: 1,
        maxDailyDrafts: 1,
        maxPdfExports: 1,
        maxJpgExports: 0,
        maxTemplateReuse: 1,
        aiTokensLimit: 10,
        tokensPerAiBuild: 3, // ~30% (between 1/3 ~ 1/4 of quota per build)
        allowedTemplates: ['minimal'],
    },
    PRO: {
        maxTotalDrafts: 3,
        maxDailyDrafts: 2,
        maxPdfExports: 2,
        maxJpgExports: 2,
        maxTemplateReuse: 2,
        aiTokensLimit: 50,
        tokensPerAiBuild: 3,
    },
    ENTERPRISE: {
        maxTotalDrafts: 5,
        maxDailyDrafts: 4,
        maxPdfExports: 4,
        maxJpgExports: 4,
        maxTemplateReuse: 3,
        aiTokensLimit: 100,
        tokensPerAiBuild: 3,
    },
};

export interface UserUsageMetrics {
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    resumesExported: number;
    resumesExportLimit: number;
    resumesStored: number;
    resumesStoreLimit: number;
}

export class PlanUsageService {
    // Tracks daily draft creations: key = `${userId}:${YYYY-MM-DD}`
    private dailyDraftCreations = new Map<string, number>();

    // In-memory export count cache: key = `${userId}:${format}` (e.g. `user-1:pdf`)
    private userExportCounts = new Map<string, number>();

    // In-memory AI token count cache: key = `${userId}`
    private userAiTokensUsed = new Map<string, number>();

    private getTodayKey(userId: string): string {
        const today = new Date().toISOString().slice(0, 10);
        return `${userId}:${today}`;
    }

    getPlanLimits(planName?: string): PlanLimits {
        const tier = (planName?.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName?.toUpperCase() as PlanTier)
            : 'FREE';
        return PLAN_LIMITS[tier];
    }

    getAiTokensPerBuild(planName?: string): number {
        return this.getPlanLimits(planName).tokensPerAiBuild;
    }

    getDailyDraftsCount(userId: string): number {
        return this.dailyDraftCreations.get(this.getTodayKey(userId)) ?? 0;
    }

    recordDraftCreation(userId: string): number {
        const key = this.getTodayKey(userId);
        const count = (this.dailyDraftCreations.get(key) ?? 0) + 1;
        this.dailyDraftCreations.set(key, count);
        return count;
    }

    getExportCount(userId: string, format: 'pdf' | 'jpg'): number {
        return this.userExportCounts.get(`${userId}:${format}`) ?? 0;
    }

    async recordExport(userId: string, format: 'pdf' | 'jpg'): Promise<number> {
        const key = `${userId}:${format}`;
        const count = (this.userExportCounts.get(key) ?? 0) + 1;
        this.userExportCounts.set(key, count);

        try {
            if (prisma?.subscription) {
                await prisma.subscription.updateMany({
                    where: { userId },
                    data: {
                        downloadsCount: { increment: 1 },
                    },
                });
            }
        } catch (err) {
            console.warn('[PlanUsageService] Could not persist export count to DB:', err);
        }

        return count;
    }

    getAiTokensUsed(userId: string): number {
        return this.userAiTokensUsed.get(userId) ?? 0;
    }

    async recordAiTokens(userId: string, tokens: number = 30): Promise<number> {
        const current = this.userAiTokensUsed.get(userId) ?? 0;
        const updated = current + tokens;
        this.userAiTokensUsed.set(userId, updated);

        try {
            if (prisma?.subscription) {
                await prisma.subscription.updateMany({
                    where: { userId },
                    data: {
                        aiTokensUsed: { increment: tokens },
                    },
                });
            }
        } catch (err) {
            console.warn('[PlanUsageService] Could not persist AI tokens to DB:', err);
        }

        return updated;
    }

    async canConsumeAiTokens(
        userId: string,
        planName?: string,
        tokensNeeded: number = 30,
    ): Promise<{ allowed: boolean; remaining: number; limit: number; needed: number; reason?: string }> {
        const tier = (planName?.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName?.toUpperCase() as PlanTier)
            : 'FREE';
        const limits = PLAN_LIMITS[tier];

        let currentUsed = this.userAiTokensUsed.get(userId) ?? 0;

        try {
            if (prisma?.subscription) {
                const sub = await prisma.subscription.findUnique({
                    where: { userId },
                    select: { aiTokensUsed: true },
                });
                if (sub) {
                    currentUsed = Math.max(currentUsed, sub.aiTokensUsed || 0);
                    this.userAiTokensUsed.set(userId, currentUsed);
                }
            }
        } catch (err) {
            console.warn('[PlanUsageService] Error reading AI tokens from DB:', err);
        }

        const remaining = Math.max(0, limits.aiTokensLimit - currentUsed);
        if (currentUsed + tokensNeeded > limits.aiTokensLimit) {
            return {
                allowed: false,
                remaining,
                limit: limits.aiTokensLimit,
                needed: tokensNeeded,
                reason: `You have reached your AI credits limit (${currentUsed}/${limits.aiTokensLimit}) for the ${tier} plan. Upgrade to Pro for more AI resume generations.`,
            };
        }

        return {
            allowed: true,
            remaining: remaining - tokensNeeded,
            limit: limits.aiTokensLimit,
            needed: tokensNeeded,
        };
    }

    canCreateDraft(
        userId: string,
        planName?: string,
        currentTotalDrafts: number = 0,
    ): { allowed: boolean; reason?: string } {
        const tier = (planName?.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName?.toUpperCase() as PlanTier)
            : 'FREE';
        const limits = PLAN_LIMITS[tier];

        if (currentTotalDrafts >= limits.maxTotalDrafts) {
            return {
                allowed: false,
                reason: `You have reached the maximum of ${limits.maxTotalDrafts} draft${limits.maxTotalDrafts > 1 ? 's' : ''} allowed on the ${tier} plan. Please upgrade to create more drafts.`,
            };
        }

        const dailyCount = this.getDailyDraftsCount(userId);
        if (dailyCount >= limits.maxDailyDrafts) {
            return {
                allowed: false,
                reason: `You have reached your daily creation limit of ${limits.maxDailyDrafts} draft${limits.maxDailyDrafts > 1 ? 's' : ''} per day on the ${tier} plan. Please try again tomorrow or upgrade your plan.`,
            };
        }

        return { allowed: true };
    }

    canExport(
        userId: string,
        planName?: string,
        format: 'pdf' | 'jpg' = 'pdf',
    ): { allowed: boolean; remaining: number; max: number; reason?: string } {
        const tier = (planName?.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName?.toUpperCase() as PlanTier)
            : 'FREE';
        const limits = PLAN_LIMITS[tier];
        const max = format === 'pdf' ? limits.maxPdfExports : limits.maxJpgExports;
        const current = this.getExportCount(userId, format);

        if (max <= 0) {
            return {
                allowed: false,
                remaining: 0,
                max: 0,
                reason: `${format.toUpperCase()} export is not available on the ${tier} plan. Upgrade to Pro for high-resolution ${format.toUpperCase()} downloads.`,
            };
        }

        if (current >= max) {
            return {
                allowed: false,
                remaining: 0,
                max,
                reason: `You have reached the maximum of ${max} ${format.toUpperCase()} download${max > 1 ? 's' : ''} on the ${tier} plan. Upgrade your plan for more downloads.`,
            };
        }

        return {
            allowed: true,
            remaining: max - current,
            max,
        };
    }

    canUseTemplate(
        planName?: string,
        templateId?: string,
        currentUsageCount: number = 0,
    ): { allowed: boolean; reason?: string } {
        const tier = (planName?.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName?.toUpperCase() as PlanTier)
            : 'FREE';
        const limits = PLAN_LIMITS[tier];

        if (limits.allowedTemplates && templateId && !limits.allowedTemplates.includes(templateId)) {
            return {
                allowed: false,
                reason: `Free plan users are restricted to the Classic ATS template. Upgrade to Pro to unlock premium templates.`,
            };
        }

        if (currentUsageCount >= limits.maxTemplateReuse) {
            return {
                allowed: false,
                reason: `On the ${tier} plan, you can use the same template at most ${limits.maxTemplateReuse} time${limits.maxTemplateReuse > 1 ? 's' : ''}. Please select a different template or upgrade your plan.`,
            };
        }

        return { allowed: true };
    }

    async getUserUsage(userId: string, planName?: string): Promise<UserUsageMetrics> {
        const tier = (planName?.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName?.toUpperCase() as PlanTier)
            : 'FREE';
        const limits = PLAN_LIMITS[tier];

        let aiCreditsUsed = this.userAiTokensUsed.get(userId) ?? 0;
        let resumesExported = (this.userExportCounts.get(`${userId}:pdf`) ?? 0) + (this.userExportCounts.get(`${userId}:jpg`) ?? 0);
        let resumesStored = 0;

        try {
            if (prisma?.subscription) {
                const sub = await prisma.subscription.findUnique({
                    where: { userId },
                    select: { downloadsCount: true, aiTokensUsed: true },
                });
                if (sub) {
                    aiCreditsUsed = Math.max(aiCreditsUsed, sub.aiTokensUsed || 0);
                    resumesExported = Math.max(resumesExported, sub.downloadsCount || 0);
                }
            }

            if (prisma?.resume) {
                resumesStored = await prisma.resume.count({ where: { userId } });
            }
        } catch (err) {
            console.warn('[PlanUsageService] Could not fetch complete usage from DB:', err);
        }

        return {
            aiCreditsUsed,
            aiCreditsLimit: limits.aiTokensLimit,
            resumesExported,
            resumesExportLimit: limits.maxPdfExports,
            resumesStored,
            resumesStoreLimit: limits.maxTotalDrafts,
        };
    }
}

export const planUsageService = new PlanUsageService();
