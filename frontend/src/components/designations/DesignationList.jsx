import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import {
  deleteDesignation,
  designationColumns,
  designationTableCustomStyles,
  fetchAllDesignations,
  updateDesignation,
} from "../../utils/DesignationHelper";

const DesignationList = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDesignations = async () => {
    setLoading(true);
    setError("");
    const list = await fetchAllDesignations();
    const mapped = list.map((des, index) => ({
      _id: des._id,
      sno: index + 1,
      title: des.title,
    }));
    setDesignations(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadDesignations();
  }, []);

  const filteredDesignations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return designations;
    return designations.filter((row) =>
      row.title.toLowerCase().includes(keyword)
    );
  }, [designations, search]);

  const handleEdit = (row) => {
    setEditRow(row);
    setEditTitle(row.title);
    setError("");
  };

  const handleCloseEdit = () => {
    setEditRow(null);
    setEditTitle("");
    setError("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editRow) return;

    if (!editTitle.trim()) {
      setError("Designation title is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await updateDesignation(editRow._id, editTitle.trim());
      if (result.success) {
        handleCloseEdit();
        await loadDesignations();
      } else {
        setError(result.message || "Failed to update designation");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update designation"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const confirmDelete = window.confirm(
      `Delete designation "${row.title}" from the master list?`
    );
    if (!confirmDelete) return;

    setError("");
    try {
      const result = await deleteDesignation(row._id);
      if (result.success) {
        await loadDesignations();
      } else {
        setError(result.message || "Failed to delete designation");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete designation"
      );
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Designation List
          </h1>
          <p className="text-gray-600 text-lg">
            Master list of designations. Assign them to departments separately.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
            <div className="relative w-full lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search designations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
            </div>

            <Link
              to="/admin-dashboard/add-designation"
              className="group relative overflow-hidden px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-blue-300 whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Designation
              </div>
            </Link>
          </div>
        </div>

        {error && !editRow && (
          <div className="mx-8 mt-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading designations...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredDesignations.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {designations.length}
                </span>{" "}
                designations
              </div>

              <DataTable
                columns={designationColumns(handleEdit, handleDelete)}
                data={filteredDesignations}
                highlightOnHover
                responsive
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                striped
                noDataComponent={
                  <div className="py-20 text-center">
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      No designations found
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Add designations to the master list first
                    </p>
                    <Link
                      to="/admin-dashboard/add-designation"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Designation
                    </Link>
                  </div>
                }
                customStyles={designationTableCustomStyles}
              />
            </>
          )}
        </div>
      </div>

      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Edit Designation
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label
                  htmlFor="editTitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Designation Title
                </label>
                <input
                  id="editTitle"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationList;
