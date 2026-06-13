import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import normalizeRole from "../../utils/normalizeRole";
import { formatRoleLabel, filterAssignableRoles } from "../../utils/roleConstants";
import { fetchAllRoles } from "../../utils/RoleHelper";
import SelectInput from "../ui/SelectInput.jsx";

const formatEmployeeListLabel = (emp) =>
  `${emp.employee_id}-${emp.name}-${emp.department}-${emp.designation}`;

const AddRole = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [masterRoles, setMasterRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    employeeId: "",
    role: "",
  });

  const assignableRoles = useMemo(
    () => filterAssignableRoles(masterRoles, user?.role),
    [masterRoles, user?.role]
  );

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp._id === formData.employeeId),
    [employees, formData.employeeId]
  );

  useEffect(() => {
    const userRole = normalizeRole(user?.role);
    if (!authLoading && (!user || !["admin", "hr"].includes(userRole))) {
      navigate("/unauthorized");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [rolesRes, employeesRes] = await Promise.all([
          fetchAllRoles(),
          axios.get("http://localhost:5000/api/employees", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

        setMasterRoles(rolesRes);

        if (employeesRes.data.success) {
          setEmployees(
            employeesRes.data.employees.map((emp) => ({
              _id: emp._id,
              name: emp.userId?.name || "N/A",
              employee_id: emp.employee_id || "N/A",
              department: emp.department?.dep_name || "N/A",
              designation: emp.designation || "N/A",
              currentRole: normalizeRole(emp.userId?.role) || "employee",
            }))
          );
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load employees and roles");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setSuccess("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyRole = (roleKey) => {
    setError("");
    setSuccess("");
    setFormData((prev) => ({ ...prev, role: roleKey }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.employeeId) {
      setError("Please select an employee");
      return;
    }
    if (!formData.role) {
      setError("Please select a role");
      return;
    }

    if (selectedEmployee && selectedEmployee.currentRole === formData.role) {
      setError("This employee already has the selected role");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/employees/${formData.employeeId}/role`,
        { role: formData.role },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        const roleLabel = formatRoleLabel(formData.role, masterRoles);
        setSuccess(
          `${selectedEmployee?.name || "Employee"}'s role updated to ${roleLabel}`
        );
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === formData.employeeId
              ? { ...emp, currentRole: formData.role }
              : emp
          )
        );
        setFormData((prev) => ({ ...prev, role: "" }));
      } else {
        setError(res.data.message || "Failed to assign role");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign role");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-600">Loading employees and roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Page header */}
          <div className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200 bg-linear-to-r from-gray-50 to-blue-50">
            <Link
              to="/admin-dashboard/role-management"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Assign Role
            </Link>

            <div className="flex items-start gap-4">
              <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Add Role
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Assign a role from the master list to one employee. For bulk updates, use Assign Role.
                </p>
              </div>
            </div>
          </div>

          {/* Page body */}
          <div className="p-6 md:p-8">
            <p className="text-sm text-gray-600 mb-6">
              Fields marked with <span className="text-red-500 font-medium">*</span> are required.
            </p>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            {employees.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold mb-1">No employees found</p>
                <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                  Register employees first before assigning roles.
                </p>
                <Link
                  to="/admin-dashboard/add-employee"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Employee
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="employeeId"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    placeholder="Select employee"
                    searchable
                    options={[
                      { value: "", label: "Select employee" },
                      ...employees.map((emp) => ({
                        value: emp._id,
                        label: formatEmployeeListLabel(emp),
                      })),
                    ]}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Format: employee number-name-department-designation
                  </p>
                </div>

                {selectedEmployee && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-indigo-100 text-indigo-600 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {formatEmployeeListLabel(selectedEmployee)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Current system role:{" "}
                        <span className="font-semibold text-indigo-800">
                          {formatRoleLabel(selectedEmployee.currentRole, masterRoles)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    New Role <span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    placeholder="Select role"
                    disabled={!formData.employeeId}
                    options={[
                      { value: "", label: "Select role" },
                      ...assignableRoles.map((role) => ({
                        value: role.key,
                        label: role.label,
                        disabled:
                          selectedEmployee?.currentRole === role.key,
                      })),
                    ]}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    You can assign:{" "}
                    <span className="font-medium text-gray-700">
                      {assignableRoles.map((role) => role.label).join(", ")}
                    </span>
                  </p>
                </div>

                {formData.employeeId && assignableRoles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Quick pick
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {assignableRoles.map((role) => {
                        const isCurrent = selectedEmployee?.currentRole === role.key;
                        const isSelected = formData.role === role.key;
                        return (
                          <button
                            key={role.key}
                            type="button"
                            disabled={isCurrent || submitting}
                            onClick={() => applyRole(role.key)}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                              isCurrent
                                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isSelected
                                ? "border-indigo-300 bg-indigo-100 text-indigo-800"
                                : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                            }`}
                          >
                            {role.label}
                            {isCurrent && " (current)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 space-y-2">
                  <p className="text-sm text-indigo-900 font-semibold">How it works</p>
                  <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
                    <li>Select the employee who needs a role change.</li>
                    <li>Choose the new role from the dropdown or quick pick chips.</li>
                    <li>Submit to save — the employee&apos;s access updates immediately.</li>
                  </ol>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate("/admin-dashboard/role-management")}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !formData.employeeId ||
                      !formData.role ||
                      selectedEmployee?.currentRole === formData.role
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Assign Role
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRole;
