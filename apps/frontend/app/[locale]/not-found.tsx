import NotFoundScreen from "@/components/ui/NotFoundScreen";

/* Rendered for any unmatched path under /en or /ar, via the sibling [...rest]
   catch-all. It sits inside [locale]/layout.tsx, so the full site chrome — and
   with it every recovery path in the nav — is available here. */
export default function LocaleNotFound() {
  return <NotFoundScreen chrome />;
}
