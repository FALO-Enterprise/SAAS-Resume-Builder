export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlanLimits {
    maxTotalDrafts: number;
    maxDailyDrafts: number;
    maxPdfExports: number;
    maxJpgExports: number;
    maxTemplateReuse: number;
    allowedTemplates?: string[];
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
    FREE: {
        maxTotalDrafts: 1,
        maxDailyDrafts: 1,
        maxPdfExports: 1,
        maxJpgExports: 0,
        maxTemplateReuse: 1,
        allowedTemplates: ['minimal'],
    },
    PRO: {
        maxTotalDrafts: 3,
        maxDailyDrafts: 2,
        maxPdfExports: 2,
        maxJpgExports: 2,
        maxTemplateReuse: 2,
    },
    ENTERPRISE: {
        maxTotalDrafts: 5,
        maxDailyDrafts: 4,
        maxPdfExports: 4,
        maxJpgExports: 4,
        maxTemplateReuse: 3,
    },
};

export class PlanUsageService {
    // Tracks daily draft creations: key = `${userId}:${YYYY-MM-DD}`
    private dailyDraftCreations = new Map<string, number>();

    // Tracks export counts per user: key = `${userId}:${format}` (e.g. `user-1:pdf`)
    private userExportCounts = new Map<string, number>();

    private getTodayKey(userId: string): string {
        const today = new Date().toISOString().slice(0, 10);
        return `${userId}:${today}`;
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

    recordExport(userId: string, format: 'pdf' | 'jpg'): number {
        const key = `${userId}:${format}`;
        const count = (this.userExportCounts.get(key) ?? 0) + 1;
        this.userExportCounts.set(key, count);
        return count;
    }

    canCreateDraft(
        userId: string,
        planName: string,
        currentTotalDrafts: number,
    ): { allowed: boolean; reason?: string } {
        const tier = (planName.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName.toUpperCase() as PlanTier)
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
        planName: string,
        format: 'pdf' | 'jpg',
    ): { allowed: boolean; remaining: number; max: number; reason?: string } {
        const tier = (planName.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName.toUpperCase() as PlanTier)
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
        planName: string,
        templateId: string,
        currentUsageCount: number,
    ): { allowed: boolean; reason?: string } {
        const tier = (planName.toUpperCase() as PlanTier) in PLAN_LIMITS
            ? (planName.toUpperCase() as PlanTier)
            : 'FREE';
        const limits = PLAN_LIMITS[tier];

        if (limits.allowedTemplates && !limits.allowedTemplates.includes(templateId)) {
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
}

export const planUsageService = new PlanUsageService();
