// lib/plans.ts
import { Sparkles, Zap, Crown } from 'lucide-react';

export type PlanId = 'free' | 'pro' | 'enterprise';

export const PLANS = [
  {
    id: 'free' as PlanId,
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: 'forever',
    icon: Sparkles,
    iconColor: '#94a3b8',
    accentColor: 'rgba(148,163,184,0.12)',
    borderColor: 'rgba(148,163,184,0.2)',
    badge: null,
    features: [
      '3 resume exports / month',
      '5 starter templates',
      'PDF export only',
      'Basic ATS check',
    ],
  },
  {
    id: 'pro' as PlanId,
    name: 'Pro',
    monthlyPrice: 9,
    yearlyPrice: 7,
    period: 'per month',
    icon: Zap,
    iconColor: '#f5a623',
    accentColor: 'rgba(245,166,35,0.12)',
    borderColor: 'rgba(245,166,35,0.35)',
    badge: 'Most Popular',
    features: [
      'Unlimited resume exports',
      '120+ premium templates',
      'PDF, DOCX & LinkedIn export',
      'Full ATS optimizer + score',
      'AI cover letter builder',
      'Real-time preview',
    ],
  },
  {
    id: 'enterprise' as PlanId,
    name: 'Enterprise',
    monthlyPrice: 29,
    yearlyPrice: 23,
    period: 'per month',
    icon: Crown,
    iconColor: '#a78bfa',
    accentColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.3)',
    badge: null,
    features: [
      'Everything in Pro',
      'Team workspace (up to 20)',
      'GPT resume coach',
      'Job-match scoring',
      'LinkedIn sync',
      'Priority support',
    ],
  },
] as const;