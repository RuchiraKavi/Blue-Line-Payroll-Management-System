import { hasPermission } from "../utils/permissionSections.js";

const normalizeRole = (role) => {
  if (!role) return role;
  const r = String(role).toLowerCase();
  if (r === "hr_manager") return "hr";
  if (r === "account_manager" || r === "accountant") return "account";
  return r;
};

/**
 * Allow legacy system roles OR users whose role catalog permissions grant section+action.
 */
export function authorizePermission(section, action, ...legacyRoles) {
  const normalizedLegacy = legacyRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User role not found",
      });
    }

    const userRole = normalizeRole(req.user.role);
    if (normalizedLegacy.includes(userRole)) {
      return next();
    }

    const permissions = req.user.permissions || {};
    if (hasPermission(permissions, section, action)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to access this resource",
    });
  };
}

export default authorizePermission;
