import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { FaMoneyBillWave, FaFileInvoiceDollar, FaListUl, FaCheck, FaTimes, FaSave, FaPiggyBank, FaUsers, FaFilePdf, FaUser, FaChevronDown, FaChevronUp, FaPenFancy } from "react-icons/fa";
import PayslipView from "./PayslipView.jsx";
import ContributionModal from "./ContributionModal.jsx";
import AllContributionsModal from "./AllContributionsModal.jsx";
import SalarySummaryTable from "./SalarySummaryTable.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { calculateMonthlyApit } from "../../utils/sriLankaPaye.js";
import { resolveNoPayDeduction } from "../../utils/payrollAttendance.js";
import { applyJoinMonthCarryToSalaryInput, hasJoinMonthPay } from "../../utils/joinMonthPayroll.js";
import { getCurrentPayPeriod, isFuturePayPeriod } from "../../utils/payPeriod.js";
import SelectInput from "../ui/SelectInput.jsx";

const API_BASE = "http://localhost:5000/api";

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const APPROVAL = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected" };

const employeeMetaLine = (row) =>
  [
    row.employee_id,
    row.nic ? `NIC: ${row.nic}` : null,
    row.epf_number ? `EPF: ${row.epf_number}` : null,
    row.designation,
    row.department,
  ]
    .filter(Boolean)
    .join(" · ");

const defaultRow = (emp) => ({
  _id: emp._id,
  employee_id: emp.employee_id,
  nic: emp.nic || "",
  epf_number: emp.epf_number || "",
  name: emp.userId?.name || "N/A",
  designation: emp.designation || "",
  department: emp.department?.dep_name || "N/A",
  basic_salary: Number(emp.basic_salary) || 0,
  travel_allowance: Number(emp.travel_allowance) || 0,
  food_allowance: Number(emp.food_allowance) || 0,
  holiday_payment: Number(emp.holiday_payment) || 0,
  allowance_ns: Number(emp.allowance_ns) || 0,
  bonus: Number(emp.bonus) || 0,
  no_pay: Number(emp.no_pay) || 0,
  no_pay_days: Number(emp.no_pay_days) || 0,
  salary_advance: 0,
  stamp_duty: Number(emp.stamp_duty) || 0,
  mobile_deduction: Number(emp.mobile_deduction) || 0,
  epf_percent: 8,
  etf_percent: 3,
  paye: 0,
  role: emp.role || emp.userId?.role || "",
  no_pay_leave: Number(emp.no_pay_leave) || 0,
  no_pay_from_hours: Number(emp.no_pay_from_hours) || 0,
  standard_hours: Number(emp.standard_hours) || 0,
  actual_hours: Number(emp.actual_hours) || 0,
  shortfall_hours: Number(emp.shortfall_hours) || 0,
  has_attendance_records: Boolean(emp.has_attendance_records),
  join_month_carry_forward: Number(emp.join_month_carry_forward) || 0,
  join_month_worked_days: Number(emp.join_month_worked_days) || 0,
  approvalStatus: APPROVAL.PENDING,
  employee: emp,
});

const mergeNoPayApiIntoRow = (row, np) => {
  if (!np) return row;
  return {
    ...row,
    no_pay: np.no_pay ?? row.no_pay,
    no_pay_days: np.no_pay_days ?? row.no_pay_days,
    no_pay_leave: np.no_pay_leave ?? 0,
    no_pay_from_hours: np.no_pay_from_hours ?? 0,
    standard_hours: np.standard_hours ?? 0,
    actual_hours: np.actual_hours ?? 0,
    shortfall_hours: np.shortfall_hours ?? 0,
    has_attendance_records: Boolean(np.has_attendance_records),
  };
};

