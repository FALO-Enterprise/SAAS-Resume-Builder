"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useCountdown } from "@/hooks/useCountdown";
import { setAccessToken } from "@/lib/auth/token";
import {
  useResendCodeMutation,
  useVerifyCodeMutation,
} from "@/hooks/mutations/useAuthMutations";

const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_RESEND_COOLDOWN = 60;

type VerifyResult = { ok: true } | { ok: false };

export function useVerifyAccountFlow(
  codeLength = DEFAULT_CODE_LENGTH,
  resendCooldown = DEFAULT_RESEND_COOLDOWN,
) {
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuth();

  const verifyCodeMutation = useVerifyCodeMutation();
  const resendCodeMutation = useResendCodeMutation();
  const { count, expired, restart } = useCountdown(resendCooldown);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const isMounted = useRef(true);
  const resendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (resendTimeoutRef.current) clearTimeout(resendTimeoutRef.current);
    };
  }, []);

  const verify = async (
    email: string,
    code: string,
    networkFallback: string,
  ): Promise<VerifyResult> => {
    if (code.length !== codeLength) return { ok: false };

    setGeneralError(null);

    try {
      const data = await verifyCodeMutation.mutateAsync({ email, code });

      if (data.token) setAccessToken(data.token);

      login({
        id: data.user?.id,
        name: data.user?.name ?? email.split("@")[0],
        email: data.user?.email ?? email,
        avatar: data.user?.avatar ?? null,
        role: data.user?.role ?? "USER",
        planName: data.user?.plan?.name ?? "FREE",
        isVerified: data.user?.isVerified ?? false,
      });

      if (!isMounted.current) return { ok: true };
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}`), 2000);
      return { ok: true };
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: string }).message ?? networkFallback)
          : networkFallback;
      if (isMounted.current) setGeneralError(message);
      return { ok: false };
    }
  };

  // onRevealEnd fires when the resend-success banner is about to hide —
  // the caller uses it to refocus the first OTP box at the right moment.
  const resend = async (email: string, networkFallback: string, onRevealEnd?: () => void) => {
    if (!expired || resendCodeMutation.isPending) return false;

    setGeneralError(null);
    setResendSuccess(false);

    try {
      await resendCodeMutation.mutateAsync({ email });
      if (!isMounted.current) return true;
      setResendSuccess(true);
      restart();
      resendTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) setResendSuccess(false);
        onRevealEnd?.();
      }, 2500);
      return true;
    } catch {
      if (isMounted.current) setGeneralError(networkFallback);
      return false;
    }
  };

  const clearError = () => setGeneralError(null);

  return {
    verify,
    resend,
    clearError,
    isVerifying: verifyCodeMutation.isPending,
    isResending: resendCodeMutation.isPending,
    generalError,
    success,
    resendSuccess,
    count,
    expired,
  };
}