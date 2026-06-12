import AdvanceRequest from "../models/AdvanceRequest.js";
import Employee from "../models/Employee.js";

/**
 * POST /api/advance/request
 * Employee submits an advance payment request.
 */
export const requestAdvance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const { amount, reason } = req.body;
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }
    const basicSalary = Number(employee.basic_salary) || 0;
    const maxAdvance = basicSalary * 0.5;
    if (numAmount > maxAdvance) {
      return res.status(400).json({
        success: false,
        message: `Advance amount cannot exceed 50% of your basic salary (Rs. ${maxAdvance.toLocaleString()})`,
      });
    }

    const doc = new AdvanceRequest({
      employeeId: employee._id,
      amount: numAmount,
      reason: reason ? String(reason).trim() : "",
      status: "Pending",
    });
    await doc.save();

    return res.status(201).json({
      success: true,
      message: "Advance payment request submitted successfully",
      request: doc,
    });
  } catch (error) {
    console.error("Advance request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit advance request",
    });
  }
};

/**
 * GET /api/advance/my-requests
 * Logged-in employee gets their own advance requests.
 */
export const getMyAdvanceRequests = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(200).json({ success: true, requests: [] });
    }

    const requests = await AdvanceRequest.find({ employeeId: employee._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get my advance requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load advance requests",
    });
  }
};

/**
 * GET /api/advance (admin)
 * List all advance requests with employee info.
 */
export const getAdvanceRequests = async (req, res) => {
  try {
    const requests = await AdvanceRequest.find()
      .populate({ path: "employeeId", select: "employee_id designation", populate: { path: "userId", select: "name" }, strictPopulate: false })
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      requests: requests || [],
    });
  } catch (error) {
    console.error("Get advance requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load advance requests",
    });
  }
};

/**
 * PUT /api/advance/:id/status
 * Admin approve or reject an advance request.
 */
export const updateAdvanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }

    const doc = await AdvanceRequest.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Advance request not found",
      });
    }

    if (doc.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request is already processed",
      });
    }

    doc.status = status;
    doc.approvedBy = req.user.id;
    doc.remarks = remarks != null ? String(remarks).trim() : doc.remarks;
    await doc.save();

    return res.status(200).json({
      success: true,
      message: `Advance request ${status.toLowerCase()} successfully`,
      request: doc,
    });
  } catch (error) {
    console.error("Update advance status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update advance request",
    });
  }
};

/**
 * GET /api/advance/accepted-totals
 * Returns sum of approved advance amounts per employee (for salary page to pre-fill salary advance).
 */
export const getAcceptedTotals = async (req, res) => {
  try {
    const totals = await AdvanceRequest.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: "$employeeId", totalAmount: { $sum: "$amount" } } },
    ]);
    const list = totals.map((t) => ({
      employeeId: t._id?.toString?.() ?? t._id,
      totalAmount: Number(t.totalAmount) || 0,
    }));
    return res.status(200).json({
      success: true,
      totals: list,
    });
  } catch (error) {
    console.error("Get accepted totals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get accepted advance totals",
    });
  }
};
