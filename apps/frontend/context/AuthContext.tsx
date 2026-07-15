"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AuthUser } from "@/lib/types/auth.types";
import { AuthContextType } from "@/lib/types/auth.types";


const AuthContext = createContext<AuthContextType | null>(null);

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
    const stored = localStorage.getItem("resumax_user");
    return stored ? JSON.parse(stored) : null;
  });

  const openLogin = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const login = (nextUser: AuthUser) => {
    setIsVerified(true);
    setUser(nextUser);
    localStorage.setItem("resumax_isVerified", "true");
    localStorage.setItem("resumax_user", JSON.stringify(nextUser));
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
