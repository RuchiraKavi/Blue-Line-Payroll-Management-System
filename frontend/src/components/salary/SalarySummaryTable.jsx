import React from "react";
import { usePagination } from "../../hooks/usePagination.js";
import TablePagination from "../ui/TablePagination.jsx";
import {
  PAYSLIP_COMPANY_NAME,
  formatPaysheetMoney,
} from "../../utils/paysheetFormat.js";
import ReportApprovalSection from "./ReportApprovalSection.jsx";

const SalarySummaryTable = ({
  filteredRows,
  approvedRows,
  summaryLoading,
  monthName,
  year,
  loadingLabel = "Loading…",
  emptyNoApprovedMessage = "No approved employees for this period.",
  emptyNoMatchMessage = "No employees match the filter.",
  getSummaryAmounts,
  resetKey,
  approvalInfo,
}) => {
  const pagination = usePagination(filteredRows, { resetKey });

  const totals = filteredRows.reduce(
    (acc, row) => {
      const amounts = getSummaryAmounts(row);
      acc.basic_salary += amounts.basic_salary;
      acc.allowances += amounts.allowances;
      acc.total_deduction += amounts.total_deduction;
      acc.net_pay += amounts.net_pay;
      return acc;
    },
    { basic_salary: 0, allowances: 0, total_deduction: 0, net_pay: 0 }
  );

  return (
    <div>
      <div className="mb-6 rounded-xl border border-gray-200 bg-linear-to-r from-gray-50 to-blue-50 px-6 py-5">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">{PAYSLIP_COMPANY_NAME}</h2>
          <p className="mt-1 text-base font-semibold text-blue-800">Monthly Pay Sheet</p>
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
        <table className="min-w-full text-sm">
          <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Employee Name</th>
              <th className="px-6 py-4 text-left font-semibold">Employee Id</th>
              <th className="px-6 py-4 text-left font-semibold">Designation</th>
              <th className="px-6 py-4 text-right font-semibold">Basic Salary</th>
              <th className="px-6 py-4 text-right font-semibold">Allowances</th>
              <th className="px-6 py-4 text-right font-semibold">Deductions</th>
              <th className="px-6 py-4 text-right font-semibold">Net salary</th>
            </tr>
          </thead>
          <tbody>
            {summaryLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {loadingLabel}
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {approvedRows.length === 0 ? emptyNoApprovedMessage : emptyNoMatchMessage}
                </td>
              </tr>
            ) : (
              pagination.paginatedItems.map((row) => {
                const amounts = getSummaryAmounts(row);
                return (
                  <tr
                    key={row._id || row.employee}
                    className="border-t border-gray-100 hover:bg-blue-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">{row.name || "—"}</td>
                    <td className="px-6 py-4 text-gray-700">{row.employee_id || "—"}</td>
                    <td className="px-6 py-4 text-gray-700">{row.designation || "—"}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatPaysheetMoney(amounts.basic_salary)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatPaysheetMoney(amounts.allowances)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatPaysheetMoney(amounts.total_deduction)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-700">
                      {formatPaysheetMoney(amounts.net_pay)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {!summaryLoading && filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-200">
                <td className="px-6 py-4" colSpan={3}>
                  Total amount
                  {filteredRows.length < approvedRows.length
                    ? ` (${filteredRows.length} shown)`
                    : ""}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPaysheetMoney(totals.basic_salary)}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPaysheetMoney(totals.allowances)}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPaysheetMoney(totals.total_deduction)}
                </td>
                <td className="px-6 py-4 text-right text-green-700">
                  {formatPaysheetMoney(totals.net_pay)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {!summaryLoading && (
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

export default SalarySummaryTable;
