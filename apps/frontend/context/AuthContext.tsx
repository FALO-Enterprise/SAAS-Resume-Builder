"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clearAccessToken } from "@/lib/auth/token";

import {
  AuthContextType,
  AuthUser,
} from "@/lib/types/auth.types";

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "resumax_user";
const VERIFIED_KEY = "resumax_isVerified";
const subscribeToHydration = () => () => {};

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

  const [storedUser, setStoredUser] = useState<AuthUser | null>(() =>
    getStoredUser()
  );
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );

  // Expose the same auth state on the server and during the browser's first
  // render, then reveal the local session immediately after hydration.
  const user = hasHydrated ? storedUser : null;
  const isVerified = user?.isVerified ?? false;

  useEffect(() => {
    if (storedUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(storedUser));
      localStorage.setItem(VERIFIED_KEY, "true");
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(VERIFIED_KEY);
    }
  }, [storedUser]);

  const openLogin = () => setIsOpen(true);

  const closeModal = () => setIsOpen(false);

  const login = (nextUser: AuthUser) => {
    setStoredUser(nextUser);
  };

  const logout = () => {
    setStoredUser(null);
    clearAccessToken();
    router.push(`/${locale}`);
  };

  const updateUser = (nextUser: AuthUser) => {
    setStoredUser(nextUser);
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
