import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import LeaveList from "./LeaveList.jsx";

const EmployeeLeaveHistory = () => {
  const { employeeId } = useParams();
  const location = useLocation();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [isIntern, setIsIntern] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/employees/${employeeId}/leave-balance`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (res.data.success) {
          setIsIntern(Boolean(res.data.isIntern));
          setLeaveBalance(res.data.leaveBalance);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load leave balance");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveBalance();
  }, [employeeId, location.search]); // Refetch when location.search changes (refresh param)

  if (loading) {
    return <div className="text-center p-6">Loading leave balance...</div>;
  }

  return (
    <div className="p-6 space-y-8">

{/* ✅ LEAVE BALANCE TABLE */}
<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
    🗂️ Leave Balance
  </h3>

  <div className="overflow-x-auto">
    <table className="min-w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100 text-gray-700">
          <th className="px-4 py-3 text-left font-medium">Leave Type</th>
          <th className="px-4 py-3 text-center font-medium">Total</th>
          <th className="px-4 py-3 text-center font-medium">Remaining</th>
          <th className="px-4 py-3 text-center font-medium">Usage</th>
        </tr>
      </thead>

      <tbody>
        {leaveBalance &&
          (isIntern
            ? [
                {
                  type: "half_day",
                  label: "Half Day (this month)",
                  balance: leaveBalance.half_day ?? leaveBalance.casual ?? 0,
                  total: 0.5,
                  icon: "🕐",
                  bar: "bg-indigo-500",
                  badge: "bg-indigo-100 text-indigo-700",
                },
              ]
            : ["casual", "annual", "sick"].map((type) => ({
                type,
                label: `${type.charAt(0).toUpperCase() + type.slice(1)} Leave`,
                balance: leaveBalance[type] ?? 0,
                total: { casual: 7, annual: 14, sick: 21 }[type],
                icon: { casual: "🏖️", annual: "📅", sick: "🤒" }[type],
                bar: { casual: "bg-blue-500", annual: "bg-green-500", sick: "bg-red-500" }[type],
                badge: {
                  casual: "bg-blue-100 text-blue-700",
                  annual: "bg-green-100 text-green-700",
                  sick: "bg-red-100 text-red-700",
                }[type],
              }))
          ).map(({ type, label, balance, total, icon, bar, badge }) => {
            const used = Math.max(0, total - balance);
            const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;

            return (
              <tr
                key={type}
                className="border-b last:border-none hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${badge}`}
                  >
                    {icon} {label}
                  </span>
                </td>

                <td className="px-4 py-3 text-center font-medium">{total}</td>

                <td className="px-4 py-3 text-center font-semibold text-gray-800">
                  {balance}
                </td>

                <td className="px-4 py-3">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${bar}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-center">
                    {used} used / {total}
                  </p>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  </div>
</div>


      {/* ✅ REUSED LEAVE LIST */}
      <LeaveList employeeId={employeeId} isAdminView />

    </div>
  );
};

export default EmployeeLeaveHistory;
