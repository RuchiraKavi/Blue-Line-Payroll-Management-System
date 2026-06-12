import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaHeartbeat,
  FaUmbrellaBeach,
  FaClipboardList,
  FaUser,
  FaFileAlt,
  FaMoneyBillWave,
  FaChevronRight,
  FaIdBadge,
  FaClock,
} from "react-icons/fa";
import {
  INTERN_MONTHLY_LEAVE_DAYS,
  isInternEmployee,
  isInternRole,
} from "../../utils/internPayroll.js";

const LEAVE_TOTALS = { casual: 7, annual: 14, sick: 21 };

const INTERN_HALF_DAY_META = {
  label: "Half Day Leave",
  icon: FaClock,
  iconBg: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20",
  bar: "bg-indigo-500",
  value: "text-indigo-700",
  card: "border-indigo-100/80",
  gradient: "from-indigo-50/90 via-white to-violet-50/40",
  ring: "#6366f1",
  ringTrack: "#e0e7ff",
  pill: "bg-indigo-50 text-indigo-700",
};

const LEAVE_TYPES = {
  casual: {
    label: "Casual Leave",
    icon: FaUmbrellaBeach,
    iconBg: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
    bar: "bg-blue-500",
    value: "text-blue-700",
    card: "border-blue-100/80",
    gradient: "from-blue-50/90 via-white to-sky-50/40",
    ring: "#3b82f6",
    ringTrack: "#dbeafe",
    pill: "bg-blue-50 text-blue-700",
  },
  annual: {
    label: "Annual Leave",
    icon: FaCalendarAlt,
    iconBg: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    bar: "bg-emerald-500",
    value: "text-emerald-700",
    card: "border-emerald-100/80",
    gradient: "from-emerald-50/90 via-white to-green-50/40",
    ring: "#10b981",
    ringTrack: "#d1fae5",
    pill: "bg-emerald-50 text-emerald-700",
  },
  sick: {
    label: "Sick Leave",
    icon: FaHeartbeat,
    iconBg: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
    bar: "bg-rose-500",
    value: "text-rose-700",
    card: "border-rose-100/80",
    gradient: "from-rose-50/90 via-white to-red-50/40",
    ring: "#f43f5e",
    ringTrack: "#ffe4e6",
    pill: "bg-rose-50 text-rose-700",
  },
};

const LEAVE_TYPE_LABELS = {
  casual: "Casual Leave",
  annual: "Annual Leave",
  sick: "Sick Leave",
  nopay: "No Pay",
};

const formatShortDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const PAGE_H = "h-full min-h-0";

