import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Profile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
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
        } else {
          setError(res.data.message || "Failed to load profile");
        }
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            "Unable to load your profile. Please try again or contact HR."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading profile...
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex justify-center items-center min-h-screen p-6">
        <div className="max-w-md text-center rounded-2xl border border-red-200 bg-red-50 p-8">
          <p className="font-semibold text-red-700 mb-2">Profile could not be loaded</p>
          <p className="text-sm text-red-600">{error || "Employee record not found for your account."}</p>
        </div>
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
              <p className="text-sm opacity-80">
                {[employee.department?.dep_name, employee.designation].filter(Boolean).join(" · ")}
              </p>
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
                  <p><b>Mobile:</b> {employee.mobile_number || "—"}</p>
                  <p className="md:col-span-2"><b>Address:</b> {employee.address || "—"}</p>
                  <p><b>EPF Number:</b> {employee.epf_number || "—"}</p>
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
                  <p><b>Job Type:</b> {employee.job_type || "—"}</p>
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
                <div className="mt-4 border border-amber-200 rounded-lg p-4 bg-amber-50/50">
                  <h4 className="font-semibold text-amber-900 mb-2">Allowances</h4>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <p><b>Travel:</b> Rs. {(employee.travel_allowance ?? 0).toLocaleString()}</p>
                    <p><b>Food:</b> Rs. {(employee.food_allowance ?? 0).toLocaleString()}</p>
                    <p><b>Holiday:</b> Rs. {(employee.holiday_payment ?? 0).toLocaleString()}</p>
                    <p><b>Attendance Allowance:</b> Rs. {(employee.allowance_ns ?? 0).toLocaleString()}</p>
                    <p><b>Bonus:</b> Rs. {(employee.bonus ?? 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 border border-slate-300 rounded-lg p-4 bg-slate-50/60">
                  <h4 className="font-semibold text-slate-900 mb-2">Service Charges</h4>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <p><b>Stamp Duty:</b> Rs. {(employee.stamp_duty ?? 0).toLocaleString()}</p>
                    <p><b>Mobile Deduction:</b> Rs. {(employee.mobile_deduction ?? 0).toLocaleString()}</p>
                  </div>
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
