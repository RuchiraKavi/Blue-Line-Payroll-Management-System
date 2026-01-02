import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import path from "path";
import sendEmail from "../utils/sendEmail.js";

const requestLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Get employee using logged-in user's ID from token
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    const newLeave = new Leave({
      employeeId: employee._id,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "Pending",
    });

    await newLeave.save();
    res.status(201).json({ success: true, message: "Leave requested successfully", leave: newLeave });
  } catch (error) {
    console.error("Leave Request Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getEmployeeLeaves = async (req, res) => {
  try {
    const { userId } = req.params;

    // Try to find leaves by Employee ID first
    let leaves = await Leave.find({ employeeId: userId }).sort({ createdAt: -1 });
    
    // If no leaves found, check if userId is actually a User ID and get employee
    if (leaves.length === 0) {
      const employee = await Employee.findOne({ userId });
      if (employee) {
        leaves = await Leave.find({ employeeId: employee._id }).sort({ createdAt: -1 });
      } else {
        // Also check if userId is a direct Employee ID
        const employeeById = await Employee.findById(userId);
        if (!employeeById) {
          return res.status(404).json({ success: false, message: "Employee not found" });
        }
      }
    }

    res.status(200).json({ success: true, leaves });

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
    const { status } = req.body;
    const leaveId = req.params.id;

    const leave = await Leave.findById(leaveId)
      .populate({
        path: "employeeId",
        populate: {
          path: "userId",
          select: "name email",
        },
      });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    leave.status = status;
    await leave.save();

    // 📧 Send Email
    const employeeEmail = leave.employeeId.userId.email;
    const employeeName = leave.employeeId.userId.name;

    const emailHTML = `
      <h3>Leave Request Update</h3>
      <p>Dear ${employeeName},</p>
      <p>Your leave request has been <b>${status}</b>.</p>
      <p><b>Leave Type:</b> ${leave.leaveType}</p>
      <p><b>From:</b> ${leave.startDate.toDateString()}</p>
      <p><b>To:</b> ${leave.endDate.toDateString()}</p>
      <br/>
      <p>Regards,<br/>HR Department</p>
    `;

    let emailSent = false;
    try {
      await sendEmail({
        to: employeeEmail,
        subject: `Leave Request ${status}`,
        html: emailHTML,
      });
      emailSent = true;
    } catch (emailError) {
      console.error("Email send failed:", emailError);
    }

    res.json({
      success: true,
      message: emailSent ? `Leave ${status} and email sent` : `Leave ${status} (email failed)`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update leave",
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


export { requestLeave, getEmployeeLeaves, getLeaves,getLeaveDetails, updateLeaveStatus, getLeavesByUser };
