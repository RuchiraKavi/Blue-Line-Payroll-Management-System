/* eslint-disable react-refresh/only-export-components */

import axios from "axios";
import { useNavigate } from "react-router-dom";

export const columns = (refreshEmployees) => [
  { name: 'Serial.No', selector: row => row.sno, width: "120px" },
  { name: 'Name', selector: row => row.name, sortable:true, width: "160px" },

  {
    name: 'Image', width: "140px",
    cell: row => (
      <img
        src={`http://localhost:5000/uploads/${row.image}`}
        alt="profile"
        className="w-12 h-12 rounded-full object-cover"
      />
    )
  },

  { name: 'Department', selector: row => row.dep_name, sortable:true, width: "140px"},
  { name: 'Joined Date', selector: row => row.joined_date, sortable:true, width: "200px" },

  {
    name: 'Actions', center: "true",
    cell: row => <EmployeeButtons _id={row._id} refresh={refreshEmployees} />
  }
];

export const fetchDepartments = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/departments', {
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

  const handleRemove = async () => {
    if (!window.confirm("Are you sure you want to delete this Employee?")) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/employees/${_id}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.data.success) {
        alert("Employee removed successfully");
        refresh();
      }
    } catch {
      alert("Error deleting Employee!");
    }
  };

  return (
    <div className="flex flex-wrap gap-1 justify-center max-w-64">
      <button 
        className="group relative inline-flex items-center px-4 py-0.5 text-xs font-medium text-white bg-linear-to-r from-green-500 to-emerald-500 rounded-md hover:from-green-600 hover:to-emerald-600 focus:ring-2 focus:ring-green-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
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
        className="group relative inline-flex items-center px-4 py-0.5 text-xs font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
        onClick={() => navigate(`/admin-dashboard/employees/edit/${_id}`)}
        title="Edit Employee"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        Edit
      </button>

      <button 
        className="group relative inline-flex items-center px-4 py-0.5 text-xs font-medium text-white bg-linear-to-r from-yellow-500 to-amber-500 rounded-md hover:from-yellow-600 hover:to-amber-600 focus:ring-2 focus:ring-yellow-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
        title="Manage Salary"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Salary
      </button>

      <button 
        className="group relative inline-flex items-center px-4 py-0.5 text-xs font-medium text-white bg-linear-to-r from-orange-500 to-red-500 rounded-md hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
        onClick={() => navigate(`/admin-dashboard/employees/leaves/${_id}`)}
        title="Manage Leaves"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        Leave
      </button>

      <button 
        className="group relative inline-flex items-center px-4 py-0.5 text-xs font-medium text-white bg-linear-to-r from-red-500 to-rose-500 rounded-md hover:from-red-600 hover:to-rose-600 focus:ring-2 focus:ring-red-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md" 
        onClick={handleRemove}
        title="Remove Employee"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        Remove
      </button>
    </div>
  );
};
