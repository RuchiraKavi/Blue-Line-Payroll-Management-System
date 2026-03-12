import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import Leave from "../models/Leave.js";
import SalaryRun from "../models/SalaryRun.js";

/**
 * GET /api/dashboard/stats
 * Returns counts for admin dashboard: employees, departments, monthly salary total, leave counts.
 */
const getDashboardStats = async (req, res) => {
  try {
    const [totalEmployees, totalDepartments, leavePending, leaveApproved, leaveRejected] = await Promise.all([
      Employee.countDocuments(),
      Department.countDocuments(),
      Leave.countDocuments({ status: "Pending" }),
      Leave.countDocuments({ status: "Approved" }),
      Leave.countDocuments({ status: "Rejected" }),
    ]);

    const leaveApplications = leavePending + leaveApproved + leaveRejected;

    let monthlySalary = 0;
    try {
      const latestRun = await SalaryRun.findOne().sort({ year: -1, month: -1 }).lean();
      if (latestRun && Array.isArray(latestRun.entries) && latestRun.entries.length > 0) {
        monthlySalary = latestRun.entries.reduce((sum, e) => sum + (Number(e.net_pay) || 0), 0);
        monthlySalary = Math.round(monthlySalary * 100) / 100;
      }
    } catch (salaryErr) {
      console.error("Dashboard salary run error:", salaryErr);
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        totalDepartments,
        monthlySalary,
        leaveApplications,
        leaveApproved,
        leavePending,
        leaveRejected,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard stats",
    });
  }
};

export { getDashboardStats };
