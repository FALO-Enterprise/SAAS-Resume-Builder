export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login-jwt",
    register: "/api/auth/register",
    verify: "/api/auth/verify",
    resendCode: "/api/auth/resend-code",
    forgotPassword: "/api/auth/forgot-password",
    validateResetToken: "/api/auth/validate-reset-token",
    resetPassword: "/api/auth/reset-password",
    dashboard: "/api/dashboard",
    oauthStart: (provider: "google" | "github", locale: string) => `/api/auth/oauth/${provider}?locale=${locale === "ar" ? "ar" : "en"}`,
    oauthExchange: "/api/auth/oauth/exchange",
  },
  users: {
    byId: (id: string) => `/api/users/${id}`,
    preferences: "/api/users/me/preferences",
  },
  support: {
    contact: "/api/support/contact",
  },
  payments: {
    plans: "/api/payments/plans",
    subscription: "/api/payments/subscription",
    checkoutSession: "/api/payments/checkout-session",
    syncCheckout: "/api/payments/sync-checkout",
    cancel: "/api/payments/cancel",
  },
  resumes: {
    root: "/api/resumes",
    current: "/api/resumes/current",
    generate: "/api/resumes/current/generate",
    drafts: "/api/resumes/drafts",
    newDraft: "/api/resumes/new-draft",
    aiCoachAnalyze: "/api/resumes/ai-coach/analyze",
    byId: (id: string) => `/api/resumes/${encodeURIComponent(id)}`,
    preview: (id: string) => `/api/resumes/${encodeURIComponent(id)}/preview`,
    exports: (id: string, format: string) => `/api/resumes/${encodeURIComponent(id)}/exports/${format}`,
  },
} as const;
