"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Palette,
  Globe,
  Shield,
  FileText,
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
  Download,
  ExternalLink,
  Laptop,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDeleteUserMutation } from "@/hooks/queries/useUser";
import { toast } from "sonner";
import {
  getBillingSubscription,
  cancelBillingSubscription,
  type BillingSubscriptionDetails,
} from "@/lib/backend";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab =
  | "appearance"
  | "language"
  | "resume"
  | "notifications"
  | "billing"
  | "security"
  | "privacy"
  | "about";

const TAB_ICONS: Record<SettingsTab, LucideIcon> = {
  appearance: Palette,
  language: Globe,
  resume: FileText,
  notifications: Bell,
  billing: CreditCard,
  security: Shield,
  privacy: Lock,
  about: Info,
};

const SETTINGS_TAB_IDS: SettingsTab[] = [
  "appearance",
  "language",
  "resume",
  "notifications",
  "billing",
  "security",
  "privacy",
  "about",
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [expandedSections, setExpandedSections] = useState<SettingsTab[]>([
    "appearance",
  ]);

  const { theme, toggleTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("gold");
  const [compactMode, setCompactMode] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const deleteUserMutation = useDeleteUserMutation(user?.id);

  const [selectedLang, setSelectedLang] = useState(locale);
  const [dateFormat, setDateFormat] = useState("MM/YYYY");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const activePlanId = (user?.planName ?? "FREE").toLocaleUpperCase() as
    "FREE" | "PRO" | "ENTERPRISE";

  const [defaultPaperSize, setDefaultPaperSize] = useState("A4");
  const [defaultExportFormat, setDefaultExportFormat] = useState("pdf");
  const [autoSave, setAutoSave] = useState(true);

  const [notifications, setNotifications] = useState({
    resumeExported: true,
    weeklyTips: false,
    securityAlerts: true,
    productUpdates: true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [billingDetails, setBillingDetails] = useState<BillingSubscriptionDetails | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [cancelingBilling, setCancelingBilling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;
      if (token) {
        setLoadingBilling(true);
        getBillingSubscription(token)
          .then((res) => setBillingDetails(res))
          .catch((err) => console.error("Could not fetch billing details:", err))
          .finally(() => setLoadingBilling(false));
      }
    }
  }, [isOpen]);

  const handleCancelSubscription = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("resumax_token") : null;
    if (!token) return;
    try {
      setCancelingBilling(true);
      await cancelBillingSubscription(token);
      toast.success(
        locale === "ar"
          ? "تم إلغاء الاشتراك بنجاح"
          : "Subscription canceled successfully."
      );
      const updated = await getBillingSubscription(token);
      setBillingDetails(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setCancelingBilling(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSave = () => {
    setSavedSuccess(true);

    if (selectedLang !== locale) {
      const segments = pathname.split("/");
      segments[1] = selectedLang;
      const newPath = segments.join("/");

      setTimeout(() => {
        router.push(newPath);
      }, 400);
    } else {
      setTimeout(() => setSavedSuccess(false), 2000);
    }
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

      if (logout) {
        logout();
      }

      router.push("/");
    } catch (error) {
      console.error("Delete account error:", error);
      setServerError(
        error instanceof Error
          ? error.message
          : t("privacy.errors.deleteFailed"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedLang(locale);
      setExpandedSections(["appearance"]);
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

  const notificationItems: { key: keyof typeof notifications }[] = [
    { key: "resumeExported" },
    { key: "securityAlerts" },
    { key: "weeklyTips" },
    { key: "productUpdates" },
  ];

  // ===== Section Content Renderers =====

  const renderAppearance = () => (
    <div className="space-y-6">
      <div className="border-b border-edge pb-3">
        <h3 className="font-semibold text-primary">
          {t("appearance.heading")}
        </h3>
        <p className="text-xs text-secondary">{t("appearance.description")}</p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-secondary">
          {t("appearance.themeLabel")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: "light",
              label: t("appearance.light"),
              icon: Sun,
            },
            {
              id: "dark",
              label: t("appearance.dark"),
              icon: Moon,
            },
          ].map((item) => {
            const ItemIcon = item.icon;
            const isActive = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!isActive) toggleTheme();
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-edge bg-card text-secondary hover:border-gold/40"
                }`}
              >
                <ItemIcon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-secondary">
          {t("appearance.accentColorLabel")}
        </label>
        <div className="flex items-center gap-3">
          {[
            { id: "gold", bg: "bg-amber-400" },
            { id: "blue", bg: "bg-blue-500" },
            { id: "violet", bg: "bg-violet-500" },
            { id: "emerald", bg: "bg-emerald-500" },
          ].map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => setAccentColor(color.id)}
              className={`h-7 w-7 rounded-full ${color.bg} flex items-center justify-center cursor-pointer transition-transform ${
                accentColor === color.id
                  ? "ring-2 ring-gold ring-offset-2 ring-offset-elevated scale-110"
                  : ""
              }`}
            >
              {accentColor === color.id && (
                <Check size={14} className="text-black" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-primary">
              {t("appearance.compactMode")}
            </p>
            <p className="text-[11px] text-secondary">
              {t("appearance.compactModeDesc")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={compactMode}
            onChange={(e) => setCompactMode(e.target.checked)}
            className="accent-gold h-4 w-4 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-primary">
              {t("appearance.reduceAnimations")}
            </p>
            <p className="text-[11px] text-secondary">
              {t("appearance.reduceAnimationsDesc")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={reduceAnimations}
            onChange={(e) => setReduceAnimations(e.target.checked)}
            className="accent-gold h-4 w-4 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="space-y-6">
      <div className="border-b border-edge pb-3">
        <h3 className="font-semibold text-primary">{t("language.heading")}</h3>
        <p className="text-xs text-secondary">{t("language.description")}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-secondary">
            {t("language.interfaceLanguage")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { code: "en", label: "English" },
              { code: "ar", label: "العربية" },
            ].map((lang) => {
              const isActive = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLang(lang.code)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-edge bg-card text-secondary hover:border-gold/40"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-secondary">
            {t("language.dateFormatLabel")}
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full rounded-lg border border-edge bg-card px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
          >
            <option value="MM/YYYY">{t("language.dateFormats.mmYYYY")}</option>
            <option value="MMM YYYY">
              {t("language.dateFormats.mmmYYYY")}
            </option>
            <option value="YYYY-MM">{t("language.dateFormats.yyyyMM")}</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderResume = () => (
    <div className="space-y-6">
      <div className="border-b border-edge pb-3">
        <h3 className="font-semibold text-primary">{t("resume.heading")}</h3>
        <p className="text-xs text-secondary">{t("resume.description")}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-secondary">
            {t("resume.paperSizeLabel")}
          </label>
          <div className="flex gap-3">
            {["A4", "Letter"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setDefaultPaperSize(size)}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  defaultPaperSize === size
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-edge bg-card text-secondary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-secondary">
            {t("resume.exportFormatLabel")}
          </label>
          <select
            value={defaultExportFormat}
            onChange={(e) => setDefaultExportFormat(e.target.value)}
            className="w-full rounded-lg border border-edge bg-card px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
          >
            <option value="pdf">{t("resume.formats.pdf")}</option>
            <option value="docx">{t("resume.formats.docx")}</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-medium text-primary">
              {t("resume.autoSave")}
            </p>
            <p className="text-[11px] text-secondary">
              {t("resume.autoSaveDesc")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
            className="accent-gold h-4 w-4 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="border-b border-edge pb-3">
        <h3 className="font-semibold text-primary">
          {t("notifications.heading")}
        </h3>
        <p className="text-xs text-secondary">
          {t("notifications.description")}
        </p>
      </div>

      <div className="space-y-4">
        {notificationItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary">
                {t(`notifications.${item.key}.title`)}
              </p>
              <p className="text-[11px] text-secondary">
                {t(`notifications.${item.key}.desc`)}
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications[item.key]}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  [item.key]: e.target.checked,
                })
              }
              className="accent-gold h-4 w-4 cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderBilling = () => {
    const currentPlanName = billingDetails?.plan || activePlanId;
    const isPaid = currentPlanName === "PRO" || currentPlanName === "ENTERPRISE";

    return (
      <div className="space-y-6">
        <div className="border-b border-edge pb-3">
          <h3 className="font-semibold text-primary">{t("billing.heading")}</h3>
          <p className="text-xs text-secondary">{t("billing.description")}</p>
        </div>

        {/* Active Plan Card */}
        <div
          className={`rounded-xl border p-4 space-y-3 ${
            currentPlanName === "ENTERPRISE"
              ? "border-violet-500/30 bg-violet-500/5"
              : currentPlanName === "PRO"
                ? "border-gold/30 bg-gold/5"
                : "border-blue-500/30 bg-blue-500/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    currentPlanName === "ENTERPRISE"
                      ? "text-violet-400"
                      : currentPlanName === "PRO"
                        ? "text-gold"
                        : "text-blue-400"
                  }`}
                >
                  {t("billing.planLabel", { plan: currentPlanName })}
                </span>
                {billingDetails?.status && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    billingDetails.status === 'ACTIVE'
                      ? 'bg-green/15 text-green'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {billingDetails.status}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-secondary">
                {billingDetails?.currentPeriodEnd ? (
                  `${locale === "ar" ? "تاريخ التجديد:" : "Next billing / expiry:"} ${new Date(billingDetails.currentPeriodEnd).toLocaleDateString()}`
                ) : (
                  t("billing.activeSubscription")
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {currentPlanName === "FREE" && (
                <Link
                  href={`/${locale}/pricing`}
                  onClick={onClose}
                  className="text-xs font-semibold bg-gold text-ink px-4 py-2 rounded-lg hover:opacity-90 cursor-pointer transition-opacity"
                >
                  {t("billing.upgradeToPro")}
                </Link>
              )}

              {isPaid && billingDetails?.updatePaymentUrl && (
                <a
                  href={billingDetails.updatePaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 border border-edge text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <span>{locale === "ar" ? "تحديث وسيلة الدفع" : "Update Payment"}</span>
                  <ExternalLink size={12} />
                </a>
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
                      <span>{locale === "ar" ? "جاري الإلغاء..." : "Canceling..."}</span>
                    </span>
                  ) : billingDetails?.cancelAtPeriodEnd ? (
                    locale === "ar" ? "تمت جدولة الإلغاء" : "Cancellation Scheduled"
                  ) : (
                    locale === "ar" ? "إلغاء الاشتراك" : "Cancel Plan"
                  )}
                </button>
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
            </div>
          </div>

          <p className="text-xs text-secondary">
            {currentPlanName === "ENTERPRISE"
              ? t("billing.planDescriptions.enterprise")
              : currentPlanName === "PRO"
                ? t("billing.planDescriptions.pro")
                : t("billing.planDescriptions.free")}
          </p>
        </div>

      {/* Usage */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary">
          {t("billing.usageLimits")}
        </h4>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-secondary">{t("billing.aiCreditsUsed")}</span>
            <span className="text-primary font-medium">23 / 50</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-card border border-edge overflow-hidden">
            <div className="h-full bg-gold w-[46%]" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-secondary">{t("billing.resumesStored")}</span>
            <span className="text-primary font-medium">2 / 3</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-card border border-edge overflow-hidden">
            <div className="h-full bg-gold w-[66%]" />
          </div>
        </div>
      </div>
    </div>
  );
};

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="border-b border-edge pb-3">
        <h3 className="font-semibold text-primary">{t("security.heading")}</h3>
        <p className="text-xs text-secondary">{t("security.description")}</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary">
          {t("security.activeSessions")}
        </h4>
        <div className="flex items-center justify-between p-3 rounded-lg border border-edge bg-card">
          <div className="flex items-center gap-3">
            <Laptop size={18} className="text-gold" />
            <div>
              <p className="text-xs font-medium text-primary">
                Windows • Chrome
              </p>
              <p className="text-[10px] text-secondary">
                {t("security.currentDevice")}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
            {t("security.active")}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="text-xs text-red-400 hover:underline cursor-pointer"
      >
        {t("security.signOutAllDevices")}
      </button>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="border-b border-edge pb-3">
        <h3 className="font-semibold text-primary">{t("privacy.heading")}</h3>
        <p className="text-xs text-secondary">{t("privacy.description")}</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-edge bg-card px-3 py-2 text-xs text-primary hover:bg-card-hover transition-colors cursor-pointer"
        >
          <Download size={14} />
          {t("privacy.downloadData")}
        </button>
      </div>

      {/* Danger Zone */}
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
    <div className="space-y-6">
      <div className="border-b border-edge pb-3">
        <h3 className="font-semibold text-primary">{t("about.heading")}</h3>
        <p className="text-xs text-secondary">{t("about.description")}</p>
      </div>

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

      <div className="flex gap-4 text-xs text-gold">
        <a href="#" className="flex items-center gap-1 hover:underline">
          {t("about.termsOfService")} <ExternalLink size={12} />
        </a>
        <a href="#" className="flex items-center gap-1 hover:underline">
          {t("about.privacyPolicy")} <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );

  const renderTabContent = (tabId: SettingsTab) => {
    switch (tabId) {
      case "appearance":
        return renderAppearance();
      case "language":
        return renderLanguage();
      case "resume":
        return renderResume();
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative flex h-[85vh] w-full max-w-4xl flex-col sm:flex-row overflow-hidden rounded-2xl border border-edge bg-elevated shadow-2xl z-10"
          >
            {/* Close Button - Safely positioned in top corner */}
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="absolute inset-e-3 top-3 sm:inset-e-4 sm:top-4 z-30 rounded-lg p-1.5 text-secondary hover:bg-card-hover hover:text-primary transition-colors cursor-pointer bg-elevated/80 backdrop-blur-sm sm:bg-transparent"
            >
              <X size={18} />
            </button>

            {/* Sidebar Navigation - Desktop only */}
            <aside className="hidden sm:flex w-60 border-e border-edge bg-card/40 p-4 shrink-0 flex-col justify-between overflow-y-auto">
              <div>
                <div className="px-3 py-2 mb-2">
                  <h2 className="font-bold text-primary">{t("title")}</h2>
                  <p className="text-[11px] text-secondary">{t("subtitle")}</p>
                </div>

                <nav className="flex flex-col gap-1">
                  {SETTINGS_TAB_IDS.map((tabId) => {
                    const Icon = TAB_ICONS[tabId];
                    const isActive = activeTab === tabId;
                    return (
                      <button
                        key={tabId}
                        onClick={() => setActiveTab(tabId)}
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

            {/* Main Content Area - Added pt-12 on mobile to account for the close button */}
            <main className="flex-1 overflow-y-auto p-4 pt-12 sm:pt-8 flex flex-col justify-between">
              {/* Mobile Accordion - visible only on mobile */}
              <div className="sm:hidden space-y-2">
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
                              {renderTabContent(tabId)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Tab Content */}
              <div className="hidden sm:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {renderTabContent(activeTab)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-edge mt-6">
                {savedSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Check size={14} /> {t("preferencesSaved")}
                  </span>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 text-xs font-medium text-secondary hover:text-primary cursor-pointer transition-colors"
                  >
                    {t("close")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-lg bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:opacity-90 cursor-pointer transition-opacity"
                  >
                    {t("savePreferences")}
                  </button>
                </div>
              </div>
            </main>
          </motion.div>

          {/* Delete Account Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirmation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-160 flex items-center justify-center p-4"
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() =>
                    !isDeleting && setShowDeleteConfirmation(false)
                  }
                  className="fixed inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Confirmation Dialog */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.15 }}
                  className="relative w-full max-w-sm rounded-2xl border border-edge bg-elevated shadow-2xl p-6 space-y-4 z-20"
                >
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20">
                      <AlertTriangle size={24} className="text-red-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-lg text-primary">
                      {t("deleteConfirm.title")}
                    </h3>
                    <p className="text-sm text-secondary">
                      {t("deleteConfirm.message")}
                    </p>
                  </div>

                  {/* Action Buttons */}
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
