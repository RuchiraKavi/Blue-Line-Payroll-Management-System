import React from "react";
import { usePagination } from "../../hooks/usePagination.js";
import TablePagination from "../ui/TablePagination.jsx";

const SalarySummaryTable = ({
  filteredRows,
  approvedRows,
  summaryLoading,
  loadingLabel = "Loading…",
  emptyNoApprovedMessage = "No approved employees for this period.",
  emptyNoMatchMessage = "No employees match the filter.",
  getSummaryAmounts,
  resetKey,
}) => {
  const pagination = usePagination(filteredRows, { resetKey });

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left font-semibold">Employee</th>
            <th className="px-6 py-4 text-left font-semibold">NIC</th>
            <th className="px-6 py-4 text-left font-semibold">EPF No.</th>
            <th className="px-6 py-4 text-left font-semibold">Department</th>
            <th className="px-6 py-4 text-right font-semibold">Gross Salary</th>
            <th className="px-6 py-4 text-right font-semibold">Total Deduction</th>
            <th className="px-6 py-4 text-right font-semibold">Net Pay</th>
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
              const c = getSummaryAmounts(row);
              return (
                <tr
                  key={row._id || row.employee}
                  className="border-t border-gray-100 hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-500">
                      {row.employee_id}
                      {row.designation ? ` · ${row.designation}` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-mono text-xs">{row.nic || "—"}</td>
                  <td className="px-6 py-4 text-gray-700 font-mono text-xs">{row.epf_number || "—"}</td>
                  <td className="px-6 py-4 text-gray-700">{row.department}</td>
                  <td className="px-6 py-4 text-right font-medium">{Number(c.gross_salary).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{Number(c.total_deduction).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-green-700">{Number(c.net_pay).toFixed(2)}</td>
                </tr>
              );
            })
          )}
        </tbody>
        {!summaryLoading && filteredRows.length > 0 && (
          <tfoot>
            <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-200">
              <td className="px-6 py-4" colSpan={4}>
                Total{filteredRows.length < approvedRows.length ? ` (${filteredRows.length} shown)` : ""}
              </td>
              <td className="px-6 py-4 text-right">
                {filteredRows.reduce((sum, r) => sum + Number(getSummaryAmounts(r).gross_salary), 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right">
                {filteredRows.reduce((sum, r) => sum + Number(getSummaryAmounts(r).total_deduction), 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right text-green-700">
                {filteredRows.reduce((sum, r) => sum + Number(getSummaryAmounts(r).net_pay), 0).toFixed(2)}
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
  );
};

export default SalarySummaryTable;
