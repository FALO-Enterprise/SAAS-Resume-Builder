"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
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
        className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-full bg-transparent border border-edge cursor-pointer transition-all delay-200"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gold text-ink font-bold text-xs overflow-hidden shrink-0">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
              className="h-full w-full object-cover"
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
                <p className="text-sm font-semibold text-primary truncate">
                  {user?.name}
                </p>
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
