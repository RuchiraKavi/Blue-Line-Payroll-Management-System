import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";

const LeaveBalance = () => {
  const { user } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        if (!user?._id) {
          setLoading(false);
          return;
        }

        // We need to get the employee ID first
        const employeeRes = await axios.get(
          "http://localhost:5000/api/employees/me/profile",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (employeeRes.data.success && employeeRes.data.employee?._id) {
          const balanceRes = await axios.get(
            `http://localhost:5000/api/leaves/employees/${employeeRes.data.employee._id}/leave-balance`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (balanceRes.data.success) {
            setLeaveBalance(balanceRes.data.leaveBalance);
          }
        }
      } catch (error) {
        console.error("Error fetching leave balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveBalance();
  }, [user?._id]);

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
        <p className="text-center text-gray-500">Loading leave balance...</p>
      </div>
    );
  }

  if (!leaveBalance) {
    return null;
  }

  const balanceData = [
    {
      type: "casual",
      label: "Casual Leaves",
      icon: "🏖️",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      badgeBg: "bg-blue-100",
      textColor: "text-blue-700",
    },
    {
      type: "annual",
      label: "Annual Leaves",
      icon: "📅",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      badgeBg: "bg-green-100",
      textColor: "text-green-700",
    },
    {
      type: "sick",
      label: "Sick Leaves",
      icon: "🤒",
      bgColor: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      badgeBg: "bg-red-100",
      textColor: "text-red-700",
    },
  ];

  return (
    <div className="mb-6 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
      <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-purple-900">
        ✨ Your Leave Balance
      </h4>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balanceData.map(
          ({ type, label, icon, bgColor, borderColor, badgeBg, textColor }) => (
            <div
              key={type}
              className={`group rounded-lg border ${borderColor} bg-gradient-to-br ${bgColor} p-4 shadow-sm transition hover:shadow-md`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${badgeBg} text-2xl`}>
                  {icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className={`text-3xl font-bold ${textColor}`}>
                    {leaveBalance[type] || 0}
                    <span className="text-base font-medium text-gray-500 ml-1">
                      {leaveBalance[type] === 1 ? "day" : "days"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LeaveBalance;
