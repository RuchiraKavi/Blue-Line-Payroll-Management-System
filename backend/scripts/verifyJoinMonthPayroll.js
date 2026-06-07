import {
  isJoinMonth,
  isFirstPayMonth,
  isEmployeeEligibleForPayPeriod,
  getJoinMonthWorkedDays,
  calculateJoinMonthCarryForward,
  applyJoinMonthCarryToSalaryInput,
} from "../utils/joinMonthPayroll.js";

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

const employee = {
  joined_date: "2024-06-15",
  role: "employee",
  basic_salary: 240000,
  travel_allowance: 10000,
  food_allowance: 5000,
  holiday_payment: 0,
  allowance_ns: 0,
};

assert("join month June 2024", isJoinMonth(employee.joined_date, 6, 2024));
assert("not join month July 2024", !isJoinMonth(employee.joined_date, 7, 2024));
assert("first pay month July 2024", isFirstPayMonth(employee.joined_date, 7, 2024));
assert("not first pay August 2024", !isFirstPayMonth(employee.joined_date, 8, 2024));

assert(
  "ineligible in join month",
  !isEmployeeEligibleForPayPeriod(employee.joined_date, 6, 2024)
);
assert(
  "eligible from next month",
  isEmployeeEligibleForPayPeriod(employee.joined_date, 7, 2024)
);
assert(
  "not eligible before join",
  !isEmployeeEligibleForPayPeriod(employee.joined_date, 5, 2024)
);

assert(
  "worked days June 15–30",
  getJoinMonthWorkedDays(employee.joined_date, 6, 2024) === 16
);

const carry = calculateJoinMonthCarryForward(employee, 6, 2024);
assert("carry amount > 0", carry.amount > 0);
assert("carry worked days", carry.workedDays === 16);
// (255000 / 24) * 16 = 170000
assert("carry amount formula", carry.amount === 170000);

const withCarry = applyJoinMonthCarryToSalaryInput({}, employee, 7, 2024);
assert("July gets join carry", withCarry.join_month_carry_forward === 170000);
assert("July worked days stored", withCarry.join_month_worked_days === 16);

const noCarry = applyJoinMonthCarryToSalaryInput({}, employee, 8, 2024);
assert("August has no carry", noCarry.join_month_carry_forward === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
