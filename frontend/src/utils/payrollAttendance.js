import {
  INTERN_MONTHLY_GRACE_HOURS,
  INTERN_MONTHLY_LEAVE_DAYS,
  isInternRole,
} from "./internPayroll.js";

/** Standard working hours per day (matches backend payrollAttendance.js). */
export const HOURS_PER_DAY = 8;

export function toLocalDateOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function countInclusiveCalendarDays(startDate, endDate) {
  const start = toLocalDateOnly(startDate);
  const end = toLocalDateOnly(endDate);
  if (!start || !end || end < start) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
}

export function countNoPayLeaveDaysInMonth(leaveStart, leaveEnd, month, year) {
  const monthNum = Number(month);
  const yearNum = Number(year);
  if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) return 0;

  const monthStart = new Date(yearNum, monthNum - 1, 1);
  const monthEnd = new Date(yearNum, monthNum, 0);
  const leaveStartDay = toLocalDateOnly(leaveStart);
  const leaveEndDay = toLocalDateOnly(leaveEnd);
  if (!leaveStartDay || !leaveEndDay) return 0;

  const overlapStart =
    leaveStartDay.getTime() > monthStart.getTime() ? leaveStartDay : monthStart;
  const overlapEnd =
    leaveEndDay.getTime() < monthEnd.getTime() ? leaveEndDay : monthEnd;

  return countInclusiveCalendarDays(overlapStart, overlapEnd);
}

export function getExpectedHoursToDate(role, month, year, asOfDate = new Date()) {
  const monthNum = Number(month);
  const yearNum = Number(year);
  if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) return 0;

  const monthStart = new Date(yearNum, monthNum - 1, 1);
  const monthEnd = new Date(yearNum, monthNum, 0);
  const standard = getStandardMonthlyHours(role);
  const divisor = getPayrollDivisor(role);

  if (asOfDate < monthStart) return 0;

  const effectiveEnd = asOfDate > monthEnd ? monthEnd : asOfDate;
  const elapsedDays = countInclusiveCalendarDays(monthStart, effectiveEnd);
  const cappedDays = Math.min(elapsedDays, divisor);
  return Math.min(standard, cappedDays * HOURS_PER_DAY);
}

export function getPayrollAsOfDate(month, year, now = new Date()) {
  const monthEnd = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
  return now > monthEnd ? monthEnd : now;
}

export function getPayrollDivisor(role) {
  return String(role || "").toLowerCase() === "intern" ? 30 : 24;
}

export function getStandardMonthlyHours(role) {
  return getPayrollDivisor(role) * HOURS_PER_DAY;
}

export function calculateNoPayFromLeave(basicSalary, role, noPayDays) {
  const days = Math.max(0, Number(noPayDays) || 0);
  const basic = Math.max(0, Number(basicSalary) || 0);
  if (days <= 0 || basic <= 0) return 0;
  const divisor = getPayrollDivisor(role);
  return Math.round((basic / divisor) * days * 100) / 100;
}

export function calculateNoPayFromHoursShortfall(basicSalary, role, actualHours) {
  const basic = Math.max(0, Number(basicSalary) || 0);
  const standard = getStandardMonthlyHours(role);
  const actual = Math.max(0, Number(actualHours) || 0);
  const shortfall = Math.max(0, standard - actual);
  if (shortfall <= 0 || basic <= 0) {
    return {
      no_pay_from_hours: 0,
      shortfall_hours: Math.round(shortfall * 10) / 10,
      standard_hours: standard,
      actual_hours: Math.round(actual * 10) / 10,
    };
  }
  const hourlyRate = basic / standard;
  return {
    no_pay_from_hours: Math.round(hourlyRate * shortfall * 100) / 100,
    shortfall_hours: Math.round(shortfall * 10) / 10,
    standard_hours: standard,
    actual_hours: Math.round(actual * 10) / 10,
  };
}

export function resolveNoPayDeduction({
  basicSalary,
  role,
  noPayDays = 0,
  actualHours = 0,
  hasAttendanceRecords = false,
  payrollMonth = null,
  payrollYear = null,
  asOfDate = new Date(),
}) {
  const standard_hours = getStandardMonthlyHours(role);
  const basic = Math.max(0, Number(basicSalary) || 0);

  let rawShortfallHours = 0;
  let effective_actual = 0;

  if (hasAttendanceRecords) {
    const hoursPart = calculateNoPayFromHoursShortfall(basicSalary, role, actualHours);
    rawShortfallHours = hoursPart.shortfall_hours;
    effective_actual = hoursPart.actual_hours;
  } else if (payrollMonth && payrollYear) {
    const payrollAsOf = getPayrollAsOfDate(payrollMonth, payrollYear, asOfDate);
    rawShortfallHours = Math.max(
      0,
      getExpectedHoursToDate(role, payrollMonth, payrollYear, payrollAsOf)
    );
  }

  let billableNoPayDays = Math.max(0, Number(noPayDays) || 0);
  let billableShortfallHours = rawShortfallHours;
  if (isInternRole(role)) {
    billableNoPayDays = Math.max(0, billableNoPayDays - INTERN_MONTHLY_LEAVE_DAYS);
    billableShortfallHours = Math.max(0, billableShortfallHours - INTERN_MONTHLY_GRACE_HOURS);
  }

  const no_pay_leave = calculateNoPayFromLeave(basicSalary, role, billableNoPayDays);
  let no_pay_from_hours = 0;
  if (billableShortfallHours > 0 && basic > 0 && standard_hours > 0) {
    const hourlyRate = basic / standard_hours;
    no_pay_from_hours = Math.round(hourlyRate * billableShortfallHours * 100) / 100;
  }

  const no_pay = Math.round(Math.max(no_pay_leave, no_pay_from_hours) * 100) / 100;

  return {
    no_pay_days: Math.max(0, Number(noPayDays) || 0),
    no_pay_leave,
    no_pay_from_hours,
    no_pay,
    no_pay_calculated: no_pay,
    standard_hours,
    actual_hours: effective_actual,
    shortfall_hours: Math.round(billableShortfallHours * 10) / 10,
    intern_grace_applied: isInternRole(role),
    has_attendance_records: Boolean(hasAttendanceRecords),
    attendance_missing: !hasAttendanceRecords && Boolean(payrollMonth && payrollYear),
  };
}

/**
 * Attendance allowance: full amount when monthly attendance is complete (actual >= standard hours),
 * otherwise pro-rated by hours worked. No attendance records → 0.
 */
export function resolveAttendanceAllowance(
  fullAllowance,
  { role, standard_hours, actual_hours, has_attendance_records }
) {
  const full = Math.max(0, Number(fullAllowance) || 0);
  if (full <= 0) return 0;
  if (!has_attendance_records) return 0;

  const standard = Math.max(0, Number(standard_hours) || getStandardMonthlyHours(role));
  const actual = Math.max(0, Number(actual_hours) || 0);
  if (standard <= 0) return full;
  if (actual >= standard) return full;

  return Math.round(full * (actual / standard) * 100) / 100;
}
