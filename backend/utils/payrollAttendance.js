import Attendance from "../models/Attendance.js";

/** Standard working hours per day (used with 24/30-day month divisors). */
export const HOURS_PER_DAY = 8;

export function getPayrollDivisor(role) {
  return String(role || "").toLowerCase() === "intern" ? 30 : 24;
}

export function getStandardMonthlyHours(role) {
  return getPayrollDivisor(role) * HOURS_PER_DAY;
}

/** No-pay amount from approved no-pay leave days. */
export function calculateNoPayFromLeave(basicSalary, role, noPayDays) {
  const days = Math.max(0, Number(noPayDays) || 0);
  const basic = Math.max(0, Number(basicSalary) || 0);
  if (days <= 0 || basic <= 0) return 0;
  const divisor = getPayrollDivisor(role);
  return Math.round((basic / divisor) * days * 100) / 100;
}

/**
 * No-pay from attendance shortfall: (basic / standard_hours) × missing hours.
 * @returns {{ no_pay_from_hours: number, shortfall_hours: number, standard_hours: number, actual_hours: number }}
 */
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

/**
 * Final no-pay: max(leave, hours shortfall). Hours rule applies only when attendance exists for the month.
 */
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

/**
 * Sum working hours per employee for a calendar month (local month boundaries).
 * @returns {Promise<Map<string, { totalHours: number, recordCount: number }>>}
 */
export async function getAttendanceHoursByEmployeeForMonth(month, year) {
  const monthNum = Number(month);
  const yearNum = Number(year);
  if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) {
    return new Map();
  }

  const from = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
  const to = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  const rows = await Attendance.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    {
      $addFields: {
        hoursValue: {
          $cond: {
            if: {
              $and: [
                { $eq: [{ $type: "$workingHours" }, "string"] },
                { $gte: [{ $size: { $split: [{ $ifNull: ["$workingHours", ""] }, ":"] } }, 2] },
              ],
            },
            then: {
              $add: [
                {
                  $convert: {
                    input: { $arrayElemAt: [{ $split: ["$workingHours", ":"] }, 0] },
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
                {
                  $divide: [
                    {
                      $convert: {
                        input: { $arrayElemAt: [{ $split: ["$workingHours", ":"] }, 1] },
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    60,
                  ],
                },
              ],
            },
            else: {
              $convert: {
                input: { $ifNull: ["$workingHours", "0"] },
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$employee",
        totalHours: { $sum: "$hoursValue" },
        recordCount: { $sum: 1 },
      },
    },
  ]);

  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), {
      totalHours: Math.round((Number(row.totalHours) || 0) * 10) / 10,
      recordCount: Number(row.recordCount) || 0,
    });
  }
  return map;
}

/**
 * Build no-pay payload for one employee (leave + attendance shortfall).
 */
export function buildNoPayPayloadForEmployee(employee, noPayDays, attendanceInfo) {
  const employeeId = String(employee._id);
  const basicSalary = Number(employee.basic_salary) || 0;
  const role = employee.role || employee.userId?.role || "";
  const hasAttendanceRecords = (attendanceInfo?.recordCount ?? 0) > 0;
  const actualHours = attendanceInfo?.totalHours ?? 0;
  const resolved = resolveNoPayDeduction({
    basicSalary,
    role,
    noPayDays,
    actualHours,
    hasAttendanceRecords,
  });
  return { employeeId, ...resolved };
}
