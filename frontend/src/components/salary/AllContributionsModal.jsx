import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { FaTimes, FaFileAlt, FaPrint, FaFilePdf, FaUsers } from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AllContributionsModal = ({ currentMonth, currentYear, onClose }) => {
  const [tab, setTab] = useState("current");
  const [periodMonth, setPeriodMonth] = useState(currentMonth);
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportFromMonth, setReportFromMonth] = useState(1);
  const [reportFromYear, setReportFromYear] = useState(currentYear);
  const [reportToMonth, setReportToMonth] = useState(12);
  const [reportToYear, setReportToYear] = useState(currentYear);
  const [reportRuns, setReportRuns] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const reportRef = useRef(null);

  const entries = run?.entries || [];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    axios
      .get(`${API_BASE}/salary/runs`, { params: { month: periodMonth, year: periodYear }, headers: getAuthHeader() })
      .then((res) => {
        if (!cancelled && res.data?.success && res.data.run) {
          setRun(res.data.run);
          setError("");
        } else {
          setRun(null);
          if (!cancelled && res.data?.success === false && res.response?.status !== 404) setError(res.data?.message || "No data");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRun(null);
          if (err.response?.status === 404) setError("");
          else setError(err.response?.data?.message || "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [periodMonth, periodYear]);

  const loadReportRange = () => {
    setLoadingReport(true);
    const runsToFetch = [];
    for (let y = reportFromYear; y <= reportToYear; y++) {
      const startM = y === reportFromYear ? reportFromMonth : 1;
      const endM = y === reportToYear ? reportToMonth : 12;
      for (let m = startM; m <= endM; m++) {
        runsToFetch.push({ month: m, year: y });
      }
    }
    Promise.all(
      runsToFetch.map(({ month, year }) =>
        axios.get(`${API_BASE}/salary/runs`, { params: { month, year }, headers: getAuthHeader() }).then((r) => ({ month, year, run: r.data?.run }))
      )
    )
      .then((results) => {
        setReportRuns(results.filter((r) => r.run?.entries?.length));
      })
      .catch(() => setReportRuns([]))
      .finally(() => setLoadingReport(false));
  };

  useEffect(() => {
    if (tab === "report") setReportRuns([]);
  }, [tab]);

  const handlePrintReport = () => {
    const content = reportRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>All Employees Contribution Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
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
    if (reportRuns.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 12;
    let y = 14;
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    doc.text("All Employees — EPF & ETF Contribution Report", pageW / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const totalTableW = pageW - 2 * margin;
    const colEmployee = totalTableW * 0.28;
    const colId = totalTableW * 0.14;
    const colEmpEpf = totalTableW * 0.16;
    const colEmprEpf = totalTableW * 0.18;
    const colEtf = totalTableW * 0.14;
    const rowH = 6;
    reportRuns.forEach(({ month, year, run: r }) => {
      if (!r?.entries?.length) return;
      doc.setFont("helvetica", "bold");
      doc.text(`${monthNames[month - 1]} ${year}`, margin, y);
      y += rowH;
      doc.setFillColor(236, 253, 245);
      doc.rect(margin, y, totalTableW, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Employee", margin + 2, y + 4);
      doc.text("ID", margin + colEmployee + 2, y + 4);
      doc.text("Emp EPF(8%)", margin + colEmployee + colId + colEmpEpf - 2, y + 4, { align: "right" });
      doc.text("Empr EPF(12%)", margin + colEmployee + colId + colEmpEpf + colEmprEpf - 2, y + 4, { align: "right" });
      doc.text("ETF(3%)", margin + totalTableW - 2, y + 4, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += rowH;
      r.entries.forEach((e, i) => {
        if (y + rowH > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage("landscape");
          y = 14;
        }
        doc.setFontSize(8);
        doc.text((e.name || "—").slice(0, 20), margin + 2, y + 4);
        doc.text((e.employee_id || "—").slice(0, 10), margin + colEmployee + 2, y + 4);
        doc.text(Number(e.epf_payment || 0).toFixed(2), margin + colEmployee + colId + colEmpEpf - 2, y + 4, { align: "right" });
        doc.text(Number(e.employer_epf_payment || 0).toFixed(2), margin + colEmployee + colId + colEmpEpf + colEmprEpf - 2, y + 4, { align: "right" });
        doc.text(Number(e.etf_payment || 0).toFixed(2), margin + totalTableW - 2, y + 4, { align: "right" });
        y += rowH;
      });
      y += 4;
    });
    doc.save("All_Employees_Contribution_Report.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-linear-to-r from-emerald-50 to-teal-50 border-b border-gray-200 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaUsers className="text-emerald-600" />
            All Employees — EPF & ETF Contribution
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors" aria-label="Close">
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {["current", "report"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === t ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "current" && "This period"}
              {t === "report" && <>Report <FaFileAlt className="inline ml-1" /></>}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && !loading && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

          {tab === "current" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Period:</span>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {monthNames.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {loading ? (
                <p className="text-gray-500">Loading…</p>
              ) : entries.length === 0 ? (
                <p className="text-gray-500">No saved data for this period. Save salary runs to see contributions here.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-emerald-50 text-emerald-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Employee</th>
                        <th className="px-4 py-3 text-left font-semibold">ID</th>
                        <th className="px-4 py-3 text-right font-semibold">Employee EPF (8%) Rs.</th>
                        <th className="px-4 py-3 text-right font-semibold">Employer EPF (12%) Rs.</th>
                        <th className="px-4 py-3 text-right font-semibold">ETF (3%) Rs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={e.employee || i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 border-t border-gray-200">{e.name || "—"}</td>
                          <td className="px-4 py-3 border-t border-gray-200">{e.employee_id || "—"}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right font-medium">{Number(e.epf_payment || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right font-medium">{Number(e.employer_epf_payment || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 border-t border-gray-200 text-right font-medium">{Number(e.etf_payment || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "report" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select month range, then load and print or download contribution report for all employees.</p>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">From</span>
                  <select value={reportFromMonth} onChange={(e) => setReportFromMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {monthNames.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select value={reportFromYear} onChange={(e) => setReportFromYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">To</span>
                  <select value={reportToMonth} onChange={(e) => setReportToMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {monthNames.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select value={reportToYear} onChange={(e) => setReportToYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={loadReportRange}
                  disabled={loadingReport}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 text-sm"
                >
                  {loadingReport ? "Loading…" : "Load report"}
                </button>
              </div>
              <div ref={reportRef} className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50 text-emerald-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Period</th>
                      <th className="px-4 py-3 text-left font-semibold">Employee</th>
                      <th className="px-4 py-3 text-left font-semibold">Employee ID</th>
                      <th className="px-4 py-3 text-right font-semibold">Employee EPF (8%)</th>
                      <th className="px-4 py-3 text-right font-semibold">Employer EPF (12%)</th>
                      <th className="px-4 py-3 text-right font-semibold">ETF (3%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRuns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Load report to see data.</td>
                      </tr>
                    ) : (
                      reportRuns.flatMap(({ month, year, run: r }) =>
                        (r?.entries || []).map((e, i) => (
                          <tr key={`${year}-${month}-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3 border-t border-gray-200">{monthNames[month - 1]} {year}</td>
                            <td className="px-4 py-3 border-t border-gray-200">{e.name || "—"}</td>
                            <td className="px-4 py-3 border-t border-gray-200">{e.employee_id || "—"}</td>
                            <td className="px-4 py-3 border-t border-gray-200 text-right">{Number(e.epf_payment || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 border-t border-gray-200 text-right">{Number(e.employer_epf_payment || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 border-t border-gray-200 text-right">{Number(e.etf_payment || 0).toFixed(2)}</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
              {reportRuns.length > 0 && (
                <div className="flex gap-2">
                  <button type="button" onClick={handlePrintReport} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 text-sm">
                    <FaPrint /> Print report
                  </button>
                  <button type="button" onClick={handleDownloadPdf} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 text-sm">
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

export default AllContributionsModal;
