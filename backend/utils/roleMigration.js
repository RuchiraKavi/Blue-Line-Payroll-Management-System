import Role from "../models/Role.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  emptyPermissions,
  sanitizePermissions,
} from "./permissionSections.js";

const DEFAULT_ROLES = [
  { key: "admin", label: "Admin", isSystem: true },
  { key: "hr", label: "HR", isSystem: true },
  { key: "accountant", label: "Accountant", isSystem: true },
  { key: "employee", label: "Employee", isSystem: true },
  { key: "intern", label: "Intern", isSystem: true },
];

export async function migrateLegacyRoles() {
  const count = await Role.countDocuments();
  if (count === 0) {
    await Role.insertMany(
      DEFAULT_ROLES.map((role) => ({
        ...role,
        permissions: sanitizePermissions(
          DEFAULT_ROLE_PERMISSIONS[role.key] || emptyPermissions()
        ),
      }))
    );
    return;
  }

  const roles = await Role.find();
  for (const role of roles) {
    const hasPermissions =
      role.permissions &&
      typeof role.permissions === "object" &&
      Object.keys(role.permissions).length > 0;

    if (!hasPermissions) {
      role.permissions = sanitizePermissions(
        DEFAULT_ROLE_PERMISSIONS[role.key] || emptyPermissions()
      );
      await role.save();
    }
  }
}

export async function getAllRoleKeys() {
  await migrateLegacyRoles();
  const roles = await Role.find().select("key").lean();
  return roles.map((role) => role.key);
}
