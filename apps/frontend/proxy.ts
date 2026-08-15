import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isDashboardRoute = pathname.includes("/dashboard");

  const token = request.cookies.get("resumax_token")?.value;

  if (isDashboardRoute && !token) {
    const url = request.nextUrl.clone();

    url.pathname = "/";

    url.searchParams.set("message", "login-required");

    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
