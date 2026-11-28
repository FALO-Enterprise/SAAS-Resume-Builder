"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid, List, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDraftsFlow } from "@/hooks/mutations/useDraftsFlow";
import type { ResumeDraftItem } from "@/lib/backend";
import { templates } from "@/lib/placeholder-data/templates.placeholder";
import { PLAN_FACTS } from "@/lib/placeholder-data/pricing.placeholder";
import type { PlanId } from "@/lib/placeholder-data/plans.placeholder";


type SortKey = "newest" | "oldest" | "title" | "template";

const WRAP = "mx-auto w-full max-w-330 px-5 sm:px-8";
const FIELD =
  "min-h-11 border border-lp-rule-strong bg-lp-card px-3.5 text-[15px] text-lp-ink outline-offset-2 placeholder:text-lp-ink3";
const QUIET_BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-lp-rule-strong bg-lp-card px-4 text-[15px] font-semibold text-lp-ink transition-colors duration-200 hover:bg-lp-soft disabled:cursor-not-allowed disabled:opacity-60";

function relativeTime(
  dateStr: string,
  locale: string,
  t: ReturnType<typeof useTranslations>,
) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return t("relativeTime.justNow");
  if (minutes < 60) return t("relativeTime.minutesAgo", { count: minutes });
  if (hours < 24) return t("relativeTime.hoursAgo", { count: hours });
  if (days === 1) return t("relativeTime.yesterday");
  if (days < 30) return t("relativeTime.daysAgo", { count: days });

  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function thumbnailFor(draft: ResumeDraftItem) {
  const fallback = templates.find((t) => t.id === "minimal") ?? templates[0];
  const id = draft.templateId?.toLowerCase();
  const name = draft.templateName?.toLowerCase();
  const match =
    templates.find((t) => t.id === id) ??
    (name
      ? templates.find((t) => name.includes(t.id) || t.id.includes(name))
      : undefined);
  return (match ?? fallback).image;
}

/* A native <dialog> driven by state: the browser supplies the focus trap,
   Escape and the inert page behind it. */
function Modal({
  open,
  onClose,
  labelledBy,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(100%-1.5rem,30rem)] bg-lp-paper p-0 text-lp-ink shadow-(--lp-shadow) backdrop:bg-[#1c1830]/75"
    >
      {open && (
        <div className="p-7 sm:p-8">
          {children}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute inset-e-3 top-3 flex size-11 cursor-pointer items-center justify-center text-lp-ink hover:bg-lp-soft"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
      )}
    </dialog>
  );
}

