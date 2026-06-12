// backend/middleware/roleMiddleware.js

import { normalizeRole } from "../utils/normalizeRole.js";

const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {

    // Check if user info exists (from authMiddleware)
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User role not found",
      });
    }

    const userRole = normalizeRole(req.user.role);

    // Check if user's normalized role is allowed
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to access this resource",
      });
    }

    // User has permission
    next();
  };
};

export default authorizeRoles;
