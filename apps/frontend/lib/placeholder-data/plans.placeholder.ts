import { Sparkles, Zap, Crown } from 'lucide-react';

export type PlanId = 'free' | 'pro' | 'enterprise';

export const PLANS = [
  {
    id: 'free' as PlanId,
    monthlyPrice: 0,
    icon: Sparkles,
    isPopular: false,
  },
  {
    id: 'pro' as PlanId,
    monthlyPrice: 9.99,
    icon: Zap,
    isPopular: true,
  },
  {
    id: 'enterprise' as PlanId,
    monthlyPrice: 29.99,
    icon: Crown,
    isPopular: false,
  },
] as const;


export const PLAN_BADGES = {
  free: "border-edge-strong bg-card text-secondary",
  pro: "border-accent/20 bg-accent/10 text-accent",
  enterprise: "border-accent/20 bg-accent/10 text-accent",
} as const;