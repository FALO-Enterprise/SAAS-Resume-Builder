import { cookies } from "next/headers";

/**
 * Decodes a JWT's payload (no signature check) and confirms it's at least
 * structurally a token that hasn't expired yet.
 *
 * IMPORTANT: this is NOT cryptographic verification — anyone can fabricate a
 * three-segment string with a well-formed payload and a future `exp`. A real
 * fix requires verifying the signature against the backend's JWT_SECRET,
 * which means sharing that secret into this app; that's backend-workspace
 * territory and is tracked in bughunt-confirmed.json as a follow-up. This is
 * only a real improvement over the previous "any non-empty cookie passes".
 */
function hasValidJwtShape(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as { exp?: unknown; sub?: unknown };

    if (!payload || typeof payload !== "object") return false;
    if (!payload.sub) return false;
    if (typeof payload.exp !== "number") return false;

    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("resumax_token");

  if (!token || !hasValidJwtShape(token.value)) {
    return null;
  }

  return token.value;
}