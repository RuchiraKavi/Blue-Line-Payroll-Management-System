import express from "express";
import { login, verifyUser } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/verify", authMiddleware, verifyUser);

export default router;
