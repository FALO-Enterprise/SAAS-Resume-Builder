"use client";

import { useState } from "react";
import type { TemplateId } from "@/lib/types/resume.types";
import type {
  AnswerSlip,
  SheetCopy,
  TemplateName,
} from "@/lib/types/landing.types";
import MiniSheet from "@/components/ui/MiniSheet";


const ROWS = 7;
const VIEW_H = 700;
const VIEW_W = 80;

const stitches = Array.from({ length: ROWS }, (_, i) => {
  const from = (VIEW_H * (i + 0.5)) / ROWS;
  const to = VIEW_H * 0.22 + (i * VIEW_H * 0.56) / (ROWS - 1);
  const mid = VIEW_W / 2;
  return `M0 ${from} C ${mid} ${from}, ${mid} ${to}, ${VIEW_W} ${to}`;
});

/* One icon per template, drawn from the structure that sets it apart:
   a filled header band, a full-height dark sidebar, a row of boxes, a centred
   heading, centred section headings, or a corner tag. */
function Glyph({ id }: { id: TemplateId }) {
  const line = "block h-px bg-current";
  const body = (
    <span className="flex flex-1 flex-col justify-evenly">
      <span className={line} />
      <span className={line} />
      <span className={`${line} w-2/3`} />
    </span>
  );
  const frame =
    "flex h-7.5 w-5.5 border border-current p-0.5";

  switch (id) {
    case "executive":
      return (
        <span aria-hidden className={`${frame} flex-col gap-0.5`}>
          <span className="block h-1.5 bg-current" />
          {body}
        </span>
      );
    case "developer":
      return (
        <span aria-hidden className={`${frame} gap-0.5`}>
          <span className="block w-1.5 bg-current" />
          {body}
        </span>
      );
    case "director":
      return (
        <span aria-hidden className={`${frame} flex-col gap-0.5`}>
          <span className={`${line} w-2/3`} />
          <span className="flex h-1.75 gap-0.5">
            <span className="flex-1 border border-current" />
            <span className="flex-1 border border-current" />
            <span className="flex-1 border border-current" />
          </span>
          {body}
        </span>
      );
    case "minimal":
      return (
        <span aria-hidden className={`${frame} flex-col gap-0.5`}>
          <span className={`${line} mx-auto w-1/2`} />
          {body}
        </span>
      );
    case "academic":
      return (
        <span aria-hidden className={`${frame} flex-col justify-evenly`}>
          <span className={`${line} mx-auto w-1/2`} />
          <span className={`${line} mx-auto w-1/3`} />
          <span className={line} />
          <span className={`${line} mx-auto w-1/3`} />
          <span className={line} />
        </span>
      );
    case "global":
      return (
        <span aria-hidden className={`${frame} flex-col gap-0.5`}>
          <span className="flex items-center justify-between">
            <span className={`${line} w-1/2`} />
            <span className="block size-1.25 bg-current" />
          </span>
          {body}
        </span>
      );
  }
}

export default function HeroDiagram({
  slips,
  templateSlipLabel,
  templates,
  sheet,
  specs,
  switcherLabel,
  templateNowLabel,
  sampleLabel,
}: {
  slips: AnswerSlip[];
  templateSlipLabel: string;
  templates: TemplateName[];
  sheet: SheetCopy;
  specs: string[];
  switcherLabel: string;
  templateNowLabel: string;
  sampleLabel: string;
}) {
  const [active, setActive] = useState<TemplateId>("minimal");
  const current = templates.find((t) => t.id === active) ?? templates[0];
  const allSlips = [
    ...slips,
    { label: templateSlipLabel, value: current.title },
  ];

  return (
    <div className="mx-auto w-full max-w-155">
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,200px)_64px_minmax(0,1fr)]">
        {/* Seven answers: an even grid on small screens, a column beside the
            sheet on large ones. */}
        <ol className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-0">
          {allSlips.map((slip, i) => {
            const last = i === allSlips.length - 1;
            return (
              <li
                key={slip.label}
                className={`flex lg:flex-1 lg:items-center ${last ? "col-span-2" : ""}`}
              >
                <span
                  className={`lp-sheet block w-full px-3 py-2 ${last ? "outline outline-2 -outline-offset-2 outline-[#6e5bc4]" : ""}`}
                >
                  <span className="lp-mono block text-[10px]! text-[#6d6a80]">
                    {i + 1} · {slip.label}
                  </span>
                  <span className="block text-[13px] font-semibold leading-snug">
                    {slip.value}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {/* Small screens: one thread drops from the answers into the sheet. */}
        <span
          aria-hidden
          className="mx-auto block h-8 border-s-[1.5px] border-dashed border-lp-ink lg:hidden"
        />

        {/* Large screens: seven stitches gather into the sheet's edge. */}
        <svg
          aria-hidden
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="lp-sew hidden h-full w-full text-lp-ink lg:block rtl:-scale-x-100"
        >
          {stitches.map((d, i) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              vectorEffect="non-scaling-stroke"
              opacity={i === ROWS - 1 ? 1 : 0.55}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </svg>

        {/* The sheet */}
        <div className="relative mx-auto w-full max-w-85 lg:max-w-none">
          <div
            key={active}
            className="lp-cut-in text-[10px] sm:text-[11px] lg:text-[12px]"
          >
            <MiniSheet template={active} copy={sheet} />
          </div>
          <span className="lp-label absolute inset-e-2 top-2 bg-[#1c1830] px-1.5 py-0.5 text-[11px]! text-white">
            {sampleLabel}
          </span>
        </div>
      </div>

      {/* Measurements and the template switcher share the sheet's width. */}
      <div className="mx-auto mt-4 max-w-85 lg:ms-66 lg:max-w-none">
        <div className="lp-ruler" aria-hidden />
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {specs.map((spec) => (
            <li key={spec} className="lp-mono text-[10px]! text-lp-ink">
              {spec}
            </li>
          ))}
        </ul>

        <div
          role="group"
          aria-label={switcherLabel}
          className="mt-4 flex flex-wrap gap-1.5"
        >
          {templates.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                aria-label={t.title}
                title={t.title}
                onClick={() => setActive(t.id)}
                className={`flex h-12 w-11 cursor-pointer items-center justify-center transition-colors duration-200 ${
                  on
                    ? "bg-lp-tag text-lp-on-tag"
                    : "bg-lp-card text-lp-ink hover:bg-lp-soft"
                }`}
              >
                <Glyph id={t.id} />
              </button>
            );
          })}
        </div>
        <p className="lp-label mt-2 text-lp-ink" aria-live="polite">
          {templateNowLabel}: <span className="font-bold">{current.title}</span>
        </p>
      </div>
    </div>
  );
}
