import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const DEFAULT_OPTIONS = [5, 10, 15, 20, 25, 50];

const TablePagination = ({
  page,
  perPage,
  totalItems,
  totalPages,
  onPageChange,
  onPerPageChange,
  perPageOptions = DEFAULT_OPTIONS,
  className = "",
}) => {
  if (totalItems === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);

  const pageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div
      className={`flex flex-col gap-3 border-t-2 border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="whitespace-nowrap tabular-nums">
          {from}–{to} of {totalItems}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <FaChevronLeft className="h-3.5 w-3.5" />
        </button>

        {pageNumbers().map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
              n === page
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            }`}
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <FaChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
