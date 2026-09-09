"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCreateDraftMutation,
  useDeleteDraftMutation,
  useUpdateDraftTitleMutation,
} from "@/hooks/mutations/useDraftMutations";
import { useDraftsQuery } from "@/hooks/queries/useDrafts";
import type { ResumeDraftItem } from "@/lib/backend";

export type DraftsFlowMessages = {
  loadFailed: string;
  createSuccess: string;
  createFailed: string;
  renameSuccess: string;
  renameFailed: string;
  deleteSuccess: string;
  deleteFailed: string;
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }

  return fallback;
}

// The backend refuses an over-quota draft with a plain message, so the copy
// is what tells us to sell an upgrade instead of surfacing a toast.
function isQuotaError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("limit") ||
    lower.includes("free plan") ||
    lower.includes("upgrade")
  );
}

export function useDraftsFlow(messages: DraftsFlowMessages) {
  const locale = useLocale();
  const router = useRouter();

  const draftsQuery = useDraftsQuery();
  const createDraftMutation = useCreateDraftMutation();
  const deleteDraftMutation = useDeleteDraftMutation();
  const updateDraftTitleMutation = useUpdateDraftTitleMutation();

  const [renamingDraft, setRenamingDraft] = useState<ResumeDraftItem | null>(
    null,
  );
  const [newTitle, setNewTitle] = useState("");
  const [deletingDraft, setDeletingDraft] = useState<ResumeDraftItem | null>(
    null,
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const drafts = draftsQuery.data ?? [];

  // Report a failed list fetch once per error, not on every re-render the
  // query triggers while it holds that error.
  const reportedError = useRef<unknown>(null);

  useEffect(() => {
    if (!draftsQuery.error) {
      reportedError.current = null;
      return;
    }

    if (reportedError.current === draftsQuery.error) return;

    reportedError.current = draftsQuery.error;
    toast.error(errorMessage(draftsQuery.error, messages.loadFailed));
  }, [draftsQuery.error, messages.loadFailed]);

  const createDraft = async (isLimitReached: boolean) => {
    if (isLimitReached) {
      setShowUpgradeModal(true);
      return false;
    }

    try {
      const draft = await createDraftMutation.mutateAsync();
      toast.success(messages.createSuccess);
      router.push(`/${locale}/dashboard/${draft.id}`);
      return true;
    } catch (error) {
      const message = errorMessage(error, messages.createFailed);

      if (isQuotaError(message)) {
        setShowUpgradeModal(true);
      } else {
        toast.error(message);
      }

      return false;
    }
  };

  const openRename = (draft: ResumeDraftItem) => {
    setRenamingDraft(draft);
    setNewTitle(draft.title);
  };

  const closeRename = () => setRenamingDraft(null);

  const saveRename = async () => {
    if (!renamingDraft || !newTitle.trim()) return false;

    try {
      await updateDraftTitleMutation.mutateAsync({
        resumeId: renamingDraft.id,
        title: newTitle.trim(),
      });

      toast.success(messages.renameSuccess);
      setRenamingDraft(null);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, messages.renameFailed));
      return false;
    }
  };

  const openDelete = (draft: ResumeDraftItem) => setDeletingDraft(draft);

  const closeDelete = () => setDeletingDraft(null);

  const confirmDelete = async () => {
    if (!deletingDraft) return false;

    try {
      await deleteDraftMutation.mutateAsync(deletingDraft.id);
      toast.success(messages.deleteSuccess);
      setDeletingDraft(null);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, messages.deleteFailed));
      return false;
    }
  };

  return {
    drafts,
    isLoading: draftsQuery.isPending,

    createDraft,
    isCreating: createDraftMutation.isPending,

    renamingDraft,
    newTitle,
    setNewTitle,
    openRename,
    closeRename,
    saveRename,
    isSavingTitle: updateDraftTitleMutation.isPending,

    deletingDraft,
    openDelete,
    closeDelete,
    confirmDelete,
    isDeleting: deleteDraftMutation.isPending,

    showUpgradeModal,
    openUpgradeModal: () => setShowUpgradeModal(true),
    closeUpgradeModal: () => setShowUpgradeModal(false),
  };
}
