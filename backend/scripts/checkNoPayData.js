import mongoose from "mongoose";
import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import { countNoPayLeaveDaysInMonth, buildNoPayPayloadForEmployee } from "../utils/payrollAttendance.js";

await mongoose.connect(process.env.MONGODB_URL);

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();
console.log("Current period:", month, year);

const monthStart = new Date(year, month - 1, 1);
const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

const allLeaves = await Leave.find({}).sort({ startDate: -1 }).lean();
console.log("\nAll leaves:", allLeaves.length);
for (const l of allLeaves.slice(0, 15)) {
  const daysInMonth = countNoPayLeaveDaysInMonth(l.startDate, l.endDate, month, year);
  console.log({
    type: l.leaveType,
    status: l.status,
    start: l.startDate?.toISOString?.()?.slice(0, 10),
    end: l.endDate?.toISOString?.()?.slice(0, 10),
    daysInMonth,
    employeeId: String(l.employeeId),
  });
}

const attCount = await Attendance.countDocuments({
  date: { $gte: monthStart, $lte: monthEnd },
});
console.log("\nAttendance records this month:", attCount);

await mongoose.disconnect();
