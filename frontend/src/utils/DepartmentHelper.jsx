import { useNavigate } from "react-router-dom";
import axios from "axios";

/* eslint-disable react-refresh/only-export-components */

// columns now receive fetchDepartments as a parameter
export const columns = (refreshDepartments) => [
  {
    name: 'Serial.No',
    selector: row => row.sno
  },
  {
    name: 'Department Name',
    selector: row => row.dep_name
  },
  {
    name: 'Actions',
    cell: row => <DepartmentButtons _id={row._id} refresh={refreshDepartments} />
  }
];


export const DepartmentButtons = ({ _id, refresh }) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this department?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/departments/${_id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.data.success) {
        refresh(); // 🔥 refresh table after delete
      }

    } catch {
      alert("Error deleting department!");
    }
  };

  return (
    <div className="flex gap-1 justify-center">
      <button
        className="group relative inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
        onClick={() => navigate(`/admin-dashboard/departments/${_id}`)}
        title="Edit Department"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        Edit
      </button>
      
      <button
        className="group relative inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-linear-to-r from-red-500 to-rose-500 rounded-md hover:from-red-600 hover:to-rose-600 focus:ring-2 focus:ring-red-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
        onClick={handleDelete}
        title="Delete Department"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        Delete
      </button>
    </div>
  );
};
