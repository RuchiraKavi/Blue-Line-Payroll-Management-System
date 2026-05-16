import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaMoneyBillWave, FaFileInvoiceDollar, FaFilePdf } from "react-icons/fa";
import { downloadPayslipPdf } from "./PayslipView.jsx";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EmployeeSalaryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingPayslipFor, setLoadingPayslipFor] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setError("");
        const res = await axios.get(`${API_BASE}/salary/my-history`, { headers: getAuthHeader() });
        if (res.data.success && Array.isArray(res.data.history)) {
          setHistory(res.data.history);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error(err);
        const status = err.response?.status;
        const msg = err.response?.data?.message || "";
        if (status === 404 || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no salary")) {
          setHistory([]);
        } else {
          setError(err.response?.data?.message || "Failed to load salary history");
          setHistory([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const downloadPayslipPdfForPeriod = async (month, year) => {
    const key = `${year}-${month}`;
    try {
      setLoadingPayslipFor(key);
      const res = await axios.get(`${API_BASE}/salary/me/payslip?month=${month}&year=${year}`, {
        headers: getAuthHeader(),
      });
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        const employee = data.employee || {};
        const monthName = monthNames[Number(month) - 1] || "";
        downloadPayslipPdf(
          employee,
          data,
          month,
          year,
          monthName,
          data.signature_data_url ?? null,
          data.signature_date ?? null
        );
      } else {
        alert("Payslip not found for this period.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to load payslip");
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
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white">
            <FaMoneyBillWave className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Salary History</h1>
            <p className="text-gray-600 mt-0.5">View your past payslips and salary records</p>
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
          <p className="text-sm text-gray-600 mt-1">Saved payroll runs in which you are included. Download PDF for your payslip.</p>
        </div>
        <div className="p-8">
          {history.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FaMoneyBillWave className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No salary history found</p>
              <p className="text-sm mt-1">When your salary is saved by the admin for a month, it will appear here.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs font-semibold border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">Period</th>
                    <th className="px-6 py-4 text-right">Gross Salary (Rs.)</th>
                    <th className="px-6 py-4 text-right">Total Deduction (Rs.)</th>
                    <th className="px-6 py-4 text-right">Net Pay (Rs.)</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => (
                    <tr key={`${row.year}-${row.month}`} className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.monthName} {row.year}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{Number(row.gross_salary).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{Number(row.total_deduction).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-700">{Number(row.net_pay).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => downloadPayslipPdfForPeriod(row.month, row.year)}
                          disabled={loadingPayslipFor !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          <FaFilePdf /> {loadingPayslipFor === `${row.year}-${row.month}` ? "Loading…" : "Download PDF"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default EmployeeSalaryHistory;
