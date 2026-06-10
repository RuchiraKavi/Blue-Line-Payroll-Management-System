import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import SalaryRun from "../models/SalaryRun.js";
import Leave from "../models/Leave.js";
import { calculateMonthlyApit } from "../utils/sriLankaPaye.js";
import {
  buildNoPayPayloadForEmployee,
  countNoPayLeaveDaysInMonth,
  getAttendanceHoursByEmployeeForMonth,
  getPresentAttendanceDatesByEmployeeForMonth,
} from "../utils/payrollAttendance.js";
import { isFuturePayPeriod, assertPayPeriodStarted } from "../utils/payPeriod.js";
import {
  applyJoinMonthCarryToSalaryInput,
  buildDeferredEmployeeSummary,
  getPreviousPayPeriod,
  isEmployeeEligibleForPayPeriod,
} from "../utils/joinMonthPayroll.js";

/** Normalize entry.employee to a string id (handles ObjectId, string, or BSON-style object). */
function entryEmployeeIdString(entry) {
  const e = entry?.employee;
  if (e == null) return "";
  if (typeof e === "string") return e;
  if (typeof e?.toString === "function") return e.toString();
  if (e?.$oid) return e.$oid;
  return String(e);
}

/** Entry-level signature first, then period-level run signature (admin "Save signature & date"). */
function resolvePayslipSignature(run, entry) {
  const entryUrl =
    typeof entry?.signature_data_url === "string" && entry.signature_data_url.length > 0
      ? entry.signature_data_url
      : null;
  const runUrl =
    typeof run?.signature_data_url === "string" && run.signature_data_url.length > 0
      ? run.signature_data_url
      : null;
  const entryDate =
    typeof entry?.signature_date === "string" && entry.signature_date.trim()
      ? entry.signature_date.trim()
      : null;
  const runDate =
    typeof run?.signature_date === "string" && run.signature_date.trim()
      ? run.signature_date.trim()
      : null;
  return {
    signature_data_url: entryUrl ?? runUrl ?? null,
    signature_date: entryDate ?? runDate ?? null,
  };
}

/** Use entry value when provided; otherwise fall back to employee profile default. */
function resolveAmount(entry, employee, field) {
  const v = entry?.[field];
  if (v != null && v !== "") return Number(v) || 0;
  return Number(employee?.[field]) || 0;
}

/** Load leave no-pay days, attendance hours, and present-day dates for join-month pay. */
async function loadPayrollPeriodContext(month, year) {
  const prev = getPreviousPayPeriod(month, year);
  const [noPayDaysMap, hoursMap, prevPresentDatesMap, currentPresentDatesMap] =
    await Promise.all([
      getNoPayDaysByEmployeeForMonth(month, year),
      getAttendanceHoursByEmployeeForMonth(month, year),
      getPresentAttendanceDatesByEmployeeForMonth(prev.month, prev.year),
      getPresentAttendanceDatesByEmployeeForMonth(month, year),
    ]);
  return { noPayDaysMap, hoursMap, prevPresentDatesMap, currentPresentDatesMap };
}

/** Resolve no-pay (leave vs attendance shortfall) and attach breakdown fields to salary input. */
function applyResolvedNoPay(input, employee, noPayDaysMap, hoursMap, month, year) {
  const empId = String(employee._id);
  const noPayDays = noPayDaysMap.get(empId) || 0;
  const attendanceInfo = hoursMap.get(empId);
  const payload = buildNoPayPayloadForEmployee(
    { _id: employee._id, basic_salary: input.basic_salary ?? employee.basic_salary, role: employee.role },
    noPayDays,
    attendanceInfo,
    month,
    year
  );
  return {
    ...input,
    no_pay: payload.no_pay,
    no_pay_days: payload.no_pay_days,
    no_pay_leave: payload.no_pay_leave,
    no_pay_from_hours: payload.no_pay_from_hours,
    standard_hours: payload.standard_hours,
    actual_hours: payload.actual_hours,
    shortfall_hours: payload.shortfall_hours,
    has_attendance_records: payload.has_attendance_records,
    attendance_missing: payload.attendance_missing,
  };
}

