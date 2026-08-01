
import type { LucideIcon } from "lucide-react";

export type FilterKey =
  | "all"
  | "professional"
  | "creative"
  | "technical"
  | "minimalist";

export type TemplateId =
  | "executive"
  | "developer"
  | "director"
  | "minimal"
  | "academic"
  | "global";

export type TemplateCard = {
  id: TemplateId;
  image: string;
  category: Exclude<FilterKey, "all">;
  icon: LucideIcon;
  accent: string;
};
