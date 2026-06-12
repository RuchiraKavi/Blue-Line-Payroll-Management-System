import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { FaTimes, FaFileAlt, FaPrint, FaFilePdf, FaUsers } from "react-icons/fa";
import SelectInput from "../ui/SelectInput.jsx";
import ContributionReportTable from "./ContributionReportTable.jsx";
import {
  mapContributionEntry,
  downloadContributionReportPdf,
  downloadContributionReportRangePdf,
} from "../../utils/contributionReportFormat.js";
import { resolveApprovalInfo } from "../../utils/approvalInfo.js";

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

  const currentRows = useMemo(
    () => (run?.entries || []).map(mapContributionEntry),
    [run]
  );

  const currentApprovalInfo = useMemo(
    () => resolveApprovalInfo(run),
    [run]
  );

  const reportSections = useMemo(
    () =>
      reportRuns
        .filter((r) => r.run?.entries?.length)
        .map(({ month, year, run: r }) => ({
          month,
          year,
          monthName: monthNames[month - 1],
          rows: (r.entries || []).map(mapContributionEntry),
          approvalInfo: resolveApprovalInfo(r),
        })),
    [reportRuns]
  );

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
          if (!cancelled && res.data?.success === false && res.response?.status !== 404) {
            setError(res.data?.message || "No data");
          }
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
        axios
          .get(`${API_BASE}/salary/runs`, { params: { month, year }, headers: getAuthHeader() })
          .then((r) => ({ month, year, run: r.data?.run }))
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
        <head><title>EPF & ETF Contribution Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: 600; }
          .text-right { text-align: right; }
          .section { margin-bottom: 32px; page-break-after: always; }
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

  const handleDownloadCurrentPdf = () => {
    downloadContributionReportPdf({
      rows: currentRows,
      monthName: monthNames[periodMonth - 1],
      year: periodYear,
      approvalInfo: currentApprovalInfo,
      fileName: `EPF_ETF_Contribution_${monthNames[periodMonth - 1]}_${periodYear}.pdf`.replace(/\s+/g, "_"),
    });
  };

  const handleDownloadRangePdf = () => {
    downloadContributionReportRangePdf({
      sections: reportSections,
      fileName: `EPF_ETF_Contribution_${monthNames[reportFromMonth - 1]}_${reportFromYear}_to_${monthNames[reportToMonth - 1]}_${reportToYear}.pdf`.replace(/\s+/g, "_"),
    });
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
                <SelectInput
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  size="sm"
                  searchable={false}
                  className="min-w-[9rem]"
                  options={monthNames.map((m, i) => ({
                    value: i + 1,
                    label: m,
                  }))}
                />
                <SelectInput
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  size="sm"
                  searchable={false}
                  className="min-w-[5rem]"
                  options={[currentYear, currentYear - 1, currentYear - 2].map((y) => ({
                    value: y,
                    label: String(y),
                  }))}
                />
                {currentRows.length > 0 && !loading && (
                  <button
                    type="button"
                    onClick={handleDownloadCurrentPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 text-sm ml-auto"
                  >
                    <FaFilePdf /> Download PDF
                  </button>
                )}
              </div>
              <ContributionReportTable
                rows={currentRows}
                monthName={monthNames[periodMonth - 1]}
                year={periodYear}
                loading={loading}
                loadingLabel="Loading…"
                emptyMessage="No saved data for this period. Save salary runs to see contributions here."
                approvalInfo={currentApprovalInfo}
                resetKey={`${periodMonth}-${periodYear}`}
              />
            </div>
          )}

          {tab === "report" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select month range, then load and print or download the contribution report for all employees.
              </p>
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
                <button
                  type="button"
                  onClick={loadReportRange}
                  disabled={loadingReport}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 text-sm"
                >
                  {loadingReport ? "Loading…" : "Load report"}
                </button>
              </div>

              <div ref={reportRef}>
                {loadingReport ? (
                  <p className="text-gray-500 py-8 text-center">Loading report…</p>
                ) : reportSections.length === 0 ? (
                  <p className="text-gray-500 py-8 text-center">Load report to see data.</p>
                ) : (
                  <div className="space-y-10">
                    {reportSections.map((section) => (
                      <div key={`${section.year}-${section.month}`} className="section">
                        <ContributionReportTable
                          rows={section.rows}
                          monthName={section.monthName}
                          year={section.year}
                          paginate={false}
                          approvalInfo={section.approvalInfo}
                          resetKey={`${section.year}-${section.month}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {reportSections.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 text-sm"
                  >
                    <FaPrint /> Print report
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadRangePdf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 text-sm"
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

export default AllContributionsModal;
