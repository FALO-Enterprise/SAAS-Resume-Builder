import { Quote, Sparkles } from "lucide-react";
import RichText from "@/components/ui/legal/RichText";
import type { BlogBlock } from "@/lib/types/blog.types";

const TONES = {
  note: { wrap: "border-accent/20 bg-accent/[0.06]", title: "text-accent" },
  tip: { wrap: "border-pass/20 bg-pass/[0.06]", title: "text-pass" },
  warning: { wrap: "border-flag/20 bg-flag/[0.06]", title: "text-flag" },
} as const;

function Block({ block, locale }: { block: BlogBlock; locale: string }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-[17px] leading-[1.8] text-secondary">
          <RichText text={block.text} locale={locale} />
        </p>
      );

    case "subheading":
      return (
        <h3 className="mt-10 mb-1 font-display text-[21px] font-bold text-primary">
          {block.text}
        </h3>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className="space-y-3.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="relative ps-8 text-[17px] leading-[1.8] text-secondary"
            >
              {block.ordered ? (
                <span
                  aria-hidden
                  className="absolute top-[0.28em] inset-s-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/12 text-[11px] font-bold text-accent"
                >
                  {i + 1}
                </span>
              ) : (
                <span
                  aria-hidden
                  className="absolute top-[0.72em] inset-s-1.5 h-1.5 w-1.5 rounded-full bg-accent/60"
                />
              )}
              <RichText text={item} locale={locale} />
            </li>
          ))}
        </Tag>
      );
    }

    case "quote":
      return (
        <figure className="my-2 border-s-2 border-accent/40 ps-6">
          <Quote
            size={18}
            aria-hidden
            className="mb-3 text-accent/50 rtl:rotate-180"
          />
          <blockquote className="font-display text-[20px] leading-[1.6] text-primary">
            <RichText text={block.text} locale={locale} />
          </blockquote>
          {block.attribution && (
            <figcaption className="mt-3 text-[13px] text-muted">
              — {block.attribution}
            </figcaption>
          )}
        </figure>
      );

    case "takeaways":
      return (
        <aside className="bg-elevated rounded-2xl border border-edge p-6">
          <p className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-accent">
            <Sparkles size={14} aria-hidden />
            {block.title}
          </p>
          <ul className="space-y-2.5">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="relative ps-6 text-[15.5px] leading-[1.75] text-secondary"
              >
                <span
                  aria-hidden
                  className="absolute top-[0.68em] inset-s-0 h-1.5 w-1.5 rounded-full bg-accent/60"
                />
                <RichText text={item} locale={locale} />
              </li>
            ))}
          </ul>
        </aside>
      );

    case "callout": {
      const tone = TONES[block.tone];
      return (
        <aside className={`rounded-2xl border p-5 sm:p-6 ${tone.wrap}`}>
          <p
            className={`mb-2 text-[13px] font-bold uppercase tracking-wider ${tone.title}`}
          >
            {block.title}
          </p>
          <p className="text-[16px] leading-[1.8] text-secondary">
            <RichText text={block.text} locale={locale} />
          </p>
        </aside>
      );
    }
  }
}

export default function BlogBlocks({
  blocks,
  locale,
}: {
  blocks: BlogBlock[];
  locale: string;
}) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <Block key={i} block={block} locale={locale} />
      ))}
    </div>
  );
}
