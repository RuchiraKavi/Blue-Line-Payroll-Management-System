import React, { useEffect, useState } from "react";
import { fetchDepartments, fetchDesignationsByDepartment } from "../../utils/EmployeeHelper";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import AllowancesSection, { emptyAllowances, ALLOWANCE_FIELDS } from "./AllowancesSection";
import ServiceChargesSection, { emptyServiceCharges, SERVICE_CHARGE_FIELDS } from "./ServiceChargesSection";
import DateInput from "../ui/DateInput.jsx";
import MoneyInput from "../ui/MoneyInput.jsx";
import normalizeRole from "../../utils/normalizeRole.js";
import SelectInput from "../ui/SelectInput.jsx";
import {
  getMaxDobForMinimumAge,
  validateAddress,
  validateDobMinimumAge,
  validateEmail,
  validateMobileNumber,
  validateNic,
} from "../../utils/employeeFieldValidation.js";
import { SRI_LANKA_BANK_OPTIONS } from "../../utils/sriLankaBanks.js";
import { JOB_TYPE_OPTIONS, validateJobType } from "../../utils/jobTypes.js";

const fieldInputClass = (hasError = false) =>
  `w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 bg-white shadow-sm transition-all duration-200 focus:outline-none ${
    hasError
      ? "border-red-500 focus:ring-2 focus:ring-red-100 focus:border-red-500"
      : "border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
  }`;

const readOnlyInputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed shadow-sm text-sm";

