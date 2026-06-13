import normalizeRole, { LEGACY_FINANCE_ROLES } from "./normalizeRole";

const CANONICAL_ROLE_LABELS = {
  admin: "Admin",
  hr: "HR",
  finance: "Finance",
  employee: "Employee",
  intern: "Intern",
};

export function filterAssignableRoles(masterRoles, userRole) {
  const cleaned = (masterRoles || []).filter(
    (role) => !LEGACY_FINANCE_ROLES.includes(String(role.key || "").toLowerCase())
  );
  const normalized = normalizeRole(userRole);
  if (normalized === "admin") return cleaned;
  if (normalized === "hr") {
    return cleaned.filter((role) => role.key !== "admin");
  }
  return [];
}

export function keyToRoleLabel(key) {
  return formatRoleLabel(key);
}

export function formatRoleLabel(role, masterRoles = []) {
  if (!role) return "N/A";
  const normalized = normalizeRole(role);
  if (CANONICAL_ROLE_LABELS[normalized]) {
    return CANONICAL_ROLE_LABELS[normalized];
  }
  const match = masterRoles.find((item) => item.key === normalized);
  if (match?.label) return match.label;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
