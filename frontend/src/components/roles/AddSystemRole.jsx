import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createRole } from "../../utils/RoleHelper";
import PermissionMatrix from "./PermissionMatrix.jsx";
import { emptyPermissions } from "../../utils/permissionSections.js";
import { keyToRoleLabel } from "../../utils/roleConstants.js";

const AddSystemRole = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    key: "",
  });
  const [permissions, setPermissions] = useState(emptyPermissions());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.key.trim()) {
      setError("Role key is required");
      return;
    }

    const hasAnyPermission = Object.values(permissions).some((section) =>
      Object.values(section).some(Boolean)
    );
    if (!hasAnyPermission) {
      setError("Select at least one permission for this role");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createRole(
        formData.key.trim(),
        keyToRoleLabel(formData.key),
        permissions
      );
      if (result.success) {
        navigate("/admin-dashboard/roles");
      } else {
        setError(result.message || "Failed to add role");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add role"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200 bg-linear-to-r from-gray-50 to-blue-50">
            <Link
              to="/admin-dashboard/roles"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Role List
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
                  Add a new role and set CRUD permissions for each section.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="key"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Role Key <span className="text-red-500">*</span>
                </label>
                <input
                  id="key"
                  name="key"
                  type="text"
                  value={formData.key}
                  onChange={handleChange}
                  placeholder="e.g. supervisor"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  Lowercase letters, numbers, and underscores only.
                </p>
              </div>

              <PermissionMatrix value={permissions} onChange={setPermissions} />

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard/roles")}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Role"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSystemRole;
