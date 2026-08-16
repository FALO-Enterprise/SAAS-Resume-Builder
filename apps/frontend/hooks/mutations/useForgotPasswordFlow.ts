"use client";

import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { useRequestPasswordResetMutation } from "@/hooks/mutations/useAuthMutations";

const DEFAULT_RESEND_COOLDOWN = 60;

// apiClient's response interceptor rejects with a plain normalized object
// ({message, status, code} — see lib/api/client.ts), never an Error
// instance, so `error instanceof Error` never matches a real backend
// failure here. Check for the actual shape instead.
function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export function useForgotPasswordFlow(resendCooldown = DEFAULT_RESEND_COOLDOWN) {
  const requestResetMutation = useRequestPasswordResetMutation();
  const { count, expired, restart } = useCountdown(resendCooldown);

  const [sent, setSent] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const resendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (resendTimeoutRef.current) clearTimeout(resendTimeoutRef.current);
    };
  }, []);

  const request = async (email: string, locale: "en" | "ar", networkFallback: string) => {
    setGeneralError(null);
    try {
      await requestResetMutation.mutateAsync({ email, locale });
      if (!isMounted.current) return true;
      setSent(true);
      restart();
      return true;
    } catch (error) {
      if (isMounted.current) {
        setGeneralError(getErrorMessage(error, networkFallback));
      }
      return false;
    }
  };

  const resend = async (email: string, locale: "en" | "ar", networkFallback: string) => {
    if (!expired || requestResetMutation.isPending) return false;

    setGeneralError(null);
    setResendSuccess(false);

    try {
      await requestResetMutation.mutateAsync({ email, locale });
      if (!isMounted.current) return true;
      setResendSuccess(true);
      restart();
      resendTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) setResendSuccess(false);
      }, 2500);
      return true;
    } catch (error) {
      if (isMounted.current) {
        setGeneralError(getErrorMessage(error, networkFallback));
      }
      return false;
    }
  };

  return {
    request,
    resend,
    isPending: requestResetMutation.isPending,
    sent,
    resendSuccess,
    generalError,
    count,
    expired,
  };
}