import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaMoneyBillWave, FaFileInvoiceDollar, FaListUl, FaCheck, FaTimes, FaSave } from "react-icons/fa";
import PayslipView from "./PayslipView.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const API_BASE = "http://localhost:5000/api";

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const APPROVAL = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected" };

const defaultRow = (emp) => ({
  _id: emp._id,
  employee_id: emp.employee_id,
  name: emp.userId?.name || "N/A",
  designation: emp.designation || "",
  department: emp.department?.dep_name || "N/A",
  basic_salary: Number(emp.basic_salary) || 0,
  travel_allowance: 0,
  food_allowance: 0,
  holiday_payment: 0,
  allowance_ns: 0,
  bonus: 0,
  no_pay: 0,
  salary_advance: 0,
  stamp_duty: 0,
  mobile_deduction: 0,
  epf_percent: 8,
  etf_percent: 3,
  paye: 0,
  approvalStatus: APPROVAL.PENDING,
  employee: emp,
});

/** Compute totals from current row inputs (updates automatically as user types). */
function computeRow(row) {
  const basic = Number(row.basic_salary) || 0;
  const travel = Number(row.travel_allowance) || 0;
  const food = Number(row.food_allowance) || 0;
  const holiday = Number(row.holiday_payment) || 0;
  const allowanceNs = Number(row.allowance_ns) || 0;
  const bonus = Number(row.bonus) || 0;
  const noPay = Number(row.no_pay) || 0;
  const stampDuty = Number(row.stamp_duty) || 0;
  const mobileDed = Number(row.mobile_deduction) || 0;
  const paye = Number(row.paye) || 0;
  const salaryAdvance = Number(row.salary_advance) || 0;
  const epfPercent = Number(row.epf_percent) || 8;
  const etfPercent = Number(row.etf_percent) || 3;

  const totalAllowances = travel + food + holiday + allowanceNs + bonus;
  const grossSalary = basic + totalAllowances - noPay;
  const totalForEpf = grossSalary > 0 ? grossSalary : 0;
  const epfPayment = (totalForEpf * epfPercent) / 100;
  const etfPayment = (totalForEpf * etfPercent) / 100;
  const totalServiceCharges = stampDuty + mobileDed;
  const totalDeduction = epfPayment + totalServiceCharges + paye + salaryAdvance;
  const netPay = grossSalary - totalDeduction;

  return {
    ...row,
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

const SalaryPage = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase?.() || "";
  const canApprove = ["admin", "accountant", "account_manager", "account"].includes(role);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payslipEmployee, setPayslipEmployee] = useState(null);
  const [payslipData, setPayslipData] = useState(null);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      setError("");
      let res;
      try {
        res = await axios.get(`${API_BASE}/salary/employees`, {
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
      if (res.data.success && res.data.employees?.length) {
        setRows(res.data.employees.map((emp) => defaultRow(emp)));
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error(err);
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
  };

  const openPayslip = (row) => {
    if (row.approvalStatus !== APPROVAL.APPROVED) return;
    const computed = computeRow(row);
    setPayslipData(computed);
    setPayslipEmployee(row.employee);
  };

  const closePayslip = () => {
    setPayslipEmployee(null);
    setPayslipData(null);
  };

  const allApproved = rows.length > 0 && rows.every((r) => r.approvalStatus === APPROVAL.APPROVED);

  const saveAllSalaries = async () => {
    if (!allApproved || saving) return;
    try {
      setError("");
      setSaving(true);
      const entries = rows.map((row) => ({
        employeeId: row._id,
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
        paye: row.paye,
        epf_percent: row.epf_percent,
        etf_percent: row.etf_percent,
      }));
      const res = await axios.post(
        `${API_BASE}/salary/save`,
        { month, year, entries },
        { headers: getAuthHeader() }
      );
      if (res.data.success) {
        setError("");
        alert(`Salaries for ${monthNames[month - 1]} ${year} saved successfully.`);
      } else {
        setError(res.data.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save salaries");
    } finally {
      setSaving(false);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
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
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm text-sm font-medium"
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm text-sm font-medium"
              >
                {[year, year - 1, year - 2].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSummary((s) => !s)}
                className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${showSummary ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white border-2 border-gray-200 text-gray-800 hover:bg-gray-50"}`}
              >
                <FaListUl /> {showSummary ? "Hide Summary" : "Salary Summary"}
              </button>
              <button
                type="button"
                onClick={saveAllSalaries}
                disabled={!allApproved || saving}
                title={!allApproved ? "Approve all employees first to save salaries for this month" : ""}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                <FaSave /> {saving ? "Saving…" : "Save All Salaries"}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <p className="text-gray-600 text-sm mb-6">
            Pay period: <strong>{monthNames[month - 1]} {year}</strong>. Edit values in each section; totals update automatically. Use &quot;Get Payslip&quot; for the final payslip.
          </p>

          {showSummary && rows.length > 0 && (() => {
            const approvedRows = rows.filter((r) => r.approvalStatus === APPROVAL.APPROVED);
            return (
              <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaListUl className="text-blue-600" />
                    Salary Summary
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{monthNames[month - 1]} {year} — Only approved employees ({approvedRows.length} of {rows.length})</p>
                </div>
                <div className="p-8 overflow-x-auto">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold">Employee</th>
                          <th className="px-6 py-4 text-left font-semibold">Department</th>
                          <th className="px-6 py-4 text-right font-semibold">Gross Salary</th>
                          <th className="px-6 py-4 text-right font-semibold">Total Deduction</th>
                          <th className="px-6 py-4 text-right font-semibold">Net Pay</th>
                          <th className="px-6 py-4 text-center font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedRows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No approved employees. Approve salary entries below to include them in the summary.</td>
                          </tr>
                        ) : (
                          approvedRows.map((row) => {
                            const c = computeRow(row);
                            return (
                              <tr key={row._id} className="border-t border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-gray-900">{row.name}</div>
                                  <div className="text-xs text-gray-500">{row.employee_id} · {row.designation}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-700">{row.department}</td>
                                <td className="px-6 py-4 text-right font-medium">{c.gross_salary.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">{c.total_deduction.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-semibold text-green-700">{c.net_pay.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => openPayslip(row)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    <FaFileInvoiceDollar /> Payslip
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {approvedRows.length > 0 && (
                        <tfoot>
                          <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-200">
                            <td className="px-6 py-4" colSpan={2}>Total</td>
                            <td className="px-6 py-4 text-right">
                              {approvedRows.reduce((sum, r) => sum + computeRow(r).gross_salary, 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {approvedRows.reduce((sum, r) => sum + computeRow(r).total_deduction, 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-green-700">
                              {approvedRows.reduce((sum, r) => sum + computeRow(r).net_pay, 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4" />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {rows.length === 0 ? (
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-gray-500 font-medium">No employees found. Add employees first to manage salary.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {rows.map((row, idx) => {
                const computed = computeRow(row);
                const gross = computed.gross_salary;
                const totalAllow = computed.total_allowances;
                const totalSc = computed.total_service_charges;
                const epf = computed.epf_payment;
                const etf = computed.etf_payment;
                const totalDed = computed.total_deduction;
                const net = computed.net_pay;
                return (
                  <div key={row._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-blue-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-gray-900">{row.name}</span>
                        <span className="text-gray-500 text-sm ml-2">{row.employee_id} · {row.designation} · {row.department}</span>
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
                            {(row.approvalStatus === APPROVAL.PENDING || row.approvalStatus === APPROVAL.REJECTED) && (
                              <>
                                <button
                                  onClick={() => setApproval(idx, APPROVAL.APPROVED)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700 transition-colors"
                                >
                                  <FaCheck /> Approve
                                </button>
                                <button
                                  onClick={() => setApproval(idx, APPROVAL.REJECTED)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-xl font-semibold hover:bg-red-700 transition-colors"
                                >
                                  <FaTimes /> Reject
                                </button>
                              </>
                            )}
                            {row.approvalStatus === APPROVAL.APPROVED && (
                              <button
                                onClick={() => setApproval(idx, APPROVAL.PENDING)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-500 text-white text-sm rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => openPayslip(row)}
                          disabled={row.approvalStatus !== APPROVAL.APPROVED}
                          title={row.approvalStatus !== APPROVAL.APPROVED ? "Approve first to get payslip" : ""}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaFileInvoiceDollar /> Get Payslip
                        </button>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                      <div className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/50 lg:col-span-1">
                        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 text-center">Allowances</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Basic Salary</span>
                            <span className="w-24 px-2 py-1.5 text-right font-medium text-gray-900 rounded-lg bg-white border border-gray-200" title="From employee record">{(row.basic_salary ?? 0).toLocaleString()}</span>
                          </div>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Travel</span>
                            <input type="number" min="0" step="1" value={row.travel_allowance} onChange={(e) => updateRow(idx, "travel_allowance", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Food</span>
                            <input type="number" min="0" step="1" value={row.food_allowance} onChange={(e) => updateRow(idx, "food_allowance", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Holiday</span>
                            <input type="number" min="0" step="1" value={row.holiday_payment} onChange={(e) => updateRow(idx, "holiday_payment", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Allowance-NS</span>
                            <input type="number" min="0" step="1" value={row.allowance_ns} onChange={(e) => updateRow(idx, "allowance_ns", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                          </label>
                          <label className="flex justify-between items-center gap-2">
                            <span className="text-gray-700">Bonus</span>
                            <input type="number" min="0" step="1" value={row.bonus} onChange={(e) => updateRow(idx, "bonus", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                          </label>
                          <div className="pt-2 mt-2 border-t border-amber-200 font-semibold flex justify-between">
                            <span>Total Allowances</span>
                            <span>{totalAllow.toFixed(2)}</span>
                          </div>
                          <div className="font-bold text-amber-900">Gross Salary: {gross.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50/70 lg:col-span-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-center">
                          Deductions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50/50">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Service Charges</h4>
                            <div className="space-y-2 text-sm">
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">Stamp Duty</span>
                                <input type="number" min="0" step="1" value={row.stamp_duty} onChange={(e) => updateRow(idx, "stamp_duty", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                              </label>
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">Mobile Deduction</span>
                                <input type="number" min="0" step="1" value={row.mobile_deduction} onChange={(e) => updateRow(idx, "mobile_deduction", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                              </label>
                              <div className="pt-2 mt-2 border-t border-slate-200 font-semibold flex justify-between">
                                <span>Total Service Charges</span>
                                <span>{totalSc.toFixed(2)}</span>
                              </div>
                              <label className="flex justify-between items-center gap-2 pt-2">
                                <span className="text-gray-700">No Pay</span>
                                <input type="number" min="0" step="1" value={row.no_pay} onChange={(e) => updateRow(idx, "no_pay", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                              </label>
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">PAYE</span>
                                <input type="number" min="0" step="1" value={row.paye} onChange={(e) => updateRow(idx, "paye", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                              </label>
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">Salary Advance</span>
                                <input type="number" min="0" step="1" value={row.salary_advance} onChange={(e) => updateRow(idx, "salary_advance", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                              </label>
                            </div>
                          </div>

                          <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">EPF Payment</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">Total for EPF (base)</span>
                                <span className="font-medium">{computed.total_for_epf.toFixed(2)}</span>
                              </div>
                              <label className="flex justify-between items-center gap-2">
                                <span className="text-gray-700">Employee EPF %</span>
                                <input type="number" min="0" max="100" step="0.5" value={row.epf_percent} onChange={(e) => updateRow(idx, "epf_percent", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                              </label>
                              <div className="pt-2 mt-2 border-t border-blue-200 font-semibold flex justify-between">
                                <span>EPF Payment ({row.epf_percent}%)</span>
                                <span>{epf.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-sm shadow-sm">
                            <span className="mr-2">Total Deduction:</span>
                            <span>{totalDed.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50/50 lg:col-span-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 text-center">ETF Payment</h4>
                          <div className="space-y-2 text-sm">
                            <label className="flex justify-between items-center gap-2">
                              <span className="text-gray-700">ETF %</span>
                              <input type="number" min="0" max="100" step="0.5" value={row.etf_percent} onChange={(e) => updateRow(idx, "etf_percent", e.target.value)} className="w-24 px-2 py-1.5 border-2 border-gray-200 rounded-xl text-right focus:ring-4 focus:ring-blue-100 focus:border-blue-500" />
                            </label>
                            <div className="pt-2 mt-2 border-t border-emerald-200 font-semibold flex justify-between">
                              <span>ETF Payment ({row.etf_percent}%)</span>
                              <span>{etf.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <div className="inline-flex items-center px-4 py-2 rounded-xl bg-green-50 border-2 border-green-300 text-green-800 font-bold text-base shadow-sm">
                            <span className="mr-2">Net Pay:</span>
                            <span>Rs. {net.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
        />
      )}
    </div>
  );
};

export default SalaryPage;
