import React, { useEffect, useState } from "react";
import { fetchDepartments, fetchDesignationsByDepartment } from "../../utils/EmployeeHelper";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AllowancesSection, { emptyAllowances, ALLOWANCE_FIELDS } from "./AllowancesSection";
import ServiceChargesSection, { emptyServiceCharges, SERVICE_CHARGE_FIELDS } from "./ServiceChargesSection";
import DateInput from "../ui/DateInput.jsx";
import SelectInput from "../ui/SelectInput.jsx";
import {
  getMaxDobForMinimumAge,
  validateAddress,
  validateDobMinimumAge,
  validateEmail,
  validateMobileNumber,
  validateNic,
} from "../../utils/employeeFieldValidation.js";

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-xs text-red-600 font-medium">{message}</p> : null;

const fieldInputClass = (hasError) =>
  `w-full px-4 py-2 border rounded-lg focus:ring-2 ${
    hasError
      ? "border-red-500 focus:ring-red-100 focus:border-red-500"
      : "border-gray-300 focus:ring-indigo-500 focus:border-transparent"
  }`;

const mapServerErrorToFields = (message) => {
  if (!message) return { formError: "Error adding employee. Please try again." };
  const lower = message.toLowerCase();
  if (lower.includes("email")) return { fieldErrors: { email: message } };
  if (lower.includes("nic")) return { fieldErrors: { nic: message } };
  if (lower.includes("employee id")) return { fieldErrors: { employee_id: message } };
  if (lower.includes("epf")) return { fieldErrors: { epf_number: message } };
  if (lower.includes("department")) return { fieldErrors: { department: message } };
  if (lower.includes("designation")) return { fieldErrors: { designation: message } };
  return { formError: message };
};

