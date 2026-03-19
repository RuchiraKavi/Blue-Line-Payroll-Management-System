import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { FaHistory, FaTimes, FaUser } from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/** Parse workingHours string to decimal hours: "8.5" → 8.5, "8:30" → 8.5 */
function parseWorkingHours(value) {
  if (value == null || value === "") return 0;
  const s = String(value).trim();
  if (s.includes(":")) {
    const [h, m] = s.split(":");
    return (parseFloat(h) || 0) + (parseFloat(m) || 0) / 60;
  }
  return parseFloat(s) || 0;
}

const AttendanceList = () => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const currentMonthTo = now.toISOString().slice(0, 10);

  const [file, setFile] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  // Default: current month (to-date). Backend will use from/to when month matches currentMonthKey.
  const [summaryMonth, setSummaryMonth] = useState(currentMonthKey);
  const [leaveTotalsMap, setLeaveTotalsMap] = useState({});
  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLeaves, setHistoryLeaves] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyMonthFilter, setHistoryMonthFilter] = useState("all");
  const [showExtraColumns, setShowExtraColumns] = useState(false);

  /* =========================
     Fetch Attendance (MEMOIZED)
  ========================== */
  const fetchAttendance = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/attendance?date=${date}`,
        { headers: getAuthHeader() }
      );

      if (res.data.success) {
        setAttendance(res.data.attendance || []);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load attendance");
      setAttendance([]);
    }
  }, [date]);

  /* =========================
     Fetch All Employees
  ========================== */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const res = await axios.get(`${API_BASE}/employees`, { headers: getAuthHeader() });
        if (res.data.success && res.data.employees) {
          setEmployees(res.data.employees);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.error(err);
        setEmployees([]);
      } finally {
        setEmployeesLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  /* =========================
     Fetch Attendance Summary (for All Employees table)
  ========================== */
  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const params = new URLSearchParams();
        if (summaryMonth) {
          if (summaryMonth === currentMonthKey) {
            params.set("from", currentMonthFrom);
            params.set("to", currentMonthTo);
          } else {
            params.set("month", summaryMonth);
          }
        }
        const res = await axios.get(`${API_BASE}/attendance/summary?${params}`, { headers: getAuthHeader() });
        if (cancelled) return;
        if (res.data.success && Array.isArray(res.data.summary)) {
          setSummaryData(res.data.summary);
        } else {
          setSummaryData([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setSummaryData([]);
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };
    fetchSummary();
    return () => { cancelled = true; };
  }, [summaryMonth]);

  /* Fetch total leave days per employee (for All Employees table) */
  useEffect(() => {
    let cancelled = false;
    const fetchLeaveTotals = async () => {
      try {
        const params = new URLSearchParams();
        if (summaryMonth) {
          if (summaryMonth === currentMonthKey) {
            params.set("from", currentMonthFrom);
            params.set("to", currentMonthTo);
          } else {
            params.set("month", summaryMonth);
          }
        }
        const res = await axios.get(`${API_BASE}/leaves/total-days-by-employee?${params}`, { headers: getAuthHeader() });
        if (cancelled) return;
        if (res.data.success && Array.isArray(res.data.data)) {
          const map = {};
          (res.data.data || []).forEach((o) => {
            map[o.employeeId] = o.totalLeaveDays ?? 0;
          });
          setLeaveTotalsMap(map);
        } else {
          setLeaveTotalsMap({});
        }
      } catch (err) {
        if (!cancelled) setLeaveTotalsMap({});
      }
    };
    fetchLeaveTotals();
    return () => { cancelled = true; };
  }, [summaryMonth]);

  const summaryMap = React.useMemo(() => {
    const m = {};
    (summaryData || []).forEach((s) => {
      const rawId = s.employeeId ?? s._id;
      const id = rawId != null ? String(rawId) : "";
      if (!id) return;
      m[id] = { workedDays: s.workedDays ?? 0, absentDays: s.absentDays ?? 0, totalHours: s.totalHours ?? 0 };
    });
    return m;
  }, [summaryData]);

  const employeesWithStats = React.useMemo(() => {
    return (employees || []).map((emp) => {
      const id = emp._id != null ? String(emp._id) : "";
      const stats = summaryMap[id] ?? { workedDays: 0, absentDays: 0, totalHours: 0 };
      const totalLeave = leaveTotalsMap[id] ?? 0;
      return { ...emp, ...stats, totalLeave };
    });
  }, [employees, summaryMap, leaveTotalsMap]);

  /* =========================
     Initial Load & Date Change
  ========================== */
  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      await fetchAttendance();
      setLoading(false);
    };
    loadAttendance();
  }, [fetchAttendance]);

  /* =========================
     Open / Fetch Employee Attendance History
  ========================== */
  const openHistory = useCallback(async (emp, from, to) => {
    setHistoryEmployee(emp);
    setHistoryRecords([]);
    setHistoryLeaves([]);
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const [attendanceRes, leavesRes] = await Promise.all([
        axios.get(
          `${API_BASE}/attendance/employee/${emp._id}${params.toString() ? `?${params.toString()}` : ""}`,
          { headers: getAuthHeader() }
        ),
        axios.get(`${API_BASE}/leaves/employee/${emp._id}`, { headers: getAuthHeader() }),
      ]);
      if (attendanceRes.data.success) {
        setHistoryRecords(attendanceRes.data.attendance || []);
        if (attendanceRes.data.from) setHistoryFrom(attendanceRes.data.from);
        if (attendanceRes.data.to) setHistoryTo(attendanceRes.data.to);
      }
      if (leavesRes.data.success && Array.isArray(leavesRes.data.leaves)) {
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

  const closeHistory = () => {
    setHistoryEmployee(null);
    setHistoryRecords([]);
    setHistoryLeaves([]);
    setHistoryFrom("");
    setHistoryTo("");
    setHistoryStatusFilter("all");
    setHistoryMonthFilter("all");
  };

  /* Days of a leave that fall within a given month (YYYY-MM) */
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

  /* Per-month summary: worked days/hours from attendance; total leave from approved Leave requests */
  const monthlySummary = React.useMemo(() => {
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

  const availableMonths = React.useMemo(() => {
    const set = new Set();
    (historyRecords || []).forEach((r) => {
      const d = new Date(r.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [historyRecords]);

  const filteredRecords = React.useMemo(() => {
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

  const refreshHistory = () => {
    if (historyEmployee) openHistory(historyEmployee, historyFrom || undefined, historyTo || undefined);
  };

  /* =========================
     Upload CSV
  ========================== */
  const handleUpload = async () => {
    if (!file) {
      alert("Select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/attendance/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Attendance uploaded successfully");
      setFile(null);
      await fetchAttendance();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Analytics
  ========================== */
  const totalEmployees = attendance.length;
  const presentCount = attendance.filter((a) => a.status !== "Absent" && a.status !== "Day Off").length;
  const absentCount = totalEmployees - presentCount;

  const chartData = [
    { name: "Present", value: presentCount },
    { name: "Absent / Day Off", value: absentCount },
  ];

  const COLORS = ["#4CAF50", "#FF5252"]; // green for present, red for absent

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Attendance Management
          </h1>
          <p className="text-gray-600 text-lg">Track and manage employee attendance records</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Employees */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-gray-400 to-gray-600 text-white text-2xl shadow-lg">
              👥
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-700">
                {totalEmployees}
              </p>
            </div>
          </div>
        </div>

        {/* Present */}
        <div className="bg-white rounded-xl border-2 border-green-200 p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-green-400 to-green-600 text-white text-2xl shadow-lg">
              ✅
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-3xl font-bold text-green-700">
                {presentCount}
              </p>
            </div>
          </div>
        </div>

        {/* Absent / Day Off */}
        <div className="bg-white rounded-xl border-2 border-red-200 p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-red-400 to-red-600 text-white text-2xl shadow-lg">
              ❌
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Absent / Day Off</p>
              <p className="text-3xl font-bold text-red-700">
                {absentCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8 p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
          </svg>
          Attendance Overview
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Controls Section */}
        <div className="bg-linear-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Date Picker */}
            <div className="relative w-full lg:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md w-full lg:w-64"
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="w-full lg:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-all file:duration-200 cursor-pointer border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="group relative overflow-hidden px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    Upload CSV
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
              </div>
              {file && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {file.name}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Enhanced Table Section */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading attendance records...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{attendance.length}</span> attendance records
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showExtraColumns}
                    onChange={(e) => setShowExtraColumns(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show extra columns (Holidays, Day off, Leave)</span>
                </label>
              </div>

              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">S.No</th>
                      <th className="px-6 py-4 text-left font-semibold">Employee ID</th>
                      <th className="px-6 py-4 text-left font-semibold">Employee Name</th>
                      <th className="px-6 py-4 text-left font-semibold">Date</th>
                      <th className="px-6 py-4 text-left font-semibold">In Time</th>
                      <th className="px-6 py-4 text-left font-semibold">Out Time</th>
                      <th className="px-6 py-4 text-left font-semibold">Hours</th>
                      <th className="px-6 py-4 text-center font-semibold">Status</th>
                      {showExtraColumns && (
                        <>
                          <th className="px-6 py-4 text-right font-semibold">Holidays</th>
                          <th className="px-6 py-4 text-right font-semibold">Day off</th>
                          <th className="px-6 py-4 text-right font-semibold">Leave</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length > 0 ? (
                      attendance.map((a, index) => (
                        <tr key={a._id || `${a.employeeId}-${a.date}`} className="border-t border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-6 py-4 font-medium text-gray-700">{index + 1}</td>
                          <td className="px-6 py-4 text-gray-600">{a.employee_id}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{a.employeeName}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(a.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{a.inTime || "-"}</td>
                          <td className="px-6 py-4 text-gray-600">{a.outTime || "-"}</td>
                          <td className="px-6 py-4 text-gray-600 font-medium">{a.workingHours || "-"}</td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                                a.status === "Absent" || a.status === "Day Off"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {a.status === "Absent" || a.status === "Day Off"
                                ? "Day Off"
                                : "Present"}
                            </span>
                          </td>
                          {showExtraColumns && (
                            <>
                              <td className="px-6 py-4 text-right text-gray-600">{a.holidays != null ? a.holidays : 0}</td>
                              <td className="px-6 py-4 text-right text-gray-600">{a.dayOff != null ? a.dayOff : 0}</td>
                              <td className="px-6 py-4 text-right text-gray-600">{a.leave != null ? a.leave : 0}</td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={showExtraColumns ? 11 : 8} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-500 mb-2">No attendance records found</h3>
                            <p className="text-gray-400 mb-6">Try selecting a different date or upload attendance data</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>

      {/* All Employees Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-8">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaUser className="text-blue-600" />
            All Employees
          </h3>
          <p className="text-sm text-gray-600 mt-1">View attendance history and days worked per employee. Use the month filter to narrow by month.</p>
        </div>
        <div className="p-8">
          {/* Filters for All Employees table */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-sm font-medium text-gray-700">Month:</span>
            <select
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                return <option key={val} value={val}>{label}</option>;
              })}
            </select>
            <button
              type="button"
              onClick={() => setSummaryMonth(currentMonthKey)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset to current month
            </button>
            <span className="text-sm text-gray-600">
              {summaryMonth === currentMonthKey
                ? `Showing: ${new Date(summaryMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })} (to date)`
                : `Showing: ${new Date(summaryMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
            </span>
            {summaryLoading && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                Loading summary…
              </span>
            )}
          </div>

          {employeesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
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
                  {employeesWithStats.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No employees found</td>
                    </tr>
                  ) : (
                    employeesWithStats.map((emp, i) => (
                      <tr key={emp._id} className="border-t border-gray-100 hover:bg-blue-50">
                        <td className="px-6 py-3 font-medium text-gray-700">{i + 1}</td>
                        <td className="px-6 py-3 text-gray-600">{emp.employee_id}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900">{emp.userId?.name || "—"}</td>
                        <td className="px-6 py-3 text-gray-600">{emp.department?.dep_name || "—"}</td>
                        <td className="px-6 py-3 text-gray-600">{emp.designation || "—"}</td>
                        <td className="px-6 py-3 text-center font-medium text-gray-900">{emp.workedDays ?? 0}</td>
                        <td className="px-6 py-3 text-center font-medium text-gray-900">{(emp.totalHours ?? 0).toFixed(1)}</td>
                        <td className="px-6 py-3 text-center font-medium text-gray-900">{emp.totalLeave ?? 0}</td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => openHistory(emp)}
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
          )}
        </div>
      </div>

      {/* Attendance History Modal */}
      {historyEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeHistory}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between bg-blue-50">
              <h3 className="text-lg font-bold text-gray-900">
                Attendance history — {historyEmployee.userId?.name || "Employee"} ({historyEmployee.employee_id})
              </h3>
              <button onClick={closeHistory} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600" aria-label="Close">
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="p-6 overflow-hidden flex flex-col flex-1 min-h-0">
              {/* Date range */}
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
                  onClick={refreshHistory}
                  disabled={historyLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {historyLoading ? "Loading…" : "Apply"}
                </button>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : (
                <>
                  {/* Summary by month: total working hours & worked days (parsed from workingHours e.g. "8:30" → 8.5) */}
                  {monthlySummary.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-800 mb-2">Summary by month</h4>
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
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
                  )}

                  {/* Filters for history table */}
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
                    <span className="text-xs text-gray-500">
                      Showing {filteredRecords.length} of {historyRecords.length} records
                    </span>
                  </div>

                  <div className="overflow-auto flex-1 border border-gray-200 rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-gray-700 uppercase text-xs sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Date</th>
                          <th className="px-4 py-3 text-left font-semibold">In Time</th>
                          <th className="px-4 py-3 text-left font-semibold">Out Time</th>
                          <th className="px-4 py-3 text-left font-semibold">Hours</th>
                          <th className="px-4 py-3 text-center font-semibold">Status</th>
                          {showExtraColumns && (
                            <>
                              <th className="px-4 py-3 text-right font-semibold">Holidays</th>
                              <th className="px-4 py-3 text-right font-semibold">Day off</th>
                              <th className="px-4 py-3 text-right font-semibold">Leave</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={showExtraColumns ? 8 : 5} className="px-4 py-8 text-center text-gray-500">
                              No records match the filter
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((r) => (
                            <tr key={r._id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
                              <td className="px-4 py-2">{r.inTime || "—"}</td>
                              <td className="px-4 py-2">{r.outTime || "—"}</td>
                              <td className="px-4 py-2">{r.workingHours || "—"}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${r.status === "Present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                  {r.status || "—"}
                                </span>
                              </td>
                              {showExtraColumns && (
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>  
  );
};

export default AttendanceList;
