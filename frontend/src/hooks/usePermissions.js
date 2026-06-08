import { useMemo } from "react";
import { useAuth } from "./useAuth.js";
import { hasPermission } from "../utils/permissionSections.js";

export function usePermissions() {
  const { user } = useAuth();
  const permissions = user?.permissions || {};

  return useMemo(
    () => ({
      permissions,
      can: (section, action) => hasPermission(permissions, section, action),
      canRead: (section) => hasPermission(permissions, section, "read"),
    }),
    [permissions]
  );
}

export default usePermissions;
