export const queryKeys = {
  user: {
    detail: (id: string) => ["user", id] as const,
  },
  auth: {
    session: ["auth", "session"] as const,
  },
  plans: {
    all: ["plans"] as const,
  },
};