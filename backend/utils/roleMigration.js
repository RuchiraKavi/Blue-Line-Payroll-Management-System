import Role from "../models/Role.js";

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
    await Role.insertMany(DEFAULT_ROLES);
  }
}

export async function getAllRoleKeys() {
  await migrateLegacyRoles();
  const roles = await Role.find().select("key").lean();
  return roles.map((role) => role.key);
}
