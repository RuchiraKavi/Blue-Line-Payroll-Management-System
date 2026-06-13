import axios from "axios";
import { formatRoleLabel } from "./roleConstants.js";

/* eslint-disable react-refresh/only-export-components */

export const roleTableCustomStyles = {
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
      justifyContent: "center",
    },
  },
  rows: {
    style: {
      fontSize: "14px",
      color: "#374151",
      minHeight: "56px",
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
      justifyContent: "center",
    },
  },
  table: {
    style: {
      tableLayout: "fixed",
      width: "100%",
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

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const fetchAllRoles = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/roles", {
      headers: authHeaders(),
    });
    return response.data.success ? response.data.roles : [];
  } catch (error) {
    alert(error.response?.data?.message || "Error fetching roles");
    return [];
  }
};

export const createRole = async (key, label, permissions) => {
  const response = await axios.post(
    "http://localhost:5000/api/roles/add",
    { key, label, permissions },
    { headers: authHeaders() }
  );
  return response.data;
};

export const updateRole = async (roleId, key, label, permissions) => {
  const response = await axios.put(
    `http://localhost:5000/api/roles/${roleId}`,
    { key, label, permissions },
    { headers: authHeaders() }
  );
  return response.data;
};

export const deleteRole = async (roleId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/roles/${roleId}`,
    { headers: authHeaders() }
  );
  return response.data;
};

export const roleColumns = (onEdit, onDelete) => [
  {
    name: "S.No",
    selector: (row) => row.sno,
    grow: 1,
    center: true,
    sortable: true,
  },
  {
    name: "Role",
    selector: (row) => formatRoleLabel(row.key),
    sortable: true,
    grow: 1,
    center: true,
    cell: (row) => (
      <span className="font-medium text-gray-900">{formatRoleLabel(row.key)}</span>
    ),
  },
  {
    name: "Actions",
    grow: 1,
    center: true,
    cell: (row) => (
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => onEdit(row)}
          title="Edit Role"
        >
          Edit
        </button>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-linear-to-r from-red-500 to-rose-500 rounded-md hover:from-red-600 hover:to-rose-600 focus:ring-2 focus:ring-red-200 transition-all duration-200 shadow-sm hover:shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
          onClick={() => onDelete(row)}
          disabled={row.isSystem}
          title={row.isSystem ? "System roles cannot be deleted" : "Delete Role"}
        >
          Delete
        </button>
      </div>
    ),
  },
];
