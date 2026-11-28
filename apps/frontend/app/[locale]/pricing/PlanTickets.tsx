"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus } from "lucide-react";
import { toast } from "sonner";
import { PLANS, type PlanId } from "@/lib/placeholder-data/plans.placeholder";
import {
  FACT_ROWS,
  PLAN_FACTS,
  type PlanFacts,
} from "@/lib/placeholder-data/pricing.placeholder";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { usePlansQuery } from "@/hooks/queries/usePlans";
import {
  useCreateCheckoutSessionMutation,
  useSyncCheckoutMutation,
} from "@/hooks/mutations/useBillingMutations";
import { getErrorMessage } from "@/lib/api/errors";
import { openPaddleCheckout } from "@/lib/paddle/paddle";
import { getAccessToken } from "@/lib/auth/token";
import PaymentSuccessModal from "@/components/payment/PaymentSuccessModal";

/* The three plans as price tickets hanging from one rail. Every ticket lists
   the same rows in the same order, so the tickets are the comparison table.

   This file owns the checkout: which button a visitor sees, opening Paddle,
   and adopting the new plan only once the backend confirms it. */

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, enterprise: 2 };

const FALLBACK_PRICES = Object.fromEntries(
  PLANS.map((plan) => [plan.id, plan.monthlyPrice]),
) as Record<PlanId, number>;

