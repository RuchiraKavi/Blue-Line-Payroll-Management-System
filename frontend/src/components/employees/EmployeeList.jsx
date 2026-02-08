import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { columns } from "../../utils/EmployeeHelper";

const EmployeeList = () => {
  // 🔹 States
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  /* =========================
     Fetch Employees
  ========================== */
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/employees",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        const mapped = res.data.employees.map((emp, index) => ({
          _id: emp._id,
          sno: index + 1,
          name: emp.userId?.name || "N/A",
          dep_name: emp.department?.dep_name || "N/A",
          joined_date: emp.joined_date
            ? new Date(emp.joined_date).toLocaleDateString()
            : "N/A",
          image: emp.userId?.profileImage || "",
        }));

        setEmployees(mapped);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load employees");
    }
  };

  /* =========================
     Fetch Departments
  ========================== */
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/departments",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        setDepartments(res.data.departments);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load departments");
    }
  };

  /* =========================
     Initial Load
  ========================== */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchDepartments()]);
      setLoading(false);
    };
    loadData();
  }, []);

  /* =========================
     Close dropdown on outside click
  ========================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     Toggle Department
  ========================== */
  const toggleDepartment = (depName) => {
    setSelectedDepartments((prev) =>
      prev.includes(depName)
        ? prev.filter((d) => d !== depName)
        : [...prev, depName]
    );
  };

  /* =========================
     FILTERED DATA (NO setFilteredEmployees)
  ========================== */
  const filteredEmployees = useMemo(() => {
    let data = [...employees];

    if (search) {
      data = data.filter((emp) =>
        emp.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedDepartments.length > 0) {
      data = data.filter((emp) =>
        selectedDepartments.includes(emp.dep_name)
      );
    }

    return data;
  }, [employees, search, selectedDepartments]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Employee Management
          </h1>
          <p className="text-gray-600 text-lg">Manage and organize your team effectively</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Controls Section */}
        <div className="bg-linear-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-6">

            {/* Left side: Search + Filter */}
            <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto">

              {/* Enhanced Search */}
              <div className="relative w-full lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search employees by name..."
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>

              {/* Enhanced Department Dropdown */}
              <div className="relative w-full lg:w-80" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-left focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <span className={selectedDepartments.length > 0 ? "text-gray-900 font-medium" : "text-gray-500"}>
                      {selectedDepartments.length > 0
                        ? `${selectedDepartments.length} departments selected`
                        : "Filter by departments"}
                    </span>
                  </div>
                  <svg className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {isOpen && (
                  <div className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {departments.length === 0 ? (
                        <p className="px-4 py-3 text-gray-500 text-center">No departments available</p>
                      ) : (
                        <>
                          {selectedDepartments.length > 0 && (
                            <button
                              onClick={() => setSelectedDepartments([])}
                              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg mb-1 font-medium"
                            >
                              Clear all filters
                            </button>
                          )}
                          {departments.map((dep) => (
                            <label
                              key={dep._id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150 group"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDepartments.includes(dep.dep_name)}
                                onChange={() => toggleDepartment(dep.dep_name)}
                                className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                                {dep.dep_name}
                              </span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right side: Enhanced Add button */}
            <Link
              to="/admin-dashboard/add-employee"
              className="group relative overflow-hidden px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-blue-300 whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add New Employee
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>

          </div>

          {/* Filter Summary */}
          {(search || selectedDepartments.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Search: "{search}"
                  <button onClick={() => setSearch("")} className="ml-1 hover:text-blue-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              )}
              {selectedDepartments.map((dept) => (
                <span key={dept} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {dept}
                  <button onClick={() => toggleDepartment(dept)} className="ml-1 hover:text-indigo-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced DataTable Section */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading employees...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredEmployees.length}</span> of <span className="font-semibold text-gray-900">{employees.length}</span> employees
                </div>
                {filteredEmployees.length !== employees.length && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedDepartments([]);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <DataTable
                columns={columns(fetchEmployees)}
                data={filteredEmployees}
                progressPending={loading}
                highlightOnHover
                responsive
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                striped
                noDataComponent={
                  <div className="py-20 text-center">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No employees found</h3>
                    <p className="text-gray-400 mb-6">
                      {search || selectedDepartments.length > 0 
                        ? "Try adjusting your search or filter criteria" 
                        : "Get started by adding your first employee"
                      }
                    </p>
                    {!search && selectedDepartments.length === 0 && (
                      <Link
                        to="/admin-dashboard/add-employee"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add First Employee
                      </Link>
                    )}
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

export default EmployeeList;
