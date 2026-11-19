import {
  Briefcase,
  CheckCircle2,
  Code2,
  Globe2,
  GraduationCap,
  Languages,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FilterKey, TemplateCard } from "@/lib/types/resume.types";

export const filters: FilterKey[] = [
  "all",
  "professional",
  "creative",
  "technical",
  "minimalist",
];

export const templates: TemplateCard[] = [
  {
    id: "executive",
    image: "https://i.imgur.com/ptI7HFp.png",
    category: "professional",
    icon: Briefcase,
  },
  {
    id: "developer",
    image: "https://i.imgur.com/D91CvTh.png",
    category: "technical",
    icon: Code2,
  },
  {
    id: "director",
    image: "https://i.imgur.com/PWtfFl4.png",
    category: "creative",
    icon: Palette,
  },
  {
    id: "minimal",
    image: "https://i.imgur.com/glF9QYl.png",
    category: "minimalist",
    icon: Sparkles,
  },
  {
    id: "academic",
    image: "https://i.imgur.com/E6LVnlU.png",
    category: "professional",
    icon: GraduationCap,
  },
  {
    id: "global",
    image: "https://i.imgur.com/WUJ3Hwx.png",
    category: "technical",
    icon: Languages,
  },
];

export const qualityItems = [
  { key: "ats", icon: ShieldCheck },
  { key: "global", icon: Globe2 },
  { key: "rtl", icon: CheckCircle2 },
  { key: "support", icon: Sparkles },
] as const;
