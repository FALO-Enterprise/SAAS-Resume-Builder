import type { PlanId } from "@/lib/placeholder-data/plans.placeholder";

/* What each plan actually allows. These mirror `PLAN_LIMITS` in
   `apps/backend/src/modules/plan/plan-usage.service.ts` and the AI coach gate
   in `resume-coach.service.ts`. The pricing page draws every figure from here,
   so when a backend limit changes, change it here in the same commit.

   The export and credit counts are totals: nothing in the backend resets them
   at renewal, so the page must not call them monthly. */

export type PlanFacts = {
  resumes: number;
  daily: number;
  templates: "classicOnly" | "allSix";
  reuse: number;
  pdf: number;
  jpg: number;
  credits: number;
  coach: boolean;
  watermark: boolean;
};

export const PLAN_FACTS: Record<PlanId, PlanFacts> = {
  free: {
    resumes: 1,
    daily: 1,
    templates: "classicOnly",
    reuse: 1,
    pdf: 1,
    jpg: 0,
    credits: 10,
    coach: false,
    watermark: true,
  },
  pro: {
    resumes: 3,
    daily: 2,
    templates: "allSix",
    reuse: 2,
    pdf: 2,
    jpg: 2,
    credits: 50,
    coach: false,
    watermark: false,
  },
  enterprise: {
    resumes: 5,
    daily: 4,
    templates: "allSix",
    reuse: 3,
    pdf: 4,
    jpg: 4,
    credits: 100,
    coach: true,
    watermark: false,
  },
};

/** Credits one AI-written draft costs (`tokensPerAiBuild` in the backend). */
export const CREDITS_PER_DRAFT = 3;

/** Row order on a plan ticket. */
export const FACT_ROWS = [
  "resumes",
  "daily",
  "templates",
  "reuse",
  "pdf",
  "jpg",
  "credits",
  "coach",
  "watermark",
] as const satisfies readonly (keyof PlanFacts)[];
