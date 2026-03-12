import Employee from "../models/Employee.js";
import SalaryRun from "../models/SalaryRun.js";

/**
 * Calculate salary for one entry (allowances, service charges, EPF, ETF, gross, deductions, net).
 * All logic lives in backend.
 */
function calculateEntry(input) {
  const basic = Number(input.basic_salary) || 0;
  const travel = Number(input.travel_allowance) || 0;
  const food = Number(input.food_allowance) || 0;
  const holiday = Number(input.holiday_payment) || 0;
  const allowanceNs = Number(input.allowance_ns) || 0;
  const bonus = Number(input.bonus) || 0;
  const noPay = Number(input.no_pay) || 0;
  const stampDuty = Number(input.stamp_duty) || 0;
  const mobileDed = Number(input.mobile_deduction) || 0;
  const paye = Number(input.paye) || 0;
  const salaryAdvance = Number(input.salary_advance) || 0;
  const epfPercent = Number(input.epf_percent) || 8;
  const etfPercent = Number(input.etf_percent) || 3;

  const totalAllowances = travel + food + holiday + allowanceNs + bonus;
  const grossSalary = basic + totalAllowances - noPay;
  const totalForEpf = grossSalary > 0 ? grossSalary : 0;
  const epfPayment = (totalForEpf * epfPercent) / 100;
  const etfPayment = (totalForEpf * etfPercent) / 100;
  const totalServiceCharges = stampDuty + mobileDed;
  const totalDeduction = epfPayment + totalServiceCharges + paye + salaryAdvance;
  const netPay = grossSalary - totalDeduction;

  return {
    ...input,
    total_allowances: totalAllowances,
    total_service_charges: totalServiceCharges,
    gross_salary: grossSalary,
    total_for_epf: totalForEpf,
    epf_payment: epfPayment,
    etf_payment: etfPayment,
    total_deduction: totalDeduction,
    net_pay: netPay,
  };
}

/**
 * GET /api/salary/employees
 * List employees with basic_salary for the salary page (admin/hr/account).
 */
export const getEmployeesForSalary = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", "name role profileImage")
      .populate("department", "dep_name");

    const withUser = employees.filter((emp) => emp.userId);

    return res.status(200).json({
      success: true,
      employees: withUser,
    });
  } catch (error) {
    console.error("Get employees for salary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load employees for salary",
    });
  }
};

/**
 * POST /api/salary/calculate
 * Body: { entries: [ { employeeId, basic_salary, travel_allowance, ... } ] }
 * Returns computed rows with employee info attached.
 */
export const calculateSalary = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Entries array is required",
      });
    }

    const rows = [];
    for (const entry of entries) {
      const employeeId = entry.employeeId || entry._id;
      const employee = await Employee.findById(employeeId)
        .populate("userId", "name email role profileImage")
        .populate("department", "dep_name");

      if (!employee) {
        rows.push({
          ...entry,
          error: "Employee not found",
          employee: null,
        });
        continue;
      }

      const input = {
        _id: employee._id,
        employeeId: employee._id,
        employee_id: employee.employee_id,
        name: employee.userId?.name || "N/A",
        designation: employee.designation || "",
        department: employee.department?.dep_name || "N/A",
        basic_salary: Number(entry.basic_salary) ?? Number(employee.basic_salary) ?? 0,
        travel_allowance: Number(entry.travel_allowance) || 0,
        food_allowance: Number(entry.food_allowance) || 0,
        holiday_payment: Number(entry.holiday_payment) || 0,
        allowance_ns: Number(entry.allowance_ns) || 0,
        bonus: Number(entry.bonus) || 0,
        no_pay: Number(entry.no_pay) || 0,
        salary_advance: Number(entry.salary_advance) || 0,
        stamp_duty: Number(entry.stamp_duty) || 0,
        mobile_deduction: Number(entry.mobile_deduction) || 0,
        paye: Number(entry.paye) || 0,
        epf_percent: Number(entry.epf_percent) || 8,
        etf_percent: Number(entry.etf_percent) || 3,
      };

      const computed = calculateEntry(input);
      rows.push({
        ...computed,
        employee,
      });
    }

    return res.status(200).json({
      success: true,
      rows,
    });
  } catch (error) {
    console.error("Calculate salary error:", error);
    return res.status(500).json({
      success: false,
      message: "Salary calculation failed",
    });
  }
};

/**
 * POST /api/salary/save
 * Body: { month, year, entries: [ { employeeId, basic_salary, travel_allowance, ... } ] }
 * All calculation is done in the backend. Fetches each employee, runs calculateEntry, then saves.
 */
