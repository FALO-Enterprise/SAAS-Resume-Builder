import { buildBackendUrl } from "@/lib/backend";

export function getAvatarUrl(path?: string | null) {
  const avatar = path?.trim();
  if (!avatar) return "";

  if (/^(?:https?:|blob:|data:)/i.test(avatar)) return avatar;

  const cleanPath = avatar.startsWith("/") ? avatar : `/${avatar}`;
  const uploadPath = cleanPath.startsWith("/uploads/")
    ? cleanPath
    : `/uploads${cleanPath}`;

  return buildBackendUrl(uploadPath);
}
