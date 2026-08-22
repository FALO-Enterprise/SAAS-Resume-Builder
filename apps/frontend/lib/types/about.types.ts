export type AboutBlock =
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string; attribution?: string };

export interface AboutChapter {
  /** Stable anchor slug; the section nav deep-links to these. */
  id: string;
  title: string;
  blocks: AboutBlock[];
}


export const ABOUT_STAT_IDS = [
  "templates",
  "regions",
  "languages",
  "reply",
] as const;

export type AboutStatId = (typeof ABOUT_STAT_IDS)[number];

export interface AboutStat {
  value: string;
  label: string;
}

export const ABOUT_VALUE_IDS = [
  "honesty",
  "ats",
  "relevance",
  "cultural",
  "privacy",
] as const;

export type AboutValueId = (typeof ABOUT_VALUE_IDS)[number];

/** Authored under `about.values.<id>`. */
export interface AboutValue {
  title: string;
  description: string;
}

/** lucide-react icon names, resolved by the renderer. */
export type AboutIcon =
  | "shield-check"
  | "scan-line"
  | "scissors"
  | "globe"
  | "lock";

export interface AboutValueMeta {
  id: AboutValueId;
  icon: AboutIcon;
  accent: { wrap: string; icon: string };
}

export interface AboutRegion {
  id: string;
  label: string;
  note: string;
}

export interface AboutFact {
  label: string;
  value: string;
  ltr?: boolean;
}
