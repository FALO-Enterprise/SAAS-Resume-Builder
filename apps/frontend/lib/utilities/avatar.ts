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

export function isUploadedAvatar(path?: string | null) {
  const avatarUrl = getAvatarUrl(path);
  if (!avatarUrl) return false;

  try {
    return new URL(avatarUrl, "http://local").pathname.startsWith("/uploads/");
  } catch {
    return false;
  }
}
