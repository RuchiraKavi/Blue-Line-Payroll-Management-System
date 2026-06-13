import Role from "../models/Role.js";
import User from "../models/User.js";
import { migrateLegacyRoles } from "../utils/roleMigration.js";
import { LEGACY_FINANCE_ROLES } from "../utils/normalizeRole.js";
import {
  PERMISSION_SECTIONS,
  sanitizePermissions,
} from "../utils/permissionSections.js";

const CANONICAL_ROLE_LABELS = {
  admin: "Admin",
  hr: "HR",
  finance: "Finance",
  employee: "Employee",
  intern: "Intern",
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ROLE_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const getPermissionSections = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      sections: PERMISSION_SECTIONS,
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Failed to load permission sections",
    });
  }
};

const getAllRoles = async (req, res) => {
  try {
    await migrateLegacyRoles();

    const roles = await Role.find().sort({ label: 1 }).lean();
    const filtered = roles
      .filter((role) => !LEGACY_FINANCE_ROLES.includes(role.key))
      .map((role) => ({
        ...role,
        label: CANONICAL_ROLE_LABELS[role.key] || role.label,
      }));

    return res.status(200).json({ success: true, roles: filtered });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Get all roles server error",
    });
  }
};

const createRole = async (req, res) => {
  try {
    await migrateLegacyRoles();

    const { key, label, permissions } = req.body;
    const normalizedKey = normalizeKey(key);
    const trimmedLabel = String(label || "").trim();
    const sanitizedPermissions = sanitizePermissions(permissions);

    if (!normalizedKey) {
      return res.status(400).json({
        success: false,
        message: "Role key is required",
      });
    }

    if (!ROLE_KEY_PATTERN.test(normalizedKey)) {
      return res.status(400).json({
        success: false,
        message:
          "Role key must start with a letter and contain only lowercase letters, numbers, or underscores",
      });
    }

    if (!trimmedLabel) {
      return res.status(400).json({
        success: false,
        message: "Role label is required",
      });
    }

    const existing = await Role.findOne({
      key: { $regex: new RegExp(`^${escapeRegex(normalizedKey)}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This role key already exists",
      });
    }

    const role = await Role.create({
      key: normalizedKey,
      label: trimmedLabel,
      isSystem: false,
      permissions: sanitizedPermissions,
    });

    return res.status(201).json({
      success: true,
      role,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This role key already exists",
      });
    }
    return res.status(500).json({
      success: false,
      error: "Add role server error",
    });
  }
};

const updateRole = async (req, res) => {
  try {
    await migrateLegacyRoles();

    const { id } = req.params;
    const { key, label, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const trimmedLabel = String(label || "").trim();
    if (!trimmedLabel) {
      return res.status(400).json({
        success: false,
        message: "Role label is required",
      });
    }

    const normalizedKey = normalizeKey(key);
    if (!normalizedKey) {
      return res.status(400).json({
        success: false,
        message: "Role key is required",
      });
    }

    if (!ROLE_KEY_PATTERN.test(normalizedKey)) {
      return res.status(400).json({
        success: false,
        message:
          "Role key must start with a letter and contain only lowercase letters, numbers, or underscores",
      });
    }

    const duplicate = await Role.findOne({
      _id: { $ne: id },
      key: { $regex: new RegExp(`^${escapeRegex(normalizedKey)}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "This role key already exists",
      });
    }

    const oldKey = role.key;
    role.key = normalizedKey;
    role.label = trimmedLabel;
    if (permissions !== undefined) {
      role.permissions = sanitizePermissions(permissions);
    }
    await role.save();

    if (oldKey !== normalizedKey) {
      await User.updateMany({ role: oldKey }, { role: normalizedKey });
    }

    return res.status(200).json({
      success: true,
      role,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This role key already exists",
      });
    }
    return res.status(500).json({
      success: false,
      error: "Update role server error",
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    await migrateLegacyRoles();

    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: "System roles cannot be deleted",
      });
    }

    const usersWithRole = await User.countDocuments({ role: role.key });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete this role because one or more users are assigned to it",
      });
    }

    await Role.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Delete role server error",
    });
  }
};

export {
  getPermissionSections,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
};