export default function DraftsBoard() {
  const t = useTranslations("drafts");
  const locale = useLocale();
  const { user } = useAuth();

  const flowMessages = useMemo(
    () => ({
      loadFailed: t("errors.loadFailed"),
      createSuccess: t("createSuccess"),
      createFailed: t("errors.createFailed"),
      renameSuccess: t("renameSuccess"),
      renameFailed: t("errors.renameFailed"),
      deleteSuccess: t("deleteSuccess"),
      deleteFailed: t("errors.deleteFailed"),
    }),
    [t],
  );

  const {
    drafts,
    isLoading,
    createDraft,
    isCreating,
    renamingDraft,
    newTitle,
    setNewTitle,
    openRename,
    closeRename,
    saveRename,
    isSavingTitle,
    deletingDraft,
    openDelete,
    closeDelete,
    confirmDelete,
    isDeleting,
    showUpgradeModal,
    closeUpgradeModal,
  } = useDraftsFlow(flowMessages);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const rawPlan = user?.planName?.toLowerCase() ?? "free";
  const planKey: PlanId = rawPlan in PLAN_FACTS ? (rawPlan as PlanId) : "free";
  const maxDrafts = PLAN_FACTS[planKey].resumes;
  const planLabel = t(`plans.${planKey}`);
  /* Enterprise is the top plan: there is nothing to upgrade to, so the limit
     dialog says how to free a slot instead. */
  const canUpgrade = planKey !== "enterprise";
  const draftsCount = drafts.length;
  const isLimitReached = draftsCount >= maxDrafts;

  const visibleDrafts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const result = query
      ? drafts.filter(
          (d) =>
            d.title.toLowerCase().includes(query) ||
            d.templateName.toLowerCase().includes(query),
        )
      : [...drafts];

    const time = (d: ResumeDraftItem) => new Date(d.updatedAt).getTime();
    result.sort((a, b) => {
      if (sortBy === "oldest") return time(a) - time(b);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "template")
        return a.templateName.localeCompare(b.templateName);
      return time(b) - time(a);
    });
    return result;
  }, [drafts, searchQuery, sortBy]);

  const editHref = (draft: ResumeDraftItem) =>
    `/${locale}/dashboard?resumeId=${draft.id}`;
  const previewHref = (draft: ResumeDraftItem) =>
    `/${locale}/resume/preview?resumeId=${draft.id}`;

  const createButton = (
    <button
      type="button"
      onClick={() => createDraft(isLimitReached)}
      disabled={isCreating}
      aria-busy={isCreating}
      className="lp-tag lp-tag-sm cursor-pointer disabled:cursor-progress disabled:opacity-70"
    >
      {isCreating ? t("creating") : t("createNew")}
      <Plus size={16} aria-hidden className="shrink-0" />
    </button>
  );

  const rowActions = (draft: ResumeDraftItem) => (
    <>
      <Link href={editHref(draft)} className={QUIET_BUTTON}>
        {t("edit")}
      </Link>
      <Link href={previewHref(draft)} className="lp-link px-1 text-[15px]">
        {t("preview")}
      </Link>
      <button
        type="button"
        onClick={() => openDelete(draft)}
        aria-label={`${t("delete")}: ${draft.title}`}
        className="ms-auto flex size-11 cursor-pointer items-center justify-center text-lp-ink2 transition-colors duration-200 hover:bg-lp-soft hover:text-lp-flag"
      >
        <Trash2 size={18} aria-hidden />
      </button>
    </>
  );

  const renameButton = (draft: ResumeDraftItem) => (
    <button
      type="button"
      onClick={() => openRename(draft)}
      aria-label={`${t("rename")}: ${draft.title}`}
      className="-my-2 flex size-11 shrink-0 cursor-pointer items-center justify-center text-lp-ink2 transition-colors duration-200 hover:bg-lp-soft hover:text-lp-ink"
    >
      <Pencil size={16} aria-hidden />
    </button>
  );

  return (
    <>
      {/* ── Heading, quota and the one primary action ──────────────────── */}
      <section className="pb-10 pt-28 sm:pt-32">
        <div className={`${WRAP} flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between`}>
          <div>
            <h1 className="lp-display text-[clamp(2.25rem,4.4vw,3.5rem)]">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-[1.6] text-lp-ink2">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            {/* The quota as slots: one mark per draft the plan holds. */}
            <div>
              <p className="flex items-baseline gap-2">
                <span className="lp-mono text-[15px]! tracking-normal! text-lp-ink">
                  {draftsCount} / {maxDrafts}
                </span>
                <span className="lp-label text-lp-ink2">{t("quotaLabel")}</span>
              </p>
              <div className="mt-2 flex gap-1" aria-hidden>
                {Array.from({ length: maxDrafts }, (_, i) => (
                  <span
                    key={i}
                    className={`block h-2 w-9 ${i < draftsCount ? "bg-lp-violet" : "bg-lp-rule-strong"}`}
                  />
                ))}
              </div>
            </div>
            {createButton}
          </div>
        </div>

        {/* Worded for the free plan, so it is shown to the free plan only. */}
        {planKey === "free" && isLimitReached && !isLoading && (
          <div className={`${WRAP} mt-8`}>
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-lp-rule-strong p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[16px] leading-normal">
                <span className="font-bold">{t("upgradePrompt")}</span>{" "}
                <span className="text-lp-ink2">{t("upgradeBannerDesc")}</span>
              </p>
              <Link
                href={`/${locale}/pricing`}
                className="lp-link shrink-0 text-[16px]"
              >
                {t("upgradeButton")}
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── The board ──────────────────────────────────────────────────── */}
      <section className="lp-mat min-h-[50vh] flex-1 py-10 sm:py-14">
        <div className={WRAP}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                aria-hidden
                className="pointer-events-none absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-lp-ink3"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchLabel")}
                className={`${FIELD} w-full ps-11`}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortKey)}
                aria-label={t("sortLabel")}
                className={`${FIELD} cursor-pointer font-semibold`}
              >
                <option value="newest">{t("sortNewest")}</option>
                <option value="oldest">{t("sortOldest")}</option>
                <option value="title">{t("sortTitle")}</option>
                <option value="template">{t("sortTemplate")}</option>
              </select>

              <div className="flex" role="group">
                {(
                  [
                    ["grid", LayoutGrid, t("gridView")],
                    ["list", List, t("listView")],
                  ] as const
                ).map(([mode, Icon, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    aria-label={label}
                    title={label}
                    className={`flex size-11 cursor-pointer items-center justify-center transition-colors duration-200 ${
                      viewMode === mode
                        ? "bg-lp-tag text-lp-on-tag"
                        : "bg-lp-card text-lp-ink hover:bg-lp-soft"
                    }`}
                  >
                    <Icon size={18} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lp-ruler mt-3" aria-hidden />

          <div className="mt-10">
            {isLoading ? (
              <ul
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                aria-busy="true"
                aria-label={t("loadingDrafts")}
              >
                {[0, 1, 2].map((i) => (
                  <li key={i} className="animate-pulse">
                    <div className="aspect-210/297 rounded-t-lg bg-lp-card/70" />
                    <div className="h-28 rounded-b-lg bg-lp-card/40" />
                  </li>
                ))}
              </ul>
            ) : visibleDrafts.length === 0 ? (
              <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center text-lp-ink">
                <div
                  className="aspect-210/297 w-32 rounded-lg border-2 border-dashed border-lp-ink/50"
                  aria-hidden
                />
                <h2 className="mt-6 text-[24px] font-bold tracking-[-0.03em] rtl:tracking-normal">
                  {searchQuery ? t("emptySearchTitle") : t("emptyTitle")}
                </h2>
                <p className="mt-2 text-[16.5px] leading-[1.6]">
                  {searchQuery ? t("emptySearchDesc") : t("emptyDesc")}
                </p>
                {!searchQuery && <div className="mt-6">{createButton}</div>}
              </div>
            ) : viewMode === "grid" ? (
              <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {visibleDrafts.map((draft) => (
                  <li
                    key={draft.id}
                    className="flex flex-col overflow-hidden rounded-lg shadow-(--lp-shadow)"
                  >
                    <Link
                      href={editHref(draft)}
                      aria-label={`${t("edit")}: ${draft.title}`}
                      className="lp-sheet group relative block aspect-210/297 overflow-hidden rounded-none! shadow-none!"
                    >
                      <Image
                        src={thumbnailFor(draft)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
                        className="object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col bg-lp-card p-5 text-lp-ink">
                      <div className="flex items-start justify-between gap-2">
                        <h2
                          title={draft.title}
                          className="min-w-0 truncate text-[20px] font-bold tracking-[-0.02em] rtl:tracking-normal"
                        >
                          {draft.title}
                        </h2>
                        {renameButton(draft)}
                      </div>
                      <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="lp-label capitalize text-lp-ink2">
                          {draft.templateName}
                        </span>
                        <span className="lp-mono text-lp-ink3">
                          {relativeTime(draft.updatedAt, locale, t)}
                        </span>
                      </p>
                      <div className="mt-5 flex items-center gap-4 border-t border-lp-rule-strong pt-4">
                        {rowActions(draft)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="overflow-hidden rounded-lg bg-lp-card text-lp-ink shadow-(--lp-shadow)">
                {visibleDrafts.map((draft) => (
                  <li
                    key={draft.id}
                    className="flex flex-col gap-4 border-b border-lp-rule p-4 last:border-b-0 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="relative h-17 w-12 shrink-0 overflow-hidden rounded-sm border border-lp-rule-strong">
                        <Image
                          src={thumbnailFor(draft)}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h2
                            title={draft.title}
                            className="truncate text-[18px] font-bold tracking-[-0.02em] rtl:tracking-normal"
                          >
                            {draft.title}
                          </h2>
                          {renameButton(draft)}
                        </div>
                        <p className="flex flex-wrap items-baseline gap-x-4">
                          <span className="lp-label capitalize text-lp-ink2">
                            {draft.templateName}
                          </span>
                          <span className="lp-mono text-lp-ink3">
                            {relativeTime(draft.updatedAt, locale, t)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:w-76">
                      {rowActions(draft)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ── Rename ─────────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(renamingDraft)}
        onClose={closeRename}
        labelledBy="rename-draft-title"
        closeLabel={t("close")}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (newTitle.trim()) saveRename();
          }}
        >
          <h2 id="rename-draft-title" className="lp-display pe-10 text-[28px]">
            {t("renameTitle")}
          </h2>
          <input
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            aria-labelledby="rename-draft-title"
            autoFocus
            className={`${FIELD} mt-6 w-full font-semibold`}
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSavingTitle || !newTitle.trim()}
              className="inline-flex min-h-11 cursor-pointer items-center bg-lp-tag px-6 text-[15px] font-semibold text-lp-on-tag disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("save")}
            </button>
            <button type="button" onClick={closeRename} className={QUIET_BUTTON}>
              {t("cancel")}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete ─────────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(deletingDraft)}
        onClose={closeDelete}
        labelledBy="delete-draft-title"
        closeLabel={t("close")}
      >
        <h2 id="delete-draft-title" className="lp-display pe-10 text-[28px]">
          {t("deleteTitle")}
        </h2>
        <p className="mt-4 text-[16.5px] leading-[1.6] text-lp-ink2">
          {deletingDraft && t("deleteMessage", { title: deletingDraft.title })}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={confirmDelete}
            disabled={isDeleting}
            className="inline-flex min-h-11 cursor-pointer items-center bg-lp-flag px-6 text-[15px] font-semibold text-lp-paper disabled:cursor-progress disabled:opacity-70"
          >
            {isDeleting ? t("deleting") : t("confirmDelete")}
          </button>
          <button
            type="button"
            onClick={closeDelete}
            disabled={isDeleting}
            className={QUIET_BUTTON}
          >
            {t("cancel")}
          </button>
        </div>
      </Modal>

      {/* ── Plan is full ───────────────────────────────────────────────── */}
      <Modal
        open={showUpgradeModal}
        onClose={closeUpgradeModal}
        labelledBy="draft-limit-title"
        closeLabel={t("close")}
      >
        <h2 id="draft-limit-title" className="lp-display pe-10 text-[28px]">
          {t("limitModalTitle")}
        </h2>
        <p className="mt-4 text-[16.5px] leading-[1.6] text-lp-ink2">
          {t(canUpgrade ? "limitModalDesc" : "limitModalDescMax", {
            plan: planLabel,
            count: maxDrafts,
          })}
        </p>
        <p className="mt-5 flex items-baseline justify-between gap-4 border-y border-lp-rule-strong py-3">
          <span className="lp-label text-lp-ink2">
            {planLabel} · {t("currentDraftsLabel")}
          </span>
          <span className="lp-mono text-[15px]! tracking-normal!">
            {draftsCount} / {maxDrafts}
          </span>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          {canUpgrade && (
            <Link
              href={`/${locale}/pricing`}
              onClick={closeUpgradeModal}
              className="lp-tag lp-tag-sm"
            >
              {t(planKey === "free" ? "upgradeToPro" : "upgradeToEnterprise")}
            </Link>
          )}
          <button
            type="button"
            onClick={closeUpgradeModal}
            className="lp-link cursor-pointer bg-transparent text-[16px]"
          >
            {t("manageDrafts")}
          </button>
        </div>
      </Modal>
    </>
  );
}
