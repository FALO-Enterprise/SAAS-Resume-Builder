"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, ListTree, ChevronDown } from "lucide-react";

export interface TocEntry {
  id: string;
  title: string;
}

/**
 * Interactive chrome around a legal document: reading-progress bar, sticky
 * table of contents with scroll-spy, and a back-to-top control.
 *
 * The document itself arrives as `children` already rendered on the server, so
 * only the navigation state lives on the client.
 */
export default function LegalShell({
  entries,
  children,
}: {
  entries: TocEntry[];
  children: React.ReactNode;
}) {
  const t = useTranslations("legal");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    // A scroll listener rather than IntersectionObserver: the active entry has
    // to stay correct when a short final section can never fill the viewport,
    // and when the reader lands mid-document from a deep link. Picking the last
    // heading above a fixed offset handles both without special cases.
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

      // At the very bottom the last section may never cross the threshold, so
      // resolve it explicitly or the final entry can never highlight.
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
    // `scroll-mt` on the section handles the offset, so the default anchor
    // behaviour lands in the right place.
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    history.replaceState(null, "", `#${id}`);
  }, []);

  const activeIndex = entries.findIndex((e) => e.id === activeId);
  const activeTitle = activeIndex >= 0 ? entries[activeIndex].title : "";

  return (
    <>
      {/* Reading progress. scaleX does not mirror itself in RTL, so the origin
          is flipped explicitly — otherwise the bar fills away from the start. */}
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

      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-24 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
        {/* ── Table of contents ─────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit lg:self-start">
          {/* Mobile: collapsed into a disclosure so it never buries the content */}
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
                size={15}
                className={`shrink-0 text-faint transition-transform duration-200 ${
                  mobileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileOpen && (
              <nav
                aria-label={t("onThisPage")}
                className="glass mt-2 max-h-80 overflow-y-auto rounded-xl border border-edge p-2"
              >
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => jumpTo(entry.id)}
                    className={`block w-full cursor-pointer rounded-lg px-3 py-2 text-start text-[13px] transition-colors ${
                      entry.id === activeId
                        ? "bg-gold/10 font-semibold text-gold"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {entry.title}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Desktop: persistent left rail, per NN/g's guidance that policy
              navigation belongs in a rail rather than inline at the top. */}
          <nav
            aria-label={t("onThisPage")}
            className="hidden lg:block max-h-[calc(100vh-8rem)] overflow-y-auto"
          >
            <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-faint">
              {t("onThisPage")}
            </p>
            <ul className="space-y-0.5 border-s border-edge">
              {entries.map((entry) => {
                const active = entry.id === activeId;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => jumpTo(entry.id)}
                      aria-current={active ? "true" : undefined}
                      className={`-ms-px block w-full cursor-pointer border-s-2 py-1.5 pe-2 ps-4 text-start text-[13px] leading-snug transition-all ${
                        active
                          ? "border-gold font-semibold text-gold"
                          : "border-transparent text-secondary hover:border-edge-strong hover:text-primary"
                      }`}
                    >
                      {entry.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* ── Document ──────────────────────────────────────────────────── */}
        <div className="min-w-0">{children}</div>
      </div>

      {/* Back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0 })}
        aria-label={t("backToTop")}
        className={`glass fixed bottom-6 inset-e-6 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-edge text-secondary transition-all hover:border-gold/40 hover:text-gold ${
          showTop
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <ArrowUp size={17} />
      </button>
    </>
  );
}
