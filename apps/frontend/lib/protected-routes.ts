import { routing } from "@/i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

export const PROTECTED_SEGMENTS = ["dashboard", "drafts", "onboarding"] as const;

export type GatedArea = (typeof PROTECTED_SEGMENTS)[number];

const PROTECTED_ROUTE = new RegExp(
  `^/(?:(?:${routing.locales.join("|")})/)?(${PROTECTED_SEGMENTS.join("|")})(?:/|$)`,
);

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE.test(pathname);
}

export function resolveGatedArea(pathname: string): GatedArea | null {
  const match = PROTECTED_ROUTE.exec(pathname);

  return match ? (match[1] as GatedArea) : null;
}

export function resolveLocale(pathname: string): AppLocale {
  const segment = pathname.split("/")[1];

  return routing.locales.includes(segment as AppLocale)
    ? (segment as AppLocale)
    : routing.defaultLocale;
}
