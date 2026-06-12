import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  authorizePermission(
    "dashboard",
    "read",
    "admin",
    "hr",
    "hr_manager",
    "finance"
  ),
  getDashboardStats
);

export default router;
