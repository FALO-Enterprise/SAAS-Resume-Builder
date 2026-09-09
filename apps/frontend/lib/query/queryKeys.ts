export const queryKeys = {
  users: {
    all: ["users"] as const,
    detail: (userId: string) => [...queryKeys.users.all, "detail", userId] as const,
    preferences: (userId: string) =>
      [...queryKeys.users.all, "preferences", userId] as const,
  },

  drafts: {
    all: ["drafts"] as const,
    list: (userId: string) => [...queryKeys.drafts.all, "list", userId] as const,
  },

  dashboardDraft: {
    all: ["dashboard-draft"] as const,
    detail: (userId: string, resumeId?: string) =>
      [...queryKeys.dashboardDraft.all, "detail", userId, resumeId ?? "current"] as const,
  },

  resumePreview: {
    all: ["resume-preview"] as const,
    detail: (userId: string, resumeId: string) =>
      [...queryKeys.resumePreview.all, "detail", userId, resumeId] as const,
  },

  billing: {
    all: ["billing"] as const,
    subscription: (userId: string) =>
      [...queryKeys.billing.all, "subscription", userId] as const,
  },

  plans: {
    all: ["plans"] as const,
    list: () => [...queryKeys.plans.all, "list"] as const,
  },
} as const;