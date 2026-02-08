import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const AttendanceList = () => {
  const [file, setFile] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     Fetch Attendance (MEMOIZED)
  ========================== */
  const fetchAttendance = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/attendance?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
        "http://localhost:5000/api/attendance/upload",
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
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-20 text-center">
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
    </div>  
  );
};

export default AttendanceList;