/** Compute totals (Sri Lanka: EPF/ETF base excludes bonus; Employee EPF 8%, Employer EPF 12%, ETF 3%). */
function computeRow(row, payrollMonth, payrollYear) {
  const basic = Number(row.basic_salary) || 0;
  const travel = Number(row.travel_allowance) || 0;
  const food = Number(row.food_allowance) || 0;
  const holiday = Number(row.holiday_payment) || 0;
  const allowanceNs = Number(row.allowance_ns) || 0;
  const bonus = Number(row.bonus) || 0;
  const joinFromRow = applyJoinMonthCarryToSalaryInput(
    {
      join_month_carry_forward: Number(row.join_month_carry_forward) || 0,
      join_month_worked_days: Number(row.join_month_worked_days) || 0,
    },
    row.employee ?? row,
    payrollMonth ?? row.payroll_month,
    payrollYear ?? row.payroll_year
  );
  const joinCarryForward = Number(joinFromRow.join_month_carry_forward) || 0;
  const joinMonthWorkedDays = Number(joinFromRow.join_month_worked_days) || 0;
  const role = row.role || row.employee?.role || "";
  const noPayResolved = resolveNoPayDeduction({
    basicSalary: basic,
    role,
    noPayDays: row.no_pay_days,
    actualHours: row.actual_hours,
    hasAttendanceRecords: row.has_attendance_records,
    payrollMonth: payrollMonth ?? row.payroll_month,
    payrollYear: payrollYear ?? row.payroll_year,
  });
  const noPay = noPayResolved.no_pay;
  const stampDuty = Number(row.stamp_duty) || 0;
  const mobileDed = Number(row.mobile_deduction) || 0;
  const salaryAdvance = Number(row.salary_advance) || 0;

  const totalAllowances = travel + food + holiday + allowanceNs + bonus;
  const grossSalary = basic + totalAllowances + joinCarryForward;
  const monthlyIncomeForApit = Math.max(0, grossSalary - noPay);
  const paye = calculateMonthlyApit(monthlyIncomeForApit);
  // EPF/ETF base: basic + fixed allowances + join-month carry (exclude bonus, after no-pay)
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
    ...row,
    join_month_carry_forward: joinCarryForward,
    join_month_worked_days: joinMonthWorkedDays,
    paye,
    no_pay: noPay,
    no_pay_leave: noPayResolved.no_pay_leave,
    no_pay_from_hours: noPayResolved.no_pay_from_hours,
    standard_hours: noPayResolved.standard_hours,
    actual_hours: noPayResolved.actual_hours,
    shortfall_hours: noPayResolved.shortfall_hours,
    has_attendance_records: noPayResolved.has_attendance_records,
    attendance_missing: noPayResolved.attendance_missing,
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

const SalaryPage = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase?.() || "";
  const canApprove = ["admin", "accountant", "account_manager", "account"].includes(role);
  const canEditAllowances = ["admin", "hr", "hr_manager"].includes(role);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payslipEmployee, setPayslipEmployee] = useState(null);
  const [payslipData, setPayslipData] = useState(null);
  const [contributionRow, setContributionRow] = useState(null);
  const [showAllContributions, setShowAllContributions] = useState(false);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summarySearch, setSummarySearch] = useState("");
  const [summaryDepartment, setSummaryDepartment] = useState("");
  const [summaryMonth, setSummaryMonth] = useState(month);
  const [summaryYear, setSummaryYear] = useState(year);
  const [summaryRun, setSummaryRun] = useState(null); // { month, year, run } when viewing summary for a different period
  const [saving, setSaving] = useState(false);
  const [savedForPeriod, setSavedForPeriod] = useState(null); // { month, year } when run exists for that period
  const [runForPeriod, setRunForPeriod] = useState(null); // { month, year, run } to merge saved data into rows
  const [savingEmployeeId, setSavingEmployeeId] = useState(null);
  const [payslipSignature, setPayslipSignature] = useState(null); // data URL; required to enable Save All Salaries
  const [payslipSignatureDate, setPayslipSignatureDate] = useState(""); // date string for payslips (saved with run)
  const [savingSignature, setSavingSignature] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false); // bulk approve/reject/revoke in progress
  const [activeTab, setActiveTab] = useState("calculate"); // "calculate" | "calculated"
  const [currentCalculateIndex, setCurrentCalculateIndex] = useState(0); // which employee card to show in "Salary to Calculate" (single-card flow)
  const [calculatedPopupRow, setCalculatedPopupRow] = useState(null); // row for salary card popup in Calculated Salary tab
  const [expandedCalculatedDepts, setExpandedCalculatedDepts] = useState(() => new Set()); // department names expanded in Calculated Salary list
  const [deferredEmployees, setDeferredEmployees] = useState([]);
  const employeesRef = useRef([]); // base employee list to reset rows when month/year changes
  const prevPeriodRef = useRef({ month: null, year: null }); // so we only reset rows when period actually changes, not on first load
  const monthYearRef = useRef({ month, year }); // current period for use inside fetchEmployees
  monthYearRef.current = { month, year };

  /** Match run entry to row by employee id. */
  const entryMatchesRow = (entry, row) => {
    const eId = entry?.employee ? String(entry.employee) : "";
    return eId && eId === String(row._id) || (entry?.employee_id && row.employee_id && String(entry.employee_id) === String(row.employee_id));
  };

  /** Overlay saved run entries onto rows so form shows persisted data after refresh. */
  const mergeRunIntoRows = (currentRows, run) => {
    if (!run?.entries?.length || !currentRows?.length) return currentRows;
    return currentRows.map((row) => {
      const entry = run.entries.find((e) => entryMatchesRow(e, row));
      if (!entry) return row;
      const savedStatus = entry.approval_status && ["pending", "approved", "rejected"].includes(entry.approval_status)
        ? entry.approval_status
        : APPROVAL.PENDING;
      return {
        ...row,
        approvalStatus: savedStatus,
        nic: entry.nic ?? row.nic,
        epf_number: entry.epf_number ?? row.epf_number,
        basic_salary: entry.basic_salary ?? row.basic_salary,
        travel_allowance: entry.travel_allowance ?? 0,
        food_allowance: entry.food_allowance ?? 0,
        holiday_payment: entry.holiday_payment ?? 0,
        allowance_ns: entry.allowance_ns ?? 0,
        bonus: entry.bonus ?? 0,
        // Keep no_pay from row (calculated from DB nopay leave count); do not overwrite with saved entry
        no_pay: row.no_pay ?? 0,
        // Keep salary_advance from row (total approved advance) — applied separately from accepted-totals
        stamp_duty: entry.stamp_duty ?? 0,
        mobile_deduction: entry.mobile_deduction ?? 0,
        join_month_carry_forward: entry.join_month_carry_forward ?? row.join_month_carry_forward ?? 0,
        join_month_worked_days: entry.join_month_worked_days ?? row.join_month_worked_days ?? 0,
        epf_percent: entry.epf_percent ?? 8,
        etf_percent: entry.etf_percent ?? 3,
      };
    });
  };

  const fetchEmployees = async () => {
    try {
      setError("");
      let res;
      try {
        const { month: m, year: y } = monthYearRef.current;
        res = await axios.get(`${API_BASE}/salary/employees`, {
          params: { month: m, year: y },
          headers: getAuthHeader(),
        });
      } catch (salaryErr) {
        if (salaryErr.response?.status === 403 || salaryErr.response?.status === 404 || salaryErr.code === "ERR_NETWORK") {
          res = await axios.get(`${API_BASE}/employees`, {
            headers: getAuthHeader(),
          });
        } else {
          throw salaryErr;
        }
      }
      if (res.data.success) {
        const employees = res.data.employees || [];
        employeesRef.current = employees;
        setDeferredEmployees(Array.isArray(res.data.deferredEmployees) ? res.data.deferredEmployees : []);
        setRows(employees.map((emp) => defaultRow(emp)));
        // Fetch no-pay from DB (approved nopay leave count) and merge into rows so no pay field is never zero by mistake
        const { month: m, year: y } = monthYearRef.current;
        axios.get(`${API_BASE}/salary/no-pay`, { params: { month: m, year: y }, headers: getAuthHeader() })
          .then((noPayRes) => {
            if (noPayRes.data?.success && Array.isArray(noPayRes.data.data)) {
              const byId = {};
              noPayRes.data.data.forEach((o) => { byId[o.employeeId] = o; });
              setRows((prev) => prev.map((r) => mergeNoPayApiIntoRow(r, byId[r._id] || byId[String(r._id)])));
            }
          })
          .catch(() => {});
        // Pre-fill salary advance from accepted advance requests
        try {
          const advRes = await axios.get(`${API_BASE}/advance/accepted-totals`, { headers: getAuthHeader() });
          if (advRes.data?.success && Array.isArray(advRes.data.totals)) {
            const map = {};
            advRes.data.totals.forEach((t) => { map[t.employeeId] = Number(t.totalAmount) || 0; });
            setRows((prev) => prev.map((r) => ({ ...r, salary_advance: map[r._id] ?? r.salary_advance })));
          }
        } catch (_) { /* ignore */ }
        // Load current month run so saved salary details show on first load (rows already set above)
        const currentMonth = Number(monthYearRef.current.month);
        const currentYear = Number(monthYearRef.current.year);
        try {
          const runRes = await axios.get(`${API_BASE}/salary/runs`, {
            params: { month: currentMonth, year: currentYear },
            headers: getAuthHeader(),
          });
          const run = runRes.data?.run;
          if (runRes.data?.success && run && Number(run.month) === currentMonth && Number(run.year) === currentYear) {
            setSavedForPeriod({ month: currentMonth, year: currentYear });
            setRunForPeriod({ month: currentMonth, year: currentYear, run });
            setPayslipSignature(run.signature_data_url ?? null);
            setPayslipSignatureDate(run.signature_date ?? "");
          }
        } catch (_) { /* ignore */ }
      } else {
        employeesRef.current = [];
        setDeferredEmployees([]);
        setRows([]);
      }
    } catch (err) {
      console.error(err);
      employeesRef.current = [];
      setDeferredEmployees([]);
      const msg = err.response?.data?.message || err.response?.data?.error || (err.code === "ERR_NETWORK" ? "Cannot reach server. Is the backend running on port 5000?" : "Failed to load employees");
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Load run for current period: set savedForPeriod and runForPeriod so rows can be merged with saved data
  useEffect(() => {
    const currentMonth = Number(month);
    const currentYear = Number(year);
    const prev = prevPeriodRef.current;
    const periodChanged = prev.month !== null && (prev.month !== currentMonth || prev.year !== currentYear);
    prevPeriodRef.current = { month: currentMonth, year: currentYear };
    let cancelled = false;

    // Only clear, reset rows, and fetch run when user actually changes period (not on first load)
    if (periodChanged) {
      setRunForPeriod(null);
      setSavedForPeriod(null);
      setPayslipSignature(null);
      setPayslipSignatureDate("");
      axios.get(`${API_BASE}/salary/employees`, {
        params: { month: currentMonth, year: currentYear },
        headers: getAuthHeader(),
      }).then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          const employees = res.data.employees || [];
          employeesRef.current = employees;
          setDeferredEmployees(Array.isArray(res.data.deferredEmployees) ? res.data.deferredEmployees : []);
          setRows(employees.map((emp) => defaultRow(emp)));
        } else {
          setDeferredEmployees([]);
          setRows(employeesRef.current.map((emp) => defaultRow(emp)));
        }
        // Merge no-pay from DB for selected period
        axios.get(`${API_BASE}/salary/no-pay`, { params: { month: currentMonth, year: currentYear }, headers: getAuthHeader() })
          .then((noPayRes) => {
            if (cancelled) return;
            if (noPayRes.data?.success && Array.isArray(noPayRes.data.data)) {
              const byId = {};
              noPayRes.data.data.forEach((o) => { byId[o.employeeId] = o; });
              setRows((prev) => prev.map((r) => mergeNoPayApiIntoRow(r, byId[r._id] || byId[String(r._id)])));
            }
          })
          .catch(() => {});
      }).catch(() => {
        if (!cancelled && employeesRef.current?.length) {
          setRows(employeesRef.current.map((emp) => defaultRow(emp)));
        }
      });
    }
    if (periodChanged) {
      axios.get(`${API_BASE}/advance/accepted-totals`, { headers: getAuthHeader() }).then((advRes) => {
        if (cancelled) return;
        if (advRes.data?.success && Array.isArray(advRes.data.totals)) {
          const map = {};
          advRes.data.totals.forEach((t) => { map[t.employeeId] = Number(t.totalAmount) || 0; });
          setRows((prevRows) => prevRows.map((r) => ({ ...r, salary_advance: map[r._id] ?? r.salary_advance })));
        }
      }).catch(() => {});
    }
    // On first load we don't fetch run here (fetchEmployees does it after rows are set). When period changes we fetch.
    if (!periodChanged) {
      return () => { cancelled = true; };
    }
    axios
      .get(`${API_BASE}/salary/runs`, { params: { month: currentMonth, year: currentYear }, headers: getAuthHeader() })
      .then((res) => {
        if (cancelled) return;
        const run = res.data?.run;
        if (res.data?.success && run && Number(run.month) === currentMonth && Number(run.year) === currentYear) {
          setSavedForPeriod({ month: currentMonth, year: currentYear });
          setRunForPeriod({ month: currentMonth, year: currentYear, run });
          setPayslipSignature(run.signature_data_url ?? null);
          setPayslipSignatureDate(run.signature_date ?? "");
        } else {
          setSavedForPeriod(null);
          setRunForPeriod(null);
          setPayslipSignature(null);
          setPayslipSignatureDate("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedForPeriod(null);
          setRunForPeriod(null);
          setPayslipSignature(null);
          setPayslipSignatureDate("");
        }
      });
    return () => { cancelled = true; };
  }, [month, year]);

  // When we have a run for the current period and rows exist, merge saved entries into rows (persist after refresh)
  useEffect(() => {
    const currentMonth = Number(month);
    const currentYear = Number(year);
    if (!runForPeriod?.run || Number(runForPeriod.month) !== currentMonth || Number(runForPeriod.year) !== currentYear) return;
    setRows((prev) => {
      if (!prev.length) return prev;
      return mergeRunIntoRows(prev, runForPeriod.run);
    });
  }, [runForPeriod, month, year, rows.length]);

  // Always apply total approved salary advance per employee so each card shows and uses it in calculations (every month)
  useEffect(() => {
    if (rows.length === 0) return;
    let cancelled = false;
    axios.get(`${API_BASE}/advance/accepted-totals`, { headers: getAuthHeader() }).then((res) => {
      if (cancelled) return;
      if (res.data?.success && Array.isArray(res.data.totals)) {
        const map = {};
        res.data.totals.forEach((t) => { map[t.employeeId] = Number(t.totalAmount) || 0; });
        setRows((prev) => prev.map((r) => ({ ...r, salary_advance: map[r._id] ?? r.salary_advance })));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [month, year, rows.length, runForPeriod]);

  // Show first employee whose salary is not yet saved (no entry in run for this period)
  const runKey = runForPeriod && Number(runForPeriod.month) === Number(month) && Number(runForPeriod.year) === Number(year)
    ? `${runForPeriod.run?.entries?.length ?? 0}`
    : "";
  useEffect(() => {
    if (rows.length === 0) {
      setCurrentCalculateIndex(0);
      return;
    }

    const run = runForPeriod?.run;
    const hasEntry = (row) => run?.entries?.some((e) => entryMatchesRow(e, row));
    const firstToCalculate = run?.entries?.length
      ? rows.findIndex((row) => !hasEntry(row))
      : 0;
    const target = firstToCalculate >= 0 ? firstToCalculate : 0;
    setCurrentCalculateIndex(Math.min(target, rows.length - 1));
  }, [month, year, rows.length, runKey]);

  useEffect(() => {
    if (isFuturePayPeriod(month, year)) {
      const c = getCurrentPayPeriod();
      setMonth(c.month);
      setYear(c.year);
      setSummaryMonth(c.month);
      setSummaryYear(c.year);
    }
  }, [month, year]);

  useEffect(() => {
    if (isFuturePayPeriod(summaryMonth, summaryYear)) {
      const c = getCurrentPayPeriod();
      setSummaryMonth(c.month);
      setSummaryYear(c.year);
    }
  }, [summaryMonth, summaryYear]);

  // When summary is shown for a different period, fetch that run for the paysheet table
  useEffect(() => {
    const sm = Number(summaryMonth);
    const sy = Number(summaryYear);
    const samePeriod = sm === Number(month) && sy === Number(year);
    if (samePeriod || !showSummary) {
      setSummaryRun(null);
      return;
    }
    let cancelled = false;
    axios.get(`${API_BASE}/salary/runs`, { params: { month: sm, year: sy }, headers: getAuthHeader() })
      .then((res) => {
        if (cancelled) return;
        const run = res.data?.run;
        if (res.data?.success && run && Number(run.month) === sm && Number(run.year) === sy) {
          setSummaryRun({ month: sm, year: sy, run });
        } else {
          setSummaryRun({ month: sm, year: sy, run: null });
        }
      })
      .catch(() => {
        if (!cancelled) setSummaryRun({ month: sm, year: sy, run: null });
      });
    return () => { cancelled = true; };
  }, [showSummary, summaryMonth, summaryYear, month, year]);

  const updateRow = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      const num = field.includes("percent") ? Number(value) : Number(value) || 0;
      next[idx] = { ...next[idx], [field]: num };
      return next;
    });
  };

  const setApproval = (idx, status) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], approvalStatus: status };
      return next;
    });
    // Persist approval status so it survives refresh (save this employee's entry for current period)
    const row = rows[idx];
    if (row) {
      const entry = {
        employeeId: row._id != null ? String(row._id) : null,
        approval_status: status,
        basic_salary: row.basic_salary,
        travel_allowance: row.travel_allowance,
        food_allowance: row.food_allowance,
        holiday_payment: row.holiday_payment,
        allowance_ns: row.allowance_ns,
        bonus: row.bonus,
        no_pay: row.no_pay,
        salary_advance: row.salary_advance,
        stamp_duty: row.stamp_duty,
        mobile_deduction: row.mobile_deduction,
        paye: computeRow(row, month, year).paye,
        epf_percent: row.epf_percent,
        etf_percent: row.etf_percent,
      };
      if (entry.employeeId) {
        axios.post(`${API_BASE}/salary/save-one`, { month, year, entry }, { headers: getAuthHeader() })
          .then((res) => { if (res.data.success) setSavedForPeriod({ month, year }); })
          .catch(() => {});
      }
    }
  };

  /** Bulk set approval status for all employees with saved salary in the current period (Calculated Salary tab). */
  const bulkSetApprovalForCalculated = async (status) => {
    const run = runForPeriod?.run;
    if (!run?.entries?.length) return;
    const calculatedRows = rows.filter((row) => run.entries.some((e) => entryMatchesRow(e, row)));
    if (calculatedRows.length === 0) return;
    setBulkApproving(true);
    setError("");
    try {
      const promises = calculatedRows.map((row) => {
        const entry = {
          employeeId: row._id != null ? String(row._id) : null,
          approval_status: status,
          basic_salary: row.basic_salary,
          travel_allowance: row.travel_allowance,
          food_allowance: row.food_allowance,
          holiday_payment: row.holiday_payment,
          allowance_ns: row.allowance_ns,
          bonus: row.bonus,
          no_pay: row.no_pay,
          salary_advance: row.salary_advance,
          stamp_duty: row.stamp_duty,
          mobile_deduction: row.mobile_deduction,
          paye: computeRow(row, month, year).paye,
          epf_percent: row.epf_percent,
          etf_percent: row.etf_percent,
        };
        return entry.employeeId
          ? axios.post(`${API_BASE}/salary/save-one`, { month, year, entry }, { headers: getAuthHeader() })
          : Promise.resolve({ data: { success: false } });
      });
      await Promise.all(promises);
      setSavedForPeriod({ month, year });
      if (status === APPROVAL.PENDING) {
        await axios.post(`${API_BASE}/salary/unfinalize`, { month: Number(month), year: Number(year) }, { headers: getAuthHeader() });
      }
      const runRes = await axios.get(`${API_BASE}/salary/runs`, { params: { month: Number(month), year: Number(year) }, headers: getAuthHeader() });
      const updatedRun = runRes.data?.run;
      if (runRes.data?.success && updatedRun && Number(updatedRun.month) === Number(month) && Number(updatedRun.year) === Number(year)) {
        setRunForPeriod({ month: Number(month), year: Number(year), run: updatedRun });
        setRows((prev) => mergeRunIntoRows(prev, updatedRun));
      }
    } catch (err) {
      console.error("Bulk approval error:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to update some salaries");
    } finally {
      setBulkApproving(false);
    }
  };

  const openPayslip = (row) => {
    if (row.approvalStatus !== APPROVAL.APPROVED) return;
    const computed = computeRow(row, month, year);
    setPayslipData(computed);
    setPayslipEmployee(row.employee);
  };

  /** Get amounts for a summary row (full row → computeRow; entry-like row → use stored amounts). */
  const getSummaryAmounts = (row) => {
    if (row.gross_salary != null && row.total_deduction != null && row.net_pay != null) {
      return { gross_salary: row.gross_salary, total_deduction: row.total_deduction, net_pay: row.net_pay };
    }
    return computeRow(row, month, year);
  };

  /** Download salary summary as PDF; uses provided rows (filtered or all approved). */
  const downloadSummaryPdf = (filteredRows, approvedRows, periodMonth, periodYear, monthNamesArr) => {
    if (filteredRows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 12;
    let y = 14;
    doc.setFontSize(14);
    doc.setTextColor(30, 64, 175);
    doc.text("Salary Summary", pageW / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const periodLabel = `${monthNamesArr[periodMonth - 1]} ${periodYear}`;
    doc.text(periodLabel, pageW / 2, y, { align: "center" });
    if (filteredRows.length < approvedRows.length) {
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Filtered: ${filteredRows.length} of ${approvedRows.length} employees`, pageW / 2, y, { align: "center" });
    }
    y += 10;
    const totalTableW = pageW - 2 * margin;
    const colEmployee = totalTableW * 0.22;
    const colNic = totalTableW * 0.11;
    const colEpf = totalTableW * 0.11;
    const colDept = totalTableW * 0.12;
    const colGross = totalTableW * 0.13;
    const colDed = totalTableW * 0.13;
    const colNet = totalTableW * 0.18;
    const rowH = 7;
    const xNic = margin + colEmployee;
    const xEpf = xNic + colNic;
    const xDept = xEpf + colEpf;
    const xGross = xDept + colDept;
    const xDed = xGross + colGross;
    const xNet = xDed + colDed;
    doc.setFillColor(240, 247, 255);
    doc.rect(margin, y, totalTableW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Employee", margin + 2, y + 4.5);
    doc.text("NIC", xNic + 2, y + 4.5);
    doc.text("EPF No.", xEpf + 2, y + 4.5);
    doc.text("Department", xDept + 2, y + 4.5);
    doc.text("Gross Salary", xGross + colGross - 2, y + 4.5, { align: "right" });
    doc.text("Total Deduction", xDed + colDed - 2, y + 4.5, { align: "right" });
    doc.text("Net Pay", margin + totalTableW - 2, y + 4.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += rowH;
    filteredRows.forEach((row) => {
      if (y + rowH > doc.internal.pageSize.getHeight() - 18) {
        doc.addPage("landscape");
        y = 14;
      }
      const c = getSummaryAmounts(row);
      doc.setFontSize(8);
      doc.text((row.name || "—").slice(0, 22), margin + 2, y + 4.5);
      doc.text((row.nic || "—").slice(0, 12), xNic + 2, y + 4.5);
      doc.text((row.epf_number || "—").slice(0, 12), xEpf + 2, y + 4.5);
      doc.text((row.department || "—").slice(0, 12), xDept + 2, y + 4.5);
      doc.text(Number(c.gross_salary).toFixed(2), xGross + colGross - 2, y + 4.5, { align: "right" });
      doc.text(Number(c.total_deduction).toFixed(2), xDed + colDed - 2, y + 4.5, { align: "right" });
      doc.text(Number(c.net_pay).toFixed(2), margin + totalTableW - 2, y + 4.5, { align: "right" });
      y += rowH;
    });
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + totalTableW, y);
    y += rowH;
    const totGross = filteredRows.reduce((s, r) => s + Number(getSummaryAmounts(r).gross_salary), 0);
    const totDed = filteredRows.reduce((s, r) => s + Number(getSummaryAmounts(r).total_deduction), 0);
    const totNet = filteredRows.reduce((s, r) => s + Number(getSummaryAmounts(r).net_pay), 0);
    doc.setFont("helvetica", "bold");
    doc.text(filteredRows.length < approvedRows.length ? `Total (${filteredRows.length} shown)` : "Total", margin + 2, y + 4.5);
    doc.text(totGross.toFixed(2), xGross + colGross - 2, y + 4.5, { align: "right" });
    doc.text(totDed.toFixed(2), xDed + colDed - 2, y + 4.5, { align: "right" });
    doc.setTextColor(21, 128, 61);
    doc.text(totNet.toFixed(2), margin + totalTableW - 2, y + 4.5, { align: "right" });
    doc.setTextColor(0, 0, 0);
    const safeName = `Salary_Summary_${periodLabel.replace(/\s+/g, "_")}${filteredRows.length < approvedRows.length ? `_${filteredRows.length}_of_${approvedRows.length}` : ""}.pdf`;
    doc.save(safeName);
  };

  const closePayslip = () => {
    setPayslipEmployee(null);
    setPayslipData(null);
  };

  const allApproved = rows.length > 0 && rows.every((r) => r.approvalStatus === APPROVAL.APPROVED);
  const runForCurrentPeriod = runForPeriod && Number(runForPeriod.month) === Number(month) && Number(runForPeriod.year) === Number(year) ? runForPeriod.run : null;
  const hasGlobalSignature = !!(runForCurrentPeriod?.signature_data_url);
  const entries = runForCurrentPeriod?.entries ?? [];
  const allEntriesHaveSignature = entries.length > 0 && entries.every((e) => !!(e.signature_data_url));
  const hasPayslipSignature = !!payslipSignature || hasGlobalSignature || allEntriesHaveSignature;
  const canSaveAllSalaries = allApproved && hasPayslipSignature;
  const isPeriodSaved = savedForPeriod && savedForPeriod.month === month && savedForPeriod.year === year;
  const isPeriodLocked = runForPeriod && Number(runForPeriod.month) === Number(month) && Number(runForPeriod.year) === Number(year) && runForPeriod.run?.finalized === true;

  /** Save this employee's payslip data only. Does NOT update the run's signature (use Calculated Salary tab for that). */
  const handleSavePayslipFromModal = async (signatureDataUrl) => {
    if (!signatureDataUrl || savingSignature || !payslipEmployee || !payslipData) return;
    try {
      setSavingSignature(true);
      setError("");
      const empId = payslipEmployee._id ? String(payslipEmployee._id) : null;
      if (!empId) {
        setError("Employee not found");
        setSavingSignature(false);
        return;
      }
      const entry = {
        employeeId: empId,
        approval_status: payslipData.approvalStatus ?? "approved",
        basic_salary: payslipData.basic_salary,
        travel_allowance: payslipData.travel_allowance ?? 0,
        food_allowance: payslipData.food_allowance ?? 0,
        holiday_payment: payslipData.holiday_payment ?? 0,
        allowance_ns: payslipData.allowance_ns ?? 0,
        bonus: payslipData.bonus ?? 0,
        no_pay: payslipData.no_pay ?? 0,
        salary_advance: payslipData.salary_advance ?? 0,
        stamp_duty: payslipData.stamp_duty ?? 0,
        mobile_deduction: payslipData.mobile_deduction ?? 0,
        paye: payslipData.paye ?? 0,
        epf_percent: 8,
        etf_percent: payslipData.etf_percent ?? 3,
        signature_data_url: signatureDataUrl,
      };
      const res = await axios.post(
        `${API_BASE}/salary/save-one`,
        { month: Number(month), year: Number(year), entry },
        { headers: getAuthHeader(), maxContentLength: Infinity, maxBodyLength: Infinity }
      );
      if (res.data.success) {
        setSavedForPeriod({ month, year });
        setError("");
        const m = Number(month);
        const y = Number(year);
        const runRes = await axios.get(`${API_BASE}/salary/runs`, { params: { month: m, year: y }, headers: getAuthHeader() });
        const run = runRes.data?.run;
        if (runRes.data?.success && run && Number(run.month) === m && Number(run.year) === y) {
          setRunForPeriod({ month: m, year: y, run });
          setRows((prev) => mergeRunIntoRows(prev, run));
        }
        const empName = payslipData.name || payslipEmployee?.userId?.name || "Employee";
        closePayslip();
        alert(`Payslip data saved for ${empName}.`);
      } else {
        setError(res.data.message || "Failed to save payslip");
      }
    } catch (err) {
      console.error("Save payslip error:", err?.response?.data || err);
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        (err.response?.status === 413 ? "Signature image is too large. Try a smaller image." : "Failed to save payslip");
      setError(msg);
    } finally {
      setSavingSignature(false);
    }
  };

  /** Save payslip signature and date for the current period (from Calculated Salary tab). */
  const handleSaveSignatureAndDate = async (signatureDataUrl, signatureDate) => {
    if (savingSignature) return;
    try {
      setSavingSignature(true);
      setError("");
      // Default date to today if none is provided, so Calculated Salary tab gets a meaningful date automatically
      let effectiveDate = signatureDate;
      if (effectiveDate == null || String(effectiveDate).trim() === "") {
        effectiveDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        setPayslipSignatureDate(effectiveDate);
      }
      const body = { month: Number(month), year: Number(year) };
      if (signatureDataUrl && typeof signatureDataUrl === "string") body.signature_data_url = signatureDataUrl;
      if (effectiveDate != null && String(effectiveDate).trim() !== "") {
        body.signature_date = String(effectiveDate).trim();
      }
      const res = await axios.post(`${API_BASE}/salary/signature`, body, {
        headers: getAuthHeader(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      if (res.data.success) {
        if (res.data.signature_data_url != null) setPayslipSignature(res.data.signature_data_url);
        if (res.data.signature_date != null) setPayslipSignatureDate(res.data.signature_date);
        setSavedForPeriod({ month, year });
        setError("");
      } else {
        setError(res.data.message || "Failed to save");
      }
    } catch (err) {
      console.error("Save signature/date error:", err?.response?.data || err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to save signature and date");
    } finally {
      setSavingSignature(false);
    }
  };

  const saveOneEmployee = async (row, onSuccess) => {
    const empId = row._id != null ? String(row._id) : null;
    if (!empId) {
      setError("Employee ID is missing");
      return;
    }
    try {
      setSavingEmployeeId(row._id);
      setError("");
      const entry = {
        employeeId: empId,
        approval_status: row.approvalStatus ?? "pending",
        basic_salary: row.basic_salary,
        travel_allowance: row.travel_allowance,
        food_allowance: row.food_allowance,
        holiday_payment: row.holiday_payment,
        allowance_ns: row.allowance_ns,
        bonus: row.bonus,
        no_pay: row.no_pay,
        salary_advance: row.salary_advance,
        stamp_duty: row.stamp_duty,
        mobile_deduction: row.mobile_deduction,
        paye: computeRow(row, month, year).paye,
        epf_percent: row.epf_percent,
        etf_percent: row.etf_percent,
      };
      const res = await axios.post(
        `${API_BASE}/salary/save-one`,
        { month, year, entry },
        { headers: getAuthHeader() }
      );
      if (res.data.success) {
        setSavedForPeriod({ month, year });
        if (typeof onSuccess === "function") onSuccess();
        // Refetch run so "first to calculate" and Calculated Salary tab stay in sync
        const m = Number(month);
        const y = Number(year);
        axios.get(`${API_BASE}/salary/runs`, { params: { month: m, year: y }, headers: getAuthHeader() })
          .then((runRes) => {
            const run = runRes.data?.run;
            if (runRes.data?.success && run && Number(run.month) === m && Number(run.year) === y) {
              setRunForPeriod({ month: m, year: y, run });
              setPayslipSignature(run.signature_data_url ?? null);
              setPayslipSignatureDate(run.signature_date ?? "");
              setRows((prev) => mergeRunIntoRows(prev, run));
            }
          })
          .catch(() => {});
      } else {
        setError(res.data.message || "Save failed");
      }
    } catch (err) {
      console.error("Save one employee error:", err?.response?.data || err);
      const msg = err.response?.data?.message ?? err.response?.data?.error ?? (err.code === "ERR_NETWORK" ? "Cannot reach server. Check if backend is running." : "Failed to save");
      setError(msg);
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const saveAllSalaries = async () => {
    if (!canSaveAllSalaries || saving) return;
    try {
      setError("");
      setSaving(true);
      const entries = rows.map((row) => {
        const computed = computeRow(row, month, year);
        return {
          employeeId: row._id,
          approval_status: row.approvalStatus ?? "pending",
          basic_salary: row.basic_salary,
          travel_allowance: row.travel_allowance,
          food_allowance: row.food_allowance,
          holiday_payment: row.holiday_payment,
          allowance_ns: row.allowance_ns,
          bonus: row.bonus,
          no_pay: row.no_pay,
          salary_advance: row.salary_advance,
          stamp_duty: row.stamp_duty,
          mobile_deduction: row.mobile_deduction,
          paye: computed.paye,
          epf_percent: row.epf_percent,
          etf_percent: row.etf_percent,
        };
      });
      const res = await axios.post(
        `${API_BASE}/salary/save`,
        { month, year, entries },
        { headers: getAuthHeader() }
      );
      if (res.data.success) {
        setError("");
        setSavedForPeriod({ month, year });
        alert(`Salaries for ${monthNames[month - 1]} ${year} saved successfully.`);
        const m = Number(month);
        const y = Number(year);
        const runRes = await axios.get(`${API_BASE}/salary/runs`, { params: { month: m, year: y }, headers: getAuthHeader() });
        const updatedRun = runRes.data?.run;
        if (runRes.data?.success && updatedRun && Number(updatedRun.month) === m && Number(updatedRun.year) === y) {
          setRunForPeriod({ month: m, year: y, run: updatedRun });
          setPayslipSignature(updatedRun.signature_data_url ?? null);
          setPayslipSignatureDate(updatedRun.signature_date ?? "");
          setRows((prev) => mergeRunIntoRows(prev, updatedRun));
        }
      } else {
        setError(res.data.message || "Save failed");
      }
    } catch (err) {
      console.error("Save all salaries error:", err?.response?.data || err);
      const msg = err.response?.data?.message ?? err.response?.data?.error ?? (err.code === "ERR_NETWORK" ? "Cannot reach server. Check if backend is running." : "Failed to save salaries");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentPayPeriod = getCurrentPayPeriod();
  const periodNotStarted = isFuturePayPeriod(month, year);
  const payPeriodYearOptions = [
    currentPayPeriod.year,
    currentPayPeriod.year - 1,
    currentPayPeriod.year - 2,
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600 font-medium">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Header Section - same as other pages */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <FaMoneyBillWave className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Salary & Payslips
          </h1>
          <p className="text-gray-600 text-lg">Manage payroll and view payslips by month</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Controls Section */}
        <div className="bg-linear-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Pay period:</span>
              <SelectInput
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                size="sm"
                searchable={false}
                className="min-w-[9.5rem] shadow-sm font-medium"
                options={monthNames.map((m, i) => {
                  const mNum = i + 1;
                  const future = isFuturePayPeriod(mNum, year);
                  return {
                    value: mNum,
                    label: `${m}${future ? " (not started)" : ""}`,
                    disabled: future,
                  };
                })}
              />
              <SelectInput
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                size="sm"
                searchable={false}
                className="min-w-[5.5rem] shadow-sm font-medium"
                options={payPeriodYearOptions.map((y) => ({
                  value: y,
                  label: String(y),
                }))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowSummary((s) => !s)}
                className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${showSummary ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white border-2 border-gray-200 text-gray-800 hover:bg-gray-50"}`}
              >
                <FaListUl /> {showSummary ? "Hide Summary" : "Salary Summary"}
              </button>
              <button
                type="button"
                onClick={() => setShowAllContributions(true)}
                className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg bg-amber-500 text-white hover:bg-amber-600"
              >
                <FaUsers /> All Contributions
              </button>
              <button
                type="button"
                onClick={saveAllSalaries}
                disabled={!canSaveAllSalaries || saving || isPeriodLocked || periodNotStarted}
                title={isPeriodLocked ? "Salaries for this period have been saved; editing is locked." : !allApproved ? "Approve all employees first to save salaries for this month" : !hasPayslipSignature ? "Add payslip signature (global or on each card) to enable Save All Salaries" : ""}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                <FaSave /> {saving ? "Saving…" : "Save All Salaries"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Tabs inside salary card */}
          {!periodNotStarted && (
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-4" aria-label="Salary tabs">
              <button
                type="button"
                onClick={() => setActiveTab("calculate")}
                className={`px-4 py-2 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
                  activeTab === "calculate"
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Salary to Calculate
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("calculated")}
                className={`px-4 py-2 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
                  activeTab === "calculated"
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                    : "border-transparent text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                Calculated Salary
              </button>
            </nav>
          </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {!periodNotStarted && (() => {
            const run = runForPeriod?.run;
            const hasSavedEntry = (row) => run?.entries?.some((e) => entryMatchesRow(e, row));
            const allSaved = rows.length > 0 && run?.entries?.length > 0 && rows.every(hasSavedEntry);
            return (
              <>
                <p className={`text-gray-600 text-sm ${allSaved ? "mb-2" : "mb-6"}`}>
                  Pay period: <strong>{monthNames[month - 1]} {year}</strong>. Edit values in each section; totals update automatically. Use &quot;Get Payslip&quot; for the final payslip.
                </p>
                {allSaved && (
                  <p className="text-emerald-700 text-sm font-medium mb-6 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg inline-block">
                    All salaries have been calculated for this period. View them in the <strong>Calculated Salary</strong> tab.
                  </p>
                )}
              </>
            );
          })()}

          {showSummary && rows.length > 0 && (() => {
            const isSummaryCurrentPeriod = summaryMonth === month && summaryYear === year;
            const summaryLoading = !isSummaryCurrentPeriod && (!summaryRun || summaryRun.month !== summaryMonth || summaryRun.year !== summaryYear);
            const approvedRows = isSummaryCurrentPeriod
              ? rows.filter((r) => r.approvalStatus === APPROVAL.APPROVED)
              : (summaryRun?.run?.entries || [])
                  .filter((e) => e.approval_status === "approved")
                  .map((e) => ({
                    _id: e.employee,
                    name: e.name,
                    employee_id: e.employee_id,
                    nic: e.nic || "",
                    epf_number: e.epf_number || "",
                    designation: e.designation || "",
                    department: e.department,
                    gross_salary: e.gross_salary,
                    total_deduction: e.total_deduction,
                    net_pay: e.net_pay,
                  }));
            const searchLower = (summarySearch || "").trim().toLowerCase();
            const departments = [...new Set(approvedRows.map((r) => r.department).filter(Boolean))].sort();
            const filteredRows = approvedRows.filter((r) => {
              const matchSearch = !searchLower || (r.name || "").toLowerCase().includes(searchLower) || (r.employee_id || "").toLowerCase().includes(searchLower) || (r.nic || "").toLowerCase().includes(searchLower) || (r.epf_number || "").toLowerCase().includes(searchLower) || (r.department || "").toLowerCase().includes(searchLower);
              const matchDept = !summaryDepartment || (r.department || "") === summaryDepartment;
              return matchSearch && matchDept;
            });
            const totalRowsLabel = isSummaryCurrentPeriod ? rows.length : (summaryRun?.run?.entries?.length ?? 0);
            return (
              <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaListUl className="text-blue-600" />
                    Salary Summary
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {monthNames[summaryMonth - 1]} {summaryYear} — Only approved employees ({approvedRows.length} of {totalRowsLabel})
                    {!isSummaryCurrentPeriod && " (other period)"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Month:</span>
                    <SelectInput
                      value={summaryMonth}
                      onChange={(e) => setSummaryMonth(Number(e.target.value))}
                      size="sm"
                      searchable={false}
                      className="min-w-[9.5rem]"
                      options={monthNames.map((m, i) => {
                        const mNum = i + 1;
                        const future = isFuturePayPeriod(mNum, summaryYear);
                        return {
                          value: mNum,
                          label: `${m}${future ? " (not started)" : ""}`,
                          disabled: future,
                        };
                      })}
                    />
                    <span className="text-sm font-medium text-gray-700">Year:</span>
                    <SelectInput
                      value={summaryYear}
                      onChange={(e) => setSummaryYear(Number(e.target.value))}
                      size="sm"
                      searchable={false}
                      className="min-w-[5.5rem]"
                      options={payPeriodYearOptions.map((y) => ({
                        value: y,
                        label: String(y),
                      }))}
                    />
                    <input
                      type="text"
                      placeholder="Search by name, ID, NIC, EPF no. or department..."
                      value={summarySearch}
                      onChange={(e) => setSummarySearch(e.target.value)}
                      className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white text-sm min-w-[200px]"
                    />
                    <SelectInput
                      value={summaryDepartment}
                      onChange={(e) => setSummaryDepartment(e.target.value)}
                      size="sm"
                      searchable={departments.length > 7}
                      className="min-w-[11rem]"
                      placeholder="All departments"
                      options={[
                        { value: "", label: "All departments" },
                        ...departments.map((d) => ({ value: d, label: d })),
                      ]}
                    />
                    {(summarySearch || summaryDepartment) && (
                      <button
                        type="button"
                        onClick={() => { setSummarySearch(""); setSummaryDepartment(""); }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear filter
                      </button>
                    )}
                    <span className="text-sm text-gray-500">
                      Showing {filteredRows.length} of {approvedRows.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadSummaryPdf(filteredRows, approvedRows, summaryMonth, summaryYear, monthNames)}
                      disabled={filteredRows.length === 0 || summaryLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaFilePdf /> Get Paysheet
                    </button>
                  </div>
                </div>
                <div className="p-8 overflow-x-auto">
                  <SalarySummaryTable
                    filteredRows={filteredRows}
                    approvedRows={approvedRows}
                    summaryLoading={summaryLoading}
                    loadingLabel={`Loading ${monthNames[summaryMonth - 1]} ${summaryYear}…`}
                    emptyNoApprovedMessage={
                      !isSummaryCurrentPeriod
                        ? `No saved run for ${monthNames[summaryMonth - 1]} ${summaryYear}.`
                        : "Approve salary entries below to include them in the summary."
                    }
                    emptyNoMatchMessage="No employees match the filter."
                    getSummaryAmounts={getSummaryAmounts}
                    resetKey={`${summarySearch}|${summaryDepartment}|${summaryMonth}|${summaryYear}`}
                  />
                </div>
              </div>
            );
          })()}

          {periodNotStarted ? (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-12 text-center">
              <p className="text-amber-900 font-semibold text-lg mb-2">
                {monthNames[month - 1]} {year} has not started yet
              </p>
              <p className="text-amber-800 text-sm max-w-md mx-auto">
                Salary cards are available from the first day of each month. Select the current month or a past period.
              </p>
              <button
                type="button"
                onClick={() => {
                  const c = getCurrentPayPeriod();
                  setMonth(c.month);
                  setYear(c.year);
                }}
                className="mt-6 px-5 py-2.5 rounded-xl font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Go to {monthNames[currentPayPeriod.month - 1]} {currentPayPeriod.year}
              </button>
            </div>
          ) : rows.length === 0 && deferredEmployees.length === 0 ? (
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-gray-500 font-medium">No employees found. Add employees first to manage salary.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {deferredEmployees.filter((d) => d.reason === "join_month" && hasJoinMonthPay(d.join_month_carry_forward)).length > 0 && (
                <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/80 p-5">
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-2">
                    Join month — salary deferred to next period
                  </h3>
                  <p className="text-sm text-indigo-800 mb-3">
                    Employees who joined in {monthNames[month - 1]} {year} are not paid this month. Their join-month work pay is added to next month&apos;s salary.
                  </p>
                  <ul className="space-y-2 text-sm text-indigo-900">
                    {deferredEmployees.filter((d) => d.reason === "join_month" && hasJoinMonthPay(d.join_month_carry_forward)).map((d) => (
                      <li key={d._id} className="rounded-lg bg-white/70 border border-indigo-100 px-3 py-2">
                        <span className="font-semibold">{d.employee_id} — {d.name}</span>
                        {" · "}
                        Joined {d.joined_date ? String(d.joined_date).slice(0, 10) : "—"}
                        {" · "}
                        {d.join_month_worked_days} day(s) work → Rs. {(d.join_month_carry_forward ?? 0).toLocaleString("en-LK")} next month
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeTab === "calculate" ? (
                (() => {
                  const idx = currentCalculateIndex;
                  const row = rows[idx];
                  if (!row) return null;
                  const computed = computeRow(row, month, year);
                  const gross = computed.gross_salary;
                  const totalAllow = computed.total_allowances;
                  const totalEarnings = (Number(computed.basic_salary) || 0) + (Number(totalAllow) || 0);
                  const totalSc = computed.total_service_charges;
                  const epf = computed.epf_payment;
                  const etf = computed.etf_payment;
                  const totalDed = computed.total_deduction;
                  const net = computed.net_pay;
                  const periodLabel = `${monthNames[month - 1]} ${year}`;
                  const advanceToNext = () => setCurrentCalculateIndex((i) => Math.min(i + 1, rows.length - 1));
                  const locked = isPeriodLocked;
                  const inputClass = (base) => (locked ? `${base} bg-gray-100 cursor-not-allowed read-only:bg-gray-100` : base);
                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Employee <strong>{currentCalculateIndex + 1}</strong> of <strong>{rows.length}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={currentCalculateIndex === 0}
                            onClick={() => setCurrentCalculateIndex((i) => Math.max(0, i - 1))}
                            className="px-4 py-2 text-sm font-semibold rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={currentCalculateIndex >= rows.length - 1}
                            onClick={() => setCurrentCalculateIndex((i) => Math.min(rows.length - 1, i + 1))}
                            className="px-4 py-2 text-sm font-semibold rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                      <div key={row._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-blue-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">{row.name}</span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                Salary for {periodLabel}
                              </span>
                            </div>
                            <span className="text-gray-500 text-sm block mt-1">{employeeMetaLine(row)}</span>
                            {row.approvalStatus === APPROVAL.APPROVED && (
                              <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">Approved</span>
                            )}
                            {row.approvalStatus === APPROVAL.REJECTED && (
                              <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Rejected</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 relative z-10">
                            <button
                              type="button"
                              onClick={() => setContributionRow(row)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                            >
                              <FaPiggyBank /> Contribution
                            </button>
                            <button
                              type="button"
                              onClick={() => saveOneEmployee(row, advanceToNext)}
                              disabled={locked || savingEmployeeId === row._id}
                              title={locked ? "Salaries for this period have been saved; editing is locked." : "Save this employee's salary for the current month, then show next employee"}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FaSave /> {savingEmployeeId === row._id ? "Saving…" : "Save & Next"}
                            </button>
                          </div>
                        </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
                      <div className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/50 lg:col-span-1">
                        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 text-center">Earnings</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Basic Salary</span>
                            <span className="w-24 px-2 py-1.5 text-right font-medium text-gray-900 rounded-lg bg-white border border-gray-200" title="From employee record">{(row.basic_salary ?? 0).toLocaleString()}</span>
                          </div>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Travel</span>
                            <input type="number" min="0" step="1" readOnly={locked || !canEditAllowances} value={row.travel_allowance} onChange={(e) => updateRow(idx, "travel_allowance", e.target.value)} className={inputClass(`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`)} title={!canEditAllowances ? "Only Admin/HR can edit allowances (set on employee profile)" : ""} />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Food</span>
                            <input type="number" min="0" step="1" readOnly={locked || !canEditAllowances} value={row.food_allowance} onChange={(e) => updateRow(idx, "food_allowance", e.target.value)} className={inputClass(`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`)} title={!canEditAllowances ? "Only Admin/HR can edit allowances" : ""} />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Holiday</span>
                            <input type="number" min="0" step="1" readOnly={locked || !canEditAllowances} value={row.holiday_payment} onChange={(e) => updateRow(idx, "holiday_payment", e.target.value)} className={inputClass(`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`)} title={!canEditAllowances ? "Only Admin/HR can edit allowances" : ""} />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Allowance-NS</span>
                            <input type="number" min="0" step="1" readOnly={locked || !canEditAllowances} value={row.allowance_ns} onChange={(e) => updateRow(idx, "allowance_ns", e.target.value)} className={inputClass(`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`)} title={!canEditAllowances ? "Only Admin/HR can edit allowances" : ""} />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Bonus</span>
                            <input type="number" min="0" step="1" readOnly={locked || !canEditAllowances} value={row.bonus} onChange={(e) => updateRow(idx, "bonus", e.target.value)} className={inputClass(`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`)} title={!canEditAllowances ? "Only Admin/HR can edit allowances" : ""} />
                          </label>
                          {hasJoinMonthPay(computed.join_month_carry_forward) && (
                            <label className="flex justify-between items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-1.5">
                              <span className="text-indigo-900" title="Work days from join month, paid with this salary">
                                Join Month Pay ({computed.join_month_worked_days} days)
                              </span>
                              <input type="number" readOnly value={computed.join_month_carry_forward} className="w-24 px-2 py-1.5 border-2 border-indigo-200 rounded-xl text-right bg-indigo-50 text-indigo-900 cursor-not-allowed" />
                            </label>
                          )}
                          <div className="pt-2 mt-2 border-t border-amber-200 font-bold text-amber-900">Gross Salary: {gross.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50/70 lg:col-span-1">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-center">Deductions</h3>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Service Charges</h4>
                        <div className="space-y-2 text-sm">
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Stamp Duty</span>
                                <input type="number" min="0" step="1" readOnly={locked || !canEditAllowances} value={row.stamp_duty} onChange={(e) => updateRow(idx, "stamp_duty", e.target.value)} className={inputClass(`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`)} />
                              </label>
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">Mobile Deduction</span>
                                <input type="number" min="0" step="1" readOnly={locked || !canEditAllowances} value={row.mobile_deduction} onChange={(e) => updateRow(idx, "mobile_deduction", e.target.value)} className={inputClass(`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`)} />
                              </label>
                              <div className="pt-2 mt-2 border-t border-slate-200 font-semibold flex justify-between">
                                <span>Total Service Charges</span>
                                <span>{totalSc.toFixed(2)}</span>
                              </div>
                              <label className="flex justify-between items-center gap-2 pt-2">
                                <span className="text-gray-700">No Pay</span>
                                <input type="number" min="0" step="0.01" readOnly value={computed.no_pay} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right bg-gray-100 text-gray-700 cursor-not-allowed" title={computed.attendance_missing ? "No attendance uploaded — pro-rated no-pay until attendance is added" : "Max(no-pay leave, shortfall from attendance hours)"} />
                              </label>
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700" title="Sri Lanka APIT (PAYE) 2025/26 — auto from gross after no-pay">APIT (PAYE)</span>
                                <input type="number" min="0" step="1" readOnly value={computed.paye} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right bg-gray-100 text-gray-700 cursor-not-allowed" title="Calculated: LKR 1.8M annual relief, progressive tax slabs" />
                              </label>
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">Salary Advance</span>
                                <input type="number" min="0" step="0.01" readOnly value={row.salary_advance} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right bg-gray-100 text-gray-700 cursor-not-allowed" title="From approved advance requests (read-only)" />
                              </label>
                        </div>

                      </div>
                      <div className="border-2 border-blue-300 rounded-xl p-4 bg-blue-50/70 lg:col-span-1">
                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 text-center">EPF & ETF Payment</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center gap-2 pb-2 border-b border-blue-200">
                            <span className="text-gray-700 font-medium">EPF Number</span>
                            <span className="font-mono font-semibold text-blue-900">{row.epf_number || "—"}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Earnings base (excl. bonus)</span>
                            <span className="font-medium">{computed.total_for_epf.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 border-t border-blue-200 font-semibold flex justify-between">
                            <span>Employee EPF (8%) — deducted</span>
                            <span>{epf.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2 text-gray-700">
                            <span>Employer EPF (12%)</span>
                            <span className="font-medium">{(computed.employer_epf_payment ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2 text-gray-700">
                            <span>Employer ETF (3%)</span>
                            <span className="font-medium">{etf.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-1">
                        <div className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 text-center">Summary</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Total Earnings</span>
                              <span className="font-semibold">{totalEarnings.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                              <span className="text-gray-700">Total Deduction</span>
                              <span className="font-semibold">{totalDed.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-300">
                              <span className="font-bold text-emerald-900">Net Pay</span>
                              <span className="text-lg font-bold text-emerald-800">Rs. {net.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    </>
                  );
                })()
              ) : (
                (() => {
                  // Only show employees who have a saved salary entry for this period (in the run)
                  const run = runForPeriod?.run;
                  const hasSavedEntry = (row) => run?.entries?.some((e) => entryMatchesRow(e, row));
                  const calculatedRows = run?.entries?.length
                    ? rows.filter(hasSavedEntry)
                    : [];
                  const hasApprovedOrRejected = run?.entries?.some(
                    (e) => e.approval_status === APPROVAL.APPROVED || e.approval_status === APPROVAL.REJECTED
                  ) ?? false;
                  const byDepartment = {};
                  calculatedRows.forEach((r) => {
                    const dept = r.department || "Other";
                    if (!byDepartment[dept]) byDepartment[dept] = [];
                    byDepartment[dept].push(r);
                  });
                  const departments = Object.keys(byDepartment).sort();
                  const toggleDept = (dept) => {
                    setExpandedCalculatedDepts((prev) => {
                      const next = new Set(prev);
                      if (next.has(dept)) next.delete(dept);
                      else next.add(dept);
                      return next;
                    });
                  };
                  return (
                    <div className="space-y-4">
                      {canApprove && calculatedRows.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Apply to all saved salaries:</span>
                          {!hasApprovedOrRejected ? (
                            <>
                              <button
                                type="button"
                                onClick={() => bulkSetApprovalForCalculated(APPROVAL.APPROVED)}
                                disabled={bulkApproving || isPeriodLocked}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FaCheck /> Approve All
                              </button>
                              <button
                                type="button"
                                onClick={() => bulkSetApprovalForCalculated(APPROVAL.REJECTED)}
                                disabled={bulkApproving || isPeriodLocked}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FaTimes /> Reject All
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => bulkSetApprovalForCalculated(APPROVAL.PENDING)}
                              disabled={bulkApproving}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-500 text-white text-sm rounded-xl font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Revoke All
                            </button>
                          )}
                          {bulkApproving && <span className="text-sm text-gray-500">Updating…</span>}
                        </div>
                      )}

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">Payslip signature & date</h4>
                        <div className="flex flex-wrap items-end gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                            <input
                              type="text"
                              placeholder="e.g. Mar 17, 2026"
                              value={payslipSignatureDate}
                              onChange={(e) => setPayslipSignatureDate(e.target.value)}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 min-w-[140px]"
                            />
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-gray-600 mb-1">Signature</span>
                            <div className="flex items-center gap-2">
                            {payslipSignature ? (
                              <img src={payslipSignature} alt="Signature" className="h-12 object-contain max-w-40 border border-gray-200 rounded bg-white" />
                            ) : (
                              <span className="text-sm text-gray-500">No signature</span>
                            )}
                            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 cursor-pointer transition-colors text-sm">
                              <FaPenFancy className="text-blue-600 shrink-0" />
                              <span>{payslipSignature ? "Change" : "Add signature"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && file.type.startsWith("image/")) {
                                    const reader = new FileReader();
                                    reader.onload = () => setPayslipSignature(reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveSignatureAndDate(payslipSignature, payslipSignatureDate)}
                            disabled={savingSignature || isPeriodLocked}
                            title={isPeriodLocked ? "Salaries for this period have been saved; editing is locked." : undefined}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaSave /> {savingSignature ? "Saving…" : "Save signature & date"}
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">Click a department to expand, then click an employee to view their salary card.</p>
                      {calculatedRows.length === 0 ? (
                        <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-8 text-center">
                          <p className="text-gray-500 font-medium">No salaries found yet. Save salaries in the Salary to Calculate tab.</p>
                        </div>
                      ) : (
                        <ul className="rounded-xl border border-gray-200 overflow-hidden bg-white divide-y divide-gray-200">
                          {departments.map((dept) => {
                            const isExpanded = expandedCalculatedDepts.has(dept);
                            return (
                              <li key={dept}>
                                <button
                                  type="button"
                                  onClick={() => toggleDept(dept)}
                                  className="w-full px-4 py-3 flex items-center gap-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                  <span className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-500">
                                    {isExpanded ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                                  </span>
                                  <span className="font-semibold text-gray-900">{dept}</span>
                                  <span className="text-sm text-gray-500">({byDepartment[dept].length} employee{byDepartment[dept].length !== 1 ? "s" : ""})</span>
                                </button>
                                {isExpanded && (
                                  <ul className="bg-white border-t border-gray-100">
                                    {byDepartment[dept].map((row) => (
                                      <li key={row._id}>
                                        <button
                                          type="button"
                                          onClick={() => setCalculatedPopupRow(row)}
                                          className="w-full px-4 py-2.5 pl-12 flex items-center gap-3 text-left hover:bg-emerald-50/80 transition-colors"
                                        >
                                          <FaUser className="shrink-0 w-4 h-4 text-emerald-600" />
                                          <span className="font-medium text-gray-900">{row.name}</span>
                                          <span className="text-sm text-gray-500">— {row.employee_id}</span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {payslipEmployee && payslipData && (
        <PayslipView
          employee={payslipEmployee}
          data={payslipData}
          month={month}
          year={year}
          monthName={monthNames[month - 1]}
          onClose={closePayslip}
          initialSignature={payslipSignature}
          initialSignatureDate={payslipSignatureDate || undefined}
          onSavePayslip={handleSavePayslipFromModal}
          savingPayslip={savingSignature}
        />
      )}

      {contributionRow && (() => {
        const comp = computeRow(contributionRow, month, year);
        return (
          <ContributionModal
            employee={{ _id: contributionRow._id, name: contributionRow.name, employee_id: contributionRow.employee_id, userId: contributionRow.employee?.userId }}
            currentEmployeeEpfPayment={comp.epf_payment}
            currentEmployerEpfPayment={comp.employer_epf_payment ?? 0}
            currentEtfPayment={comp.etf_payment}
            currentMonth={month}
            currentYear={year}
            onClose={() => setContributionRow(null)}
          />
        );
      })()}

      {showAllContributions && (
        <AllContributionsModal
          currentMonth={month}
          currentYear={year}
          onClose={() => setShowAllContributions(false)}
        />
      )}

      {/* Calculated Salary card popup */}
      {calculatedPopupRow && (() => {
        const row = rows.find((r) => r._id === calculatedPopupRow._id) ?? calculatedPopupRow;
        const idx = rows.findIndex((r) => r._id === row._id);
        if (idx < 0) return null;
        const computed = computeRow(row, month, year);
        const gross = computed.gross_salary;
        const totalAllow = computed.total_allowances;
        const totalEarnings = (Number(computed.basic_salary) || 0) + (Number(totalAllow) || 0);
        const totalSc = computed.total_service_charges;
        const epf = computed.epf_payment;
        const etf = computed.etf_payment;
        const totalDed = computed.total_deduction;
        const net = computed.net_pay;
        const periodLabel = `${monthNames[month - 1]} ${year}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto" onClick={() => setCalculatedPopupRow(null)}>
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl min-w-0 max-h-[95vh] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate pr-2">Salary Card — {row.name}</h3>
                <button
                  type="button"
                  onClick={() => setCalculatedPopupRow(null)}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-4 sm:p-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-[280px]">
                  <div className="px-4 sm:px-6 py-4 bg-linear-to-r from-gray-50 to-blue-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{row.name}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">Salary for {periodLabel}</span>
                      </div>
                      <span className="text-gray-500 text-sm block mt-1">{employeeMetaLine(row)}</span>
                      {row.approvalStatus === APPROVAL.APPROVED && (
                        <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">Approved</span>
                      )}
                      {row.approvalStatus === APPROVAL.REJECTED && (
                        <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Rejected</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canApprove && (
                        <>
                          {row.approvalStatus === APPROVAL.PENDING && (
                            <>
                              <button type="button" onClick={() => setApproval(idx, APPROVAL.APPROVED)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700 transition-colors">
                                <FaCheck /> Approve
                              </button>
                              <button type="button" onClick={() => setApproval(idx, APPROVAL.REJECTED)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-xl font-semibold hover:bg-red-700 transition-colors">
                                <FaTimes /> Reject
                              </button>
                            </>
                          )}
                          {(row.approvalStatus === APPROVAL.APPROVED || row.approvalStatus === APPROVAL.REJECTED) && (
                            <button type="button" onClick={() => setApproval(idx, APPROVAL.PENDING)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-500 text-white text-sm rounded-xl font-semibold hover:bg-gray-600 transition-colors">
                              Revoke
                            </button>
                          )}
                        </>
                      )}
                      <button type="button" onClick={() => { setContributionRow(row); setCalculatedPopupRow(null); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm rounded-xl font-semibold hover:bg-amber-600 transition-colors">
                        <FaPiggyBank /> Contribution
                      </button>
                      <button type="button" onClick={() => saveOneEmployee(row)} disabled={savingEmployeeId === row._id} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaSave /> {savingEmployeeId === row._id ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { openPayslip(row); setCalculatedPopupRow(null); }} disabled={row.approvalStatus !== APPROVAL.APPROVED} title={row.approvalStatus !== APPROVAL.APPROVED ? "Approve first to get payslip" : ""} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaFileInvoiceDollar /> Get Payslip
                      </button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch min-w-0">
                    <div className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/50 lg:col-span-1 min-w-0">
                      <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 text-center">Earnings</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-gray-700">Basic Salary</span>
                          <span className="w-24 px-2 py-1.5 text-right font-medium text-gray-900 rounded-lg bg-white border border-gray-200">{(row.basic_salary ?? 0).toLocaleString()}</span>
                        </div>
                        <label className="flex justify-between items-center gap-2">
                          <span className="text-gray-700">Travel</span>
                          <input type="number" min="0" step="1" readOnly={!canEditAllowances} value={row.travel_allowance} onChange={(e) => updateRow(idx, "travel_allowance", e.target.value)} className={`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`} title={!canEditAllowances ? "Only Admin/HR can edit allowances" : ""} />
                        </label>
                        <label className="flex justify-between items-center gap-2">
                          <span className="text-gray-700">Food</span>
                          <input type="number" min="0" step="1" readOnly={!canEditAllowances} value={row.food_allowance} onChange={(e) => updateRow(idx, "food_allowance", e.target.value)} className={`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                        </label>
                        <label className="flex justify-between items-center gap-2">
                          <span className="text-gray-700">Holiday</span>
                          <input type="number" min="0" step="1" readOnly={!canEditAllowances} value={row.holiday_payment} onChange={(e) => updateRow(idx, "holiday_payment", e.target.value)} className={`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                        </label>
                        <label className="flex justify-between items-center gap-2">
                          <span className="text-gray-700">Allowance-NS</span>
                          <input type="number" min="0" step="1" readOnly={!canEditAllowances} value={row.allowance_ns} onChange={(e) => updateRow(idx, "allowance_ns", e.target.value)} className={`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                        </label>
                        <label className="flex justify-between items-center gap-2">
                          <span className="text-gray-700">Bonus</span>
                          <input type="number" min="0" step="1" readOnly={!canEditAllowances} value={row.bonus} onChange={(e) => updateRow(idx, "bonus", e.target.value)} className={`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                        </label>
                        {hasJoinMonthPay(computed.join_month_carry_forward) && (
                          <div className="flex justify-between items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-1.5">
                            <span className="text-indigo-900" title="Work days from join month, paid with this salary">
                              Join Month Pay ({computed.join_month_worked_days} days)
                            </span>
                            <span className="w-24 px-2 py-1.5 text-right font-medium text-indigo-900 rounded-lg bg-indigo-50 border border-indigo-200">
                              {computed.join_month_carry_forward.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-amber-200 font-bold text-amber-900">Gross Salary: {gross.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50/70 lg:col-span-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-center">Deductions</h3>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Service Charges</h4>
                      <div className="space-y-2 text-sm">
                            <label className="flex justify-between items-center gap-2">
                              <span className="text-gray-700">Stamp Duty</span>
                              <input type="number" min="0" step="1" readOnly={!canEditAllowances} value={row.stamp_duty} onChange={(e) => updateRow(idx, "stamp_duty", e.target.value)} className={`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                            </label>
                            <label className="flex justify-between items-center gap-2">
                              <span className="text-gray-700">Mobile Deduction</span>
                              <input type="number" min="0" step="1" readOnly={!canEditAllowances} value={row.mobile_deduction} onChange={(e) => updateRow(idx, "mobile_deduction", e.target.value)} className={`w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${!canEditAllowances ? "bg-gray-100 cursor-not-allowed" : ""}`} />
                            </label>
                            <div className="pt-2 mt-2 border-t border-slate-200 font-semibold flex justify-between">
                              <span>Total Service Charges</span>
                              <span>{totalSc.toFixed(2)}</span>
                            </div>
                            <label className="flex justify-between items-center gap-2 pt-2">
                              <span className="text-gray-700">No Pay</span>
                              <input type="number" min="0" step="0.01" readOnly value={computed.no_pay} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right bg-gray-100 text-gray-700 cursor-not-allowed" title={computed.attendance_missing ? "No attendance uploaded — pro-rated no-pay until attendance is added" : "Max(no-pay leave, shortfall from attendance hours)"} />
                            </label>
                            <label className="flex justify-between items-center gap-2">
                              <span className="text-gray-700" title="Sri Lanka APIT (PAYE) 2025/26 — auto from gross after no-pay">APIT (PAYE)</span>
                              <input type="number" min="0" step="1" readOnly value={computed.paye} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right bg-gray-100 text-gray-700 cursor-not-allowed" title="Calculated: LKR 1.8M annual relief, progressive tax slabs" />
                            </label>
                            <label className="flex justify-between items-center gap-2">
                              <span className="text-gray-700">Salary Advance</span>
                              <input type="number" min="0" step="0.01" readOnly value={row.salary_advance} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right bg-gray-100 text-gray-700 cursor-not-allowed" />
                            </label>
                      </div>
                    </div>
                    <div className="border-2 border-blue-300 rounded-xl p-4 bg-blue-50/70 lg:col-span-1 min-w-0">
                      <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 text-center">EPF & ETF Payment</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center gap-2 pb-2 border-b border-blue-200">
                          <span className="text-gray-700 font-medium">EPF Number</span>
                          <span className="font-mono font-semibold text-blue-900">{row.epf_number || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-gray-700">Earnings base (excl. bonus)</span>
                          <span className="font-medium">{computed.total_for_epf.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-blue-200 font-semibold flex justify-between">
                          <span>Employee EPF (8%) — deducted</span>
                          <span>{epf.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2 text-gray-700">
                          <span>Employer EPF (12%)</span>
                          <span className="font-medium">{(computed.employer_epf_payment ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2 text-gray-700">
                          <span>Employer ETF (3%)</span>
                          <span className="font-medium">{etf.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-1 min-w-0">
                      <div className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 text-center">Summary</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Total Earnings</span>
                            <span className="font-semibold">{totalEarnings.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                            <span className="text-gray-700">Total Deduction</span>
                            <span className="font-semibold">{totalDed.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-300">
                            <span className="font-bold text-emerald-900">Net Pay</span>
                            <span className="text-lg font-bold text-emerald-800">Rs. {net.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SalaryPage;
