import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SelectInput from "../ui/SelectInput.jsx";
import {
  assignDesignationToDepartment,
  fetchAllDesignations,
  fetchDepartmentDesignations,
  fetchDepartments,
  unassignDesignationFromDepartment,
} from "../../utils/DesignationHelper";

const AssignDesignation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetDepartmentId = searchParams.get("departmentId") || "";

  const [departments, setDepartments] = useState([]);
  const [masterDesignations, setMasterDesignations] = useState([]);
  const [assignedDesignations, setAssignedDesignations] = useState([]);
  const [departmentId, setDepartmentId] = useState(presetDepartmentId);
  const [loading, setLoading] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [assigningId, setAssigningId] = useState("");
  const [removingId, setRemovingId] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedDepartment = departments.find((dep) => dep._id === departmentId);

  const availableDesignations = useMemo(() => {
    const assignedIds = new Set(assignedDesignations.map((d) => d._id));
    return masterDesignations.filter((d) => !assignedIds.has(d._id));
  }, [masterDesignations, assignedDesignations]);

  const filteredAvailable = useMemo(() => {
    const keyword = availableSearch.trim().toLowerCase();
    if (!keyword) return availableDesignations;
    return availableDesignations.filter((d) =>
      d.title.toLowerCase().includes(keyword)
    );
  }, [availableDesignations, availableSearch]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [deps, masters] = await Promise.all([
        fetchDepartments(),
        fetchAllDesignations(),
      ]);
      setDepartments(deps);
      setMasterDesignations(masters);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (presetDepartmentId) {
      setDepartmentId(presetDepartmentId);
    }
  }, [presetDepartmentId]);

  useEffect(() => {
    const loadAssigned = async () => {
      if (!departmentId) {
        setAssignedDesignations([]);
        return;
      }
      setLoadingAssigned(true);
      const assigned = await fetchDepartmentDesignations(departmentId);
      setAssignedDesignations(assigned);
      setAvailableSearch("");
      setLoadingAssigned(false);
    };
    loadAssigned();
  }, [departmentId]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const refreshAssigned = async () => {
    if (!departmentId) return;
    const assigned = await fetchDepartmentDesignations(departmentId);
    setAssignedDesignations(assigned);
  };

  const handleAssign = async (designationId) => {
    if (!departmentId || !designationId || actionLoading) return;

    setError("");
    setMessage("");
    setActionLoading(true);
    setAssigningId(designationId);

    try {
      const result = await assignDesignationToDepartment(
        departmentId,
        designationId
      );
      if (result.success) {
        setMessage("Designation assigned successfully");
        await refreshAssigned();
      } else {
        setError(result.message || "Failed to assign designation");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to assign designation"
      );
    } finally {
      setActionLoading(false);
      setAssigningId("");
    }
  };

  const handleUnassign = async (designation) => {
    const confirmRemove = window.confirm(
      `Remove "${designation.title}" from ${selectedDepartment?.dep_name || "this department"}?`
    );
    if (!confirmRemove) return;

    setError("");
    setMessage("");
    setActionLoading(true);
    setRemovingId(designation._id);

    try {
      const result = await unassignDesignationFromDepartment(
        departmentId,
        designation._id
      );
      if (result.success) {
        setMessage("Designation removed from department");
        await refreshAssigned();
      } else {
        setError(result.message || "Failed to remove designation");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to remove designation"
      );
    } finally {
      setActionLoading(false);
      setRemovingId("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-600">Loading departments and designations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Assign Designation
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Link job titles from the master list to a department. Employees in that department can only use assigned designations.
                </p>
              </div>
            </div>
          </div>

          {/* Page body */}
          <div className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 text-sm font-medium">{message}</p>
              </div>
            )}

            {departments.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold mb-1">No departments yet</p>
                <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                  Create a department before you can assign designations to it.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard/add-department")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Department
                </button>
              </div>
            ) : (
              <>
                {/* Department selector */}
                <div>
                  <label
                    htmlFor="departmentId"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    id="departmentId"
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setError("");
                      setMessage("");
                    }}
                    placeholder="Select a department"
                    options={[
                      { value: "", label: "Select a department" },
                      ...departments.map((dep) => ({
                        value: dep._id,
                        label: dep.dep_name,
                      })),
                    ]}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Choose the department you want to manage designations for.
                  </p>
                </div>

                {!departmentId && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-indigo-800">
                      Select a department above to view assigned designations and add new ones from the master list.
                    </p>
                  </div>
                )}

                {departmentId && (
                  <>
                    {/* Summary strip */}
                    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-linear-to-r from-slate-50 to-blue-50 border border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-indigo-600 shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Selected</p>
                          <p className="text-base font-bold text-gray-900 truncate">
                            {selectedDepartment?.dep_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:ml-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                          {assignedDesignations.length} assigned
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {availableDesignations.length} available
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {masterDesignations.length} in master list
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Assigned panel */}
                      <section className="rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[280px]">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
                          <h2 className="text-sm font-bold text-gray-800">
                            Assigned designations
                          </h2>
                          {!loadingAssigned && (
                            <span className="text-xs font-medium text-gray-500">
                              {assignedDesignations.length} total
                            </span>
                          )}
                        </div>
                        <div className="p-4 flex-1">
                          {loadingAssigned ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                              <span className="inline-block w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                              <p className="text-xs text-gray-500">Loading assignments...</p>
                            </div>
                          ) : assignedDesignations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-700">Nothing assigned yet</p>
                              <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                                Pick designations from the master list on the right to assign them here.
                              </p>
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {assignedDesignations.map((des) => (
                                <li
                                  key={des._id}
                                  className="flex items-center justify-between gap-2 px-3 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl group hover:border-indigo-200 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                      {des.title}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleUnassign(des)}
                                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    title={`Remove ${des.title}`}
                                  >
                                    {removingId === des._id ? (
                                      <span className="inline-block w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </section>

                      {/* Available panel */}
                      <section className="rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[280px]">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h2 className="text-sm font-bold text-gray-800">
                              Master list — click to assign
                            </h2>
                            {!loadingAssigned && availableDesignations.length > 0 && (
                              <span className="text-xs font-medium text-gray-500">
                                {filteredAvailable.length} shown
                              </span>
                            )}
                          </div>
                          {availableDesignations.length > 4 && (
                            <input
                              type="text"
                              value={availableSearch}
                              onChange={(e) => setAvailableSearch(e.target.value)}
                              placeholder="Search designations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                            />
                          )}
                        </div>
                        <div className="p-4 flex-1">
                          {masterDesignations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <p className="text-sm font-medium text-amber-800 mb-1">
                                No designations in master list
                              </p>
                              <p className="text-xs text-gray-500 mb-4">
                                Add job titles to the master list first.
                              </p>
                              <Link
                                to="/admin-dashboard/add-designation"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Designation
                              </Link>
                            </div>
                          ) : availableDesignations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-700">All caught up</p>
                              <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                                Every master designation is already assigned to this department.
                              </p>
                            </div>
                          ) : filteredAvailable.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                              No designations match &quot;{availableSearch}&quot;.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {filteredAvailable.map((des) => (
                                <button
                                  key={des._id}
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleAssign(des._id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-left rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 disabled:opacity-50 transition-all"
                                >
                                  {assigningId === des._id ? (
                                    <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                                  ) : (
                                    <svg className="w-3.5 h-3.5 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  )}
                                  {des.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 space-y-2">
                      <p className="text-sm text-indigo-900 font-semibold">How it works</p>
                      <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
                        <li>Select a department to manage its designation set.</li>
                        <li>Click a title on the right to assign it instantly.</li>
                        <li>Use Remove on the left to unlink a designation from this department only.</li>
                      </ol>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/admin-dashboard/departments")}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Departments
              </button>
              <Link
                to="/admin-dashboard/designations"
                className="flex-1 py-3 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors text-center"
              >
                Designation List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignDesignation;
