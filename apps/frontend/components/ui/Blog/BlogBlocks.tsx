import { Quote, Sparkles } from "lucide-react";
import RichText from "@/components/ui/legal/RichText";
import type { BlogBlock } from "@/lib/types/blog.types";

const TONES = {
  gold: { wrap: "border-gold/20 bg-gold/[0.06]", title: "text-gold" },
  azure: {
    wrap: "border-azure-light/20 bg-azure-light/[0.06]",
    title: "text-azure-light",
  },
  teal: {
    wrap: "border-teal-light/20 bg-teal-light/[0.06]",
    title: "text-teal-light",
  },
  pink: { wrap: "border-pink/20 bg-pink/[0.06]", title: "text-pink" },
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
        <h3 className="mt-10 mb-1 font-playfair text-[21px] font-bold text-primary">
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
                  className="absolute top-[0.28em] inset-s-0 flex h-5 w-5 items-center justify-center rounded-full bg-gold/12 text-[11px] font-bold text-gold"
                >
                  {i + 1}
                </span>
              ) : (
                <span
                  aria-hidden
                  className="absolute top-[0.72em] inset-s-1.5 h-1.5 w-1.5 rounded-full bg-gold/60"
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
        <figure className="my-2 border-s-2 border-gold/40 ps-6">
          <Quote
            size={18}
            aria-hidden
            className="mb-3 text-gold/50 rtl:rotate-180"
          />
          <blockquote className="font-playfair text-[20px] leading-[1.6] text-primary">
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
        <aside className="glass rounded-2xl border border-edge p-6">
          <p className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gold">
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
                  className="absolute top-[0.68em] inset-s-0 h-1.5 w-1.5 rounded-full bg-gold/60"
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
