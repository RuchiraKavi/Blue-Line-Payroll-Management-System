import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizePermission } from "../middleware/permissionMiddleware.js";
import {
  getEmployeesForSalary,
  getNoPayForPeriod,
  calculateSalary,
  saveSalaryRun,
  saveOneSalaryEntry,
  savePayslipSignature,
  unfinalizeSalaryRun,
  getPayslip,
  getSalaryRuns,
  getContributionHistory,
  getMySalaryHistory,
  getEmployeeSalaryHistory,
  getMyPayslip,
} from "../controllers/salaryController.js";

const router = express.Router();

const salaryRoles = ["admin", "hr", "hr_manager", "account", "accountant", "account_manager"];

router.get("/my-history", authMiddleware, getMySalaryHistory);
router.get("/me/payslip", authMiddleware, getMyPayslip);

router.get(
  "/employee-history/:employeeId",
  authMiddleware,
  authorizePermission("salary", "read", ...salaryRoles),
  getEmployeeSalaryHistory
);

router.get(
  "/employees",
  authMiddleware,
  authorizePermission("salary", "read", ...salaryRoles),
  getEmployeesForSalary
);

router.get(
  "/no-pay",
  authMiddleware,
  authorizePermission("salary", "read", ...salaryRoles),
  getNoPayForPeriod
);

router.post(
  "/calculate",
  authMiddleware,
  authorizePermission("salary", "update", ...salaryRoles),
  calculateSalary
);

router.post(
  "/save",
  authMiddleware,
  authorizePermission("salary", "update", ...salaryRoles),
  saveSalaryRun
);

router.post(
  "/save-one",
  authMiddleware,
  authorizePermission("salary", "update", ...salaryRoles),
  saveOneSalaryEntry
);

router.post(
  "/signature",
  authMiddleware,
  authorizePermission("salary", "update", ...salaryRoles),
  savePayslipSignature
);

router.post(
  "/unfinalize",
  authMiddleware,
  authorizePermission("salary", "update", ...salaryRoles),
  unfinalizeSalaryRun
);

router.get(
  "/runs",
  authMiddleware,
  authorizePermission("salary", "read", ...salaryRoles),
  getSalaryRuns
);

router.get(
  "/contribution-history/:employeeId",
  authMiddleware,
  authorizePermission("salary", "read", ...salaryRoles),
  getContributionHistory
);

router.get(
  "/payslip/:employeeId",
  authMiddleware,
  authorizePermission("salary", "read", ...salaryRoles),
  getPayslip
);

export default router;
