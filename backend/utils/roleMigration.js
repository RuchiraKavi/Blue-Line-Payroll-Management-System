import Role from "../models/Role.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  emptyPermissions,
  getDefaultPermissionsForRole,
  sanitizePermissions,
} from "./permissionSections.js";
import { FINANCE_ROLE_KEYS, LEGACY_FINANCE_ROLES } from "./normalizeRole.js";

const DEFAULT_ROLES = [
  { key: "admin", label: "Admin", isSystem: true },
  { key: "hr", label: "HR", isSystem: true },
  { key: "finance", label: "Finance", isSystem: true },
  { key: "employee", label: "Employee", isSystem: true },
  { key: "intern", label: "Intern", isSystem: true },
];

function sectionHasAnyAccess(sectionPerms) {
  if (!sectionPerms || typeof sectionPerms !== "object") return false;
  return Boolean(sectionPerms.create || sectionPerms.read || sectionPerms.update || sectionPerms.delete);
}

/** Copy legacy combined departments access into the new designations section. */
async function migrateDesignationsPermissionSection() {
  const roles = await Role.find();
  for (const role of roles) {
    const perms = sanitizePermissions(role.permissions);
    const departments = perms.departments || {};
    const designations = perms.designations || {};

    if (sectionHasAnyAccess(departments) && !sectionHasAnyAccess(designations)) {
      perms.designations = { ...departments };
      role.permissions = perms;
      role.markModified("permissions");
      await role.save();
      continue;
    }

    const defaults = getDefaultPermissionsForRole(role.key);
    if (
      sectionHasAnyAccess(defaults.designations) &&
      !sectionHasAnyAccess(designations)
    ) {
      perms.designations = { ...defaults.designations };
      role.permissions = perms;
      role.markModified("permissions");
      await role.save();
    }
  }
}

async function migrateAccountantRoleToFinance() {
  const financeRole = await Role.findOne({ key: "finance" });
  const accountantRole = await Role.findOne({ key: "accountant" });

  if (accountantRole && !financeRole) {
    accountantRole.key = "finance";
    accountantRole.label = "Finance";
    accountantRole.isSystem = true;
    if (!accountantRole.permissions || !Object.keys(accountantRole.permissions).length) {
      accountantRole.permissions = getDefaultPermissionsForRole("finance");
    }
    await accountantRole.save();
  } else if (!financeRole) {
    await Role.create({
      key: "finance",
      label: "Finance",
      isSystem: true,
      permissions: getDefaultPermissionsForRole("finance"),
    });
  }

  await User.updateMany(
    { role: { $in: LEGACY_FINANCE_ROLES } },
    { $set: { role: "finance" } }
  );

  await Employee.updateMany(
    { role: { $in: LEGACY_FINANCE_ROLES } },
    { $set: { role: "finance" } }
  );

  // Remove duplicate accountant role if finance was created separately
  if (accountantRole && financeRole) {
    await Role.deleteOne({ key: "accountant" });
  }
}

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

  await migrateAccountantRoleToFinance();

  const roles = await Role.find();
  for (const role of roles) {
    const hasPermissions =
      role.permissions &&
      typeof role.permissions === "object" &&
      Object.keys(role.permissions).length > 0;

    if (!hasPermissions) {
      role.permissions = getDefaultPermissionsForRole(role.key);
      await role.save();
    }
  }

  await migrateDesignationsPermissionSection();
}

export async function getAllRoleKeys() {
  await migrateLegacyRoles();
  const roles = await Role.find().select("key").lean();
  return roles.map((role) => role.key);
}

export { FINANCE_ROLE_KEYS };
