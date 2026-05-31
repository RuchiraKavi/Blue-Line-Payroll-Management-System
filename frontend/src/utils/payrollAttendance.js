/** Standard working hours per day (matches backend payrollAttendance.js). */
export const HOURS_PER_DAY = 8;

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
}) {
  const no_pay_leave = calculateNoPayFromLeave(basicSalary, role, noPayDays);
  const hoursPart = calculateNoPayFromHoursShortfall(
    basicSalary,
    role,
    hasAttendanceRecords ? actualHours : getStandardMonthlyHours(role)
  );
  const no_pay_from_hours = hasAttendanceRecords ? hoursPart.no_pay_from_hours : 0;
  const shortfall_hours = hasAttendanceRecords ? hoursPart.shortfall_hours : 0;
  const no_pay = Math.round(Math.max(no_pay_leave, no_pay_from_hours) * 100) / 100;

  return {
    no_pay_days: Math.max(0, Number(noPayDays) || 0),
    no_pay_leave,
    no_pay_from_hours,
    no_pay,
    standard_hours: hoursPart.standard_hours,
    actual_hours: hasAttendanceRecords ? hoursPart.actual_hours : 0,
    shortfall_hours,
    has_attendance_records: Boolean(hasAttendanceRecords),
  };
}
