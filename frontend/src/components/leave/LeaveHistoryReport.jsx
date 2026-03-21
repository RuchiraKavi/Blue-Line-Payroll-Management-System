import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { leaveDataTableCustomStyles, leaveTypeLabels } from "../../utils/LeaveHelper";

const API_BASE = "http://localhost:5000/api";

const reportColumns = [
  { name: "Employee", selector: (row) => row?.employeeId?.userId?.name || "—", sortable: true, wrap: true },
  { name: "Employee ID", selector: (row) => row?.employeeId?.employee_id || "—", sortable: true },
  { name: "Department", selector: (row) => row?.employeeId?.department?.dep_name || "—", sortable: true },
  {
    name: "Leave Type",
    selector: (row) => leaveTypeLabels[row.leaveType] || row.leaveType || "—",
    sortable: true,
  },
  {
    name: "Applied",
    selector: (row) => (row?.appliedAt ? new Date(row.appliedAt).toLocaleDateString("en-US") : "—"),
    sortable: true,
  },
  {
    name: "From",
    selector: (row) => (row?.startDate ? new Date(row.startDate).toLocaleDateString("en-US") : "—"),
    sortable: true,
  },
  {
    name: "To",
    selector: (row) => (row?.endDate ? new Date(row.endDate).toLocaleDateString("en-US") : "—"),
    sortable: true,
  },
  { name: "Reason", selector: (row) => row?.reason || "—", sortable: true, wrap: true },
  {
    name: "Status",
    selector: (row) => row.status,
    sortable: true,
    center: true,
    cell: (row) => (
      <span
        className={`px-2 py-1 rounded text-sm font-semibold ${
          row.status === "Approved"
            ? "bg-green-100 text-green-700"
            : row.status === "Rejected"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    name: "Days",
    selector: (row) => row.totalDays ?? 0,
    sortable: true,
    center: true,
    width: "90px",
    cell: (row) => (
      <span className="block w-full text-center tabular-nums">{row.totalDays ?? 0}</span>
    ),
  },
];

const escapeCsvCell = (value) => {
  const str = value == null ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const LeaveHistoryReport = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // all | Pending | Approved | Rejected
  const [leaveType, setLeaveType] = useState("all"); // all | casual | annual | sick | nopay
  const [appliedFrom, setAppliedFrom] = useState(""); // YYYY-MM-DD (appliedAt >= from)
  const [appliedTo, setAppliedTo] = useState(""); // YYYY-MM-DD (appliedAt <= to)

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API_BASE}/leaves`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data?.success && Array.isArray(res.data.leaves)) setLeaves(res.data.leaves);
        else setLeaves([]);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load leave history");
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const filteredLeaves = useMemo(() => {
    const q = search.trim().toLowerCase();

    const parseDateOnlyLocal = (dateStr, isEndOfDay) => {
      // dateStr: "YYYY-MM-DD" (from <input type="date" />)
      const parts = String(dateStr).split("-").map((n) => Number(n));
      const [y, m, d] = parts;
      if (!y || !m || !d) return null;
      if (isEndOfDay) return new Date(y, m - 1, d, 23, 59, 59, 999);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    };

    const fromDate = appliedFrom ? parseDateOnlyLocal(appliedFrom, false) : null;
    const toDate = appliedTo ? parseDateOnlyLocal(appliedTo, true) : null;

    return (leaves || []).filter((l) => {
      const lStatus = (l.status || "").toLowerCase();
      if (status !== "all" && lStatus !== status.toLowerCase()) return false;

      if (leaveType !== "all" && (l.leaveType || "").toLowerCase() !== leaveType.toLowerCase())
        return false;

      const appliedAtDate = l.appliedAt ? new Date(l.appliedAt) : null;
      if ((fromDate || toDate) && !appliedAtDate) return false;

      // Duration filter on appliedAt
      if (fromDate && appliedAtDate < fromDate) return false;
      if (toDate && appliedAtDate > toDate) return false;

      if (!q) return true;

      const empName = l?.employeeId?.userId?.name || "";
      const empId = l?.employeeId?.employee_id || "";
      const dept = l?.employeeId?.department?.dep_name || "";
      const reason = l?.reason || "";
      const lt = l?.leaveType || "";

      const haystack = `${empName} ${empId} ${dept} ${reason} ${lt} ${lStatus}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [leaves, search, status, leaveType, appliedFrom, appliedTo]);

  const reportRows = useMemo(() => {
    // CSV rows include header row at index 0
    const header = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Leave Type",
      "Applied At",
      "From",
      "To",
      "Reason",
      "Status",
      "Total Days",
    ];

    const rows = filteredLeaves.map((l) => {
      const empName = l?.employeeId?.userId?.name || "";
      const empId = l?.employeeId?.employee_id || "";
      const dept = l?.employeeId?.department?.dep_name || "";
      const type = leaveTypeLabels[l?.leaveType] || l?.leaveType || "";
      const appliedAt = l?.appliedAt ? new Date(l.appliedAt).toLocaleDateString("en-US") : "";
      const from = l?.startDate ? new Date(l.startDate).toLocaleDateString("en-US") : "";
      const to = l?.endDate ? new Date(l.endDate).toLocaleDateString("en-US") : "";
      const reason = l?.reason || "";
      const st = l?.status || "";
      const days = l?.totalDays ?? "";

      return [empName, empId, dept, type, appliedAt, from, to, reason, st, days];
    });

    return [header, ...rows];
  }, [filteredLeaves]);

  const handleExport = () => {
    if (appliedFrom || appliedTo) {
      const from = appliedFrom || "start";
      const to = appliedTo || "end";
      const safeFrom = String(from).replaceAll("-", "_");
      const safeTo = String(to).replaceAll("-", "_");
      downloadCsv(`leave_history_report_${safeFrom}_to_${safeTo}.csv`, reportRows);
      return;
    }
    downloadCsv(`leave_history_report_all_time.csv`, reportRows);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
      status !== "all" ||
      leaveType !== "all" ||
      appliedFrom ||
      appliedTo
  );

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setLeaveType("all");
    setAppliedFrom("");
    setAppliedTo("");
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave History Report</h2>
          <p className="text-sm text-gray-600 mt-1">View leave history for all employees and export a report.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || filteredLeaves.length === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading || !hasActiveFilters}
            className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear filters
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Search employee name / employee id / reason / type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white"
          >
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white"
          >
            <option value="all">All leave types</option>
            <option value="casual">Casual</option>
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="nopay">No Pay</option>
          </select>

          <input
            type="date"
            value={appliedFrom}
            onChange={(e) => setAppliedFrom(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white"
          />

          <input
            type="date"
            value={appliedTo}
            onChange={(e) => setAppliedTo(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading leave history...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <DataTable
            columns={reportColumns}
            data={filteredLeaves}
            highlightOnHover
            responsive
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
            striped
            noDataComponent={
              <div className="py-20 text-center">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  ></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No leave records found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            }
            customStyles={leaveDataTableCustomStyles}
          />
        </div>
      )}
    </div>
  );
};

export default LeaveHistoryReport;

