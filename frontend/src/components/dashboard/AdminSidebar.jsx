import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import usePermissions from "../../hooks/usePermissions.js";
import normalizeRole, { isFinanceRole } from "../../utils/normalizeRole.js";
import SidebarGroup, {
  SidebarAccordionProvider,
  SidebarSubLink,
} from "./SidebarGroup.jsx";
import {
  FaBuilding,
  FaCalendarCheck,
  FaClipboardList,
  FaIdBadge,
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
  const { canRead, can } = usePermissions();
  const role = normalizeRole(user?.role);
  const isHR = role === "hr";
  const isFinance = isFinanceRole(role);
  const isAdminOrHR = role === "admin" || isHR;

  const hasPermissionData = Boolean(
    user?.permissions &&
      Object.values(user.permissions).some((section) =>
        section && typeof section === "object"
          ? Object.values(section).some(Boolean)
          : false
      )
  );

  const sectionRead = (section, legacyFallback) =>
    hasPermissionData ? canRead(section) : legacyFallback;

  const sectionCan = (section, action, legacyFallback) =>
    hasPermissionData ? can(section, action) : legacyFallback;

  const showDashboard = sectionRead(
    "dashboard",
    role === "admin" || isHR || isFinance
  );
  const showDepartments = sectionRead("departments", isAdminOrHR);
  const showDesignations = sectionRead("designations", isAdminOrHR);
  const showEmployees = sectionRead("employees", isAdminOrHR);
  const showLeave = sectionRead("leave", isAdminOrHR);
  const showAttendance = sectionRead("attendance", isAdminOrHR);
  const showRoles = sectionRead("roles", isAdminOrHR);
  const showSalary = sectionRead("salary", role === "admin" || isHR || isFinance);
  const showAdvance = sectionRead("advance", role === "admin" || isFinance);
  const showFinance = showSalary || showAdvance;

  const accordionGroups = useMemo(() => {
    const groups = [];

    if (showDepartments) {
      groups.push({
        id: "departments",
        paths: [
          "/admin-dashboard/departments",
          "/admin-dashboard/add-department",
        ],
      });
    }

    if (showDesignations) {
      groups.push({
        id: "designations",
        paths: [
          "/admin-dashboard/designations",
          "/admin-dashboard/add-designation",
          "/admin-dashboard/assign-designation",
        ],
      });
    }

    if (showEmployees) {
      groups.push({
        id: "employees",
        paths: [
          "/admin-dashboard/employees",
          "/admin-dashboard/add-employee",
        ],
      });
    }

    if (showLeave) {
      groups.push({
        id: "leave",
        paths: [
          "/admin-dashboard/leaves",
          "/admin-dashboard/leaves-report",
          "/admin-dashboard/employees/leaves",
        ],
      });
    }

    if (showAttendance) {
      groups.push({
        id: "attendance",
        paths: [
          "/admin-dashboard/attendance",
          "/admin-dashboard/attendance-report",
        ],
      });
    }

    if (showRoles) {
      groups.push({
        id: "roles",
        paths: [
          "/admin-dashboard/roles",
          "/admin-dashboard/roles/add",
          "/admin-dashboard/role-management",
          "/admin-dashboard/add-role",
        ],
      });
    }

    if (showFinance) {
      groups.push({
        id: "finance",
        paths: [
          "/admin-dashboard/salary",
          "/admin-dashboard/advance-requests",
        ],
      });
    }

    return groups;
  }, [
    showDepartments,
    showDesignations,
    showEmployees,
    showLeave,
    showAttendance,
    showRoles,
    showFinance,
  ]);

  return (
    <div className="h-screen bg-gray-900 text-white w-80 shrink-0 flex flex-col shadow-lg">
      <div className="p-6 border-b border-gray-800 shrink-0">
        <h3 className="text-2xl font-bold tracking-wide">Blue Line MS</h3>
      </div>

      <SidebarAccordionProvider groups={accordionGroups}>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {showDashboard && (
            <NavLink to="/admin-dashboard" end className={topLinkClass}>
              <FaTachometerAlt className="text-lg" />
              <span>Dashboard</span>
            </NavLink>
          )}

          {showDepartments && (
            <SidebarGroup
              groupId="departments"
              title="Department"
              icon={FaBuilding}
              paths={[
                "/admin-dashboard/departments",
                "/admin-dashboard/add-department",
              ]}
            >
              <SidebarSubLink to="/admin-dashboard/departments">
                Department List
              </SidebarSubLink>
              {sectionCan("departments", "create", isAdminOrHR) && (
                <SidebarSubLink to="/admin-dashboard/add-department" end>
                  Add Department
                </SidebarSubLink>
              )}
            </SidebarGroup>
          )}

          {showDesignations && (
            <SidebarGroup
              groupId="designations"
              title="Designation"
              icon={FaIdBadge}
              paths={[
                "/admin-dashboard/designations",
                "/admin-dashboard/add-designation",
                "/admin-dashboard/assign-designation",
              ]}
            >
              <SidebarSubLink to="/admin-dashboard/designations" end>
                Designation List
              </SidebarSubLink>
              {sectionCan("designations", "create", isAdminOrHR) && (
                <SidebarSubLink to="/admin-dashboard/add-designation" end>
                  Add Designation
                </SidebarSubLink>
              )}
              {sectionCan("designations", "update", isAdminOrHR) && (
                <SidebarSubLink to="/admin-dashboard/assign-designation" end>
                  Assign Designation
                </SidebarSubLink>
              )}
            </SidebarGroup>
          )}

          {showEmployees && (
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
              {sectionCan("employees", "create", isAdminOrHR) && (
                <SidebarSubLink to="/admin-dashboard/add-employee" end>
                  Add Employee
                </SidebarSubLink>
              )}
            </SidebarGroup>
          )}

          {showLeave && (
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

          {showAttendance && (
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

          {showFinance && (
            <SidebarGroup
              groupId="finance"
              title="Finance"
              icon={FaWallet}
              paths={[
                "/admin-dashboard/salary",
                "/admin-dashboard/advance-requests",
              ]}
            >
              {showSalary && (
                <SidebarSubLink to="/admin-dashboard/salary" end>
                  Salary
                </SidebarSubLink>
              )}
              {showAdvance && (
                <SidebarSubLink to="/admin-dashboard/advance-requests" end>
                  Advance Request
                </SidebarSubLink>
              )}
            </SidebarGroup>
          )}

          {showRoles && (
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
              {sectionCan("roles", "update", isAdminOrHR) && (
                <SidebarSubLink to="/admin-dashboard/role-management" end>
                  Assign Role
                </SidebarSubLink>
              )}
              {sectionCan("roles", "create", isAdminOrHR) && (
                <SidebarSubLink to="/admin-dashboard/roles/add" end>
                  Add Role
                </SidebarSubLink>
              )}
            </SidebarGroup>
          )}
        </div>
      </SidebarAccordionProvider>
    </div>
  );
};

export default AdminSidebar;
