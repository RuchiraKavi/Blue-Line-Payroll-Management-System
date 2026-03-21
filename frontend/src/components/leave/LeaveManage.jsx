import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { columns, leaveDataTableCustomStyles, leaveTypeLabels } from "../../utils/LeaveHelper";

const LeaveManage = () => {
  // 🔹 States
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================
     Fetch Leaves
  ========================== */
  const fetchLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaves", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.success) {
        const mapped = res.data.leaves.map((leave, index) => {
          const start = leave.startDate ? new Date(leave.startDate) : null;
          const end = leave.endDate ? new Date(leave.endDate) : null;

          let days = 0;
          if (start && end && !isNaN(start) && !isNaN(end)) {
            days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          }

          return {
            _id: leave._id,
            sno: index + 1,
            name: leave.employeeId?.userId?.name || "N/A",
            dep_name: leave.employeeId?.department?.dep_name || "N/A",
            leave_type: leaveTypeLabels[leave.leaveType] || leave.leaveType,
            days,
            reason: leave.reason,
            status: leave.status,
          };
        });

        setLeaves(mapped);
      } else {
        setLeaves([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load leaves");
    }
  };

  /* =========================
     Initial Load with loading state
  ========================== */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchLeaves();
      setLoading(false);
    };
    loadData();
  }, []);

  /* =========================
     Filtered Data
  ========================== */
  const filteredLeaves = useMemo(() => {
    let data = [...leaves];

    if (search) {
      data = data.filter(
        (leave) =>
          leave.name.toLowerCase().includes(search.toLowerCase()) ||
          leave.leave_type.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter) {
      data = data.filter((leave) =>
        leave.status.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }

    return data;
  }, [leaves, search, statusFilter]);

  /* =========================
     Reset Filters
  ========================== */
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Leave Management
          </h1>
          <p className="text-gray-600 text-lg">Review and manage employee leave requests</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Controls Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col xl:flex-row justify-between gap-6 items-center">
            
            {/* Enhanced Search */}
            <div className="relative w-full lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by employee or leave type..."
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

            {/* Status Filter Buttons */}
            <div className="flex gap-3 flex-wrap items-center">
              {["Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  className={`group relative overflow-hidden px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 focus:ring-4 ${
                    status === "Approved"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:ring-green-300"
                      : status === "Rejected"
                      ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 focus:ring-red-300"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:ring-blue-300"
                  } ${statusFilter === status ? 'ring-4' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  <span className="relative z-10">{status}</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
              ))}

              {/* Reset Filters Button */}
              {(search || statusFilter) && (
                <button
                  className="group relative overflow-hidden px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 focus:ring-4 focus:ring-gray-300"
                  onClick={resetFilters}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Reset
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
              )}
            </div>

          </div>

          {/* Filter Summary */}
          {(search || statusFilter) && (
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
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("")} className="ml-1 hover:text-indigo-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enhanced DataTable Section — no outer padding so the table aligns with the card edges */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20 px-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading leave requests...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="mb-6 flex items-center justify-between px-8 pt-6">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredLeaves.length}</span> of <span className="font-semibold text-gray-900">{leaves.length}</span> leave requests
                </div>
                {filteredLeaves.length !== leaves.length && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <DataTable
                columns={columns}
                data={filteredLeaves}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No leave requests found</h3>
                    <p className="text-gray-400">
                      {search || statusFilter 
                        ? "Try adjusting your search or filter criteria" 
                        : "No leave requests available at the moment"
                      }
                    </p>
                  </div>
                }
                customStyles={leaveDataTableCustomStyles}
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default LeaveManage;