function prepareSalaryInput(input, employee, noPayDaysMap, hoursMap, month, year, prevPresentDatesMap) {
  const withJoin = applyJoinMonthCarryToSalaryInput(
    input,
    employee,
    month,
    year,
    prevPresentDatesMap
  );
  return applyResolvedNoPay(withJoin, employee, noPayDaysMap, hoursMap, month, year);
}

/**
 * EPF/ETF base = basic + fixed allowances (excludes overtime, reimbursements).
 * Employee EPF: 8% (deducted from salary). Employer EPF: 12%. Employer ETF: 3%.
 */
function calculateEntry(input) {
  const basic = Number(input.basic_salary) || 0;
  const travel = Number(input.travel_allowance) || 0;
  const food = Number(input.food_allowance) || 0;
  const holiday = Number(input.holiday_payment) || 0;
  const allowanceNs = Number(input.allowance_ns) || 0;
  const joinCarryForward = Number(input.join_month_carry_forward) || 0;
  const noPay = Number(input.no_pay) || 0;
  const stampDuty = Number(input.stamp_duty) || 0;
  const mobileDed = Number(input.mobile_deduction) || 0;
  const salaryAdvance = Number(input.salary_advance) || 0;

  const totalAllowances = travel + food + holiday + allowanceNs;
  const grossSalary = basic + totalAllowances + joinCarryForward;
  // APIT/PAYE base: monthly gross remuneration after no-pay (annualized ×12, LKR 1.8M relief, progressive slabs)
  const monthlyIncomeForApit = Math.max(0, grossSalary - noPay);
  const paye = calculateMonthlyApit(monthlyIncomeForApit);
  const totalForEpf = Math.max(
    0,
    basic + travel + food + holiday + allowanceNs + joinCarryForward - noPay
  );
  const employeeEpfPayment = (totalForEpf * 8) / 100;
  const employerEpfPayment = (totalForEpf * 12) / 100;
  const etfPayment = (totalForEpf * 3) / 100;
  const totalServiceCharges = stampDuty + mobileDed;
  const totalDeduction = noPay + employeeEpfPayment + totalServiceCharges + paye + salaryAdvance;
  const netPay = grossSalary - totalDeduction;

  return {
    ...input,
    paye,
    total_allowances: totalAllowances,
    total_service_charges: totalServiceCharges,
    gross_salary: grossSalary,
    total_for_epf: totalForEpf,
    epf_payment: employeeEpfPayment,
    employer_epf_payment: employerEpfPayment,
    etf_payment: etfPayment,
    total_deduction: totalDeduction,
    net_pay: netPay,
  };
}

/**
 * Get number of no-pay days per employee for a given month from Leave collection.
 * Returns Map<employeeIdString, number> (days count).
 */
async function getNoPayDaysByEmployeeForMonth(month, year) {
  const monthNum = Number(month) || new Date().getMonth() + 1;
  const yearNum = Number(year) || new Date().getFullYear();
  const monthStart = new Date(yearNum, monthNum - 1, 1);
  const monthEnd = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  const leaves = await Leave.find({
    leaveType: "nopay",
    status: "Approved",
    startDate: { $lte: monthEnd },
    endDate: { $gte: monthStart },
  }).lean();

  const daysByEmployee = new Map();
  for (const leave of leaves) {
    const days = countNoPayLeaveDaysInMonth(
      leave.startDate,
      leave.endDate,
      monthNum,
      yearNum
    );
    if (days <= 0) continue;
    const eid = String(leave.employeeId);
    daysByEmployee.set(eid, (daysByEmployee.get(eid) || 0) + days);
  }
  return daysByEmployee;
}

/**
 * GET /api/salary/no-pay?month=&year=
 * Returns calculated no-pay days and amount per employee for the given month.
 * Used so the salary page always shows no_pay from DB (approved nopay leave count).
 */
