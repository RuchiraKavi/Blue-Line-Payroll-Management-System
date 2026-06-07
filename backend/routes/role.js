import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const router = express.Router();

router.get("/", authMiddleware, authorizeRoles("admin", "hr"), getAllRoles);
router.post("/add", authMiddleware, authorizeRoles("admin", "hr"), createRole);
router.put("/:id", authMiddleware, authorizeRoles("admin", "hr"), updateRole);
router.delete("/:id", authMiddleware, authorizeRoles("admin", "hr"), deleteRole);

export default router;
