import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PDFDownloadLink } from "@react-pdf/renderer";
import EmployeePDF from "./EmployeePDF";
import EmployeeIDCardPDF from "./EmployeeIDCardPDF";

const ViewEmployee = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/employees/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setEmployee(response.data.employee);
        }
      } catch (error) {
        console.error(error);
        alert("Employee Loading Error");
      }
    };

    fetchEmployee();
  }, [id]);

  return (
    <>
      {employee ? (
        <div className="p-6 bg-gray-50 min-h-screen flex flex-col md:flex-row justify-center items-start gap-8">
          {/* Employee Details */}
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

            {/* Details */}
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-xl font-semibold border-b pb-2 mb-4">
                  Personal Info
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <p><b>Name:</b> {employee.userId?.name}</p>
                  <p><b>Email:</b> {employee.userId?.email}</p>
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

              {/* Salary & Role */}
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

              {/* PDF Download for Details */}
              <div className="mt-6 flex justify-center">
                <PDFDownloadLink
                  document={<EmployeePDF employee={employee} />}
                  fileName={`${employee.employee_id}_details.pdf`}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {({ loading }) => (loading ? "Preparing PDF..." : "Get Employee Details")}
                </PDFDownloadLink>
              </div>
              {/* Employee ID Card Preview */}
              <div className="flex flex-col items-center gap-4">    
                <PDFDownloadLink
                  document={<EmployeeIDCardPDF employee={employee} />}
                  fileName={`${employee.employee_id}_idcard.pdf`}
                  className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  {({ loading }) => (loading ? "Preparing ID Card PDF..." : "Get Employee ID Card")}
                </PDFDownloadLink>
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

export default ViewEmployee;
