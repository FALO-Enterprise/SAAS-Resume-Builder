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
    image: "https://i.imgur.com/rRxV8Hd.png",
    category: "professional",
    icon: Briefcase,
    accent: "from-gold/20 via-card-hover to-base",
  },
  {
    id: "developer",
    image: "https://i.imgur.com/HBnebfO.png",
    category: "technical",
    icon: Code2,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "director",
    image: "https://i.imgur.com/LsACkI5.png",
    category: "creative",
    icon: Palette,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "minimal",
    image: "https://i.imgur.com/1uo6LFk.png",
    category: "minimalist",
    icon: Sparkles,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "academic",
    image: "https://i.imgur.com/9l6qHeu.png",
    category: "professional",
    icon: GraduationCap,
    accent: "from-gold/15 via-card-hover to-base",
  },
  {
    id: "global",
    image: "https://i.imgur.com/gkXpopV.png",
    category: "technical",
    icon: Languages,
    accent: "from-gold/15 via-card-hover to-base",
  },
];

export const qualityItems = [
  { key: "ats", icon: ShieldCheck },
  { key: "global", icon: Globe2 },
  { key: "rtl", icon: CheckCircle2 },
  { key: "support", icon: Sparkles },
] as const;
