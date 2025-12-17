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
    <>
      {depLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-5">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Manage Departments</h3>
          </div>

          <div className="flex justify-between items-center">
            <input
              type="text"
              placeholder="Search By Dep Name"
              className="px-4 py-0.5 border rounded"
              onChange={filterDepartments}
            />

            <Link
              to="/admin-dashboard/add-department"
              className="px-4 py-1 bg-gray-800 text-white rounded"
            >
              Add New Department
            </Link>
          </div>

          <div>
            <DataTable
              className="mt-5"
              columns={columns(fetchDepartments)} // pass refresh method
              data={filteredDepartments}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DepartmentList;
