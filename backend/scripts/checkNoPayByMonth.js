import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import {
  buildNoPayPayloadForEmployee,
  countNoPayLeaveDaysInMonth,
  getAttendanceHoursByEmployeeForMonth,
} from "../utils/payrollAttendance.js";

async function getNoPayDays(month, year) {
  const monthNum = Number(month);
  const yearNum = Number(year);
  const monthStart = new Date(yearNum, monthNum - 1, 1);
  const monthEnd = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
  const leaves = await Leave.find({
    leaveType: "nopay",
    status: "Approved",
    startDate: { $lte: monthEnd },
    endDate: { $gte: monthStart },
  }).lean();
  const daysByEmployee = new Map();
  for (const leave of leaves) {
    const days = countNoPayLeaveDaysInMonth(leave.startDate, leave.endDate, monthNum, yearNum);
    if (days <= 0) continue;
    const eid = String(leave.employeeId);
    daysByEmployee.set(eid, (daysByEmployee.get(eid) || 0) + days);
  }
  return daysByEmployee;
}

await mongoose.connect(process.env.MONGODB_URL);

for (const [month, year, label] of [
  [3, 2026, "March 2026"],
  [6, 2026, "June 2026"],
]) {
  console.log("\n===", label, "===");
  const noPayDaysMap = await getNoPayDays(month, year);
  const hoursMap = await getAttendanceHoursByEmployeeForMonth(month, year);
  const employees = await Employee.find().select("_id employee_id basic_salary role").lean();
  for (const emp of employees) {
    const days = noPayDaysMap.get(String(emp._id)) || 0;
    const payload = buildNoPayPayloadForEmployee(
      emp,
      days,
      hoursMap.get(String(emp._id)),
      month,
      year
    );
    if (payload.no_pay > 0 || days > 0) {
      console.log(emp.employee_id, payload);
    }
  }
  if ([...noPayDaysMap.values()].every((d) => d === 0) && hoursMap.size === 0) {
    console.log("(no nopay leave days and no attendance this month)");
  }
}

await mongoose.disconnect();
