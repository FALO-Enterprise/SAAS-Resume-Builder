export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "definitions"; items: { term: string; text: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | {
      type: "callout";
      tone: "gold" | "azure" | "teal" | "pink";
      title: string;
      text: string;
    };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalKeyPoint {
  icon:
    | "shield"
    | "lock"
    | "eye-off"
    | "trash"
    | "sparkles"
    | "credit-card"
    | "scale"
    | "file-check";
  title: string;
  description: string;
}

export interface LegalDocument {
  eyebrow: string;
  title: string;
  description: string;
  keyPoints: LegalKeyPoint[];
  sections: LegalSection[];
}

export type LegalSlug = "privacy" | "terms";
