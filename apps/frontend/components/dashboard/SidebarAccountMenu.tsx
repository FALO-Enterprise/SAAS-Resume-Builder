"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronsUpDown,
  Laptop,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useIsClient } from "@/hooks/useIsClient";
import SettingsModal from "@/components/ui/SettingsModal";
import { getAvatarUrl, isUploadedAvatar } from "@/lib/utilities/avatar";
import { getInitials } from "@/lib/utilities/getName";
import { PLAN_BADGES } from "@/lib/placeholder-data/plans.placeholder";

/* The panel is portalled to <body> because the dashboard shell is
   `overflow-hidden` and the sidebar carries a `translate-x` (which makes it a
   containing block) — either one alone would clip a panel positioned inside it. */
const DESKTOP_QUERY = "(min-width: 1024px)";
const DESKTOP_WIDTH = 288;
const GAP = 8;
const EDGE = 12;

type PanelCoords = { left: number; bottom: number; width: number; maxHeight: number };

export default function SidebarAccountMenu() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const tGeneral = useTranslations("settings.general");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isRTL = locale === "ar";

  const { user, logout, isVerified } = useAuth();
  const { themeMode, setTheme, mounted } = useTheme();

  const [open, setOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const portalReady = useIsClient();

  const rowRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const triggerId = useId();

  const planId = (user?.planName ?? "FREE") as "FREE" | "PRO" | "ENTERPRISE";
  const planLabel: Record<typeof planId, string> = {
    FREE: t("plans.free"),
    PRO: t("plans.pro"),
    ENTERPRISE: t("plans.enterprise"),
  };
  // Enterprise is the top tier — there is nothing to upgrade to, so the CTA is hidden.
  const isEnterprise = planId === "ENTERPRISE";
  const badgeKey = planId.toLowerCase() as keyof typeof PLAN_BADGES;
  const verifyHref = `/${locale}/verificationcode${user?.email ? `?email=${encodeURIComponent(user.email)}` : ""}`;

  /* --- Placement ---
     Desktop: beside the sidebar, bottom-aligned with the row, so the panel never
     covers the step list. Mobile: straight up from the row at the row's own
     width, because the drawer leaves no room to either side. */
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const row = rowRef.current;
    if (!trigger || !row) return;

    const triggerRect = trigger.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (window.matchMedia(DESKTOP_QUERY).matches) {
      const raw = isRTL ? rowRect.left - GAP - DESKTOP_WIDTH : rowRect.right + GAP;
      const bottom = Math.max(EDGE, vh - triggerRect.bottom);
      setCoords({
        left: Math.min(Math.max(EDGE, raw), vw - DESKTOP_WIDTH - EDGE),
        bottom,
        width: DESKTOP_WIDTH,
        maxHeight: vh - bottom - EDGE,
      });
      return;
    }

    const bottom = vh - triggerRect.top + GAP;
    setCoords({
      left: triggerRect.left,
      bottom,
      width: triggerRect.width,
      maxHeight: vh - bottom - EDGE,
    });
  }, [isRTL]);

  const closeMenu = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onViewportChange = () => updatePosition();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updatePosition]);

  const hasCoords = coords !== null;

  /* Opening lands focus on the first item — the APG menu-button behaviour.
     Mouse users never see it, because items only ring on :focus-visible. */
  useEffect(() => {
    if (!open || !hasCoords) return;
    panelRef.current?.querySelector<HTMLElement>("[data-menu-item]")?.focus();
  }, [open, hasCoords]);

  const menuItems = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]") ?? []);

  const focusAt = (index: number) => {
    const items = menuItems();
    if (!items.length) return;
    items[((index % items.length) + items.length) % items.length].focus();
  };

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    const items = menuItems();
    const current = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu(false);
        break;
    }
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (open) focusAt(event.key === "ArrowDown" ? 0 : -1);
    else setOpen(true);
  };

  const switchLanguage = (next: string) => {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    closeMenu(false);
    router.push(segments.join("/"));
  };

  if (!user) return null;

  const renderAvatar = (size: number, initialsClass: string) =>
    user.avatar ? (
      <Image
        src={getAvatarUrl(user.avatar)}
        alt={user.name || t("yourAccount")}
        width={size}
        height={size}
        key={user.avatar}
        className="h-full w-full rounded-full object-cover"
        unoptimized={isUploadedAvatar(user.avatar)}
      />
    ) : (
      <span className={initialsClass}>{getInitials(user.name)}</span>
    );

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-start text-[13px] text-secondary transition-colors hover:bg-card-hover hover:text-primary focus-visible:bg-card-hover focus-visible:text-primary focus-visible:outline-none";

  const segmentClass = (active: boolean) =>
    `flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold ${
      active
        ? "border-gold/25 bg-gold/12 text-gold"
        : "border-transparent text-secondary hover:bg-card-hover hover:text-primary"
    }`;

  const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: tGeneral("light"), icon: Sun },
    { id: "dark", label: tGeneral("dark"), icon: Moon },
    { id: "system", label: tGeneral("system"), icon: Laptop },
  ];

  const languageOptions = [
    { id: "en", label: "English" },
    { id: "ar", label: "العربية" },
  ];

  return (
    <>
      <div ref={rowRef} className="px-4 py-4">
        {/* The upgrade CTA keeps a row of its own: nesting a link inside the menu
            button would be invalid markup, and burying it costs conversions. */}
        {!isEnterprise && (
          <Link
            href={`/${locale}/pricing`}
            className="group mb-1.5 flex items-center gap-2.5 rounded-xl border border-gold/12 bg-gold/6 px-2.5 py-2 text-[12px] font-semibold text-gold transition-colors hover:bg-gold/12"
          >
            <Sparkles size={14} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {planId === "FREE" ? t("account.upgradeToPro") : t("managePlan")}
            </span>
            <ArrowRight
              size={13}
              className={`shrink-0 transition-transform ${
                isRTL ? "-rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
              }`}
            />
          </Link>
        )}

        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          onClick={() => (open ? closeMenu() : setOpen(true))}
          onKeyDown={onTriggerKeyDown}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold ${
            open ? "bg-card-hover" : "hover:bg-card-hover"
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold text-ink">
            {renderAvatar(40, "text-[12px] font-bold")}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-primary">
              {user.name || t("yourAccount")}
            </span>
            <span
              className={`block truncate text-[11px] ${
                planId === "FREE"
                  ? "text-muted"
                  : planId === "PRO"
                    ? "text-gold"
                    : "text-violet-300"
              }`}
            >
              {planLabel[planId]}
            </span>
          </span>

          {!isVerified && (
            <span
              aria-hidden
              className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-pink-light text-ink"
            >
              <TriangleAlert size={10} />
            </span>
          )}

          {/* Chevrons, not a kebab: the whole row is the trigger, so this reads as
              a disclosure cue rather than an overflow cue. Stacked arrows also stay
              honest whether the panel opens sideways or upward, and — unlike a
              single chevron — need no mirroring in RTL. */}
          <ChevronsUpDown
            size={14}
            aria-hidden
            className={`shrink-0 transition-colors ${open ? "text-secondary" : "text-muted"}`}
          />
        </button>
      </div>

      {portalReady &&
        createPortal(
          <AnimatePresence>
            {open && coords && (
              <>
                <div className="fixed inset-0 z-90" onClick={() => closeMenu(false)} />
                <motion.div
                  ref={panelRef}
                  id={menuId}
                  role="menu"
                  aria-labelledby={triggerId}
                  onKeyDown={onPanelKeyDown}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "fixed",
                    left: coords.left,
                    bottom: coords.bottom,
                    width: coords.width,
                    maxHeight: coords.maxHeight,
                  }}
                  className="z-100 overflow-y-auto overscroll-contain rounded-xl border border-edge bg-elevated shadow-[0_20px_60px_var(--shadow-color)]"
                >
                  {!isVerified && (
                    <div className="border-b border-edge bg-pink-light/10 px-4 py-3">
                      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-secondary">
                        <TriangleAlert size={13} className="mt-0.5 shrink-0 text-pink-light" />
                        <span>
                          {t("account.unverifiedBody")}{" "}
                          <Link
                            href={verifyHref}
                            data-menu-item
                            role="menuitem"
                            tabIndex={-1}
                            onClick={() => closeMenu(false)}
                            className="font-semibold text-pink-light underline underline-offset-2 hover:text-pink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pink-light"
                          >
                            {t("account.verifyNow")}
                          </Link>
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Identity first — a panel that floats away from its trigger has to
                      restate whose account it is about to act on. */}
                  <div className="flex items-start gap-3 border-b border-edge px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold text-ink">
                      {renderAvatar(36, "text-[11px] font-bold")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-primary">{user.name}</p>
                      <p className="truncate text-[11px] text-secondary">{user.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.75 text-[9px] font-semibold uppercase tracking-[0.16em] ${PLAN_BADGES[badgeKey]}`}
                    >
                      {badgeKey}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      data-menu-item
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => {
                        closeMenu(false);
                        setIsSettingsOpen(true);
                      }}
                      className={itemClass}
                    >
                      <Settings size={15} className="shrink-0" />
                      {tNav("settings")}
                    </button>
                  </div>

                  {/* Theme and language stay one click away now that the top bar is
                      gone; the full set still lives in Settings → General. */}
                  <div className="border-t border-edge px-4 py-3">
                    <p
                      aria-hidden
                      className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {tGeneral("themeLabel")}
                    </p>
                    <div role="group" aria-label={tGeneral("themeLabel")} className="flex gap-1">
                      {themeOptions.map(({ id, label, icon: Icon }) => {
                        const active = mounted && themeMode === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            data-menu-item
                            role="menuitemradio"
                            aria-checked={active}
                            tabIndex={-1}
                            onClick={() => setTheme(id)}
                            className={segmentClass(active)}
                          >
                            <Icon size={13} className="shrink-0" />
                            <span className="truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <p
                      aria-hidden
                      className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {tGeneral("languageLabel")}
                    </p>
                    <div role="group" aria-label={tGeneral("languageLabel")} className="flex gap-1">
                      {languageOptions.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          data-menu-item
                          role="menuitemradio"
                          aria-checked={locale === id}
                          tabIndex={-1}
                          onClick={() => switchLanguage(id)}
                          className={segmentClass(locale === id)}
                        >
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-edge py-1">
                    <button
                      type="button"
                      data-menu-item
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className={`${itemClass} text-pink-light hover:text-pink focus-visible:text-pink`}
                    >
                      <LogOut size={15} className="shrink-0" />
                      {tNav("logout")}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          triggerRef.current?.focus();
        }}
      />
    </>
  );
}
