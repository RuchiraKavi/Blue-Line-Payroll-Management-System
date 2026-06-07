import {
  calculateNoPayFromLeave,
  calculateNoPayFromHoursShortfall,
  countInclusiveCalendarDays,
  countNoPayLeaveDaysInMonth,
  resolveNoPayDeduction,
  getExpectedHoursToDate,
} from "../utils/payrollAttendance.js";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

assert("single day leave", countInclusiveCalendarDays("2024-06-01", "2024-06-01") === 1);
assert("five day leave", countInclusiveCalendarDays("2024-06-01", "2024-06-05") === 5);
assert(
  "cross-month June overlap",
  countNoPayLeaveDaysInMonth("2024-05-28", "2024-06-02", 6, 2024) === 2
);
assert(
  "last day of month",
  countNoPayLeaveDaysInMonth("2024-06-30", "2024-06-30", 6, 2024) === 1
);

assert(
  "employee nopay amount",
  calculateNoPayFromLeave(240000, "employee", 2) === 20000
);
assert(
  "intern nopay amount",
  calculateNoPayFromLeave(30000, "intern", 3) === 3000
);

const hoursCase = calculateNoPayFromHoursShortfall(240000, "employee", 160);
assert("hours shortfall amount", hoursCase.no_pay_from_hours === 40000);
assert("hours shortfall value", hoursCase.shortfall_hours === 32);

const resolved = resolveNoPayDeduction({
  basicSalary: 240000,
  role: "employee",
  noPayDays: 2,
  actualHours: 160,
  hasAttendanceRecords: true,
  payrollMonth: 6,
  payrollYear: 2024,
});
assert("uses max of leave and hours", resolved.no_pay === 40000);

const missingAttendance = resolveNoPayDeduction({
  basicSalary: 240000,
  role: "employee",
  noPayDays: 0,
  actualHours: 0,
  hasAttendanceRecords: false,
  payrollMonth: 6,
  payrollYear: 2024,
  asOfDate: new Date(2024, 5, 7),
});
const leaveOnly = resolveNoPayDeduction({
  basicSalary: 240000,
  role: "employee",
  noPayDays: 2,
  actualHours: 0,
  hasAttendanceRecords: false,
  payrollMonth: 6,
  payrollYear: 2024,
  asOfDate: new Date(2024, 5, 7),
});
assert(
  "uses max of leave and missing-attendance pro-rate",
  leaveOnly.no_pay === Math.max(20000, missingAttendance.no_pay)
);
assert(
  "missing attendance pro-rates to date",
  missingAttendance.no_pay === Math.round((240000 / 192) * 56 * 100) / 100
);
assert("expected hours to June 7", getExpectedHoursToDate("employee", 6, 2024, new Date(2024, 5, 7)) === 56);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
