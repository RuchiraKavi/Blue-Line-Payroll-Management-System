/** Backend origin (no trailing slash). Override with VITE_API_ORIGIN in frontend/.env */
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export const API_BASE = `${API_ORIGIN}/api`;

function normalizeUploadFilename(filename) {
  if (!filename || typeof filename !== "string") return "";
  return filename
    .trim()
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "")
    .replace(/^public\/uploads\//i, "")
    .replace(/\\/g, "/")
    .split("/")
    .pop();
}

function isServedFromBackend() {
  if (typeof window === "undefined") return import.meta.env.PROD;
  return /^https?:\/\/(localhost|127\.0\.0\.1):5000$/i.test(window.location.origin);
}

/** Build a URL for a file stored under /uploads. Returns null when filename is missing. */
export function getUploadUrl(filename, { absolute = false } = {}) {
  const normalized = normalizeUploadFilename(filename);
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const relative = `/uploads/${normalized}`;

  if (!absolute && (import.meta.env.PROD || isServedFromBackend())) {
    return relative;
  }

  if (absolute && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${relative}`;
  }

  return `${API_ORIGIN}${relative}`;
}
