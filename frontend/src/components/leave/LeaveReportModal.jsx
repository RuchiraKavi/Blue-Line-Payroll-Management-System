import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaTimes, FaFileAlt, FaFilePdf } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth.js";
import {
  buildLeaveReportRows,
  downloadLeaveReportPdf,
  getMonthName,
} from "../../utils/leaveReportFormat.js";
import { resolveLeaveReportApprovalInfo } from "../../utils/leaveReportApproval.js";
import SelectInput from "../ui/SelectInput.jsx";
import LeaveReportTable from "./LeaveReportTable.jsx";

const API_BASE = "http://localhost:5000/api";

const MONTH_OPTIONS = [
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

const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const LeaveReportModal = ({ leaves, onClose }) => {
  const { user } = useAuth();
  const now = new Date();
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportApproval, setReportApproval] = useState(null);
  const [draftSignature, setDraftSignature] = useState(null);
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [approvingReport, setApprovingReport] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  const reportMonthName = getMonthName(reportMonth);

  const leaveFormatRows = useMemo(
    () => buildLeaveReportRows(leaves, reportMonth, reportYear),
    [leaves, reportMonth, reportYear]
  );

  const approvalInfo = useMemo(
    () => resolveLeaveReportApprovalInfo(reportApproval, user),
    [reportApproval, user]
  );

  const fetchReportApproval = useCallback(async () => {
    setLoadingApproval(true);
    setApprovalError("");
    try {
      const res = await axios.get(`${API_BASE}/leaves/report-approval`, {
        params: { month: reportMonth, year: reportYear },
        headers: getAuthHeader(),
      });
      if (res.data?.success) {
        setReportApproval(res.data.approval || null);
        setDraftSignature(null);
      } else {
        setReportApproval(null);
      }
    } catch (err) {
      setReportApproval(null);
      setApprovalError(err.response?.data?.message || "Failed to load report approval");
    } finally {
      setLoadingApproval(false);
    }
  }, [reportMonth, reportYear]);

  useEffect(() => {
    fetchReportApproval();
  }, [fetchReportApproval]);

  const handleApproveReport = async () => {
    if (!draftSignature) return;
    setApprovingReport(true);
    setApprovalError("");
    try {
      const res = await axios.post(
        `${API_BASE}/leaves/report-approval`,
        {
          month: reportMonth,
          year: reportYear,
          signature_data_url: draftSignature,
        },
        { headers: getAuthHeader() }
      );
      if (res.data?.success) {
        setReportApproval(res.data.approval || null);
        setDraftSignature(null);
      } else {
        setApprovalError(res.data?.message || "Failed to approve report");
      }
    } catch (err) {
      setApprovalError(err.response?.data?.message || "Failed to approve report");
    } finally {
      setApprovingReport(false);
    }
  };

  const isReportApproved = Boolean(approvalInfo.isApproved && approvalInfo.signatureDataUrl);

  const handleDownloadPdf = () => {
    if (!leaveFormatRows.length || !isReportApproved) return;
    const pdfApprovalInfo = {
      approvedBy: approvalInfo.approvedBy,
      name: approvalInfo.name,
      signatureDataUrl: approvalInfo.signatureDataUrl,
    };
    downloadLeaveReportPdf({
      rows: leaveFormatRows,
      monthName: reportMonthName,
      year: reportYear,
      fileName: `Leave_Report_${reportMonthName}_${reportYear}.pdf`.replace(/\s+/g, "_"),
      approvalInfo: pdfApprovalInfo,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaFileAlt className="text-blue-600" />
            Monthly Leave Report
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

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <p className="text-sm text-gray-600">
              {reportMonthName} {reportYear} — {leaveFormatRows.length} record
              {leaveFormatRows.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <SelectInput
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                size="sm"
                searchable={false}
                className="min-w-[9.5rem]"
                options={MONTH_OPTIONS.map((label, i) => ({
                  value: i + 1,
                  label,
                }))}
              />
              <SelectInput
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                size="sm"
                searchable={false}
                className="min-w-[6rem]"
                options={Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i).map((y) => ({
                  value: y,
                  label: String(y),
                }))}
              />
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={leaveFormatRows.length === 0 || !isReportApproved}
                title={
                  isReportApproved
                    ? "Download approved leave report PDF"
                    : "Approve the report with your signature before downloading PDF"
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaFilePdf /> Get PDF
              </button>
            </div>
          </div>

          {approvalError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{approvalError}</div>
          )}

          <LeaveReportTable
            rows={leaveFormatRows}
            monthName={reportMonthName}
            year={reportYear}
            approvalInfo={approvalInfo}
            approvalEditable
            draftSignature={draftSignature}
            onDraftSignatureChange={setDraftSignature}
            onApproveReport={handleApproveReport}
            approvingReport={approvingReport}
            loadingApproval={loadingApproval}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaveReportModal;
