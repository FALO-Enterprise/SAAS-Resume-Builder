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
    oauthStart: (provider: "google" | "github" | "linkedin", locale: string) => `/api/auth/oauth/${provider}?locale=${locale === "ar" ? "ar" : "en"}`,
    oauthExchange: "/api/auth/oauth/exchange",
  },
  users: {
    byId: (id: string) => `/api/users/${id}`,
  },
  resumes: {
    generate: "/api/resumes/current/generate",
  },
} as const;
