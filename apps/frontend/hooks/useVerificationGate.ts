"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import type { GatedArea } from "@/lib/protected-routes";

export type VerifiableArea = Exclude<GatedArea, "onboarding">;

export const VERIFY_REQUIRED_TOAST_ID = "verify-required";

export function useVerificationGate() {
  const resolved = useIsClient();
  const { user, isVerified } = useAuth();
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();

  const blocked = resolved && Boolean(user) && !isVerified;
  const email = user?.email;

  const notifyUnverified = useCallback(
    (area: VerifiableArea) => {
      const verifyHref = `/${locale}/verificationcode${
        email ? `?email=${encodeURIComponent(email)}` : ""
      }`;

      toast.warning(t(`verifyRequired.${area}`), {
        id: VERIFY_REQUIRED_TOAST_ID,
        action: {
          label: t("verifyNow"),
          onClick: () => router.push(verifyHref),
        },
      });
    },
    [email, locale, router, t],
  );

  const guardNavigation = useCallback(
    (event: React.MouseEvent, area: VerifiableArea) => {
      if (!blocked) return;

      event.preventDefault();
      notifyUnverified(area);
    },
    [blocked, notifyUnverified],
  );

  return { resolved, blocked, notifyUnverified, guardNavigation };
}
