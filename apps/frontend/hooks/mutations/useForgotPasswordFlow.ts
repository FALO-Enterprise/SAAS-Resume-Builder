"use client";

import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api/errors";
import { useCountdown } from "@/hooks/useCountdown";
import { useRequestPasswordResetMutation } from "@/hooks/mutations/useAuthMutations";

const DEFAULT_RESEND_COOLDOWN = 60;


export function useForgotPasswordFlow(resendCooldown = DEFAULT_RESEND_COOLDOWN) {
  const requestResetMutation = useRequestPasswordResetMutation();
  const { count, expired, restart } = useCountdown(resendCooldown);

  const [sent, setSent] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const resendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;

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