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

import {
  AuthContextType,
  AuthUser,
} from "@/lib/types/auth.types";
import { clearAuthToken, hasActiveAuthToken } from "@/lib/auth-session";

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "resumax_user";
const VERIFIED_KEY = "resumax_isVerified";
const subscribeToHydration = () => () => {};

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_KEY);

    if (!stored) {
      clearAuthToken();
      localStorage.removeItem(VERIFIED_KEY);
      return null;
    }

    // The navbar and the protected routes must agree on whether a browser
    // session exists. A user record without both JWT copies is stale state.
    if (!hasActiveAuthToken()) {
      clearAuthToken();
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(VERIFIED_KEY);
      return null;
    }

    const parsed = JSON.parse(stored) as Omit<AuthUser, "isVerified"> & {
      isVerified?: boolean;
    };

    return {
      ...parsed,
      // Sessions stored before isVerified became part of AuthUser were only
      // created after a successful verified login.
      isVerified:
        parsed.isVerified ??
        localStorage.getItem(VERIFIED_KEY) === "true",
    };
  } catch {
    clearAuthToken();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(VERIFIED_KEY);
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
  const isVerified = Boolean(
    user?.isVerified && hasActiveAuthToken(),
  );

  useEffect(() => {
    if (storedUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(storedUser));
      if (storedUser.isVerified) {
        localStorage.setItem(VERIFIED_KEY, "true");
      } else {
        localStorage.removeItem(VERIFIED_KEY);
      }
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
    clearAuthToken();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(VERIFIED_KEY);
    setStoredUser(null);
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