export const saveSalaryRun = async (req, res) => {
  try {
    const { month, year, entries } = req.body;
    if (!month || !year || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "month, year and entries array are required",
      });
    }

    const storedEntries = [];
    for (const entry of entries) {
      const employeeId = entry.employeeId || entry._id;
      const employee = await Employee.findById(employeeId)
        .populate("userId", "name email role profileImage")
        .populate("department", "dep_name");

      if (!employee) continue;

      const input = {
        _id: employee._id,
        employeeId: employee._id,
        employee_id: employee.employee_id,
        name: employee.userId?.name || "N/A",
        designation: employee.designation || "",
        department: employee.department?.dep_name || "N/A",
        basic_salary: Number(entry.basic_salary) ?? Number(employee.basic_salary) ?? 0,
        travel_allowance: Number(entry.travel_allowance) || 0,
        food_allowance: Number(entry.food_allowance) || 0,
        holiday_payment: Number(entry.holiday_payment) || 0,
        allowance_ns: Number(entry.allowance_ns) || 0,
        bonus: Number(entry.bonus) || 0,
        no_pay: Number(entry.no_pay) || 0,
        salary_advance: Number(entry.salary_advance) || 0,
        stamp_duty: Number(entry.stamp_duty) || 0,
        mobile_deduction: Number(entry.mobile_deduction) || 0,
        paye: Number(entry.paye) || 0,
        epf_percent: Number(entry.epf_percent) || 8,
        etf_percent: Number(entry.etf_percent) || 3,
      };

      const computed = calculateEntry(input);
      storedEntries.push({
        employee: employee._id,
        employee_id: computed.employee_id,
        name: computed.name,
        designation: computed.designation,
        department: computed.department,
        basic_salary: computed.basic_salary,
        travel_allowance: computed.travel_allowance,
        food_allowance: computed.food_allowance,
        holiday_payment: computed.holiday_payment,
        allowance_ns: computed.allowance_ns,
        bonus: computed.bonus,
        no_pay: computed.no_pay,
        salary_advance: computed.salary_advance,
        stamp_duty: computed.stamp_duty,
        mobile_deduction: computed.mobile_deduction,
        paye: computed.paye,
        epf_percent: computed.epf_percent,
        etf_percent: computed.etf_percent,
        total_allowances: computed.total_allowances,
        total_service_charges: computed.total_service_charges,
        gross_salary: computed.gross_salary,
        total_for_epf: computed.total_for_epf,
        epf_payment: computed.epf_payment,
        etf_payment: computed.etf_payment,
        total_deduction: computed.total_deduction,
        net_pay: computed.net_pay,
        bank_details: employee.bank_details
          ? {
              bank_name: employee.bank_details.bank_name,
              bank_branch: employee.bank_details.bank_branch,
              bank_account_number: employee.bank_details.bank_account_number,
            }
          : undefined,
      });
    }

    const run = await SalaryRun.findOneAndUpdate(
      { month, year },
      { month, year, entries: storedEntries },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Salary run saved",
      run: { _id: run._id, month: run.month, year: run.year, entriesCount: run.entries.length },
    });
  } catch (error) {
    console.error("Save salary run error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save salary run",
    });
  }
};

/**
 * GET /api/salary/payslip/:employeeId?month=&year=
 * Returns saved payslip for an employee for the given month/year.
 */
export const getPayslip = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Query params month and year are required",
      });
    }

    const run = await SalaryRun.findOne({ month, year });
    if (!run || !run.entries || run.entries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No salary run found for this period",
      });
    }

    const entry = run.entries.find(
      (e) => e.employee && e.employee.toString() === employeeId
    );
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found for this employee",
      });
    }

    const employee = await Employee.findById(employeeId)
      .populate("userId", "name email role profileImage")
      .populate("department", "dep_name");

    const data = {
      ...entry.toObject ? entry.toObject() : entry,
      employee,
      epf_percent: entry.epf_percent ?? 8,
      etf_percent: entry.etf_percent ?? 3,
    };

    return res.status(200).json({
      success: true,
      data,
      month,
      year,
    });
  } catch (error) {
    console.error("Get payslip error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get payslip",
    });
  }
};

/**
 * GET /api/salary/runs?month=&year= or no query for list
 * List saved salary runs or get one by month/year.
 */
export const getSalaryRuns = async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const year = req.query.year ? parseInt(req.query.year, 10) : null;

    if (month && year) {
      const run = await SalaryRun.findOne({ month, year }).lean();
      if (!run) {
        return res.status(404).json({
          success: false,
          message: "Salary run not found",
        });
      }
      return res.status(200).json({ success: true, run });
    }

    const runs = await SalaryRun.find()
      .sort({ year: -1, month: -1 })
      .select("month year entries createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      runs: runs.map((r) => ({
        _id: r._id,
        month: r.month,
        year: r.year,
        entriesCount: r.entries?.length || 0,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get salary runs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get salary runs",
    });
  }
};
