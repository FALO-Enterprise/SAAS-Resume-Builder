"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  Bell,
  CreditCard,
  Lock,
  Info,
  AlertTriangle,
  Trash2,
  LucideIcon,
  Check,
  Moon,
  Sun,
  ExternalLink,
  Laptop,
  ChevronDown,
  LoaderCircle,
  SlidersHorizontal,
  Camera,
  KeyRound,
  MailCheck,
  MailWarning,
  Languages,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { usePreferences } from "@/context/PreferencesContext";
import type { ThemeMode } from "@/lib/theme";
import type {
  ExportFormatPreference,
  NotificationPreferences,
} from "@/lib/preferences";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  useDeleteUserMutation,
  useUpdateUserMutation,
} from "@/hooks/queries/useUser";
import { getAvatarUrl, isUploadedAvatar } from "@/lib/utilities/avatar";
import { getInitials } from "@/lib/utilities/getName";
import { toast } from "sonner";
import {
  getBillingSubscription,
  cancelBillingSubscription,
  type BillingSubscriptionDetails,
} from "@/lib/backend";

export type SettingsTab =
  | "general"
  | "notifications"
  | "billing"
  | "security"
  | "privacy"
  | "about";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAB_ICONS: Record<SettingsTab, LucideIcon> = {
  general: SlidersHorizontal,
  notifications: Bell,
  billing: CreditCard,
  security: Shield,
  privacy: Lock,
  about: Info,
};

/**
 * General first, About last — the ordering every major settings surface
 * converges on. Security and Privacy stay adjacent as a trust pair.
 */
const SETTINGS_TAB_IDS: SettingsTab[] = [
  "general",
  "notifications",
  "billing",
  "security",
  "privacy",
  "about",
];

/** Mirrors the server's multer limits so the user is told before uploading. */
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const NAME_MAX_LENGTH = 60;
const NAME_SAVE_DEBOUNCE_MS = 900;

type SaveStatus = "idle" | "saving" | "saved" | "error";

/* ------------------------------------------------------------------ */
/* Shared row primitives. Previously each of these existed as seven or  */
/* eight hand-copied variants, which is how they drifted out of sync.   */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-edge pb-3">
      <h3 className="font-semibold text-primary">{title}</h3>
      {description && <p className="text-xs text-secondary">{description}</p>}
    </div>
  );
}

