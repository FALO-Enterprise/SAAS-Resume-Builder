import { Fragment } from "react";

/**
 * Renders the small inline tag vocabulary used inside translated legal and
 * help strings.
 *
 * next-intl's `t.rich()` only applies to message *keys*, and these strings
 * arrive from `t.raw()` as members of a section array — so the tags are parsed
 * here instead. The vocabulary is deliberately tiny; anything richer belongs in
 * the block structure, not in prose.
 *
 *   <b>…</b>                  bold
 *   <mail>name@host</mail>    mailto link
 *   <a href="#anchor">…</a>   in-page anchor
 *   <a href="/pricing">…</a>  internal route, prefixed with the active locale
 */

// Tags never nest in this content, so a single non-greedy pass is enough.
const TAG_PATTERN = /<(b|mail|a)(?:\s+href="([^"]*)")?>([\s\S]*?)<\/\1>/g;

const LINK_CLASS =
  "font-medium text-gold underline decoration-gold/30 underline-offset-4 transition-colors hover:decoration-gold";

export default function RichText({
  text,
  locale,
}: {
  text: string;
  locale: string;
}) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(TAG_PATTERN)) {
    const [full, tag, href, content] = match;
    const start = match.index ?? 0;

    if (start > cursor) nodes.push(text.slice(cursor, start));

    if (tag === "b") {
      nodes.push(
        <strong key={key++} className="font-semibold text-primary">
          {content}
        </strong>,
      );
    } else if (tag === "mail") {
      nodes.push(
        <a key={key++} href={`mailto:${content}`} dir="ltr" className={LINK_CLASS}>
          {content}
        </a>,
      );
    } else {
      // Root-relative paths are locale-scoped routes; anchors are left alone.
      const target =
        href && href.startsWith("/") ? `/${locale}${href}` : href || "#";
      nodes.push(
        <a key={key++} href={target} className={LINK_CLASS}>
          {content}
        </a>,
      );
    }

    cursor = start + full.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  );
}
