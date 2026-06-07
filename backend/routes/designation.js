import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import {
  getAllDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designationController.js";

const router = express.Router();

router.get("/", authMiddleware, authorizeRoles("admin", "hr"), getAllDesignations);
router.post("/add", authMiddleware, authorizeRoles("admin", "hr"), createDesignation);
router.put("/:id", authMiddleware, authorizeRoles("admin", "hr"), updateDesignation);
router.delete("/:id", authMiddleware, authorizeRoles("admin", "hr"), deleteDesignation);

export default router;
