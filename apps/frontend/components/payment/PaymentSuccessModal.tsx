"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ArrowRight, X, ShieldCheck, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: "PRO" | "ENTERPRISE" | string;
  transactionId?: string | null;
}

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  planName,
  transactionId,
}: PaymentSuccessModalProps) {
  const t = useTranslations("pricing.successModal");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();

  const formattedPlan = planName.toUpperCase();
  const isEnterprise = formattedPlan === "ENTERPRISE";

  const proFeatures = [
    t("features.pro.0"),
    t("features.pro.1"),
    t("features.pro.2"),
    t("features.pro.3"),
    t("features.pro.4"),
  ];

  const enterpriseFeatures = [
    t("features.enterprise.0"),
    t("features.enterprise.1"),
    t("features.enterprise.2"),
    t("features.enterprise.3"),
    t("features.enterprise.4"),
  ];

  const features = isEnterprise ? enterpriseFeatures : proFeatures;

  const handleGoDashboard = () => {
    onClose();
    router.push(`/${locale}/dashboard`);
  };

  const handleGoPreview = () => {
    onClose();
    router.push(`/${locale}/resume/preview`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold/30 bg-base p-6 sm:p-8 shadow-[0_0_80px_rgba(245,166,35,0.15)] text-primary z-10"
          >
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-vilot/20 blur-3xl" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-primary/5 text-secondary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Top Badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gold">
              <Sparkles size={13} className="text-gold" />
              <span>{t("badge")}</span>
            </div>

            {/* Title & Celebration Header */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/40 bg-linear-to-br from-gold/20 to-gold/5 shadow-[0_0_20px_rgba(245,166,35,0.25)]">
                  <Check size={24} className="text-gold stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-playfair text-2xl font-black leading-tight text-primary">
                    {t("welcomeTitle", { plan: formattedPlan })}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-green animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-green">
                      {t("statusActive")}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-secondary">
                {t("welcomeSubtitle", { plan: formattedPlan })}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="mb-6 rounded-2xl border border-edge bg-primary/3 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">{t("planLabel")}</span>
                <span className="font-bold text-gold flex items-center gap-1.5">
                  <Zap size={13} className="text-gold" />
                  <span>ResuMax {formattedPlan}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">{t("billingCycleLabel")}</span>
                <span className="font-medium text-secondary">{t("billingCycleValue")}</span>
              </div>
              {transactionId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">{t("transactionLabel")}</span>
                  <span className="font-mono text-[11px] text-faint truncate max-w-[200px]">
                    {transactionId}
                  </span>
                </div>
              )}
            </div>

            {/* Unlocked Features List */}
            <div className="mb-7">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-gold" />
                <span>{t("unlockedFeaturesTitle")}</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
                      <Check size={10} className="text-gold stroke-[2.5]" />
                    </div>
                    <span className="text-xs text-secondary leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-ink shadow-[0_8px_24px_rgba(245,166,35,0.3)] hover:bg-gold-light hover:shadow-[0_12px_32px_rgba(245,166,35,0.45)] transition-all cursor-pointer"
              >
                <span>{locale === "ar" ? "رائع، البدء الآن" : "Awesome, Got It!"}</span>
                <Check size={16} className="stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleGoPreview}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-edge-strong bg-primary/5 px-5 py-3.5 text-sm font-semibold text-secondary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
              >
                <span>{t("ctaBuilder")}</span>
                <ArrowRight size={15} className={isRTL ? "rotate-180" : ""} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
