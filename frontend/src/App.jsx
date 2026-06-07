import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import { useAuth } from "./hooks/useAuth";
import normalizeRole from "./utils/normalizeRole";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import PrivateRoutes from "./utils/PrivateRoutes.jsx";
import AdminSummary from "./components/dashboard/AdminSummary.jsx";
import EmployeeSummary from "./components/dashboard/EmployeeSummary.jsx";
import DepartmentList from "./components/departments/DepartmentList.jsx";
import AddDepartment from "./components/departments/AddDepartment.jsx";
import EditDepartment from "./components/departments/EditDepartment.jsx";
import DesignationList from "./components/designations/DesignationList.jsx";
import AddDesignation from "./components/designations/AddDesignation.jsx";
import AssignDesignation from "./components/designations/AssignDesignation.jsx";
import EmployeeList from "./components/employees/EmployeeList.jsx";
import AddEmployee from "./components/employees/AddEmployee.jsx";
import ViewEmployee from "./components/employees/ViewEmployee.jsx";
import EditEmployee from "./components/employees/EditEmployee.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import Profile from "./components/employeeDashboard/profile.jsx";
import EditProfile from "./components/employeeDashboard/editProfile.jsx";
import LeaveList from "./components/leave/LeaveList.jsx";
import RequestLeave from "./components/leave/RequestLeave.jsx";
import RequestAdvance from "./components/advance/RequestAdvance.jsx";
import AdvanceRequestList from "./components/advance/AdvanceRequestList.jsx";
import ChangePassword from "./components/employeeDashboard/ChangePassword.jsx";
import LeaveManage from "./components/leave/LeaveManage.jsx";
import LeaveDetail from "./components/leave/LeaveDetail.jsx";
import EmployeeLeaveHistory from "./components/leave/EmployeeLeaveHistory.jsx";
import LeaveHistoryReport from "./components/leave/LeaveHistoryReport.jsx";
import AttendanceList from "./components/attendance/AttendanceList.jsx";
import AttendanceHistoryReport from "./components/attendance/AttendanceHistoryReport.jsx";
import SalaryPage from "./components/salary/SalaryPage.jsx";
import EmployeeSalaryHistory from "./components/salary/EmployeeSalaryHistory.jsx";
import AdminEmployeeSalaryHistory from "./components/salary/AdminEmployeeSalaryHistory.jsx";
import RoleManagement from "./components/roles/RoleManagement.jsx";
import RoleList from "./components/roles/RoleList.jsx";
import AddSystemRole from "./components/roles/AddSystemRole.jsx";
import AddRole from "./components/roles/AddRole.jsx";

function App() {
  const { user, loading } = useAuth();

  const getAuthRedirect = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg font-semibold text-gray-600">Loading...</div>
        </div>
      );
    }

    if (!user) return <Navigate to="/login" />;
    const role = normalizeRole(user.role);

    const adminRoles = ["admin", "hr", "accountant"];
    const employeeRoles = ["employee", "intern"];

    if (employeeRoles.includes(role)) {
      return <Navigate to="/employee-dashboard" />;
    }

    if (adminRoles.includes(role)) {
      return <Navigate to="/admin-dashboard" />;
    }

    // Fallback: send authenticated users to admin dashboard
    return <Navigate to="/admin-dashboard" />;
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route path="/" element={getAuthRedirect()} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ADMIN DASHBOARD (only admin, hr, account can enter) */}
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoutes>
              <ProtectedRoute allowedRoles={["admin", "hr", "account", "account_manager", "accountant", "hr_manager"]}>
                <AdminDashboard />
              </ProtectedRoute>
            </PrivateRoutes>
          }
        >
          {/* Dashboard Home */}
          <Route index element={<AdminSummary />} />

          {/* Departments → Admin & HR */}
          <Route
            path="designations"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <DesignationList />
              </ProtectedRoute>
            }
          />

          <Route
            path="add-designation"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AddDesignation />
              </ProtectedRoute>
            }
          />

          <Route
            path="assign-designation"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AssignDesignation />
              </ProtectedRoute>
            }
          />

          <Route
            path="departments"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <DepartmentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="add-department"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AddDepartment />
              </ProtectedRoute>
            }
          />

          <Route
            path="departments/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <EditDepartment />
              </ProtectedRoute>
            }
          />

          {/* Employees → Admin & HR */}
          <Route
            path="employees"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <EmployeeList />
              </ProtectedRoute>
            }
          />

          <Route
            path="add-employee"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AddEmployee />
              </ProtectedRoute>
            }
          />

          <Route
            path="employees/salary/:employeeId"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AdminEmployeeSalaryHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="employees/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <ViewEmployee />
              </ProtectedRoute>
            }
          />

          <Route
            path="employees/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <EditEmployee />
              </ProtectedRoute>
            }
          />

          <Route
            path="roles"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <RoleList />
              </ProtectedRoute>
            }
          />

          <Route
            path="roles/add"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AddSystemRole />
              </ProtectedRoute>
            }
          />

          <Route
            path="role-management"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <RoleManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="add-role"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AddRole />
              </ProtectedRoute>
            }
          />

          <Route
            path="leaves"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <LeaveManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaves/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <LeaveDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees/leaves/:employeeId"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <EmployeeLeaveHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="leaves-report"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <LeaveHistoryReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="attendance"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AttendanceList />
              </ProtectedRoute>
            }
          />

          <Route
            path="attendance-report"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <AttendanceHistoryReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="salary"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr", "hr_manager", "account", "account_manager", "accountant"]}>
                <SalaryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="advance-requests"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr", "account", "account_manager", "accountant"]}>
                <AdvanceRequestList />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Employee Dashboard */}
        <Route
          path="/employee-dashboard"
          element={
            <PrivateRoutes>
              <EmployeeDashboard />
            </PrivateRoutes>
          }
        >
        <Route index element={<EmployeeSummary />} />
        <Route path="/employee-dashboard/profile" element={<Profile />} />
        <Route path="/employee-dashboard/edit-profile" element={<EditProfile />} />
        <Route path="/employee-dashboard/leave" element={<LeaveList />} />
        <Route path="/employee-dashboard/request-leave" element={<RequestLeave />} />
        <Route path="/employee-dashboard/request-advance" element={<RequestAdvance />} />
        <Route path="/employee-dashboard/salary" element={<EmployeeSalaryHistory />} />
        <Route path="/employee-dashboard/change-password" element={<ChangePassword />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={getAuthRedirect()} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