export const getNoPayForPeriod = async (req, res) => {
  try {
    const month = req.query.month != null ? Number(req.query.month) : null;
    const year = req.query.year != null ? Number(req.query.year) : null;
    if (month == null || year == null || Number.isNaN(month) || Number.isNaN(year)) {
      return res.status(400).json({ success: false, message: "month and year are required" });
    }
    const { noPayDaysMap, hoursMap } = await loadPayrollPeriodContext(month, year);
    const employees = await Employee.find().select("_id role basic_salary").lean();
    const data = employees.map((emp) =>
      buildNoPayPayloadForEmployee(
        emp,
        noPayDaysMap.get(String(emp._id)) || 0,
        hoursMap.get(String(emp._id)),
        month,
        year
      )
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get no-pay for period error:", error);
    return res.status(500).json({ success: false, message: "Failed to load no-pay data" });
  }
};

/**
 * GET /api/salary/employees
 * List employees with basic_salary for the salary page (admin/hr/account).
 * Query: month, year (optional). When provided, includes no_pay_days and no_pay (calculated:
 * no_pay = (basic_salary / divisor) * no_pay_days, divisor = 30 for intern, 24 otherwise).
 */
export const getEmployeesForSalary = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", "name role profileImage")
      .populate("department", "dep_name");

    const withUser = employees.filter((emp) => emp.userId);
    const month = req.query.month != null ? Number(req.query.month) : null;
    const year = req.query.year != null ? Number(req.query.year) : null;

    if (month != null && year != null && !Number.isNaN(month) && !Number.isNaN(year)) {
      if (isFuturePayPeriod(month, year)) {
        return res.status(400).json({
          success: false,
          message: "Salary for this pay period is not available until the month has started.",
        });
      }
      const { noPayDaysMap, hoursMap, prevPresentDatesMap, currentPresentDatesMap } =
        await loadPayrollPeriodContext(month, year);
      const eligible = withUser.filter((emp) =>
        isEmployeeEligibleForPayPeriod(emp.joined_date, month, year)
      );
      const deferredEmployees = withUser
        .filter((emp) => !isEmployeeEligibleForPayPeriod(emp.joined_date, month, year))
        .map((emp) => buildDeferredEmployeeSummary(emp, month, year, currentPresentDatesMap));

      const employeesWithNoPay = eligible.map((emp) => {
        const empObj = emp.toObject ? emp.toObject() : emp;
        const payload = buildNoPayPayloadForEmployee(
          empObj,
          noPayDaysMap.get(String(emp._id)) || 0,
          hoursMap.get(String(emp._id)),
          month,
          year
        );
        const withJoin = applyJoinMonthCarryToSalaryInput(
          {},
          empObj,
          month,
          year,
          prevPresentDatesMap
        );
        return { ...empObj, ...payload, ...withJoin };
      });
      return res.status(200).json({
        success: true,
        employees: employeesWithNoPay,
        deferredEmployees,
      });
    }

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
    const { entries, month, year } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Entries array is required",
      });
    }

    let periodContext = null;
    const monthNum = month != null ? Number(month) : null;
    const yearNum = year != null ? Number(year) : null;
    if (monthNum && yearNum && !Number.isNaN(monthNum) && !Number.isNaN(yearNum)) {
      assertPayPeriodStarted(monthNum, yearNum);
      periodContext = await loadPayrollPeriodContext(monthNum, yearNum);
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

      if (!isEmployeeEligibleForPayPeriod(employee.joined_date, monthNum, yearNum)) {
        rows.push({
          ...entry,
          error: "Employee joined this month — salary is processed from next month with join-month work pay.",
          employee,
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
        travel_allowance: resolveAmount(entry, employee, "travel_allowance"),
        food_allowance: resolveAmount(entry, employee, "food_allowance"),
        holiday_payment: resolveAmount(entry, employee, "holiday_payment"),
        allowance_ns: resolveAmount(entry, employee, "allowance_ns"),
        salary_advance: Number(entry.salary_advance) || 0,
        stamp_duty: resolveAmount(entry, employee, "stamp_duty"),
        mobile_deduction: resolveAmount(entry, employee, "mobile_deduction"),
        paye: Number(entry.paye) || 0,
        epf_percent: 8,
        etf_percent: Number(entry.etf_percent) || 3,
      };

      const inputWithNoPay = periodContext
        ? prepareSalaryInput(
            input,
            employee,
            periodContext.noPayDaysMap,
            periodContext.hoursMap,
            monthNum,
            yearNum,
            periodContext.prevPresentDatesMap
          )
        : { ...input, no_pay: Number(entry.no_pay) || 0 };

      const computed = calculateEntry(inputWithNoPay);
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
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
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
    assertPayPeriodStarted(month, year);

    const { noPayDaysMap, hoursMap, prevPresentDatesMap } = await loadPayrollPeriodContext(month, year);

    const storedEntries = [];
    for (const entry of entries) {
      const employeeId = entry.employeeId || entry._id;
      const employee = await Employee.findById(employeeId)
        .populate("userId", "name email role profileImage")
        .populate("department", "dep_name");

      if (!employee) continue;

      if (!isEmployeeEligibleForPayPeriod(employee.joined_date, month, year)) {
        return res.status(400).json({
          success: false,
          message: `${employee.employee_id} joined this month. Salary is calculated from next month; join-month work pay is added then.`,
        });
      }

      const input = prepareSalaryInput(
        {
          _id: employee._id,
          employeeId: employee._id,
          employee_id: employee.employee_id,
          name: employee.userId?.name || "N/A",
          designation: employee.designation || "",
          department: employee.department?.dep_name || "N/A",
          basic_salary: Number(entry.basic_salary) ?? Number(employee.basic_salary) ?? 0,
          travel_allowance: resolveAmount(entry, employee, "travel_allowance"),
          food_allowance: resolveAmount(entry, employee, "food_allowance"),
          holiday_payment: resolveAmount(entry, employee, "holiday_payment"),
          allowance_ns: resolveAmount(entry, employee, "allowance_ns"),
          salary_advance: Number(entry.salary_advance) || 0,
          stamp_duty: resolveAmount(entry, employee, "stamp_duty"),
          mobile_deduction: resolveAmount(entry, employee, "mobile_deduction"),
          paye: Number(entry.paye) || 0,
          epf_percent: 8,
          etf_percent: Number(entry.etf_percent) || 3,
        },
        employee,
        noPayDaysMap,
        hoursMap,
        month,
        year,
        prevPresentDatesMap
      );

      const computed = calculateEntry(input);
      const approvalStatus = ["pending", "approved", "rejected"].includes(entry.approval_status)
        ? entry.approval_status
        : (entry.approvalStatus && ["pending", "approved", "rejected"].includes(entry.approvalStatus) ? entry.approvalStatus : "pending");
      storedEntries.push({
        employee: employee._id,
        employee_id: computed.employee_id,
        nic: employee.nic || "",
        epf_number: employee.epf_number || "",
        name: computed.name,
        designation: computed.designation,
        department: computed.department,
        approval_status: approvalStatus,
        basic_salary: computed.basic_salary,
        travel_allowance: computed.travel_allowance,
        food_allowance: computed.food_allowance,
        holiday_payment: computed.holiday_payment,
        allowance_ns: computed.allowance_ns,
        join_month_carry_forward: computed.join_month_carry_forward ?? 0,
        join_month_worked_days: computed.join_month_worked_days ?? 0,
        no_pay: computed.no_pay,
        no_pay_days: computed.no_pay_days ?? 0,
        no_pay_leave: computed.no_pay_leave ?? 0,
        no_pay_from_hours: computed.no_pay_from_hours ?? 0,
        standard_hours: computed.standard_hours ?? 0,
        actual_hours: computed.actual_hours ?? 0,
        shortfall_hours: computed.shortfall_hours ?? 0,
        salary_advance: computed.salary_advance,
        stamp_duty: computed.stamp_duty,
        mobile_deduction: computed.mobile_deduction,
        paye: computed.paye,
        epf_percent: 8,
        etf_percent: computed.etf_percent,
        total_allowances: computed.total_allowances,
        total_service_charges: computed.total_service_charges,
        gross_salary: computed.gross_salary,
        total_for_epf: computed.total_for_epf,
        epf_payment: computed.epf_payment,
        employer_epf_payment: computed.employer_epf_payment,
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
      { month, year, entries: storedEntries, finalized: true },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Salary run saved",
      run: { _id: run._id, month: run.month, year: run.year, entriesCount: run.entries.length, finalized: run.finalized },
    });
  } catch (error) {
    console.error("Save salary run error:", error);
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to save salary run",
    });
  }
};

