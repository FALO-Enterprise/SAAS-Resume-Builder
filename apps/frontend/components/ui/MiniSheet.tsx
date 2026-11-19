import type { TemplateId } from "@/lib/types/resume.types";
import type { SheetCopy } from "@/lib/types/landing.types";

/* A schematic resume, drawn in markup so it stays sharp at any size and
   mirrors itself under `dir="rtl"`. Names, titles and section headings are
   real text; body copy is drawn as bars because the page is showing layout,
   not content. Each template reproduces the structure of the real one in
   `components/resume/templates`. */

type Cut = {
  header: "band" | "left" | "center";
  side: "none" | "dark" | "light";
  accent: string;
  boxes: boolean;
};

const CUTS: Record<TemplateId, Cut> = {
  executive: { header: "band", side: "light", accent: "#0f766e", boxes: false },
  developer: { header: "left", side: "dark", accent: "#b4415b", boxes: false },
  director: { header: "left", side: "none", accent: "#b45309", boxes: true },
  minimal: { header: "center", side: "none", accent: "#1c1830", boxes: false },
  academic: { header: "center", side: "none", accent: "#1e3a8a", boxes: false },
  global: { header: "left", side: "none", accent: "#15803d", boxes: true },
};

function Bars({ widths, tone }: { widths: number[]; tone?: string }) {
  return (
    <span className="flex flex-col gap-[0.42em]" aria-hidden>
      {widths.map((w, i) => (
        <span
          key={i}
          className="lp-bar"
          style={{ width: `${w}%`, background: tone }}
        />
      ))}
    </span>
  );
}

function Heading({
  children,
  accent,
  centered,
}: {
  children: string;
  accent: string;
  centered?: boolean;
}) {
  return (
    <span
      className={`mb-[0.6em] block border-b pb-[0.3em] text-[0.72em] font-semibold uppercase tracking-[0.08em] rtl:tracking-normal ${centered ? "text-center" : ""}`}
      style={{ color: accent, borderColor: `${accent}40` }}
    >
      {children}
    </span>
  );
}

export default function MiniSheet({
  template,
  copy,
  dir,
  className = "",
}: {
  template: TemplateId;
  copy: SheetCopy;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  const cut = CUTS[template];
  const centered = cut.header === "center";

  const role = (title: string, date: string, widths: number[]) => (
    <span className="mb-[0.9em] block">
      <span className="mb-[0.45em] flex items-baseline justify-between gap-2">
        <span className="text-[0.82em] font-semibold">{title}</span>
        <span className="lp-mono shrink-0 text-[0.62em]! opacity-70">
          {date}
        </span>
      </span>
      <Bars widths={widths} />
    </span>
  );

  const main = (
    <span className="block min-w-0 flex-1">
      <span className="mb-[1.1em] block">
        <Heading accent={cut.accent} centered={centered}>
          {copy.summary}
        </Heading>
        <Bars widths={[100, 92, 64]} tone="#8b879c" />
      </span>

      {cut.boxes && (
        <span className="mb-[1.1em] grid grid-cols-3 gap-[0.5em]" aria-hidden>
          {[70, 55, 62].map((w) => (
            <span
              key={w}
              className="block border p-[0.5em]"
              style={{ borderColor: `${cut.accent}40` }}
            >
              <Bars widths={[w, w - 20]} />
            </span>
          ))}
        </span>
      )}

      <span className="mb-[0.2em] block">
        <Heading accent={cut.accent} centered={centered}>
          {copy.experience}
        </Heading>
        {role(copy.role1, copy.date1, [96, 78])}
        {role(copy.role2, copy.date2, [90, 70])}
      </span>

      <span className="mb-[1.1em] block">
        <Heading accent={cut.accent} centered={centered}>
          {copy.projects}
        </Heading>
        <Bars widths={[88, 74, 81, 52]} />
      </span>

      <span className="block">
        <Heading accent={cut.accent} centered={centered}>
          {copy.education}
        </Heading>
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[0.82em] font-semibold">{copy.degree}</span>
          <span className="lp-mono shrink-0 text-[0.62em]! opacity-70">
            {copy.date3}
          </span>
        </span>
      </span>
    </span>
  );

  const sidebar =
    cut.side === "none" ? null : (
      <span
        className="block w-[31%] shrink-0 p-[1em]"
        style={
          cut.side === "dark"
            ? { background: "#1c1830", color: "#ffffff" }
            : { background: `${cut.accent}12` }
        }
      >
        <span
          className="mb-[0.6em] block text-[0.72em] font-semibold uppercase tracking-[0.08em] rtl:tracking-normal"
          style={{ color: cut.side === "dark" ? "#cfc4ff" : cut.accent }}
        >
          {copy.skills}
        </span>
        <span className="flex flex-col gap-[0.5em]">
          {copy.skillList.map((skill) => (
            <span key={skill} className="text-[0.74em] leading-tight">
              {skill}
            </span>
          ))}
        </span>
      </span>
    );

  const nameBlock = (
    <span className={`block ${centered ? "text-center" : ""}`}>
      <span className="block text-[1.5em] font-bold leading-tight tracking-[-0.02em] rtl:tracking-normal">
        {copy.name}
      </span>
      <span className="mt-[0.2em] block text-[0.82em] opacity-75">
        {copy.title}
      </span>
    </span>
  );

  return (
    <span
      dir={dir}
      className={`lp-sheet flex aspect-210/297 w-full flex-col overflow-hidden text-start ${className}`}
    >
      {cut.header === "band" ? (
        <span
          className="block px-[1.6em] py-[1.3em]"
          style={{ background: cut.accent, color: "#ffffff" }}
        >
          {nameBlock}
        </span>
      ) : (
        <span
          className="mx-[1.6em] block border-b-2 pb-[0.9em] pt-[1.6em]"
          style={{ borderColor: cut.accent }}
        >
          {nameBlock}
        </span>
      )}

      <span className="flex min-h-0 flex-1">
        {sidebar}
        <span className="block min-w-0 flex-1 px-[1.6em] py-[1.2em]">
          {cut.side === "none" && (
            <span className="mb-[1.1em] block">
              <Heading accent={cut.accent} centered={centered}>
                {copy.skills}
              </Heading>
              <span className="block text-[0.74em] leading-snug">
                {copy.skillList.join(" · ")}
              </span>
            </span>
          )}
          {main}
        </span>
      </span>
    </span>
  );
}
