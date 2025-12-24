// backend/middleware/roleMiddleware.js

const normalizeRole = (role) => {
  if (!role) return role;
  const r = role.toLowerCase();
  if (r === "hr_manager") return "hr";
  if (r === "account_manager" || r === "accountant") return "account";
  return r;
};

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
