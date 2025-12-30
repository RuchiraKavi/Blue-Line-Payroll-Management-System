// routes/leave.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { requestLeave, getEmployeeLeaves } from "../controllers/leaveController.js";

const router = express.Router();

router.post("/request-leave", authMiddleware, requestLeave);
router.get("/user/:userId", authMiddleware, getEmployeeLeaves);

export default router;
