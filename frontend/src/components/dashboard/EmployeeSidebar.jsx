import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaCalendar,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";

const EmployeeSidebar = () => {
  return (
    <div className="h-screen bg-gray-900 text-white w-80 shrink-0 flex flex-col shadow-lg">

      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-gray-800 px-6">
        <h3 className="text-2xl font-bold leading-none tracking-wide">Blue Line MS</h3>
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

        {/* Salary */}
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

        {/* Request Advance */}
          <NavLink
            to="/employee-dashboard/request-advance"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer 
               hover:bg-gray-800 transition-all 
               ${isActive ? "bg-gray-800" : ""}`
            }
          >
            <FaHandHoldingUsd className="text-lg" />
            <span>Request Advance</span>
          </NavLink>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
