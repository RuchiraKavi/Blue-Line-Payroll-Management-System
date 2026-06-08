import Role from "../models/Role.js";
import {
  getDefaultPermissionsForRole,
  sanitizePermissions,
} from "./permissionSections.js";
import { migrateLegacyRoles } from "./roleMigration.js";

export async function getPermissionsForRoleKey(roleKey) {
  await migrateLegacyRoles();
  const key = String(roleKey || "").trim().toLowerCase();
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
  const plain = user?.toObject
    ? user.toObject({ virtuals: true })
    : { ...user };
  if (plain._id && !plain.id) {
    plain.id = plain._id;
  }
  plain.permissions = await getPermissionsForRoleKey(plain.role);
  return plain;
}
