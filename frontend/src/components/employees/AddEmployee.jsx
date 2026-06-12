import React, { useEffect, useState } from "react";
import { fetchDepartments, fetchDesignationsByDepartment } from "../../utils/EmployeeHelper";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AllowancesSection, { emptyAllowances, ALLOWANCE_FIELDS } from "./AllowancesSection";
import ServiceChargesSection, { emptyServiceCharges, SERVICE_CHARGE_FIELDS } from "./ServiceChargesSection";
import DateInput from "../ui/DateInput.jsx";
import SelectInput from "../ui/SelectInput.jsx";
import MoneyInput from "../ui/MoneyInput.jsx";
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
import normalizeRole from "../../utils/normalizeRole.js";

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

const IMMEDIATE_VALIDATE_FIELDS = new Set([
  "gender",
  "marital_status",
  "department",
  "designation",
  "job_type",
  "dob",
  "joined_date",
  "bank_name",
]);

const ALL_FORM_FIELDS = [
  "name",
  "nic",
  "email",
  "mobile_number",
  "address",
  "dob",
  "employee_id",
  "gender",
  "marital_status",
  "joined_date",
  "designation",
  "department",
  "job_type",
  "basic_salary",
  "password",
  "bank_name",
  "bank_branch",
  "bank_account_number",
  ...ALLOWANCE_FIELDS.map((f) => f.name),
  ...SERVICE_CHARGE_FIELDS.map((f) => f.name),
];

const validateSingleField = (name, data) => {
  switch (name) {
    case "name":
      return !data.name?.trim() ? "Name is required" : null;
    case "nic":
      return validateNic(data.nic);
    case "email":
      return validateEmail(data.email);
    case "mobile_number":
      return validateMobileNumber(data.mobile_number);
    case "address":
      return validateAddress(data.address);
    case "dob":
      return validateDobMinimumAge(data.dob);
    case "employee_id":
      return !data.employee_id?.trim() ? "Employee ID is required" : null;
    case "gender":
      return !data.gender ? "Gender is required" : null;
    case "marital_status":
      return !data.marital_status ? "Marital Status is required" : null;
    case "joined_date":
      return !data.joined_date ? "Joined Date is required" : null;
    case "designation":
      return !data.designation?.trim() ? "Designation is required" : null;
    case "department":
      return !data.department ? "Department is required" : null;
    case "job_type":
      return validateJobType(data.job_type);
    case "basic_salary":
      if (!data.basic_salary || Number(data.basic_salary) <= 0) {
        return "Basic Salary must be greater than 0";
      }
      return null;
    case "password":
      if (!data.password?.trim()) return "Password is required";
      if (data.password.length < 6) return "Password must be at least 6 characters";
      return null;
    case "bank_name":
      return !data.bank_name?.trim() ? "Please select a bank" : null;
    case "bank_branch":
      return !data.bank_branch?.trim() ? "Bank Branch is required" : null;
    case "bank_account_number":
      if (!data.bank_account_number?.trim()) {
        return "Bank Account Number is required";
      }
      if (!/^[0-9]{8,18}$/.test(data.bank_account_number)) {
        return "Bank Account Number must be 8–18 digits";
      }
      return null;
    default: {
      const isNumericProfileField =
        ALLOWANCE_FIELDS.some((f) => f.name === name) ||
        SERVICE_CHARGE_FIELDS.some((f) => f.name === name);
      if (isNumericProfileField) {
        const val = data[name];
        if (val !== "" && val != null && Number(val) < 0) {
          return "Amount cannot be negative";
        }
      }
      return null;
    }
  }
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
    job_type: "",
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
  const [touchedFields, setTouchedFields] = useState({});
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

  useEffect(() => {
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

  const setFieldError = (name, error) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const markFieldTouched = (name) => {
    setTouchedFields((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  };

  const validateAndSetFieldError = (name, data) => {
    const error = validateSingleField(name, data);
    setFieldError(name, error);
    return error;
  };

  const buildNextFormData = (name, value, files) => {
    if (name === "image") {
      return { ...formData, [name]: files[0] };
    }
    if (name === "mobile_number") {
      return { ...formData, [name]: String(value).replace(/\D/g, "") };
    }
    if (name === "department") {
      return { ...formData, department: value, designation: "" };
    }
    return { ...formData, [name]: value };
  };

  const runFieldValidation = (name, data, { markTouched = false } = {}) => {
    if (markTouched) markFieldTouched(name);
    if (touchedFields[name] || markTouched || IMMEDIATE_VALIDATE_FIELDS.has(name)) {
      validateAndSetFieldError(name, data);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormError("");

    const nextData = buildNextFormData(name, value, files);
    setFormData(nextData);

    runFieldValidation(name, nextData, {
      markTouched: IMMEDIATE_VALIDATE_FIELDS.has(name),
    });

    if (name === "department") {
      runFieldValidation("designation", nextData);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;

    let fieldValue = value;
    if (name === "mobile_number") {
      fieldValue = String(value).replace(/\D/g, "");
    }

    const nextData = { ...formData, [name]: fieldValue };
    runFieldValidation(name, nextData, { markTouched: true });
  };

  const validateForm = () => {
    const errors = {};
    for (const name of ALL_FORM_FIELDS) {
      const error = validateSingleField(name, formData);
      if (error) errors[name] = error;
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

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setTouchedFields(
        Object.fromEntries(ALL_FORM_FIELDS.map((field) => [field, true]))
      );
      focusFirstFieldError(validationErrors);
      return;
    }

    setFieldErrors({});

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
          noValidate
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
              onBlur={handleBlur}
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
                onBlur={handleBlur}
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
              onBlur={handleBlur}
              inputMode="numeric"
              maxLength={10}
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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

          {/* Job Type */}
          <div id="field-job_type">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Type <span className="text-red-500">*</span>
            </label>
            <div className={fieldErrors.job_type ? "rounded-xl ring-2 ring-red-300" : ""}>
              <SelectInput
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                required
                placeholder="Select Job Type"
                options={JOB_TYPE_OPTIONS}
              />
            </div>
            <FieldError message={fieldErrors.job_type} />
          </div>

          {/* Basic Salary */}
          <div id="field-basic_salary">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Basic Salary <span className="text-red-500">*</span>
            </label>
            <MoneyInput
              name="basic_salary"
              value={formData.basic_salary}
              onChange={handleChange}
              onBlur={handleBlur}
              hasError={Boolean(fieldErrors.basic_salary)}
              required
            />
            <FieldError message={fieldErrors.basic_salary} />
          </div>

          <AllowancesSection values={formData} onChange={handleChange} onBlur={handleBlur} fieldErrors={fieldErrors} />

          <ServiceChargesSection values={formData} onChange={handleChange} onBlur={handleBlur} fieldErrors={fieldErrors} />

          {/* Bank Name */}
            <div id="field-bank_name">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <div className={fieldErrors.bank_name ? "rounded-xl ring-2 ring-red-300" : ""}>
                <SelectInput
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  required
                  placeholder="Select Bank"
                  searchable
                  options={SRI_LANKA_BANK_OPTIONS}
                />
              </div>
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
                onBlur={handleBlur}
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
                onBlur={handleBlur}
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
              onBlur={handleBlur}
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