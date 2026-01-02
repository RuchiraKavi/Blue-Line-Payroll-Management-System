import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";

const LeaveList = ({ employeeId, isAdminView = false }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [leaves, setLeaves] = useState([]);

  const targetId = employeeId || user?._id;

  useEffect(() => {
    if (!targetId) return;

    const fetchLeaves = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/leaves/user/${targetId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setLeaves(response.data.leaves);
        }
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || "Failed to load leaves");
      }
    };

    fetchLeaves();
  }, [targetId]);

  const filteredLeaves = leaves.filter((leave) =>
    leave.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5">
      <div className="text-center mb-5">
        <h3 className="text-2xl font-bold">
          {isAdminView ? "Employee Leave History" : "Manage Leaves"}
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by status"
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

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Serial.No</th>
              <th className="px-4 py-3 text-left">Leave Type</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-left">Applied Date</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave, index) => (
                <tr
                  key={leave._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {leave.leaveType}
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
                  <td className="px-4 py-3">
                    {leave.reason}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        leave.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : leave.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-10 text-center text-gray-500"
                >
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
