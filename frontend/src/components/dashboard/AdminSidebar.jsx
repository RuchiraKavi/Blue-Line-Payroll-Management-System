import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import SidebarGroup, {
  SidebarAccordionProvider,
  SidebarSubLink,
} from "./SidebarGroup.jsx";
import {
  FaBuilding,
  FaCalendarCheck,
  FaClipboardList,
  FaTachometerAlt,
  FaUser,
  FaUserShield,
  FaWallet,
} from "react-icons/fa";

const topLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer whitespace-nowrap
   hover:bg-gray-800 transition-all duration-200
   ${isActive ? "bg-gray-800" : ""}`;

const AdminSidebar = () => {
  const { user } = useAuth();
  const role = user?.role;
  const isHR = role === "hr" || role === "hr_manager";
  const isAccount =
    role === "account" || role === "account_manager" || role === "accountant";
  const isAdminOrHR = role === "admin" || isHR;

  const accordionGroups = useMemo(() => {
    const groups = [];

    if (isAdminOrHR) {
      groups.push(
        {
          id: "departments",
          paths: [
            "/admin-dashboard/departments",
            "/admin-dashboard/add-department",
            "/admin-dashboard/designations",
            "/admin-dashboard/add-designation",
            "/admin-dashboard/assign-designation",
          ],
        },
        {
          id: "employees",
          paths: [
            "/admin-dashboard/employees",
            "/admin-dashboard/add-employee",
          ],
        },
        {
          id: "leave",
          paths: [
            "/admin-dashboard/leaves",
            "/admin-dashboard/leaves-report",
            "/admin-dashboard/employees/leaves",
          ],
        },
        {
          id: "attendance",
          paths: [
            "/admin-dashboard/attendance",
            "/admin-dashboard/attendance-report",
          ],
        },
        {
          id: "roles",
          paths: [
            "/admin-dashboard/roles",
            "/admin-dashboard/roles/add",
            "/admin-dashboard/role-management",
            "/admin-dashboard/add-role",
          ],
        }
      );
    }

    if (role === "admin" || isHR || isAccount) {
      groups.push({
        id: "finance",
        paths: [
          "/admin-dashboard/salary",
          "/admin-dashboard/advance-requests",
        ],
      });
    }

    return groups;
  }, [role, isAdminOrHR, isHR, isAccount]);

  return (
    <div className="h-screen bg-gray-900 text-white w-80 shrink-0 flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800 shrink-0">
        <h3 className="text-2xl font-bold tracking-wide">Blue Line MS</h3>
      </div>

      {/* Navigation */}
      <SidebarAccordionProvider groups={accordionGroups}>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          {(role === "admin" || isHR || isAccount) && (
            <NavLink to="/admin-dashboard" end className={topLinkClass}>
              <FaTachometerAlt className="text-lg" />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* Department Management */}
          {isAdminOrHR && (
            <SidebarGroup
              groupId="departments"
              title="Department"
              icon={FaBuilding}
              paths={[
                "/admin-dashboard/departments",
                "/admin-dashboard/add-department",
                "/admin-dashboard/designations",
                "/admin-dashboard/add-designation",
              ]}
            >
              <SidebarSubLink to="/admin-dashboard/departments">
                Department List
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/add-department" end>
                Add Department
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/designations" end>
                Designation List
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/add-designation" end>
                Add Designation
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/assign-designation" end>
                Assign Designation
              </SidebarSubLink>
            </SidebarGroup>
          )}

          {/* Employee Management */}
          {isAdminOrHR && (
            <SidebarGroup
              groupId="employees"
              title="Employee"
              icon={FaUser}
              paths={[
                "/admin-dashboard/employees",
                "/admin-dashboard/add-employee",
              ]}
            >
              <SidebarSubLink to="/admin-dashboard/employees">
                Employee List
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/add-employee" end>
                Add Employee
              </SidebarSubLink>
            </SidebarGroup>
          )}

          {/* Leave Management */}
          {isAdminOrHR && (
            <SidebarGroup
              groupId="leave"
              title="Leave"
              icon={FaClipboardList}
              paths={[
                "/admin-dashboard/leaves",
                "/admin-dashboard/leaves-report",
                "/admin-dashboard/employees/leaves",
              ]}
            >
              <SidebarSubLink to="/admin-dashboard/leaves">
                Leave Request
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/leaves-report" end>
                Leave Reports
              </SidebarSubLink>
            </SidebarGroup>
          )}

          {/* Attendance Management */}
          {isAdminOrHR && (
            <SidebarGroup
              groupId="attendance"
              title="Attendance"
              icon={FaCalendarCheck}
              paths={[
                "/admin-dashboard/attendance",
                "/admin-dashboard/attendance-report",
              ]}
            >
              <SidebarSubLink to="/admin-dashboard/attendance" end>
                Attendance
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/attendance-report" end>
                Attendance Report
              </SidebarSubLink>
            </SidebarGroup>
          )}

          {/* Finance Management */}
          {(role === "admin" || isHR || isAccount) && (
            <SidebarGroup
              groupId="finance"
              title="Finance"
              icon={FaWallet}
              paths={[
                "/admin-dashboard/salary",
                "/admin-dashboard/advance-requests",
              ]}
            >
              {(role === "admin" || isHR || isAccount) && (
                <SidebarSubLink to="/admin-dashboard/salary" end>
                  Salary
                </SidebarSubLink>
              )}
              {(role === "admin" || isAccount) && (
                <SidebarSubLink to="/admin-dashboard/advance-requests" end>
                  Advance Request
                </SidebarSubLink>
              )}
            </SidebarGroup>
          )}

          {/* Role Management */}
          {isAdminOrHR && (
            <SidebarGroup
              groupId="roles"
              title="Role"
              icon={FaUserShield}
              paths={[
                "/admin-dashboard/roles",
                "/admin-dashboard/roles/add",
                "/admin-dashboard/role-management",
                "/admin-dashboard/add-role",
              ]}
            >
              <SidebarSubLink to="/admin-dashboard/roles" end>
                Role List
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/role-management" end>
                Assign Role
              </SidebarSubLink>
              <SidebarSubLink to="/admin-dashboard/add-role" end>
                Add Role
              </SidebarSubLink>
            </SidebarGroup>
          )}
        </div>
      </SidebarAccordionProvider>
    </div>
  );
};

export default AdminSidebar;
