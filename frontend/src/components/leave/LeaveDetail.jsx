import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const LeaveDetail = () => {
  const { id } = useParams(); // leave ID from route
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false); // to handle button state

  useEffect(() => {
    const fetchLeave = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/leaves/detail/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setLeave(response.data.leave);
        }
      } catch (error) {
        console.error(error);
        alert("Leave Loading Error");
      } finally {
        setLoading(false);
      }
    };

    fetchLeave();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave?`)) return;

    try {
      setUpdating(true);
      const response = await axios.put(
        `http://localhost:5000/api/leaves/${id}`, // your backend update route
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        alert(`Leave ${status} successfully!`);
        navigate("/admin-dashboard/leaves"); // redirect to leaves page
      } else {
        alert("Failed to update leave status.");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating leave status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700 font-semibold">
        Loading Leave Details...
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500 font-semibold">
        Leave not found!
      </div>
    );
  }

  // Calculate number of days safely
  const start = leave.startDate ? new Date(leave.startDate) : null;
  const end = leave.endDate ? new Date(leave.endDate) : null;
  let days = 0;
  if (start && end && !isNaN(start) && !isNaN(end)) {
    days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex justify-center items-start md:items-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-left">
          <h2 className="text-3xl font-bold mb-1">
            {leave.employeeId?.userId?.name || "N/A"}
          </h2>
          <p className="text-sm opacity-80">
            Status:{" "}
            <span
              className={`px-2 py-1 rounded ${
                leave.status === "Approved"
                  ? "bg-green-100 text-green-700"
                  : leave.status === "Rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {leave.status}
            </span>
          </p>
        </div>

        {/* Employee Image */}
        <div className="flex justify-center -mt-16">
          <img
            src={
              leave.employeeId?.userId?.profileImage
                ? `http://localhost:5000/uploads/${leave.employeeId.userId.profileImage}`
                : `https://via.placeholder.com/150`
            }
            alt="Employee"
            className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>

        {/* Leave Details */}
        <div className="p-6 space-y-6">
          <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-center">
            Leave Details
          </h3>

          <div className="flex flex-col gap-3 text-left pl-6">
            <p><b>Employee Name:</b> {leave.employeeId?.userId?.name || "N/A"}</p>
            <p><b>Department:</b> {leave.employeeId?.department?.dep_name || "N/A"}</p>
            <p><b>Leave Type:</b> {leave.leaveType}</p>
            <p><b>Days:</b> {days}</p>
            <p><b>Start Date:</b> {leave.startDate?.slice(0, 10)}</p>
            <p><b>End Date:</b> {leave.endDate?.slice(0, 10)}</p>
            <p className="md:col-span-2"><b>Reason:</b> {leave.reason}</p>
            <p><b>Applied At:</b> {leave.appliedAt?.slice(0, 10)}</p>
          </div>

          {/* Approve / Reject Buttons */}
          {leave.status === "Pending" && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => handleStatusUpdate("Approved")}
                disabled={updating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate("Rejected")}
                disabled={updating}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveDetail;
