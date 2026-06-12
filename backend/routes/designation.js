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

router.get("/", authMiddleware, authorizePermission("designations", "read", "admin", "hr"), getAllDesignations);
router.post("/add", authMiddleware, authorizePermission("designations", "create", "admin", "hr"), createDesignation);
router.put("/:id", authMiddleware, authorizePermission("designations", "update", "admin", "hr"), updateDesignation);
router.delete("/:id", authMiddleware, authorizePermission("designations", "delete", "admin", "hr"), deleteDesignation);

export default router;
