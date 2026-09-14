"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const ROUTE_MESSAGE_KEYS = {
  "login-required": "loginRequired.dashboard",
  "login-required-dashboard": "loginRequired.dashboard",
  "login-required-drafts": "loginRequired.drafts",
  "login-required-onboarding": "loginRequired.onboarding",
} as const;

type RouteMessage = keyof typeof ROUTE_MESSAGE_KEYS;

function isRouteMessage(value: string | null): value is RouteMessage {
  return value !== null && value in ROUTE_MESSAGE_KEYS;
}

export default function RouteNotification() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("notifications");

  useEffect(() => {
    const message = params.get("message");

    if (!isRouteMessage(message)) return;

    toast.warning(t(ROUTE_MESSAGE_KEYS[message]), { id: "login-required" });

    const next = new URLSearchParams(params);
    next.delete("message");
    const query = next.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [params, pathname, router, t]);

  return null;
}
