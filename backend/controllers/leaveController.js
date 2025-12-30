import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";

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

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const leaves = await Leave.find({ employeeId: employee._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, leaves });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Leave fetching failed" });
  }
};

export { requestLeave, getEmployeeLeaves };
