import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaFilePdf,
  FaArrowLeft,
  FaEye,
} from "react-icons/fa";
import PayslipView, { downloadPayslipPdf } from "./PayslipView.jsx";
import { usePagination } from "../../hooks/usePagination.js";
import TablePagination from "../ui/TablePagination.jsx";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const statusLabel = (status) => {
  const s = String(status || "pending").toLowerCase();
  if (s === "approved")
    return { text: "Approved", className: "bg-green-100 text-green-800" };
  if (s === "rejected")
    return { text: "Rejected", className: "bg-red-100 text-red-800" };
  return { text: "Pending", className: "bg-amber-100 text-amber-800" };
};

const AdminEmployeeSalaryHistory = () => {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingPayslipFor, setLoadingPayslipFor] = useState(null);
  const [viewPayslip, setViewPayslip] = useState(null);

  const pagination = usePagination(history);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setError("");
        setLoading(true);
        const res = await axios.get(
          `${API_BASE}/salary/employee-history/${employeeId}`,
          { headers: getAuthHeader() }
        );
        if (res.data.success) {
          setEmployee(res.data.employee || null);
          setHistory(Array.isArray(res.data.history) ? res.data.history : []);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load salary history"
        );
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) fetchHistory();
  }, [employeeId]);

  const fetchPayslipForPeriod = async (month, year) => {
    const res = await axios.get(
      `${API_BASE}/salary/payslip/${employeeId}?month=${month}&year=${year}`,
      { headers: getAuthHeader() }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error("Payslip not found for this period.");
  };

  const downloadPayslipPdfForPeriod = async (month, year) => {
    const key = `${year}-${month}`;
    try {
      setLoadingPayslipFor(key);
      const data = await fetchPayslipForPeriod(month, year);
      const emp = data.employee || employee || {};
      const monthName = monthNames[Number(month) - 1] || "";
      downloadPayslipPdf(
        emp,
        data,
        month,
        year,
        monthName,
        data.signature_data_url ?? null,
        data.signature_date ?? null
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Failed to load payslip");
    } finally {
      setLoadingPayslipFor(null);
    }
  };

  const viewPayslipForPeriod = async (month, year) => {
    const key = `${year}-${month}`;
    try {
      setLoadingPayslipFor(key);
      const data = await fetchPayslipForPeriod(month, year);
      const emp = data.employee || employee || {};
      const monthName = monthNames[Number(month) - 1] || "";
      setViewPayslip({
        employee: emp,
        data,
        month,
        year,
        monthName,
        signature: data.signature_data_url ?? null,
        signatureDate: data.signature_date ?? null,
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Failed to load payslip");
    } finally {
      setLoadingPayslipFor(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-3 text-gray-600">Loading salary history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="mb-4">
        <Link
          to="/admin-dashboard/employees"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <FaArrowLeft /> Back to Employees
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white">
            <FaMoneyBillWave className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Salary History</h1>
            {employee && (
              <p className="text-gray-600 mt-1">
                {employee.name}
                {employee.employee_id ? ` (${employee.employee_id})` : ""}
                {employee.designation ? ` · ${employee.designation}` : ""}
                {employee.department ? ` · ${employee.department}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaFileInvoiceDollar className="text-blue-600" />
            Salary Records
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Saved payroll runs for this employee. View or download payslip per month.
          </p>
        </div>
        <div className="p-8">
          {history.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FaMoneyBillWave className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No salary history found</p>
              <p className="text-sm mt-1">
                When salary is saved for this employee in a month, it will appear
                here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs font-semibold border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">Period</th>
                    <th className="px-6 py-4 text-right">Gross (Rs.)</th>
                    <th className="px-6 py-4 text-right">Deduction (Rs.)</th>
                    <th className="px-6 py-4 text-right">Net Pay (Rs.)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.map((row) => {
                    const status = statusLabel(row.approval_status);
                    return (
                      <tr
                        key={`${row.year}-${row.month}`}
                        className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {row.monthName} {row.year}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          {Number(row.gross_salary).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          {Number(row.total_deduction).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-green-700">
                          {Number(row.net_pay).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => viewPayslipForPeriod(row.month, row.year)}
                              disabled={loadingPayslipFor !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              <FaEye />{" "}
                              {loadingPayslipFor === `${row.year}-${row.month}`
                                ? "Loading…"
                                : "View Payslip"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                downloadPayslipPdfForPeriod(row.month, row.year)
                              }
                              disabled={loadingPayslipFor !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                              <FaFilePdf /> Download PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <TablePagination
                page={pagination.page}
                perPage={pagination.perPage}
                totalItems={pagination.totalItems}
                totalPages={pagination.totalPages}
                onPageChange={pagination.setPage}
                onPerPageChange={(n) => {
                  pagination.setPerPage(n);
                  pagination.setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {viewPayslip && (
        <PayslipView
          employee={viewPayslip.employee}
          data={viewPayslip.data}
          month={viewPayslip.month}
          year={viewPayslip.year}
          monthName={viewPayslip.monthName}
          onClose={() => setViewPayslip(null)}
          initialSignature={viewPayslip.signature}
          initialSignatureDate={viewPayslip.signatureDate || undefined}
          readOnly
        />
      )}
    </div>
  );
};

export default AdminEmployeeSalaryHistory;
