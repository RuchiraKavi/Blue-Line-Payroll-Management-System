import axios from "axios";
import { jsPDF } from "jspdf";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaHistory, FaTimes } from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/** PDF of the summary table currently shown (same filters: date range + employee search). */
const downloadAttendanceHistorySummaryPdf = ({ summaryRows, leaveTotalsMap, from, to, employeeQuery }) => {
  if (!Array.isArray(summaryRows) || summaryRows.length === 0) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const tableW = pageW - 2 * margin;
  const colWeights = [8, 24, 42, 36, 36, 22, 22, 22];
  const wSum = colWeights.reduce((a, b) => a + b, 0);
  const w = colWeights.map((c) => (c / wSum) * tableW);
  const rowH = 6;
  let y = 12;

  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text("Attendance History Report", pageW / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Date range: ${from || "—"}  -  ${to || "—"}`, margin, y);
  y += 5;
  const q = (employeeQuery || "").trim();
  if (q) {
    doc.text(`Employee filter: ${q}`, margin, y);
    y += 5;
  }
  y += 3;

  const headers = ["S.No", "Employee ID", "Name", "Department", "Designation", "Days worked", "Total hours", "Total leave"];

  const drawTableHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, tableW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(h, x + w[i] / 2, y + 4.2, { align: "center" });
      x += w[i];
    });
    y += rowH;
    doc.setFont("helvetica", "normal");
  };

  drawTableHeader();

  summaryRows.forEach((emp, idx) => {
    if (y + rowH > pageH - 10) {
      doc.addPage("landscape");
      y = 12;
      drawTableHeader();
    }
    doc.setFontSize(7);
    let x = margin;
    const cells = [
      String(idx + 1),
      emp.employee_id || "—",
      emp.employee_name || "—",
      emp.department || "—",
      emp.designation || "—",
      String(emp.workedDays ?? 0),
      (Number(emp.totalHours) || 0).toFixed(1),
      String(leaveTotalsMap?.[emp.employee_db_id] ?? 0),
    ];
    cells.forEach((cell, i) => {
      const raw = String(cell);
      const display = raw.length > 42 ? `${raw.slice(0, 39)}…` : raw;
      if (i >= 5) {
        doc.text(display, x + w[i] / 2, y + 4.2, { align: "center", maxWidth: w[i] - 2 });
      } else {
        doc.text(display, x + 1.5, y + 4.2, { maxWidth: w[i] - 3 });
      }
      x += w[i];
    });
    y += rowH;
  });

  const safeFrom = (from || "start").replaceAll("-", "_");
  const safeTo = (to || "end").replaceAll("-", "_");
  doc.save(`attendance_history_report_${safeFrom}_to_${safeTo}.pdf`);
};

const monthLabelFromKey = (key) =>
  new Date(`${key}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

/**
 * PDF matching the View history modal: monthly summary and filtered detail rows (incl. optional extra columns).
 */
const downloadEmployeeHistoryModalPdf = ({
  employeeName,
  employeeId,
  historyFrom,
  historyTo,
  historyShowExtraColumns,
  monthlySummary,
  filteredRows,
}) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const tableW = pageW - 2 * margin;
  const rowH = 5.5;
  let y = 11;

  const newPage = () => {
    doc.addPage("landscape");
    y = 11;
  };

  const need = (h) => {
    if (y + h > pageH - 10) {
      newPage();
    }
  };

  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  const title = `Attendance history — ${employeeName || "Employee"} (${employeeId || "—"})`;
  doc.text(title, pageW / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Date range: ${historyFrom || "—"}  -  ${historyTo || "—"}`, margin, y);
  y += 6;
  doc.setTextColor(0, 0, 0);

  /* ----- Summary by month ----- */
  if (Array.isArray(monthlySummary) && monthlySummary.length > 0) {
    need(rowH + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Summary by month", margin, y);
    y += 5;
    const mw = [0.4, 0.2, 0.2, 0.2].map((p) => p * tableW);
    const drawMonthHeader = () => {
      need(rowH + 2);
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y, tableW, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      let x = margin;
      ["Month", "Worked days", "Total hours", "Total leave"].forEach((h, i) => {
        const align = i === 0 ? "left" : "right";
        const tx = i === 0 ? x + 2 : x + mw[i] - 2;
        doc.text(h, tx, y + 3.8, { align });
        x += mw[i];
      });
      y += rowH;
      doc.setFont("helvetica", "normal");
    };
    drawMonthHeader();
    monthlySummary.forEach((row) => {
      need(rowH + 1);
      doc.setFontSize(7);
      let x = margin;
      const cells = [
        monthLabelFromKey(row.month),
        String(row.workedDays ?? 0),
        (Number(row.totalHours) || 0).toFixed(1),
        String(row.totalLeave ?? 0),
      ];
      cells.forEach((cell, i) => {
        const txt = String(cell).length > 28 ? `${String(cell).slice(0, 25)}…` : String(cell);
        if (i === 0) doc.text(txt, x + 2, y + 3.8, { maxWidth: mw[i] - 4 });
        else doc.text(txt, x + mw[i] - 2, y + 3.8, { align: "right" });
        x += mw[i];
      });
      y += rowH;
    });
    need(rowH + 2);
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, tableW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    let x = margin;
    const tWorked = monthlySummary.reduce((s, r) => s + (r.workedDays || 0), 0);
    const tHours = monthlySummary.reduce((s, r) => s + (Number(r.totalHours) || 0), 0);
    const tLeave = monthlySummary.reduce((s, r) => s + (Number(r.totalLeave) || 0), 0);
    doc.text("Total", x + 2, y + 3.8);
    doc.text(String(tWorked), x + mw[0] + mw[1] - 2, y + 3.8, { align: "right" });
    doc.text(tHours.toFixed(1), x + mw[0] + mw[1] + mw[2] - 2, y + 3.8, { align: "right" });
    doc.text(String(tLeave), x + tableW - 2, y + 3.8, { align: "right" });
    y += rowH + 5;
    doc.setFont("helvetica", "normal");
  }

  /* ----- Detail table (filtered) ----- */
  need(rowH + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Attendance records", margin, y);
  y += 5;

  const extra = historyShowExtraColumns;
  const headers = extra
    ? ["Date", "In Time", "Out Time", "Hours", "Status", "Holidays", "Day off", "Leave"]
    : ["Date", "In Time", "Out Time", "Hours", "Status"];
  const weights = extra
    ? [22, 18, 18, 14, 16, 12, 12, 12]
    : [26, 22, 22, 18, 22];
  const wSum = weights.reduce((a, b) => a + b, 0);
  const dw = weights.map((c) => (c / wSum) * tableW);

  const drawDetailHeader = () => {
    need(rowH + 2);
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, tableW, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    let x = margin;
    headers.forEach((h, i) => {
      const center = i === 4; // Status
      doc.text(h, center ? x + dw[i] / 2 : x + 1.5, y + 3.8, {
        align: center ? "center" : "left",
        maxWidth: dw[i] - 2,
      });
      x += dw[i];
    });
    y += rowH;
    doc.setFont("helvetica", "normal");
  };

  drawDetailHeader();

  if (!filteredRows.length) {
    need(rowH + 2);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("No records match the filter", margin + 2, y + 4);
    y += rowH + 2;
  } else {
    filteredRows.forEach((r) => {
      if (y + rowH > pageH - 10) {
        newPage();
        drawDetailHeader();
      }
      doc.setFontSize(6.5);
      doc.setTextColor(0, 0, 0);
      let x = margin;
      const dateStr = r.date ? new Date(r.date).toLocaleDateString() : "—";
      const cells = extra
        ? [
            dateStr,
            r.inTime || "—",
            r.outTime || "—",
            r.workingHours || "—",
            r.status || "—",
            String(r.holidays != null ? r.holidays : 0),
            String(r.dayOff != null ? r.dayOff : 0),
            String(r.leave != null ? r.leave : 0),
          ]
        : [dateStr, r.inTime || "—", r.outTime || "—", r.workingHours || "—", r.status || "—"];
      cells.forEach((cell, i) => {
        const raw = String(cell);
        const txt = raw.length > 22 ? `${raw.slice(0, 19)}…` : raw;
        if (i === 4) {
          doc.text(txt, x + dw[i] / 2, y + 3.8, { align: "center", maxWidth: dw[i] - 1 });
        } else if (i > 4) {
          doc.text(txt, x + dw[i] - 1.5, y + 3.8, { align: "right", maxWidth: dw[i] - 2 });
        } else {
          doc.text(txt, x + 1.2, y + 3.8, { maxWidth: dw[i] - 2 });
        }
        x += dw[i];
      });
      y += rowH;
    });
  }

  const safeId = String(employeeId || "emp").replace(/[^\w-]+/g, "_");
  const safeFrom = (historyFrom || "start").replaceAll("-", "_");
  const safeTo = (historyTo || "end").replaceAll("-", "_");
  doc.save(`attendance_history_${safeId}_${safeFrom}_to_${safeTo}.pdf`);
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

/** Days of a leave that fall within a given month (YYYY-MM) — same as Attendance page. */
const leaveDaysInMonth = (leave, monthKey) => {
  const [y, m] = monthKey.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0);
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  if (end < monthStart || start > monthEnd) return 0;
  const overlapStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
  const overlapEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()));
  return Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1);
};

/** Local calendar month bounds as YYYY-MM-DD (for default report range). */
const getCurrentMonthDateRange = () => {
  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
  };
};

const AttendanceHistoryReport = () => {
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [from, setFrom] = useState(() => getCurrentMonthDateRange().from);
  const [to, setTo] = useState(() => getCurrentMonthDateRange().to);

  const [employeeQuery, setEmployeeQuery] = useState(""); // Employee ID or name
  const [employeeQueryDebounced, setEmployeeQueryDebounced] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]); // flattened rows for all employees

  const [leaveTotalsMap, setLeaveTotalsMap] = useState({}); // keyed by Employee ObjectId

  /* View history modal — same behavior as Attendance page “All employees” table */
  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLeaves, setHistoryLeaves] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyMonthFilter, setHistoryMonthFilter] = useState("all");
  const [historyShowExtraColumns, setHistoryShowExtraColumns] = useState(false);

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

  const closeHistory = useCallback(() => {
    setHistoryEmployee(null);
    setHistoryRecords([]);
    setHistoryLeaves([]);
    setHistoryFrom("");
    setHistoryTo("");
    setHistoryStatusFilter("all");
    setHistoryMonthFilter("all");
  }, []);

  const openHistory = useCallback(async (emp, rangeFrom, rangeTo) => {
    if (!emp?._id) return;
    setHistoryEmployee(emp);
    setHistoryRecords([]);
    setHistoryLeaves([]);
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      if (rangeFrom) params.set("from", rangeFrom);
      if (rangeTo) params.set("to", rangeTo);
      const [attendanceRes, leavesRes] = await Promise.all([
        axios.get(
          `${API_BASE}/attendance/employee/${emp._id}${params.toString() ? `?${params.toString()}` : ""}`,
          { headers: getAuthHeader() }
        ),
        axios.get(`${API_BASE}/leaves/employee/${emp._id}`, { headers: getAuthHeader() }),
      ]);
      if (attendanceRes.data?.success) {
        setHistoryRecords(attendanceRes.data.attendance || []);
        if (attendanceRes.data.from) setHistoryFrom(attendanceRes.data.from);
        if (attendanceRes.data.to) setHistoryTo(attendanceRes.data.to);
      }
      if (leavesRes.data?.success && Array.isArray(leavesRes.data.leaves)) {
        const approved = (leavesRes.data.leaves || []).filter(
          (l) => (l.status || "").toLowerCase() === "approved"
        );
        setHistoryLeaves(approved);
      }
    } catch (err) {
      console.error(err);
      setHistoryRecords([]);
      setHistoryLeaves([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshHistory = useCallback(() => {
    if (historyEmployee) openHistory(historyEmployee, historyFrom || undefined, historyTo || undefined);
  }, [historyEmployee, historyFrom, historyTo, openHistory]);

  const generateReport = async (employeesToFetch) => {
    if (!Array.isArray(employeesToFetch) || employeesToFetch.length === 0) {
      setRecords([]);
      setLeaveTotalsMap({});
      closeHistory();
      return;
    }
    setLoading(true);
    setError("");
    setRecords([]);
    closeHistory();
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
    const { from: f, to: t } = getCurrentMonthDateRange();
    setFrom(f);
    setTo(t);
    setEmployeeQuery("");
    setEmployeeQueryDebounced("");
    setRecords([]);
    setLeaveTotalsMap({});
    closeHistory();
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

  const monthlySummary = useMemo(() => {
    const byMonth = {};
    (historyRecords || []).forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { month: key, workedDays: 0, totalHours: 0, totalLeave: 0 };
      if (r.status === "Present") {
        byMonth[key].workedDays += 1;
        byMonth[key].totalHours += parseWorkingHours(r.workingHours);
      }
    });
    (historyLeaves || []).forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      let year = start.getFullYear();
      let month = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      while (year < endYear || (year === endYear && month <= endMonth)) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        if (!byMonth[key]) byMonth[key] = { month: key, workedDays: 0, totalHours: 0, totalLeave: 0 };
        byMonth[key].totalLeave += leaveDaysInMonth(leave, key);
        if (month === 11) {
          year += 1;
          month = 0;
        } else {
          month += 1;
        }
      }
    });
    return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));
  }, [historyRecords, historyLeaves]);

  const availableMonths = useMemo(() => {
    const set = new Set();
    (historyRecords || []).forEach((r) => {
      const d = new Date(r.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [historyRecords]);

  const filteredHistoryRows = useMemo(() => {
    let list = historyRecords || [];
    if (historyStatusFilter !== "all") {
      list = list.filter((r) => r.status === historyStatusFilter);
    }
    if (historyMonthFilter !== "all") {
      list = list.filter((r) => {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === historyMonthFilter;
      });
    }
    return list;
  }, [historyRecords, historyStatusFilter, historyMonthFilter]);

  const handleExportHistoryPdf = useCallback(() => {
    if (!historyEmployee || historyLoading) return;
    downloadEmployeeHistoryModalPdf({
      employeeName: historyEmployee.userId?.name || "Employee",
      employeeId: historyEmployee.employee_id,
      historyFrom,
      historyTo,
      historyShowExtraColumns,
      monthlySummary,
      filteredRows: filteredHistoryRows,
    });
  }, [
    historyEmployee,
    historyLoading,
    historyFrom,
    historyTo,
    historyShowExtraColumns,
    monthlySummary,
    filteredHistoryRows,
  ]);

  const handleExport = () => {
    downloadAttendanceHistorySummaryPdf({
      summaryRows: summaryByEmployee,
      leaveTotalsMap,
      from,
      to,
      employeeQuery,
    });
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
      } catch {
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
          <p className="text-sm text-gray-600 mt-1">
            Summary for the selected period and employee filter. Export PDF matches the table below.
          </p>
        </div>
        <div className="flex items-center gap-2">
        <button
            type="button"
            onClick={handleExport}
            disabled={loading || summaryByEmployee.length === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export PDF
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
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                    Generating attendance history…
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                    {to ? "No attendance records found for the selected filters." : "Select a date range to load the report."}
                  </td>
                </tr>
              ) : summaryByEmployee.length === 0 ? (
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
                        onClick={() => {
                          const full = employeesForReport.find((e) => String(e._id) === String(emp.employee_db_id));
                          if (full) openHistory(full);
                        }}
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
      </div>

      {historyEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeHistory}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50 shrink-0 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">
                Attendance history — {historyEmployee.userId?.name || "Employee"} ({historyEmployee.employee_id})
              </h3>
              <button type="button" onClick={closeHistory} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600" aria-label="Close">
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="p-6 overflow-hidden flex flex-col flex-1 min-h-0 bg-white">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm font-medium text-gray-700">Date range:</span>
                <input
                  type="date"
                  value={historyFrom}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={historyTo}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={refreshHistory}
                  disabled={historyLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {historyLoading ? "Loading…" : "Apply"}
                </button>
                <button
                  type="button"
                  onClick={handleExportHistoryPdf}
                  disabled={historyLoading || historyRecords.length === 0}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export PDF
                </button>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : (
                <>
                  {monthlySummary.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-800 mb-2">Summary by month</h4>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold">Month</th>
                              <th className="px-4 py-2 text-right font-semibold">Worked days</th>
                              <th className="px-4 py-2 text-right font-semibold">Total hours</th>
                              <th className="px-4 py-2 text-right font-semibold">Total leave</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlySummary.map((row) => (
                              <tr key={row.month} className="border-t border-gray-100">
                                <td className="px-4 py-2 font-medium text-gray-900">
                                  {new Date(row.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </td>
                                <td className="px-4 py-2 text-right">{row.workedDays}</td>
                                <td className="px-4 py-2 text-right">{(Number(row.totalHours) || 0).toFixed(1)}</td>
                                <td className="px-4 py-2 text-right">{row.totalLeave ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                            <tr className="font-bold text-gray-900">
                              <td className="px-4 py-2">Total</td>
                              <td className="px-4 py-2 text-right">
                                {monthlySummary.reduce((s, row) => s + (row.workedDays || 0), 0)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {monthlySummary.reduce((s, row) => s + (Number(row.totalHours) || 0), 0).toFixed(1)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {monthlySummary.reduce((s, row) => s + (Number(row.totalLeave) || 0), 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                    <select
                      value={historyStatusFilter}
                      onChange={(e) => setHistoryStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All status</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                    <select
                      value={historyMonthFilter}
                      onChange={(e) => setHistoryMonthFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All months</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {new Date(m + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={historyShowExtraColumns}
                        onChange={(e) => setHistoryShowExtraColumns(e.target.checked)}
                        className="w-4 h-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Show extra columns (Holidays, Day off, Leave)</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      Showing {filteredHistoryRows.length} of {historyRecords.length} records
                    </span>
                  </div>

                  <div className="flex-1 min-h-0 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1 min-h-0">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-gray-700 uppercase text-xs sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                          <th className="px-4 py-3 text-left font-semibold">In Time</th>
                          <th className="px-4 py-3 text-left font-semibold">Out Time</th>
                          <th className="px-4 py-3 text-left font-semibold">Hours</th>
                          <th className="px-4 py-3 text-center font-semibold">Status</th>
                          {historyShowExtraColumns && (
                            <>
                              <th className="px-4 py-3 text-right font-semibold">Holidays</th>
                              <th className="px-4 py-3 text-right font-semibold">Day off</th>
                              <th className="px-4 py-3 text-right font-semibold">Leave</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistoryRows.length === 0 ? (
                          <tr>
                            <td colSpan={historyShowExtraColumns ? 8 : 5} className="px-4 py-8 text-center text-gray-500">
                              No records match the filter
                            </td>
                          </tr>
                        ) : (
                          filteredHistoryRows.map((r) => (
                            <tr key={r._id || `${r.date}-${r.inTime}`} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
                              <td className="px-4 py-2">{r.inTime || "—"}</td>
                              <td className="px-4 py-2">{r.outTime || "—"}</td>
                              <td className="px-4 py-2">{r.workingHours || "—"}</td>
                              <td className="px-4 py-2 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                    r.status === "Present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {r.status || "—"}
                                </span>
                              </td>
                              {historyShowExtraColumns && (
                                <>
                                  <td className="px-4 py-2 text-right">{r.holidays != null ? r.holidays : 0}</td>
                                  <td className="px-4 py-2 text-right">{r.dayOff != null ? r.dayOff : 0}</td>
                                  <td className="px-4 py-2 text-right">{r.leave != null ? r.leave : 0}</td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistoryReport;

