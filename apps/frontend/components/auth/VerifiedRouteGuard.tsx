"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  useVerificationGate,
  type VerifiableArea,
} from "@/hooks/useVerificationGate";

export default function VerifiedRouteGuard({
  area,
  children,
  fallback = null,
}: {
  area: VerifiableArea;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { resolved, blocked, notifyUnverified } = useVerificationGate();
  const locale = useLocale();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!blocked || hasRedirected.current) return;

    hasRedirected.current = true;
    notifyUnverified(area);
    router.replace(`/${locale}`);
  }, [area, blocked, locale, notifyUnverified, router]);

  if (!resolved || blocked) return <>{fallback}</>;

  return <>{children}</>;
}
