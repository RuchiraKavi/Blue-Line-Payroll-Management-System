import { hasPermission } from "../utils/permissionSections.js";
import { normalizeRole } from "../utils/normalizeRole.js";

/**
 * Allow legacy system roles OR users whose role catalog permissions grant section+action.
 */
/** Allow if any listed section+action pair is granted (after legacy role check). */
export function authorizePermissionOr(pairs, ...legacyRoles) {
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
    for (const [section, action] of pairs) {
      if (hasPermission(permissions, section, action)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to access this resource",
    });
  };
}

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
