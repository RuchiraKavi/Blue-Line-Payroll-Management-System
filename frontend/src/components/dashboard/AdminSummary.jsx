import React from 'react'
import SummaryCard from './SummaryCard'
import { FaBuilding, FaCheckCircle, FaFileAlt, FaHourglassHalf, FaMoneyBillWave, FaTimesCircle, FaUser } from 'react-icons/fa'

const AdminSummary = () => {
  return (
    <div className="px-6 py-4 font-poppins">

      {/* MAIN TITLE */}
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Dashboard Overview
      </h3>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <SummaryCard 
          icon={<FaUser className="text-3xl text-blue-400" />} 
          text="Total Employees" 
          number={44}
        />

        <SummaryCard 
          icon={<FaBuilding className="text-3xl text-blue-400" />} 
          text="Total Departments" 
          number={44}
        />

        <SummaryCard 
          icon={<FaMoneyBillWave className="text-3xl text-blue-400" />} 
          text="Monthly Salary" 
          number={44}
        />
      </div>


      {/* LEAVE SECTION */}
      <h3 className="text-xl text-center font-bold text-gray-900 mb-4">
        Leave Details
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 auto-rows-fr">
        <SummaryCard 
          icon={<FaFileAlt className="text-3xl text-blue-400" />} 
          text="Leave Applications" 
          number={44}
        />

        <SummaryCard 
          icon={<FaCheckCircle className="text-3xl text-blue-400" />} 
          text="Leave Approved" 
          number={44}
        />

        <SummaryCard 
          icon={<FaHourglassHalf className="text-3xl text-blue-400" />} 
          text="Leave Pending" 
          number={44}
        />

        <SummaryCard 
          icon={<FaTimesCircle className="text-3xl text-blue-400" />} 
          text="Leave Rejected" 
          number={44}
        />
      </div>

    </div>
  )
}

export default AdminSummary
