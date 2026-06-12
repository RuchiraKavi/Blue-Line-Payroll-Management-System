/** Legacy keys that map to the Finance system role. */
export const LEGACY_FINANCE_ROLES = ["accountant", "account", "account_manager"];

/**
 * Canonical role key used for authorization checks.
 * Legacy finance aliases normalize to "finance".
 */
export default function normalizeRole(role) {
  if (!role) return "";
  const x = String(role).toLowerCase().trim();
  if (x === "hr_manager") return "hr";
  if (x === "finance" || LEGACY_FINANCE_ROLES.includes(x)) return "finance";
  return x;
}

export function isFinanceRole(role) {
  return normalizeRole(role) === "finance";
}
