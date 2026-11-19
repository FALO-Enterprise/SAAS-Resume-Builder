import axios, { AxiosError } from "axios";
import { getAccessToken, clearAccessToken } from "@/lib/auth/token";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

/** @deprecated Use `ApiError` from `@/lib/api/errors`. */
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
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

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




    return Promise.reject(
      new ApiError(
        getErrorMessage(
          error.response?.data,
          error.message || "Unexpected error",
        ),
        {
          status: error.response?.status,
          code: typeof data?.code === "string" ? data.code : undefined,
        },
      ),
    );
  },
);
