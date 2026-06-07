import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createDesignation } from "../../utils/DesignationHelper";

const EXAMPLE_TITLES = [
  "Production Supervisor",
  "Quality Inspector",
  "Accountant",
  "Maintenance Technician",
  "Marketing Executive",
  "Production Operator",
  "Quality Controller",
  "Accounts Executive",
  "Maintenance Supervisor",
  "HR Executive",
];

const AddDesignation = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Designation title is required");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDesignation(title.trim());
      if (result.success) {
        navigate("/admin-dashboard/designations");
      } else {
        setError(result.message || "Failed to add designation");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add designation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const applyExample = (example) => {
    setTitle(example);
    setError("");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Page header */}
          <div className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200 bg-linear-to-r from-gray-50 to-blue-50">
            <Link
              to="/admin-dashboard/designations"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Designation List
            </Link>

            <div className="flex items-start gap-4">
              <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Add Designation
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Add a job title to the master list. Assign it to departments separately.
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
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Designation Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Production Supervisor"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  Use a clear, unique title. Duplicates are not allowed in the master list.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Quick examples
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {EXAMPLE_TITLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => applyExample(example)}
                      className={`px-2 py-2 text-xs font-medium text-center rounded-lg border transition-colors ${
                        title === example
                          ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-700"
                      }`}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 space-y-2">
                <p className="text-sm text-indigo-900 font-semibold">How it works</p>
                <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
                  <li>Add the designation here (master list).</li>
                  <li>Open Assign Designation to link it to one or more departments.</li>
                  <li>Employees can then be registered with that designation per department.</li>
                </ol>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard/designations")}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Designation
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

export default AddDesignation;
