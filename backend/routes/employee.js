import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import { addEmployee, upload, getEmployee, viewEmployee, removeEmployee, updateEmployee, updateEmployeeRole, getLastEmployeeId, getMyEmployeeProfile, updateMyEmployeeProfile } from "../controllers/employeeController.js";
import { getEmployeeLeaveBalance } from "../controllers/leaveController.js";

const router = express.Router();

router.get("/last-id", authMiddleware, authorizePermission("employees", "create", "admin", "hr", "manager"), getLastEmployeeId);
router.get("/me/profile", authMiddleware, getMyEmployeeProfile);
router.put("/me/profile", authMiddleware, upload.single("image"), updateMyEmployeeProfile);
router.get("/:id/leave-balance", authMiddleware, getEmployeeLeaveBalance);
router.put("/:id/role", authMiddleware, authorizePermission("roles", "update", "admin", "hr"), updateEmployeeRole);

router.get("/", authMiddleware, authorizePermission("employees", "read", "admin", "hr"), getEmployee);
router.post("/add", authMiddleware, authorizePermission("employees", "create", "admin", "hr"), upload.single("image"), addEmployee);

router.get("/:id", authMiddleware, viewEmployee);
router.put("/:id", authMiddleware, authorizePermission("employees", "update", "admin", "hr", "employee"), upload.single("image"), updateEmployee);
router.delete("/:id", authMiddleware, authorizePermission("employees", "delete", "admin", "hr"), removeEmployee);

export default router;
