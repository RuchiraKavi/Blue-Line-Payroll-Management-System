// routes/leave.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import {
  requestLeave,
  getEmployeeLeaves,
  getLeaves,
  getLeaveDetails,
  getLeaveAssignees,
  assignLeave,
  updateLeaveStatus,
  getLeavesByUser,
  getEmployeeLeaveBalance,
  getTotalLeaveDaysByEmployee,
  getLeaveReportApproval,
  saveLeaveReportApproval,
} from "../controllers/leaveController.js";

const router = express.Router();

router.get("/total-days-by-employee", authMiddleware, getTotalLeaveDaysByEmployee);
router.get(
  "/report-approval",
  authMiddleware,
  authorizePermission("leave", "read", "admin", "hr"),
  getLeaveReportApproval
);
router.post(
  "/report-approval",
  authMiddleware,
  authorizePermission("leave", "update", "admin", "hr"),
  saveLeaveReportApproval
);
router.post("/request-leave", authMiddleware, requestLeave);
router.get("/", authMiddleware, authorizePermission("leave", "read", "admin", "hr"), getLeaves);
router.get("/user/:userId", authMiddleware, getEmployeeLeaves);
router.get("/employee/:employeeId", authMiddleware, getEmployeeLeaves);
router.get("/detail/:id", authMiddleware, authorizePermission("leave", "read", "admin", "hr"), getLeaveDetails);
router.get("/:id/assignees", authMiddleware, authorizePermission("leave", "read", "admin", "hr"), getLeaveAssignees);
router.put("/:id/assign", authMiddleware, authorizePermission("leave", "update", "admin", "hr"), assignLeave);
router.put("/:id", authMiddleware, authorizePermission("leave", "update", "admin", "hr"), updateLeaveStatus);
router.get("/employees/:id/leave-balance", authMiddleware, getEmployeeLeaveBalance);

export default router;
