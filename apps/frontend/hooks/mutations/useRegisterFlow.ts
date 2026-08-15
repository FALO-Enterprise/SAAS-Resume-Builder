"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import type { RegisterData } from "@/lib/types/auth.types";
import { useRegisterMutation } from "@/hooks/mutations/useAuthMutations";

export function useRegisterFlow() {
  const locale = useLocale();
  const router = useRouter();
  const { closeModal } = useAuth();
  const registerMutation = useRegisterMutation();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState("");

  const submit = async (form: RegisterData, networkFallback: string) => {
    setGeneralError(null);

    try {
      const data = await registerMutation.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if ("error" in data) {
        setGeneralError(typeof data.error === "string" ? data.error : networkFallback);
        return false;
      }

      setRegisteredName(form.name);
      setSuccess(true);

      // After registration the user must verify their email before they can
      // log in, so redirect them to the verification page instead of logging
      // them in (the register endpoint returns no token and the account is
      // not verified yet).
      setTimeout(() => {
        router.push(
          `/${locale}/verificationcode?email=${encodeURIComponent(form.email)}`,
        );
      }, 2000);

      return true;
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: string }).message ?? networkFallback)
          : error instanceof Error
            ? error.message
            : networkFallback;
      setGeneralError(message);
      return false;
    }
  };

  return {
    submit,
    isPending: registerMutation.isPending,
    generalError,
    success,
    registeredName,
    closeModal,
  };
}
