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
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-center">Attendance</h2>

      {/* Date Filter */}
      <div className="flex gap-4 items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Upload CSV
        </button>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">S.No</th>
                <th className="border p-2">Employee ID</th>
                <th className="border p-2">Employee Name</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">In Time</th>
                <th className="border p-2">Out Time</th>
                <th className="border p-2">Hours</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.map((a, index) => (
                  <tr key={a._id || `${a.employeeId}-${a.date}`}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{a.employee_id}</td>
                    <td className="border p-2">{a.employeeName}</td>
                    <td className="border p-2">
                      {new Date(a.date).toLocaleDateString()}
                    </td>
                    <td className="border p-2">{a.inTime || "-"}</td>
                    <td className="border p-2">{a.outTime || "-"}</td>
                    <td className="border p-2">{a.workingHours || "-"}</td>
                    <td className="border p-2 font-medium">
                      {a.status === "Absent" || a.status === "Day Off"
                        ? "Day Off"
                        : "Present"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center p-6 text-gray-500"
                  >
                    📭 No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

            {/* Analytics */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
        <div className="text-center bg-gray-100 p-4 rounded shadow">
          <h3 className="font-semibold">Total Employees</h3>
          <p className="text-xl">{totalEmployees}</p>
        </div>
        <div className="text-center bg-green-100 p-4 rounded shadow">
          <h3 className="font-semibold">Present</h3>
          <p className="text-xl">{presentCount}</p>
        </div>
        <div className="text-center bg-red-100 p-4 rounded shadow">
          <h3 className="font-semibold">Absent / Day Off</h3>
          <p className="text-xl">{absentCount}</p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="w-full h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
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
  );
};

export default AttendanceList;
