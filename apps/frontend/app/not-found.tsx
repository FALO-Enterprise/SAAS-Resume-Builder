import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-base px-6 py-12 text-primary">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-44 w-44 rounded-full bg-azure-light/20 blur-3xl" />
        <div className="absolute right-10 top-1/3 h-44 w-44 rounded-full bg-teal-light/20 blur-3xl" />
      </div>

      <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-3xl items-center justify-center">
        <div className="glass w-full rounded-3xl border border-edge p-8 text-center shadow-[0_25px_60px_var(--shadow-color)] sm:p-12">
          <div className="mx-auto mb-8 w-full max-w-sm">
            <svg
              viewBox="0 0 520 300"
              role="img"
              aria-label="Page not found illustration"
              className="h-auto w-full"
            >
              <defs>
                <linearGradient id="nfGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f5a623" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <rect x="40" y="38" width="440" height="224" rx="24" fill="none" stroke="url(#nfGradient)" strokeWidth="4" opacity="0.85" />
              <circle cx="86" cy="72" r="8" fill="#f87171" />
              <circle cx="112" cy="72" r="8" fill="#fbbf24" />
              <circle cx="138" cy="72" r="8" fill="#22c55e" />
              <text
                x="260"
                y="168"
                textAnchor="middle"
                className="font-syne"
                fontSize="86"
                fontWeight="700"
                fill="url(#nfGradient)"
              >
                404
              </text>
              <path d="M200 205 H320" stroke="#f5a623" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
              <circle cx="372" cy="140" r="10" fill="#14b8a6" opacity="0.8" />
              <circle cx="158" cy="198" r="7" fill="#3b82f6" opacity="0.8" />
            </svg>
          </div>

          <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-gold uppercase">
            Oops
          </p>
          <h1 className="mb-4 text-3xl font-bold font-syne sm:text-4xl">
            Page Not Found
          </h1>
          <p
            className="mx-auto mb-8 max-w-xl sm:text-lg text-secondary"
          >
            The page you are looking for does not exist or may have been moved.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-sm font-bold tracking-wide text-ink transition hover:-translate-y-0.5 hover:bg-gold-light"
          >
            Return To Main Page
          </Link>
        </div>
      </section>
    </main>
  );
}