import {
  getPayrollDivisor,
  toLocalDateOnly,
} from "./payrollAttendance.js";

export function getPreviousPayPeriod(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (m === 1) return { month: 12, year: y - 1 };
  return { month: m - 1, year: y };
}

export function isJoinMonth(joinedDate, month, year) {
  const join = toLocalDateOnly(joinedDate);
  if (!join) return false;
  return join.getFullYear() === Number(year) && join.getMonth() + 1 === Number(month);
}

export function isFirstPayMonth(joinedDate, month, year) {
  const prev = getPreviousPayPeriod(month, year);
  return isJoinMonth(joinedDate, prev.month, prev.year);
}

export function isEmployeeEligibleForPayPeriod(joinedDate, month, year) {
  const join = toLocalDateOnly(joinedDate);
  if (!join) return false;
  const monthEnd = new Date(Number(year), Number(month), 0);
  if (join > monthEnd) return false;
  if (isJoinMonth(joinedDate, month, year)) return false;
  return true;
}

/** Present attendance days in join month on/after join date. */
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

export function calculateJoinMonthCarryForward(employee, joinMonth, joinYear, presentDates = []) {
  const workedDays = getJoinMonthWorkedDays(employee?.joined_date, joinMonth, joinYear, presentDates);
  if (workedDays <= 0) {
    return { amount: 0, workedDays: 0, joinMonth, joinYear };
  }
  const role = employee?.role || employee?.userId?.role || "";
  const divisor = getPayrollDivisor(role);
  const basic = Number(employee?.basic_salary) || 0;
  const travel = Number(employee?.travel_allowance) || 0;
  const food = Number(employee?.food_allowance) || 0;
  const holiday = Number(employee?.holiday_payment) || 0;
  const allowanceNs = Number(employee?.allowance_ns) || 0;
  const monthlyEarnings = basic + travel + food + holiday + allowanceNs;
  const amount = Math.round((monthlyEarnings / divisor) * workedDays * 100) / 100;
  return { amount, workedDays, joinMonth, joinYear };
}

/** True when join-month carry-forward should appear on salary card / payslip. */
export function hasJoinMonthPay(carryForward) {
  const num = Number(carryForward);
  return !Number.isNaN(num) && Math.abs(num) >= 0.005;
}
