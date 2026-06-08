import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import {
  getAllDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designationController.js";

const router = express.Router();

router.get("/", authMiddleware, authorizePermission("departments", "read", "admin", "hr"), getAllDesignations);
router.post("/add", authMiddleware, authorizePermission("departments", "create", "admin", "hr"), createDesignation);
router.put("/:id", authMiddleware, authorizePermission("departments", "update", "admin", "hr"), updateDesignation);
router.delete("/:id", authMiddleware, authorizePermission("departments", "delete", "admin", "hr"), deleteDesignation);

export default router;
