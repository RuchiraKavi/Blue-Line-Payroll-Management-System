import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from 'react-data-table-component'
import { columns } from '../../utils/DepartmentHelper'
import axios from 'axios'

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [depLoading, setDepLoading] = useState(true);

  const fetchDepartments = async () => {
    setDepLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/departments', {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.data.success) {
        let sno = 1;
        const data = response.data.departments.map(dep => ({
          _id: dep._id,
          sno: sno++,
          dep_name: dep.dep_name,
        }));

        setDepartments(data);
        setFilteredDepartments(data);
      }

    } catch (error) {
          if(error.response && !error.response.data.success){
              alert("Error:", error.response.data.message);
          }
      } finally {
      setDepLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filterDepartments = (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = departments.filter(dep =>
      dep.dep_name.toLowerCase().includes(keyword)
    );
    setFilteredDepartments(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Department Management
          </h1>
          <p className="text-gray-600 text-lg">Manage and organize your departments effectively</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Controls Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

            {/* Enhanced Search */}
            <div className="relative w-full lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search departments by name..."
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                onChange={filterDepartments}
              />
            </div>

            {/* Enhanced Add button */}
            <Link
              to="/admin-dashboard/add-department"
              className="group relative overflow-hidden px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-blue-300 whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add New Department
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>

          </div>
        </div>

        {/* Enhanced DataTable Section */}
        <div className="p-8">
          {depLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading departments...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredDepartments.length}</span> of <span className="font-semibold text-gray-900">{departments.length}</span> departments
                </div>
              </div>

              <DataTable
                columns={columns(fetchDepartments)}
                data={filteredDepartments}
                highlightOnHover
                responsive
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20]}
                striped
                noDataComponent={
                  <div className="py-20 text-center">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No departments found</h3>
                    <p className="text-gray-400 mb-6">Get started by adding your first department</p>
                    <Link
                      to="/admin-dashboard/add-department"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add First Department
                    </Link>
                  </div>
                }
                customStyles={{
                  header: {
                    style: {
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #e5e7eb',
                      minHeight: '56px',
                    },
                  },
                  headRow: {
                    style: {
                      backgroundColor: '#f8fafc',
                      borderBottom: '2px solid #e2e8f0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#475569',
                      minHeight: '56px',
                    },
                  },
                  headCells: {
                    style: {
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#475569',
                    },
                  },
                  rows: {
                    style: {
                      fontSize: '14px',
                      color: '#374151',
                      minHeight: '72px',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                      },
                    },
                    stripedStyle: {
                      backgroundColor: '#fafafa',
                    },
                  },
                  cells: {
                    style: {
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      fontSize: '14px',
                    },
                  },
                  pagination: {
                    style: {
                      borderTop: '2px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      color: '#374151',
                      padding: '16px',
                    },
                  },
                }}
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default DepartmentList;
