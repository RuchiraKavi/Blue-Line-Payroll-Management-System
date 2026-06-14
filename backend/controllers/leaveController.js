import Leave from "../models/Leave.js";
import LeaveReportRun from "../models/LeaveReportRun.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import path from "path";
import sendEmail from "../utils/sendEmail.js";
import { countInclusiveCalendarDays } from "../utils/payrollAttendance.js";
import { getRequestUserId } from "../utils/rolePermissions.js";
import {
  getInternHalfDayAvailable,
  INTERN_MONTHLY_LEAVE_DAYS,
  isInternEmployee,
  isInternRole,
} from "../utils/internPayroll.js";
import { designationsMatch, escapeRegex } from "../utils/designationValidation.js";

function normalizeSignatureDataUrl(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("data:image/")) return null;
  if (trimmed.length > 2_000_000) return null;
  return trimmed;
}

async function resolveLeaveReportApprover(userId) {
  if (!userId) return null;

  const user = await User.findById(userId).select("name role").lean();
  if (!user) return null;

  const roleKey = String(user.role || "").trim().toLowerCase();
  const roleDoc = roleKey
    ? await Role.findOne({ key: roleKey }).collation({ locale: "en", strength: 2 }).select("label").lean()
    : null;
  const roleLabel =
    roleDoc?.label ||
    (roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : null);

  return {
    approved_by_user_id: user._id,
    approved_by_name: user.name || null,
    approved_by_role: roleLabel || null,
  };
}

const getLeaveReportApproval = async (req, res) => {
  try {
    const month = req.query.month != null ? parseInt(req.query.month, 10) : null;
    const year = req.query.year != null ? parseInt(req.query.year, 10) : null;

    if (month == null || isNaN(month) || month < 1 || month > 12 || year == null || isNaN(year)) {
      return res.status(400).json({ success: false, message: "Valid month (1-12) and year are required" });
    }

    const approval = await LeaveReportRun.findOne({ month, year }).lean();
    return res.status(200).json({ success: true, approval: approval || null });
  } catch (error) {
    console.error("Get leave report approval error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave report approval" });
  }
};

const saveLeaveReportApproval = async (req, res) => {
  try {
    const { month, year, signature_data_url } = req.body;
    const m = month != null ? parseInt(month, 10) : null;
    const y = year != null ? parseInt(year, 10) : null;

    if (m == null || isNaN(m) || m < 1 || m > 12 || y == null || isNaN(y)) {
      return res.status(400).json({ success: false, message: "Valid month (1-12) and year are required" });
    }

    const signatureUrl = normalizeSignatureDataUrl(signature_data_url);
    if (!signatureUrl) {
      return res.status(400).json({
        success: false,
        message: "A valid signature image is required to approve the report",
      });
    }

    const approver = await resolveLeaveReportApprover(getRequestUserId(req.user));
    if (!approver) {
      return res.status(400).json({ success: false, message: "Approver details not found" });
    }

    const approval = await LeaveReportRun.findOneAndUpdate(
      { month: m, year: y },
      {
        $set: {
          ...approver,
          signature_data_url: signatureUrl,
          approved_at: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Monthly leave report approved",
      approval,
    });
  } catch (error) {
    console.error("Save leave report approval error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to approve leave report",
    });
  }
};

const requestLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    /* ---------------- BASIC VALIDATION ---------------- */
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedLeaveType = leaveType.toLowerCase(); // casual | annual | sick | nopay

    if (!["casual", "annual", "sick", "nopay"].includes(normalizedLeaveType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type",
      });
    }

    /* ---------------- FIND EMPLOYEE ---------------- */
    const employee = await Employee.findOne({ userId: req.user.id }).populate(
      "userId",
      "role"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const intern = isInternEmployee(employee);

    /* ---------------- INTERN RULES: half-day or no-pay only ---------------- */
    if (intern && normalizedLeaveType !== "casual" && normalizedLeaveType !== "nopay") {
      return res.status(403).json({
        success: false,
        message: "Interns can apply only half-day leave or no-pay leave",
      });
    }

    /* ---------------- DATE VALIDATION ---------------- */
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    let totalDays = countInclusiveCalendarDays(start, end);

    if (intern && normalizedLeaveType === "casual") {
      if (start.toDateString() !== end.toDateString()) {
        return res.status(400).json({
          success: false,
          message: "Intern half-day leave must be for a single date (same start and end date)",
        });
      }
      totalDays = INTERN_MONTHLY_LEAVE_DAYS;
    }

    /* ---------------- CHECK LEAVE BALANCE (skip for nopay) ---------------- */
    if (normalizedLeaveType !== "nopay") {
      if (intern && normalizedLeaveType === "casual") {
        const available = await getInternHalfDayAvailable(
          employee._id,
          start.getMonth() + 1,
          start.getFullYear()
        );
        if (available < INTERN_MONTHLY_LEAVE_DAYS) {
          return res.status(400).json({
            success: false,
            message: "Half-day leave for this month has already been used or requested",
          });
        }
      } else {
        const availableLeaves =
          employee.leave_balance?.[normalizedLeaveType] ?? 0;

        if (availableLeaves < totalDays) {
          return res.status(400).json({
            success: false,
            message: `Insufficient ${normalizedLeaveType} leave balance`,
          });
        }
      }
    }

    /* ---------------- CREATE LEAVE REQUEST ---------------- */
    const newLeave = new Leave({
      employeeId: employee._id,
      leaveType: normalizedLeaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      status: "Pending",
    });

    await newLeave.save();

    res.status(201).json({
      success: true,
      message: "Leave requested successfully",
      leave: newLeave,
    });
  } catch (error) {
    console.error("Leave Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const getEmployeeLeaves = async (req, res) => {
  try {
    // Handle both /user/:userId and /employee/:employeeId routes
    const userId = req.params.userId || req.params.employeeId;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID or Employee ID is required" });
    }

    // Try to find leaves by ID (could be either userId or employeeId)
    const populateForList = (query) =>
      query
        .select("-signature_data_url")
        .populate({
          path: "employeeId",
          populate: [
            { path: "department", select: "dep_name" },
            { path: "userId", select: "name" },
          ],
        })
        .populate({
          path: "assignedTo",
          populate: [
            { path: "userId", select: "name" },
            { path: "department", select: "dep_name" },
          ],
        });

    let leaves = await populateForList(Leave.find({ employeeId: userId }))
      .sort({ createdAt: -1 });
    
    // If no leaves found, check if the param is a User ID and find the employee
    if (leaves.length === 0) {
      let employee = await Employee.findOne({ userId });
      
      if (!employee) {
        // Also check if it's a direct Employee ID
        employee = await Employee.findById(userId);
      }

      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }

      // Try to find leaves by employee ID
      leaves = await populateForList(Leave.find({ employeeId: employee._id }))
        .sort({ createdAt: -1 });
    }

    // Return empty array if no leaves found (don't throw error)
    res.status(200).json({ success: true, leaves: leaves || [] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Leave fetching failed" });
  }
};

const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().select("-signature_data_url").populate({
      path: "employeeId",
        populate: [
        {
          path: "department",
          select: "dep_name",
        },
        {
          path: "userId",
          select: "name",
        },
        ]
        }).populate({
          path: "assignedTo",
          populate: [
            { path: "userId", select: "name" },
            { path: "department", select: "dep_name" },
          ],
        })

    res.status(200).json({ success: true, leaves });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Leave fetching failed" });
  }
};


