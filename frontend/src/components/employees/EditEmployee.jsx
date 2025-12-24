import React, { useEffect, useState } from "react";
import { fetchDepartments } from "../../utils/EmployeeHelper";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditEmployee = () => {
  const { user, loading } = useAuth();
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    employee_id: "",
    dob: "",
    gender: "",
    marital_status: "",
    joined_date: "",
    resigned_date: "",
    designation: "",
    department: "",
    basic_salary: "",
    role: "",
    image: null,
  });

  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  // Available roles based on user permissions
  const AVAILABLE_ROLES = {
    admin: ["admin", "hr", "accountant", "employee", "intern"],
    hr: ["hr", "accountant", "employee", "intern"],
    accountant: [],
    employee: [],
    intern: [],
  };

  // Check authorization - only admin and hr can edit employees
  useEffect(() => {
    const normalizeRole = (r) => {
      if (!r) return r;
      const x = String(r).toLowerCase();
      if (x === "hr_manager") return "hr";
      if (x === "account_manager" || x === "accountant") return "accountant";
      return x;
    };
    const userRole = normalizeRole(user?.role);
    const allowedToEdit = ["admin", "hr"];

    if (!loading && (!user || !allowedToEdit.includes(userRole))) {
      navigate("/unauthorized");
    }
  }, [user, loading, navigate]);

  /* ================= Fetch Employee ================= */
  useEffect(() => {
  const fetchEmployee = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/employees/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        const emp = res.data.employee; // ✅ CORRECT KEY

        setEmployee({
          name: emp.userId?.name || "",
          email: emp.userId?.email || "",
          employee_id: emp.employee_id || "",
          dob: emp.dob ? emp.dob.slice(0, 10) : "",
          gender: emp.gender || "",
          marital_status: emp.marital_status || "",
          joined_date: emp.joined_date ? emp.joined_date.slice(0, 10) : "",
          resigned_date: emp.resigned_date
            ? emp.resigned_date.slice(0, 10)
            : "",
          designation: emp.designation || "",
          department: emp.department?._id || "",
          basic_salary: emp.basic_salary || "",
          role: emp.userId?.role || "",
          image: null,
        });
      }
    } catch (error) {
      console.error(error);
      alert("Employee Loading Error");
    }
  };

  fetchEmployee();
}, [id]);

  /* ================= Fetch Departments ================= */
  useEffect(() => {
    const getDepartments = async () => {
      const deps = await fetchDepartments();
      setDepartments(deps || []);
    };
    getDepartments();
  }, []);

  /* ================= Handle Change ================= */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setEmployee((prev) => ({
      ...prev,
      [name]: name === "image" ? files[0] : value,
    }));
  };

  /* ================= Handle Submit ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check role permission
    const normalizeRole = (r) => {
      if (!r) return r;
      const x = String(r).toLowerCase();
      if (x === "hr_manager") return "hr";
      if (x === "account_manager" || x === "accountant") return "accountant";
      return x;
    };
    const userRole = normalizeRole(user?.role);
    const allowedRoles = AVAILABLE_ROLES[userRole];
    if (!allowedRoles?.includes(employee.role)) {
      setError(`You cannot assign role: ${employee.role}`);
      return;
    }

    const formData = new FormData();
    Object.keys(employee).forEach((key) => {
      if (employee[key] !== null && employee[key] !== "") {
        formData.append(key, employee[key]);
      }
    });

    try {
      const res = await axios.put(
        `http://localhost:5000/api/employees/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        alert("Employee updated successfully");
        navigate("/admin-dashboard/employees");
      } else {
        setError(res.data.message || "Failed to update employee");
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setError("You don't have permission to edit employees");
        navigate("/unauthorized");
      } else if (error.response?.status === 401) {
        setError("Session expired. Please login again");
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Update failed");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
  <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8">
    <h3 className="text-center text-2xl font-bold mb-6">
      Edit Employee
    </h3>

    {error && (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm font-medium">{error}</p>
      </div>
    )}

    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
      onSubmit={handleSubmit}
    >
      {/* Full Name */}
      <div className="flex flex-col">
        <label htmlFor="name" className="mb-1 font-medium">Full Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={employee.name}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col">
        <label htmlFor="email" className="mb-1 font-medium">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          value={employee.email}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      {/* Employee ID */}
      <div className="flex flex-col">
        <label htmlFor="employee_id" className="mb-1 font-medium">Employee ID</label>
        <input
          type="text"
          name="employee_id"
          id="employee_id"
          value={employee.employee_id}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      {/* Date of Birth */}
      <div className="flex flex-col">
        <label htmlFor="dob" className="mb-1 font-medium">Date of Birth</label>
        <input
          type="date"
          name="dob"
          id="dob"
          value={employee.dob}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      {/* Gender */}
      <div className="flex flex-col">
        <label htmlFor="gender" className="mb-1 font-medium">Gender</label>
        <select
          name="gender"
          id="gender"
          value={employee.gender}
          onChange={handleChange}
          required
          className="input"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      {/* Marital Status */}
      <div className="flex flex-col">
        <label htmlFor="marital_status" className="mb-1 font-medium">Marital Status</label>
        <select
          name="marital_status"
          id="marital_status"
          value={employee.marital_status}
          onChange={handleChange}
          required
          className="input"
        >
          <option value="">Select Status</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
        </select>
      </div>

      {/* Joined Date */}
      <div className="flex flex-col">
        <label htmlFor="joined_date" className="mb-1 font-medium">Joined Date</label>
        <input
          type="date"
          name="joined_date"
          id="joined_date"
          value={employee.joined_date}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      {/* Resigned Date */}
      <div className="flex flex-col">
        <label htmlFor="resigned_date" className="mb-1 font-medium">Resigned Date</label>
        <input
          type="date"
          name="resigned_date"
          id="resigned_date"
          value={employee.resigned_date}
          onChange={handleChange}
          className="input"
        />
      </div>

      {/* Designation */}
      <div className="flex flex-col">
        <label htmlFor="designation" className="mb-1 font-medium">Designation</label>
        <input
          type="text"
          name="designation"
          id="designation"
          value={employee.designation}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      {/* Department */}
      <div className="flex flex-col">
        <label htmlFor="department" className="mb-1 font-medium">Department</label>
        <select
          name="department"
          id="department"
          value={employee.department}
          onChange={handleChange}
          required
          className="input"
        >
          <option value="">Select Department</option>
          {departments.map((dep) => (
            <option key={dep._id} value={dep._id}>
              {dep.dep_name}
            </option>
          ))}
        </select>
      </div>

      {/* Basic Salary */}
      <div className="flex flex-col">
        <label htmlFor="basic_salary" className="mb-1 font-medium">Basic Salary</label>
        <input
          type="number"
          name="basic_salary"
          id="basic_salary"
          value={employee.basic_salary}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      {/* Role */}
      <div className="flex flex-col">
        <label htmlFor="role" className="mb-1 font-medium">Role</label>
        <select
          name="role"
          id="role"
          value={employee.role}
          onChange={handleChange}
          required
          className="input"
        >
          <option value="">Select Role</option>
          {(() => {
            const normalizeRole = (r) => {
              if (!r) return r;
              const x = String(r).toLowerCase();
              if (x === "hr_manager") return "hr";
              if (x === "account_manager" || x === "accountant") return "accountant";
              return x;
            };
            const userRole = normalizeRole(user?.role);
            return AVAILABLE_ROLES[userRole]?.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ));
          })()}
        </select>
        <p className="mt-1 text-xs text-gray-500">Available roles based on your permissions</p>
      </div>

      {/* Image Upload */}
      <div className="flex flex-col md:col-span-2">
        <label htmlFor="image" className="mb-1 font-medium">Profile Image</label>
        <input
          type="file"
          name="image"
          id="image"
          onChange={handleChange}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="md:col-span-2 bg-indigo-600 text-white py-2 rounded-lg"
      >
        Update Employee
      </button>
    </form>
  </div>
</div>

  );
};

export default EditEmployee;
