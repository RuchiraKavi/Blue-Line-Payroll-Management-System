    import express from "express";
    import authMiddleware from "../middleware/authMiddleware.js";
    import { addEmployee, upload, getEmployee, viewEmployee, removeEmployee, updateEmployee, getLastEmployeeId, getMyEmployeeProfile, updateMyEmployeeProfile } from "../controllers/employeeController.js";
    import { getEmployeeLeaveBalance } from "../controllers/leaveController.js";
    import authorizeRoles from "../middleware/roleMiddleware.js";

    const router = express.Router();

    // Specific paths first (before /:id) to avoid 404
    router.get("/last-id", authMiddleware, authorizeRoles("admin", "hr", "manager"), getLastEmployeeId);
    router.get("/me/profile", authMiddleware, getMyEmployeeProfile);
    router.put("/me/profile", authMiddleware, upload.single("image"), updateMyEmployeeProfile);
    router.get("/:id/leave-balance", authMiddleware, getEmployeeLeaveBalance);

    // Only admin and hr can view all employees
    router.get("/", authMiddleware, authorizeRoles("admin", "hr"), getEmployee);
    router.post("/add", authMiddleware, authorizeRoles("admin", "hr"), upload.single("image"), addEmployee);

    // Generic :id routes last
    router.get("/:id", authMiddleware, viewEmployee);
    router.put("/:id", authMiddleware, authorizeRoles("admin", "hr", "employee"), upload.single("image"), updateEmployee);
    router.delete("/:id", authMiddleware, authorizeRoles("admin", "hr"), removeEmployee);

    export default router;
