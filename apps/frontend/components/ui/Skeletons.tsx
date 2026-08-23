"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Crown, FileText, Layers, LayoutDashboard, Zap } from "lucide-react";
import Logo from "@/components/ui/Logo";
import SidebarAccountMenu from "@/components/dashboard/SidebarAccountMenu";

/**
 * A single skeleton block.
 *
 * `bg` defaults to the theme-aware `bg-edge` (`bg-card` is ~3% alpha, which is
 * all but invisible). Pass it explicitly for surfaces that opt out of the theme
 * tokens — e.g. the AI coach panel, which is hardcoded slate/amber.
 * It is a separate prop rather than part of `className` so the two background
 * utilities can never collide and leave the winner up to stylesheet order.
 */
export function Bone({
  className = "",
  bg = "bg-edge",
}: {
  className?: string;
  bg?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md ${bg} ${className}`}
    />
  );
}

export function ResetPasswordSkeleton({
  label = "Loading reset password form",
}: {
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative z-10"
      aria-busy="true"
      aria-label={label}
    >
      {/* Icon badge */}
      <div className="mb-7 flex justify-center">
        <Bone className="h-15.5 w-15.5 rounded-2xl" />
      </div>

      {/* Title + subtitle */}
      <div className="mb-9 flex flex-col items-center gap-3">
        <Bone className="h-7 w-70 rounded-lg" />
        <div className="flex flex-col items-center gap-2">
          <Bone className="h-3.5 w-90 rounded" />
          <Bone className="h-3.5 w-56 rounded" />
        </div>
      </div>

      {/* Password field */}
      <div className="mb-5 flex flex-col gap-2">
        <Bone className="h-3 w-28 rounded" />
        <Bone className="h-13.5 w-full rounded-xl" />
      </div>

      {/* Confirm password field */}
      <div className="mb-8 flex flex-col gap-2">
        <Bone className="h-3 w-34 rounded" />
        <Bone className="h-13.5 w-full rounded-xl" />
      </div>

      {/* Submit button */}
      <Bone className="mb-8 h-13.5 w-full rounded-xl" />

      {/* Divider */}
      <div className="border-t border-edge pt-8 text-center">
        <Bone className="mx-auto h-3.5 w-24 rounded" />
      </div>
    </motion.div>
  );
}

export function DraftsGridSkeleton({
  count = 3,
  label = "Loading drafts",
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-busy="true"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-edge bg-elevated/50 p-5 space-y-4"
        >
          <Bone className="aspect-1/1.25 w-full rounded-2xl" />
          <Bone className="h-5 w-3/4 rounded-lg" />
          <Bone className="h-3 w-1/2 rounded-lg" />
        </div>
      ))}
    </div>
  );
}


export function DashboardSkeleton({ label }: { label?: string }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <div
      className="flex h-dvh overflow-hidden bg-base font-syne"
      aria-busy="true"
      aria-label={label ?? t("loadingDraft")}
    >
      {/* Ambient glows — mirrors the real shell */}
      <div className="pointer-events-none fixed right-[15%] top-[20%] z-0 h-100 w-100 rounded-full bg-gold/4 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[20%] right-[30%] z-0 h-75 w-75 rounded-full bg-azure/4 blur-[80px]" />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 inset-s-0 z-50 hidden h-dvh w-70 min-w-70 flex-col border-e border-edge bg-soft lg:sticky lg:top-0 lg:z-auto lg:flex lg:w-65 lg:min-w-65">
        {/* Logo + back link — REAL */}
        <div className="px-6 pt-7">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}`} aria-label="ResuMax home">
              <Logo />
            </Link>
          </div>
          <Link
            href={`/${locale}`}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted no-underline transition-colors hover:text-secondary"
          >
            <LayoutDashboard size={12} /> {t("backToHome")}
          </Link>
        </div>

        {/* Progress card — chrome real, step counter + segments boned */}
        <div className="px-6 pb-6 pt-7">
          <div className="rounded-[14px] border border-gold/12 bg-gold/6 px-4.5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[15px] font-bold text-primary">
                  {t("onboarding")}
                </div>
                <Bone className="mt-1.5 h-2.5 w-24 rounded" />
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gold/25 bg-gold/12">
                <Bone className="h-3 w-6 rounded" />
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => (
                <Bone key={i} className="h-0.75 flex-1 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="mx-6 h-px bg-edge" />

        {/* Step nav — order and state are draft-derived, so all six rows are bones */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 px-3">
          <p className="px-2 pb-1 text-[10px] leading-4 text-muted">
            {t("reorder.hint")}
          </p>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-gold/10 px-3.5 py-3"
            >
              <Bone className="h-9 w-9 shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1">
                <Bone className="h-3 w-24 rounded" />
                <Bone className="mt-1.5 h-2.5 w-32 rounded" />
              </div>
            </div>
          ))}
        </nav>

        <div className="mx-6 h-px bg-edge" />

        {/* Account row (avatar / name / plan) — REAL, sourced from AuthContext */}
        <SidebarAccountMenu />
      </aside>

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="relative z-1 flex h-dvh min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-edge bg-elevated/90 px-3 py-2 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Bone className="h-5 w-5 rounded lg:hidden" />
            <div className="flex min-w-0 items-center gap-2">
              <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/15 text-gold sm:flex">
                <FileText size={14} />
              </div>
              <div>
                <Bone className="h-3 w-36 rounded" />
                <Bone className="mt-1.5 h-2 w-28 rounded" />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-edge bg-card px-2.5 py-1 shadow-xs">
              <Layers size={12} className="shrink-0 text-gold" />
              <Bone className="hidden h-2.5 w-16 rounded sm:block" />
              <Bone className="h-3 w-4 rounded-md" />
            </div>
          </div>
        </header>

        {/* Scroll area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-6 sm:px-8 lg:px-15 lg:pt-8">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,860px)_300px] 2xl:gap-10">
            {/* Step 1 (contact) panel */}
            <div className="min-w-0 max-w-215 xl:max-w-none">
              {/* Badge pill */}
              <Bone className="mb-6 h-6.5 w-44 rounded-full" />

              {/* Heading (two lines) */}
              <div className="mb-3.5 flex flex-col gap-2.5">
                <Bone className="h-9 w-[70%] max-w-125 rounded-lg" />
                <Bone className="h-9 w-[45%] max-w-90 rounded-lg" />
              </div>

              {/* Subtitle */}
              <div className="mb-9 flex max-w-130 flex-col gap-2">
                <Bone className="h-3.5 w-full rounded" />
                <Bone className="h-3.5 w-4/5 rounded" />
              </div>

              {/* Section completion meter */}
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <Bone className="h-3 w-28 rounded" />
                  <Bone className="h-3 w-14 rounded" />
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-card">
                  <Bone className="h-full w-1/4 rounded-full" />
                </div>
              </div>

              {/* The eight contact field cards */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-[14px] border border-edge bg-card px-5 py-4.5 shadow-[0_2px_8px_var(--shadow-color)]"
                  >
                    <div className="mb-2.5 flex items-center gap-2">
                      <Bone className="h-7 w-7 shrink-0 rounded-lg" />
                      <Bone className="h-2.5 w-20 rounded" />
                    </div>
                    <Bone className="ms-9 h-4 w-3/5 rounded" />
                  </div>
                ))}
              </div>

              {/* ATS tip callout */}
              <div className="mt-7 flex items-start gap-3.5 rounded-[14px] border border-azure/15 bg-azure/[0.07] px-5 py-4">
                <Bone className="h-8 w-8 shrink-0 rounded-[9px]" />
                <div className="flex-1">
                  <Bone className="mb-2 h-2.5 w-28 rounded" />
                  <Bone className="h-3 w-full rounded" />
                  <Bone className="mt-1.5 h-3 w-4/5 rounded" />
                </div>
              </div>
            </div>

            {/* Right rail preview */}
            <aside className="hidden self-start xl:sticky xl:top-6 xl:block xl:h-fit">
              <div className="rounded-2xl border border-edge bg-card p-4 shadow-[0_18px_55px_var(--shadow-color)] 2xl:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <Bone className="h-8 w-8 rounded-lg" />
                  <Bone className="h-3 w-20 rounded" />
                </div>
                <Bone className="mx-auto aspect-210/297 w-full rounded-xl" />
              </div>
            </aside>
          </div>
        </div>

        {/* Footer nav bar */}
        <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-3 border-t border-edge bg-base/80 px-5 py-3.5 backdrop-blur-[20px] sm:px-8 lg:px-15 lg:py-4.5">
          <Bone className="h-4 w-24 rounded" />
          <div className="hidden items-center gap-2 sm:flex">
            <Bone className="h-1.5 w-6 rounded-full" />
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="h-1.5 w-1.5 rounded-full" />
            ))}
          </div>
          <Bone className="h-11 w-40 shrink-0 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Resume Coach — panel body while Gemini analyses the draft
