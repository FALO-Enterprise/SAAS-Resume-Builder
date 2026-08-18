"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { templates } from "@/lib/placeholder-data/templates.placeholder";

const TILES_PER_HALF = 9;

const ROWS = [
  { speed: "52s", opacity: 0.5, offset: 0, rotate: 0 },
  { speed: "68s", opacity: 0.42, offset: -0.36, rotate: 2 },
  { speed: "44s", opacity: 0.26, offset: -0.72, rotate: 4 },
  { speed: "60s", opacity: 0.26, offset: -0.18, rotate: 1 },
  { speed: "48s", opacity: 0.42, offset: -0.54, rotate: 3 },
  { speed: "74s", opacity: 0.5, offset: -0.9, rotate: 5 },
];

function rowTiles(rotate: number) {
  return Array.from(
    { length: TILES_PER_HALF },
    (_, index) => templates[(index + rotate) % templates.length],
  );
}

export default function HeroGridBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rootRef.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        element.dataset.paused = entry?.isIntersecting ? "false" : "true";
      },
      {
        threshold: 0,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-paused="false"
      className="pointer-events-none absolute inset-0 overflow-hidden [--deck-w:calc((100vw+100vh)*0.7072)] [--tile-w:max(104px,calc(var(--deck-w)/8.5))] [--tile-gap:calc(var(--tile-w)/9)] [--drift-sign:1] rtl:[--drift-sign:-1]"
    >
      <div className="absolute inset-0 bg-linear-to-br from-ink via-soft to-ink" />

      <div className="hero-wall-mask absolute inset-0 overflow-hidden [-webkit-mask-composite:source-in] mask-intersect">
        <div className="absolute left-1/2 top-1/2 flex w-(--deck-w) -translate-x-1/2 -translate-y-1/2 -rotate-45 flex-col gap-(--tile-gap) rtl:rotate-45">
          {ROWS.map((row, rowIndex) => {
            const tiles = rowTiles(row.rotate);

            return (
              <div
                key={rowIndex}
                data-paused={false}
                className="flex w-max shrink-0 gap-(--tile-gap) opacity-(--row-opacity) animate-hero-wall-drift [animation-duration:var(--row-speed)] [animation-timing-function:linear] [animation-iteration-count:infinite] motion-reduce:animate-none data-[paused=true]:[animation-play-state:paused]"
                style={
                  {
                    marginInlineStart: `calc(var(--tile-w) * ${row.offset})`,
                    "--row-speed": row.speed,
                    "--row-opacity": row.opacity,
                  } as React.CSSProperties
                }
              >
                {[...tiles, ...tiles].map((template, index) => (
                  <div
                    key={`${template.id}-${index}`}
                    className="relative aspect-210/297 w-(--tile-w) shrink-0 overflow-hidden rounded-xl border border-edge bg-elevated shadow-[0_18px_44px_-22px_var(--shadow-color)]"
                  >
                    <Image
                      src={template.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 104px, 140px"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover object-top saturate-[0.85] brightness-[0.92]"
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-0 bg-base opacity-[0.34]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_46%_at_50%_42%,var(--bg-base)_0%,var(--bg-base)_34%,transparent_78%),linear-gradient(to_bottom,var(--bg-base)_0%,transparent_20%),linear-gradient(to_top,var(--bg-base)_0%,transparent_16%)] opacity-[0.88]" />

      <div
        data-paused={false}
        className="absolute inset-x-[6%] -bottom-22.5 h-70 bg-[radial-gradient(ellipse_55%_60%_at_50%_60%,rgba(245,166,35,0.2),transparent_72%)] blur-[30px] opacity-[0.7] animate-hero-bloom-pulse [animation-duration:7s] [animation-timing-function:ease-in-out] [animation-iteration-count:infinite] motion-reduce:animate-none data-[paused=true]:[animation-play-state:paused]"
      />

      <div className="absolute inset-s-1/4 top-16 h-80 w-80 rounded-full bg-gold/10 blur-[110px]" />
      <div className="absolute bottom-24 inset-e-1/4 h-80 w-80 rounded-full bg-azure/10 blur-[110px]" />
      <div className="absolute left-1/2 top-1/2 h-105 w-105 -translate-x-1/2 -translate-y-1/2 rounded-full bg-vilot/5 blur-[120px]" />
    </div>
  );
}
