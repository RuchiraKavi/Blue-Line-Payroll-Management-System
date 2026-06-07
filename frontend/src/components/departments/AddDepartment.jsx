import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const AddDepartment = () => {
  const [department, setDepartment] = useState({
    dep_name: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setDepartment({ ...department, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!department.dep_name.trim()) {
      setError("Department name is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/departments/add",
        {
          dep_name: department.dep_name.trim(),
          description: department.description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        navigate("/admin-dashboard/departments");
      } else {
        setError(response.data.message || "Failed to add department");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add department"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Page header */}
          <div className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200 bg-linear-to-r from-gray-50 to-blue-50">
            <Link
              to="/admin-dashboard/departments"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Department List
            </Link>

            <div className="flex items-start gap-4">
              <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Add Department
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Create a new department. You can assign designations to it afterward.
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

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="dep_name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dep_name"
                  name="dep_name"
                  value={department.dep_name}
                  placeholder="e.g. Human Resources"
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Description
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={department.description}
                  placeholder="Brief overview of this department's role and responsibilities..."
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white resize-none"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Next step:</span> after creating the department,
                  use <span className="font-medium">Assign Designation</span> to link job titles to it.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard/departments")}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Department
                    </>
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

export default AddDepartment;
