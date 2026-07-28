"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  AuthContextType,
  AuthUser,
} from "@/lib/types/auth.types";

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "resumax_user";
const VERIFIED_KEY = "resumax_isVerified";

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_KEY);

    if (!stored) return null;

    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(() =>
    getStoredUser()
  );

  const isVerified = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(VERIFIED_KEY, "true");
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(VERIFIED_KEY);
    }
  }, [user]);

  const openLogin = () => setIsOpen(true);

  const closeModal = () => setIsOpen(false);

  const login = (nextUser: AuthUser) => {
    setUser(nextUser);
  };

  const logout = () => {
    setUser(null);

    localStorage.removeItem("resumax_token");
    document.cookie = "resumax_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push(`/${locale}`);
  };

  const updateUser = (nextUser: AuthUser) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        isOpen,
        openLogin,
        closeModal,

        user,
        isVerified,

        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}