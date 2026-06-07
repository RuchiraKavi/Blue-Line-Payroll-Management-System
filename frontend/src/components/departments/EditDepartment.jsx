import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditDepartment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [department, setDepartment] = useState({
    dep_name: "",
    description: "",
  });
  const [depLoading, setDepLoading] = useState(false);

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  useEffect(() => {
    const fetchDepartment = async () => {
      setDepLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/departments/${id}`,
          { headers: authHeaders }
        );
        if (response.data.success) {
          setDepartment(response.data.department);
        }
      } catch (error) {
        if (error.response && !error.response.data.success) {
          alert("Error:", error.response.data.message);
        }
      } finally {
        setDepLoading(false);
      }
    };
    fetchDepartment();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartment({ ...department, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/departments/${id}`,
        department,
        { headers: authHeaders }
      );
      if (response.data.success) {
        navigate("/admin-dashboard/departments");
      }
    } catch (error) {
      if (error.response && !error.response.data.success) {
        alert("Error:", error.response.data.message);
      }
    }
  };

  if (depLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8 space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">Edit Department</h3>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="dep_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Department Name
            </label>
            <input
              type="text"
              name="dep_name"
              id="dep_name"
              placeholder="Department Name"
              onChange={handleChange}
              value={department.dep_name || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              name="description"
              id="description"
              placeholder="Description"
              onChange={handleChange}
              value={department.description || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-28 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Save Department
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/admin-dashboard/departments")}
          className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Back to Departments
        </button>
      </div>
    </div>
  );
};

export default EditDepartment;
