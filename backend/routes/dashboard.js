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
    "account",
    "accountant",
    "account_manager"
  ),
  getDashboardStats
);

export default router;
