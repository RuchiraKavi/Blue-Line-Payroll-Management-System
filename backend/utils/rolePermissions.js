import Role from "../models/Role.js";
import User from "../models/User.js";
import {
  getDefaultPermissionsForRole,
  sanitizePermissions,
} from "./permissionSections.js";
import { migrateLegacyRoles } from "./roleMigration.js";
import { normalizeRole } from "./normalizeRole.js";

export async function getPermissionsForRoleKey(roleKey) {
  await migrateLegacyRoles();
  const key = normalizeRole(roleKey);
  if (!key) return getDefaultPermissionsForRole("");

  const role = await Role.findOne({ key }).lean();
  if (role?.permissions && Object.keys(role.permissions).length > 0) {
    return sanitizePermissions(role.permissions);
  }
  return getDefaultPermissionsForRole(key);
}

export function getRequestUserId(user) {
  if (!user) return null;
  return user._id ?? user.id ?? null;
}

export async function attachPermissionsToUser(user) {
  await migrateLegacyRoles();

  const userId = user?._id ?? user?.id;
  let source = user;
  if (userId) {
    const fresh = await User.findById(userId).select("-password").lean();
    if (fresh) source = fresh;
  }

  const plain = source?.toObject
    ? source.toObject({ virtuals: true })
    : { ...source };
  if (plain._id && !plain.id) {
    plain.id = plain._id;
  }
  plain.role = normalizeRole(plain.role);
  plain.permissions = await getPermissionsForRoleKey(plain.role);
  return plain;
}
