import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { columns } from "../../utils/LeaveHelper";

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
            leave_type: leave.leaveType,
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
    <div className="p-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="text-2xl font-bold">Manage Leaves</h3>
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4 items-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by employee or leave type"
          className="px-4 py-2 border rounded w-full md:w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Status Filter Buttons + Reset */}
        <div className="flex gap-3 flex-wrap">
          {["Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              className={`px-3 py-1 rounded-lg font-semibold text-white ${
                status === "Approved"
                  ? "bg-green-600"
                  : status === "Rejected"
                  ? "bg-red-600"
                  : "bg-blue-600"
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}

          {/* Reset Filters Button */}
          <button
            className="px-3 py-1 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600 transition"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredLeaves}
        progressPending={loading}
        highlightOnHover
        responsive
        pagination
        striped
        noDataComponent="No Leaves found"
      />
    </div>
  );
};

export default LeaveManage;