//
// This widget opts out of the app theme tokens (fixed slate/amber palette), so
// its bones are slate rather than bg-edge. Static chrome — the Crown/Zap icons
// and their labels, the gauge track — stays real; only analysis-derived values
// become bones.
// ─────────────────────────────────────────────────────────────────────────────
const COACH_BONE = "bg-slate-700/60";

export function AiCoachSkeleton({
  label = "Analyzing resume against global ATS benchmarks",
}: {
  label?: string;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label={label}>
      {/* Score card */}
      <div className="relative bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 p-4 rounded-xl border border-amber-500/30 shadow-lg flex items-center justify-between overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="pr-3 z-10 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Crown size={13} className="text-amber-400" />
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
              ATS Readiness Score
            </span>
          </div>
          {/* score + /100 */}
          <Bone bg={COACH_BONE} className="mt-1.5 h-8 w-20 rounded-lg" />
          {/* overall assessment, two lines */}
          <Bone bg={COACH_BONE} className="mt-2 h-2.5 w-full rounded" />
          <Bone bg={COACH_BONE} className="mt-1.5 h-2.5 w-4/5 rounded" />
        </div>

        {/* Gauge — real track ring, no progress arc yet */}
        <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex items-center justify-center">
            <Bone bg={COACH_BONE} className="h-4 w-4 rounded" />
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <Bone bg={COACH_BONE} className="h-2 w-20 rounded" />
              <Bone bg={COACH_BONE} className="h-2 w-6 rounded" />
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <Bone bg={COACH_BONE} className="h-full w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Coaching fixes */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
          <Zap size={14} className="text-amber-400" />
          Executive Coaching Fixes
        </h4>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl space-y-2"
          >
            {/* category chip */}
            <Bone bg={COACH_BONE} className="h-3.5 w-20 rounded" />
            {/* title */}
            <Bone bg={COACH_BONE} className="h-3 w-3/4 rounded" />
            {/* description */}
            <Bone bg={COACH_BONE} className="h-2.5 w-full rounded" />
            <Bone bg={COACH_BONE} className="h-2.5 w-5/6 rounded" />
            {/* apply-fix button */}
            <Bone bg={COACH_BONE} className="h-7 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
