import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import {
  getEmployeesForSalary,
  calculateSalary,
  saveSalaryRun,
  saveOneSalaryEntry,
  savePayslipSignature,
  getPayslip,
  getSalaryRuns,
  getContributionHistory,
  getMySalaryHistory,
  getMyPayslip,
} from "../controllers/salaryController.js";

const router = express.Router();

const salaryRoles = ["admin", "account", "accountant", "account_manager"];

router.get("/my-history", authMiddleware, getMySalaryHistory);
router.get("/me/payslip", authMiddleware, getMyPayslip);

router.get(
  "/employees",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  getEmployeesForSalary
);

router.post(
  "/calculate",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  calculateSalary
);

router.post(
  "/save",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  saveSalaryRun
);

router.post(
  "/save-one",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  saveOneSalaryEntry
);

router.post(
  "/signature",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  savePayslipSignature
);

router.get(
  "/runs",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  getSalaryRuns
);

router.get(
  "/contribution-history/:employeeId",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  getContributionHistory
);

router.get(
  "/payslip/:employeeId",
  authMiddleware,
  authorizeRoles(...salaryRoles),
  getPayslip
);

export default router;
