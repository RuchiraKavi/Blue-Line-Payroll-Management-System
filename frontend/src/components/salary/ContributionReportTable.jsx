import React from "react";
import { usePagination } from "../../hooks/usePagination.js";
import TablePagination from "../ui/TablePagination.jsx";
import {
  CONTRIBUTION_COMPANY_NAME,
  sumContributionRows,
} from "../../utils/contributionReportFormat.js";
import { formatPaysheetMoney } from "../../utils/paysheetFormat.js";
import ReportApprovalSection from "./ReportApprovalSection.jsx";

const ContributionReportTable = ({
  rows,
  monthName,
  year,
  subtitle,
  loading = false,
  loadingLabel = "Loading…",
  emptyMessage = "No contribution data for this period.",
  resetKey,
  paginate = true,
  approvalInfo,
}) => {
  const pagination = usePagination(rows, { resetKey });
  const displayRows = paginate ? pagination.paginatedItems : rows;
  const totals = sumContributionRows(rows);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-gray-200 bg-linear-to-r from-gray-50 to-blue-50 px-6 py-5">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">{CONTRIBUTION_COMPANY_NAME}</h2>
          <p className="mt-1 text-base font-semibold text-blue-800">
            EPF &amp; ETF Contribution Report
          </p>
        </div>
        {subtitle && (
          <p className="mt-3 text-sm text-gray-600 text-center">{subtitle}</p>
        )}
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
              <th className="px-6 py-4 text-right font-semibold w-1/5">Employee EPF (8%)</th>
              <th className="px-6 py-4 text-right font-semibold w-1/5">Employer EPF (12%)</th>
              <th className="px-6 py-4 text-right font-semibold w-1/5">Employer ETF (3%)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  {loadingLabel}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayRows.map((row, index) => (
                <tr
                  key={`${row.employee_id}-${row.name}-${index}`}
                  className="border-t border-gray-100 hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-gray-700">{row.employee_id || "—"}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{row.name || "—"}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatPaysheetMoney(row.epf_payment)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatPaysheetMoney(row.employer_epf_payment)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatPaysheetMoney(row.etf_payment)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-200">
                <td className="px-6 py-4">Total</td>
                <td className="px-6 py-4" />
                <td className="px-6 py-4 text-right">
                  {formatPaysheetMoney(totals.epf_payment)}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPaysheetMoney(totals.employer_epf_payment)}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPaysheetMoney(totals.etf_payment)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {paginate && !loading && rows.length > 0 && (
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
        )}
      </div>

      <ReportApprovalSection approvalInfo={approvalInfo} />
    </div>
  );
};

export default ContributionReportTable;
