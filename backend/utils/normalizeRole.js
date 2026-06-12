/** Legacy keys that map to the Finance system role. */
export const LEGACY_FINANCE_ROLES = ["accountant", "account", "account_manager"];

/** All DB role values that represent Finance (for queries before/after migration). */
export const FINANCE_ROLE_KEYS = ["finance", ...LEGACY_FINANCE_ROLES];

/**
 * Canonical role key used for authorization checks.
 * Legacy finance aliases normalize to "finance".
 */
export function normalizeRole(role) {
  if (!role) return "";
  const r = String(role).toLowerCase().trim();
  if (r === "hr_manager") return "hr";
  if (r === "finance" || LEGACY_FINANCE_ROLES.includes(r)) return "finance";
  return r;
}

export function isFinanceRole(role) {
  return normalizeRole(role) === "finance";
}
