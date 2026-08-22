import Image from "next/image";
import {
  LayoutTemplate,
  MessagesSquare,
  ScanLine,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { BlogIcon } from "@/lib/types/blog.types";

const COVER_ICONS: Record<BlogIcon, typeof Target> = {
  target: Target,
  "scan-line": ScanLine,
  "layout-template": LayoutTemplate,
  "messages-square": MessagesSquare,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
};

export default function BlogCover({
  icon,
  accent,
  image,
  title,
  size = "card",
}: {
  icon: BlogIcon;
  accent: string;
  image?: string;
  /** Only used as alt text when real art is supplied; the generated cover is
   *  decorative, since the title always sits beside it in the DOM. */
  title: string;
  size?: "card" | "feature";
}) {
  const Icon = COVER_ICONS[icon];

  if (image) {
    return (
      <Image
        src={image}
        alt={title}
        fill
        unoptimized
        sizes={size === "feature" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`absolute inset-0 bg-linear-to-br ${accent} transition-transform duration-500 ease-out group-hover:scale-[1.04]`}
    >
      {/* A faint grid keeps the flat gradient from reading as a loading state. */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]"
        style={{ backgroundSize: "28px 28px" }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`flex items-center justify-center rounded-2xl border border-gold/20 bg-base/40 text-gold backdrop-blur-sm ${
            size === "feature" ? "h-20 w-20" : "h-14 w-14"
          }`}
        >
          <Icon size={size === "feature" ? 34 : 24} strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}
