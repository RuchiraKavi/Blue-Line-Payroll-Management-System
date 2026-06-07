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
  _id: "emp1",
  joined_date: "2024-06-15",
  role: "employee",
  basic_salary: 240000,
  travel_allowance: 10000,
  food_allowance: 5000,
  holiday_payment: 0,
  allowance_ns: 0,
};

const junePresentDates = [
  "2024-06-15",
  "2024-06-16",
  "2024-06-17",
  "2024-06-18",
  "2024-06-19",
  "2024-06-20",
  "2024-06-21",
  "2024-06-24",
  "2024-06-25",
  "2024-06-26",
];

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
  "no attendance means 0 worked days",
  getJoinMonthWorkedDays(employee.joined_date, 6, 2024, []) === 0
);
assert(
  "attendance present days after join date",
  getJoinMonthWorkedDays(employee.joined_date, 6, 2024, junePresentDates) === 10
);
assert(
  "present before join date excluded",
  getJoinMonthWorkedDays(employee.joined_date, 6, 2024, ["2024-06-10", "2024-06-15"]) === 1
);

const carry = calculateJoinMonthCarryForward(employee, 6, 2024, junePresentDates);
assert("carry amount > 0", carry.amount > 0);
assert("carry worked days from attendance", carry.workedDays === 10);
// (255000 / 24) * 10 = 106250
assert("carry amount formula", carry.amount === 106250);

const noAttendanceCarry = calculateJoinMonthCarryForward(employee, 6, 2024, []);
assert("no attendance carry is 0", noAttendanceCarry.amount === 0);

const presentDatesMap = new Map([[String(employee._id), junePresentDates]]);
const withCarry = applyJoinMonthCarryToSalaryInput({}, employee, 7, 2024, presentDatesMap);
assert("July gets join carry from attendance", withCarry.join_month_carry_forward === 106250);
assert("July worked days stored", withCarry.join_month_worked_days === 10);

const noCarry = applyJoinMonthCarryToSalaryInput({}, employee, 8, 2024, presentDatesMap);
assert("August has no carry", noCarry.join_month_carry_forward === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