const AddEmployee = () => {
  const { user, loading } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    email: "",
    nic: "",
    epf_number: "",
    address: "",
    mobile_number: "",
    dob: "",
    gender: "",
    marital_status: "",
    joined_date: "",
    designation: "",
    department: "",
    basic_salary: "",
    ...emptyAllowances(),
    ...emptyServiceCharges(),
    password: "",
    bank_name: "",
    bank_branch: "",
    bank_account_number: "",
    image: null,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [idLoading, setIdLoading] = useState(true);
  const [credentialFieldsReady, setCredentialFieldsReady] = useState(false);
  const navigate = useNavigate();

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
            epf_number: idResponse.data.nextEpfNumber || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setFormError("Failed to load form data. Please refresh.");
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

  useEffect(() => {
    const loadDesignations = async () => {
      if (!formData.department) {
        setDesignations([]);
        return;
      }

      setDesignationsLoading(true);
      const list = await fetchDesignationsByDepartment(formData.department);
      setDesignations(list);
      setDesignationsLoading(false);
    };

    loadDesignations();
  }, [formData.department]);

  // Clear browser autofill on email/password until the user focuses those fields
  useEffect(() => {
    if (idLoading || credentialFieldsReady) return;
    const timers = [100, 400].map((ms) =>
      setTimeout(() => {
        setFormData((prev) => {
          if (!prev.email && !prev.password) return prev;
          return { ...prev, email: "", password: "" };
        });
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [idLoading, credentialFieldsReady]);

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormError("");
    clearFieldError(name);
    if (name === "image") {
      setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
    } else if (name === "department") {
      setFormData((prevData) => ({
        ...prevData,
        department: value,
        designation: "",
      }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) errors.name = "Name is required";

    const nicError = validateNic(formData.nic);
    if (nicError) errors.nic = nicError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const mobileError = validateMobileNumber(formData.mobile_number);
    if (mobileError) errors.mobile_number = mobileError;

    const addressError = validateAddress(formData.address);
    if (addressError) errors.address = addressError;

    const dobError = validateDobMinimumAge(formData.dob);
    if (dobError) errors.dob = dobError;

    if (!formData.employee_id?.trim()) errors.employee_id = "Employee ID is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.marital_status) errors.marital_status = "Marital Status is required";
    if (!formData.joined_date) errors.joined_date = "Joined Date is required";
    if (!formData.designation?.trim()) errors.designation = "Designation is required";
    if (!formData.department) errors.department = "Department is required";
    if (!formData.basic_salary || Number(formData.basic_salary) <= 0) {
      errors.basic_salary = "Basic Salary must be greater than 0";
    }
    if (!formData.password?.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!formData.bank_name?.trim()) errors.bank_name = "Bank Name is required";
    if (!formData.bank_branch?.trim()) errors.bank_branch = "Bank Branch is required";

    if (!formData.bank_account_number?.trim()) {
      errors.bank_account_number = "Bank Account Number is required";
    } else if (!/^[0-9]{8,18}$/.test(formData.bank_account_number)) {
      errors.bank_account_number = "Bank Account Number must be 8–18 digits";
    }

    const numericProfileFields = [
      ...ALLOWANCE_FIELDS.map((f) => f.name),
      ...SERVICE_CHARGE_FIELDS.map((f) => f.name),
    ];
    for (const field of numericProfileFields) {
      const val = formData[field];
      if (val !== "" && val != null && Number(val) < 0) {
        errors[field] = "Amount cannot be negative";
      }
    }

    return errors;
  };

  const focusFirstFieldError = (errors) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;
    requestAnimationFrame(() => {
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      focusFirstFieldError(validationErrors);
      return;
    }

    const profileDefaultNames = [
      ...ALLOWANCE_FIELDS.map((f) => f.name),
      ...SERVICE_CHARGE_FIELDS.map((f) => f.name),
    ];
    const formDataObj = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "image") {
        if (formData[key]) formDataObj.append(key, formData[key]);
      } else if (profileDefaultNames.includes(key)) {
        formDataObj.append(key, formData[key] === "" ? "0" : formData[key]);
      } else if (formData[key] !== null && formData[key] !== "") {
        formDataObj.append(key, formData[key]);
      }
    });

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFormError("Authentication token not found");
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
        const mapped = mapServerErrorToFields(response.data.message);
        if (mapped.fieldErrors) setFieldErrors(mapped.fieldErrors);
        else setFormError(mapped.formError || "Failed to add employee");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setFormError("You don't have permission to add employees");
        navigate("/unauthorized");
      } else if (err.response?.status === 401) {
        setFormError("Session expired. Please login again");
        navigate("/login");
      } else {
        const mapped = mapServerErrorToFields(err.response?.data?.message);
        if (mapped.fieldErrors) {
          setFieldErrors(mapped.fieldErrors);
          focusFirstFieldError(mapped.fieldErrors);
        } else {
          setFormError(
            mapped.formError || "Error adding employee. Please try again."
          );
        }
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
      <div className="relative w-full max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-8">
        <h3 className="text-center text-2xl font-bold text-gray-800 mb-2">
          Register Employee
        </h3>
        <p className="text-center text-sm text-gray-600 mb-6">
          Next Employee ID: <span className="font-semibold text-indigo-600">{formData.employee_id}</span>
          {" · "}
          Next EPF No.: <span className="font-semibold text-indigo-600">{formData.epf_number}</span>
          {" · New employees are registered with the "}
          <span className="font-semibold">Employee</span>
          {" role. Use Role Management to change roles."}
        </p>

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{formError}</p>
          </div>
        )}

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          {/* Decoy fields — absorb browser autofill for login credentials */}
          <input
            type="text"
            name="prevent_autofill_username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute opacity-0 h-0 w-0 pointer-events-none"
          />
          <input
            type="password"
            name="prevent_autofill_password"
            autoComplete="current-password"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute opacity-0 h-0 w-0 pointer-events-none"
          />

          {/* Name */}
          <div id="field-name">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              placeholder="Full Name"
              onChange={handleChange}
              autoComplete="off"
              className={fieldInputClass(fieldErrors.name)}
              required
            />
            <FieldError message={fieldErrors.name} />
          </div>

          {/* NIC */}
            <div id="field-nic">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nic"
                placeholder="e.g. 200012345678 or 991234567V"
                value={formData.nic}
                onChange={handleChange}
                autoComplete="off"
                className={fieldInputClass(fieldErrors.nic)}
                required
              />
              <FieldError message={fieldErrors.nic} />
              {!fieldErrors.nic && (
                <p className="mt-1 text-xs text-gray-500">
                  Old NIC: 9 digits + V/X · New NIC: 12 digits
                </p>
              )}
            </div>

          {/* Mobile Number */}
          <div id="field-mobile_number">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobile_number"
              placeholder="e.g. 0771234567"
              value={formData.mobile_number}
              onChange={handleChange}
              autoComplete="off"
              className={fieldInputClass(fieldErrors.mobile_number)}
              required
            />
            <FieldError message={fieldErrors.mobile_number} />
          </div>

          {/* Address */}
          <div className="md:col-span-2" id="field-address">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              rows={3}
              placeholder="Permanent / residential address"
              value={formData.address}
              onChange={handleChange}
              autoComplete="off"
              className={`${fieldInputClass(fieldErrors.address)} resize-y`}
              required
            />
            <FieldError message={fieldErrors.address} />
          </div>

          {/* EPF Number */}
          <div id="field-epf_number">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              EPF Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="epf_number"
              value={formData.epf_number}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed uppercase"
              required
            />
            <FieldError message={fieldErrors.epf_number} />
          </div>

          {/* Email */}
          <div id="field-email">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="Employee email address"
              onChange={handleChange}
              autoComplete="off"
              readOnly={!credentialFieldsReady}
              onFocus={() => setCredentialFieldsReady(true)}
              className={fieldInputClass(fieldErrors.email)}
              required
            />
            <FieldError message={fieldErrors.email} />
          </div>

          {/* Employee ID */}
          <div id="field-employee_id">
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
            <FieldError message={fieldErrors.employee_id} />
          </div>

          {/* Date of Birth */}
          <div id="field-dob">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <DateInput
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              max={getMaxDobForMinimumAge(18)}
              className={fieldInputClass(fieldErrors.dob)}
              required
            />
            <FieldError message={fieldErrors.dob} />
            {!fieldErrors.dob && (
              <p className="mt-1 text-xs text-gray-500">
                Employee must be at least 18 years old
              </p>
            )}
          </div>

          {/* Gender */}
          <div id="field-gender">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className={fieldErrors.gender ? "rounded-xl ring-2 ring-red-300" : ""}>
              <SelectInput
                name="gender"
                value={formData.gender}
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
            <FieldError message={fieldErrors.gender} />
          </div>

          {/* Marital Status */}
          <div id="field-marital_status">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status <span className="text-red-500">*</span>
            </label>
            <div className={fieldErrors.marital_status ? "rounded-xl ring-2 ring-red-300" : ""}>
              <SelectInput
                name="marital_status"
                value={formData.marital_status}
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
            <FieldError message={fieldErrors.marital_status} />
          </div>

          {/* Joined Date */}
          <div id="field-joined_date">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Joined Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              name="joined_date"
              value={formData.joined_date}
              onChange={handleChange}
              className={fieldInputClass(fieldErrors.joined_date)}
              required
            />
            <FieldError message={fieldErrors.joined_date} />
          </div>

          {/* Department */}
          <div id="field-department">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <div className={fieldErrors.department ? "rounded-xl ring-2 ring-red-300" : ""}>
              <SelectInput
                name="department"
                value={formData.department}
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
            <FieldError message={fieldErrors.department} />
          </div>

          {/* Designation */}
          <div id="field-designation">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation <span className="text-red-500">*</span>
            </label>
            <div className={fieldErrors.designation ? "rounded-xl ring-2 ring-red-300" : ""}>
              <SelectInput
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                disabled={!formData.department || designationsLoading}
                placeholder={
                  !formData.department
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
            </div>
            <FieldError message={fieldErrors.designation} />
            {formData.department && !designationsLoading && designations.length === 0 && !fieldErrors.designation && (
              <p className="mt-1 text-xs text-amber-600">
                Add designations under Department Management → Add Designation, then assign them via Assign Designation.
              </p>
            )}
          </div>

          {/* Basic Salary */}
          <div id="field-basic_salary">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Basic Salary <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="basic_salary"
              value={formData.basic_salary}
              placeholder="0.00"
              onChange={handleChange}
              autoComplete="off"
              className={fieldInputClass(fieldErrors.basic_salary)}
              required
            />
            <FieldError message={fieldErrors.basic_salary} />
          </div>

          <AllowancesSection values={formData} onChange={handleChange} fieldErrors={fieldErrors} />

          <ServiceChargesSection values={formData} onChange={handleChange} fieldErrors={fieldErrors} />

          {/* Bank Name */}
            <div id="field-bank_name">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_name"
                placeholder="Bank Name"
                value={formData.bank_name}
                onChange={handleChange}
                autoComplete="off"
                className={fieldInputClass(fieldErrors.bank_name)}
                required
              />
              <FieldError message={fieldErrors.bank_name} />
            </div>

            {/* Bank Branch */}
            <div id="field-bank_branch">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Branch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_branch"
                placeholder="Branch Name"
                value={formData.bank_branch}
                onChange={handleChange}
                autoComplete="off"
                className={fieldInputClass(fieldErrors.bank_branch)}
                required
              />
              <FieldError message={fieldErrors.bank_branch} />
            </div>

            {/* Bank Account Number */}
            <div id="field-bank_account_number">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_account_number"
                placeholder="Account Number"
                value={formData.bank_account_number}
                onChange={handleChange}
                autoComplete="off"
                className={fieldInputClass(fieldErrors.bank_account_number)}
                required
              />
              <FieldError message={fieldErrors.bank_account_number} />
            </div>


          {/* Password */}
          <div id="field-password">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              placeholder="Enter password (min 6 characters)"
              onChange={handleChange}
              autoComplete="new-password"
              readOnly={!credentialFieldsReady}
              onFocus={() => setCredentialFieldsReady(true)}
              className={fieldInputClass(fieldErrors.password)}
              required
            />
            <FieldError message={fieldErrors.password} />
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
              {submitting ? "Registering Employee..." : "Register Employee"}
            </button>
          </div>
        </form>      </div>
    </div>
  );
};

export default AddEmployee;