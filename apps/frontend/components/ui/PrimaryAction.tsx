"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { hasCompletedOnboarding } from "@/lib/onboarding-storage";

/* The hang-tag button. Its label and destination are derived together from
   the visitor's state, so the tag never says "create an account" to someone
   who already has one. Auth is read only on the client: the token lives in
   browser storage, and reading it during the server render would mismatch. */

export default function PrimaryAction({
  labels,
  note,
}: {
  labels: { new: string; onboarding: string; dashboard: string };
  note: string;
}) {
  const locale = useLocale();
  const { isVerified, user } = useAuth();
  const resolved = useIsClient() && isVerified;
  const onboarded = resolved && hasCompletedOnboarding(user?.id);

  const [href, label] = !resolved
    ? [`/${locale}/createaccount`, labels.new]
    : onboarded
      ? [`/${locale}/dashboard`, labels.dashboard]
      : [`/${locale}/onboarding`, labels.onboarding];

  return (
    <Link href={href} className="lp-tag">
      <span>
        <span className="block">{label}</span>
        {!resolved && (
          <span className="lp-label mt-0.5 block font-normal opacity-80">{note}</span>
        )}
      </span>
      <ArrowRight size={18} aria-hidden className="shrink-0 rtl:-scale-x-100" />
    </Link>
  );
}
