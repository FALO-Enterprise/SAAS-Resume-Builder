'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Bot,
  Check,
  ChevronRight,
  TrendingUp,
  Zap,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  analyzeWithAiCoach,
  type AiCoachAnalysisResult,
  type AiCoachTip,
} from '@/lib/backend';
import { getAccessToken } from '@/lib/auth/token';
import { AiCoachSkeleton } from '@/components/ui/Skeletons';

interface AiResumeCoachWidgetProps {
  userPlanName?: string;
  currentDraft?: any;
  resumeId?: string;
  purpose?: string;
  bottomOffsetClassName?: string;
  initialOpen?: boolean;
  onApplyFix?: (
    field: 'summary' | 'title' | 'skills' | 'experience',
    value: any,
    experienceId?: string,
  ) => void;
}

export default function AiResumeCoachWidget({
  userPlanName = 'FREE',
  currentDraft,
  resumeId,
  purpose = 'general',
  bottomOffsetClassName = 'bottom-14',
  initialOpen = false,
  onApplyFix,
}: AiResumeCoachWidgetProps) {
  const t = useTranslations('aiCoach');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiCoachAnalysisResult | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const token = getAccessToken();
      const res = await analyzeWithAiCoach(token || '', {
        draft: currentDraft,
        resumeId,
        purpose,
      });

      setAnalysis(res);
    } catch (err) {
      console.warn('[AiResumeCoach] Failed to analyze:', err);
      toast.error(t('analysisFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const isEnterprise = userPlanName.toUpperCase() === 'ENTERPRISE';

  const [prevIsEnterprise, setPrevIsEnterprise] = useState(isEnterprise);
  if (prevIsEnterprise !== isEnterprise) {
    setPrevIsEnterprise(isEnterprise);
    if (!isEnterprise) {
      setIsOpen(false);
      setAnalysis(null);
    }
  }

  const handleOpen = () => {
    if (!isEnterprise) {
      setShowUpgradeModal(true);
      return;
    }
    setIsOpen(true);
    if (!analysis) {
      void fetchAnalysis();
    }
  };

  useEffect(() => {
    if (initialOpen) {
      handleOpen();
    }
  }, [initialOpen]);

  const [appliedTipIds, setAppliedTipIds] = useState<Set<string>>(new Set());
  const [appliedTipTitles, setAppliedTipTitles] = useState<Set<string>>(new Set());
  const [appliedTargetFields, setAppliedTargetFields] = useState<Set<string>>(new Set());

  const isTipApplied = (tip: AiCoachTip) => {
    if (appliedTipIds.has(tip.id)) return true;
    if (appliedTipTitles.has(tip.title.toLowerCase().trim())) return true;
    const rawTarget = String(tip.suggestedFix?.targetField || tip.category || '').toLowerCase().trim();
    if (rawTarget && appliedTargetFields.has(rawTarget)) return true;
    return false;
  };

  const handleApplyTipFix = (tip: AiCoachTip) => {
    if (!onApplyFix) return;
    const targetField = tip.suggestedFix?.targetField || (tip.category as any) || 'summary';
    const fixVal = tip.suggestedFix?.value || tip.description || tip.title;
    onApplyFix(
      targetField,
      fixVal,
      tip.suggestedFix?.experienceId,
    );

    const normTarget = String(targetField).toLowerCase().trim();
    setAppliedTipIds((prev) => new Set(prev).add(tip.id));
    setAppliedTipTitles((prev) => new Set(prev).add(tip.title.toLowerCase().trim()));
    setAppliedTargetFields((prev) => new Set(prev).add(normTarget));

    toast.success(t('appliedToast', { title: tip.title }));

    setTimeout(() => {
      void fetchAnalysis();
    }, 1200);
  };

  return (
    <>
      {/* Icon-Only Floating Trigger Button (Positioned slightly lower above bottom navigation bar) */}
      <div className={`fixed ${bottomOffsetClassName} inset-e-6 z-40`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleOpen}
          title={t('triggerTitle')}
          className="relative group flex items-center justify-center w-11 h-11 rounded-full bg-linear-to-tr from-amber-500 via-amber-600 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300/50 hover:shadow-amber-500/50 transition-all cursor-pointer"
        >
          <Sparkles size={20} className="text-slate-950 animate-pulse" />
          <span className="absolute -top-1 -inset-e-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-100"></span>
          </span>
        </motion.button>
      </div>

      {/* Main AI Coach Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed ${bottomOffsetClassName === 'bottom-6' ? 'bottom-20' : 'bottom-20'} inset-e-6 z-50 w-105 max-w-[calc(100vw-2rem)] h-155 max-h-[82vh] bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100`}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-100">{t('title')}</h3>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                      {t('badge')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{t('subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setAppliedTipIds(new Set());
                    setAppliedTipTitles(new Set());
                    setAppliedTargetFields(new Set());
                    toast.info(t('rescanToast'));
                    void fetchAnalysis();
                  }}
                  disabled={isLoading}
                  title={t('refreshTitle')}
                  className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* ATS Audit & Executive Coaching Fixes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {isLoading && !analysis ? (
                <AiCoachSkeleton label={t('analyzing')} />
              ) : analysis ? (
                <>
                  {/* Polished Score Card with SVG Radial Ring Gauge */}
                  <div className="relative bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 p-4 rounded-xl border border-amber-500/30 shadow-lg flex items-center justify-between overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="pr-3 z-10">
                      <div className="flex items-center gap-1.5">
                        <Crown size={13} className="text-amber-400" />
                        <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                          {t('scoreLabel')}
                        </span>
                      </div>
                      <div className="text-3xl font-black text-slate-100 flex items-baseline gap-1 mt-1">
                        {analysis.atsScore}
                        <span className="text-xs font-semibold text-slate-400">/100</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {analysis.overallAssessment}
                      </p>
                    </div>

                    {/* SVG Gauge Indicator */}
                    <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-amber-400 transition-all duration-700 ease-out"
                          strokeDasharray={`${analysis.atsScore}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <TrendingUp size={16} className="text-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Bars */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{t('impact')}</span>
                        <span className="font-bold text-slate-200">{analysis.scoreBreakdown.impact}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${analysis.scoreBreakdown.impact}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{t('keywords')}</span>
                        <span className="font-bold text-slate-200">{analysis.scoreBreakdown.keywords}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${analysis.scoreBreakdown.keywords}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Tips with Animated Fade-Out */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-slate-200 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-400" />
                        {t('fixesHeading', {
                          count: analysis.tips.filter((tip) => !isTipApplied(tip)).length,
                        })}
                      </span>
                      {isLoading && <span className="text-[10px] text-amber-400 animate-pulse">{t('refreshingScore')}</span>}
                    </h4>
                    <AnimatePresence>
                      {analysis.tips
                        .filter((tip) => !isTipApplied(tip))
                        .map((tip) => (
                          <motion.div
                            key={tip.id}
                            initial={{ opacity: 1, scale: 1, height: 'auto' }}
                            exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl space-y-2 hover:border-amber-500/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                                {tip.category}
                              </span>
                            </div>
                            <h5 className="font-semibold text-slate-100 text-xs">{tip.title}</h5>
                            <p className="text-[11px] text-slate-300 leading-relaxed">{tip.description}</p>
                            {tip.suggestedFix && onApplyFix && (
                              <button
                                onClick={() => handleApplyTipFix(tip)}
                                className="mt-2 w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Check size={13} />
                                {tip.suggestedActionText || t('applyFix')}
                              </button>
                            )}
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-slate-400">
                  {t('empty')}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Prompt Modal for non-Enterprise Users */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-4 text-slate-100"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-linear-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
                <Crown size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-100">{t('upgrade.title')}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('upgrade.body')}
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  {t('upgrade.close')}
                </button>
                <Link
                  href={`/${locale}/pricing`}
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transition-all cursor-pointer"
                >
                  {t('upgrade.cta')}
                  <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
