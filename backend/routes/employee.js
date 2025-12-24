    import express from "express";
    import authMiddleware from "../middleware/authMiddleware.js";
    import { addEmployee, upload, getEmployee, viewEmployee, removeEmployee, updateEmployee, getLastEmployeeId } from "../controllers/employeeController.js";
    import authorizeRoles from "../middleware/roleMiddleware.js";

    const router = express.Router();

    // Get last employee ID and generate next ID (accessible to authenticated users)
    router.get("/last-id", authMiddleware, authorizeRoles("admin", "hr", "manager"), getLastEmployeeId);

    // Only admin and hr can view all employees
    router.get("/", authMiddleware, authorizeRoles("admin", "hr"), getEmployee);
    // Only admin and hr can add employees
    router.post("/add", authMiddleware, authorizeRoles("admin", "hr"), upload.single("image"), addEmployee);
    // All authenticated users can view a single employee
    router.get("/:id", authMiddleware, viewEmployee);
    // Only admin and hr can update employees
    router.put("/:id", authMiddleware, authorizeRoles("admin", "hr"), upload.single("image"), updateEmployee);
    // Only admin and hr can delete employees
    router.delete('/:id', authMiddleware, authorizeRoles("admin", "hr"), removeEmployee);

    export default router;
