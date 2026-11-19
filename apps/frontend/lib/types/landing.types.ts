import type { TemplateId } from "@/lib/types/resume.types";

/** The specimen content drawn on a schematic resume sheet. */
export type SheetCopy = {
  name: string;
  title: string;
  summary: string;
  experience: string;
  education: string;
  projects: string;
  skills: string;
  skillList: string[];
  role1: string;
  role2: string;
  degree: string;
  date1: string;
  date2: string;
  date3: string;
};

export type AnswerSlip = { label: string; value: string };

export type TemplateName = { id: TemplateId; title: string; field: string };

export type ParsedLine = { text: string; flag?: "a" | "b" | "c" };

export type Finding = { key: "a" | "b" | "c"; title: string; desc: string };

export type Refusal = { title: string; desc: string; refused: string };

export type EvidenceItem = {
  finding: string;
  statement: string;
  provenance: string;
  href: string;
  linkLabel: string;
};

export type FooterColumn = {
  title: string;
  links: { label: string; route: string }[];
};
