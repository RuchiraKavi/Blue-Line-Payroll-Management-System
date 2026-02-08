/* eslint-disable react-refresh/only-export-components */

// src/utils/LeaveHelper.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Leave action buttons
export const LeaveButtons = ({ Id }) => {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/admin-dashboard/leaves/${Id}`);
  };

  return (
    <button
      className="group relative inline-flex items-center px-6 py-0.5 text-xs font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
      onClick={handleView}
      title="View Leave Details"
    >
      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
      </svg>
      View
    </button>
  );
};

// DataTable columns
export const columns = [
  { name: "S.No", selector: (row) => row.sno, sortable: true, width: "80px" },
  { name: "Employee", selector: (row) => row.name, sortable: true },
  { name: "Department", selector: (row) => row.dep_name, sortable: true },
  { name: "Leave Type", selector: (row) => row.leave_type, sortable: true },
  {
    name: "Days",
    selector: (row) => row.days,
    sortable: true,
    center: true,
    width: "80px",
  },
  { name: "Reason", selector: (row) => row.reason, wrap: true },
  {
    name: "Status",
    selector: (row) => row.status,
    sortable: true,
    cell: (row) => (
      <span
        className={`px-2 py-1 rounded text-sm font-semibold ${
          row.status === "Approved"
            ? "bg-green-100 text-green-700"
            : row.status === "Rejected"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    name: "Action",
    cell: (row) => <LeaveButtons Id={row._id} />,
    ignoreRowClick: true,
    button: true,
  },
];
