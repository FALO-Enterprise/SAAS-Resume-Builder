"use client";

import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { setAccessToken } from "@/lib/auth/token";
import { resetOnboardingState } from "@/lib/onboarding-storage";
import {
  useResendCodeMutation,
  useVerifyCodeMutation,
} from "@/hooks/mutations/useAuthMutations";
import type { AuthUser } from "@/lib/types/auth.types";

const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_RESEND_COOLDOWN = 60;

type VerifyResult =
  | {
      ok: true;
    }
  | {
      ok: false;
    };

export function useVerifyAccountFlow(
  codeLength = DEFAULT_CODE_LENGTH,
  resendCooldown = DEFAULT_RESEND_COOLDOWN,
) {
  const verifyCodeMutation = useVerifyCodeMutation();
  const resendCodeMutation = useResendCodeMutation();

  const { count, expired, restart } = useCountdown(resendCooldown);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Store the verified user here temporarily.
  // We do NOT call login() immediately because doing so can trigger
  // the authentication redirect before the success screen is rendered.
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null);

  const isMounted = useRef(true);

  const resendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;

      if (resendTimeoutRef.current) {
        clearTimeout(resendTimeoutRef.current);
      }
    };
  }, []);

  const verify = async (
    email: string,
    code: string,
    networkFallback: string,
  ): Promise<VerifyResult> => {
    if (code.length !== codeLength) {
      return { ok: false };
    }

    setGeneralError(null);

    try {
      const data = await verifyCodeMutation.mutateAsync({
        email,
        code,
      });

      // A missing token means the backend didn't actually hand us a usable
      // session, even though the request itself resolved without throwing.
      // Do NOT show the success screen / mark the account verified in that
      // case — the user would appear "verified" for a moment and then get
      // silently signed out as soon as anything checks for a stored token.
      if (!data.token) {
        if (isMounted.current) {
          setGeneralError(networkFallback);
        }
        return { ok: false };
      }

      setAccessToken(data.token);

      if (!isMounted.current) {
        return { ok: true };
      }

      /*
       * IMPORTANT:
       *
       * Do NOT call login() here.
       *
       * Calling login() immediately changes the authentication state,
       * which can cause your proxy/auth guard to redirect the user
       * before the success screen becomes visible.
       */
      const user: AuthUser = {
        id: data.user?.id ?? "",
        name: data.user?.name ?? email.split("@")[0],
        email: data.user?.email ?? email,
        avatar: data.user?.avatar ?? null,
        role: data.user?.role ?? "USER",
        planName: data.user?.plan?.name ?? "FREE",
        isVerified: true,
      };

      setVerifiedUser(user);

      setSuccess(true);

      return { ok: true };
    } catch (error) {
      let message = networkFallback;

      if (error && typeof error === "object") {
        // Prefer the specific backend message from error.response.data, if
        // present — it's more useful than axios's generic
        // "Request failed with status code 500", which every AxiosError
        // also carries as its own .message and would otherwise win first.
        let extracted: string | null = null;

        if (
          "response" in error &&
          error.response &&
          typeof error.response === "object"
        ) {
          const response = error.response as {
            data?: {
              message?: string;
              error?: string | { message?: string };
            };
          };

          if (response.data?.message) {
            extracted = response.data.message;
          } else if (response.data?.error) {
            const backendError = response.data.error;

            extracted =
              typeof backendError === "string"
                ? backendError
                : (backendError?.message ?? null);
          }
        }

        if (
          !extracted &&
          "message" in error &&
          typeof (error as { message?: string }).message === "string"
        ) {
          extracted = (error as { message: string }).message;
        }

        if (extracted) {
          message = extracted;
        }
      }

      if (isMounted.current) {
        setGeneralError(message);
      }

      return { ok: false };
    }
  };

  const resend = async (
    email: string,
    networkFallback: string,
    onRevealEnd?: () => void,
  ) => {
    if (!expired || resendCodeMutation.isPending) {
      return false;
    }

    setGeneralError(null);
    setResendSuccess(false);

    try {
      await resendCodeMutation.mutateAsync({
        email,
      });

      if (!isMounted.current) {
        return true;
      }

      setResendSuccess(true);

      restart();

      resendTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setResendSuccess(false);
        }

        onRevealEnd?.();
      }, 2500);

      return true;
    } catch {
      if (isMounted.current) {
        setGeneralError(networkFallback);
      }

      return false;
    }
  };

  const clearError = () => {
    setGeneralError(null);
  };

  return {
    verify,
    resend,
    clearError,

    isVerifying: verifyCodeMutation.isPending,
    isResending: resendCodeMutation.isPending,

    generalError,

    /*
     * Verification state.
     */
    success,

    /*
     * User returned from the verification request.
     *
     * The page will use this after the success animation finishes.
     */
    verifiedUser,

    /*
     * Resend state.
     */
    resendSuccess,

    /*
     * Countdown.
     */
    count,
    expired,
  };
}
