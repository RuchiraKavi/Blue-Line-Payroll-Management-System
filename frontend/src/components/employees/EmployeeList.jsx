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
    <div className="p-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="text-2xl font-bold">Manage Employees</h3>
      </div>

      {/* Search + Department Filter + Add */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">

        {/* Left side: Search + Filter */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">

          {/* Search */}
          <input
            type="text"
            placeholder="Search by Employee Name"
            className="px-4 py-2 border rounded w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Department Dropdown */}
          <div className="relative w-full md:w-64" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-2 border rounded bg-white text-left"
            >
              {selectedDepartments.length > 0
                ? selectedDepartments.join(", ")
                : "Filter by Departments"}
            </button>

            {isOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
                {departments.length === 0 ? (
                  <p className="px-4 py-2 text-gray-500">No departments</p>
                ) : (
                  departments.map((dep) => (
                    <label
                      key={dep._id}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dep.dep_name)}
                        onChange={() => toggleDepartment(dep.dep_name)}
                      />
                      <span>{dep.dep_name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right side: Add button */}
        <Link
          to="/admin-dashboard/add-employee"
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-indigo-700 transition whitespace-nowrap"
        >
          Add New Employee
        </Link>

      </div>

      {/* DataTable */}
      <DataTable
        columns={columns(fetchEmployees)}
        data={filteredEmployees}
        progressPending={loading}
        highlightOnHover
        responsive
        pagination
        striped
        noDataComponent="No employees found"
      />
    </div>
  );
};

export default EmployeeList;