const EmployeeSummary = () => {
  const { user } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [isIntern, setIsIntern] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [pendingLeaveList, setPendingLeaveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const userId = user?._id || user?.id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const employeeRes = await axios.get("http://localhost:5000/api/employees/me/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!employeeRes.data.success || !employeeRes.data.employee) {
          setError(employeeRes.data.message || "Employee profile not found");
          return;
        }

        const emp = employeeRes.data.employee;
        setEmployee(emp);
        const employeeId = emp._id;

        const balanceRes = await axios.get(
          `http://localhost:5000/api/leaves/employees/${employeeId}/leave-balance`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        const internUser =
          Boolean(balanceRes.data?.isIntern) ||
          isInternEmployee(emp) ||
          isInternRole(user?.role);
        setIsIntern(internUser);

        if (balanceRes.data.success) {
          setLeaveBalance(balanceRes.data.leaveBalance);
        } else if (internUser) {
          setLeaveBalance({ half_day: 0, casual: 0, annual: 0, sick: 0 });
        } else {
          setLeaveBalance({ casual: 0, annual: 0, sick: 0 });
        }

        const leavesRes = await axios.get(`http://localhost:5000/api/leaves/user/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (leavesRes.data.success) {
          const pending = leavesRes.data.leaves.filter((l) => l.status === "Pending");
          setPendingLeaveList(pending);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load dashboard. Please refresh or contact HR."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id, user?.id]);

  if (loading) {
    return (
      <div className={`${PAGE_H} flex items-center justify-center`}>
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className={`${PAGE_H} flex items-center justify-center p-6`}>
        <div className="max-w-md text-center rounded-2xl border border-red-200 bg-red-50 p-8">
          <p className="font-semibold text-red-700 mb-2">Failed to load dashboard</p>
          <p className="text-sm text-red-600">
            {error || "Your employee profile could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  const balance = leaveBalance || { casual: 0, annual: 0, sick: 0, half_day: 0 };
  const halfDayAvailable = balance.half_day ?? balance.casual ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const profileImage = employee.userId?.profileImage;
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`${PAGE_H} grid grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden`}
    >
      {/* Row 1 — Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative flex h-full flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-2 ring-white/30">
              {profileImage ? (
                <img
                  src={`http://localhost:5000/uploads/${profileImage}`}
                  alt={employee.userId?.name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaUser className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-blue-100">{greeting}</p>
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{employee.userId?.name}</h1>
              <p className="truncate text-sm text-blue-100/90">
                {[employee.department?.dep_name, employee.designation].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <div className="rounded-xl bg-white/10 px-3 py-2.5 text-right text-xs text-blue-50 ring-1 ring-white/20 sm:px-4">
              <p className="flex items-center justify-end gap-1 font-medium">
                <FaIdBadge className="h-3 w-3" /> {employee.employee_id}
              </p>
              <p className="mt-0.5 text-blue-100/80">{dateStr}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Row 2 — Leave balance (fills half of remaining space) */}
      <section className="flex min-h-0 flex-col gap-2">
        <div className="flex shrink-0 items-center justify-between px-0.5">
          <h2 className="text-sm font-bold text-gray-800">Your leave balance</h2>
          <Link
            to="/employee-dashboard/leave"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Full history <FaChevronRight className="h-2.5 w-2.5" />
          </Link>
        </div>
        {isIntern ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 max-w-md">
            <InternHalfDayBalanceCard available={halfDayAvailable} />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            {(["casual", "annual", "sick"]).map((type) => (
              <LeaveBalanceCard
                key={type}
                type={type}
                remaining={balance[type] ?? 0}
                total={LEAVE_TOTALS[type]}
              />
            ))}
          </div>
        )}
      </section>

      {/* Row 3 — Pending + shortcuts (fills other half) */}
      <section className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-5">
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm md:col-span-2">
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <FaClipboardList className="h-4 w-4 text-amber-600" />
              </span>
              Pending requests
            </h2>
            <span
              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${
                pendingLeaveList.length > 0 ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {pendingLeaveList.length}
            </span>
          </div>
          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {pendingLeaveList.length > 0 ? (
              pendingLeaveList.map((leave) => (
                <PendingLeaveCard key={leave._id} leave={leave} isIntern={isIntern} />
              ))
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center">
                <FaClipboardList className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No pending requests</p>
              </div>
            )}
          </div>
          <Link
            to="/employee-dashboard/leave"
            className="mt-auto inline-flex w-fit shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View requests <FaChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:col-span-3">
          <h2 className="mb-3 shrink-0 text-sm font-bold text-gray-800">Quick shortcuts</h2>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            <ActionTile to="/employee-dashboard/request-leave" icon={FaFileAlt} label="Request leave" primary />
            <ActionTile to="/employee-dashboard/leave" icon={FaCalendarAlt} label="Leave history" />
            <ActionTile to="/employee-dashboard/salary" icon={FaMoneyBillWave} label="My salary" />
            <ActionTile to="/employee-dashboard/profile" icon={FaUser} label="My profile" />
          </div>
        </div>
      </section>
    </div>
  );
};

function PendingLeaveCard({ leave, isIntern = false }) {
  const typeKey = leave.leaveType in LEAVE_TYPES ? leave.leaveType : null;
  const meta = typeKey
    ? LEAVE_TYPES[typeKey]
    : { icon: FaFileAlt, iconBg: "bg-gray-100 text-gray-600", card: "border-gray-200" };
  const Icon = meta.icon;
  const label =
    isIntern && leave.leaveType === "casual"
      ? "Half Day Leave"
      : LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType;

  return (
    <div className={`flex shrink-0 items-start gap-3 rounded-xl border bg-white p-3 shadow-sm ${meta.card}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-gray-800">{label}</p>
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-700">
            Pending
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatShortDate(leave.startDate)} – {formatShortDate(leave.endDate)}
        </p>
        <p className="mt-1 text-xs font-medium text-gray-600">
          {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

function ProgressRing({ percent, color, trackColor, size = 96, stroke = 8, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function InternHalfDayBalanceCard({ available }) {
  const meta = INTERN_HALF_DAY_META;
  const Icon = meta.icon;
  const total = INTERN_MONTHLY_LEAVE_DAYS;
  const remaining = available >= total ? total : 0;
  const used = total - remaining;
  const remainingPct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;
  const statusLabel = available >= total ? "Available" : "Used this month";

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-linear-to-br p-4 shadow-sm transition-shadow hover:shadow-md ${meta.card} ${meta.gradient}`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-40 blur-2xl"
        style={{ backgroundColor: meta.ringTrack }}
      />

      <div className="relative flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.iconBg}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="truncate text-sm font-semibold text-gray-800">{meta.label}</p>
            <p className="text-xs text-gray-500">One half-day per calendar month</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${meta.pill}`}>
          {statusLabel}
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-3">
        <ProgressRing percent={remainingPct} color={meta.ring} trackColor={meta.ringTrack}>
          <span className={`text-2xl font-bold leading-none tabular-nums ${meta.value}`}>
            {available >= total ? "½" : "—"}
          </span>
          <span className="mt-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-gray-400">day</span>
        </ProgressRing>
      </div>

      <div className="relative shrink-0 space-y-2.5">
        <div className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-black/5">
          <div className="flex h-full">
            <div className={`${meta.bar} transition-all duration-500`} style={{ width: `${usedPct}%` }} />
            <div className="flex-1 bg-transparent" />
          </div>
        </div>
        <p className="text-center text-xs text-gray-600">
          Longer absences should be requested as <span className="font-semibold">No Pay</span>.
        </p>
      </div>
    </div>
  );
}

function LeaveBalanceCard({ type, remaining, total }) {
  const meta = LEAVE_TYPES[type];
  const Icon = meta.icon;
  const used = Math.max(0, total - remaining);
  const remainingPct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-linear-to-br p-4 shadow-sm transition-shadow hover:shadow-md ${meta.card} ${meta.gradient}`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-40 blur-2xl"
        style={{ backgroundColor: meta.ringTrack }}
      />

      <div className="relative flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.iconBg}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="truncate text-sm font-semibold text-gray-800">{meta.label}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold tabular-nums ${meta.pill}`}>
          {remainingPct}% left
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-3">
        <ProgressRing percent={remainingPct} color={meta.ring} trackColor={meta.ringTrack}>
          <span className={`text-3xl font-bold leading-none tabular-nums ${meta.value}`}>{remaining}</span>
          <span className="mt-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-gray-400">days</span>
        </ProgressRing>
      </div>

      <div className="relative shrink-0 space-y-2.5">
        <div className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-black/5">
          <div className="flex h-full">
            <div
              className={`${meta.bar} transition-all duration-500`}
              style={{ width: `${usedPct}%` }}
            />
            <div className="flex-1 bg-transparent" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-lg bg-white/70 px-1 py-1.5 ring-1 ring-black/5">
            <p className="text-[0.6rem] font-medium uppercase tracking-wide text-gray-400">Used</p>
            <p className="text-sm font-bold tabular-nums text-gray-700">{used}</p>
          </div>
          <div className={`rounded-lg px-1 py-1.5 ring-1 ring-black/5 ${meta.pill}`}>
            <p className="text-[0.6rem] font-medium uppercase tracking-wide opacity-70">Left</p>
            <p className="text-sm font-bold tabular-nums">{remaining}</p>
          </div>
          <div className="rounded-lg bg-white/70 px-1 py-1.5 ring-1 ring-black/5">
            <p className="text-[0.6rem] font-medium uppercase tracking-wide text-gray-400">Total</p>
            <p className="text-sm font-bold tabular-nums text-gray-700">{total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionTile({ to, icon: Icon, label, primary = false }) {
  return (
    <Link
      to={to}
      className={`group flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center transition-all ${
        primary
          ? "bg-blue-600 text-white shadow-md shadow-blue-200/50 hover:bg-blue-700"
          : "border border-gray-200 bg-gray-50 text-gray-800 hover:border-blue-200 hover:bg-blue-50"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
          primary ? "bg-white/20" : "bg-white shadow-sm"
        }`}
      >
        <Icon className={`h-5 w-5 ${primary ? "text-white" : "text-blue-600"}`} />
      </span>
      <span className="text-xs font-semibold leading-tight sm:text-sm">{label}</span>
    </Link>
  );
}

export default EmployeeSummary;
