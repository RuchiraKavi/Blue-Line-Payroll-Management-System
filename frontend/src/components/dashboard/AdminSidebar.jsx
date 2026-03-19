import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  FaBuilding,
  FaCalendar,
  FaCogs,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaUser,
  FaFileAlt,
} from "react-icons/fa";

const AdminSidebar = () => {
  // 🔐 Get role from auth context (secure method)
  const { user } = useAuth();
  const role = user?.role;
  // Normalize role aliases for checks
  const isHR = role === "hr" || role === "hr_manager";
  const isAccount = role === "account" || role === "account_manager" || role === "accountant";

  return (
    <div className="h-screen bg-gray-900 text-white w-64 flex flex-col shadow-lg">

      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-2xl font-bold tracking-wide">Blue Line MS</h3>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">

        {/* Dashboard → Admin, HR, Account */}
        {(role === "admin" || isHR || isAccount) && (
          <NavLink
            to="/admin-dashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaTachometerAlt className="text-lg" />
            <span>Dashboard</span>
          </NavLink>
        )}

        {/* Employees → Admin, HR */}
        {(role === "admin" || isHR) && (
          <NavLink
            to="/admin-dashboard/employees"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaUser className="text-lg" />
            <span>Employees</span>
          </NavLink>
        )}

        {/* Departments → Admin, HR */}
        {(role === "admin" || isHR) && (
          <NavLink
            to="/admin-dashboard/departments"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaBuilding className="text-lg" />
            <span>Departments</span>
          </NavLink>
        )}

        {/* Leave → Admin, HR */}
        {(role === "admin" || isHR) && (
          <NavLink
            to="/admin-dashboard/leaves"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaCalendar className="text-lg" />
            <span>Leave Requests</span>
          </NavLink>
        )}

        {/* Leave Reports → Admin, HR */}
        {(role === "admin" || isHR) && (
          <NavLink
            to="/admin-dashboard/leaves-report"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaFileAlt className="text-lg" />
            <span>Leave Reports</span>
          </NavLink>
        )}

        {/* Salary → Admin & Accountant only */}
        {(role === "admin" || isAccount) && (
          <NavLink
            to="/admin-dashboard/salary"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaMoneyBillWave className="text-lg" />
            <span>Salary</span>
          </NavLink>
        )}

        {/* Advance requests → Admin, HR, Account */}
        {(role === "admin" || isAccount) && (
          <NavLink
            to="/admin-dashboard/advance-requests"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaHandHoldingUsd className="text-lg" />
            <span>Advance Requests</span>
          </NavLink>
        )}

        {/* Attendance → Admin, HR */}
        {(role === "admin" || isHR) && (
          <NavLink
            to="/admin-dashboard/attendance"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaCalendar className="text-lg" />
            <span>Attendance</span>
          </NavLink>
        )}

        {/* Attendance Reports → Admin, HR */}
        {(role === "admin" || isHR) && (
          <NavLink
            to="/admin-dashboard/attendance-report"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaFileAlt className="text-lg" />
            <span>Attendance Reports</span>
          </NavLink>
        )}

      </div>
    </div>
  );
};

export default AdminSidebar;
