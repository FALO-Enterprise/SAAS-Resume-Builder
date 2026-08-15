// lib/plans.ts
import { Sparkles, Zap, Crown } from 'lucide-react';

export type PlanId = 'free' | 'pro' | 'enterprise';

export const PLANS = [
  {
    id: 'free' as PlanId,
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: 'forever',
    icon: Sparkles,
    iconColor: '#94a3b8',
    accentColor: 'rgba(148,163,184,0.12)',
    borderColor: 'rgba(148,163,184,0.2)',
    isPopular: false,
  },
  {
    id: 'pro' as PlanId,
    monthlyPrice: 9,
    yearlyPrice: 7,
    period: 'per month',
    icon: Zap,
    iconColor: '#f5a623',
    accentColor: 'rgba(245,166,35,0.12)',
    borderColor: 'rgba(245,166,35,0.35)',
    isPopular: true,
  },
  {
    id: 'enterprise' as PlanId,
    monthlyPrice: 29,
    yearlyPrice: 23,
    period: 'per month',
    icon: Crown,
    iconColor: '#a78bfa',
    accentColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.3)',
    isPopular: false,
  },
] as const;
