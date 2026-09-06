"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2,
  X,
  AlertTriangle,
  Layers,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import {
  fetchUserDrafts,
  createUserDraft,
  deleteUserDraft,
  updateUserDraftTitle,
  type ResumeDraftItem,
} from "@/lib/backend";
import { templates } from "@/lib/placeholder-data/templates.placeholder";
import { DraftsGridSkeleton } from "@/components/ui/Skeletons";

const PLAN_MAX_DRAFTS: Record<string, number> = {
  free: 1,
  pro: 3,
  enterprise: 5,
};

function formatRelativeTime(
  dateStr: string,
  locale: string,
  t: ReturnType<typeof useTranslations>
) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("relativeTime.justNow");
    if (diffMins < 60) return t("relativeTime.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("relativeTime.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("relativeTime.yesterday");
    if (diffDays < 30) return t("relativeTime.daysAgo", { count: diffDays });

    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function DraftsPage() {
  const t = useTranslations("drafts");
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";
  const { user } = useAuth();

  const [drafts, setDrafts] = useState<ResumeDraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "template">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Rename modal state
  const [renamingDraft, setRenamingDraft] = useState<ResumeDraftItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Delete modal state
  const [deletingDraft, setDeletingDraft] = useState<ResumeDraftItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upgrade / Limit modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const rawPlan = user?.planName?.toLowerCase() ?? "free";
  const planKey = (
    rawPlan in PLAN_MAX_DRAFTS ? rawPlan : "free"
  ) as keyof typeof PLAN_MAX_DRAFTS;
  const maxDrafts = PLAN_MAX_DRAFTS[planKey];
  const planLabel = t(`plans.${planKey}`);
  // Enterprise is the top tier: there is no upgrade to sell, so the modal
  // switches to a "free up a slot" message instead of a contradictory one.
  const canUpgrade = planKey !== "enterprise";
  const draftsCount = drafts.length;
  const isLimitReached = draftsCount >= maxDrafts;

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") || "" : "";
      const list = await fetchUserDrafts(token);
      setDrafts(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.loadFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDrafts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleCreateDraft = async () => {
    if (isLimitReached) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setCreating(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") || "" : "";
      const newResume = await createUserDraft(token);
      toast.success(t("createSuccess"));
      router.push(`/${locale}/dashboard/${newResume.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.createFailed");
      if (
        msg.toLowerCase().includes("limit") ||
        msg.toLowerCase().includes("free plan") ||
        msg.toLowerCase().includes("upgrade")
      ) {
        setShowUpgradeModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRename = (draft: ResumeDraftItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingDraft(draft);
    setNewTitle(draft.title);
  };

  const handleSaveRename = async () => {
    if (!renamingDraft || !newTitle.trim()) return;

    try {
      setIsSavingTitle(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") || "" : "";
      await updateUserDraftTitle(token, renamingDraft.id, newTitle.trim());

      setDrafts((prev) =>
        prev.map((d) => (d.id === renamingDraft.id ? { ...d, title: newTitle.trim() } : d))
      );

      toast.success(t("renameSuccess"));
      setRenamingDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.renameFailed"));
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDraft) return;

    try {
      setIsDeleting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") || "" : "";
      await deleteUserDraft(token, deletingDraft.id);

      setDrafts((prev) => prev.filter((d) => d.id !== deletingDraft.id));
      toast.success(t("deleteSuccess"));
      setDeletingDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDrafts = useMemo(() => {
    let result = [...drafts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.templateName.toLowerCase().includes(q)
      );
    }

    result.sort((a: ResumeDraftItem, b: ResumeDraftItem) => {
      if (sortBy === "newest") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "template") {
        return a.templateName.localeCompare(b.templateName);
      }
      return 0;
    });

    return result;
  }, [drafts, searchQuery, sortBy]);

  const getTemplateThumbnail = (templateName?: string, templateId?: string) => {
    if (templateId) {
      const matchById = templates.find(
        (t) => t.id.toLowerCase() === templateId.toLowerCase()
      );
      if (matchById) return matchById.image;
    }

    if (!templateName) return templates[3]?.image || templates[0].image;

    const lower = templateName.toLowerCase();
    const matched = templates.find(
      (t) =>
        t.id.toLowerCase() === lower ||
        lower.includes(t.id.toLowerCase()) ||
        t.id.toLowerCase().includes(lower)
    );
    return matched?.image || templates[3]?.image || templates[0].image;
  };

  return (
    <div className="min-h-screen flex flex-col bg-base text-primary">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-32 pb-24">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-edge">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 border border-gold/25 text-gold">
                <FileText size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-black font-playfair tracking-tight">
                {t("title")}
              </h1>
            </div>
            <p className="text-secondary text-sm sm:text-base max-w-2xl">
              {t("subtitle")}
            </p>
          </div>

          {/* Quota & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Quota Badge */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-edge bg-elevated text-xs font-bold shadow-sm">
              <Layers size={14} className="text-gold" />
              <span>
                {draftsCount} / {maxDrafts} {t("quotaLabel")}
              </span>
              {planKey === "free" && isLimitReached && (
                <Link
                  href={`/${locale}/pricing`}
                  className="text-gold hover:underline text-[11px] font-black ms-1"
                >
                  {t("quotaUpgradeLink")}
                </Link>
              )}
            </div>

            {/* Create Draft Button */}
            <button
              onClick={handleCreateDraft}
              disabled={creating || isLimitReached}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold hover:bg-gold-light text-slate-950 font-black text-sm transition-all duration-200 hover:scale-105 hover:shadow-[0_0_25px_rgba(245,166,35,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t("creating")}</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>{t("createNew")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upgrade Callout Banner if Limit Reached */}
        {planKey === "free" && isLimitReached && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary">
                  {t("upgradePrompt")}
                </h4>
                <p className="text-xs text-secondary mt-0.5">
                  {t("upgradeBannerDesc")}
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/pricing`}
              className="px-5 py-2 rounded-xl bg-gold text-slate-950 text-xs font-black hover:bg-gold-light transition-all whitespace-nowrap self-start sm:self-center"
            >
              {t("upgradeButton")}
            </Link>
          </motion.div>
        )}

        {/* Search, Filter & Layout Toolbar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search
              size={16}
              className={`absolute top-1/2 -translate-y-1/2 text-muted ${
                isRTL ? "right-4" : "left-4"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className={`w-full rounded-2xl border border-edge bg-card py-2.5 text-sm font-medium text-primary outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all ${
                isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
              }`}
            />
          </div>

          {/* Sort Dropdown & Layout View Toggle */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-edge bg-card px-3.5 py-2 text-xs font-bold text-secondary outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 cursor-pointer"
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="oldest">{t("sortOldest")}</option>
              <option value="title">{t("sortTitle")}</option>
              <option value="template">{t("sortTemplate")}</option>
            </select>

            <div className="flex items-center p-1 rounded-xl border border-edge bg-card">
              <button
                onClick={() => setViewMode("grid")}
                title={t("gridView")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-gold text-slate-950 shadow-sm"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title={t("listView")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-gold text-slate-950 shadow-sm"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Drafts Content Section */}
        <div className="mt-8">
          {loading ? (
            <DraftsGridSkeleton label={t("loadingDrafts")} />
          ) : filteredDrafts.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl border border-edge bg-elevated/40 p-12 text-center max-w-lg mx-auto my-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gold/10 text-gold mx-auto mb-4 border border-gold/25">
                <FileText size={30} />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">
                {searchQuery ? t("emptySearchTitle") : t("emptyTitle")}
              </h3>
              <p className="text-secondary text-sm mb-6 leading-relaxed">
                {searchQuery ? t("emptySearchDesc") : t("emptyDesc")}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateDraft}
                  disabled={creating || isLimitReached}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold hover:bg-gold-light text-slate-950 font-black text-sm transition-all hover:scale-105"
                >
                  <Plus size={16} />
                  <span>{t("createNew")}</span>
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrafts.map((draft) => (
                <motion.div
                  key={draft.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="group relative rounded-3xl border border-edge hover:border-gold/40 bg-elevated/90 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Preview Stage */}
                    <div
                      onClick={() =>
                        router.push(`/${locale}/dashboard?resumeId=${draft.id}`)
                      }
                      className="relative aspect-1/1.25 w-full rounded-2xl border border-edge bg-card overflow-hidden cursor-pointer group-hover:border-gold/30 transition-all mb-4"
                    >
                      <Image
                        src={getTemplateThumbnail(draft.templateName, draft.templateId)}
                        alt={draft.title}
                        fill
                        sizes="(max-width: 768px) 300px, 400px"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="px-3 py-1.5 rounded-xl bg-gold text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5">
                          <Pencil size={12} /> {t("editResume")}
                        </span>
                      </div>
                    </div>

                    {/* Resume Title & Rename Trigger */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3
                        title={draft.title}
                        className="font-bold text-primary truncate flex-1"
                      >
                        {draft.title}
                      </h3>

                      <button
                        onClick={(e) => handleOpenRename(draft, e)}
                        title={t("rename")}
                        className="text-muted hover:text-gold p-1 rounded-lg hover:bg-card transition-colors cursor-pointer"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>

                    {/* Template Badge & Timestamp */}
                    <div className="flex items-center justify-between text-xs text-secondary">
                      <span className="font-semibold text-gold/90 bg-gold/10 px-2 py-0.5 rounded-md border border-gold/20 text-[11px] capitalize">
                        {draft.templateName}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-faint">
                        <Clock size={11} />
                        {formatRelativeTime(draft.updatedAt, locale, t)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-4 border-t border-edge/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Edit button */}
                      <Link
                        href={`/${locale}/dashboard?resumeId=${draft.id}`}
                        className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover border border-edge text-xs font-bold text-primary transition-colors flex items-center gap-1.5"
                      >
                        <Pencil size={12} />
                        <span>{t("edit")}</span>
                      </Link>

                      {/* Preview button */}
                      <Link
                        href={`/${locale}/resume/preview?resumeId=${draft.id}`}
                        className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover border border-edge text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        <span>{t("preview")}</span>
                      </Link>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => setDeletingDraft(draft)}
                      title={t("delete")}
                      className="p-2 rounded-xl text-muted hover:text-pink-light hover:bg-pink-light/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="rounded-3xl border border-edge bg-elevated/80 overflow-hidden divide-y divide-edge">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative h-14 w-11 rounded-lg border border-edge bg-card overflow-hidden shrink-0">
                      <Image
                        src={getTemplateThumbnail(draft.templateName, draft.templateId)}
                        alt={draft.title}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-primary truncate">
                          {draft.title}
                        </h4>
                        <button
                          onClick={(e) => handleOpenRename(draft, e)}
                          className="text-muted hover:text-gold p-1 rounded transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                        <span className="capitalize text-gold font-medium">
                          {draft.templateName}
                        </span>
                        <span className="text-faint">•</span>
                        <span className="text-faint">
                          {formatRelativeTime(draft.updatedAt, locale, t)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/${locale}/dashboard?resumeId=${draft.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-gold hover:bg-gold-light text-slate-950 text-xs font-black transition-all"
                    >
                      {t("edit")}
                    </Link>
                    <Link
                      href={`/${locale}/resume/preview?resumeId=${draft.id}`}
                      className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover border border-edge text-xs font-bold text-secondary transition-colors"
                    >
                      {t("preview")}
                    </Link>
                    <button
                      onClick={() => setDeletingDraft(draft)}
                      className="p-2 text-muted hover:text-pink-light transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rename Modal */}
      <AnimatePresence>
        {renamingDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRenamingDraft(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl border border-edge bg-elevated p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">{t("renameTitle")}</h3>
                <button
                  onClick={() => setRenamingDraft(null)}
                  className="text-muted hover:text-primary p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveRename()}
                autoFocus
                className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm font-semibold text-primary outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setRenamingDraft(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-secondary hover:text-primary"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSaveRename}
                  disabled={isSavingTitle || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-slate-950 text-xs font-black disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingTitle && <Loader2 size={13} className="animate-spin" />}
                  <span>{t("save")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingDraft(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl border border-edge bg-elevated p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3 text-pink-light">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-light/10 border border-pink-light/20">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-bold text-primary">{t("deleteTitle")}</h3>
              </div>

              <p className="text-sm text-secondary leading-relaxed">
                {t("deleteMessage", { title: deletingDraft.title })}
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-edge">
                <button
                  onClick={() => setDeletingDraft(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-secondary hover:text-primary"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-pink hover:bg-pink-light text-white text-xs font-black disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-pink/20"
                >
                  {isDeleting && <Loader2 size={13} className="animate-spin" />}
                  <span>{isDeleting ? t("deleting") : t("confirmDelete")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade / Plan Limit Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gold/30 bg-elevated p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
                  <Sparkles size={22} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-card text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-primary">
                  {t("limitModalTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {canUpgrade
                    ? t("limitModalDesc", { plan: planLabel, count: maxDrafts })
                    : t("limitModalDescMax", { plan: planLabel, count: maxDrafts })}
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-3 text-xs text-secondary flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gold uppercase tracking-wider text-[10px] bg-gold/10 px-2 py-0.5 rounded-md border border-gold/30">
                    {planLabel}
                  </span>
                  <span>{t("currentDraftsLabel")}</span>
                </div>
                <span className="font-bold text-primary">
                  {draftsCount} / {maxDrafts}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                {canUpgrade && (
                  <Link
                    href={`/${locale}/pricing`}
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-gold/20 transition-all"
                  >
                    <Sparkles size={16} />
                    <span>
                      {planKey === "free" ? t("upgradeToPro") : t("upgradeToEnterprise")}
                    </span>
                  </Link>
                )}

                {/* Managing drafts becomes the primary action once there is
                    nothing left to upgrade to. */}
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className={
                    canUpgrade
                      ? "flex min-h-11 items-center justify-center gap-2 rounded-xl border border-edge bg-card hover:bg-card-hover px-5 py-3 text-sm font-bold text-secondary hover:text-primary transition-colors cursor-pointer"
                      : "flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-light px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-gold/20 transition-all cursor-pointer"
                  }
                >
                  <span>{t("manageDrafts")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

