import {
  getPayrollDivisor,
  toLocalDateOnly,
} from "./payrollAttendance.js";
import { getEmployeeEffectiveRole } from "./internPayroll.js";

export function getPreviousPayPeriod(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (m === 1) return { month: 12, year: y - 1 };
  return { month: m - 1, year: y };
}

/** Employee joined during this pay period — salary deferred to next month. */
export function isJoinMonth(joinedDate, month, year) {
  const join = toLocalDateOnly(joinedDate);
  if (!join) return false;
  return join.getFullYear() === Number(year) && join.getMonth() + 1 === Number(month);
}

/** First salary month after join month (includes prior join-month work pay). */
export function isFirstPayMonth(joinedDate, month, year) {
  const prev = getPreviousPayPeriod(month, year);
  return isJoinMonth(joinedDate, prev.month, prev.year);
}

/** Included in salary list for this period (joined on/before month end, not join month). */
export function isEmployeeEligibleForPayPeriod(joinedDate, month, year) {
  const join = toLocalDateOnly(joinedDate);
  if (!join) return false;

  const monthEnd = new Date(Number(year), Number(month), 0);
  if (join > monthEnd) return false;
  if (isJoinMonth(joinedDate, month, year)) return false;
  return true;
}

/**
 * Present attendance days in join month on/after join date.
 * Uses join-month attendance only (status Present) — not calendar days.
 */
export function getJoinMonthWorkedDays(joinedDate, joinMonth, joinYear, presentDates = []) {
  const join = toLocalDateOnly(joinedDate);
  const monthStart = new Date(Number(joinYear), Number(joinMonth) - 1, 1);
  const monthEnd = new Date(Number(joinYear), Number(joinMonth), 0);
  if (!join || join < monthStart || join > monthEnd) return 0;
  if (!Array.isArray(presentDates) || presentDates.length === 0) return 0;

  const joinTime = join.getTime();
  const monthEndTime = monthEnd.getTime();
  const seen = new Set();
  let count = 0;

  for (const raw of presentDates) {
    const day = toLocalDateOnly(raw);
    if (!day) continue;
    const t = day.getTime();
    if (t < joinTime || t > monthEndTime) continue;
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    count += 1;
  }

  return count;
}

function presentDatesForEmployee(presentDatesMap, employee) {
  if (!presentDatesMap) return [];
  const id = String(employee?._id ?? employee);
  return presentDatesMap.get(id) || [];
}

/**
 * Pro-rated earnings for join-month attendance days (basic + fixed allowances, excludes bonus).
 * Paid with the following month's salary.
 */
export function calculateJoinMonthCarryForward(
  employee,
  joinMonth,
  joinYear,
  presentDates = []
) {
  const workedDays = getJoinMonthWorkedDays(
    employee?.joined_date,
    joinMonth,
    joinYear,
    presentDates
  );
  if (workedDays <= 0) {
    return { amount: 0, workedDays: 0, joinMonth, joinYear };
  }

  const role = getEmployeeEffectiveRole(employee);
  const divisor = getPayrollDivisor(role);
  const basic = Number(employee?.basic_salary) || 0;
  const travel = Number(employee?.travel_allowance) || 0;
  const food = Number(employee?.food_allowance) || 0;
  const holiday = Number(employee?.holiday_payment) || 0;
  const allowanceNs = Number(employee?.allowance_ns) || 0;
  const monthlyEarnings = basic + travel + food + holiday + allowanceNs;
  const amount =
    Math.round((monthlyEarnings / divisor) * workedDays * 100) / 100;

  return { amount, workedDays, joinMonth, joinYear };
}

export function applyJoinMonthCarryToSalaryInput(
  input,
  employee,
  month,
  year,
  presentDatesMap = null
) {
  if (!isFirstPayMonth(employee?.joined_date, month, year)) {
    return {
      ...input,
      join_month_carry_forward: 0,
      join_month_worked_days: 0,
    };
  }

  const prev = getPreviousPayPeriod(month, year);
  const presentDates = presentDatesForEmployee(presentDatesMap, employee);
  const carry = calculateJoinMonthCarryForward(
    employee,
    prev.month,
    prev.year,
    presentDates
  );
  return {
    ...input,
    join_month_carry_forward: carry.amount,
    join_month_worked_days: carry.workedDays,
  };
}

export function buildDeferredEmployeeSummary(employee, month, year, presentDatesMap = null) {
  const emp = employee?.toObject ? employee.toObject() : employee;
  const join = toLocalDateOnly(emp.joined_date);
  const monthEnd = new Date(Number(year), Number(month), 0);

  if (join && join > monthEnd) {
    return {
      _id: emp._id,
      employee_id: emp.employee_id,
      name: emp.userId?.name || "N/A",
      joined_date: emp.joined_date,
      join_month_worked_days: 0,
      join_month_carry_forward: 0,
      reason: "not_yet_joined",
      message: "Not yet joined in this pay period.",
    };
  }

  const presentDates = presentDatesForEmployee(presentDatesMap, emp);
  const carry = calculateJoinMonthCarryForward(emp, month, year, presentDates);
  const message =
    carry.workedDays > 0
      ? `Salary starts next month. Join-month pay for ${carry.workedDays} attendance day(s) (Rs. ${carry.amount.toLocaleString("en-LK")}) will be paid with next month's salary.`
      : "Salary starts next month. Join-month pay will be calculated from join-month attendance when it is uploaded.";

  return {
    _id: emp._id,
    employee_id: emp.employee_id,
    name: emp.userId?.name || "N/A",
    joined_date: emp.joined_date,
    join_month_worked_days: carry.workedDays,
    join_month_carry_forward: carry.amount,
    reason: "join_month",
    message,
  };
}
