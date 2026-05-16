import express from 'express';
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { addDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import {
  getDesignationsByDepartment,
  addDesignation,
  updateDesignation,
  deleteDesignation,
} from '../controllers/designationController.js';

const router = express.Router();

// Only admin and hr can access departments
router.get('/', authMiddleware, authorizeRoles("admin", "hr"), getDepartments);
router.post('/add', authMiddleware, authorizeRoles("admin", "hr"), addDepartment);

// Department designations (must be before /:id routes)
router.get('/:departmentId/designations', authMiddleware, authorizeRoles("admin", "hr"), getDesignationsByDepartment);
router.post('/:departmentId/designations', authMiddleware, authorizeRoles("admin", "hr"), addDesignation);
router.put('/:departmentId/designations/:designationId', authMiddleware, authorizeRoles("admin", "hr"), updateDesignation);
router.delete('/:departmentId/designations/:designationId', authMiddleware, authorizeRoles("admin", "hr"), deleteDesignation);

router.get('/:id', authMiddleware, authorizeRoles("admin", "hr"), getDepartment);
router.put('/:id', authMiddleware, authorizeRoles("admin", "hr"), updateDepartment);
router.delete('/:id', authMiddleware, authorizeRoles("admin", "hr"), deleteDepartment);

export default router;