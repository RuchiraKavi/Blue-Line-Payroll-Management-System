export const CRUD_ACTIONS = [
  { key: "create", label: "Create" },
  { key: "read", label: "Read" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
];

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

export function emptyPermissions() {
  const perms = {};
  for (const section of PERMISSION_SECTIONS) {
    perms[section.key] = {
      create: false,
      read: false,
      update: false,
      delete: false,
    };
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

export function hasPermission(permissions, section, action) {
  if (!permissions || !section || !action) return false;
  return Boolean(permissions[section]?.[action]);
}

export function setSectionPermissions(permissions, sectionKey, patch) {
  return {
    ...permissions,
    [sectionKey]: {
      ...permissions[sectionKey],
      ...patch,
    },
  };
}

export function setAllPermissions(permissions, value) {
  const next = { ...permissions };
  for (const section of PERMISSION_SECTIONS) {
    next[section.key] = {
      create: value,
      read: value,
      update: value,
      delete: value,
    };
  }
  return next;
}
