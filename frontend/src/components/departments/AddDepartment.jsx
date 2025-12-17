import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const AddDepartment = () => {
    const [department, setDepartment] = useState({
        dep_name: "",
        description: ""
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDepartment({...department, [name]: value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/api/departments/add", department, {
                headers: {
                    "Authorization" : `Bearer ${localStorage.getItem("token")}`
                }
            });
            if(response.data.success){
                navigate('/admin-dashboard/departments');
            }
        } catch (error) {
            if(error.response && !error.response.data.success){
                alert("Error:", error.response.data.message);
            }
        }
    }

  return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
        <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Add Department
            </h3>

            <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Department Name */}
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
                placeholder="Department Name"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>

            {/* Description */}
            <div>
                <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
                >
                Description
                </label>
                <textarea
                name="description"
                placeholder="Description"
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-indigo-500 focus:outline-none 
                            h-28 resize-none"
                ></textarea>
            </div>

            {/* Button */}
            <button
                className="w-full bg-indigo-600 text-white py-2 rounded-lg 
                        font-semibold hover:bg-indigo-700 transition"
            >
                Add Department
            </button>
            </form>
        </div>
        </div>
    )
}

export default AddDepartment