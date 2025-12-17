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
    <div className="flex space-x-3">
      <button
        className="px-3 py-1 bg-green-500 rounded"
        onClick={() => navigate(`/admin-dashboard/departments/${_id}`)}
      >
        Edit
      </button>
      
      <button
        className="px-3 py-1 bg-red-500 rounded"
        onClick={handleDelete}
      >
        Delete
      </button>
    </div>
  );
};
