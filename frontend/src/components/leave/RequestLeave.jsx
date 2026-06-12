import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DateInput from "../ui/DateInput.jsx";
import SelectInput from "../ui/SelectInput.jsx";
import {
  INTERN_MONTHLY_LEAVE_DAYS,
  isInternEmployee,
  isInternRole,
} from "../../utils/internPayroll.js";

const RequestLeave = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    half_day: 0,
  });
  const [isIntern, setIsIntern] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?._id) return;

    const fetchLeaveBalance = async () => {
      try {
        setBalanceLoading(true);
        setError("");

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
            const emp = employeeRes.data.employee;
            const internUser =
              Boolean(balanceRes.data.isIntern) ||
              isInternEmployee(emp) ||
              isInternRole(user?.role);
            setIsIntern(internUser);
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

  const isInternHalfDay = isIntern && leave.leaveType === "casual";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeave((prev) => {
      if (name === "leaveType") {
        return { ...prev, leaveType: value, startDate: "", endDate: "" };
      }
      const next = { ...prev, [name]: value };
      if (name === "startDate" && isIntern && prev.leaveType === "casual") {
        next.endDate = value;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leave.leaveType) {
      setError("Please select a leave type");
      return;
    }

    if (leave.leaveType !== "nopay") {
      if (isIntern) {
        const halfDayAvailable = leaveBalance.half_day ?? leaveBalance.casual ?? 0;
        if (halfDayAvailable < INTERN_MONTHLY_LEAVE_DAYS) {
          setError("Your half-day leave for this month has already been used or requested");
          return;
        }
      } else {
        const selectedLeaveBalance = leaveBalance[leave.leaveType] || 0;
        if (selectedLeaveBalance <= 0) {
          setError(`You do not have remaining balance for ${leave.leaveType} leave`);
          return;
        }
      }
    }

    const payload = { ...leave };
    if (isInternHalfDay) {
      if (!payload.startDate) {
        setError("Please select the date for your half-day leave");
        return;
      }
      payload.endDate = payload.startDate;
    } else {
      if (!payload.startDate || !payload.endDate) {
        setError("Please select both from and to dates");
        return;
      }
      if (payload.endDate < payload.startDate) {
        setError("End date cannot be before start date");
        return;
      }
    }

    if (payload.startDate < today) {
      setError("You cannot request leave for past dates");
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
        payload,
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

  const halfDayAvailable = leaveBalance.half_day ?? leaveBalance.casual ?? 0;
  const leaveTypeOptions = isIntern
    ? [
        { value: "", label: "-- Select Leave Type --" },
        {
          value: "casual",
          label: "Half Day Leave",
          disabled: halfDayAvailable < INTERN_MONTHLY_LEAVE_DAYS,
        },
        { value: "nopay", label: "No Pay" },
      ]
    : [
        { value: "", label: "-- Select Leave Type --" },
        {
          value: "casual",
          label: "Casual Leave",
          disabled: (leaveBalance.casual ?? 0) === 0,
        },
        {
          value: "annual",
          label: "Annual Leave",
          disabled: (leaveBalance.annual ?? 0) === 0,
        },
        {
          value: "sick",
          label: "Sick Leave",
          disabled: (leaveBalance.sick ?? 0) === 0,
        },
        { value: "nopay", label: "No Pay" },
      ];

  const hasRequiredDates = isInternHalfDay
    ? Boolean(leave.startDate)
    : Boolean(leave.startDate && leave.endDate);

  const canSubmit =
    leave.leaveType &&
    hasRequiredDates &&
    (leave.leaveType === "nopay" ||
      (isIntern
        ? halfDayAvailable >= INTERN_MONTHLY_LEAVE_DAYS
        : (leaveBalance[leave.leaveType] ?? 0) > 0));

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
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Your Leave Balance</h3>
            {isIntern ? (
              <div className="text-center">
                <p className="text-sm text-gray-600">Half-day leave (this month)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {halfDayAvailable >= INTERN_MONTHLY_LEAVE_DAYS ? "Available" : "Used"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Interns receive one half-day per calendar month. Longer absences use No Pay.
                </p>
              </div>
            ) : (
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
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <SelectInput
                name="leaveType"
                value={leave.leaveType}
                onChange={handleChange}
                required
                placeholder="-- Select Leave Type --"
                options={leaveTypeOptions}
              />

              {leave.leaveType === "casual" && !isIntern && (leaveBalance.casual ?? 0) === 0 && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  No remaining casual leave balance
                </p>
              )}
              {isIntern && leave.leaveType === "casual" && halfDayAvailable < INTERN_MONTHLY_LEAVE_DAYS && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  Half-day leave for this month is not available
                </p>
              )}
            </div>

            {leave.leaveType && (
              isInternHalfDay ? (
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <DateInput
                    name="startDate"
                    value={leave.startDate}
                    onChange={handleChange}
                    min={today}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Select the day you will take your half-day leave.
                  </p>
                </div>
              ) : (
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
              )
            )}

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
          </form>
        </>
      )}
    </div>
  );
};

export default RequestLeave;
