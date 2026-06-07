import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { FaTimes, FaHistory, FaFileAlt, FaPrint, FaFilePdf } from "react-icons/fa";
import { usePagination } from "../../hooks/usePagination.js";
import TablePagination from "../ui/TablePagination.jsx";
import SelectInput from "../ui/SelectInput.jsx";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ContributionModal = ({ employee, currentEmployeeEpfPayment, currentEmployerEpfPayment, currentEtfPayment, currentMonth, currentYear, onClose }) => {
  const [tab, setTab] = useState("current"); // "current" | "history" | "report"
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportFromMonth, setReportFromMonth] = useState(1);
  const [reportFromYear, setReportFromYear] = useState(currentYear);
  const [reportToMonth, setReportToMonth] = useState(12);
  const [reportToYear, setReportToYear] = useState(currentYear);
  const reportRef = useRef(null);

  const employeeId = employee?._id;
  const employeeName = employee?.name || employee?.userId?.name || "N/A";
  const employeeIdRef = employee?.employee_id || "—";

  useEffect(() => {
    const id = employeeId ? String(employeeId) : null;
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    axios
      .get(`${API_BASE}/salary/contribution-history/${id}`, { headers: getAuthHeader() })
      .then((res) => {
        if (!cancelled && res.data.success) {
          setHistory(Array.isArray(res.data.history) ? res.data.history : []);
          setError("");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err.response?.status;
        const message = err.response?.data?.message || "";
        // No data / not found: show empty state instead of error
        if (status === 404 || message.toLowerCase().includes("not found") || message.toLowerCase().includes("no data")) {
          setHistory([]);
          setError("");
        } else {
          setError(message || "Failed to load contribution history");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [employeeId]);

  const reportEntries = history.filter((h) => {
    const dStart = reportFromYear * 12 + reportFromMonth;
    const dEnd = reportToYear * 12 + reportToMonth;
    const d = h.year * 12 + h.month;
    return d >= dStart && d <= dEnd;
  });

  const historyPagination = usePagination(history, { resetKey: employeeId });
  const reportPagination = usePagination(reportEntries, {
    resetKey: `${reportFromMonth}-${reportFromYear}-${reportToMonth}-${reportToYear}-${employeeId}`,
  });

  const handlePrintReport = () => {
    const content = reportRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Contribution Report - ${employeeName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background: #ecfdf5; font-weight: 600; }
          .text-right { text-align: right; }
        </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadPdf = () => {
    if (reportEntries.length === 0) return;
    const fromLabel = `${monthNames[reportFromMonth - 1]} ${reportFromYear}`;
    const toLabel = `${monthNames[reportToMonth - 1]} ${reportToYear}`;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;
    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text("EPF & ETF Contribution Report", pageW / 2, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee: ${employeeName} ${employeeIdRef !== "—" ? `(${employeeIdRef})` : ""}`, margin, y);
    y += 6;
    doc.text(`Period: ${fromLabel} to ${toLabel}`, margin, y);
    y += 12;
    const colW = (pageW - 2 * margin) / 4;
    const rowH = 8;
    const headY = y;
    doc.setFillColor(236, 253, 245);
    doc.rect(margin, headY, pageW - 2 * margin, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Period", margin + 2, headY + 5.5);
    doc.text("Emp EPF (8%)", margin + colW + 2, headY + 5.5, { align: "right" });
    doc.text("Empr EPF (12%)", margin + colW * 2 + 2, headY + 5.5, { align: "right" });
    doc.text("ETF (3%)", pageW - margin - 2, headY + 5.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    y = headY + rowH;
    reportEntries.forEach((h, i) => {
      if (y + rowH > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      if (i % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
      }
      doc.setFontSize(9);
      doc.text(`${h.monthName} ${h.year}`, margin + 2, y + 5.5);
      doc.text(Number(h.epf_payment).toFixed(2), margin + colW + 2, y + 5.5, { align: "right" });
      doc.text(Number(h.employer_epf_payment ?? 0).toFixed(2), margin + colW * 2 + 2, y + 5.5, { align: "right" });
      doc.text(Number(h.etf_payment).toFixed(2), pageW - margin - 2, y + 5.5, { align: "right" });
      y += rowH;
    });
    const safeName = `${employeeName.replace(/[^a-zA-Z0-9-_]/g, "_")}_Contribution_${fromLabel.replace(/\s/g, "_")}_to_${toLabel.replace(/\s/g, "_")}.pdf`;
    doc.save(safeName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-linear-to-r from-emerald-50 to-teal-50 border-b border-gray-200 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            EPF & ETF Contribution — {employeeName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {["current", "history", "report"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "current" && "Current"}
              {t === "history" && <>History <FaHistory className="inline ml-1" /></>}
              {t === "report" && <>Report <FaFileAlt className="inline ml-1" /></>}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && !loading && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          {tab === "current" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Current month: <strong>{monthNames[currentMonth - 1]} {currentYear}</strong> (Sri Lanka rates)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Employee EPF (8%) — deducted</h4>
                  <p className="text-2xl font-bold text-blue-900">Rs. {Number(currentEmployeeEpfPayment || 0).toFixed(2)}</p>
                </div>
                <div className="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50/50">
                  <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Employer EPF (12%)</h4>
                  <p className="text-2xl font-bold text-indigo-900">Rs. {Number(currentEmployerEpfPayment || 0).toFixed(2)}</p>
                </div>
                <div className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Employer ETF (3%)</h4>
                  <p className="text-2xl font-bold text-emerald-900">Rs. {Number(currentEtfPayment || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {tab === "history" && (
            <>
              {loading ? (
                <p className="text-gray-500">Loading history…</p>
              ) : history.length === 0 ? (
                <p className="text-gray-500">No saved contribution history. Save salary runs to see history here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-emerald-50 text-emerald-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Period</th>
                        <th className="px-4 py-3 text-right font-semibold">Employee EPF (8%)</th>
                        <th className="px-4 py-3 text-right font-semibold">Employer EPF (12%)</th>
                        <th className="px-4 py-3 text-right font-semibold">ETF (3%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyPagination.paginatedItems.map((h, i) => (
                        <tr key={`${h.year}-${h.month}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 border-t border-gray-200">{h.monthName} {h.year}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right font-medium">{Number(h.epf_payment).toFixed(2)}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right font-medium">{Number(h.employer_epf_payment ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right font-medium">{Number(h.etf_payment).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <TablePagination
                    page={historyPagination.page}
                    perPage={historyPagination.perPage}
                    totalItems={historyPagination.totalItems}
                    totalPages={historyPagination.totalPages}
                    onPageChange={historyPagination.setPage}
                    onPerPageChange={(n) => {
                      historyPagination.setPerPage(n);
                      historyPagination.setPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {tab === "report" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select month range to view or print contribution report.</p>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">From</span>
                  <SelectInput
                    value={reportFromMonth}
                    onChange={(e) => setReportFromMonth(Number(e.target.value))}
                    size="sm"
                    searchable={false}
                    className="min-w-[9rem]"
                    options={monthNames.map((m, i) => ({
                      value: i + 1,
                      label: m,
                    }))}
                  />
                  <SelectInput
                    value={reportFromYear}
                    onChange={(e) => setReportFromYear(Number(e.target.value))}
                    size="sm"
                    searchable={false}
                    className="min-w-[5rem]"
                    options={[currentYear, currentYear - 1, currentYear - 2].map((y) => ({
                      value: y,
                      label: String(y),
                    }))}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">To</span>
                  <SelectInput
                    value={reportToMonth}
                    onChange={(e) => setReportToMonth(Number(e.target.value))}
                    size="sm"
                    searchable={false}
                    className="min-w-[9rem]"
                    options={monthNames.map((m, i) => ({
                      value: i + 1,
                      label: m,
                    }))}
                  />
                  <SelectInput
                    value={reportToYear}
                    onChange={(e) => setReportToYear(Number(e.target.value))}
                    size="sm"
                    searchable={false}
                    className="min-w-[5rem]"
                    options={[currentYear, currentYear - 1, currentYear - 2].map((y) => ({
                      value: y,
                      label: String(y),
                    }))}
                  />
                </label>
              </div>
              <div ref={reportRef} className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50 text-emerald-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Period</th>
                      <th className="px-4 py-3 text-right font-semibold">Employee EPF (8%)</th>
                      <th className="px-4 py-3 text-right font-semibold">Employer EPF (12%)</th>
                      <th className="px-4 py-3 text-right font-semibold">ETF (3%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportEntries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No data for selected range.</td>
                      </tr>
                    ) : (
                      reportPagination.paginatedItems.map((h, i) => (
                        <tr key={`${h.year}-${h.month}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 border-t border-gray-200">{h.monthName} {h.year}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right">{Number(h.epf_payment).toFixed(2)}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right">{Number(h.employer_epf_payment ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right">{Number(h.etf_payment).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <TablePagination
                  page={reportPagination.page}
                  perPage={reportPagination.perPage}
                  totalItems={reportPagination.totalItems}
                  totalPages={reportPagination.totalPages}
                  onPageChange={reportPagination.setPage}
                  onPerPageChange={(n) => {
                    reportPagination.setPerPage(n);
                    reportPagination.setPage(1);
                  }}
                />
              </div>
              {reportEntries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <FaPrint /> Print Report
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    <FaFilePdf /> Download PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributionModal;
