import express from 'express';
import multer from 'multer';
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { uploadAttendanceCSV, getAttendanceByDate, getAttendanceByEmployee, getAttendanceSummary } from '../controllers/attendanceController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Only admin and hr can access attendance
router.post("/upload", authMiddleware, upload.single("file"), authorizeRoles("admin", "hr"), uploadAttendanceCSV);
router.get("/", authMiddleware, authorizeRoles("admin", "hr"), getAttendanceByDate);
router.get("/summary", authMiddleware, authorizeRoles("admin", "hr"), getAttendanceSummary);
router.get("/employee/:employeeId", authMiddleware, authorizeRoles("admin", "hr"), getAttendanceByEmployee);


export default router;