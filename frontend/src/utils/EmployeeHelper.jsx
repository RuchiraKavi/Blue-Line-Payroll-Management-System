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
    <div className="flex space-x-3">
      <button className="px-3 py-1 bg-green-500 rounded"
        onClick={() => navigate(`/admin-dashboard/employees/${_id}`)}>
        View
      </button>

      <button className="px-3 py-1 bg-blue-500 rounded"
        onClick={() => navigate(`/admin-dashboard/employees/edit/${_id}`)}>
        Edit
      </button>

      <button className="px-3 py-1 bg-yellow-500 rounded">Salary</button>
      <button className="px-3 py-1 bg-orange-500 rounded">Leave</button>

      <button className="px-3 py-1 bg-red-500 rounded" onClick={handleRemove}>
        Remove
      </button>
    </div>
  );
};