function formatPrice(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

type CheckoutData = { transaction_id?: string; id?: string };

export default function PlanTickets() {
  const t = useTranslations("pricing");
  const successModalT = useTranslations("pricing.successModal");
  const locale = useLocale();
  const router = useRouter();
  const { isVerified, user, updateUser } = useAuth();

  /* Auth lives in browser storage, so the server render and the first client
     render both treat the visitor as signed out. */
  const signedIn = useIsClient() && isVerified && Boolean(user);
  const currentPlanId = (user?.planName?.toLowerCase() ?? "free") as PlanId;
  const currentRank = PLAN_RANK[currentPlanId] ?? 0;

  const [checkingOutPlan, setCheckingOutPlan] = useState<PlanId | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [upgradedPlanName, setUpgradedPlanName] = useState("PRO");
  const [upgradedTransactionId, setUpgradedTransactionId] = useState<
    string | null
  >(null);

  /* Prices live in the Plan table. They are derived from the query, not
     mirrored into state, so a refetch cannot leave a stale price on screen. */
  const { data: plans } = usePlansQuery();
  const createCheckoutSession = useCreateCheckoutSessionMutation();
  const syncCheckout = useSyncCheckoutMutation();

  const planPrices = useMemo(() => {
    const next = { ...FALLBACK_PRICES };
    for (const plan of plans ?? []) {
      const id = plan.name.toLowerCase() as PlanId;
      if (id in next && typeof plan.price === "number") next[id] = plan.price;
    }
    return next;
  }, [plans]);

  const goToRegister = (planId: PlanId) =>
    router.push(`/${locale}/createaccount?plan=${planId}`);

  const handlePlanAction = async (planId: PlanId) => {
    if (!signedIn || !user) {
      goToRegister(planId);
      return;
    }

    if (planId === "free" || PLAN_RANK[planId] < currentRank) {
      toast.info(t("toast.manage"));
      return;
    }

    try {
      setCheckingOutPlan(planId);
      if (!getAccessToken()) {
        goToRegister(planId);
        return;
      }

      const session = await createCheckoutSession.mutateAsync(planId);

      /* A placeholder or product id here is a deployment mistake, not
         something the visitor can act on: log the detail, show a plain
         message. */
      if (
        !session.priceId ||
        session.priceId.includes("default") ||
        session.priceId.startsWith("pro_")
      ) {
        console.error("Paddle price id is not configured:", session.priceId);
        toast.error(t("toast.unavailable"));
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
          const data = checkoutData as CheckoutData;
          const transactionId = data?.transaction_id || data?.id || null;

          toast.success(t("toast.welcome", { plan: targetPlan }));

          /* Only adopt the plan the backend confirms. The plan name is
             persisted to localStorage, so adopting it after a failed sync
             would unlock gated features on a lie that survives reloads. */
          try {
            const synced = await syncCheckout.mutateAsync({
              planId: targetPlan,
              transactionId: transactionId || undefined,
            });
            updateUser({
              ...user,
              planName: synced.plan as "PRO" | "ENTERPRISE",
            });
          } catch (err) {
            console.error("Auto sync checkout error:", err);
            toast.error(successModalT("syncPending"));
          }

          setUpgradedPlanName(targetPlan);
          setUpgradedTransactionId(transactionId);
          setSuccessModalOpen(true);
        },
      });

      if (!opened) toast.error(t("toast.openFailed"));
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(getErrorMessage(error, t("toast.initFailed")));
    } finally {
      setCheckingOutPlan(null);
    }
  };

  const factValue = (key: keyof PlanFacts, facts: PlanFacts) => {
    const value = facts[key];
    if (key === "templates") return t(`values.${facts.templates}`);
    if (key === "watermark")
      return t(facts.watermark ? "values.watermarked" : "values.clean");
    if (value === true) return t("values.included");
    if (value === false || value === 0) {
      return (
        <>
          <Minus size={16} aria-hidden className="inline text-lp-ink3" />
          <span className="sr-only">{t("values.notIncluded")}</span>
        </>
      );
    }
    return (
      <span className="lp-mono text-[14px]! tracking-normal!">{value}</span>
    );
  };

  return (
    <>
      <div className="relative">
        {/* The rail the tickets hang from */}
        <div
          className="absolute inset-x-0 top-0 hidden h-0.5 bg-lp-ink lg:block"
          aria-hidden
        />

        <ul className="grid gap-6 lg:grid-cols-3 lg:gap-5">
          {PLANS.map((plan) => {
            const facts = PLAN_FACTS[plan.id];
            const price = planPrices[plan.id];
            const isFree = price === 0;
            const name = t(`plans.items.${plan.id}.name`);
            const isCurrent = signedIn && currentPlanId === plan.id;
            const isDowngrade = signedIn && PLAN_RANK[plan.id] < currentRank;
            const busy = checkingOutPlan === plan.id;
            const featured = plan.id === "pro";

            const label = busy
              ? t("plans.opening")
              : !signedIn
                ? isFree
                  ? t("plans.getStarted")
                  : t("plans.startPlan", { plan: name })
                : isDowngrade
                  ? isFree
                    ? t("plans.downgradeToFree")
                    : t("plans.downgradePlan", { plan: name })
                  : t("plans.upgradePlan", { plan: name });

            return (
              <li key={plan.id} className="flex flex-col lg:pt-10">
                {/* String and punched hole */}
                <span
                  className="mx-auto hidden h-10 border-s-[1.5px] border-lp-ink lg:-mt-10 lg:block"
                  aria-hidden
                />
                <article
                  className={`relative flex flex-1 flex-col overflow-hidden rounded-lg p-7 shadow-(--lp-shadow) sm:p-8 ${
                    featured ? "lp-night" : "bg-lp-card text-lp-ink"
                  }`}
                >
                  <span
                    className="absolute inset-s-1/2 top-3 hidden size-3 -translate-x-1/2 rounded-full bg-lp-mat lg:block rtl:translate-x-1/2"
                    aria-hidden
                  />

                  <h2 className="mt-3 text-[26px] font-bold tracking-[-0.03em] rtl:tracking-normal">
                    {name}
                  </h2>
                  <p className="mt-1 text-[15.5px] text-lp-ink2">
                    {t(`plans.items.${plan.id}.blurb`)}
                  </p>

                  <p className="mt-7 flex items-baseline gap-1.5" dir="ltr">
                    <span className="text-[22px] font-semibold">$</span>
                    <span className="lp-display text-[64px]">
                      {formatPrice(price)}
                    </span>
                  </p>
                  <p className="lp-label mt-1 text-lp-ink2">
                    {isFree
                      ? t("plans.alwaysFree")
                      : `${t("plans.perMonth")} · ${t("plans.billedMonthly")}`}
                  </p>

                  <div className="mt-7 flex min-h-15 items-center">
                    {isCurrent ? (
                      <p className="w-full rounded-lg border border-dashed border-lp-rule-strong px-4 py-4 text-center text-[15px] font-semibold text-lp-ink2">
                        {t("plans.currentPlan")}
                      </p>
                    ) : isDowngrade ? (
                      <button
                        type="button"
                        onClick={() => void handlePlanAction(plan.id)}
                        className="lp-link cursor-pointer bg-transparent py-3 text-[16px]"
                      >
                        {label}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handlePlanAction(plan.id)}
                        disabled={busy}
                        aria-busy={busy}
                        className="lp-tag w-full justify-between disabled:cursor-progress disabled:opacity-70"
                      >
                        {label}
                        <ArrowRight
                          size={18}
                          aria-hidden
                          className="shrink-0 rtl:-scale-x-100"
                        />
                      </button>
                    )}
                  </div>

                  <dl className="mt-8 border-t border-lp-rule-strong">
                    {FACT_ROWS.map((key) => (
                      <div
                        key={key}
                        className="flex items-baseline justify-between gap-4 border-b border-lp-rule py-3"
                      >
                        <dt className="text-[14.5px] text-lp-ink2">
                          {t(`rows.${key}`)}
                        </dt>
                        <dd className="text-end text-[14.5px] font-semibold">
                          {factValue(key, facts)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <PaymentSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        planName={upgradedPlanName}
        transactionId={upgradedTransactionId}
      />
    </>
  );
}
