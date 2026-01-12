import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import LeaveBalance from "./LeaveBalance";

const LeaveList = ({ employeeId, isAdminView = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        let url = "";

        if (isAdminView && employeeId) {
          // ✅ Admin viewing specific employee
          url = `http://localhost:5000/api/leaves/employee/${employeeId}`;
        } else if (user?._id) {
          // ✅ Employee viewing own leaves
          url = `http://localhost:5000/api/leaves/user/${user._id}`;
        } else {
          setLoading(false);
          return;
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setLeaves(response.data.leaves || []);
        }
      } catch (error) {
        console.error(error);
        // Only show error if it's a real failure, not a "no leaves" case
        if (error.response?.status !== 404 || !error.response?.data?.message?.includes("leaves")) {
          alert(error.response?.data?.message || "Failed to load leaves");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [employeeId, isAdminView, user?._id, location.search]); // Refetch when location.search changes

  const filteredLeaves = leaves.filter((leave) =>
    leave.status.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate total days taken per type (approved leaves only)
  const calculateDaysTaken = () => {
    const taken = { casual: 0, annual: 0, sick: 0 };
    leaves.forEach((leave) => {
      if (leave.status === "Approved" && leave.leaveType in taken) {
        taken[leave.leaveType] += leave.totalDays;
      }
    });
    return taken;
  };

  const daysTaken = calculateDaysTaken();

  const formatLeaveType = (type) => {
    const map = {
      casual: "Casual Leave",
      annual: "Annual Leave",
      sick: "Sick Leave",
    };
    return map[type] || type;
  };

  const statusBadge = (status) => {
    if (!status) return "bg-gray-100 text-gray-700";
    const key = status.toString().toLowerCase().trim();
    const styles = {
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
    };

    if (key.includes("approved")) return styles.approved;
    if (key.includes("rejected")) return styles.rejected;
    if (key.includes("pending")) return styles.pending;

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-5">
      <div className="text-center mb-5">
        <h3 className="text-2xl font-semi-bold">
          {isAdminView ? "Leave History" : "Employee Leave History"}
        </h3>
      </div>

      {/* � LEAVE BALANCE - Only show for employee view */}
      {!isAdminView && !loading && <LeaveBalance />}

      {/* �📊 DAYS TAKEN SUMMARY */}
      {!loading && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-900">
            📊 Leaves Taken Summary
          </h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Casual Leaves */}
            <div className="group rounded-lg border border-blue-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  🏖️
                </div>
                <div>
                  <p className="text-sm text-gray-500">Casual Leaves</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {daysTaken.casual}
                    <span className="text-base font-medium text-gray-500"> days</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Annual Leaves */}
            <div className="group rounded-lg border border-green-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  📅
                </div>
                <div>
                  <p className="text-sm text-gray-500">Annual Leaves</p>
                  <p className="text-2xl font-bold text-green-700">
                    {daysTaken.annual}
                    <span className="text-base font-medium text-gray-500"> days</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Sick Leaves */}
            <div className="group rounded-lg border border-red-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  🤒
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sick Leaves</p>
                  <p className="text-2xl font-bold text-red-700">
                    {daysTaken.sick}
                    <span className="text-base font-medium text-gray-500"> days</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      )}

      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by status (Approved / Pending / Rejected)"
          className="px-4 py-2 border rounded w-full md:w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!isAdminView && (
          <Link
            to="/employee-dashboard/request-leave"
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-indigo-700 transition"
          >
            + Request Leave
          </Link>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Leave Type</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-left">Applied</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave, index) => (
                <tr key={leave._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatLeaveType(leave.leaveType)}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(leave.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(leave.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{leave.reason}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge(
                        leave.status
                      )}`}
                    >
                      {leave.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                  📭 No leave records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveList;
