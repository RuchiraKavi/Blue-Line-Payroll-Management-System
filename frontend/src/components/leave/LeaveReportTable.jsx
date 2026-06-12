import React from "react";
import { LEAVE_REPORT_COMPANY_NAME } from "../../utils/leaveReportFormat.js";
import LeaveReportApprovalSection from "./LeaveReportApprovalSection.jsx";

const LeaveReportTable = ({
  rows,
  monthName,
  year,
  approvalInfo,
  approvalEditable = false,
  draftSignature = null,
  onDraftSignatureChange,
  onApproveReport,
  approvingReport = false,
  loadingApproval = false,
}) => {
  return (
    <div>
      <div className="mb-6 rounded-xl border border-gray-200 bg-linear-to-r from-gray-50 to-blue-50 px-6 py-5">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">{LEAVE_REPORT_COMPANY_NAME}</h2>
          <p className="mt-1 text-base font-semibold text-blue-800">Leave Report</p>
        </div>
        <div className="mt-4 text-sm text-gray-600 space-y-0.5">
          <p>
            <span className="font-medium text-gray-700">Year:</span> {year ?? "—"}
          </p>
          <p>
            <span className="font-medium text-gray-700">Month:</span> {monthName ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold w-1/5">Employee ID</th>
              <th className="px-6 py-4 text-left font-semibold w-1/5">Employee Name</th>
              <th className="px-6 py-4 text-left font-semibold w-1/5">Department</th>
              <th className="px-6 py-4 text-left font-semibold w-1/5">Date</th>
              <th className="px-6 py-4 text-left font-semibold w-1/5">Leave type</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No leave records for this report period.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.employee_id}-${row.date}-${row.leave_type}-${index}`}
                  className="border-t border-gray-100 hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-gray-700">{row.employee_id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{row.name}</td>
                  <td className="px-6 py-4 text-gray-700">{row.department}</td>
                  <td className="px-6 py-4 text-gray-700">{row.date}</td>
                  <td className="px-6 py-4 text-gray-700">{row.leave_type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LeaveReportApprovalSection
        approvalInfo={approvalInfo}
        editable={approvalEditable}
        draftSignature={draftSignature}
        onDraftSignatureChange={onDraftSignatureChange}
        onApprove={onApproveReport}
        approving={approvingReport}
        loading={loadingApproval}
      />
    </div>
  );
};

export default LeaveReportTable;
