import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { AuthUser as User } from "@/lib/types/auth.types";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string | { message?: string };
};

function unwrapApiData<T>(
  payload: ApiEnvelope<T> | T,
  fallbackMessage: string,
): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ApiEnvelope<T>;

    if (envelope.success) {
      if (envelope.data === undefined) {
        throw new Error(fallbackMessage);
      }
      return envelope.data;
    }

    const errorMessage =
      typeof envelope.error === "string"
        ? envelope.error
        : envelope.error?.message || fallbackMessage;

    throw new Error(errorMessage);
  }

  return payload as T;
}

export const fetchUserProfile = async (userId: string): Promise<User> => {
  const response = await api.get<ApiEnvelope<User> | User>(
    API_ENDPOINTS.users.byId(userId),
  );
  return unwrapApiData(response.data, "Failed to fetch user profile");
};

export const updateUserProfile = async (
  userId: string,
  userData: FormData | Partial<User>,
): Promise<User> => {
  const response = await api.patch<ApiEnvelope<User> | User>(
    API_ENDPOINTS.users.byId(userId),
    userData,
  );
  return unwrapApiData(response.data, "Failed to update user profile");
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.users.byId(userId));
};
