import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("admin", "hr", "hr_manager", "account", "accountant", "account_manager"),
  getDashboardStats
);

export default router;
