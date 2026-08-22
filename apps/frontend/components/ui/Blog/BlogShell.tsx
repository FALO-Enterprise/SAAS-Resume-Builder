"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Check, ChevronDown, Link2, ListTree } from "lucide-react";
import { FaLinkedinIn, FaWhatsapp, FaXTwitter } from "react-icons/fa6";

export interface TocEntry {
  id: string;
  title: string;
}

export default function BlogShell({
  entries,
  title,
  children,
}: {
  entries: TocEntry[];
  title: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("blog.article");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      frame.current = null;

      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setProgress(scrollable > 0 ? Math.min(1, doc.scrollTop / scrollable) : 0);
      setShowTop(doc.scrollTop > 600);

      const threshold = 140;
      let current = entries[0]?.id ?? "";

      for (const entry of entries) {
        const el = document.getElementById(entry.id);
        if (el && el.getBoundingClientRect().top <= threshold) {
          current = entry.id;
        }
      }

      if (scrollable > 0 && scrollable - doc.scrollTop < 4) {
        current = entries[entries.length - 1]?.id ?? current;
      }

      setActiveId(current);
    };

    const onScroll = () => {
      if (frame.current === null) {
        frame.current = requestAnimationFrame(measure);
      }
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [entries]);

  const jumpTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    history.replaceState(null, "", `#${id}`);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  }, []);

  const activeIndex = entries.findIndex((e) => e.id === activeId);
  const activeTitle = activeIndex >= 0 ? entries[activeIndex].title : "";

  // Built lazily on click so the component does not need the URL during SSR.
  const shareUrl = () => (typeof window === "undefined" ? "" : window.location.href);
  const shareTargets = [
    {
      key: "x",
      Icon: FaXTwitter,
      href: () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl())}`,
    },
    {
      key: "linkedin",
      Icon: FaLinkedinIn,
      href: () =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`,
    },
    {
      key: "whatsapp",
      Icon: FaWhatsapp,
      href: () =>
        `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl()}`)}`,
    },
  ];

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
        aria-hidden
      >
        <div
          className="h-full bg-linear-to-r from-gold-dark via-gold to-gold-light transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: isRtl ? "right" : "left",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        {/* ── Table of contents ─────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit lg:self-start">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              className="glass flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-edge px-4 py-3 text-start"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <ListTree size={15} className="shrink-0 text-gold" />
                <span className="truncate text-[13px] font-semibold text-primary">
                  {activeTitle || t("onThisPage")}
                </span>
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-muted transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <nav
            aria-label={t("onThisPage")}
            className={`${mobileOpen ? "mt-3 block" : "hidden"} lg:mt-0 lg:block`}
          >
            <p className="mb-4 hidden text-[11px] font-bold uppercase tracking-widest text-faint lg:block">
              {t("onThisPage")}
            </p>

            <ul className="space-y-1 border-s border-edge">
              {entries.map((entry) => {
                const active = entry.id === activeId;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => jumpTo(entry.id)}
                      aria-current={active ? "location" : undefined}
                      className={`-ms-px block w-full cursor-pointer border-s-2 py-1.5 pe-2 ps-4 text-start text-[13px] leading-snug transition-colors ${
                        active
                          ? "border-gold font-semibold text-primary"
                          : "border-transparent text-muted hover:text-secondary"
                      }`}
                    >
                      {entry.title}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* ── Share ─────────────────────────────────────────────────── */}
            <div className="mt-8 border-t border-edge pt-6">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-faint">
                {t("share")}
              </p>
              <div className="flex items-center gap-2">
                {shareTargets.map(({ key, Icon, href }) => (
                  <a
                    key={key}
                    href={href()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-secondary transition-colors hover:border-gold/30 hover:text-gold"
                  >
                    <Icon size={14} />
                  </a>
                ))}

                <button
                  type="button"
                  onClick={copyLink}
                  aria-label={copied ? t("shareCopied") : t("shareCopy")}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-edge text-secondary transition-colors hover:border-gold/30 hover:text-gold"
                >
                  {copied ? (
                    <Check size={14} className="text-gold" />
                  ) : (
                    <Link2 size={14} />
                  )}
                </button>
              </div>
              <p
                role="status"
                aria-live="polite"
                className="mt-2 h-4 text-[11.5px] text-gold"
              >
                {copied ? t("shareCopied") : ""}
              </p>
            </div>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="glass fixed bottom-6 inset-e-6 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-edge text-secondary transition-colors hover:border-gold/30 hover:text-gold"
          aria-label={t("back")}
        >
          <ArrowUp size={17} />
        </button>
      )}
    </>
  );
}
