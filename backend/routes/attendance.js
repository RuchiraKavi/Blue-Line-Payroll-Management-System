import express from 'express';
import multer from 'multer';
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import {
  uploadAttendanceCSV,
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAttendanceSummary,
  getAttendanceReportApproval,
  saveAttendanceReportApproval,
} from '../controllers/attendanceController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post("/upload", authMiddleware, upload.single("file"), authorizePermission("attendance", "create", "admin", "hr"), uploadAttendanceCSV);
router.get(
  "/report-approval",
  authMiddleware,
  authorizePermission("attendance", "read", "admin", "hr"),
  getAttendanceReportApproval
);
router.post(
  "/report-approval",
  authMiddleware,
  authorizePermission("attendance", "update", "admin", "hr"),
  saveAttendanceReportApproval
);
router.get("/", authMiddleware, authorizePermission("attendance", "read", "admin", "hr"), getAttendanceByDate);
router.get("/summary", authMiddleware, authorizePermission("attendance", "read", "admin", "hr"), getAttendanceSummary);
router.get("/employee/:employeeId", authMiddleware, authorizePermission("attendance", "read", "admin", "hr"), getAttendanceByEmployee);

export default router;
