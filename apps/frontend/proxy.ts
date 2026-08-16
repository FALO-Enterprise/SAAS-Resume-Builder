import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.includes("/dashboard") || pathname.includes("/onboarding");

  const token = request.cookies.get("resumax_token")?.value;

  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();

    const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
    url.pathname = `/${locale}`;

    url.searchParams.set("message", "login-required");

    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
