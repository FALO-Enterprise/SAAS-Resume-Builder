"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, ArrowRight, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/placeholder-data/plans.placeholder";
import {
  TABLE_SECTIONS,
  type CellValue,
} from "@/lib/placeholder-data/pricing.placeholder";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { createCheckoutSession, syncBillingCheckout } from "@/lib/backend";
import { openPaddleCheckout } from "@/lib/paddle/paddle";
import PaymentSuccessModal from "@/components/payment/PaymentSuccessModal";

// ─────────────────────────────────────────────────────────────────────────────
// Cell renderer — handles boolean | string values in table
// ─────────────────────────────────────────────────────────────────────────────
function Cell({
  value,
  highlight,
}: {
  value: boolean | string;
  highlight?: boolean;
}) {
  if (typeof value === "boolean") {
    return value ? (
      <span
        className={`mx-auto flex h-5.5 w-5.5 items-center justify-center rounded-full border ${highlight ? "border-gold/30 bg-gold/15" : "border-green/25 bg-green/12"}`}
      >
        <Check size={12} className={highlight ? "text-gold" : "text-green"} />
      </span>
    ) : (
      <span className="flex justify-center">
        <X size={15} className="text-muted" />
      </span>
    );
  }
  return (
    <span
      className={`text-[13px] font-semibold ${highlight ? "text-gold" : "text-secondary"}`}
    >
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolves a table cell value, translating i18n-keyed values on the fly
// ─────────────────────────────────────────────────────────────────────────────
function resolveCellValue(
  value: CellValue,
  t: ReturnType<typeof useTranslations>,
): boolean | string {
  if (typeof value === "object") {
    return t(value.i18nKey, value.params);
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Item
// ─────────────────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-edge last:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent py-5 text-left"
      >
        <span className="text-[15px] font-semibold leading-[1.4] text-primary">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronDown size={18} className="text-faint" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[14px] leading-[1.8] text-secondary">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();
  const { isVerified, user, updateUser } = useAuth();
  const currentPlanId = (user?.planName?.toLowerCase() ?? "free") as PlanId;
  const [checkingOutPlan, setCheckingOutPlan] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [upgradedPlanName, setUpgradedPlanName] = useState<string>("PRO");
  const [upgradedTransactionId, setUpgradedTransactionId] = useState<string | null>(null);

  const goToRegister = (planId: PlanId) => {
    router.push(`/${locale}/createaccount?plan=${planId}`);
  };

  const handlePlanAction = async (planId: PlanId) => {
    if (!isVerified || !user) {
      goToRegister(planId);
      return;
    }

    if (planId === "free") {
      toast.info(
        locale === "ar"
          ? "أنت بالفعل على الخطة المجانية، أو يمكنك إدارة اشتراكك من الإعدادات"
          : "You can manage or cancel your active subscription in Settings."
      );
      return;
    }

    try {
      setCheckingOutPlan(planId);
      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;
      if (!token) {
        goToRegister(planId);
        return;
      }

      const session = await createCheckoutSession(token, planId);

      if (!session.priceId || session.priceId.includes('default')) {
        toast.error(
          locale === "ar"
            ? "يرجى إضافة معرف السعر PADDLE_PRICE_ID الخاص بك في ملف .env أولاً"
            : "Please set your real Paddle Price ID in .env (e.g. pri_01...)"
        );
        return;
      }

      if (session.priceId.startsWith('pro_')) {
        toast.error(
          locale === "ar"
            ? "لقد استخدمت معرف المنتج (pro_...) بدلاً من معرف السعر (pri_...). يرجى نسخ معرف السعر من لوحة تحكم Paddle."
            : "You provided a Product ID (pro_...) instead of a Price ID (pri_...). Please copy the Price ID from Paddle dashboard."
        );
        return;
      }

      const opened = await openPaddleCheckout({
        priceId: session.priceId,
        userId: user.id,
        userEmail: user.email,
        planId: session.planId,
        locale: locale === "ar" ? "ar" : "en",
        onSuccess: async (checkoutData) => {
          const targetPlan = session.planId.toUpperCase();
          const transactionId = (checkoutData as { transaction_id?: string; id?: string })?.transaction_id || (checkoutData as { transaction_id?: string; id?: string })?.id || null;

          toast.success(
            locale === "ar"
              ? `أهلاً بك في باقة ${targetPlan}! تم ترقية حسابك بنجاح.`
              : `Welcome to ${targetPlan}! Your account is now active.`
          );

          try {
            await syncBillingCheckout(token, {
              planId: targetPlan,
              transactionId: transactionId || undefined,
            });
          } catch (err) {
            console.error("Auto sync checkout error:", err);
          }

          updateUser({
            ...user,
            planName: targetPlan as "PRO" | "ENTERPRISE",
          });

          setUpgradedPlanName(targetPlan);
          setUpgradedTransactionId(transactionId);
          setSuccessModalOpen(true);
        },
      });

      if (!opened) {
        toast.error(
          locale === "ar"
            ? "تعذر فتح نافذة الدفع، يرجى المحاولة لاحقاً"
            : "Could not open checkout overlay. Please try again."
        );
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Checkout initialization failed");
    } finally {
      setCheckingOutPlan(null);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-base text-primary">
      {/* ── Background glows ─────────────────────────────── */}
      <div className="pointer-events-none fixed left-[5%] top-[5%] z-0 h-125 w-125 rounded-full bg-gold/4 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[10%] right-[5%] z-0 h-100 w-100 rounded-full bg-vilot/5 blur-3xl" />

      <Navbar />

      <div className="relative z-1 mx-auto max-w-7xl px-6">
        {/* ── Hero header ──────────────────────────────────── */}
        <div className="pb-16 pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
              {t("pricing.hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 font-playfair text-[clamp(32px,5vw,56px)] font-black leading-[1.08] tracking-tight"
          >
            <span className="text-primary">{t("pricing.hero.titleLine1")}</span>
            <br />
            <span className="text-gradient-gold">
              {t("pricing.hero.titleHighlight")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-xl text-base leading-[1.7] text-secondary"
          >
            {t("pricing.hero.subtitle")}
          </motion.p>
        </div>

        {/* ── Plan cards ───────────────────────────────────── */}
        <div className="mb-20 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-5">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isPopular = plan.isPopular;
            const isFree = plan.monthlyPrice === 0;
            const planName = t(`pricing.plans.items.${plan.id}.name`);
            const planFeatures = t.raw(
              `pricing.plans.items.${plan.id}.features`,
            ) as string[];

            const isCurrentPlan = isVerified && currentPlanId === plan.id;
            const isDowngradeToFree = isVerified && currentPlanId !== "free" && isFree;

            let ctaLabel = "";
            if (isVerified) {
              if (isCurrentPlan) {
                ctaLabel = t("pricing.plans.currentPlan");
              } else if (isDowngradeToFree) {
                ctaLabel =
                  t("pricing.plans.downgradeToFree") || "Downgrade to Free";
              } else {
                ctaLabel = t("pricing.plans.upgradePlan", { plan: planName });
              }
            } else {
              ctaLabel = isFree
                ? t("pricing.plans.getStarted")
                : t("pricing.plans.startPlan", { plan: planName });
            }

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-3xl border px-7 pb-7 pt-8 ${isPopular ? "-mt-3 border-gold/30 bg-gold/6 shadow-[0_0_50px_rgba(245,166,35,0.08)]" : "border-edge bg-primary/2"}`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-linear-to-br from-gold to-gold-dark px-4.5 py-1.25 text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink">
                    ⚡ {t("pricing.plans.popular")}
                  </div>
                )}

                {/* Plan icon + name */}
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{
                      background: plan.accentColor,
                      borderColor: plan.borderColor,
                    }}
                  >
                    <Icon size={22} color={plan.iconColor} />
                  </div>
                  <div>
                    <div className="text-[17px] font-bold text-primary">
                      <div className="flex items-center gap-2">
                        <span>{planName}</span>
                        {isCurrentPlan && (
                          <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                            {t("pricing.plans.currentPlan")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted">
                      {isFree
                        ? t("pricing.plans.alwaysFree")
                        : t("pricing.plans.billedMonthly")}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-semibold text-secondary">
                      $
                    </span>
                    <span className="font-playfair text-[44px] font-black leading-none text-primary">
                      {plan.monthlyPrice}
                    </span>
                    {!isFree && (
                      <span className="mb-1 self-end text-[13px] text-muted">
                        {t("pricing.plans.perMonth")}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA button */}
                <button
                  type="button"
                  onClick={() => void handlePlanAction(plan.id)}
                  disabled={(isVerified && isCurrentPlan) || checkingOutPlan === plan.id}
                  aria-disabled={(isVerified && isCurrentPlan) || checkingOutPlan === plan.id}
                  className={`mb-7 w-full rounded-xl py-3.5 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none ${isVerified && isCurrentPlan
                      ? "pointer-events-none border border-edge bg-primary/5 text-primary/55"
                      : isDowngradeToFree
                        ? "border border-edge-strong bg-primary/5 text-secondary hover:bg-primary/10 hover:text-primary"
                        : "bg-gold text-ink shadow-[0_8px_24px_rgba(245,166,35,0.3)] hover:bg-gold-light hover:shadow-[0_12px_32px_rgba(245,166,35,0.45)]"
                    }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span>{ctaLabel}</span>
                    {!isCurrentPlan && <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />}
                  </span>
                </button>

                {/* Divider */}
                <div className="mb-6 h-px bg-edge" />

                {/* Features */}
                <div className="flex flex-col gap-3">
                  {planFeatures.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <div
                        className="mt-px flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border"
                        style={{
                          background: plan.accentColor,
                          borderColor: plan.borderColor,
                        }}
                      >
                        <Check size={10} color={plan.iconColor} />
                      </div>
                      <span className="text-[13px] leading-normal text-secondary">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Comparison table ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-25"
        >
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-playfair text-[clamp(28px,4vw,42px)] font-extrabold text-primary">
              {t("pricing.table.title")}
            </h2>
            <p className="text-[15px] text-faint">
              {t("pricing.table.subtitle")}
            </p>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-edge bg-primary/2">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-edge bg-primary/3">
              <div className="px-6 py-5 text-xs font-bold uppercase tracking-[0.08em] text-faint">
                {t("pricing.table.featureHeader")}
              </div>
              {PLANS.map((p) => (
                <div key={p.id} className="px-4 py-5 text-center">
                  <span
                    className={`text-sm font-bold ${p.id === "pro" ? "text-gold" : "text-primary"}`}
                  >
                    {t(`pricing.plans.items.${p.id}.name`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Sections */}
            {TABLE_SECTIONS.map((section, si) => (
              <div key={section.key}>
                <div
                  className={`bg-primary/2 px-6 py-3.5 ${si > 0 ? "border-t border-edge" : ""}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                    {t(`pricing.table.sections.${section.key}`)}
                  </span>
                </div>
                {section.rows.map((row, ri) => (
                  <div
                    key={row.key}
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr] border-t border-edge transition-colors duration-200 hover:bg-primary/3 ${ri % 2 === 0 ? "" : "bg-primary/12"}`}
                  >
                    <div className="flex items-center px-6 py-3.5 text-[13px] text-secondary">
                      {t(`pricing.table.rows.${row.key}`)}
                    </div>
                    <div className="flex items-center justify-center px-4 py-3.5">
                      <Cell value={resolveCellValue(row.free, t)} />
                    </div>
                    <div className="flex items-center justify-center bg-gold/3 px-4 py-3.5">
                      <Cell value={resolveCellValue(row.pro, t)} highlight />
                    </div>
                    <div className="flex items-center justify-center px-4 py-3.5">
                      <Cell value={resolveCellValue(row.enterprise, t)} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-25 max-w-180"
        >
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-playfair text-[clamp(28px,4vw,42px)] font-extrabold text-primary">
              {t("pricing.faq.title")}
            </h2>
            <p className="text-[15px] text-faint">
              {t("pricing.faq.subtitle")}
            </p>
          </div>

          <div className="rounded-[20px] border border-edge bg-primary/2 px-8 py-2">
            {(t.raw("pricing.faq.items") as { q: string; a: string }[]).map(
              (faq) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ),
            )}
          </div>
        </motion.div>

        {currentPlanId === "free" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mb-20 overflow-hidden rounded-3xl border border-gold/15 bg-gold/5 px-8 py-15 text-center"
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-50 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/6 blur-[60px]" />
            <div className="relative z-1">
              <h2 className="mb-3 font-playfair text-[clamp(26px,4vw,40px)] font-extrabold text-primary">
                {t("pricing.ctaBottom.title")}
              </h2>
              <p className="mx-auto mb-8 max-w-110 text-[15px] text-secondary">
                {t("pricing.ctaBottom.subtitle")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => goToRegister("free")}
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-4 text-[15px] font-bold text-ink shadow-[0_8px_28px_rgba(245,166,35,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light"
                >
                  {t("pricing.ctaBottom.primaryButton")}{" "}
                  <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                </button>
                <button
                  onClick={() => goToRegister("pro")}
                  className="inline-flex items-center gap-2 rounded-xl border border-edge-strong bg-primary/6 px-8 py-4 text-[15px] font-semibold text-primary/80 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                >
                  {t("pricing.ctaBottom.secondaryButton")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <PaymentSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        planName={upgradedPlanName}
        transactionId={upgradedTransactionId}
      />

      <Footer />
    </main>
  );
}
