// routes/leave.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { requestLeave, getEmployeeLeaves, getLeaves, getLeaveDetails, updateLeaveStatus, getLeavesByUser, getEmployeeLeaveBalance, getTotalLeaveDaysByEmployee } from "../controllers/leaveController.js";

const router = express.Router();

router.get("/total-days-by-employee", authMiddleware, getTotalLeaveDaysByEmployee);
router.post("/request-leave", authMiddleware, requestLeave);
router.get("/", authMiddleware, authorizeRoles("admin", "hr"), getLeaves);
router.get("/user/:userId", authMiddleware, getEmployeeLeaves);
router.get("/employee/:employeeId", authMiddleware, getEmployeeLeaves);
router.get("/detail/:id", authMiddleware, authorizeRoles("admin", "hr"), getLeaveDetails);
router.put("/:id", authMiddleware, authorizeRoles("admin", "hr"), updateLeaveStatus);
router.get("/employees/:id/leave-balance", authMiddleware, getEmployeeLeaveBalance);

export default router;