/**
 * POST /api/salary/save-one
 * Body: { month, year, entry: { employeeId, basic_salary, ... } }
 * Ensures one run per month; adds or updates this employee's entry in that run.
 */
export const saveOneSalaryEntry = async (req, res) => {
  try {
    const { month, year, entry } = req.body;
    if (!month || !year || !entry) {
      return res.status(400).json({
        success: false,
        message: "month, year and entry are required",
      });
    }
    assertPayPeriodStarted(month, year);
    const rawId = entry.employeeId ?? entry._id;
    const employeeId = rawId == null ? null : (typeof rawId === "string" ? rawId : (rawId.toString?.() ?? String(rawId)));
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "entry.employeeId is required" });
    }
    const employee = await Employee.findById(employeeId)
      .populate("userId", "name email role profileImage")
      .populate("department", "dep_name");
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    if (!isEmployeeEligibleForPayPeriod(employee.joined_date, month, year)) {
      return res.status(400).json({
        success: false,
        message: `${employee.employee_id} joined this month. Salary is calculated from next month; join-month work pay is added then.`,
      });
    }
    const depName = (employee.department && typeof employee.department === "object" && "dep_name" in employee.department)
      ? employee.department.dep_name
      : (employee.department?.dep_name ?? "N/A");
    const { noPayDaysMap, hoursMap, prevPresentDatesMap } = await loadPayrollPeriodContext(month, year);
    const input = prepareSalaryInput(
      {
        _id: employee._id,
        employeeId: employee._id,
        employee_id: employee.employee_id,
        name: employee.userId?.name || "N/A",
        designation: employee.designation || "",
        department: depName,
        basic_salary: Number(entry.basic_salary) ?? Number(employee.basic_salary) ?? 0,
        travel_allowance: resolveAmount(entry, employee, "travel_allowance"),
        food_allowance: resolveAmount(entry, employee, "food_allowance"),
        holiday_payment: resolveAmount(entry, employee, "holiday_payment"),
        allowance_ns: resolveAmount(entry, employee, "allowance_ns"),
        salary_advance: Number(entry.salary_advance) || 0,
        stamp_duty: resolveAmount(entry, employee, "stamp_duty"),
        mobile_deduction: resolveAmount(entry, employee, "mobile_deduction"),
        paye: Number(entry.paye) || 0,
        epf_percent: 8,
        etf_percent: Number(entry.etf_percent) || 3,
      },
      employee,
      noPayDaysMap,
      hoursMap,
      month,
      year,
      prevPresentDatesMap
    );
    const computed = calculateEntry(input);
    const approvalStatus = ["pending", "approved", "rejected"].includes(entry.approval_status)
      ? entry.approval_status
      : (entry.approvalStatus && ["pending", "approved", "rejected"].includes(entry.approvalStatus) ? entry.approvalStatus : "pending");
    const newEntry = {
      employee: employee._id,
      employee_id: computed.employee_id,
      nic: employee.nic || "",
      epf_number: employee.epf_number || "",
      name: computed.name,
      designation: computed.designation,
      department: computed.department,
      approval_status: approvalStatus,
      basic_salary: computed.basic_salary,
      travel_allowance: computed.travel_allowance,
      food_allowance: computed.food_allowance,
      holiday_payment: computed.holiday_payment,
      allowance_ns: computed.allowance_ns,
      join_month_carry_forward: computed.join_month_carry_forward ?? 0,
      join_month_worked_days: computed.join_month_worked_days ?? 0,
      no_pay: computed.no_pay,
      no_pay_days: computed.no_pay_days ?? 0,
      no_pay_leave: computed.no_pay_leave ?? 0,
      no_pay_from_hours: computed.no_pay_from_hours ?? 0,
      standard_hours: computed.standard_hours ?? 0,
      actual_hours: computed.actual_hours ?? 0,
      shortfall_hours: computed.shortfall_hours ?? 0,
      salary_advance: computed.salary_advance,
      stamp_duty: computed.stamp_duty,
      mobile_deduction: computed.mobile_deduction,
      paye: computed.paye,
      epf_percent: 8,
      etf_percent: computed.etf_percent,
      total_allowances: computed.total_allowances,
      total_service_charges: computed.total_service_charges,
      gross_salary: computed.gross_salary,
      total_for_epf: computed.total_for_epf,
      epf_payment: computed.epf_payment,
      employer_epf_payment: computed.employer_epf_payment,
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
    };
    const sigUrl =
      typeof entry.signature_data_url === "string" && entry.signature_data_url.length > 0
        ? entry.signature_data_url
        : null;
    const sigDate =
      typeof entry.signature_date === "string" ? (entry.signature_date.trim() || null) : null;

    const m = Number(month);
    const y = Number(year);
    const employeeIdStr = String(employee._id);
    const employeeObjectId = employee._id instanceof mongoose.Types.ObjectId ? employee._id : new mongoose.Types.ObjectId(employeeIdStr);

    let existingRun = await SalaryRun.findOne({ month: m, year: y }).lean();
    const existingEntry = existingRun?.entries?.find((e) => entryEmployeeIdString(e) === employeeIdStr);
    newEntry.signature_data_url = sigUrl ?? existingEntry?.signature_data_url ?? null;
    newEntry.signature_date = sigDate ?? existingEntry?.signature_date ?? null;

    const successResponse = (run) =>
      res.status(200).json({
        success: true,
        message: "Salary entry saved",
        run: { _id: run._id, month: run.month, year: run.year, entriesCount: (run.entries && run.entries.length) || 0 },
      });

    let run = await SalaryRun.findOneAndUpdate(
      { month: m, year: y, "entries.employee": employeeObjectId },
      { $set: { "entries.$": newEntry } },
      { new: true }
    );
    if (run) return successResponse(run);

    run = await SalaryRun.findOneAndUpdate(
      { month: m, year: y },
      { $push: { entries: newEntry } },
      { new: true }
    );
    if (run) return successResponse(run);

    const created = await SalaryRun.create({ month: m, year: y, entries: [newEntry] });
    return successResponse(created);
  } catch (error) {
    console.error("Save one salary entry error:", error);
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to save salary entry",
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

    const sig = resolvePayslipSignature(run, entry);
    const data = {
      ...entry.toObject ? entry.toObject() : entry,
      employee,
      epf_percent: entry.epf_percent ?? 12,
      etf_percent: entry.etf_percent ?? 3,
      signature_data_url: sig.signature_data_url,
      signature_date: sig.signature_date,
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
    const month = req.query.month != null ? parseInt(req.query.month, 10) : null;
    const year = req.query.year != null ? parseInt(req.query.year, 10) : null;

    if (month != null && !isNaN(month) && month >= 1 && month <= 12 && year != null && !isNaN(year)) {
      const run = await SalaryRun.findOne({ month: Number(month), year: Number(year) }).lean();
      if (!run) {
        return res.status(404).json({
          success: false,
          message: "Salary run not found",
        });
      }
      return res.status(200).json({ success: true, run: { ...run, month: run.month, year: run.year } });
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

/**
 * POST /api/salary/signature
 * Body: { month, year, signature_data_url, signature_date }
 * Saves payslip signature and optional date for the given period (creates run with empty entries if needed).
 */
export const savePayslipSignature = async (req, res) => {
  try {
    const { month, year, signature_data_url, signature_date } = req.body;
    const m = month != null ? parseInt(month, 10) : null;
    const y = year != null ? parseInt(year, 10) : null;
    if (m == null || isNaN(m) || m < 1 || m > 12 || y == null || isNaN(y)) {
      return res.status(400).json({ success: false, message: "Valid month (1-12) and year are required" });
    }
    const dataUrl =
      typeof signature_data_url === "string" && signature_data_url.length > 0
        ? signature_data_url
        : null;
    const dateStr =
      typeof signature_date === "string" ? signature_date.trim() || null : null;
    const setFields = {};
    if (signature_data_url !== undefined) setFields.signature_data_url = dataUrl;
    if (signature_date !== undefined) setFields.signature_date = dateStr;
    const run = await SalaryRun.findOneAndUpdate(
      { month: m, year: y },
      {
        ...(Object.keys(setFields).length > 0 && { $set: setFields }),
        $setOnInsert: { month: m, year: y, entries: [] },
      },
      { upsert: true, new: true }
    ).lean();
    return res.status(200).json({
      success: true,
      message: "Payslip signature saved",
      signature_data_url: run.signature_data_url || null,
      signature_date: run.signature_date || null,
    });
  } catch (error) {
    console.error("Save payslip signature error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save payslip signature",
    });
  }
};

/**
 * POST /api/salary/unfinalize
 * Body: { month, year }
 * Sets finalized: false for the run so the period can be edited again (e.g. after Revoke All).
 */
export const unfinalizeSalaryRun = async (req, res) => {
  try {
    const { month, year } = req.body;
    const m = month != null ? parseInt(month, 10) : null;
    const y = year != null ? parseInt(year, 10) : null;
    if (m == null || isNaN(m) || m < 1 || m > 12 || y == null || isNaN(y)) {
      return res.status(400).json({ success: false, message: "Valid month (1-12) and year are required" });
    }
    const run = await SalaryRun.findOneAndUpdate(
      { month: m, year: y },
      { $set: { finalized: false } },
      { new: true }
    ).lean();
    if (!run) {
      return res.status(404).json({ success: false, message: "Salary run not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Run unfinalized; period can be edited again",
      run: { _id: run._id, month: run.month, year: run.year, finalized: run.finalized },
    });
  } catch (error) {
    console.error("Unfinalize salary run error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to unfinalize",
    });
  }
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * GET /api/salary/contribution-history/:employeeId
 * Returns EPF and ETF contribution history for an employee (all saved runs).
 */
export const getContributionHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }
    const employee = await Employee.findById(employeeId).populate("userId", "name").lean();
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    const employeeIdStr = String(employee._id);
    const employeeIdRef = employee.employee_id;

    const runs = await SalaryRun.find()
      .sort({ year: -1, month: -1 })
      .lean();

    const history = [];
    for (const run of runs) {
      if (!run.entries || !run.entries.length) continue;
      const entry = run.entries.find((e) => {
        const idStr = entryEmployeeIdString(e);
        if (idStr && idStr === employeeIdStr) return true;
        if (employeeIdRef && e.employee_id && String(e.employee_id) === String(employeeIdRef)) return true;
        return false;
      });
      if (entry) {
        history.push({
          month: run.month,
          year: run.year,
          monthName: monthNames[run.month - 1],
          total_for_epf: entry.total_for_epf ?? 0,
          epf_employee_percent: 8,
          epf_employer_percent: 12,
          etf_percent: entry.etf_percent ?? 3,
          epf_payment: entry.epf_payment ?? 0,
          employer_epf_payment: entry.employer_epf_payment ?? 0,
          etf_payment: entry.etf_payment ?? 0,
        });
      }
    }

    return res.status(200).json({
      success: true,
      employee: { _id: employee._id, employee_id: employee.employee_id, name: employee.userId?.name || "N/A" },
      history,
    });
  } catch (error) {
    console.error("Get contribution history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get contribution history",
    });
  }
};

