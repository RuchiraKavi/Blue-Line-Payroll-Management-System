import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import {
  deleteRole,
  fetchAllRoles,
  roleColumns,
  roleTableCustomStyles,
  updateRole,
} from "../../utils/RoleHelper";
import PermissionMatrix from "./PermissionMatrix.jsx";
import { emptyPermissions, sanitizePermissions } from "../../utils/permissionSections.js";
import { keyToRoleLabel } from "../../utils/roleConstants.js";

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [editKey, setEditKey] = useState("");
  const [editPermissions, setEditPermissions] = useState(emptyPermissions());
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    setError("");
    const list = await fetchAllRoles();
    const mapped = list.map((role, index) => ({
      _id: role._id,
      sno: index + 1,
      key: role.key,
      label: role.label,
      isSystem: role.isSystem,
      permissions: sanitizePermissions(role.permissions),
    }));
    setRoles(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return roles;
    return roles.filter(
      (row) =>
        row.key.toLowerCase().includes(keyword) ||
        row.label.toLowerCase().includes(keyword)
    );
  }, [roles, search]);

  const handleEdit = (row) => {
    setEditRow(row);
    setEditKey(row.key);
    setEditPermissions(sanitizePermissions(row.permissions));
    setError("");
  };

  const handleCloseEdit = () => {
    setEditRow(null);
    setEditKey("");
    setEditPermissions(emptyPermissions());
    setError("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editRow) return;

    if (!editKey.trim()) {
      setError("Role key is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await updateRole(
        editRow._id,
        editKey.trim(),
        keyToRoleLabel(editKey),
        editPermissions
      );
      if (result.success) {
        handleCloseEdit();
        await loadRoles();
      } else {
        setError(result.message || "Failed to update role");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update role"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const confirmDelete = window.confirm(
      `Delete role "${row.key}" from the master list?`
    );
    if (!confirmDelete) return;

    setError("");
    try {
      const result = await deleteRole(row._id);
      if (result.success) {
        await loadRoles();
      } else {
        setError(result.message || "Failed to delete role");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete role"
      );
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Role List
          </h1>
          <p className="text-gray-600 text-lg">
            Master list of system roles. Assign them to employees from Assign Role.
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
                placeholder="Search roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
            </div>

            <Link
              to="/admin-dashboard/roles/add"
              className="group relative overflow-hidden px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-blue-300 whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Role
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
                <p className="mt-4 text-gray-600 font-medium">Loading roles...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredRoles.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">{roles.length}</span>{" "}
                roles
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
              <DataTable
                columns={roleColumns(handleEdit, handleDelete)}
                data={filteredRoles}
                highlightOnHover
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                striped
                noDataComponent={
                  <div className="py-20 text-center">
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      No roles found
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Add roles to the master list first
                    </p>
                    <Link
                      to="/admin-dashboard/roles/add"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Role
                    </Link>
                  </div>
                }
                customStyles={roleTableCustomStyles}
              />
              </div>
            </>
          )}
        </div>
      </div>

      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Role</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label
                  htmlFor="editKey"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role Key
                </label>
                <input
                  id="editKey"
                  type="text"
                  value={editKey}
                  onChange={(e) => setEditKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase identifier stored on user accounts (e.g. hr, employee).
                </p>
              </div>

              <PermissionMatrix
                value={editPermissions}
                onChange={setEditPermissions}
              />

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

export default RoleList;
