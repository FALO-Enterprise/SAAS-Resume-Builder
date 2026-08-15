"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LayoutDashboard,
  LogOut,
  ChevronDown,
  TriangleAlert,
  User as UserIcon,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAvatarUrl, isUploadedAvatar } from "@/lib/utilities/avatar";
import ProfileModal from "./ProfileModal";
import SettingsModal from "./SettingsModal";

const PLAN_BADGES = {
  free: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  pro: "border-gold/20 bg-gold/10 text-gold",
  enterprise: "border-violet-500/20 bg-violet-500/10 text-violet-300",
} as const;

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

export default function UserAvatarMenu() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { user, logout, isVerified } = useAuth();

  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!user) return null;

  const activePlanId = (user?.planName?.toLowerCase() || "free") as keyof typeof PLAN_BADGES;
  const verifyHref = `/${locale}/verificationcode${user?.email ? `?email=${encodeURIComponent(user.email)}` : ''}`;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-transparent border border-edge cursor-pointer transition-all delay-200"
        >
          {!isVerified ? (
            <div className="group absolute -left-1/8 -top-1/3 z-10">
              <div
                onClick={(e) => { e.stopPropagation(); }}
                aria-label="Account not verified"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-light text-ink font-bold text-[10px] overflow-hidden shrink-0 animate-pulse"
              >
                <TriangleAlert size={12} />
              </div>
            </div>
          ) : null}


          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gold text-ink font-bold text-[10px] overflow-hidden shrink-0">
            {user?.avatar ? (
              <Image
                src={getAvatarUrl(user.avatar)}
                alt={user?.name || "User Avatar"}
                width={24}
                height={24}
                key={user.avatar}
                className="h-full w-full object-cover"
                unoptimized={isUploadedAvatar(user.avatar)}
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>

          <ChevronDown
            size={11}
            className={`text-secondary transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-90" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+8px)] inset-e-0 bg-elevated border border-edge rounded-xl overflow-hidden min-w-52 z-100 shadow-[0_20px_60px_var(--shadow-color)]"
              >
                {!isVerified && (
                  <div className="border-b border-edge bg-pink-light/10 px-4 py-3">
                    <p className="flex items-start gap-2 text-xs text-secondary">
                      <TriangleAlert size={14} className="mt-0.5 shrink-0 text-pink-light" />
                      <span>
                        Your account is not verified yet. Verify your account{' '}
                        <Link
                          href={verifyHref}
                          onClick={() => setOpen(false)}
                          className="font-semibold text-pink-light underline underline-offset-2 hover:text-pink"
                        >
                          here
                        </Link>
                        .
                      </span>
                    </p>
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-edge">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-secondary truncate">
                      {user?.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${PLAN_BADGES[activePlanId]}`}
                  >
                    {activePlanId}
                  </span>
                </div>

                {/* Profile */}
                <button
                  onClick={() => {
                    setOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-secondary hover:bg-card-hover hover:text-primary transition-colors cursor-pointer"
                >
                  <UserIcon size={14} />
                  {t("profile")}
                </button>

                {/* Settings */}
                <button
                  onClick={() => {
                    setOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-secondary hover:bg-card-hover hover:text-primary transition-colors cursor-pointer"
                >
                  <Settings size={14} />
                  {t("settings")}
                </button>

                {/* Dashboard */}
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary hover:bg-card-hover hover:text-primary transition-colors delay-150"
                >
                  <LayoutDashboard size={14} />
                  {t("dashboard")}
                </Link>

                {/* Logout */}
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-pink-light bg-transparent border-none cursor-pointer hover:bg-card-hover transition-colors delay-150"
                >
                  <LogOut size={14} />
                  {t("logout")}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Independent Popups */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
