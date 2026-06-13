/** Backend origin (no trailing slash). Override with VITE_API_ORIGIN in frontend/.env */
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export const API_BASE = `${API_ORIGIN}/api`;

/** Build a URL for a file stored under /uploads. Returns null when filename is missing. */
export function getUploadUrl(filename) {
  if (!filename || typeof filename !== "string") return null;
  const trimmed = filename.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${API_ORIGIN}/uploads/${trimmed.replace(/^\/+/, "")}`;
}
