import express from 'express';
import multer from 'multer';
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { uploadAttendanceCSV, getAttendanceByDate } from '../controllers/attendanceController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Only admin and hr can access attendance
router.post("/upload",authMiddleware,upload.single("file"),authorizeRoles("admin", "hr"),uploadAttendanceCSV);
router.get("/",authMiddleware,authorizeRoles("admin", "hr"),getAttendanceByDate);


export default router;