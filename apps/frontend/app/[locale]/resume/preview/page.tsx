"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Download,
  FileText,
  FolderClock,
  ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  Minus,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DEFAULT_RESUME_CUSTOMIZATION, type ResumeCustomization, type ResumeTemplateId } from "@shared-types/resume";
import ResumeCustomizePanel, { FONT_FAMILIES } from "@/components/resume/ResumeCustomizePanel";

import { toast } from "sonner";
import { buildBackendUrl, generateCurrentResume, saveDashboardDraft } from "@/lib/backend";
import { resolveResumeTemplate } from "@/components/resume/templates/registry";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserAvatarMenu from "@/components/ui/UserAvatarMenu";
import {
  createNewClonedDraft,
  deleteResumeDraft,
  exportResume,
  getResumePreviewData,
  getResumeTemplateMetadata,
  getUserResumesList,
  isResumeTemplateId,
  renameResumeDraft,
  updateCurrentResumeTemplate,
  type ResumeExportFormat,
  type UserResumeSummary,
} from "@/lib/resume-preview-api";
import type {
  ResumePreviewData,
  ResumePurpose,
} from "@/lib/types/resumePreview.types";

const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const ZOOM_STEP = 5;
const DEFAULT_ZOOM = 95;


const RESUME_PURPOSES: ResumePurpose[] = [
  "job",
  "internship",
  "scholarship",
  "academic",
  "promotion",
  "government",
  "general",
];

const PURPOSE_TRANSLATION_KEYS: Record<ResumePurpose, string> = {
  job: "purposes.job",
  internship: "purposes.internship",
  scholarship: "purposes.scholarship",
  academic: "purposes.academic",
  promotion: "purposes.promotion",
  government: "purposes.government",
  general: "purposes.general",
};

const EXPORT_FORMATS: ResumeExportFormat[] = ["pdf", "jpg"];

const FORMAT_TRANSLATION_KEYS: Record<ResumeExportFormat, string> = {
  pdf: "formats.pdf",
  jpg: "formats.jpg",
};


