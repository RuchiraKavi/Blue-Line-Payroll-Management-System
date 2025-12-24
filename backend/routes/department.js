import express from 'express';
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { addDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';

const router = express.Router();

// Only admin and hr can access departments
router.get('/', authMiddleware, authorizeRoles("admin", "hr"), getDepartments);
router.post('/add', authMiddleware, authorizeRoles("admin", "hr"), addDepartment);
router.get('/:id', authMiddleware, authorizeRoles("admin", "hr"), getDepartment);
router.put('/:id', authMiddleware, authorizeRoles("admin", "hr"), updateDepartment);
router.delete('/:id', authMiddleware, authorizeRoles("admin", "hr"), deleteDepartment);

export default router;