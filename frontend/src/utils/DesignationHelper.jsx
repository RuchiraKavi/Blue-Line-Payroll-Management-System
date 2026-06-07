import axios from "axios";

/* eslint-disable react-refresh/only-export-components */

export const designationTableCustomStyles = {
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

export const fetchAllDesignations = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/designations", {
      headers: authHeaders(),
    });
    return response.data.success ? response.data.designations : [];
  } catch (error) {
    alert(error.response?.data?.message || "Error fetching designations");
    return [];
  }
};

export const fetchDepartments = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api/departments", {
      headers: authHeaders(),
    });
    return response.data.success ? response.data.departments : [];
  } catch (error) {
    alert(error.response?.data?.message || "Error fetching departments");
    return [];
  }
};

export const fetchDepartmentDesignations = async (departmentId) => {
  if (!departmentId) return [];

  try {
    const response = await axios.get(
      `http://localhost:5000/api/departments/${departmentId}/designations`,
      { headers: authHeaders() }
    );
    return response.data.success ? response.data.designations : [];
  } catch (error) {
    alert(error.response?.data?.message || "Error fetching department designations");
    return [];
  }
};

export const createDesignation = async (title) => {
  const response = await axios.post(
    "http://localhost:5000/api/designations/add",
    { title },
    { headers: authHeaders() }
  );
  return response.data;
};

export const updateDesignation = async (designationId, title) => {
  const response = await axios.put(
    `http://localhost:5000/api/designations/${designationId}`,
    { title },
    { headers: authHeaders() }
  );
  return response.data;
};

export const deleteDesignation = async (designationId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/designations/${designationId}`,
    { headers: authHeaders() }
  );
  return response.data;
};

export const assignDesignationToDepartment = async (
  departmentId,
  designationId
) => {
  const response = await axios.post(
    `http://localhost:5000/api/departments/${departmentId}/designations/assign`,
    { designationId },
    { headers: authHeaders() }
  );
  return response.data;
};

export const unassignDesignationFromDepartment = async (
  departmentId,
  designationId
) => {
  const response = await axios.delete(
    `http://localhost:5000/api/departments/${departmentId}/designations/${designationId}`,
    { headers: authHeaders() }
  );
  return response.data;
};

export const designationColumns = (onEdit, onDelete) => [
  {
    name: "S.No",
    selector: (row) => row.sno,
    width: "80px",
    sortable: true,
  },
  {
    name: "Designation",
    selector: (row) => row.title,
    sortable: true,
    grow: 2,
  },
  {
    name: "Actions",
    cell: (row) => (
      <div className="flex gap-1 justify-center">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
          onClick={() => onEdit(row)}
          title="Edit Designation"
        >
          Edit
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-linear-to-r from-red-500 to-rose-500 rounded-md hover:from-red-600 hover:to-rose-600 focus:ring-2 focus:ring-red-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
          onClick={() => onDelete(row)}
          title="Delete Designation"
        >
          Delete
        </button>
      </div>
    ),
    width: "180px",
    center: true,
  },
];
