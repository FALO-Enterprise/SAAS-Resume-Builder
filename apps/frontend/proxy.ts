import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { resolveGatedArea, resolveLocale } from "./lib/protected-routes";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get("resumax_token")?.value;
  const area = resolveGatedArea(pathname);

  if (area && !token) {
    const url = request.nextUrl.clone();

    url.pathname = `/${resolveLocale(pathname)}`;

    // The area rides along so the toast can name the place they were headed
    // rather than always saying "dashboard".
    url.searchParams.set("message", `login-required-${area}`);

    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
