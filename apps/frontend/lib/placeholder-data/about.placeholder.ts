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
    accent: { wrap: "border-gold/20 bg-gold/10", icon: "text-gold" },
  },
  {
    id: "ats",
    icon: "scan-line",
    accent: {
      wrap: "border-azure-light/20 bg-azure-light/10",
      icon: "text-azure-light",
    },
  },
  {
    id: "relevance",
    icon: "scissors",
    accent: {
      wrap: "border-teal-light/20 bg-teal-light/10",
      icon: "text-teal-light",
    },
  },
  {
    id: "cultural",
    icon: "globe",
    accent: { wrap: "border-vilot/20 bg-vilot/10", icon: "text-vilot" },
  },
  {
    id: "privacy",
    icon: "lock",
    accent: { wrap: "border-pink/20 bg-pink/10", icon: "text-pink" },
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