const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const EditEmployee = () => {
  const { user, loading } = useAuth();
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    nic: "",
    epf_number: "",
    address: "",
    mobile_number: "",
    employee_id: "",
    dob: "",
    gender: "",
    marital_status: "",
    joined_date: "",
    resigned_date: "",
    designation: "",
    department: "",
    job_type: "",
    basic_salary: "",
    ...emptyAllowances(),
    ...emptyServiceCharges(),
    bank_name: "",
    bank_branch: "",
    bank_account_number: "",
    image: null,
  });


  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
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
          nic: emp.nic || "",
          epf_number: emp.epf_number || "",
          address: emp.address || "",
          mobile_number: emp.mobile_number || "",
          employee_id: emp.employee_id || "",
          dob: emp.dob ? emp.dob.slice(0, 10) : "",
          gender: emp.gender || "",
          marital_status: emp.marital_status || "",
          joined_date: emp.joined_date ? emp.joined_date.slice(0, 10) : "",
          resigned_date: emp.resigned_date ? emp.resigned_date.slice(0, 10) : "",
          designation: emp.designation || "",
          department: emp.department?._id || "",
          job_type: emp.job_type || "Permanent",
          basic_salary: emp.basic_salary || "",
          travel_allowance: emp.travel_allowance ?? "",
          food_allowance: emp.food_allowance ?? "",
          holiday_payment: emp.holiday_payment ?? "",
          allowance_ns: emp.allowance_ns ?? "",
          bonus: emp.bonus ?? "",
          stamp_duty: emp.stamp_duty ?? "",
          mobile_deduction: emp.mobile_deduction ?? "",
          bank_name: emp.bank_details?.bank_name || "",
          bank_branch: emp.bank_details?.bank_branch || "",
          bank_account_number: emp.bank_details?.bank_account_number || "",
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

  useEffect(() => {
    const loadDesignations = async () => {
      if (!employee.department) {
        setDesignations([]);
        return;
      }

      setDesignationsLoading(true);
      const list = await fetchDesignationsByDepartment(employee.department);
      const withCurrent =
        employee.designation &&
        !list.some(
          (d) =>
            d.title.toLowerCase() === employee.designation.toLowerCase()
        )
          ? [
              ...list,
              { _id: "current", title: employee.designation },
            ]
          : list;

      setDesignations(withCurrent);
      setDesignationsLoading(false);
    };

    loadDesignations();
  }, [employee.department, employee.designation]);

  /* ================= Handle Change ================= */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "department") {
      setEmployee((prev) => ({
        ...prev,
        department: value,
        designation: "",
      }));
      return;
    }

    setEmployee((prev) => ({
      ...prev,
      [name]: name === "image" ? files[0] : value,
    }));
  };

  /* ================= Handle Submit ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nicError = validateNic(employee.nic);
    if (nicError) return setError(nicError);

    const emailError = validateEmail(employee.email);
    if (emailError) return setError(emailError);

    const mobileError = validateMobileNumber(employee.mobile_number);
    if (mobileError) return setError(mobileError);

    const addressError = validateAddress(employee.address);
    if (addressError) return setError(addressError);

    const dobError = validateDobMinimumAge(employee.dob);
    if (dobError) return setError(dobError);

    const jobTypeError = validateJobType(employee.job_type);
    if (jobTypeError) return setError(jobTypeError);

    // Validate bank details are not empty
    if (!employee.bank_name?.trim() || !employee.bank_branch?.trim() || !employee.bank_account_number?.trim()) {
      setError("Bank details (name, branch, account number) are required");
      return;
    }

    const profileDefaultNames = [
      ...ALLOWANCE_FIELDS.map((f) => f.name),
      ...SERVICE_CHARGE_FIELDS.map((f) => f.name),
    ];
    const formData = new FormData();
    Object.keys(employee).forEach((key) => {
      if (key === "employee_id" || key === "epf_number") return;
      if (key === "image") {
        if (employee[key] instanceof File) {
          formData.append(key, employee[key]);
        }
      } else if (profileDefaultNames.includes(key)) {
        formData.append(key, employee[key] === "" ? "0" : employee[key]);
      } else if (employee[key] !== null && employee[key] !== "") {
        formData.append(key, employee[key]);
      }
    });

    try {
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const bankOptions =
    employee.bank_name &&
    !SRI_LANKA_BANK_OPTIONS.some((o) => o.value === employee.bank_name)
      ? [
          ...SRI_LANKA_BANK_OPTIONS,
          { value: employee.bank_name, label: employee.bank_name },
        ]
      : SRI_LANKA_BANK_OPTIONS;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="relative w-full max-w-4xl mx-auto bg-white shadow-lg rounded-2xl border border-gray-100 p-6 sm:p-8">
        <h3 className="text-center text-2xl font-bold text-gray-800 mb-2">
          Edit Employee
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Update employee details below. Employee ID and EPF number cannot be changed.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
          onSubmit={handleSubmit}
          autoComplete="off"
          noValidate
        >
          {/* Full Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={employee.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className={fieldInputClass()}
            />
          </div>

          {/* NIC */}
          <div>
            <label htmlFor="nic" className={labelClass}>
              NIC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nic"
              name="nic"
              placeholder="e.g. 200012345678 or 991234567V"
              value={employee.nic}
              onChange={handleChange}
              required
              className={fieldInputClass()}
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobile_number" className={labelClass}>
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="mobile_number"
              name="mobile_number"
              placeholder="e.g. 0771234567"
              value={employee.mobile_number}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={10}
              required
              className={fieldInputClass()}
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="address" className={labelClass}>
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              placeholder="Permanent / residential address"
              value={employee.address}
              onChange={handleChange}
              required
              className={`${fieldInputClass()} resize-y`}
            />
          </div>

          {/* EPF Number */}
          <div>
            <label htmlFor="epf_number" className={labelClass}>
              EPF Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="epf_number"
              name="epf_number"
              value={employee.epf_number || "—"}
              readOnly
              className={`${readOnlyInputClass} uppercase`}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={employee.email}
              onChange={handleChange}
              placeholder="Employee email address"
              required
              className={fieldInputClass()}
            />
          </div>

          {/* Employee ID */}
          <div>
            <label htmlFor="employee_id" className={labelClass}>
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="employee_id"
              id="employee_id"
              value={employee.employee_id}
              readOnly
              className={readOnlyInputClass}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className={labelClass}>
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <DateInput
              name="dob"
              id="dob"
              value={employee.dob}
              onChange={handleChange}
              max={getMaxDobForMinimumAge(18)}
              required
              className={fieldInputClass()}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Employee must be at least 18 years old
            </p>
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className={labelClass}>
              Gender <span className="text-red-500">*</span>
            </label>
            <SelectInput
              name="gender"
              id="gender"
              value={employee.gender}
              onChange={handleChange}
              required
              placeholder="Select Gender"
              options={[
                { value: "", label: "Select Gender" },
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ]}
            />
          </div>

          {/* Marital Status */}
          <div>
            <label htmlFor="marital_status" className={labelClass}>
              Marital Status <span className="text-red-500">*</span>
            </label>
            <SelectInput
              name="marital_status"
              id="marital_status"
              value={employee.marital_status}
              onChange={handleChange}
              required
              placeholder="Select Status"
              options={[
                { value: "", label: "Select Status" },
                { value: "Single", label: "Single" },
                { value: "Married", label: "Married" },
              ]}
            />
          </div>

          {/* Joined Date */}
          <div>
            <label htmlFor="joined_date" className={labelClass}>
              Joined Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              name="joined_date"
              id="joined_date"
              value={employee.joined_date}
              onChange={handleChange}
              required
              className={fieldInputClass()}
            />
          </div>

          {/* Resigned Date */}
          <div>
            <label htmlFor="resigned_date" className={labelClass}>
              Resigned Date
            </label>
            <DateInput
              name="resigned_date"
              id="resigned_date"
              value={employee.resigned_date}
              onChange={handleChange}
              className={fieldInputClass()}
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className={labelClass}>
              Department <span className="text-red-500">*</span>
            </label>
            <SelectInput
              name="department"
              id="department"
              value={employee.department}
              onChange={handleChange}
              required
              placeholder="Select Department"
              searchable={departments.length > 7}
              options={[
                { value: "", label: "Select Department" },
                ...departments.map((dep) => ({
                  value: dep._id,
                  label: dep.dep_name,
                })),
              ]}
            />
          </div>

          {/* Designation */}
          <div>
            <label htmlFor="designation" className={labelClass}>
              Designation <span className="text-red-500">*</span>
            </label>
            <SelectInput
              name="designation"
              id="designation"
              value={employee.designation}
              onChange={handleChange}
              required
              disabled={!employee.department || designationsLoading}
              placeholder={
                !employee.department
                  ? "Select a department first"
                  : designationsLoading
                  ? "Loading designations..."
                  : designations.length === 0
                  ? "No designations — add them in department settings"
                  : "Select Designation"
              }
              options={designations.map((des) => ({
                value: des.title,
                label: des.title,
              }))}
            />
            {employee.department && !designationsLoading && designations.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                Add designations for this department under Departments → Edit.
              </p>
            )}
          </div>

          {/* Job Type */}
          <div>
            <label htmlFor="job_type" className={labelClass}>
              Job Type <span className="text-red-500">*</span>
            </label>
            <SelectInput
              name="job_type"
              id="job_type"
              value={employee.job_type}
              onChange={handleChange}
              required
              placeholder="Select Job Type"
              options={JOB_TYPE_OPTIONS}
            />
          </div>

          {/* Basic Salary */}
          <div>
            <label htmlFor="basic_salary" className={labelClass}>
              Basic Salary <span className="text-red-500">*</span>
            </label>
            <MoneyInput
              name="basic_salary"
              id="basic_salary"
              value={employee.basic_salary}
              onChange={handleChange}
              required
            />
          </div>

          <AllowancesSection values={employee} onChange={handleChange} />

          <ServiceChargesSection values={employee} onChange={handleChange} />

          {/* Bank Name */}
          <div>
            <label htmlFor="bank_name" className={labelClass}>
              Bank Name <span className="text-red-500">*</span>
            </label>
            <SelectInput
              name="bank_name"
              id="bank_name"
              value={employee.bank_name}
              onChange={handleChange}
              required
              placeholder="Select Bank"
              searchable
              options={bankOptions}
            />
          </div>

          {/* Bank Branch */}
          <div>
            <label htmlFor="bank_branch" className={labelClass}>
              Bank Branch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bank_branch"
              name="bank_branch"
              placeholder="Branch Name"
              value={employee.bank_branch}
              onChange={handleChange}
              required
              className={fieldInputClass()}
            />
          </div>

          {/* Bank Account Number */}
          <div>
            <label htmlFor="bank_account_number" className={labelClass}>
              Bank Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bank_account_number"
              name="bank_account_number"
              placeholder="Account Number"
              value={employee.bank_account_number}
              onChange={handleChange}
              required
              className={fieldInputClass()}
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label htmlFor="image" className={labelClass}>
              Profile Image
            </label>
            <input
              type="file"
              name="image"
              id="image"
              accept="image/*"
              onChange={handleChange}
              className="block w-full text-sm text-gray-700
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-600 file:text-white
                hover:file:bg-indigo-700 file:transition-colors
                file:cursor-pointer cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? "Updating Employee..." : "Update Employee"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
