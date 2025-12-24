import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  FaBuilding,
  FaCalendar,
  FaCogs,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaUser,
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
            to="/admin-leave"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaCalendar className="text-lg" />
            <span>Leave</span>
          </NavLink>
        )}

        {/* Salary → Admin, HR, Account */}
        {(role === "admin" || isHR || isAccount) && (
          <NavLink
            to="/admin-salary"
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

        {/* Settings → Admin, HR, Account */}
        {(role === "admin" || isHR || isAccount) && (
          <NavLink
            to="/admin-settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaCogs className="text-lg" />
            <span>Settings</span>
          </NavLink>
        )}

      </div>
    </div>
  );
};

export default AdminSidebar;
