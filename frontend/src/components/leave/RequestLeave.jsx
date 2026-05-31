import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DateInput from "../ui/DateInput.jsx";

const RequestLeave = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // 🔑 get logged-in user

  const today = new Date().toISOString().split("T")[0];

  const [leave, setLeave] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [leaveBalance, setLeaveBalance] = useState({
    casual: 0,
    annual: 0,
    sick: 0,
  });
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     Fetch Leave Balance
  ========================== */
  useEffect(() => {
    if (!user?._id) return;

    const fetchLeaveBalance = async () => {
      try {
        setBalanceLoading(true);
        setError("");

        // First, get the employee profile to get employee ID
        const employeeRes = await axios.get(
          "http://localhost:5000/api/employees/me/profile",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (employeeRes.data.success && employeeRes.data.employee?._id) {
          // Then, fetch leave balance using employee ID
          const balanceRes = await axios.get(
            `http://localhost:5000/api/leaves/employees/${employeeRes.data.employee._id}/leave-balance`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (balanceRes.data.success) {
            setLeaveBalance(balanceRes.data.leaveBalance || {});
          }
        }
      } catch (err) {
        console.error("Leave balance fetch failed", err);
        setError("Failed to load leave balance");
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchLeaveBalance();
  }, [user]);

  /* =========================
     Handle Change
  ========================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeave((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     Submit Leave Request
  ========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leave.leaveType) {
      setError("Please select a leave type");
      return;
    }

    // nopay has no balance check; paid types require balance
    if (leave.leaveType !== "nopay") {
      const selectedLeaveBalance = leaveBalance[leave.leaveType] || 0;
      if (selectedLeaveBalance <= 0) {
        setError(`You do not have remaining balance for ${leave.leaveType} leave`);
        return;
      }
    }

    if (leave.startDate < today) {
      setError("You cannot request leave for past dates");
      return;
    }

    if (leave.endDate < leave.startDate) {
      setError("End date cannot be before start date");
      return;
    }

    if (!leave.reason.trim()) {
      setError("Please provide a reason for your leave");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/leaves/request-leave",
        leave,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        alert("Leave requested successfully!");
        navigate("/employee-dashboard/leave");
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Error requesting leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Request For Leave
      </h2>

      {balanceLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading leave balance...</p>
        </div>
      ) : (
        <>
          {/* Leave Balance Summary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Your Leave Balance</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Casual</p>
                <p className="text-2xl font-bold text-blue-600">
                  {leaveBalance.casual ?? 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Annual</p>
                <p className="text-2xl font-bold text-green-600">
                  {leaveBalance.annual ?? 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Sick</p>
                <p className="text-2xl font-bold text-red-600">
                  {leaveBalance.sick ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Leave Type */}
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                name="leaveType"
                value={leave.leaveType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Leave Type --</option>

                <option
                  value="casual"
                  disabled={(leaveBalance.casual ?? 0) === 0}
                >
                  Casual Leave ({leaveBalance.casual ?? 0} days left)
                  {(leaveBalance.casual ?? 0) === 0 && " - No Balance"}
                </option>

                <option
                  value="annual"
                  disabled={(leaveBalance.annual ?? 0) === 0}
                >
                  Annual Leave ({leaveBalance.annual ?? 0} days left)
                  {(leaveBalance.annual ?? 0) === 0 && " - No Balance"}
                </option>

                <option
                  value="sick"
                  disabled={(leaveBalance.sick ?? 0) === 0}
                >
                  Sick Leave ({leaveBalance.sick ?? 0} days left)
                  {(leaveBalance.sick ?? 0) === 0 && " - No Balance"}
                </option>

                <option value="nopay">No Pay</option>
              </select>

              {leave.leaveType && leave.leaveType !== "nopay" && (leaveBalance[leave.leaveType] ?? 0) === 0 && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⚠️ No remaining balance for {leave.leaveType} leave
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  From Date <span className="text-red-500">*</span>
                </label>
                <DateInput
                  name="startDate"
                  value={leave.startDate}
                  onChange={handleChange}
                  min={today}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  To Date <span className="text-red-500">*</span>
                </label>
                <DateInput
                  name="endDate"
                  value={leave.endDate}
                  onChange={handleChange}
                  min={leave.startDate || today}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={leave.reason}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Please provide the reason for your leave request"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            {(() => {
              const canSubmit =
                leave.leaveType &&
                (leave.leaveType === "nopay" || (leaveBalance[leave.leaveType] ?? 0) > 0);
              return (
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className={`w-full font-medium py-2 rounded-lg transition ${
                    loading || !canSubmit
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Submitting..." : "Request Leave"}
                </button>
              );
            })()}
          </form>
        </>
      )}
    </div>
  );
};

export default RequestLeave;
