import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { AuthSession, RegistrationResponse } from "@/lib/backend";

type Envelope<T> = {
  success?: boolean;
  data?: T;
  error?: string | { message?: string };
};

function unwrap<T>(payload: Envelope<T> | T, fallback: string): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    const env = payload as Envelope<T>;
    if (env.success) {
      if (env.data === undefined) throw new Error(fallback);
      return env.data;
    }
    const err = typeof env.error === "string" ? env.error : env.error?.message;
    throw new Error(err || fallback); 
  }
  return payload as T;
}

export const login = async (input: {
  email: string;
  password: string;
}): Promise<AuthSession> => {
  const { data } = await api.post<Envelope<AuthSession> | AuthSession>(
    API_ENDPOINTS.auth.login,
    input,
  );
  return unwrap(data, "Login failed");
};

export const register = async (input: {
  name: string;
  email: string;
  password: string;
  locale?: string;
  planId?: string;
}): Promise<RegistrationResponse> => {
  const { data } = await api.post<
    Envelope<RegistrationResponse> | RegistrationResponse
  >(API_ENDPOINTS.auth.register, input);
  return unwrap(data, "Registration failed");
};

export const verifyCode = async (input: {
  email: string;
  code: string;
}): Promise<AuthSession> => {
  const { data } = await api.post<Envelope<AuthSession> | AuthSession>(
    API_ENDPOINTS.auth.verify,
    input,
  );
  return unwrap(data, "Verification failed");
};

export const resendCode = async (input: { email: string }) => {
  const { data } = await api.post<
    | { success: true; message?: string }
    | { success: false; error?: string | { message?: string } }
  >(API_ENDPOINTS.auth.resendCode, input);

  if (data && typeof data === "object" && "success" in data) {
    if (data.success) {
      return { success: true, message: data.message };
    }
    const err =
      typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(err || "Could not resend code");
  }

  return data as { success?: boolean; message?: string };
};

export const requestPasswordReset = async (input: {
  email: string;
  locale?: string;
}) => {
  const { data } = await api.post<
    Envelope<{ success?: boolean; message?: string }>
  >(API_ENDPOINTS.auth.forgotPassword, input);
  return unwrap(data, "Could not request password reset");
};

export const validateResetToken = async (token: string) => {
  const { data } = await api.post<Envelope<{ valid: boolean }>>(
    API_ENDPOINTS.auth.validateResetToken,
    { token },
  );
  return unwrap(data, "Token validation failed");
};

export const resetPassword = async (input: {
  token: string;
  password: string;
}) => {
  const { data } = await api.post<
    Envelope<{ success?: boolean; message?: string }>
  >(API_ENDPOINTS.auth.resetPassword, input);
  return unwrap(data, "Could not reset password");
};

export default {
  login,
  register,
  verifyCode,
  resendCode,
  requestPasswordReset,
  resetPassword,
  validateResetToken
};
