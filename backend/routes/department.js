import express from 'express';
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission, authorizePermissionOr } from "../middleware/permissionMiddleware.js";
import { addDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import {
  getDesignationsByDepartment,
  assignDesignationToDepartment,
  unassignDesignationFromDepartment,
} from '../controllers/designationController.js';

const router = express.Router();

router.get('/', authMiddleware, authorizePermission("departments", "read", "admin", "hr"), getDepartments);
router.post('/add', authMiddleware, authorizePermission("departments", "create", "admin", "hr"), addDepartment);

router.get(
  '/:departmentId/designations',
  authMiddleware,
  authorizePermissionOr(
    [
      ["designations", "read"],
      ["employees", "create"],
      ["employees", "update"],
    ],
    "admin",
    "hr"
  ),
  getDesignationsByDepartment
);
router.post('/:departmentId/designations/assign', authMiddleware, authorizePermission("designations", "update", "admin", "hr"), assignDesignationToDepartment);
router.delete('/:departmentId/designations/:designationId', authMiddleware, authorizePermission("designations", "delete", "admin", "hr"), unassignDesignationFromDepartment);

router.get('/:id', authMiddleware, authorizePermission("departments", "read", "admin", "hr"), getDepartment);
router.put('/:id', authMiddleware, authorizePermission("departments", "update", "admin", "hr"), updateDepartment);
router.delete('/:id', authMiddleware, authorizePermission("departments", "delete", "admin", "hr"), deleteDepartment);

export default router;
