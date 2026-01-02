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
      className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-900"
      onClick={handleView}
    >
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
