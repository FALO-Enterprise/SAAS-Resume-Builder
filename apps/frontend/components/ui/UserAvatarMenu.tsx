"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

export default function UserAvatarMenu() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-transparent border border-edge cursor-pointer transition-all delay-200"
      >
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gold text-ink font-bold text-[10px] overflow-hidden shrink-0">
          {getInitials(user?.name)}
        </div>
        <ChevronDown
          size={11}
          className={`text-secondary transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-90"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-[calc(100%+8px)] inset-e-0 bg-elevated border border-edge rounded-xl overflow-hidden min-w-52 z-100 shadow-[0_20px_60px_var(--shadow-color)]"
            >
              <div className="px-4 py-3 border-b border-edge">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-primary">
                    {user?.name}
                  </p>
                  {user?.planName && (
                    <span className="shrink-0 rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-gold">
                      {user.planName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-secondary truncate">
                  {user?.email}
                </p>
              </div>

              <Link
                href={`/${locale}/dashboard`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-secondary hover:bg-card-hover hover:text-primary transition-colors delay-150"
              >
                <LayoutDashboard size={14} />
                {t("dashboard")}
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-pink-light bg-transparent border-none cursor-pointer hover:bg-card-hover transition-colors delay-150"
              >
                <LogOut size={14} />
                {t("logout")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
