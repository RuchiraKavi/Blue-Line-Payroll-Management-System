import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'
import PrivateRoutes from './utils/PrivateRoutes.jsx';
import RoleBaseRoutes from './utils/RoleBaseRoutes.jsx';
import AdminSummary from './components/dashboard/AdminSummary.jsx';
import DepartmentList from './components/departments/DepartmentList.jsx';
import AddDepartment from './components/departments/AddDepartment.jsx';
import EditDepartment from './components/departments/EditDepartment.jsx';
import EmployeeList from './components/employees/EmployeeList.jsx';
import AddEmployee from './components/employees/AddEmployee.jsx';
import ViewEmployee from './components/employees/ViewEmployee.jsx';
import EditEmployee from './components/employees/EditEmployee.jsx';

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/admin-dashboard" />} />
      <Route path="/admin-dashboard" element={
        <PrivateRoutes>
          <RoleBaseRoutes requiredRole={["admin"]}>
            <AdminDashboard />
          </RoleBaseRoutes>
        </PrivateRoutes>
        }> 
        <Route index element={<AdminSummary />}></Route>

        <Route path='/admin-dashboard/departments' element={<DepartmentList />}></Route>
        <Route path='/admin-dashboard/add-department' element={<AddDepartment />}></Route>
        <Route path='/admin-dashboard/departments/:id' element={<EditDepartment />}></Route>

        <Route path='/admin-dashboard/employees' element={<EmployeeList />}></Route>
        <Route path='/admin-dashboard/add-employee' element={<AddEmployee />}></Route>
        <Route path='/admin-dashboard/employees/:id' element={<ViewEmployee/>}></Route>
        <Route path='/admin-dashboard/employees/edit/:id' element={<EditEmployee/>}></Route>

      </Route>
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      <Route path="/login" element={<Login />} />

    </Routes>
    </BrowserRouter>
  );
}

export default App
