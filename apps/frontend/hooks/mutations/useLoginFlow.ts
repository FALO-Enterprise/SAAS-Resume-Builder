"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { setAccessToken } from "@/lib/auth/token";
import { getErrorMessage } from "@/lib/api/errors";
import type { LoginData } from "@/lib/types/auth.types";
import { useLoginMutation } from "@/hooks/mutations/useAuthMutations";

export function useLoginFlow() {
  const { login, closeModal } = useAuth();
  const loginMutation = useLoginMutation();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (form: LoginData, networkFallback: string) => {
    setGeneralError(null);

    try {
      const data = await loginMutation.mutateAsync({
        email: form.email,
        password: form.password,
      });

      setAccessToken(data.token);
      login({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar!,
        role: data.user.role!,
        planName: data.user.plan?.name ?? "FREE",
        isVerified: data.user.isVerified ?? false,
      });

      setSuccess(true);
      setTimeout(() => closeModal(), 800);
      return true;
    } catch (error) {
      setGeneralError(getErrorMessage(error, networkFallback));
      return false;
    }
  };

  return {
    submit,
    isPending: loginMutation.isPending,
    generalError,
    success,
    closeModal,
  };
}
