import type {
  AboutStatId,
  AboutValueMeta,
} from "@/lib/types/about.types";

export const statIds: AboutStatId[] = [
  "templates",
  "regions",
  "languages",
  "reply",
];


export const values: AboutValueMeta[] = [
  {
    id: "honesty",
    icon: "shield-check",
    accent: { wrap: "border-accent/20 bg-accent/10", icon: "text-accent" },
  },
  {
    id: "ats",
    icon: "scan-line",
    accent: {
      wrap: "border-accent/20 bg-accent/10",
      icon: "text-accent",
    },
  },
  {
    id: "relevance",
    icon: "scissors",
    accent: {
      wrap: "border-pass/20 bg-pass/10",
      icon: "text-pass",
    },
  },
  {
    id: "cultural",
    icon: "globe",
    accent: { wrap: "border-accent/20 bg-accent/10", icon: "text-accent" },
  },
  {
    id: "privacy",
    icon: "lock",
    accent: { wrap: "border-flag/20 bg-flag/10", icon: "text-flag" },
  },
];

/** Regional standards the templates are built against. */
export const regionIds = [
  "north-america",
  "europe",
  "gulf",
  "asia-pacific",
  "academic",
] as const;