async function buildSalaryHistoryForEmployee(employee) {
  const employeeIdStr = String(employee._id);
  const employeeIdRef = employee.employee_id;

  const runs = await SalaryRun.find().sort({ year: -1, month: -1 }).lean();

  const history = [];
  for (const run of runs) {
    if (!run.entries?.length) continue;
    const entry = run.entries.find((e) => {
      const entryIdStr = entryEmployeeIdString(e);
      if (entryIdStr && entryIdStr === employeeIdStr) return true;
      if (
        employeeIdRef &&
        e.employee_id &&
        String(e.employee_id) === String(employeeIdRef)
      )
        return true;
      return false;
    });
    if (entry) {
      history.push({
        month: run.month,
        year: run.year,
        monthName: monthNames[run.month - 1],
        gross_salary: entry.gross_salary ?? 0,
        total_deduction: entry.total_deduction ?? 0,
        net_pay: entry.net_pay ?? 0,
        approval_status: entry.approval_status ?? "pending",
      });
    }
  }
  return history;
}

/**
 * GET /api/salary/my-history
 * Returns salary history for the logged-in employee (all saved runs that include this employee).
 */
export const getMySalaryHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(200).json({ success: true, history: [] });
    }
    const employee = await Employee.findOne({ userId }).lean();
    if (!employee) {
      return res.status(200).json({
        success: true,
        history: [],
      });
    }

    const history = await buildSalaryHistoryForEmployee(employee);

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Get my salary history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get salary history",
    });
  }
};

