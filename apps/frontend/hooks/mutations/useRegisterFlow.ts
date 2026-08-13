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
  const { closeModal, login } = useAuth();
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

      login({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar,
        role: data.user.role,
      })

      setTimeout(() => {
        router.push(`/${locale}/`);
      }, 2000);

      return true;
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : networkFallback);
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