function GroupHeader({ title }: { title: string }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-faint">
      {title}
    </h4>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <span>
        <span className="block text-xs font-medium text-primary">{label}</span>
        {description && (
          <span className="block text-[11px] text-secondary">{description}</span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-gold h-4 w-4 cursor-pointer shrink-0"
      />
    </label>
  );
}

function OptionCards<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: { id: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (next: T) => void;
  columns: 2 | 3;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-secondary">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className={`grid gap-3 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option.id)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                isActive
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-edge bg-card text-secondary hover:border-gold/40"
              }`}
            >
              {Icon && <Icon size={18} />}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SaveIndicator({
  status,
  labels,
}: {
  status: SaveStatus;
  labels: Record<"saving" | "saved" | "error", string>;
}) {
  if (status === "idle") return null;
  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1 text-[11px] ${
        status === "error" ? "text-red-400" : "text-secondary"
      }`}
    >
      {status === "saving" && (
        <LoaderCircle size={11} className="animate-spin" />
      )}
      {status === "saved" && <Check size={11} className="text-green" />}
      {status === "error" && <AlertTriangle size={11} />}
      {labels[status]}
    </span>
  );
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [expandedSections, setExpandedSections] = useState<SettingsTab[]>([
    "general",
  ]);

  const { themeMode, setTheme } = useTheme();
  const { preferences, setPreference, setNotification } = usePreferences();
  const [serverError, setServerError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const deleteUserMutation = useDeleteUserMutation(user?.id);
  const updateUserMutation = useUpdateUserMutation(user?.id);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const activePlanId = (user?.planName ?? "FREE").toLocaleUpperCase() as
    | "FREE"
    | "PRO"
    | "ENTERPRISE";

  const [billingDetails, setBillingDetails] =
    useState<BillingSubscriptionDetails | null>(null);
  const [cancelingBilling, setCancelingBilling] = useState(false);

  /* --- Profile editing (auto-saved) --- */
  const [nameDraft, setNameDraft] = useState(user?.name ?? "");
  const [nameStatus, setNameStatus] = useState<SaveStatus>("idle");
  const [avatarStatus, setAvatarStatus] = useState<SaveStatus>("idle");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  // The last value known to be persisted. State rather than a ref because the
  // open/close reset below runs during render, where refs must not be mutated.
  const [savedName, setSavedName] = useState(user?.name ?? "");

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("resumax_token")
        : null;
    if (!token) return;
    getBillingSubscription(token)
      .then((res) => setBillingDetails(res))
      .catch((err) => console.error("Could not fetch billing details:", err));
  }, [isOpen]);

  // Release the last object URL when the modal unmounts.
  useEffect(
    () => () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    },
    [],
  );

  const handleCancelSubscription = async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("resumax_token")
        : null;
    if (!token) return;
    try {
      setCancelingBilling(true);
      await cancelBillingSubscription(token);
      toast.success(t("billing.cancelSuccess"));
      const updated = await getBillingSubscription(token);
      setBillingDetails(updated);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("billing.cancelFailed"),
      );
    } finally {
      setCancelingBilling(false);
    }
  };

  /* --- Body scroll lock + focus management --- */
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    dialog?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      // Keep Tab inside the dialog — `aria-modal` only announces modality,
      // it does not contain focus.
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      // The opener is often a dropdown item that unmounts with its menu, so
      // only restore focus if that element is still in the document. When it
      // isn't, the owner component restores focus to its own trigger.
      const opener = triggerRef.current;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [isOpen, onClose]);

  /* --- Profile persistence --- */

  const persistProfile = useCallback(
    async (payload: { name?: string; avatar?: File }) => {
      if (!user?.id) return false;
      const formData = new FormData();
      if (payload.name !== undefined) formData.append("name", payload.name);
      if (payload.avatar) formData.append("avatar", payload.avatar);

      const updated = await updateUserMutation.mutateAsync(formData);
      // Merge narrowly: spreading the whole response would push server-only
      // columns into the persisted session object.
      updateUser({
        ...user,
        name: updated.name ?? user.name,
        avatar: updated.avatar ?? user.avatar,
      });
      return true;
    },
    [updateUserMutation, updateUser, user],
  );

  // Debounced name auto-save. Toggles and selects commit instantly; a free
  // text field cannot, so it settles after a pause (and on blur, via trim).
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = nameDraft.trim();
    if (trimmed === savedName || trimmed.length === 0) return;

    const timer = window.setTimeout(() => {
      setNameStatus("saving");
      persistProfile({ name: trimmed })
        .then((ok) => {
          if (!ok) return;
          setSavedName(trimmed);
          setNameStatus("saved");
          window.setTimeout(() => setNameStatus("idle"), 2000);
        })
        .catch(() => setNameStatus("error"));
    }, NAME_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [nameDraft, savedName, isOpen, persistProfile]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t("general.avatarInvalidType"));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(t("general.avatarTooLarge"));
      return;
    }

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = objectUrl;
    setAvatarPreview(objectUrl);
    setAvatarStatus("saving");

    persistProfile({ avatar: file })
      .then((ok) => {
        if (!ok) return;
        setAvatarStatus("saved");
        window.setTimeout(() => setAvatarStatus("idle"), 2000);
      })
      .catch(() => {
        setAvatarStatus("error");
        setAvatarPreview(null);
        toast.error(t("general.saveFailed"));
      });
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      setServerError(t("privacy.errors.userNotFound"));
      return;
    }

    try {
      setIsDeleting(true);
      setServerError("");
      await deleteUserMutation.mutateAsync();
      setShowDeleteConfirmation(false);
      if (logout) logout();
      router.push("/");
    } catch (error) {
      console.error("Delete account error:", error);
      setServerError(
        error instanceof Error ? error.message : t("privacy.errors.deleteFailed"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const switchLanguage = (next: string) => {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  };

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setActiveTab("general");
      setExpandedSections(["general"]);
      setNameDraft(user?.name ?? "");
      setSavedName(user?.name ?? "");
      setNameStatus("idle");
      setAvatarStatus("idle");
      setAvatarPreview(null);
    }
  }

  const toggleSection = (tabId: SettingsTab) => {
    setExpandedSections((prev) =>
      prev.includes(tabId)
        ? prev.filter((id) => id !== tabId)
        : [...prev, tabId],
    );
  };

  const isSectionExpanded = (tabId: SettingsTab) =>
    expandedSections.includes(tabId);

  const saveLabels = {
    saving: t("general.saving"),
    saved: t("general.saved"),
    error: t("general.saveFailed"),
  };

  /* ================= Section renderers ================= */

  const renderPlanCard = () => {
    const currentPlanName = billingDetails?.plan || activePlanId;
    const isPaid =
      currentPlanName === "PRO" || currentPlanName === "ENTERPRISE";

    return (
      <div
        className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
          currentPlanName === "ENTERPRISE"
            ? "border-violet-500/30 bg-violet-500/5"
            : currentPlanName === "PRO"
              ? "border-gold/30 bg-gold/5"
              : "border-edge bg-card/40"
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                currentPlanName === "ENTERPRISE"
                  ? "text-violet-400"
                  : currentPlanName === "PRO"
                    ? "text-gold"
                    : "text-secondary"
              }`}
            >
              {t("billing.planLabel", { plan: currentPlanName })}
            </span>
            {billingDetails?.status && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  billingDetails.status === "ACTIVE"
                    ? "bg-green/15 text-green"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {billingDetails.status}
              </span>
            )}
          </div>
          <p className="text-[11px] text-secondary">
            {billingDetails?.currentPeriodEnd
              ? t("billing.renewsOn", {
                  date: new Date(
                    billingDetails.currentPeriodEnd,
                  ).toLocaleDateString(locale),
                })
              : currentPlanName === "ENTERPRISE"
                ? t("billing.planDescriptions.enterprise")
                : currentPlanName === "PRO"
                  ? t("billing.planDescriptions.pro")
                  : t("billing.planDescriptions.free")}
          </p>
        </div>

        {isPaid ? (
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className="text-xs font-semibold border border-edge text-primary px-4 py-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
          >
            {t("general.managePlan")}
          </button>
        ) : (
          <Link
            href={`/${locale}/pricing`}
            onClick={onClose}
            className="text-xs font-semibold bg-gold text-ink px-4 py-2 rounded-lg hover:opacity-90 cursor-pointer transition-opacity"
          >
            {t("billing.upgradeToPro")}
          </Link>
        )}
      </div>
    );
  };

  // The mobile accordion and the desktop pane both render the active section,
  // so every generated id needs a scope suffix — otherwise the two copies
  // collide and `htmlFor` binds to whichever the browser sees first.
  const renderGeneral = (scope: string) => {
    const nameId = `settings-name-${scope}`;
    const avatarSrc =
      avatarPreview ?? (user?.avatar ? getAvatarUrl(user.avatar) : null);

    return (
      <div className="space-y-6 max-w-xl">
        <SectionHeader
          title={t("general.heading")}
          description={t("general.description")}
        />

        {/* Identity */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-edge bg-card flex items-center justify-center">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={user?.name || "User Avatar"}
                  width={64}
                  height={64}
                  key={avatarSrc}
                  className="h-full w-full object-cover"
                  unoptimized={isUploadedAvatar(avatarSrc)}
                />
              ) : (
                <span className="text-sm font-semibold text-secondary">
                  {getInitials(user?.name)}
                </span>
              )}
            </div>
            {avatarStatus === "saving" && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <LoaderCircle size={18} className="animate-spin text-white" />
              </span>
            )}
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-card px-3 py-1.5 text-xs font-medium text-primary hover:bg-card-hover transition-colors cursor-pointer"
            >
              <Camera size={13} />
              {t("general.changePhoto")}
            </button>
            <p className="text-[11px] text-secondary">
              {t("general.avatarHint")}
            </p>
            <input
              ref={avatarInputRef}
              type="file"
              accept={AVATAR_ACCEPTED_TYPES.join(",")}
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={nameId}
              className="text-xs font-medium text-secondary"
            >
              {t("general.nameLabel")}
            </label>
            <SaveIndicator status={nameStatus} labels={saveLabels} />
          </div>
          <input
            id={nameId}
            type="text"
            value={nameDraft}
            maxLength={NAME_MAX_LENGTH}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={() => setNameDraft((current) => current.trim())}
            className="w-full max-w-sm rounded-lg border border-edge bg-card px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-gold"
          />
          {/* This product prints names onto documents — say which name this is. */}
          <p className="text-[11px] text-secondary">{t("general.nameHelp")}</p>
        </div>

        {/* Email — read-only; changing it is a credential operation */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-secondary">
            {t("general.emailLabel")}
          </span>
          <div className="flex w-full max-w-sm items-center justify-between gap-2 rounded-lg border border-edge bg-card/40 px-3 py-2">
            <span className="text-xs text-secondary truncate">
              {user?.email}
            </span>
            {user?.isVerified ? (
              <MailCheck size={14} className="text-green shrink-0" />
            ) : (
              <MailWarning size={14} className="text-gold shrink-0" />
            )}
          </div>
        </div>

        {/* Plan */}
        <div className="space-y-2">
          <GroupHeader title={t("general.planHeading")} />
          {renderPlanCard()}
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <GroupHeader title={t("general.preferencesHeading")} />

          <OptionCards<ThemeMode>
            label={t("general.themeLabel")}
            columns={3}
            value={themeMode}
            onChange={setTheme}
            options={[
              { id: "light", label: t("general.light"), icon: Sun },
              { id: "dark", label: t("general.dark"), icon: Moon },
              { id: "system", label: t("general.system"), icon: Laptop },
            ]}
          />

          <div className="space-y-2">
            <OptionCards
              label={t("general.languageLabel")}
              columns={2}
              value={locale}
              onChange={switchLanguage}
              options={[
                { id: "en", label: "English", icon: Languages },
                { id: "ar", label: "العربية", icon: Languages },
              ]}
            />
            <p className="text-[11px] text-secondary">
              {t("general.languageHelp")}
            </p>
          </div>

          <ToggleRow
            label={t("general.reduceMotion")}
            description={t("general.reduceMotionDesc")}
            checked={preferences.reduceMotion}
            onChange={(next) => setPreference("reduceMotion", next)}
          />
        </div>

        {/* New-resume defaults */}
        <div className="space-y-2">
          <GroupHeader title={t("general.defaultsHeading")} />
          <OptionCards<ExportFormatPreference>
            label={t("general.exportFormatLabel")}
            columns={2}
            value={preferences.defaultExportFormat}
            onChange={(next) => setPreference("defaultExportFormat", next)}
            options={[
              { id: "pdf", label: t("general.formats.pdf") },
              { id: "jpg", label: t("general.formats.jpg") },
            ]}
          />
          <p className="text-[11px] text-secondary">
            {t("general.exportFormatHelp")}
          </p>
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    const items: { key: keyof NotificationPreferences }[] = [
      { key: "resumeExported" },
      { key: "securityAlerts" },
      { key: "weeklyTips" },
      { key: "productUpdates" },
    ];

    return (
      <div className="space-y-6 max-w-xl">
        <SectionHeader
          title={t("notifications.heading")}
          description={t("notifications.description")}
        />
        <div className="space-y-4">
          {items.map(({ key }) => (
            <ToggleRow
              key={key}
              label={t(`notifications.${key}.title`)}
              description={t(`notifications.${key}.desc`)}
              checked={preferences.notifications[key]}
              onChange={(next) => setNotification(key, next)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderBilling = () => {
    const currentPlanName = billingDetails?.plan || activePlanId;
    const isPaid =
      currentPlanName === "PRO" || currentPlanName === "ENTERPRISE";

    return (
      <div className="space-y-6 max-w-xl">
        <SectionHeader
          title={t("billing.heading")}
          description={t("billing.description")}
        />

        {renderPlanCard()}

        <div className="flex flex-wrap items-center gap-2">
          {isPaid && billingDetails?.updatePaymentUrl && (
            <a
              href={billingDetails.updatePaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold border border-edge text-primary px-3 py-2 rounded-lg hover:bg-card-hover transition-colors"
            >
              <span>{t("billing.updatePayment")}</span>
              <ExternalLink size={12} />
            </a>
          )}

          {currentPlanName === "PRO" && (
            <Link
              href={`/${locale}/pricing`}
              onClick={onClose}
              className="text-xs font-semibold bg-violet-500/20 border border-violet-500/30 text-violet-400 px-3 py-2 rounded-lg hover:bg-violet-500/30 transition-colors"
            >
              {t("billing.upgradeToEnterprise")}
            </Link>
          )}

          {isPaid && (
            <button
              type="button"
              onClick={() => void handleCancelSubscription()}
              disabled={cancelingBilling || billingDetails?.cancelAtPeriodEnd}
              className="text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelingBilling ? (
                <span className="inline-flex items-center gap-1">
                  <LoaderCircle size={12} className="animate-spin" />
                  <span>{t("billing.canceling")}</span>
                </span>
              ) : billingDetails?.cancelAtPeriodEnd ? (
                t("billing.cancellationScheduled")
              ) : (
                t("billing.cancelPlan")
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSecurity = () => (
    <div className="space-y-6 max-w-xl">
      <SectionHeader
        title={t("security.heading")}
        description={t("security.description")}
      />

      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-secondary">
          {t("security.accountEmail")}
        </span>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-card p-3">
          <span className="text-xs text-primary truncate">{user?.email}</span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              user?.isVerified
                ? "bg-green/15 text-green"
                : "bg-gold/15 text-gold"
            }`}
          >
            {user?.isVerified ? (
              <MailCheck size={11} />
            ) : (
              <MailWarning size={11} />
            )}
            {user?.isVerified
              ? t("security.verified")
              : t("security.unverified")}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <GroupHeader title={t("security.passwordHeading")} />
        <p className="text-[11px] text-secondary">{t("security.passwordDesc")}</p>
        <Link
          href={`/${locale}/forgetpassword`}
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-card px-3 py-2 text-xs font-medium text-primary hover:bg-card-hover transition-colors cursor-pointer"
        >
          <KeyRound size={13} />
          {t("security.changePassword")}
        </Link>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6 max-w-xl">
      <SectionHeader
        title={t("privacy.heading")}
        description={t("privacy.description")}
      />

      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
          <AlertTriangle size={15} />
          <span>{t("privacy.dangerZone")}</span>
        </div>
        <p className="text-xs text-secondary">{t("privacy.dangerZoneDesc")}</p>
        {serverError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2">
            <p className="text-xs text-red-400">{serverError}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowDeleteConfirmation(true)}
          disabled={isDeleting}
          className="flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={13} />
          {t("privacy.deleteAccount")}
        </button>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-6 max-w-xl">
      <SectionHeader
        title={t("about.heading")}
        description={t("about.description")}
      />

      <div className="space-y-2 text-xs text-secondary">
        <div className="flex justify-between py-1 border-b border-edge">
          <span>{t("about.version")}</span>
          <span className="font-semibold text-primary">1.0.0</span>
        </div>
        <div className="flex justify-between py-1 border-b border-edge">
          <span>{t("about.buildDate")}</span>
          <span className="font-semibold text-primary">
            {t("about.buildDateValue")}
          </span>
        </div>
      </div>
    </div>
  );

  const renderTabContent = (tabId: SettingsTab, scope: string) => {
    switch (tabId) {
      case "general":
        return renderGeneral(scope);
      case "notifications":
        return renderNotifications();
      case "billing":
        return renderBilling();
      case "security":
        return renderSecurity();
      case "privacy":
        return renderPrivacy();
      case "about":
        return renderAbout();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative flex h-[85vh] w-full max-w-4xl flex-col sm:flex-row overflow-hidden rounded-2xl border border-edge bg-elevated shadow-2xl z-10 focus:outline-none"
          >
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="absolute inset-e-3 top-3 sm:inset-e-4 sm:top-4 z-30 rounded-lg p-1.5 text-secondary hover:bg-card-hover hover:text-primary transition-colors cursor-pointer bg-elevated/80 backdrop-blur-sm sm:bg-transparent"
            >
              <X size={18} />
            </button>

            {/* Sidebar — desktop */}
            <aside className="hidden sm:flex w-60 border-e border-edge bg-card/40 p-4 shrink-0 flex-col justify-between overflow-y-auto">
              <div>
                <div className="px-3 py-2 mb-2">
                  <h2 id="settings-title" className="font-bold text-primary">
                    {t("title")}
                  </h2>
                  <p className="text-[11px] text-secondary">{t("subtitle")}</p>
                </div>

                <nav aria-label={t("title")} className="flex flex-col gap-1">
                  {SETTINGS_TAB_IDS.map((tabId) => {
                    const Icon = TAB_ICONS[tabId];
                    const isActive = activeTab === tabId;
                    return (
                      <button
                        key={tabId}
                        onClick={() => setActiveTab(tabId)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-gold/15 text-gold font-semibold"
                            : "text-secondary hover:bg-card-hover hover:text-primary"
                        }`}
                      >
                        <Icon size={15} />
                        <span>{t(`tabs.${tabId}`)}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="px-3 py-2 border-t border-edge text-[11px] text-secondary">
                {t("version")}
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-4 pt-12 sm:pt-8">
              {/* Mobile accordion */}
              <div className="sm:hidden space-y-2">
                <h2 className="sr-only">{t("title")}</h2>
                {SETTINGS_TAB_IDS.map((tabId) => {
                  const Icon = TAB_ICONS[tabId];
                  const isExpanded = isSectionExpanded(tabId);
                  return (
                    <div
                      key={tabId}
                      className={`rounded-xl border overflow-hidden transition-colors ${
                        isExpanded
                          ? "border-gold/30 bg-card/60"
                          : "border-edge bg-card/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(tabId)}
                        aria-expanded={isExpanded}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-medium text-primary hover:bg-card-hover transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon
                            size={15}
                            className={
                              isExpanded ? "text-gold" : "text-secondary"
                            }
                          />
                          <span>{t(`tabs.${tabId}`)}</span>
                        </span>
                        <ChevronDown
                          size={15}
                          className={`text-secondary transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-3 border-t border-edge">
                              {renderTabContent(tabId, "mobile")}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Desktop content */}
              <div className="hidden sm:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {renderTabContent(activeTab, "desktop")}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </motion.div>

          {/* Delete account confirmation */}
          <AnimatePresence>
            {showDeleteConfirmation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-160 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isDeleting && setShowDeleteConfirmation(false)}
                  className="fixed inset-0 bg-black/70 backdrop-blur-md"
                />

                <motion.div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="delete-account-title"
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.15 }}
                  className="relative w-full max-w-sm rounded-2xl border border-edge bg-elevated shadow-2xl p-6 space-y-4 z-20"
                >
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20">
                      <AlertTriangle size={24} className="text-red-400" />
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <h3
                      id="delete-account-title"
                      className="font-bold text-lg text-primary"
                    >
                      {t("deleteConfirm.title")}
                    </h3>
                    <p className="text-sm text-secondary">
                      {t("deleteConfirm.message")}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirmation(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 rounded-lg border border-edge bg-card text-secondary hover:bg-card-hover transition-colors cursor-pointer text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("deleteConfirm.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          {t("deleteConfirm.deleting")}
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          {t("deleteConfirm.confirm")}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
