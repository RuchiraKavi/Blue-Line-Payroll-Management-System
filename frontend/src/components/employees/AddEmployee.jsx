import React, { useEffect, useState } from "react";
import { fetchDepartments } from "../../utils/EmployeeHelper";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddEmployee = () => {
  const { user, loading } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    email: "",
    nic: "",
    dob: "",
    gender: "",
    marital_status: "",
    joined_date: "",
    resigned_date: "",
    designation: "",
    department: "",
    basic_salary: "",
    password: "",
    role: "",
    bank_name: "",
    bank_branch: "",
    bank_account_number: "",
    image: null,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [idLoading, setIdLoading] = useState(true);
  const navigate = useNavigate();

  // Available roles based on user permissions
  // Role hierarchy: admin/hr can create employees with various roles
  const AVAILABLE_ROLES = {
    admin: ["admin", "hr", "accountant", "employee", "intern"],
    hr: ["hr", "accountant", "employee", "intern"],
    accountant: [],
    employee: [],
    intern: [],
  };

  // Fetch departments and next employee ID on component mount
  useEffect(() => {
    const getDepartmentsAndId = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch departments
        const deps = await fetchDepartments();
        setDepartments(deps || []);

        // Fetch next employee ID from backend
        const idResponse = await axios.get(
          "http://localhost:5000/api/employees/last-id",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (idResponse.data.success) {
          setFormData((prevData) => ({
            ...prevData,
            employee_id: idResponse.data.nextId,
          }));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load form data. Please refresh.");
      } finally {
        setIdLoading(false);
      }
    };

    getDepartmentsAndId();
  }, []);

  // Check authorization - normalize roles for checking (hr_manager -> hr, account_manager -> accountant)
  useEffect(() => {
    const normalizeRole = (r) => {
      if (!r) return r;
      const x = String(r).toLowerCase();
      if (x === "hr_manager") return "hr";
      if (x === "account_manager" || x === "accountant") return "accountant";
      return x;
    };
    const userRole = normalizeRole(user?.role);
    const allowedToAdd = ["admin", "hr"];
    
    if (!loading && (!user || !allowedToAdd.includes(userRole))) {
      navigate("/unauthorized");
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setError("");
    if (name === "image") {
      setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name?.trim()) return "Name is required";
    if (!formData.nic?.trim()) return "NIC is required";
    if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(formData.nic))
      return "Invalid NIC format";
    if (!formData.email?.trim()) return "Email is required";
    if (!formData.employee_id?.trim()) return "Employee ID is required";
    if (!formData.dob) return "Date of Birth is required";
    if (!formData.gender) return "Gender is required";
    if (!formData.marital_status) return "Marital Status is required";
    if (!formData.joined_date) return "Joined Date is required";
    if (!formData.designation?.trim()) return "Designation is required";
    if (!formData.department) return "Department is required";
    if (!formData.basic_salary || formData.basic_salary <= 0)
      return "Basic Salary must be greater than 0";
    if (!formData.password?.trim()) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (!formData.role) return "Role is required";
    if (!formData.bank_name?.trim()) return "Bank Name is required";
    if (!formData.bank_branch?.trim()) return "Bank Branch is required";

    if (!formData.bank_account_number?.trim())
      return "Bank Account Number is required";

    if (!/^[0-9]{8,18}$/.test(formData.bank_account_number))
      return "Bank Account Number must be 8–18 digits";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check role permission
    const allowedRoles = AVAILABLE_ROLES[user?.role];
    if (!allowedRoles?.includes(formData.role)) {
      setError(`You cannot assign role: ${formData.role}`);
      return;
    }

    const formDataObj = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataObj.append(key, formData[key]);
      }
    });

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        navigate("/login");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/employees/add",
        formDataObj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        navigate("/admin-dashboard/employees");
      } else {
        setError(response.data.message || "Failed to add employee");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You don't have permission to add employees");
        navigate("/unauthorized");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please login again");
        navigate("/login");
      } else {
        setError(
          err.response?.data?.message || "Error adding employee. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || idLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-8">
        <h3 className="text-center text-2xl font-bold text-gray-800 mb-2">
          Add Employee
        </h3>
        <p className="text-center text-sm text-gray-600 mb-6">
          Next Employee ID: <span className="font-semibold text-indigo-600">{formData.employee_id}</span> | Adding as: <span className="font-semibold capitalize">{user?.role}</span>
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleSubmit}
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* NIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nic"
                placeholder="National Identity Card Number"
                value={formData.nic}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>


          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="Email Address"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="employee_id"
              value={formData.employee_id}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Auto-generated from backend</p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status <span className="text-red-500">*</span>
            </label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>

          {/* Joined Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Joined Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="joined_date"
              value={formData.joined_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Resigned Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resigned Date
            </label>
            <input
              type="date"
              name="resigned_date"
              value={formData.resigned_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              placeholder="Job Title"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Basic Salary <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="basic_salary"
              value={formData.basic_salary}
              placeholder="0.00"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_name"
                placeholder="Bank Name"
                value={formData.bank_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Bank Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Branch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_branch"
                placeholder="Branch Name"
                value={formData.bank_branch}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Bank Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_account_number"
                placeholder="Account Number"
                value={formData.bank_account_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>


          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password (min 6 characters)"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
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
            <p className="mt-1 text-xs text-gray-500">
              Available roles based on your permissions
            </p>
          </div>

          {/* Upload Image */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Image
            </label>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              accept="image/*"
              className="block w-full text-sm text-gray-700
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-600 file:text-white
                    hover:file:bg-indigo-700"
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding Employee..." : "Add Employee"}
            </button>
          </div>
        </form>      </div>
    </div>
  );
};

export default AddEmployee;