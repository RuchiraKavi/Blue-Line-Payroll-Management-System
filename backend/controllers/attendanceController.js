import fs from "fs";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import {
  normalizeCsvCell,
  parseCsvDate,
  parseAttendanceStatus,
  resolveWorkingHoursForRow,
  findEmployeeForAttendanceRow,
  formatLocalDateKey,
  parseQueryDateLocal,
  parseAttendanceCsvFile,
  getCsvField,
} from "../utils/attendanceCsvParse.js";

/* =========================
   Upload Attendance CSV
   Columns: employee_id, date, employee_name, inTime, outTime, workingHours, status, Holidays, Day off, Leave
   status: Present | Absent
========================= */
const uploadAttendanceCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file required",
      });
    }

    const records = await parseAttendanceCsvFile(req.file.path);

    try {
      fs.unlinkSync(req.file.path);
    } catch (_) {
      /* ignore temp file cleanup */
    }

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty",
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const skippedRows = [];
    const processedDates = new Set();

    const num = (v) => {
      const n = normalizeCsvCell(v);
      if (n == null) return null;
      const x = Number(n);
      return Number.isNaN(x) ? null : x;
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      const empId = normalizeCsvCell(getCsvField(row, "employee_id", "employeeId", "employee id"));
      const date = parseCsvDate(getCsvField(row, "date"));

      if (!empId) {
        skippedCount++;
        const headers = Object.keys(row).join(", ") || "(no columns detected)";
        skippedRows.push({
          row: rowNum,
          employee_id: "",
          reason: `Missing employee_id. CSV columns: ${headers}`,
        });
        continue;
      }
      if (!date) {
        skippedCount++;
        skippedRows.push({ row: rowNum, employee_id: empId, reason: "Invalid or missing date" });
        continue;
      }

      const employee = await findEmployeeForAttendanceRow(row, Employee, User);
      if (!employee) {
        skippedCount++;
        skippedRows.push({
          row: rowNum,
          employee_id: empId,
          reason: `No employee found with ID "${empId}"`,
        });
        continue;
      }

      const { isAbsent } = parseAttendanceStatus(row);
      const workingHours = resolveWorkingHoursForRow(row, isAbsent);
      const inTime = isAbsent ? null : normalizeCsvCell(getCsvField(row, "inTime", "intime"));
      const outTime = isAbsent ? null : normalizeCsvCell(getCsvField(row, "outTime", "outtime"));

      const payload = {
        employee: employee._id,
        employee_id: employee.employee_id,
        date,
        inTime,
        outTime,
        workingHours: isAbsent ? null : workingHours,
        status: isAbsent ? "Absent" : "Present",
        holidays: num(getCsvField(row, "Holidays", "holidays")),
        dayOff: num(getCsvField(row, "Day off", "day_off", "dayoff")),
        leave: num(getCsvField(row, "Leave", "leave")),
        source: "CSV",
        uploadedBy: req.user?._id ?? req.user?.id ?? null,
      };

      const existing = await Attendance.findOne({
        employee: employee._id,
        date,
      });

      if (existing) {
        await Attendance.updateOne({ _id: existing._id }, { $set: payload });
        updatedCount++;
      } else {
        await Attendance.create(payload);
        insertedCount++;
      }

      processedDates.add(formatLocalDateKey(date));
    }

    const dates = [...processedDates].sort();
    const totalSaved = insertedCount + updatedCount;

    if (totalSaved === 0 && skippedCount > 0) {
      return res.status(400).json({
        success: false,
        message: "No attendance rows were saved. Check employee IDs and dates match employees in the system.",
        inserted: 0,
        updated: 0,
        skipped: skippedCount,
        skippedRows: skippedRows.slice(0, 20),
        dates: [],
      });
    }

    res.json({
      success: true,
      message: "Attendance upload completed",
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount,
      skippedRows: skippedRows.slice(0, 20),
      dates,
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
    const date =
      parseQueryDateLocal(req.query.date) ||
      parseQueryDateLocal(formatLocalDateKey(new Date())) ||
      new Date();

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

    const mappedAttendance = attendance.map((record) => {
      const employee = record.employee;

      return {
        _id: record._id,
        employeeId: employee?._id ?? record.employee ?? null,
        employee_id: employee?.employee_id ?? record.employee_id ?? "—",
        employeeName: employee?.userId?.name ?? "Unknown",
        designation: employee?.designation ?? "—",
        date: record.date,
        inTime: record.inTime,
        outTime: record.outTime,
        workingHours: record.workingHours,
        status: record.status,
        holidays: record.holidays,
        dayOff: record.dayOff,
        leave: record.leave,
      };
    });

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

/* =========================
   Get Attendance History By Employee
   GET /api/attendance/employee/:employeeId?from=YYYY-MM-DD&to=YYYY-MM-DD
   Optional from/to for date range. Default: last 90 days.
========================= */
const getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let from = req.query.from ? new Date(req.query.from) : null;
    let to = req.query.to ? new Date(req.query.to) : null;

    if (!from || isNaN(from.getTime())) {
      to = to && !isNaN(to.getTime()) ? to : new Date();
      from = new Date(to);
      from.setDate(from.getDate() - 90);
    }
    if (!to || isNaN(to.getTime())) {
      to = new Date();
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      attendance,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance history",
    });
  }
};

/* =========================
   Get Attendance Summary For All Employees
   GET /api/attendance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&month=YYYY-MM
   Returns per-employee: workedDays (Present), totalHours, absentDays.
========================= */
const getAttendanceSummary = async (req, res) => {
  try {
    let from = req.query.from ? new Date(req.query.from) : null;
    let to = req.query.to ? new Date(req.query.to) : null;
    const month = req.query.month; // YYYY-MM

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      to = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    }
    if (!from || isNaN(from.getTime())) {
      to = new Date();
      from = new Date(to);
      from.setMonth(from.getMonth() - 1);
    }
    if (!to || isNaN(to.getTime())) to = new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    // Parse workingHours to numeric: supports "8.5", "8", "8:30" (H:MM), "08:30" (HH:MM)
    const summary = await Attendance.aggregate([
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
                  { $convert: { input: { $arrayElemAt: [{ $split: ["$workingHours", ":"] }, 0] }, to: "double", onError: 0, onNull: 0 } },
                  { $divide: [{ $convert: { input: { $arrayElemAt: [{ $split: ["$workingHours", ":"] }, 1] }, to: "double", onError: 0, onNull: 0 } }, 60] },
                ],
              },
              else: { $convert: { input: { $ifNull: ["$workingHours", "0"] }, to: "double", onError: 0, onNull: 0 } },
            },
          },
        },
      },
      {
        $group: {
          _id: "$employee",
          workedDays: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          absentDays: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          totalHours: { $sum: "$hoursValue" },
        },
      },
      { $project: { employeeId: "$_id", workedDays: 1, absentDays: 1, totalHours: { $round: ["$totalHours", 1] } } },
    ]);

    res.json({
      success: true,
      summary,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
    });
  }
};

export { uploadAttendanceCSV, getAttendanceByDate, getAttendanceByEmployee, getAttendanceSummary };
