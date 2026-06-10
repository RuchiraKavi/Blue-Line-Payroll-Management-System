import { useNavigate } from "react-router-dom";
import axios from "axios";

/* eslint-disable react-refresh/only-export-components */

export const columns = (expandProps = {}) => {
  const { expandedRowId, onToggleExpand } = expandProps;

  return [
    {
      name: "",
      width: "52px",
      center: true,
      cell: (row) => (
        <button
          type="button"
          onClick={() => onToggleExpand?.(row)}
          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
          title={`View designations for ${row.dep_name}`}
          aria-expanded={expandedRowId === row._id}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              expandedRowId === row._id ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      ),
    },
    {
      name: "Serial.No",
      selector: (row) => row.sno,
    },
    {
      name: "Department Name",
      selector: (row) => row.dep_name,
    },
    {
      name: "Actions",
      cell: (row) => (
        <DepartmentButtons
          _id={row._id}
          dep_name={row.dep_name}
        />
      ),
      width: "220px",
    },
  ];
};

export const fetchDesignations = async (departmentId) => {
  if (!departmentId) return [];

  try {
    const response = await axios.get(
      `http://localhost:5000/api/departments/${departmentId}/designations`,
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

export const DepartmentButtons = ({ _id, dep_name }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      <button
        type="button"
        className="group relative inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-linear-to-r from-emerald-500 to-teal-500 rounded-md hover:from-emerald-600 hover:to-teal-600 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
        onClick={() =>
          navigate(`/admin-dashboard/assign-designation?departmentId=${_id}`)
        }
        title={`Assign designations to ${dep_name}`}
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Designation
      </button>

      <button
        type="button"
        className="group relative inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-linear-to-r from-blue-500 to-indigo-500 rounded-md hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
        onClick={() => navigate(`/admin-dashboard/departments/${_id}`)}
        title="Edit Department"
      >
        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        Edit
      </button>
    </div>
  );
};
