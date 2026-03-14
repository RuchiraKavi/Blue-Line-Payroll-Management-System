import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import path from "path";
import sendEmail from "../utils/sendEmail.js";

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

    /* ---------------- INTERN RULE (nopay allowed when no balance) ---------------- */
    if (
      employee.userId.role === "intern" &&
      normalizedLeaveType !== "casual" &&
      normalizedLeaveType !== "nopay"
    ) {
      return res.status(403).json({
        success: false,
        message: "Interns can apply only casual or no-pay leaves",
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

    const diffTime = end.getTime() - start.getTime();
    const totalDays =
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    /* ---------------- CHECK LEAVE BALANCE (skip for nopay) ---------------- */
    if (normalizedLeaveType !== "nopay") {
      const availableLeaves =
        employee.leave_balance?.[normalizedLeaveType] ?? 0;

      if (availableLeaves < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${normalizedLeaveType} leave balance`,
        });
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
    let leaves = await Leave.find({ employeeId: userId }).sort({ createdAt: -1 });
    
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
      leaves = await Leave.find({ employeeId: employee._id }).sort({ createdAt: -1 });
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
    const leaves = await Leave.find().populate({
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
    const leave = await Leave.findById(id).populate({
      path: "employeeId",
      populate: [
        { path: "department", select: "dep_name" },
        { path: "userId", select: "name profileImage" }, // include profileImage
      ],
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

// Update leave status (Approve / Reject) – only admin/HR
const updateLeaveStatus = async (req, res) => {
  try {
    let { status } = req.body;
    const leaveId = req.params.id;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
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
    const leave = await Leave.findById(leaveId).populate({
      path: "employeeId",
      populate: {
        path: "userId",
        select: "name email role",
      },
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

    const employee = await Employee.findById(leave.employeeId._id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    /* ---------------- DEDUCT LEAVES ONLY IF APPROVED (not for nopay) ---------------- */
    if (normalizedStatus === "approved" && leave.leaveType !== "nopay") {
      const leaveType = leave.leaveType; // casual | annual | sick
      const days = leave.totalDays;

      const available = employee.leave_balance?.[leaveType] ?? 0;

      if (available < days) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance`,
        });
      }

      // Update leave balance using findByIdAndUpdate to avoid validation issues
      const updateObj = {};
      updateObj[`leave_balance.${leaveType}`] = available - days;
      
      await Employee.findByIdAndUpdate(
        leave.employeeId._id,
        updateObj,
        { new: true }
      );
    }

    /* ---------------- UPDATE STATUS ---------------- */
    // Store with capitalized first letter to match model enum: Pending | Approved | Rejected
    leave.status = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
    await leave.save();

    /* ---------------- SEND EMAIL ---------------- */
    const employeeEmail = leave.employeeId.userId.email;
    const employeeName = leave.employeeId.userId.name;

    const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    const emailHTML = `
      <h3>Leave Request Update</h3>
      <p>Dear ${employeeName},</p>
      <p>Your leave request has been <b>${displayStatus}</b>.</p>
      <p><b>Leave Type:</b> ${leave.leaveType === "nopay" ? "No Pay" : leave.leaveType}</p>
      <p><b>Days:</b> ${leave.totalDays}</p>
      <p><b>From:</b> ${leave.startDate.toDateString()}</p>
      <p><b>To:</b> ${leave.endDate.toDateString()}</p>
      <br/>
      <p>Regards,<br/>HR Department</p>
    `;

    let emailSent = true;
    try {
      await sendEmail({
        to: employeeEmail,
        subject: `Leave Request ${displayStatus}`,
        html: emailHTML,
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Email send failed:", emailError);
    }

    res.status(200).json({
      success: true,
      message: emailSent
        ? `Leave ${displayStatus} successfully and email sent`
        : `Leave ${displayStatus} successfully (email failed)`,
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
    const employee = await Employee.findById(req.params.id).select(
      "leave_balance role"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
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
 * Returns total approved leave days per employee. Optional month (YYYY-MM) filters to that month.
 */
const getTotalLeaveDaysByEmployee = async (req, res) => {
  try {
    const month = req.query.month; // YYYY-MM or empty for all time
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

export { requestLeave, getEmployeeLeaves, getLeaves, getLeaveDetails, updateLeaveStatus, getLeavesByUser, getEmployeeLeaveBalance, getTotalLeaveDaysByEmployee };
