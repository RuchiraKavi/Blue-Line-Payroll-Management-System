    import express from "express";
    import authMiddleware from "../middleware/authMiddleware.js";
    import { addEmployee, upload, getEmployee, viewEmployee,removeEmployee, updateEmployee } from "../controllers/employeeController.js";

    const router = express.Router();

    router.get("/", authMiddleware, getEmployee)
    router.post("/add", authMiddleware, upload.single("image"), addEmployee);
    router.get("/:id", authMiddleware, viewEmployee)
    router.put("/:id", authMiddleware, upload.single("image"), updateEmployee);
    router.delete('/:id', authMiddleware, removeEmployee);

    export default router;
