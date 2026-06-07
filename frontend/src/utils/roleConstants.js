import normalizeRole from "./normalizeRole";

export const ASSIGNABLE_ROLES = {
  admin: ["admin", "hr", "accountant", "employee", "intern"],
  hr: ["hr", "accountant", "employee", "intern"],
};

export function getAssignableRoles(userRole) {
  const normalized = normalizeRole(userRole);
  return ASSIGNABLE_ROLES[normalized] || [];
}

export function filterAssignableRoles(masterRoles, userRole) {
  const allowedKeys = getAssignableRoles(userRole);
  return (masterRoles || []).filter((role) => allowedKeys.includes(role.key));
}

export function formatRoleLabel(role, masterRoles = []) {
  if (!role) return "N/A";
  const normalized = normalizeRole(role);
  const match = masterRoles.find((item) => item.key === normalized);
  if (match?.label) return match.label;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
