import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";

const EmployeeSummary = () => {
  const { user } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?._id) {
          setLoading(false);
          return;
        }

        // Fetch employee profile
        const employeeRes = await axios.get(
          "http://localhost:5000/api/employees/me/profile",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (employeeRes.data.success) {
          setEmployee(employeeRes.data.employee);

          const employeeId = employeeRes.data.employee._id;

          // Fetch leave balance
          const balanceRes = await axios.get(
            `http://localhost:5000/api/leaves/employees/${employeeId}/leave-balance`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (balanceRes.data.success) {
            setLeaveBalance(balanceRes.data.leaveBalance);
          }

          // Fetch leave history to count pending
          const leavesRes = await axios.get(
            `http://localhost:5000/api/leaves/user/${user._id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (leavesRes.data.success) {
            const pending = leavesRes.data.leaves.filter(
              (leave) => leave.status === "Pending"
            ).length;
            setPendingLeaves(pending);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!employee || !leaveBalance) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg font-semibold text-red-600">Failed to load data</div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {greeting}, {employee.userId?.name}! 👋
        </h1>
        <p className="text-gray-600">
          {employee.designation} at {employee.department?.dep_name}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Leave Balance Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Available</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">
                {leaveBalance.casual + leaveBalance.annual + leaveBalance.sick}
              </p>
              <p className="text-gray-500 text-xs mt-1">days remaining</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        {/* Casual Leaves */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Casual</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                {leaveBalance.casual}
              </p>
              <p className="text-gray-500 text-xs mt-1">days</p>
            </div>
            <div className="text-3xl">🏖️</div>
          </div>
        </div>

        {/* Annual Leaves */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Annual</p>
              <p className="text-2xl font-bold text-green-700 mt-2">
                {leaveBalance.annual}
              </p>
              <p className="text-gray-500 text-xs mt-1">days</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>

        {/* Sick Leaves */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-6 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Sick</p>
              <p className="text-2xl font-bold text-red-700 mt-2">
                {leaveBalance.sick}
              </p>
              <p className="text-gray-500 text-xs mt-1">days</p>
            </div>
            <div className="text-3xl">🤒</div>
          </div>
        </div>
      </div>

      {/* Pending Requests & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📋 Pending Requests</h2>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
              {pendingLeaves}
            </span>
          </div>
          {pendingLeaves > 0 ? (
            <p className="text-gray-600 text-sm mb-4">
              You have {pendingLeaves} pending leave request{pendingLeaves !== 1 ? "s" : ""}.
            </p>
          ) : (
            <p className="text-gray-600 text-sm mb-4">
              No pending leave requests.
            </p>
          )}
          <Link
            to="/employee-dashboard/leave"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all requests →
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link
              to="/employee-dashboard/request-leave"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center font-medium transition"
            >
              Request New Leave
            </Link>
            <Link
              to="/employee-dashboard/profile"
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-center font-medium transition"
            >
              View My Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSummary;
