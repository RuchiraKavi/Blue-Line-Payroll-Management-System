import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { fetchDesignations } from '../../utils/DepartmentHelper'

const EditDepartment = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [department, setDepartment] = useState({
        dep_name: "",
        description: ""
    });
    const [depLoading, setDepLoading] = useState(false);
    const [designations, setDesignations] = useState([]);
    const [desLoading, setDesLoading] = useState(false);
    const [newDesignation, setNewDesignation] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [desError, setDesError] = useState("");

    const authHeaders = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };

    const loadDesignations = async () => {
        setDesLoading(true);
        setDesError("");
        const list = await fetchDesignations(id);
        setDesignations(list);
        setDesLoading(false);
    };

    useEffect(() => {
        const fetchDepartment = async () => {
            setDepLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/departments/${id}`, {
                    headers: authHeaders,
                });
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
        loadDesignations();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDepartment({ ...department, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`http://localhost:5000/api/departments/${id}`, department, {
                headers: authHeaders,
            });
            if (response.data.success) {
                navigate('/admin-dashboard/departments');
            }
        } catch (error) {
            if (error.response && !error.response.data.success) {
                alert("Error:", error.response.data.message);
            }
        }
    };

    const handleAddDesignation = async (e) => {
        e.preventDefault();
        setDesError("");

        if (!newDesignation.trim()) {
            setDesError("Designation title is required");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/departments/${id}/designations`,
                { title: newDesignation.trim() },
                { headers: authHeaders }
            );

            if (response.data.success) {
                setNewDesignation("");
                await loadDesignations();
            }
        } catch (error) {
            setDesError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to add designation"
            );
        }
    };

    const handleStartEdit = (des) => {
        setEditingId(des._id);
        setEditingTitle(des.title);
        setDesError("");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingTitle("");
    };

    const handleSaveEdit = async (designationId) => {
        setDesError("");

        if (!editingTitle.trim()) {
            setDesError("Designation title is required");
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:5000/api/departments/${id}/designations/${designationId}`,
                { title: editingTitle.trim() },
                { headers: authHeaders }
            );

            if (response.data.success) {
                setEditingId(null);
                setEditingTitle("");
                await loadDesignations();
            }
        } catch (error) {
            setDesError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to update designation"
            );
        }
    };

    const handleDeleteDesignation = async (designationId, title) => {
        const confirmDelete = window.confirm(
            `Delete designation "${title}"? This cannot be undone if employees use it.`
        );
        if (!confirmDelete) return;

        setDesError("");
        try {
            const response = await axios.delete(
                `http://localhost:5000/api/departments/${id}/designations/${designationId}`,
                { headers: authHeaders }
            );

            if (response.data.success) {
                await loadDesignations();
            }
        } catch (error) {
            setDesError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to delete designation"
            );
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
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8 space-y-8">
                <h3 className="text-2xl font-semibold text-gray-800">
                    Edit Department
                </h3>

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

                <hr className="border-gray-200" />

                <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">
                        Department Designations
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Add job titles available for employees in this department.
                    </p>

                    {desError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {desError}
                        </div>
                    )}

                    <form onSubmit={handleAddDesignation} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newDesignation}
                            onChange={(e) => setNewDesignation(e.target.value)}
                            placeholder="e.g. Software Engineer"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition whitespace-nowrap"
                        >
                            Add Designation
                        </button>
                    </form>

                    {desLoading ? (
                        <p className="text-gray-500 text-sm">Loading designations...</p>
                    ) : designations.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">
                            No designations yet. Add one above.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {designations.map((des) => (
                                <li
                                    key={des._id}
                                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50"
                                >
                                    {editingId === des._id ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(des._id)}
                                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 font-medium text-gray-800">
                                                {des.title}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(des)}
                                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDesignation(des._id, des.title)}
                                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/admin-dashboard/departments')}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                    Back to Departments
                </button>
            </div>
        </div>
    );
};

export default EditDepartment;
