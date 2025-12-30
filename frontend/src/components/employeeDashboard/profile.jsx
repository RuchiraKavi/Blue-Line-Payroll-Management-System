import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Profile = () => {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/employees/me/profile",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (res.data.success) {
          setEmployee(res.data.employee);
        }
      } catch (error) {
        console.error(error);
        alert("Profile loading error");
      }
    };

    fetchProfile();
  }, []);

  if (!employee) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading profile...
      </div>
    );
  }

  return (
    <>
      {employee ? (
        <div className="p-6 bg-gray-50 min-h-screen flex flex-col md:flex-row justify-center items-start gap-8">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-16 text-white">
              <h2 className="text-3xl font-bold mb-1">
                {employee.userId?.name}
              </h2>
              <p className="text-sm opacity-80">{employee.designation}</p>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center -mt-36">
              <img
                src={`http://localhost:5000/uploads/${employee.userId?.profileImage}`}
                alt="Employee"
                className="w-56 h-56 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>

            <div className="p-6 space-y-6">

              {/* Personal Info */}
              <div>
                <h3 className="text-xl font-semibold border-b pb-2 mb-4">
                  Personal Info
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <p><b>Name:</b> {employee.userId?.name}</p>
                  <p><b>Email:</b> {employee.userId?.email}</p>
                  <p><b>NIC:</b> {employee.nic}</p>
                  <p><b>DOB:</b> {employee.dob?.slice(0, 10)}</p>
                  <p><b>Gender:</b> {employee.gender}</p>
                  <p><b>Marital Status:</b> {employee.marital_status}</p>
                </div>
              </div>

              {/* Job Info */}
              <div>
                <h3 className="text-xl font-semibold border-b pb-2 mb-4">
                  Job Info
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <p><b>Employee ID:</b> {employee.employee_id}</p>
                  <p><b>Designation:</b> {employee.designation}</p>
                  <p><b>Department:</b> {employee.department?.dep_name}</p>
                  <p><b>Joined Date:</b> {employee.joined_date?.slice(0, 10)}</p>
                  <p>
                    <b>Resigned Date:</b>{" "}
                    {employee.resigned_date
                      ? employee.resigned_date.slice(0, 10)
                      : "Still Working"}
                  </p>
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h3 className="text-xl font-semibold border-b pb-2 mb-4">
                  Compensation
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <p><b>Basic Salary:</b> Rs. {employee.basic_salary}.00</p>
                  <p>
                    <b>Role:</b>{" "}
                    <span className="px-2 py-1 bg-blue-100 rounded-full">
                      {employee.userId?.role}
                    </span>
                  </p>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-xl font-semibold border-b pb-2 mb-4">
                  Bank Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <p><b>Bank Name:</b> {employee.bank_details.bank_name}</p>
                  <p><b>Bank Branch:</b> {employee.bank_details.bank_branch}</p>
                  <p><b>Account Number:</b> {employee.bank_details.bank_account_number}</p>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <Link
                  to="/employee-dashboard/edit-profile"
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-indigo-700 transition"
                >
                  Edit Profile
                </Link>

                <Link
                  to="/employee-dashboard/change-password"
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-indigo-700 transition"
                >
                  Change Password
                </Link>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-screen text-red-500 font-semibold">
          Employee Loading Error...
        </div>
      )}
    </>
  );
};

export default Profile;