const getLeaveDetails = async (req, res) => {
  try {
    const { id } = req.params; // leave ID
    const leave = await Leave.findById(id)
      .populate({
        path: "employeeId",
        populate: [
          { path: "department", select: "dep_name" },
          { path: "userId", select: "name profileImage" }, // include profileImage
        ],
      })
      .populate({
        path: "assignedTo",
        populate: [{ path: "userId", select: "name role" }, { path: "department", select: "dep_name" }],
      })
      .populate({
        path: "approvedBy",
        select: "name role",
      });

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    res.status(200).json({ success: true, leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Leave fetching failed" });
  }
};

// Get assignees (employees) in same department and designation as the leave applicant
const getLeaveAssignees = async (req, res) => {
  try {
    const { id } = req.params; // leave ID

    const leave = await Leave.findById(id).populate({
      path: "employeeId",
      select: "department designation",
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    const departmentId = leave.employeeId?.department;
    const applicantDesignation = leave.employeeId?.designation?.trim();
    if (!departmentId) {
      return res.status(400).json({ success: false, message: "Leave employee department not found" });
    }
    if (!applicantDesignation) {
      return res.status(400).json({ success: false, message: "Leave employee designation not found" });
    }

    const employees = await Employee.find({
      department: departmentId,
      designation: { $regex: new RegExp(`^${escapeRegex(applicantDesignation)}$`, "i") },
    })
      .populate("userId", "name role")
      .select("_id employee_id designation userId");

    // Exclude the employee who applied for the leave
    const applicantEmployeeId = String(leave.employeeId?._id || "");
    const assignees = (employees || [])
      .filter((e) => e?.userId && String(e._id) !== applicantEmployeeId)
      .map((e) => ({
        employeeMongoId: String(e._id),
        employee_id: e.employee_id,
        designation: e.designation || "",
        userId: String(e.userId?._id || ""),
        name: e.userId?.name || "",
        role: e.userId?.role || "",
      }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return res.status(200).json({
      success: true,
      assignees,
      departmentId: String(departmentId),
      designation: applicantDesignation,
    });
  } catch (error) {
    console.error("Get leave assignees error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assignees" });
  }
};

// Assign an employee (same department and designation) — optional before approval
const assignLeave = async (req, res) => {
  try {
    const { id } = req.params; // leave ID
    const { assignedTo } = req.body; // Employee _id

    if (!assignedTo) {
      return res.status(400).json({ success: false, message: "assignedTo is required" });
    }

    const leave = await Leave.findById(id).populate({
      path: "employeeId",
      select: "department designation",
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({ success: false, message: `Cannot assign for ${leave.status} leave` });
    }

    const departmentId = leave.employeeId?.department;
    const applicantDesignation = leave.employeeId?.designation;
    if (!departmentId) {
      return res.status(400).json({ success: false, message: "Leave employee department not found" });
    }
    if (!applicantDesignation?.trim()) {
      return res.status(400).json({ success: false, message: "Leave employee designation not found" });
    }

    const assigneeEmployee = await Employee.findById(assignedTo).populate("userId", "name role");
    if (!assigneeEmployee || !assigneeEmployee.userId) {
      return res.status(404).json({ success: false, message: "Assignee employee not found" });
    }

    if (String(assigneeEmployee.department) !== String(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be in the same department and have the same designation",
      });
    }

    if (!designationsMatch(assigneeEmployee.designation, applicantDesignation)) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be in the same department and have the same designation",
      });
    }

    leave.assignedTo = assigneeEmployee._id;
    leave.assignedAt = new Date();
    await leave.save();

    const populated = await Leave.findById(id)
      .populate({
        path: "employeeId",
        populate: [
          { path: "department", select: "dep_name" },
          { path: "userId", select: "name profileImage" },
        ],
      })
      .populate({
        path: "assignedTo",
        populate: [{ path: "userId", select: "name role" }, { path: "department", select: "dep_name" }],
      });

    return res.status(200).json({
      success: true,
      message: "Leave assigned successfully",
      leave: populated,
    });
  } catch (error) {
    console.error("Assign leave error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to assign leave" });
  }
};

// Update leave status (Approve / Reject) – only admin/HR
const updateLeaveStatus = async (req, res) => {
  try {
    let { status, signature_data_url } = req.body;
    const leaveId = req.params.id;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const signatureUrl = normalizeSignatureDataUrl(signature_data_url);
    if (
      signature_data_url !== undefined &&
      signature_data_url !== null &&
      signature_data_url !== "" &&
      !signatureUrl
    ) {
      return res.status(400).json({ success: false, message: "Invalid signature image" });
    }

    // Normalize incoming status to lowercase for validation
    const normalizedStatus = String(status).toLowerCase().trim(); // 'approved' | 'rejected'

    /* ---------------- VALIDATE STATUS ---------------- */
    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    /* ---------------- FIND LEAVE ---------------- */
    const leave = await Leave.findById(leaveId)
      .populate({
        path: "employeeId",
        select: "employee_id email department userId",
        populate: [
          { path: "department", select: "dep_name" },
          { path: "userId", select: "name email role" },
        ],
      })
      .populate({
        path: "assignedTo",
        select: "employee_id email department userId",
        populate: [
          { path: "userId", select: "name role" },
          { path: "department", select: "dep_name" },
        ],
      });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    /* ---------------- PREVENT DOUBLE UPDATE ---------------- */
    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`,
      });
    }

    const employee = await Employee.findById(leave.employeeId._id)
      .select("leave_balance role designation")
      .populate("userId", "role");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    /* ---------------- DEDUCT LEAVES ONLY IF APPROVED (not for nopay) ---------------- */
    if (normalizedStatus === "approved" && leave.leaveType !== "nopay") {
      const leaveType = leave.leaveType;
      const days = leave.totalDays;
      const intern = isInternEmployee(employee);

      if (intern && leaveType === "casual") {
        const leaveMonth = new Date(leave.startDate).getMonth() + 1;
        const leaveYear = new Date(leave.startDate).getFullYear();
        const available = await getInternHalfDayAvailable(
          employee._id,
          leaveMonth,
          leaveYear
        );
        if (available < days) {
          return res.status(400).json({
            success: false,
            message: "Half-day leave for this month has already been used",
          });
        }
      } else {
        const available = employee.leave_balance?.[leaveType] ?? 0;
        if (available < days) {
          return res.status(400).json({
            success: false,
            message: `Insufficient ${leaveType} leave balance`,
          });
        }

        const updateObj = {};
        updateObj[`leave_balance.${leaveType}`] = available - days;
        await Employee.findByIdAndUpdate(leave.employeeId._id, updateObj, { new: true });
      }
    }

    /* ---------------- UPDATE STATUS ---------------- */
    // Store with capitalized first letter to match model enum: Pending | Approved | Rejected
    leave.status = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
    leave.approvedBy = req.user?.id || req.user?._id || leave.approvedBy;
    if (signature_data_url !== undefined) {
      leave.signature_data_url = signatureUrl;
    }
    await leave.save();

    /* ---------------- SEND EMAIL ---------------- */
    const employeeEmail = leave?.employeeId?.email || leave?.employeeId?.userId?.email;
    const employeeName = leave.employeeId.userId.name;

    const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    const assignedName = leave?.assignedTo?.userId?.name || "";
    const assignedEmpId = leave?.assignedTo?.employee_id || "";
    const assignedEmail = leave?.assignedTo?.email || "";
    const assignedDept = leave?.assignedTo?.department?.dep_name || "";

    const assignedLine = assignedName
      ? `<p><b>Assigned To:</b> ${assignedName}${assignedEmpId ? ` (${assignedEmpId})` : ""}${assignedDept ? ` - ${assignedDept}` : ""}</p>`
      : `<p><b>Assigned To:</b> —</p>`;

    const emailHTML = `
      <h3>Leave Request Update</h3>
      <p>Dear ${employeeName},</p>
      <p>Your leave request has been <b>${displayStatus}</b>.</p>
      <p><b>Leave Type:</b> ${leave.leaveType === "nopay" ? "No Pay" : leave.leaveType}</p>
      <p><b>Days:</b> ${leave.totalDays}</p>
      <p><b>From:</b> ${leave.startDate.toDateString()}</p>
      <p><b>To:</b> ${leave.endDate.toDateString()}</p>
      ${assignedLine}
      <br/>
      <p>Regards,<br/>HR Department</p>
    `;

    let employeeEmailSent = true;
    try {
      await sendEmail({
        to: employeeEmail,
        subject: `Leave Request ${displayStatus}`,
        html: emailHTML,
      });
    } catch (emailError) {
      employeeEmailSent = false;
      console.error("Email send failed:", emailError);
    }

    // Also notify the assigned employee (if any)
    let assigneeEmailSent = true;
    if (assignedEmail) {
      const employeeDept = leave?.employeeId?.department?.dep_name || "";
      const employeePublicId = leave?.employeeId?.employee_id || "";
      const assigneeHTML = `
        <h3>Leave Assignment Notification</h3>
        <p>Dear ${assignedName},</p>
        <p>A leave request has been <b>${displayStatus}</b> and assigned to you.</p>
        <p><b>Employee:</b> ${employeeName}${employeePublicId ? ` (${employeePublicId})` : ""}${employeeDept ? ` - ${employeeDept}` : ""}</p>
        <p><b>Leave Type:</b> ${leave.leaveType === "nopay" ? "No Pay" : leave.leaveType}</p>
        <p><b>Days:</b> ${leave.totalDays}</p>
        <p><b>From:</b> ${leave.startDate.toDateString()}</p>
        <p><b>To:</b> ${leave.endDate.toDateString()}</p>
        <p><b>Reason:</b> ${leave.reason || "—"}</p>
        <br/>
        <p>Regards,<br/>HR Department</p>
      `;

      try {
        await sendEmail({
          to: assignedEmail,
          subject: `Leave Assigned: ${employeeName} (${displayStatus})`,
          html: assigneeHTML,
        });
      } catch (emailError) {
        assigneeEmailSent = false;
        console.error("Assignee email send failed:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message:
        employeeEmailSent && assigneeEmailSent
          ? `Leave ${displayStatus} successfully and emails sent`
          : `Leave ${displayStatus} successfully (email sending failed)`,
    });
  } catch (error) {
    console.error("Update Leave Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update leave",
    });
  }
};

const getLeavesByUser = async (req, res) => {
  try {
    const requestedUserId = req.params.id;
    const loggedInUser = req.user; // from auth middleware

    // Employee → only their own leaves
    if (
      loggedInUser.role === "employee" &&
      loggedInUser._id.toString() !== requestedUserId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Admin → can view anyone
    const leaves = await Leave.find({ employeeId: requestedUserId })
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave history",
    });
  }
};

const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("leave_balance role designation")
      .populate("userId", "role");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (isInternEmployee(employee)) {
      const now = new Date();
      const halfDayAvailable = await getInternHalfDayAvailable(
        employee._id,
        now.getMonth() + 1,
        now.getFullYear()
      );
      return res.status(200).json({
        success: true,
        isIntern: true,
        leaveBalance: {
          half_day: halfDayAvailable,
          casual: halfDayAvailable,
          annual: 0,
          sick: 0,
        },
        role: employee.role,
      });
    }

    res.status(200).json({
      success: true,
      isIntern: false,
      leaveBalance: employee.leave_balance,
      role: employee.role,
    });
  } catch (error) {
    console.error("Leave Balance Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



/**
 * GET /api/leaves/total-days-by-employee?month=YYYY-MM
 * Returns total approved leave days per employee.
 * Optional filters:
 * - month=YYYY-MM: limits to that month (current behavior)
 * - from=YYYY-MM-DD&to=YYYY-MM-DD: limits to that date range (more accurate overlap days)
 */
const getTotalLeaveDaysByEmployee = async (req, res) => {
  try {
    const month = req.query.month; // YYYY-MM or empty for all time
    const fromQ = req.query.from;
    const toQ = req.query.to;

    const hasFromTo = Boolean(fromQ && toQ);
    const fromDate = hasFromTo ? new Date(fromQ) : null;
    const toDate = hasFromTo ? new Date(toQ) : null;

    const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

    if (isValidDate(fromDate) && isValidDate(toDate)) {
      // Normalize to inclusive date range
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      const leaves = await Leave.find({
        status: "Approved",
        startDate: { $lte: toDate },
        endDate: { $gte: fromDate },
      })
        .select("employeeId startDate endDate")
        .lean();

      const msPerDay = 1000 * 60 * 60 * 24;
      const totalsByEmployee = {};

      for (const leave of leaves) {
        const overlapStart = new Date(Math.max(new Date(leave.startDate).getTime(), fromDate.getTime()));
        const overlapEnd = new Date(Math.min(new Date(leave.endDate).getTime(), toDate.getTime()));

        if (overlapEnd < overlapStart) continue;

        const diffDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / msPerDay) + 1;
        const eid = String(leave.employeeId);
        totalsByEmployee[eid] = (totalsByEmployee[eid] || 0) + Math.max(0, diffDays);
      }

      const data = Object.entries(totalsByEmployee).map(([employeeId, totalLeaveDays]) => ({
        employeeId,
        totalLeaveDays: totalLeaveDays || 0,
      }));

      return res.status(200).json({ success: true, data });
    }

    let match = { status: "Approved" };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0);
      match.startDate = { $lte: monthEnd };
      match.endDate = { $gte: monthStart };
    }
    const agg = await Leave.aggregate([
      { $match: match },
      { $group: { _id: "$employeeId", totalLeaveDays: { $sum: "$totalDays" } } },
    ]);
    const data = agg.map((r) => ({
      employeeId: String(r._id),
      totalLeaveDays: r.totalLeaveDays || 0,
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Total leave days by employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch total leave days",
    });
  }
};

export {
  requestLeave,
  getEmployeeLeaves,
  getLeaves,
  getLeaveDetails,
  getLeaveAssignees,
  assignLeave,
  updateLeaveStatus,
  getLeavesByUser,
  getEmployeeLeaveBalance,
  getTotalLeaveDaysByEmployee,
  getLeaveReportApproval,
  saveLeaveReportApproval,
};
