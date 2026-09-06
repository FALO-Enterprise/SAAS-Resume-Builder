import axios, { AxiosError } from "axios";
import { getAccessToken, clearAccessToken } from "@/lib/auth/token";

export type NormalizedApiError = {
  message: string;
  status?: number;
  code?: string;
};

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001",
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only clear the token when the failing request actually carried the
    // current session's Authorization header — a 401 from an unauthenticated
    // call (login, register, forgot/reset-password, resend-code) is about
    // that request's own credentials, not the still-valid session token, and
    // clearing it here would silently sign the user out as a side effect.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearAccessToken();
    }

    const data = error.response?.data as
      | {
        message?: string;
        error?: string | { message?: string };
        code?: string;
      }
      | undefined;

    const normalized: NormalizedApiError = {
      message:
        data?.message ||
        (typeof data?.error === "string" ? data.error : data?.error?.message) ||
        error.message ||
        "Unexpected error",
      status: error.response?.status,
      code: data?.code,
    };

    return Promise.reject(normalized);
  },
);
