"use client";

import { useState } from "react";
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
  Laptop,
  Download,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLocale } from "next-intl";
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language & Region", icon: Globe },
  { id: "resume", label: "Resume Preferences", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Plans", icon: CreditCard },
  { id: "security", label: "Security & Sessions", icon: Shield },
  { id: "privacy", label: "Privacy & Data", icon: Lock },
  { id: "about", label: "About ResuMax", icon: Info },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  // State Management for Settings
  const { theme, toggleTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("gold");
  const [compactMode, setCompactMode] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [selectedLang, setSelectedLang] = useState(locale);
  const [dateFormat, setDateFormat] = useState("MM/YYYY");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const activePlanId = (user?.planName ?? 'FREE').toLocaleUpperCase() as 'FREE' | 'PRO' | 'ENTERPRISE';


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
  // useEffect(() => {
  //   if (user?.id) {
  //     const fetchUserPlan = async () => {
  //       try {
  //         setPlanLoading(true);
  //         const token = localStorage.getItem("resumax_token");
          
  //         const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
  //           method: 'GET',
  //           credentials: "include",
  //           headers: {
  //             ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //           },
  //         });

  //         if (res.ok) {
  //           const userData = await res.json();
  //           // Assuming the user object has a 'plan' or 'subscription' field
  //           setCurrentPlan(userData?.subscription?.plan || userData?.plan || "Free");
  //         } else {
  //           setCurrentPlan("Free"); // Default to Free plan
  //         }
  //       } catch (error) {
  //         console.error("Failed to fetch user plan:", error);
  //         setCurrentPlan("Free"); // Default to Free plan on error
  //       } finally {
  //         setPlanLoading(false);
  //       }
  //     };

  //     fetchUserPlan();
  //   }
  // }, [user?.id]);

  const handleSave = () => {
    setSavedSuccess(true);

    if (selectedLang !== locale) {
      const segments = pathname.split("/");
      segments[1] = selectedLang; // locale is the first path segment
      const newPath = segments.join("/");

      // Give the user a beat to see "Preferences saved!" before navigating away
      setTimeout(() => {
        router.push(newPath);
      }, 400);
    } else {
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      setServerError('User information not found');
      return;
    }

    try {
      setIsDeleting(true);
      setServerError('');

      const token = localStorage.getItem("resumax_token");

      const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error("Server responded:", res.status, errorBody);
        throw new Error(`Failed to delete user: ${res.status}`);
      }

      // Account deleted successfully
      setShowDeleteConfirmation(false);
      
      // Sign out the user and redirect
      if (logout) {
        logout();
      }
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error("Delete account error:", error);
      setServerError(error instanceof Error ? error.message : 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedLang(locale);
    }
  }


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
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-lg p-1.5 text-secondary hover:bg-card-hover hover:text-primary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Sidebar Navigation */}
            <aside className="w-full sm:w-60 border-b sm:border-b-0 sm:border-r border-edge bg-card/40 p-3 sm:p-4 shrink-0 flex flex-col justify-between overflow-x-auto sm:overflow-y-auto">
              <div>
                <div className="px-3 py-2 mb-2">
                  <h2 className="font-bold text-primary">Settings</h2>
                  <p className="text-[11px] text-secondary">Manage app preferences</p>
                </div>

                <nav className="flex sm:flex-col gap-1">
                  {SETTINGS_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${isActive
                          ? "bg-gold/15 text-gold font-semibold"
                          : "text-secondary hover:bg-card-hover hover:text-primary"
                          }`}
                      >
                        <Icon size={15} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="hidden sm:block px-3 py-2 border-t border-edge text-[11px] text-secondary">
                ResuMax v1.0.0
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* 1. APPEARANCE */}
                  {activeTab === "appearance" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">Appearance</h3>
                        <p className="text-xs text-secondary">Customize how ResuMax looks on your screen.</p>
                      </div>

                      {/* Theme Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary">Theme</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "light", label: "Light", icon: Sun },
                            { id: "dark", label: "Dark", icon: Moon },
                          ].map((item) => {
                            const ItemIcon = item.icon;
                            const isActive = theme === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  // toggleTheme() flips dark<->light, so only call it
                                  // if the button pressed isn't already the active theme
                                  if (!isActive) toggleTheme();
                                }}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${isActive
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
                        <label className="text-xs font-medium text-secondary">Accent Color</label>
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
                              className={`h-7 w-7 rounded-full ${color.bg} flex items-center justify-center cursor-pointer transition-transform ${accentColor === color.id ? "ring-2 ring-gold ring-offset-2 ring-offset-elevated scale-110" : ""
                                }`}
                            >
                              {accentColor === color.id && <Check size={14} className="text-black" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-primary">Compact Mode</p>
                            <p className="text-[11px] text-secondary">Reduce padding in sidebar and editor</p>
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
                            <p className="text-xs font-medium text-primary">Reduce Animations</p>
                            <p className="text-[11px] text-secondary">Disable motion transitions for faster navigation</p>
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
                  )}

                  {/* 2. LANGUAGE */}
                  {activeTab === "language" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">Language & Region</h3>
                        <p className="text-xs text-secondary">Set application language and date formatting.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-secondary">Interface Language</label>
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
                                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${isActive
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
                          <label className="text-xs font-medium text-secondary">Default Date Format on Resume</label>
                          <select
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                            className="w-full rounded-lg border border-edge bg-card px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                          >
                            <option value="MM/YYYY">MM/YYYY (e.g., 08/2026)</option>
                            <option value="MMM YYYY">MMM YYYY (e.g., Aug 2026)</option>
                            <option value="YYYY-MM">YYYY-MM (e.g., 2026-08)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. RESUME PREFERENCES */}
                  {activeTab === "resume" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">Resume Preferences</h3>
                        <p className="text-xs text-secondary">Default defaults when generating new resumes.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-secondary">Default Paper Size</label>
                          <div className="flex gap-3">
                            {["A4", "Letter"].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setDefaultPaperSize(size)}
                                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${defaultPaperSize === size
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
                          <label className="text-xs font-medium text-secondary">Default Download Format</label>
                          <select
                            value={defaultExportFormat}
                            onChange={(e) => setDefaultExportFormat(e.target.value)}
                            className="w-full rounded-lg border border-edge bg-card px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                          >
                            <option value="pdf">PDF Document (.pdf)</option>
                            <option value="docx">Microsoft Word (.docx)</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <p className="text-xs font-medium text-primary">Auto-Save Editor Changes</p>
                            <p className="text-[11px] text-secondary">Automatically save changes while typing</p>
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
                  )}

                  {/* 4. NOTIFICATIONS */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">Email Notifications</h3>
                        <p className="text-xs text-secondary">Manage what emails you receive from ResuMax.</p>
                      </div>

                      <div className="space-y-4">
                        {[
                          { key: "resumeExported", title: "Resume Exports", desc: "Notify when PDF generation completes" },
                          { key: "securityAlerts", title: "Security Alerts", desc: "Alert me about new device logins" },
                          { key: "weeklyTips", title: "Career Tips & AI Advice", desc: "Weekly tips to improve your resume score" },
                          { key: "productUpdates", title: "Product News & Features", desc: "Updates about new templates and features" },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-primary">{item.title}</p>
                              <p className="text-[11px] text-secondary">{item.desc}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={(notifications as any)[item.key]}
                              onChange={(e) =>
                                setNotifications({ ...notifications, [item.key]: e.target.checked })
                              }
                              className="accent-gold h-4 w-4 cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. BILLING */}
                  {activeTab === "billing" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">Billing & Subscription</h3>
                        <p className="text-xs text-secondary">Manage your active subscription and plan limits.</p>
                      </div>

                      {/* Active Plan Card */}
                      <div className={`rounded-xl border p-4 space-y-3 ${
                        activePlanId === "ENTERPRISE" 
                          ? "border-violet-500/30 bg-violet-500/5"
                          : activePlanId === "PRO"
                          ? "border-gold/30 bg-gold/5"
                          : "border-blue-500/30 bg-blue-500/5"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                              activePlanId === "ENTERPRISE"
                                ? "text-violet-400"
                                : activePlanId === "PRO"
                                ? "text-gold"
                                : "text-blue-400"
                            }`}>
                              {activePlanId} Plan
                            </span>
                            <p className="text-[11px] text-secondary">Active Subscription</p>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* Show upgrade button only for Free plan */}
                            {activePlanId === "FREE" && (
                              <button className="text-xs font-semibold bg-gold text-ink px-4 py-2 rounded-lg hover:opacity-90 cursor-pointer transition-opacity">
                                Upgrade to Pro
                              </button>
                            )}

                            {/* Show manage and upgrade buttons for Pro plan */}
                            {activePlanId === "PRO" && (
                              <>
                                <button className="text-xs font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 cursor-pointer transition-colors">
                                  Manage Plan
                                </button>
                                <button className="text-xs font-semibold bg-violet-500/20 border border-violet-500/30 text-violet-400 px-4 py-2 rounded-lg hover:bg-violet-500/30 cursor-pointer transition-colors">
                                  Upgrade to Enterprise
                                </button>
                              </>
                            )}

                            {/* Show manage button for Enterprise plan */}
                            {activePlanId === "ENTERPRISE" && (
                              <Link
                               href={`${locale}/pricing`}
                               className="text-xs font-semibold bg-violet-500/20 border border-violet-500/30 text-violet-400 px-4 py-2 rounded-lg hover:bg-violet-500/30 cursor-pointer transition-colors">
                                Manage Enterprise
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Plan Description */}
                        <p className="text-xs text-secondary">
                          {activePlanId === "ENTERPRISE" 
                            ? "You are on the Enterprise plan with unlimited features, priority support, and custom integrations."
                            : activePlanId === "PRO"
                            ? "You are on the Pro plan with unlimited AI resume enhancements, DOCX exports, and advanced analytics."
                            : "You are currently on the Free plan. Upgrade for unlimited AI resume enhancements and DOCX exports."
                          }
                        </p>
                      </div>

                      {/* Usage */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-primary">Usage Limits</h4>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">AI Credits Used</span>
                            <span className="text-primary font-medium">23 / 50</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-card border border-edge overflow-hidden">
                            <div className="h-full bg-gold w-[46%]" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">Resumes Stored</span>
                            <span className="text-primary font-medium">2 / 3</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-card border border-edge overflow-hidden">
                            <div className="h-full bg-gold w-[66%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. SECURITY */}
                  {activeTab === "security" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">Security & Sessions</h3>
                        <p className="text-xs text-secondary">Manage password and view connected devices.</p>
                      </div>

                      {/* Active Session */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-primary">Active Sessions</h4>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-edge bg-card">
                          <div className="flex items-center gap-3">
                            <Laptop size={18} className="text-gold" />
                            <div>
                              <p className="text-xs font-medium text-primary">Windows • Chrome</p>
                              <p className="text-[10px] text-secondary">Current Device</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-xs text-red-400 hover:underline cursor-pointer"
                      >
                        Sign out from all devices
                      </button>
                    </div>
                  )}

                  {/* 7. PRIVACY */}
                  {activeTab === "privacy" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">Privacy & Data</h3>
                        <p className="text-xs text-secondary">Control your personal data and account deletion.</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-lg border border-edge bg-card px-3 py-2 text-xs text-primary hover:bg-card-hover transition-colors cursor-pointer"
                        >
                          <Download size={14} />
                          Download Account Data (.json)
                        </button>
                      </div>

                      {/* Danger Zone */}
                      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                          <AlertTriangle size={15} />
                          <span>Danger Zone</span>
                        </div>
                        <p className="text-xs text-secondary">
                          Permanently delete your account and all stored resumes from ResuMax. This cannot be undone.
                        </p>
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
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 8. ABOUT */}
                  {activeTab === "about" && (
                    <div className="space-y-6">
                      <div className="border-b border-edge pb-3">
                        <h3 className="font-semibold text-primary">About ResuMax</h3>
                        <p className="text-xs text-secondary">Application metadata and support links.</p>
                      </div>

                      <div className="space-y-2 text-xs text-secondary">
                        <div className="flex justify-between py-1 border-b border-edge">
                          <span>Version</span>
                          <span className="font-semibold text-primary">1.0.0</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-edge">
                          <span>Build Date</span>
                          <span className="font-semibold text-primary">July 2026</span>
                        </div>
                      </div>

                      <div className="flex gap-4 text-xs text-gold">
                        <a href="#" className="flex items-center gap-1 hover:underline">
                          Terms of Service <ExternalLink size={12} />
                        </a>
                        <a href="#" className="flex items-center gap-1 hover:underline">
                          Privacy Policy <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-edge mt-6">
                {savedSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Check size={14} /> Preferences saved!
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
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-lg bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:opacity-90 cursor-pointer transition-opacity"
                  >
                    Save Preferences
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
                  onClick={() => !isDeleting && setShowDeleteConfirmation(false)}
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
                    <h3 className="font-bold text-lg text-primary">Delete Account</h3>
                    <p className="text-sm text-secondary">
                      Are you sure you want to delete your account? This action cannot be undone. All your resumes and data will be permanently removed.
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
                      Cancel
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
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Delete Account
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