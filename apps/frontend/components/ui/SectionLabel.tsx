/* The small label some pages set above their main heading: a plain line of
   text in the label voice, so the heading below it carries the weight. */

export default function SectionLabel({ text }: { text: string }) {
  return <p className="lp-label text-lp-ink2">{text}</p>;
}
