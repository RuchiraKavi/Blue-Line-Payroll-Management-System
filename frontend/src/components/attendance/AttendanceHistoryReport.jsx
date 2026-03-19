import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { FaHistory, FaTimes } from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

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

/** Parse workingHours string to decimal hours: "8.5" → 8.5, "8:30" → 8.5 */
const parseWorkingHours = (value) => {
  if (value == null || value === "") return 0;
  const s = String(value).trim();
  if (s.includes(":")) {
    const [h, m] = s.split(":");
    return (parseFloat(h) || 0) + (parseFloat(m) || 0) / 60;
  }
  return parseFloat(s) || 0;
};

const AttendanceHistoryReport = () => {
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState(""); // YYYY-MM-DD

  const [employeeQuery, setEmployeeQuery] = useState(""); // Employee ID or name
  const [employeeQueryDebounced, setEmployeeQueryDebounced] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]); // flattened rows for all employees

  const [leaveTotalsMap, setLeaveTotalsMap] = useState({}); // keyed by Employee ObjectId
  const [historyEmployeeDbId, setHistoryEmployeeDbId] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        setError("");
        const res = await axios.get(`${API_BASE}/employees`, { headers: getAuthHeader() });
        if (res.data?.success && Array.isArray(res.data.employees)) setEmployees(res.data.employees);
        else setEmployees([]);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load employees");
        setEmployees([]);
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEmployeeQueryDebounced(employeeQuery), 350);
    return () => clearTimeout(t);
  }, [employeeQuery]);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (!to) return params;
    const resolvedTo = to;
    // If "from" is empty but "to" exists, use last 90 days ending at "to"
    const resolvedFrom =
      from ||
      (() => {
        const t = new Date(resolvedTo);
        if (Number.isNaN(t.getTime())) return "";
        const f = new Date(t);
        f.setDate(f.getDate() - 90);
        return f.toISOString().slice(0, 10);
      })();
    if (resolvedFrom) params.set("from", resolvedFrom);
    params.set("to", resolvedTo);
    return params;
  };

  const generateReport = async (employeesToFetch) => {
    if (!Array.isArray(employeesToFetch) || employeesToFetch.length === 0) {
      setRecords([]);
      setLeaveTotalsMap({});
      setHistoryEmployeeDbId(null);
      return;
    }
    setLoading(true);
    setError("");
    setRecords([]);
    setHistoryEmployeeDbId(null);
    try {
      const params = buildParams();

      // Small concurrency limit to avoid overloading the server
      const concurrency = 4;
      let idx = 0;
      const out = [];

      const fetchOne = async () => {
        while (idx < employeesToFetch.length) {
          const current = employeesToFetch[idx];
          idx += 1;
          if (!current) return;

          const url = `${API_BASE}/attendance/employee/${current._id}${
            params.toString() ? `?${params.toString()}` : ""
          }`;

          try {
            const res = await axios.get(url, { headers: getAuthHeader() });
            if (res.data?.success) {
              const attendance = Array.isArray(res.data.attendance) ? res.data.attendance : [];
              const enriched = attendance.map((r) => ({
                employee_db_id: current._id,
                employee_id: r.employee_id ?? current.employee_id ?? "",
                employee_name: current.userId?.name ?? "",
                designation: current.designation ?? "",
                department: current.department?.dep_name ?? "",
                date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
                inTime: r.inTime ?? "",
                outTime: r.outTime ?? "",
                workingHours: r.workingHours ?? "",
                status: r.status ?? "",
                holidays: r.holidays ?? "",
                dayOff: r.dayOff ?? "",
                leave: r.leave ?? "",
              }));
              out.push(...enriched);
            }
          } catch (err) {
            // Don't stop the entire report if one employee fails
            console.error("Attendance history fetch failed for employee:", current?._id, err);
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => fetchOne()));

      // Sort by date desc then employee name for stable CSV
      out.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        if (da !== db) return db - da;
        return String(a.employee_name).localeCompare(String(b.employee_name));
      });

      setRecords(out);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to generate attendance report");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setEmployeeQuery("");
    setEmployeeQueryDebounced("");
    setRecords([]);
    setLeaveTotalsMap({});
    setHistoryEmployeeDbId(null);
    setError("");
  };

  const employeesForReport = useMemo(() => {
    const q = (employeeQueryDebounced || "").trim().toLowerCase();
    if (!q) return employees;
    return (employees || []).filter((emp) => {
      const empId = String(emp.employee_id || "").toLowerCase();
      const name = String(emp.userId?.name || "").toLowerCase();
      return empId.includes(q) || name.includes(q);
    });
  }, [employees, employeeQueryDebounced]);

  const summaryByEmployee = useMemo(() => {
    const byId = {};
    for (const r of records || []) {
      const empDbId = r.employee_db_id ? String(r.employee_db_id) : "";
      if (!empDbId) continue;
      if (!byId[empDbId]) {
        byId[empDbId] = {
          employee_db_id: empDbId,
          employee_id: r.employee_id || "",
          employee_name: r.employee_name || "",
          department: r.department || "",
          designation: r.designation || "",
          workedDays: 0,
          totalHours: 0,
        };
      }
      if (r.status === "Present") byId[empDbId].workedDays += 1;
      byId[empDbId].totalHours += parseWorkingHours(r.workingHours);
    }
    return Object.values(byId).sort((a, b) => String(a.employee_id).localeCompare(String(b.employee_id)));
  }, [records]);

  const historyRecords = useMemo(() => {
    if (!historyEmployeeDbId) return [];
    return (records || []).filter((r) => String(r.employee_db_id) === String(historyEmployeeDbId));
  }, [records, historyEmployeeDbId]);

  const reportRows = useMemo(() => {
    const header = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation",
      "Date",
      "In Time",
      "Out Time",
      "Working Hours",
      "Status",
      "Holidays",
      "Day Off",
      "Leave",
    ];

    const rows = records.map((r) => [
      r.employee_id,
      r.employee_name,
      r.department,
      r.designation,
      r.date,
      r.inTime,
      r.outTime,
      r.workingHours,
      r.status,
      r.holidays,
      r.dayOff,
      r.leave,
    ]);

    return [header, ...rows];
  }, [records]);

  const handleExport = () => {
    const safeFrom = from || "start";
    const safeTo = to || "end";
    const name = `attendance_history_report_${safeFrom}_to_${safeTo}`.replaceAll("-", "_");
    downloadCsv(`${name}.csv`, reportRows);
  };

  // Fetch leave totals for the same duration so the summary table can show "Total leave"
  useEffect(() => {
    const loadLeaveTotals = async () => {
      if (!to) {
        setLeaveTotalsMap({});
        return;
      }
      try {
        setLeaveTotalsMap({});
        const params = new URLSearchParams();
        const paramsBuilt = buildParams();
        // buildParams always includes both from/to when "to" is selected.
        for (const [k, v] of paramsBuilt.entries()) params.set(k, v);

        const res = await axios.get(`${API_BASE}/leaves/total-days-by-employee?${params}`, {
          headers: getAuthHeader(),
        });

        if (res.data?.success && Array.isArray(res.data.data)) {
          const map = {};
          (res.data.data || []).forEach((o) => {
            map[o.employeeId] = o.totalLeaveDays ?? 0;
          });
          setLeaveTotalsMap(map);
        }
      } catch (err) {
        setLeaveTotalsMap({});
      }
    };

    loadLeaveTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  useEffect(() => {
    // Auto-generate report whenever "To" is selected.
    // If "To" is cleared, hide results.
    if (!to) {
      setRecords([]);
      setError("");
      return;
    }
    if (employeesLoading) return;
    if (!employees || employees.length === 0) return;

    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await generateReport(employeesForReport);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, employeesForReport, employeesLoading]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance History Report</h2>
          <p className="text-sm text-gray-600 mt-1">Exports attendance records for all employees within the selected duration.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || records.length === 0}
            className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-start md:justify-end flex-col md:flex-row md:items-end md:gap-3">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID / Name</label>
              <input
                type="text"
                value={employeeQuery}
                onChange={(e) => setEmployeeQuery(e.target.value)}
                placeholder="e.g. BL001 or John"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 md:mt-0">
              {to ? "Report loads automatically." : "Select a To date to load report."}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Generating attendance history...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {records.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              {to ? "No attendance records found for the selected filters." : "No records yet. Select a To date."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">S.No</th>
                      <th className="px-6 py-3 text-left font-semibold">Employee ID</th>
                      <th className="px-6 py-3 text-left font-semibold">Name</th>
                      <th className="px-6 py-3 text-left font-semibold">Department</th>
                      <th className="px-6 py-3 text-left font-semibold">Designation</th>
                      <th className="px-6 py-3 text-center font-semibold">Days worked</th>
                      <th className="px-6 py-3 text-center font-semibold">Total hours</th>
                      <th className="px-6 py-3 text-center font-semibold">Total leave</th>
                      <th className="px-6 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryByEmployee.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                          No employees found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      summaryByEmployee.map((emp, i) => (
                        <tr key={emp.employee_db_id} className="border-t border-gray-100 hover:bg-blue-50">
                          <td className="px-6 py-3 font-medium text-gray-700">{i + 1}</td>
                          <td className="px-6 py-3 text-gray-600">{emp.employee_id || "—"}</td>
                          <td className="px-6 py-3 font-semibold text-gray-900">{emp.employee_name || "—"}</td>
                          <td className="px-6 py-3 text-gray-600">{emp.department || "—"}</td>
                          <td className="px-6 py-3 text-gray-600">{emp.designation || "—"}</td>
                          <td className="px-6 py-3 text-center font-medium text-gray-900">{emp.workedDays ?? 0}</td>
                          <td className="px-6 py-3 text-center font-medium text-gray-900">{(emp.totalHours ?? 0).toFixed(1)}</td>
                          <td className="px-6 py-3 text-center font-medium text-gray-900">
                            {leaveTotalsMap?.[emp.employee_db_id] ?? 0}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setHistoryEmployeeDbId(emp.employee_db_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                            >
                              <FaHistory /> View history
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {historyEmployeeDbId && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Attendance history -{" "}
                        {records.find((r) => String(r.employee_db_id) === String(historyEmployeeDbId))?.employee_id || "—"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {from || "—"} → {to || "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHistoryEmployeeDbId(null)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <FaTimes /> Close
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">In</th>
                          <th className="px-4 py-3 text-left">Out</th>
                          <th className="px-4 py-3 text-left">Hours</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-left">Holidays</th>
                          <th className="px-4 py-3 text-left">Day Off</th>
                          <th className="px-4 py-3 text-left">Leave</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRecords.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                              No attendance rows found for this employee in the selected duration.
                            </td>
                          </tr>
                        ) : (
                          historyRecords.map((r, idx) => (
                            <tr key={`${r.date}-${idx}`} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-700">{r.date || "—"}</td>
                              <td className="px-4 py-3 text-gray-700">{r.inTime || "—"}</td>
                              <td className="px-4 py-3 text-gray-700">{r.outTime || "—"}</td>
                              <td className="px-4 py-3 text-gray-700">{r.workingHours || "—"}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{r.status || "—"}</td>
                              <td className="px-4 py-3 text-gray-700">{r.holidays ?? "—"}</td>
                              <td className="px-4 py-3 text-gray-700">{r.dayOff ?? "—"}</td>
                              <td className="px-4 py-3 text-gray-700">{r.leave ?? "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistoryReport;

