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
      // 🔑 CSV columns: employee_id | date | employee_name | inTime | outTime | workingHc status | Holidays | Day off | Leave
      // workingHc status = working hours status (maps to workingHours and/or status)

      const empId = row.employee_id || row.employeeId;
      const empName = row.employee_name || row.name;

      if (!empId || !row.date) {
        skippedCount++;
        continue;
      }

      let employee = await Employee.findOne({
        employee_id: empId,
      });

      // Fallback: try to find by employee name
      if (!employee && empName) {
        const user = await User.findOne({ name: empName });
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

      // workingHc status = "working hours status" column (may contain hours or status text)
      const workingHcStatus = row["workingHc status"] != null ? String(row["workingHc status"]).trim() : null;
      const workingHours = row.workingHours ?? workingHcStatus ?? null;
      const statusRaw = (row.status ?? workingHcStatus ?? "").toString().toLowerCase();
      const dayOffVal = row["Day off"];
      const leaveVal = row.Leave;
      const isDayOff = dayOffVal !== undefined && dayOffVal !== null && dayOffVal !== "" && String(dayOffVal).toLowerCase() !== "0";
      const isOnLeave = leaveVal !== undefined && leaveVal !== null && leaveVal !== "" && String(leaveVal).toLowerCase() !== "0";
      const isAbsent =
        statusRaw === "day off" ||
        statusRaw === "absent" ||
        isDayOff ||
        isOnLeave;

      const num = (v) => (v !== undefined && v !== null && v !== "" ? Number(v) : null);
      const holidaysVal = num(row.Holidays);
      const dayOffNum = num(row["Day off"]);
      const leaveNum = num(row.Leave);

      await Attendance.create({
        employee: employee._id,
        employee_id: employee.employee_id,
        date,
        inTime: isAbsent ? null : (row.inTime ?? null),
        outTime: isAbsent ? null : (row.outTime ?? null),
        workingHours: isAbsent ? null : workingHours,
        status: isAbsent ? "Absent" : "Present",
        holidays: holidaysVal,
        dayOff: dayOffNum,
        leave: leaveNum,
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
      holidays: record.holidays,
      dayOff: record.dayOff,
      leave: record.leave,
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
