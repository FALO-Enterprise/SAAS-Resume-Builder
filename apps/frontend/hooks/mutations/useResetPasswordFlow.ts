"use client";

import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api/errors";
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

  const [verdict, setVerdict] = useState<{ token: string; valid: boolean } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tokenStatus: TokenStatus = !token
    ? "invalid"
    : verdict?.token !== token
      ? "checking"
      : verdict.valid
        ? "valid"
        : "invalid";

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    validateMutation
      .mutateAsync(token)
      .then((result) => {
        if (cancelled) return;
        setVerdict({ token, valid: "valid" in result && result.valid });
      })
      .catch((error) => {
        if (cancelled) return;
        setGeneralError(getErrorMessage(error, networkFallback));
        setVerdict({ token, valid: true });
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
      const message = getErrorMessage(error, "").toLowerCase();
      const looksLikeTokenIssue =
        message.includes("reset link") ||
        message.includes("expired") ||
        message.includes("invalid");

      if (!isMounted.current) return false;

      if (looksLikeTokenIssue) {
        setVerdict({ token, valid: false });
      } else {
        setGeneralError(getErrorMessage(error, resetFailedFallback));
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