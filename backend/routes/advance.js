import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import {
  requestAdvance,
  getMyAdvanceRequests,
  getAdvanceRequests,
  updateAdvanceStatus,
  getAcceptedTotals,
} from "../controllers/advanceController.js";

const router = express.Router();

const advanceRoles = ["admin", "hr", "finance"];

router.post("/request", authMiddleware, requestAdvance);
router.get("/my-requests", authMiddleware, getMyAdvanceRequests);

router.get(
  "/",
  authMiddleware,
  authorizePermission("advance", "read", ...advanceRoles),
  getAdvanceRequests
);
router.get(
  "/accepted-totals",
  authMiddleware,
  authorizePermission("advance", "read", ...advanceRoles),
  getAcceptedTotals
);
router.put(
  "/:id/status",
  authMiddleware,
  authorizePermission("advance", "update", ...advanceRoles),
  updateAdvanceStatus
);

export default router;
