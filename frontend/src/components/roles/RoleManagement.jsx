import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import normalizeRole from "../../utils/normalizeRole";
import { formatRoleLabel, filterAssignableRoles } from "../../utils/roleConstants";
import { fetchAllRoles } from "../../utils/RoleHelper";
import SelectInput from "../ui/SelectInput.jsx";

const dataTableCustomStyles = {
  header: {
    style: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#374151",
      backgroundColor: "#f9fafb",
      borderBottom: "2px solid #e5e7eb",
      minHeight: "56px",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f8fafc",
      borderBottom: "2px solid #e2e8f0",
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
      minHeight: "56px",
    },
  },
  headCells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
    },
  },
  rows: {
    style: {
      fontSize: "14px",
      color: "#374151",
      minHeight: "72px",
      "&:hover": {
        backgroundColor: "#f8fafc",
        cursor: "default",
      },
    },
    stripedStyle: {
      backgroundColor: "#fafafa",
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      fontSize: "14px",
    },
  },
  pagination: {
    style: {
      borderTop: "2px solid #e5e7eb",
      backgroundColor: "#f9fafb",
      fontSize: "14px",
      color: "#374151",
      padding: "16px",
    },
  },
};

const RoleManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [masterRoles, setMasterRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const assignableRoles = useMemo(
    () => filterAssignableRoles(masterRoles, user?.role),
    [masterRoles, user?.role]
  );

  const loadMasterRoles = async () => {
    const roles = await fetchAllRoles();
    setMasterRoles(roles);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/employees", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.data.success) {
        const mapped = res.data.employees.map((emp, index) => ({
          _id: emp._id,
          sno: index + 1,
          name: emp.userId?.name || "N/A",
          employee_id: emp.employee_id || "N/A",
          dep_name: emp.department?.dep_name || "N/A",
          role: normalizeRole(emp.userId?.role) || "employee",
        }));
        setEmployees(mapped);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load employees" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterRoles();
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(keyword) ||
        emp.employee_id.toLowerCase().includes(keyword) ||
        emp.dep_name.toLowerCase().includes(keyword) ||
        emp.role.toLowerCase().includes(keyword)
    );
  }, [employees, search]);

  const handleRoleChange = async (row, newRole) => {
    if (newRole === row.role || savingId === row._id) return;

    setSavingId(row._id);
    setMessage({ type: "", text: "" });

    try {
      const res = await axios.put(
        `http://localhost:5000/api/employees/${row._id}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === row._id ? { ...emp, role: newRole } : emp
          )
        );
        setMessage({
          type: "success",
          text: `${row.name}'s role updated to ${formatRoleLabel(newRole, masterRoles)}`,
        });
      } else {
        setMessage({
          type: "error",
          text: res.data.message || "Failed to update role",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update role",
      });
    } finally {
      setSavingId(null);
    }
  };

  const columns = [
    { name: "S.No", selector: (row) => row.sno, width: "80px", sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true, grow: 1.5 },
    {
      name: "Employee ID",
      selector: (row) => row.employee_id,
      sortable: true,
    },
    {
      name: "Department",
      selector: (row) => row.dep_name,
      sortable: true,
    },
    {
      name: "Current Role",
      selector: (row) => formatRoleLabel(row.role, masterRoles),
      sortable: true,
    },
    {
      name: "Assign Role",
      cell: (row) => (
        <div className="flex items-center gap-2 py-1">
          <SelectInput
            value={row.role}
            onChange={(e) => handleRoleChange(row, e.target.value)}
            size="sm"
            searchable={assignableRoles.length > 7}
            disabled={savingId === row._id}
            options={assignableRoles.map((role) => ({
              value: role.key,
              label: role.label,
            }))}
            className="min-w-[10rem]"
          />
          {savingId === row._id && (
            <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
          )}
        </div>
      ),
      grow: 2,
      minWidth: "220px",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Assign Role
          </h1>
          <p className="text-gray-600 text-lg">
            Select a role from the dropdown to assign it instantly. New employees are registered as Employee by default.
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Controls Section */}
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
                placeholder="Search by name, ID, department, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            <p className="text-sm text-gray-600 text-center xl:text-right">
              You can assign:{" "}
              <span className="font-semibold text-gray-900">
                {assignableRoles.map((role) => role.label).join(", ")}
              </span>
            </p>
          </div>

          {search && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Search: &quot;{search}&quot;
                <button onClick={() => setSearch("")} className="ml-1 hover:text-blue-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>

        {message.text && (
          <div
            className={`mx-8 mt-6 p-4 rounded-xl border text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Enhanced DataTable Section */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading employees...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">{filteredEmployees.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{employees.length}</span> employees
                </div>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <DataTable
                columns={columns}
                data={filteredEmployees}
                progressPending={loading}
                highlightOnHover
                responsive
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                striped
                noDataComponent={
                  <div className="py-20 text-center">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No employees found</h3>
                    <p className="text-gray-400">
                      {search
                        ? "Try adjusting your search criteria"
                        : "No employees available for role assignment"}
                    </p>
                  </div>
                }
                customStyles={dataTableCustomStyles}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