function triggerDownload(url: string, format: ResumeExportFormat) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `resume.${format}`;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function releaseDownloadUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export default function ResumePreviewPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeIdParam = searchParams.get("resumeId")?.trim() || "";
  const templateParam = searchParams.get("template")?.trim() || "";
  const t = useTranslations("resumePreview");
  const configuration = useTranslations("resumePreview.configuration");
  const templates = useTranslations("templatesPage");
  const isRTL = locale === "ar";

  const { user } = useAuth();
  const isFreeUser = user?.planName === "FREE" || !user?.planName;

  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [resumeData, setResumeData] = useState<ResumePreviewData | null>(null);
  const [draftTemplateId, setDraftTemplateId] =
    useState<ResumeTemplateId>("minimal");
  const [appliedTemplateId, setAppliedTemplateId] =
    useState<ResumeTemplateId>("minimal");
  const [draftPurpose, setDraftPurpose] = useState<ResumePurpose>("general");
  const [appliedPurpose, setAppliedPurpose] = useState<ResumePurpose>("general");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [selectedExportFormat, setSelectedExportFormat] =
    useState<ResumeExportFormat>("pdf");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isCustomizePanelOpen, setIsCustomizePanelOpen] = useState(false);
  const [localCustomization, setLocalCustomization] = useState<ResumeCustomization | null>(null);
  const [localFontFamily, setLocalFontFamily] = useState<string>(FONT_FAMILIES[0].value);
  const [savedDrafts, setSavedDrafts] = useState<UserResumeSummary[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftTitle, setEditingDraftTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [downloadingDraftId, setDownloadingDraftId] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [exportingFormat, setExportingFormat] =
    useState<ResumeExportFormat | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      try {
        setIsLoading(true);
        setPageError(null);
        const resumeId = resumeIdParam || "resume-123";
        const data = await getResumePreviewData(resumeId, controller.signal);

        if (controller.signal.aborted) return;

        let activeTemplateId = data.selectedTemplate.id;
        let activeMetadata = data.selectedTemplate;

        if (templateParam && isResumeTemplateId(templateParam)) {
          activeTemplateId = templateParam;
          activeMetadata = getResumeTemplateMetadata(templateParam);
        }

        if (isFreeUser && activeTemplateId !== "minimal") {
          activeTemplateId = "minimal";
          activeMetadata = getResumeTemplateMetadata("minimal");
          setActionError("Free plan users are restricted to the Classic ATS template. Upgrade to Pro to unlock premium templates.");
        } else if (templateParam && isResumeTemplateId(templateParam)) {
          const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;
          if (token) {
            void updateCurrentResumeTemplate(
              data.resumeName,
              templateParam,
              controller.signal,
              resumeId,
            ).catch((err) => {
              console.warn("Failed to persist template selection:", err);
            });
          }
        }

        setResumeData({
          ...data,
          selectedTemplate: activeMetadata,
        });
        if (data.customization) {
          setLocalCustomization(data.customization);
          if (data.customization.fontFamily) {
            setLocalFontFamily(data.customization.fontFamily);
          }
        }
        setDraftTemplateId(activeTemplateId);
        setAppliedTemplateId(activeTemplateId);
        setDraftPurpose(data.purpose);
        setAppliedPurpose(data.purpose);

        const draftsList = await getUserResumesList(controller.signal);
        if (!controller.signal.aborted) {
          setSavedDrafts(draftsList);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPageError(
          error instanceof Error ? error.message : t("status.errorText"),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [t, isFreeUser, resumeIdParam, templateParam]);

  useEffect(() => {
    function closeExportMenu(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(target)
      ) {
        setIsExportMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExportMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeExportMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeExportMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const hasPendingChanges =
    draftTemplateId !== appliedTemplateId || draftPurpose !== appliedPurpose;
  const isBusy = isApplying || exportingFormat !== null;

  const handleRenameDraft = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error(locale === "ar" ? "يرجى إدخال اسم للمسودة" : "Please enter a draft name");
      return;
    }

    try {
      setIsRenaming(true);
      const success = await renameResumeDraft(id, trimmed, draftTemplateId);
      if (success) {
        if (resumeData && (id === resumeData.resumeId || id === "current" || id === "resume-123")) {
          setResumeData((prev) => prev ? { ...prev, resumeName: trimmed } : prev);
        }
        setSavedDrafts((prev) =>
          prev.map((draft) => (draft.id === id ? { ...draft, title: trimmed } : draft))
        );
        toast.success(locale === "ar" ? "تم تغيير اسم المسودة بنجاح" : "Draft renamed successfully");
        setEditingDraftId(null);
      } else {
        toast.error(locale === "ar" ? "تعذر تغيير اسم المسودة" : "Failed to rename draft");
      }
    } catch {
      toast.error(locale === "ar" ? "تعذر تغيير اسم المسودة" : "Failed to rename draft");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRenameCurrentDraft = async () => {
    if (isCreatingDraft) return;
    try {
      setIsCreatingDraft(true);
      const newDraft = await createNewClonedDraft();
      toast.success(
        locale === "ar"
          ? "تم إنشاء مسودة جديدة بنجاح"
          : "New draft created successfully"
      );
      router.push(`/${locale}/dashboard?resumeId=${encodeURIComponent(newDraft.id)}&template=${encodeURIComponent(newDraft.templateId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create draft");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 500;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !resumeData) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        locale === "ar"
          ? "حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)"
          : "Photo is too large (max 5MB)"
      );
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const dataUrl = await compressImage(file);

      const nextContent = {
        ...resumeData.content,
        contact: {
          ...resumeData.content.contact,
          photo: dataUrl,
        },
      };

      setResumeData((prev) => (prev ? { ...prev, content: nextContent } : prev));

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("resumax_token")
          : null;
      if (token) {
        await saveDashboardDraft(
          token,
          {
            template: draftTemplateId,
            currentStep: "contact",
            completedSteps: ["contact"],
            sectionOrder: resumeData.customization?.sectionOrder || [],
            contact: nextContent.contact,
            summary: nextContent.summary,
            skillGroups: nextContent.skillGroups,
            experience: nextContent.experience,
            projects: nextContent.projects,
            education: nextContent.education,
            certifications: nextContent.certifications,
            skills: nextContent.skills,
          },
          resumeData.resumeId
        );
      }

      toast.success(
        locale === "ar"
          ? "تم تحديث الصورة الشخصية بنجاح"
          : "Profile photo updated successfully"
      );
    } catch (err) {
      toast.error(
        locale === "ar" ? "فشل تحديث الصورة" : "Failed to update photo"
      );
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!resumeData || isUploadingPhoto) return;

    try {
      setIsUploadingPhoto(true);
      const nextContent = {
        ...resumeData.content,
        contact: {
          ...resumeData.content.contact,
          photo: "",
        },
      };

      setResumeData((prev) => (prev ? { ...prev, content: nextContent } : prev));

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("resumax_token")
          : null;
      if (token) {
        await saveDashboardDraft(
          token,
          {
            template: draftTemplateId,
            currentStep: "contact",
            completedSteps: ["contact"],
            sectionOrder: resumeData.customization?.sectionOrder || [],
            contact: nextContent.contact,
            summary: nextContent.summary,
            skillGroups: nextContent.skillGroups,
            experience: nextContent.experience,
            projects: nextContent.projects,
            education: nextContent.education,
            certifications: nextContent.certifications,
            skills: nextContent.skills,
          },
          resumeData.resumeId
        );
      }

      toast.success(
        locale === "ar" ? "تم حذف الصورة بنجاح" : "Profile photo removed"
      );
    } catch (err) {
      toast.error(
        locale === "ar" ? "فشل حذف الصورة" : "Failed to remove photo"
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCreateNewDraft = async () => {
    if (isCreatingDraft) return;
    try {
      setIsCreatingDraft(true);
      const newDraft = await createNewClonedDraft();
      toast.success(
        locale === "ar"
          ? "تم إنشاء مسودة جديدة بنجاح"
          : "New draft created successfully"
      );
      router.push(`/${locale}/dashboard?resumeId=${encodeURIComponent(newDraft.id)}&template=${encodeURIComponent(newDraft.templateId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create draft");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleDeleteDraft = async (e: React.MouseEvent, draftId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingDraftId) return;

    const confirmMsg = locale === "ar"
      ? "هل أنت متأكد من رغبتك في حذف هذه المسودة؟"
      : "Are you sure you want to delete this draft?";
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingDraftId(draftId);
      const success = await deleteResumeDraft(draftId);
      if (success) {
        toast.success(locale === "ar" ? "تم حذف المسودة بنجاح" : "Draft deleted successfully");
        setSavedDrafts((prev) => prev.filter((d) => d.id !== draftId));

        if (resumeData && (draftId === resumeData.resumeId || draftId === "current")) {
          const remaining = savedDrafts.filter((d) => d.id !== draftId);
          if (remaining.length > 0) {
            window.location.href = `/${locale}/resume/preview?resumeId=${remaining[0].id}&template=${remaining[0].templateId}`;
          } else {
            window.location.href = `/${locale}/dashboard`;
          }
        }
      } else {
        toast.error(locale === "ar" ? "تعذر حذف المسودة" : "Failed to delete draft");
      }
    } catch {
      toast.error(locale === "ar" ? "تعذر حذف المسودة" : "Failed to delete draft");
    } finally {
      setDeletingDraftId(null);
    }
  };

  const handleDownloadDraft = async (e: React.MouseEvent, draftId: string, templateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloadingDraftId) return;

    const toastId = toast.loading(
      locale === "ar" ? "جاري تجهيز تحميل المسودة..." : "Preparing draft download..."
    );

    try {
      setDownloadingDraftId(draftId);
      const resolvedTemplate = isResumeTemplateId(templateId) ? templateId : undefined;
      const result = await exportResume(draftId, "pdf", undefined, resolvedTemplate);
      triggerDownload(result.downloadUrl, "pdf");
      toast.success(
        locale === "ar" ? "تم التحميل بنجاح!" : "Draft downloaded successfully!",
        { id: toastId }
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : (locale === "ar" ? "فشل تحميل المسودة" : "Failed to download draft"),
        { id: toastId }
      );
    } finally {
      setDownloadingDraftId(null);
    }
  };


  const handlePurposeSelect = async (newPurpose: ResumePurpose) => {
    if (!resumeData || isBusy) return;
    setDraftPurpose(newPurpose);

    const purposeLabel = configuration(PURPOSE_TRANSLATION_KEYS[newPurpose]);
    const toastId = toast.loading(`Rewriting resume for ${purposeLabel} with Gemini AI...`);

    try {
      setIsApplying(true);
      setActionError(null);
      setActionSuccess(null);
      setIsExportMenuOpen(false);

      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;

      if (token) {
        await generateCurrentResume(token, {
          title: resumeData.resumeName,
          templateId: draftTemplateId,
          purpose: newPurpose,
        }, resumeData.resumeId);

        const freshData = await getResumePreviewData(resumeData.resumeId);
        releaseDownloadUrl(resumeData.pdfDownloadUrl);
        releaseDownloadUrl(resumeData.jpgDownloadUrl);
        setResumeData(freshData);
        setDraftTemplateId(freshData.selectedTemplate.id);
        setAppliedTemplateId(freshData.selectedTemplate.id);
        setAppliedPurpose(newPurpose);
      } else {
        setAppliedPurpose(newPurpose);
      }

      const successMsg = `Resume rewritten for ${purposeLabel} using Gemini AI!`;
      setActionSuccess(successMsg);
      toast.success(successMsg, { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : configuration("generateError");
      setActionError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      setDraftPurpose(appliedPurpose);
    } finally {
      setIsApplying(false);
    }
  };

  const applyConfiguration = async () => {
    if (!resumeData || isBusy || !hasPendingChanges) return;

    const toastId = toast.loading("Applying changes and re-generating preview...");
    try {
      setIsApplying(true);
      setActionError(null);
      setActionSuccess(null);
      setIsExportMenuOpen(false);

      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;

      if (draftPurpose !== appliedPurpose && token) {
        await generateCurrentResume(token, {
          title: resumeData.resumeName,
          templateId: draftTemplateId,
          purpose: draftPurpose,
        }, resumeData.resumeId);

        const freshData = await getResumePreviewData(resumeData.resumeId);
        releaseDownloadUrl(resumeData.pdfDownloadUrl);
        releaseDownloadUrl(resumeData.jpgDownloadUrl);
        setResumeData(freshData);
        setDraftTemplateId(freshData.selectedTemplate.id);
        setAppliedTemplateId(freshData.selectedTemplate.id);
        setAppliedPurpose(draftPurpose);
      } else {
        const result = await updateCurrentResumeTemplate(
          resumeData.resumeName,
          draftTemplateId,
          undefined,
          resumeData.resumeId,
        );
        const metadata = getResumeTemplateMetadata(result.templateId);

        releaseDownloadUrl(resumeData.pdfDownloadUrl);
        releaseDownloadUrl(resumeData.jpgDownloadUrl);
        setResumeData((current) =>
          current
            ? {
                ...current,
                selectedTemplate: metadata,
                purpose: draftPurpose,
                pdfDownloadUrl: null,
                jpgDownloadUrl: null,
                updatedAt: result.updatedAt || new Date().toISOString(),
              }
            : current,
        );
        setDraftTemplateId(result.templateId);
        setAppliedTemplateId(result.templateId);
        setAppliedPurpose(draftPurpose);
      }

      const successMsg = configuration("generatedSuccessfully");
      setActionSuccess(successMsg);
      toast.success(successMsg, { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : configuration("generateError");
      setActionError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsApplying(false);
    }
  };

  const handleExport = async () => {
    if (!resumeData || isBusy || hasPendingChanges) return;

    const existingUrl =
      selectedExportFormat === "pdf"
        ? resumeData.pdfDownloadUrl
        : resumeData.jpgDownloadUrl;
    setIsExportMenuOpen(false);
    setActionError(null);
    setActionSuccess(null);

    if (existingUrl) {
      triggerDownload(existingUrl, selectedExportFormat);
      toast.success(`Downloading ${selectedExportFormat.toUpperCase()}...`);
      return;
    }

    if (resumeData.creditsRemaining <= 0 && isFreeUser) {
      const msg = "Free plan users are allowed 1 download attempt. Upgrade to Pro for unlimited exports.";
      setActionError(msg);
      toast.error(msg);
      return;
    }

    const toastId = toast.loading(`Preparing ${selectedExportFormat.toUpperCase()} download...`);
    try {
      const format = selectedExportFormat;
      setExportingFormat(format);
      const result = await exportResume(
        resumeData.resumeId,
        format,
        undefined,
        appliedTemplateId,
        resumeData.customization,
      );

      setResumeData((current) =>
        current
          ? {
              ...current,
              pdfDownloadUrl:
                format === "pdf" ? result.downloadUrl : current.pdfDownloadUrl,
              jpgDownloadUrl:
                format === "jpg" ? result.downloadUrl : current.jpgDownloadUrl,
              creditsRemaining: result.creditsRemaining,
              creditsTotal: result.creditsTotal,
            }
          : current,
      );
      triggerDownload(result.downloadUrl, format);
      const successMsg = configuration("exportedSuccessfully");
      setActionSuccess(successMsg);
      toast.success(successMsg, { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t("status.errorText");
      setActionError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setExportingFormat(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 text-primary">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-gold" size={42} />
          <h1 className="mt-5 text-base font-bold">{t("status.loadingTitle")}</h1>
          <p className="mt-2 text-sm text-secondary">{t("status.loadingText")}</p>
        </div>
      </main>
    );
  }

  if (pageError || !resumeData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 text-primary">
        <div className="w-full max-w-md rounded-3xl border border-edge bg-elevated p-7 text-center shadow-xl">
          <FileText size={28} className="mx-auto text-gold" />
          <h1 className="mt-5 text-lg font-bold">{t("status.errorTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-secondary">
            {pageError || t("status.errorText")}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 min-h-11 rounded-xl bg-gold px-6 text-sm font-bold text-ink"
          >
            {t("status.retry")}
          </button>
        </div>
      </main>
    );
  }

  const selectedMetadata = getResumeTemplateMetadata(draftTemplateId);
  const selectedDefinition =
    resolveResumeTemplate(draftTemplateId) ?? resolveResumeTemplate("minimal");
  const TemplateComponent = selectedDefinition?.component;
  const selectedExportUrl =
    selectedExportFormat === "pdf"
      ? resumeData.pdfDownloadUrl
      : resumeData.jpgDownloadUrl;
  const exportDisabled =
    isBusy ||
    hasPendingChanges ||
    (!selectedExportUrl && resumeData.creditsRemaining <= 0);
  const updatedAt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(resumeData.updatedAt));

  return (
    <main className="min-h-screen bg-base text-primary">
      <header className="sticky top-0 z-40 border-b border-edge bg-base/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link href={`/${locale}`} className="shrink-0 no-underline">
              <Logo />
            </Link>
            <div className="hidden h-6 w-px bg-edge sm:block" />
            <Link
              href={`/${locale}/dashboard?template=${draftTemplateId}`}
              className="hidden min-h-11 items-center gap-2 text-sm font-semibold text-secondary no-underline hover:text-gold sm:flex"
            >
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
              {t("backToDashboard")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <UserAvatarMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5 xl:sticky xl:top-22">
          <section className="rounded-[26px] border border-edge bg-elevated p-5 shadow-[0_18px_60px_var(--shadow-color)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                  <LayoutTemplate size={19} className="text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-secondary">
                    {configuration("selectedTemplate")}
                  </p>
                  <h2 className="mt-1 truncate text-base font-black">
                    {selectedMetadata.name}
                  </h2>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-green/30 bg-green/10 px-2.5 py-1 text-[11px] font-bold text-green">
                <Check size={12} />
                <span>{t("template.selected")}</span>
              </span>
            </div>

            {/* Selected Template Preview Card */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-gold/30 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="relative aspect-4/5 w-16 shrink-0 overflow-hidden rounded-xl border border-edge bg-white shadow-inner">
                  {selectedMetadata.thumbnailUrl ? (
                    <Image
                      src={selectedMetadata.thumbnailUrl}
                      alt={selectedMetadata.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gold/10 text-gold">
                      <LayoutTemplate size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      selectedMetadata.id === 'minimal'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    }`}>
                      {selectedMetadata.id === 'minimal' ? 'Free & Pro' : 'Pro & Enterprise'}
                    </span>
                    <span className="text-[11px] font-medium text-secondary">
                      {templates("labels.ats")}
                    </span>
                  </div>
                  <h3 className="mt-1.5 truncate text-sm font-black text-primary">
                    {selectedMetadata.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-secondary">
                    {t("template.subtitle")}
                  </p>
                </div>
              </div>
            </div>

            {/* Change Template Action */}
            <div className="mt-4">
              <Link
                href={`/${locale}/templates`}
                className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-bold text-primary transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
              >
                <Sparkles size={15} className="text-gold" />
                <span>{t("template.changeButton")}</span>
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
            </div>
          </section>

          <section className="rounded-[26px] border border-edge bg-elevated p-5 shadow-[0_18px_60px_var(--shadow-color)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-azure/25 bg-azure/10">
                <Sparkles size={19} className="text-azure-light" />
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary">
                  {configuration("purpose")}
                </p>
                <h2 className="mt-1 text-sm font-black">
                  {configuration(PURPOSE_TRANSLATION_KEYS[draftPurpose])}
                </h2>
              </div>
            </div>
            <select
              value={draftPurpose}
              disabled={isBusy}
              onChange={(event) => {
                void handlePurposeSelect(event.target.value as ResumePurpose);
              }}
              className="mt-5 min-h-12 w-full rounded-xl border border-edge bg-card px-4 text-sm font-bold text-primary outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
              aria-label={configuration("selectPurpose")}
            >
              {RESUME_PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {configuration(PURPOSE_TRANSLATION_KEYS[purpose])}
                </option>
              ))}
            </select>
          </section>

          {/* Profile Photo Section (for templates supporting photo) */}
          {selectedMetadata.supportsPhoto !== false && (
            <section className="rounded-[26px] border border-edge bg-elevated p-5 shadow-[0_18px_60px_var(--shadow-color)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
                    <Camera size={19} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-secondary">
                      {locale === "ar" ? "الصورة الشخصية" : "Profile Photo"}
                    </p>
                    <h2 className="mt-0.5 text-sm font-black text-primary">
                      {resumeData.content.contact.photo
                        ? (locale === "ar" ? "تعديل الصورة" : "Manage Photo")
                        : (locale === "ar" ? "إضافة صورة" : "Add Photo")}
                    </h2>
                  </div>
                </div>
                {Boolean(resumeData.content.contact.photo) && (
                  <button
                    type="button"
                    onClick={() => void handleRemovePhoto()}
                    disabled={isUploadingPhoto}
                    className="flex items-center gap-1 text-xs font-semibold text-red-400 transition-colors hover:text-red-300 cursor-pointer"
                    title={locale === "ar" ? "حذف الصورة" : "Remove photo"}
                  >
                    <Trash2 size={13} />
                    <span>{locale === "ar" ? "حذف" : "Remove"}</span>
                  </button>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-edge bg-card p-3 shadow-sm">
                {resumeData.content.contact.photo ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gold/40 bg-white shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resumeData.content.contact.photo}
                      alt="Profile photo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-edge bg-elevated text-secondary">
                    <User size={22} className="text-secondary/70" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => void handlePhotoUpload(e)}
                    className="hidden"
                    id="resume-profile-photo-input"
                  />
                  <label
                    htmlFor="resume-profile-photo-input"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isUploadingPhoto
                        ? "opacity-50 pointer-events-none bg-gold/10 border-gold/20 text-gold"
                        : "bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>
                      {isUploadingPhoto
                        ? (locale === "ar" ? "جاري الرفع..." : "Uploading...")
                        : resumeData.content.contact.photo
                        ? (locale === "ar" ? "تغيير الصورة" : "Change Photo")
                        : (locale === "ar" ? "رفع صورة" : "Upload Photo")}
                    </span>
                  </label>
                  <p className="mt-1 text-[11px] text-secondary">
                    {locale === "ar"
                      ? "PNG أو JPG (الحد الأقصى 5MB)"
                      : "PNG, JPG or WebP (max 5MB)"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {hasPendingChanges && (
            <button
              type="button"
              onClick={() => void applyConfiguration()}
              disabled={isBusy}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 font-black text-ink shadow-[0_15px_40px_rgba(245,158,11,0.2)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55"
            >
              {isApplying ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : (
                <Sparkles size={19} />
              )}
              {isApplying
                ? configuration("generating")
                : configuration("generate")}
            </button>
          )}

          <Link
            href={`/${locale}/dashboard?resumeId=${encodeURIComponent(resumeData?.resumeId ?? '')}&template=${draftTemplateId}`}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-edge bg-elevated px-5 text-sm font-black text-primary shadow-[0_10px_30px_var(--shadow-color)] transition-all hover:border-gold/40 hover:bg-card hover:text-gold"
          >
            <Pencil size={15} className="text-gold" />
            <span>{t("editResume")}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (!localCustomization && resumeData) {
                setLocalCustomization({ ...resumeData.customization });
              }
              const currentFont = localCustomization?.fontFamily || resumeData?.customization?.fontFamily;
              if (currentFont) setLocalFontFamily(currentFont);
              setIsCustomizePanelOpen(true);
            }}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-edge bg-elevated px-5 text-sm font-black text-primary shadow-[0_10px_30px_var(--shadow-color)] transition-all hover:border-gold/40 hover:bg-card hover:text-gold"
          >
            <SlidersHorizontal size={15} className="text-gold" />
            <span>Customize Resume</span>
          </button>
        </aside>

        <section className={`overflow-hidden rounded-[28px] border border-edge bg-elevated shadow-[0_24px_80px_var(--shadow-color)] xl:sticky xl:top-22 xl:flex xl:h-[calc(100dvh-7rem)] xl:flex-col transition-all duration-300 ${
          isCustomizePanelOpen
            ? "relative z-[55] ring-2 ring-gold/40 shadow-[0_24px_100px_rgba(0,0,0,0.5)]"
            : ""
        }`}>
          <div className="shrink-0 border-b border-edge px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gold" />
                  <h1 className="font-playfair text-2xl font-black sm:text-3xl">
                    {configuration("preview")}
                  </h1>
                </div>
                {editingDraftId === `header-${resumeData.resumeId}` ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleRenameDraft(resumeData.resumeId, editingDraftTitle);
                    }}
                    className="mt-2 flex items-center gap-1.5 max-w-sm"
                  >
                    <input
                      type="text"
                      value={editingDraftTitle}
                      onChange={(e) => setEditingDraftTitle(e.target.value)}
                      disabled={isRenaming}
                      autoFocus
                      className="min-h-8 flex-1 rounded-lg border border-gold bg-card px-2.5 text-xs font-bold text-primary outline-none focus:ring-1 focus:ring-gold"
                    />
                    <button
                      type="submit"
                      disabled={isRenaming}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink hover:opacity-90 transition-opacity shrink-0"
                      title={locale === "ar" ? "حفظ" : "Save"}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDraftId(null)}
                      disabled={isRenaming}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-card hover:bg-soft transition-colors shrink-0"
                      title={locale === "ar" ? "إلغاء" : "Cancel"}
                    >
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="truncate text-sm font-bold">
                      {resumeData.resumeName}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDraftId(`header-${resumeData.resumeId}`);
                        setEditingDraftTitle(resumeData.resumeName);
                      }}
                      className="opacity-60 hover:opacity-100 p-1 text-gold transition-opacity"
                      title={locale === "ar" ? "إعادة تسمية" : "Rename draft"}
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-secondary">
                  {configuration("lastUpdated")}: {updatedAt}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-55">
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="resume-zoom" className="text-xs font-bold">
                      {configuration("zoom")}
                    </label>
                    <output htmlFor="resume-zoom" className="text-xs font-black text-gold">
                      {zoom}%
                    </output>
                  </div>
                  <div dir="ltr" className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
                      disabled={zoom <= MIN_ZOOM}
                      aria-label={t("preview.zoomOut")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      id="resume-zoom"
                      type="range"
                      min={MIN_ZOOM}
                      max={MAX_ZOOM}
                      step={ZOOM_STEP}
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="h-2 min-w-0 flex-1 cursor-pointer accent-gold"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
                      disabled={zoom >= MAX_ZOOM}
                      aria-label={t("preview.zoomIn")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(DEFAULT_ZOOM)}
                      disabled={zoom === DEFAULT_ZOOM}
                      aria-label={t("preview.resetZoom")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge bg-card disabled:opacity-40"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                <div className="min-w-52">
                  <label className="mb-2 block text-xs font-bold">
                    {configuration("exportAs")}
                  </label>
                  <div className="flex gap-2">
                    <div ref={exportMenuRef} className="relative min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => !isBusy && setIsExportMenuOpen((open) => !open)}
                        disabled={isBusy}
                        aria-haspopup="listbox"
                        aria-expanded={isExportMenuOpen}
                        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-edge bg-card px-3 text-sm font-black uppercase disabled:opacity-50"
                      >
                        {configuration(FORMAT_TRANSLATION_KEYS[selectedExportFormat])}
                        <ChevronDown size={15} />
                      </button>
                      {isExportMenuOpen && (
                        <div
                          role="listbox"
                          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 rounded-xl border border-edge bg-elevated p-1.5 shadow-xl"
                        >
                          {EXPORT_FORMATS.map((format) => (
                            <button
                              key={format}
                              type="button"
                              role="option"
                              aria-selected={selectedExportFormat === format}
                              onClick={() => {
                                setSelectedExportFormat(format);
                                setIsExportMenuOpen(false);
                              }}
                              className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-sm font-bold uppercase hover:bg-soft"
                            >
                              {configuration(FORMAT_TRANSLATION_KEYS[format])}
                              {selectedExportFormat === format && <Check size={14} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleExport()}
                      disabled={exportDisabled}
                      aria-label={configuration("exportAs")}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-gold px-3 text-ink disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {exportingFormat ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : selectedExportFormat === "pdf" ? (
                        <Download size={17} />
                      ) : (
                        <ImageIcon size={17} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-180 flex-1 items-start justify-center overflow-auto bg-soft p-5 sm:p-8 xl:min-h-0">
            {TemplateComponent ? (
              <div
                className={`flex w-full shrink-0 justify-center transition-all duration-300 ease-out ${
                  isCustomizePanelOpen
                    ? "-translate-x-28 md:-translate-x-36 xl:-translate-x-44 rtl:translate-x-28 rtl:md:translate-x-36 rtl:xl:translate-x-44"
                    : "translate-x-0"
                }`}
                style={{ zoom: zoom / 100 }}
              >
                <TemplateComponent
                  resume={resumeData.content}
                  customization={localCustomization ?? resumeData.customization}
                />
              </div>
            ) : (
              <div className="m-auto rounded-xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-400">
                {t("status.errorText")}
              </div>
            )}
          </div>
        </section>
      </div>

      {resumeData && (
        <ResumeCustomizePanel
          isOpen={isCustomizePanelOpen}
          onClose={() => setIsCustomizePanelOpen(false)}
          customization={localCustomization ?? resumeData.customization}
          fontFamily={localFontFamily}
          resumeContent={resumeData.content}
          TemplateComponent={TemplateComponent}
          resumeName={resumeData.resumeName}
          onCustomizationChange={(updated) => {
            const font = updated.fontFamily || localFontFamily;
            const withFont = { ...updated, fontFamily: font };
            setLocalFontFamily(font);
            setLocalCustomization(withFont);
            setResumeData((current) =>
              current ? { ...current, customization: withFont } : current
            );
          }}
          onFontFamilyChange={(font) => {
            setLocalFontFamily(font);
            setLocalCustomization((prev) => {
              const base = prev ?? resumeData.customization;
              return { ...base, fontFamily: font };
            });
            setResumeData((current) => {
              if (!current) return current;
              const base = localCustomization ?? current.customization;
              return { ...current, customization: { ...base, fontFamily: font } };
            });
          }}
          onReset={() => {
            const defaultCustomization: ResumeCustomization = {
              ...DEFAULT_RESUME_CUSTOMIZATION,
              fontFamily: FONT_FAMILIES[0].value,
            };
            setLocalCustomization(defaultCustomization);
            setLocalFontFamily(FONT_FAMILIES[0].value);
            setResumeData((current) =>
              current ? { ...current, customization: defaultCustomization } : current
            );
            toast.success("Resume styling reset to default");
          }}
        />
      )}
    </main>
  );
}