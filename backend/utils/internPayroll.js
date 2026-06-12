import Leave from "../models/Leave.js";

/** Interns receive one half-day (0.5 day / 4 hours) of leave per calendar month. */
export const INTERN_MONTHLY_LEAVE_DAYS = 0.5;
export const INTERN_MONTHLY_GRACE_HOURS = 4;

export function isInternRole(role) {
  return String(role || "").toLowerCase().trim() === "intern";
}

export function isInternDesignation(designation) {
  return String(designation || "").toLowerCase().trim() === "intern";
}

/** True when employee profile, linked user, or job designation indicates intern. */
export function isInternEmployee(employee) {
  if (!employee) return false;
  const employeeRole = employee.role || "";
  const userRole =
    typeof employee.userId === "object" && employee.userId
      ? employee.userId.role
      : "";
  return (
    isInternRole(employeeRole) ||
    isInternRole(userRole) ||
    isInternDesignation(employee.designation)
  );
}

/** Role string used for payroll/leave rules (intern wins when any intern signal is set). */
export function getEmployeeEffectiveRole(employee) {
  if (isInternEmployee(employee)) return "intern";
  return (
    employee?.role ||
    (typeof employee?.userId === "object" ? employee.userId?.role : "") ||
    ""
  );
}

/** Interns are excluded from employee EPF deduction and employer EPF/ETF contributions. */
export function resolveEpfEtfPayments(totalForEpfBase, role) {
  const base = Math.max(0, Number(totalForEpfBase) || 0);
  if (isInternRole(role)) {
    return {
      total_for_epf: 0,
      epf_payment: 0,
      employer_epf_payment: 0,
      etf_payment: 0,
    };
  }
  return {
    total_for_epf: base,
    epf_payment: Math.round(base * 0.08 * 100) / 100,
    employer_epf_payment: Math.round(base * 0.12 * 100) / 100,
    etf_payment: Math.round(base * 0.03 * 100) / 100,
  };
}

/**
 * Sum approved + pending casual leave days for an intern in a calendar month.
 */
export async function getInternHalfDayUsedInMonth(employeeId, month, year) {
  const monthNum = Number(month);
  const yearNum = Number(year);
  if (!employeeId || !monthNum || !yearNum) return 0;

  const monthStart = new Date(yearNum, monthNum - 1, 1);
  const monthEnd = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  const leaves = await Leave.find({
    employeeId,
    leaveType: "casual",
    status: { $in: ["Approved", "Pending"] },
    startDate: { $lte: monthEnd },
    endDate: { $gte: monthStart },
  }).lean();

  return leaves.reduce((sum, leave) => sum + (Number(leave.totalDays) || 0), 0);
}

export async function getInternHalfDayAvailable(employeeId, month, year) {
  const used = await getInternHalfDayUsedInMonth(employeeId, month, year);
  return Math.max(0, Math.round((INTERN_MONTHLY_LEAVE_DAYS - used) * 100) / 100);
}
