"use client";

import { useAuth } from "@/context/AuthContext";


export function useCurrentUserId(): string | undefined {
  const { user } = useAuth();
  return user?.id;
}

export const ANONYMOUS_USER_ID = "anonymous";
