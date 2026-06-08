import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import {
  getPermissionSections,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const router = express.Router();

router.get(
  "/sections",
  authMiddleware,
  authorizePermission("roles", "read", "admin", "hr"),
  getPermissionSections
);
router.get(
  "/",
  authMiddleware,
  authorizePermission("roles", "read", "admin", "hr"),
  getAllRoles
);
router.post(
  "/add",
  authMiddleware,
  authorizePermission("roles", "create", "admin", "hr"),
  createRole
);
router.put(
  "/:id",
  authMiddleware,
  authorizePermission("roles", "update", "admin", "hr"),
  updateRole
);
router.delete(
  "/:id",
  authMiddleware,
  authorizePermission("roles", "delete", "admin", "hr"),
  deleteRole
);

export default router;
