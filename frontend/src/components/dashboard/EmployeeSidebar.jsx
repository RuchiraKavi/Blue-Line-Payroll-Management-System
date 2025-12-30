import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaBuilding,
  FaCalendar,
  FaCogs,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";

const EmployeeSidebar = () => {
  return (
    <div className="h-screen bg-gray-900 text-white w-64 flex flex-col shadow-lg">

      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-2xl font-bold tracking-wide">Blue Line MS</h3>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">

        {/* Dashboard → Admin, HR, Account */}
          <NavLink
            to="/employee-dashboard"
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


        {/* Employees → Admin, HR */}
          <NavLink
            to="/employee-dashboard/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaUser className="text-lg" />
            <span>My Profile</span>
          </NavLink>

        {/* Departments → Admin, HR */}
          <NavLink
            to="/employee-dashboard/leave"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaCalendar className="text-lg" />
            <span>Leaves</span>
          </NavLink>

        {/* Salary → Admin, HR, Account */}
          <NavLink
            to="/employee-dashboard/salary"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaMoneyBillWave className="text-lg" />
            <span>Salary</span>
          </NavLink>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
