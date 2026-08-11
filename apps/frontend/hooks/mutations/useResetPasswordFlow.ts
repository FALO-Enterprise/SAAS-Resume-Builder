"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  useResetPasswordMutation,
  useValidateResetTokenMutation,
} from "@/hooks/mutations/useAuthMutations";

type TokenStatus = "checking" | "valid" | "invalid";

export function useResetPasswordFlow(token: string | null, networkFallback: string) {
  const locale = useLocale();
  const router = useRouter();

  const resetMutation = useResetPasswordMutation();
  const validateMutation = useValidateResetTokenMutation();

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(token ? "checking" : "invalid");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // Validate the reset token once on mount / whenever it changes.
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    let cancelled = false;
    setTokenStatus("checking");

    validateMutation
      .mutateAsync(token)
      .then((result) => {
        if (cancelled) return;
        setTokenStatus("valid" in result && result.valid ? "valid" : "invalid");
      })
      .catch((error) => {
        if (cancelled) return;
        // Keep the form usable during a temporary validation outage; the
        // reset endpoint still performs the authoritative token check.
        setGeneralError(error instanceof Error ? error.message : networkFallback);
        setTokenStatus("valid");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async (password: string, resetFailedFallback: string) => {
    if (!token || tokenStatus !== "valid") return false;

    setGeneralError(null);

    try {
      await resetMutation.mutateAsync({ token, password });
      if (!isMounted.current) return true;
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}`), 1500);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const looksLikeTokenIssue =
        message.includes("reset link") ||
        message.includes("expired") ||
        message.includes("invalid");

      if (!isMounted.current) return false;

      if (looksLikeTokenIssue) {
        setTokenStatus("invalid");
      } else {
        setGeneralError(error instanceof Error ? error.message : resetFailedFallback);
      }
      return false;
    }
  };

  return {
    tokenStatus,
    submit,
    isPending: resetMutation.isPending,
    generalError,
    success,
  };
}