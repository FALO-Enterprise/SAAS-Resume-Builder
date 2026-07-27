import { cookies } from "next/headers";

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("resumax_token");

  if (!token) {
    return null;
  }

  // Verify your JWT here
  return token.value;
}