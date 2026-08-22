import type { LegalBlock } from "@/lib/types/legal.types";
import RichText from "./RichText";

/**
 * Renders the block structure authored in `messages/{locale}.json`.
 *
 * Body copy is set at 15px rather than the `text-sm` utility — this theme
 * overrides `--text-sm` to 13px, which is below the readable floor for legal
 * text, and `text-base` is a colour token here, not a size.
 */

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

function Block({ block, locale }: { block: LegalBlock; locale: string }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-[15px] leading-[1.8] text-secondary">
          <RichText text={block.text} locale={locale} />
        </p>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className="space-y-3">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="relative ps-6 text-[15px] leading-[1.8] text-secondary"
            >
              <span
                aria-hidden
                className="absolute top-[0.7em] inset-s-0 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-gold/60"
              />
              <RichText text={item} locale={locale} />
            </li>
          ))}
        </Tag>
      );
    }

    case "definitions":
      return (
        <dl className="space-y-5">
          {block.items.map((item, i) => (
            <div
              key={i}
              className="border-s-2 border-edge ps-5 transition-colors hover:border-gold/40"
            >
              <dt className="mb-1.5 text-[15px] font-bold text-primary">
                {item.term}
              </dt>
              <dd className="text-[15px] leading-[1.8] text-secondary">
                <RichText text={item.text} locale={locale} />
              </dd>
            </div>
          ))}
        </dl>
      );

    case "table":
      return (
        // Wide tables scroll inside their own container so the page body never
        // scrolls horizontally on a phone.
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-136 border-collapse text-start">
            <thead>
              <tr className="border-b border-edge-strong">
                {block.headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-faint"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-edge last:border-none transition-colors hover:bg-card"
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-4 py-3.5 align-top text-[14px] leading-[1.7] text-secondary"
                    >
                      <RichText text={cell} locale={locale} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <p className="text-[15px] leading-[1.8] text-secondary">
            <RichText text={block.text} locale={locale} />
          </p>
        </aside>
      );
    }
  }
}

export default function LegalBlocks({
  blocks,
  locale,
}: {
  blocks: LegalBlock[];
  locale: string;
}) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => (
        <Block key={i} block={block} locale={locale} />
      ))}
    </div>
  );
}