/**
 * GET /api/salary/employee-history/:employeeId
 * Returns salary history for a specific employee (admin / HR).
 */
export const getEmployeeSalaryHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await Employee.findById(employeeId)
      .populate("userId", "name email")
      .populate("department", "dep_name")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const history = await buildSalaryHistoryForEmployee(employee);

    return res.status(200).json({
      success: true,
      employee: {
        _id: employee._id,
        employee_id: employee.employee_id,
        name: employee.userId?.name || "N/A",
        designation: employee.designation || "",
        department: employee.department?.dep_name || "N/A",
      },
      history,
    });
  } catch (error) {
    console.error("Get employee salary history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get salary history",
    });
  }
};

/**
 * GET /api/salary/me/payslip?month=&year=
 * Returns payslip data for the logged-in employee for the given month/year.
 */
export const getMyPayslip = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }
    const employee = await Employee.findOne({ userId })
      .populate("userId", "name email role profileImage")
      .populate("department", "dep_name");
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

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

    const employeeIdStr = String(employee._id);
    const employeeIdRef = employee.employee_id;
    const entry = run.entries.find((e) => {
      const entryIdStr = entryEmployeeIdString(e);
      if (entryIdStr && entryIdStr === employeeIdStr) return true;
      if (employeeIdRef && e.employee_id && String(e.employee_id) === String(employeeIdRef)) return true;
      return false;
    });
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found for this period",
      });
    }

    const sig = resolvePayslipSignature(run, entry);
    const data = {
      ...(entry.toObject ? entry.toObject() : entry),
      employee,
      epf_percent: entry.epf_percent ?? 12,
      etf_percent: entry.etf_percent ?? 3,
      signature_data_url: sig.signature_data_url,
      signature_date: sig.signature_date,
    };

    return res.status(200).json({
      success: true,
      data,
      month,
      year,
    });
  } catch (error) {
    console.error("Get my payslip error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get payslip",
    });
  }
};
