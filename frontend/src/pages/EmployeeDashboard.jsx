import React from 'react'
import { Outlet } from 'react-router-dom'
import EmployeeSidebar from '../components/dashboard/EmployeeSidebar'
import Navbar from '../components/dashboard/Navbar'

const EmployeeDashboard = () => {
  return (
        <div className="flex h-screen overflow-hidden">
      
      {/* SIDEBAR */}
      <EmployeeSidebar />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col bg-white">

        {/* FIXED NAVBAR */}
        <div className="fixed left-64 right-0 top-0 z-50">
          <Navbar />
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="mt-14 overflow-y-auto h-[calc(100vh-3.5rem)] p-6 bg-gray-100">
          <Outlet />
        </div>

      </div>
    </div>
  )
}

export default EmployeeDashboard