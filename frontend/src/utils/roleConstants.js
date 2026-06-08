import normalizeRole from "./normalizeRole";

export function filterAssignableRoles(masterRoles, userRole) {
  const normalized = normalizeRole(userRole);
  if (normalized === "admin") return masterRoles || [];
  if (normalized === "hr") {
    return (masterRoles || []).filter((role) => role.key !== "admin");
  }
  return [];
}

export function formatRoleLabel(role, masterRoles = []) {
  if (!role) return "N/A";
  const normalized = normalizeRole(role);
  const match = masterRoles.find((item) => item.key === normalized);
  if (match?.label) return match.label;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
