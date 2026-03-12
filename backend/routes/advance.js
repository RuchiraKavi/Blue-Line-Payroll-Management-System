import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import {
  requestAdvance,
  getMyAdvanceRequests,
  getAdvanceRequests,
  updateAdvanceStatus,
} from "../controllers/advanceController.js";

const router = express.Router();

router.post("/request", authMiddleware, requestAdvance);
router.get("/my-requests", authMiddleware, getMyAdvanceRequests);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "hr", "account", "accountant", "account_manager"),
  getAdvanceRequests
);
router.put(
  "/:id/status",
  authMiddleware,
  authorizeRoles("admin", "hr", "account", "accountant", "account_manager"),
  updateAdvanceStatus
);

export default router;
