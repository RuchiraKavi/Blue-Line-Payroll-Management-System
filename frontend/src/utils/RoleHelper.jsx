import axios from "axios";

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
    width: "80px",
    sortable: true,
  },
  {
    name: "Role Key",
    selector: (row) => row.key,
    sortable: true,
    grow: 1,
  },
  {
    name: "Label",
    selector: (row) => row.label,
    sortable: true,
    grow: 1.5,
  },
  {
    name: "Type",
    cell: (row) => (
      <span
        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
          row.isSystem
            ? "bg-indigo-100 text-indigo-800"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {row.isSystem ? "System" : "Custom"}
      </span>
    ),
    width: "120px",
  },
  {
    name: "Actions",
    cell: (row) => (
      <div className="flex gap-1 justify-center">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
          onClick={() => onEdit(row)}
          title="Edit Role"
        >
          Edit
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-linear-to-r from-red-500 to-rose-500 rounded-md hover:from-red-600 hover:to-rose-600 focus:ring-2 focus:ring-red-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:transform-none"
          onClick={() => onDelete(row)}
          disabled={row.isSystem}
          title={row.isSystem ? "System roles cannot be deleted" : "Delete Role"}
        >
          Delete
        </button>
      </div>
    ),
    width: "180px",
    center: true,
  },
];
