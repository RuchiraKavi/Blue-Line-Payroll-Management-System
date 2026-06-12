export const CRUD_ACTIONS = ["create", "read", "update", "delete"];

export const PERMISSION_SECTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "departments", label: "Departments" },
  { key: "designations", label: "Designations" },
  { key: "employees", label: "Employees" },
  { key: "roles", label: "Roles" },
  { key: "attendance", label: "Attendance" },
  { key: "leave", label: "Leave" },
  { key: "salary", label: "Salary" },
  { key: "advance", label: "Advance Requests" },
];

const allCrud = () => ({
  create: true,
  read: true,
  update: true,
  delete: true,
});

const readOnly = () => ({
  create: false,
  read: true,
  update: false,
  delete: false,
});

const crudNoDelete = () => ({
  create: true,
  read: true,
  update: true,
  delete: false,
});

const emptySection = () => ({
  create: false,
  read: false,
  update: false,
  delete: false,
});

export function emptyPermissions() {
  const perms = {};
  for (const section of PERMISSION_SECTIONS) {
    perms[section.key] = emptySection();
  }
  return perms;
}

export function sanitizePermissions(input) {
  const perms = emptyPermissions();
  if (!input || typeof input !== "object") return perms;

  for (const section of PERMISSION_SECTIONS) {
    const src = input[section.key] || {};
    perms[section.key] = {
      create: Boolean(src.create),
      read: Boolean(src.read),
      update: Boolean(src.update),
      delete: Boolean(src.delete),
    };
  }
  return perms;
}

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    dashboard: allCrud(),
    departments: allCrud(),
    designations: allCrud(),
    employees: allCrud(),
    roles: allCrud(),
    attendance: allCrud(),
    leave: allCrud(),
    salary: allCrud(),
    advance: allCrud(),
  },
  hr: {
    dashboard: readOnly(),
    departments: allCrud(),
    designations: allCrud(),
    employees: allCrud(),
    roles: allCrud(),
    attendance: allCrud(),
    leave: allCrud(),
    salary: crudNoDelete(),
    advance: readOnly(),
  },
  finance: {
    dashboard: readOnly(),
    departments: emptySection(),
    designations: emptySection(),
    employees: emptySection(),
    roles: emptySection(),
    attendance: emptySection(),
    leave: emptySection(),
    salary: allCrud(),
    advance: { create: false, read: true, update: true, delete: false },
  },
  employee: emptyPermissions(),
  intern: emptyPermissions(),
};

export function getDefaultPermissionsForRole(roleKey) {
  const key = String(roleKey || "").toLowerCase();
  const normalized =
    key === "hr_manager"
      ? "hr"
      : key === "finance" ||
          key === "account" ||
          key === "account_manager" ||
          key === "accountant"
        ? "finance"
        : key;

  if (DEFAULT_ROLE_PERMISSIONS[normalized]) {
    return sanitizePermissions(DEFAULT_ROLE_PERMISSIONS[normalized]);
  }
  return emptyPermissions();
}

export function hasPermission(permissions, section, action) {
  if (!permissions || !section || !action) return false;
  return Boolean(permissions[section]?.[action]);
}
