export const HELP_CATEGORY_IDS = [
  "getting-started",
  "building",
  "templates-export",
  "billing",
  "account",
  "troubleshooting",
] as const;

export type HelpCategoryId = (typeof HELP_CATEGORY_IDS)[number];

/** lucide-react icon names, resolved by the renderer. */
export type HelpIcon = "rocket" | "pen" | "layout" | "card" | "user" | "wrench";

export interface HelpCategory {
  id: HelpCategoryId;
  title: string;
  description: string;
  icon: HelpIcon;
}

export interface HelpFaq {
  id: string;
  category: HelpCategoryId;
  question: string;
  answer: string;
}

export interface HelpTopic {
  value: string;
  label: string;
}
