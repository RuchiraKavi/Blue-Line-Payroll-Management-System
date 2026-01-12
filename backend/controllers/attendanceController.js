import csv from "csvtojson";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

/* =========================
   Upload Attendance CSV
========================= */
const uploadAttendanceCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file required",
      });
    }

    const records = await csv().fromFile(req.file.path);

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty",
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of records) {
      // 🔑 CSV columns
      // employeeId | name | date | inTime | outTime | workingHours | status

      if (!row.employeeId || !row.date) {
        skippedCount++;
        continue;
      }

      let employee = await Employee.findOne({
        employee_id: row.employeeId,
      });

      // Fallback: try to find by employee name (CSV 'name' column)
      if (!employee && row.name) {
        const user = await User.findOne({ name: row.name });
        if (user) {
          employee = await Employee.findOne({ userId: user._id });
        }
      }

      if (!employee) {
        skippedCount++;
        continue;
      }

      // 📅 Attendance date from CSV
      const date = new Date(row.date);
      date.setHours(0, 0, 0, 0);

      // 🚫 Prevent duplicate upload
      const existingAttendance = await Attendance.findOne({
        employee: employee._id,
        date,
      });

      if (existingAttendance) {
        skippedCount++;
        continue;
      }

      const isAbsent =
        row.status?.toLowerCase() === "day off" ||
        row.status?.toLowerCase() === "absent";

      await Attendance.create({
        employee: employee._id,
        employee_id: employee.employee_id,
        date,
        inTime: isAbsent ? null : row.inTime,
        outTime: isAbsent ? null : row.outTime,
        workingHours: isAbsent ? null : row.workingHours,
        status: isAbsent ? "Absent" : "Present",
      });

      insertedCount++;
    }

    res.json({
      success: true,
      message: "Attendance upload completed",
      inserted: insertedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Attendance Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload attendance",
    });
  }
};

/* =========================
   Get Attendance By Date
========================= */
const getAttendanceByDate = async (req, res) => {
  try {
    const date = new Date(req.query.date || Date.now());
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const attendance = await Attendance.find({
      date: { $gte: date, $lt: nextDate },
    }).populate({
      path: "employee",
      select: "employee_id designation userId",
      populate: {
        path: "userId",
        select: "name",
      },
    });

    const mappedAttendance = attendance.map((record) => ({
      _id: record._id,
      employeeId: record.employee._id,
      employee_id: record.employee.employee_id,
      employeeName: record.employee.userId?.name || "Unknown",
      designation: record.employee.designation,
      date: record.date,
      inTime: record.inTime,
      outTime: record.outTime,
      workingHours: record.workingHours,
      status: record.status,
    }));

    res.json({
      success: true,
      attendance: mappedAttendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
};

export { uploadAttendanceCSV, getAttendanceByDate };
