import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { AuthUser as User } from "@/lib/types/auth.types";
import { unwrap, type ApiEnvelope } from "@/lib/api/envelope";

export const fetchUserProfile = async (userId: string): Promise<User> => {
  const response = await api.get<ApiEnvelope<User> | User>(
    API_ENDPOINTS.users.byId(userId),
  );
  return unwrap(response.data, "Failed to fetch user profile");
};

export const updateUserProfile = async (
  userId: string,
  userData: FormData | Partial<User>,
): Promise<User> => {
  const response = await api.patch<ApiEnvelope<User> | User>(
    API_ENDPOINTS.users.byId(userId),
    userData,
  );
  return unwrap(response.data, "Failed to update user profile");
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.users.byId(userId));
};
