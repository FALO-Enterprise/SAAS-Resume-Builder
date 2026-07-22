"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AuthUser, PlanName } from "@/lib/types/auth.types";
import { AuthContextType } from "@/lib/types/auth.types";


const AuthContext = createContext<AuthContextType | null>(null);

function isPlanName(value: unknown): value is PlanName {
  return value === "FREE" || value === "PRO" || value === "ENTERPRISE";
}

function readStoredUser(): AuthUser | null {
  const stored = localStorage.getItem("resumax_user");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as {
      name?: unknown;
      email?: unknown;
      planName?: unknown;
      plan?: { name?: unknown };
    };
    const planName = parsed.planName ?? parsed.plan?.name;

    if (
      typeof parsed.name !== "string" ||
      typeof parsed.email !== "string" ||
      !isPlanName(planName)
    ) {
      return null;
    }

    return { name: parsed.name, email: parsed.email, planName };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("resumax_isVerified") === "true";
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return readStoredUser();
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("resumax_user", JSON.stringify(user));
    }
  }, [user]);

  const openLogin = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const login = (nextUser: AuthUser) => {
    setIsVerified(true);
    setUser(nextUser);
    localStorage.setItem("resumax_isVerified", "true");
  };

  const logout = () => {
    setIsVerified(false);
    setUser(null);
    localStorage.removeItem("resumax_isVerified");
    localStorage.removeItem("resumax_user");
    localStorage.removeItem("resumax_token");
    router.push(`/${locale}`);
  };

  return (
    <AuthContext.Provider
      value={{ isOpen, openLogin, closeModal, isVerified, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
