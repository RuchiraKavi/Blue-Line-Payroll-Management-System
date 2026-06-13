/* eslint-disable react-refresh/only-export-components */

import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "../components/common/ProfileAvatar.jsx";
import { API_BASE } from "./apiConfig.js";

export const columns = (refreshEmployees) => [
  { name: "Serial.No", selector: (row) => row.sno, width: "90px", center: true, grow: 0 },
  {
    name: "Name",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "140px",
    grow: 1,
    wrap: true,
  },
  {
    name: "Image",
    width: "90px",
    center: true,
    grow: 0,
    cell: (row) => <ProfileAvatar name={row.name} filename={row.image} />,
  },
  {
    name: "Department",
    selector: (row) => row.dep_name,
    sortable: true,
    minWidth: "120px",
    width: "140px",
    grow: 0,
    wrap: true,
  },
  {
    name: "Joined Date",
    selector: (row) => row.joined_date,
    sortable: true,
    width: "120px",
    grow: 0,
  },
  {
    name: "Actions",
    width: "360px",
    minWidth: "360px",
    grow: 0,
    center: true,
    cell: (row) => <EmployeeButtons _id={row._id} refresh={refreshEmployees} />,
  },
];

export const employeeTableCustomStyles = {
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
      paddingLeft: "12px",
      paddingRight: "12px",
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
      },
    },
    stripedStyle: {
      backgroundColor: "#fafafa",
    },
  },
  cells: {
    style: {
      paddingLeft: "12px",
      paddingRight: "12px",
      fontSize: "14px",
      overflow: "visible",
    },
  },
  table: {
    style: {
      tableLayout: "auto",
      width: "max-content",
      minWidth: "100%",
    },
  },
  tableWrapper: {
    style: {
      display: "block",
      overflow: "visible",
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

export const fetchDesignationsByDepartment = async (departmentId) => {
  if (!departmentId) return [];

  try {
    const response = await axios.get(
      `${API_BASE}/departments/${departmentId}/designations`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    return response.data.success ? response.data.designations : [];
  } catch (error) {
    alert(error.response?.data?.message || "Error fetching designations");
    return [];
  }
};

export const fetchDepartments = async () => {
  try {
    const response = await axios.get(`${API_BASE}/departments`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    return response.data.success ? response.data.departments : [];
  } catch (error) {
    alert(error.response?.data?.message || "Error fetching departments");
    return [];
  }
};

export const EmployeeButtons = ({ _id, refresh }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 w-full max-w-[360px] mx-auto">
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-white bg-linear-to-r from-green-500 to-emerald-500 rounded-md hover:from-green-600 hover:to-emerald-600 focus:ring-2 focus:ring-green-200 transition-colors shadow-sm whitespace-nowrap"
        onClick={() => navigate(`/admin-dashboard/employees/${_id}`)}
        title="View Employee Details"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
        View
      </button>

      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-colors shadow-sm whitespace-nowrap"
        onClick={() => navigate(`/admin-dashboard/employees/edit/${_id}`)}
        title="Edit Employee"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        Edit
      </button>

      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-white bg-linear-to-r from-yellow-500 to-amber-500 rounded-md hover:from-yellow-600 hover:to-amber-600 focus:ring-2 focus:ring-yellow-200 transition-colors shadow-sm whitespace-nowrap"
        onClick={() => navigate(`/admin-dashboard/employees/salary/${_id}`)}
        title="View Salary History"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Salary
      </button>

      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-white bg-linear-to-r from-orange-500 to-red-500 rounded-md hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-200 transition-colors shadow-sm whitespace-nowrap"
        onClick={() => navigate(`/admin-dashboard/employees/leaves/${_id}`)}
        title="Manage Leaves"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        Leave
      </button>
    </div>
  );
};
