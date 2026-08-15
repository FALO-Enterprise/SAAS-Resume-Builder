"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { exchangeOAuthCode } from "@/lib/backend";
import { setAccessToken } from "@/lib/auth/token";
import { persistAuthToken } from "@/lib/auth-session";
import Logo from "@/components/ui/Logo";

function OAuthCallbackContent() {
  const locale = useLocale();
  const t = useTranslations("auth.oauth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const didExchange = useRef(false);
  const providerError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const hasInvalidCallback = Boolean(providerError || !code);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    hasInvalidCallback ? "error" : "loading",
  );
  const [error, setError] = useState(
    providerError === "access_denied"
      ? t("accessDenied")
      : errorDescription
      ? errorDescription
      : hasInvalidCallback
      ? t("failed")
      : "",
  );

  useEffect(() => {
    if (didExchange.current) return;
    didExchange.current = true;

    if (hasInvalidCallback || !code) return;

    void exchangeOAuthCode(code)
      .then((data) => {
        if ("error" in data) throw new Error(data.error);

        setAccessToken(data.token);
        // If the user is not verified (new OAuth registration), redirect to verification
        if (!data.user.isVerified) {
          router.replace(`/${locale}/`);
          return;
        }

        persistAuthToken(data.token);
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          role: data.user.role,
          planName: data.user.plan?.name ?? "FREE",
          isVerified: data.user.isVerified ?? false,
        });
        setStatus("success");
        router.replace(`/${locale}`);
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : t("expired"));
      });
  }, [code, hasInvalidCallback, locale, login, router, t]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6">
      <div className="w-full max-w-md rounded-[28px] border border-edge bg-elevated px-8 py-10 text-center shadow-[0_40px_100px_var(--shadow-color)]">
        <Link href={`/${locale}`} className="mb-8 inline-block no-underline">
          <Logo />
        </Link>

        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-gold" size={42} />
            <h1 className="text-xl font-bold text-primary">{t("completing")}</h1>
            <p className="mt-2 text-sm text-faint">{t("pleaseWait")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-gold" size={42} />
            <h1 className="text-xl font-bold text-primary">{t("success")}</h1>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 text-pink-light" size={42} />
            <h1 className="text-xl font-bold text-primary">{t("errorTitle")}</h1>
            <p className="mt-2 text-sm text-faint">{error}</p>
            <Link
              href={`/${locale}`}
              className="mt-6 inline-flex rounded-xl bg-gold px-5 py-3 text-sm font-bold text-ink no-underline"
            >
              {t("backHome")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
